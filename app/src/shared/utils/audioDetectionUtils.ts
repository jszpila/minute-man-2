/**
 * Audio detection utilities for shot detection
 */

export interface AudioAnalyser {
  analyser: AnalyserNode;
  dataArray: any;
  mediaStream: MediaStream;
}

export interface NoiseProfile {
  baselineRMS: number;
  timestamp: number;
}

// Track beep playback to avoid feedback detection
let lastBeepPlayTime = 0;
const BEEP_IMMUNITY_WINDOW_MS = 350; // Ignore audio within this window after beep plays

/**
 * Mark that a beep has been played (called from beepUtils.ts)
 * This prevents the microphone from picking up the beep as a shot
 */
export const markBeepPlayed = (): void => {
  lastBeepPlayTime = Date.now();
};

/**
 * Request microphone access from the user
 */
export const requestMicrophoneAccess = async (): Promise<MediaStream> => {
  try {
    // Check if mediaDevices is available
    if (!navigator.mediaDevices) {
      throw new Error(
        'navigator.mediaDevices is not available. HTTPS required for microphone access.'
      );
    }

    if (!navigator.mediaDevices.getUserMedia) {
      throw new Error('getUserMedia is not available in this browser.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    return stream;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Microphone access error:', errorMsg, error);
    throw new Error(`Microphone access failed: ${errorMsg}`);
  }
};

/**
 * Create an audio analyser from a media stream
 */
let sharedAudioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (sharedAudioContext) {
    return sharedAudioContext;
  }

  try {
    const AudioContextClass = (window.AudioContext ||
      (window as any).webkitAudioContext) as typeof AudioContext;
    if (!AudioContextClass) {
      throw new Error('AudioContext not supported in this browser');
    }
    sharedAudioContext = new AudioContextClass();
    return sharedAudioContext;
  } catch (error) {
    console.error('Failed to create AudioContext:', error);
    throw new Error(`AudioContext initialization failed: ${error}`);
  }
};

export const createAudioAnalyser = (
  mediaStream: MediaStream,
  fftSize: number = 2048
): AudioAnalyser => {
  try {
    const audioContext = getAudioContext();

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = fftSize;

    // Create source from media stream - try both naming conventions
    let source: MediaStreamAudioSourceNode;
    try {
      // Try the standard name first
      source = (audioContext as any).createMediaStreamAudioSource(mediaStream);
    } catch (e1) {
      try {
        // Fallback to webkit naming
        source = (audioContext as any).createMediaStreamSource(mediaStream);
      } catch (e2) {
        console.error('Both methods failed:', e1, e2);
        throw new Error('Unable to create media stream source');
      }
    }

    // CRITICAL: Connect source -> analyser -> destination
    // The analyser must be connected to destination to process audio
    source.connect(analyser);

    analyser.connect(audioContext.destination);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    return { analyser, dataArray, mediaStream };
  } catch (error) {
    console.error('Error creating audio analyser:', error);
    throw error;
  }
};

/**
 * Calculate RMS (root mean square) amplitude from frequency data
 * Returns value 0-255 representing loudness
 */
export const calculateRMS = (dataArray: any): number => {
  if (dataArray.length === 0) {
    return 0;
  }
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const value = dataArray[i];
    sum += value * value;
  }
  const rms = Math.sqrt(sum / dataArray.length);
  return rms;
};

/**
 * Calculate high-frequency content (indicates sharp attacks like shots/claps)
 * Gunshots and claps have significant energy in higher frequencies
 * Returns 0-255 representing high-frequency amplitude
 */
export const calculateHighFrequencyContent = (dataArray: Uint8Array): number => {
  if (dataArray.length === 0) {
    return 0;
  }

  // Focus on the upper 40% of frequency bins (higher frequencies)
  // where shots/claps have more distinctive signatures
  const startBin = Math.floor(dataArray.length * 0.6);
  const endBin = dataArray.length;

  let sum = 0;
  for (let i = startBin; i < endBin; i++) {
    const value = dataArray[i];
    sum += value * value;
  }

  const highFreqRMS = Math.sqrt(sum / (endBin - startBin));
  return highFreqRMS;
};

