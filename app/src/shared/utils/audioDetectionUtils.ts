/**
 * Audio detection utilities for shot detection
 */

export interface AudioAnalyser {
  analyser: AnalyserNode;
  dataArray: any;
  mediaStream: MediaStream;
}

/**
 * Request microphone access from the user
 */
export const requestMicrophoneAccess = async (): Promise<MediaStream> => {
  try {
    // Check if mediaDevices is available
    if (!navigator.mediaDevices) {
      throw new Error('navigator.mediaDevices is not available. HTTPS required for microphone access.');
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
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
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
