/**
 * Audio detection utilities for shot detection
 */

export interface AudioAnalyser {
  analyser: AnalyserNode;
  dataArray: any;
  timeDomainDataArray: Uint8Array<ArrayBuffer>;
  mediaStream: MediaStream;
}

export interface NoiseProfile {
  baselineRMS: number;
  timestamp: number;
}

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
        echoCancellation: true,
        noiseSuppression: true,
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

    // Feed the microphone into the analyser without monitoring it through speakers.
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDomainDataArray = new Uint8Array(bufferLength);

    return { analyser, dataArray, timeDomainDataArray, mediaStream };
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
 * Calculate peak amplitude from time-domain data.
 * Returns value 0-128 where 0 is silence and 128 is full-scale.
 */
export const calculatePeakAmplitude = (dataArray: Uint8Array<ArrayBuffer>): number => {
  if (dataArray.length === 0) {
    return 0;
  }

  let peak = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const amplitude = Math.abs(dataArray[i] - 128);
    if (amplitude > peak) {
      peak = amplitude;
    }
  }

  return peak;
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
  baselineRMS: number,
  peakAmplitude: number = 0,
  baselinePeak: number = 0
): ShotCharacteristics => {
  // Sharp attack: require a sudden jump over both the previous frame and room baseline.
  const rmsIncrease = currentRMS - lastRMS;
  const hasRmsAttack =
    rmsIncrease > 28 || (rmsIncrease > 16 && currentRMS > Math.max(48, baselineRMS * 2.25));
  const hasPeakAttack =
    peakAmplitude > Math.max(24, baselinePeak * 2.4) &&
    currentRMS > Math.max(42, baselineRMS * 1.8);
  const hasSharpAttack = hasRmsAttack || hasPeakAttack;

  // High-frequency content: claps and snaps can vary by device, so keep this
  // below speech-filter territory and rely on peak/threshold checks too.
  const hasHighFrequencyContent = highFreqRatio > 0.36;

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

export const DEFAULT_SHOT_TIMER_SENSITIVITY = 20;

/**
 * Convert the 0-100 sensitivity control into an RMS threshold.
 * Higher sensitivity lowers the threshold. The default is intentionally
 * conservative because ambient room noise can otherwise trigger splits.
 */
export const getShotDetectionThreshold = (sensitivity: number): number => {
  const normalizedSensitivity = Math.min(100, Math.max(0, sensitivity));
  return 35 + (100 - normalizedSensitivity) * 0.55;
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
    const threshold = getShotDetectionThreshold(sensitivity);

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
