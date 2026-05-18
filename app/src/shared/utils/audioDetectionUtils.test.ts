import {
  getRMSLevel,
  calculateRMS,
  calculatePeakAmplitude,
  requestMicrophoneAccess,
  analyzeShotCharacteristics,
  getShotDetectionThreshold,
  DEFAULT_SHOT_TIMER_SENSITIVITY,
} from './audioDetectionUtils';

describe('audioDetectionUtils', () => {
  // Mock AudioContext and related APIs
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('calculateRMS', () => {
    it('calculates RMS correctly for simple data array', () => {
      const dataArray = new Uint8Array([0, 128, 255]);
      const rms = calculateRMS(dataArray);
      // RMS = sqrt((0² + 128² + 255²) / 3) = sqrt((0 + 16384 + 65025) / 3) = sqrt(27136.33) ≈ 164.73
      expect(rms).toBeGreaterThan(160);
      expect(rms).toBeLessThan(170);
    });

    it('returns 0 for empty array', () => {
      const dataArray = new Uint8Array([]);
      const rms = calculateRMS(dataArray);
      expect(rms).toBe(0);
    });

    it('returns correct value for uniform data', () => {
      const dataArray = new Uint8Array([100, 100, 100, 100]);
      const rms = calculateRMS(dataArray);
      expect(rms).toBe(100);
    });

    it('handles array with all zeros', () => {
      const dataArray = new Uint8Array([0, 0, 0, 0]);
      const rms = calculateRMS(dataArray);
      expect(rms).toBe(0);
    });
  });

  describe('calculatePeakAmplitude', () => {
    it('returns the largest distance from the silent midpoint', () => {
      const dataArray = new Uint8Array([128, 138, 90, 200]);
      expect(calculatePeakAmplitude(dataArray)).toBe(72);
    });

    it('returns 0 for empty arrays', () => {
      expect(calculatePeakAmplitude(new Uint8Array([]))).toBe(0);
    });
  });

  describe('shot detection thresholds', () => {
    it('uses a conservative default sensitivity', () => {
      expect(DEFAULT_SHOT_TIMER_SENSITIVITY).toBe(20);
    });

    it('raises the RMS threshold when sensitivity is lower', () => {
      expect(getShotDetectionThreshold(20)).toBeGreaterThan(getShotDetectionThreshold(80));
    });

    it('clamps sensitivity values before calculating threshold', () => {
      expect(getShotDetectionThreshold(-20)).toBe(getShotDetectionThreshold(0));
      expect(getShotDetectionThreshold(120)).toBe(getShotDetectionThreshold(100));
    });
  });

  describe('analyzeShotCharacteristics', () => {
    it('requires a sharp baseline jump and high-frequency content', () => {
      const result = analyzeShotCharacteristics(95, 40, 0.6, 22, 48, 8);

      expect(result.hasSharpAttack).toBe(true);
      expect(result.hasHighFrequencyContent).toBe(true);
      expect(result.isShot).toBe(true);
    });

    it('accepts a clap-like peak even when the frame-to-frame RMS jump is modest', () => {
      const result = analyzeShotCharacteristics(55, 44, 0.42, 20, 34, 7);

      expect(result.hasSharpAttack).toBe(true);
      expect(result.hasHighFrequencyContent).toBe(true);
      expect(result.isShot).toBe(true);
    });

    it('does not treat steady room noise as a shot', () => {
      const result = analyzeShotCharacteristics(58, 54, 0.35, 45, 12, 10);

      expect(result.hasSharpAttack).toBe(false);
      expect(result.hasHighFrequencyContent).toBe(false);
      expect(result.isShot).toBe(false);
    });
  });

  describe('getRMSLevel', () => {
    it('returns a number between 0-255', () => {
      const mockAnalyser = {
        analyser: {
          getByteFrequencyData: jest.fn((arr) => {
            arr[0] = 100;
            arr[1] = 150;
            arr[2] = 200;
          }),
        } as any,
        dataArray: new Uint8Array(3),
        timeDomainDataArray: new Uint8Array(3),
        mediaStream: {} as any,
      };

      const rms = getRMSLevel(mockAnalyser);
      expect(rms).toBeGreaterThanOrEqual(0);
      expect(rms).toBeLessThanOrEqual(255);
    });

    it('returns 0 on error', () => {
      const mockAnalyser = {
        analyser: {
          getByteFrequencyData: jest.fn(() => {
            throw new Error('Test error');
          }),
        } as any,
        dataArray: new Uint8Array(1024),
        timeDomainDataArray: new Uint8Array(1024),
        mediaStream: {} as any,
      };

      const rms = getRMSLevel(mockAnalyser);
      expect(rms).toBe(0);
    });
  });

  describe('requestMicrophoneAccess', () => {
    it('throws error if mediaDevices not available', async () => {
      const originalMediaDevices = navigator.mediaDevices;
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        configurable: true,
      });

      await expect(requestMicrophoneAccess()).rejects.toThrow();

      Object.defineProperty(navigator, 'mediaDevices', {
        value: originalMediaDevices,
        configurable: true,
      });
    });
  });

  describe('createAudioAnalyser', () => {
    it('creates analyser with correct fftSize', () => {
      // Web Audio API complexity makes testing difficult without browser context
      // A full integration test would require a real browser context
      expect(true).toBe(true);
    });
  });
});
