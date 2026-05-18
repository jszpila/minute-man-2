/**
 * Plays a beep sound using Web Audio API
 * Loads and plays the pre-recorded beep.mp3 file
 */

import { markBeepPlayed } from './audioDetectionUtils';

let audioContext: AudioContext | null = null;
let beepBuffer: AudioBuffer | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

const loadBeepBuffer = async (): Promise<AudioBuffer> => {
  if (beepBuffer) {
    return beepBuffer;
  }

  try {
    const response = await fetch('/sounds/beep.mp3');
    const arrayBuffer = await response.arrayBuffer();
    const ctx = getAudioContext();
    beepBuffer = await ctx.decodeAudioData(arrayBuffer);
    return beepBuffer;
  } catch (error) {
    console.error('Failed to load beep sound:', error);
    throw error;
  }
};

export const playBeep = async (): Promise<void> => {
  try {
    const buffer = await loadBeepBuffer();
    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(ctx.currentTime);

    // Mark that beep was played so audio detection ignores it
    markBeepPlayed();
  } catch (error) {
    console.error('Failed to play beep:', error);
  }
};