/**
 * Calculate frequency ratio: high-frequency to total energy
 * Speech has more low-frequency content, shots/claps have more high-frequency
 * Returns 0-1 ratio (higher = more likely a shot/clap)
 */
export const getFrequencyRatio = (dataArray: Uint8Array): number => {
  const totalRMS = calculateRMS(dataArray);
  const highFreqRMS = calculateHighFrequencyContent(dataArray);

  if (totalRMS === 0) return 0;
  return highFreqRMS / totalRMS;
};

/**
 * Detect characteristics of a gunshot/clap:
 * - Sharp attack (rapid amplitude increase)
 * - Higher frequency content than speech
 * - Peak within a short window
 */
interface ShotCharacteristics {
  hasSharpAttack: boolean;
  hasHighFrequencyContent: boolean;
  isShot: boolean;
  confidence: number; // 0-1
}

export const analyzeShotCharacteristics = (
  currentRMS: number,
  lastRMS: number,
  highFreqRatio: number,
  baselineRMS: number
): ShotCharacteristics => {
  // Sharp attack: RMS increases by at least 30 points in one frame (more stringent)
  // Requires very rapid onset characteristic of shots/claps
  const rmsIncrease = currentRMS - lastRMS;
  const hasSharpAttack = rmsIncrease > 30 || (rmsIncrease > 20 && currentRMS > baselineRMS * 2.5);

  // High-frequency content: ratio > 0.42 indicates strong high-freq signature
  // More conservative than speech threshold to filter out noise
  const hasHighFrequencyContent = highFreqRatio > 0.42;

  // Combine both characteristics for better confidence
  const isShot = hasSharpAttack && hasHighFrequencyContent;
  const confidence = (hasSharpAttack ? 0.5 : 0) + (hasHighFrequencyContent ? 0.5 : 0);

  return {
    hasSharpAttack,
    hasHighFrequencyContent,
    isShot,
    confidence,
  };
};

/**
 * Apply simple noise gate: ignore audio below a certain amplitude
 * Helps filter out room noise and low-level background sound
 */
export const applyNoiseGate = (rms: number, threshold: number): boolean => {
  return rms > threshold;
};

/**
 * Detect a shot based on amplitude threshold
 * Sensitivity: 0-100 (higher = more sensitive)
 * Returns a promise that resolves when shot is detected
 */
export const detectShot = (
  analyser: AudioAnalyser,
  sensitivity: number = 50,
  debounceMs: number = 250
): Promise<void> => {
  return new Promise((resolve) => {
    // Convert sensitivity (0-100) to threshold (20-80)
    // More sensitive = lower threshold
    const threshold = 20 + (100 - sensitivity) * 0.6;

    let lastDetectionTime = 0;
    let lastRMS = 0;

    const checkAmplitude = () => {
      analyser.analyser.getByteFrequencyData(analyser.dataArray);
      const rms = calculateRMS(analyser.dataArray);

      // Detect sudden loud spike (shot/clap characteristic)
      // Look for rapid increase in amplitude
      const spike = rms - lastRMS > 15 && rms > threshold;

      const now = Date.now();
      const isDetected = rms > threshold && now - lastDetectionTime > debounceMs;

      if ((isDetected || spike) && now - lastDetectionTime > debounceMs) {
        lastDetectionTime = now;
        resolve();
        return;
      }

      lastRMS = rms;

      // Continue checking
      requestAnimationFrame(checkAmplitude);
    };

    checkAmplitude();
  });
};

/**
 * Stop listening - clean up microphone stream
 */
export const stopListening = (mediaStream: MediaStream): void => {
  mediaStream.getTracks().forEach((track) => {
    track.stop();
  });
};

/**
 * Get current RMS level (for visualization)
 */
export const getRMSLevel = (analyser: AudioAnalyser): number => {
  try {
    analyser.analyser.getByteFrequencyData(analyser.dataArray);
    const rms = calculateRMS(analyser.dataArray);
    return rms;
  } catch (error) {
    console.error('Error in getRMSLevel:', error);
    return 0;
  }
};
