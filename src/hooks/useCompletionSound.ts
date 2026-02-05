import { useCallback, useRef, useEffect } from 'react';

// Create audio context for reliable playback
const createCompletionSound = (): AudioBuffer | null => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const duration = 0.15;
    const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Create a pleasant "ding" sound
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Two frequencies for a pleasant chord
      const freq1 = 880; // A5
      const freq2 = 1320; // E6
      const envelope = Math.exp(-t * 15); // Quick decay
      data[i] = envelope * 0.3 * (
        Math.sin(2 * Math.PI * freq1 * t) + 
        0.5 * Math.sin(2 * Math.PI * freq2 * t)
      );
    }
    
    return buffer;
  } catch (e) {
    return null;
  }
};

export const useCompletionSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    // Initialize on first user interaction
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        bufferRef.current = createCompletionSound();
      }
    };
    
    document.addEventListener('click', initAudio, { once: true });
    return () => document.removeEventListener('click', initAudio);
  }, []);

  const playCompletionSound = useCallback(() => {
    try {
      // Create context on demand if not exists
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      // Resume if suspended
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      // Create buffer if needed
      if (!bufferRef.current) {
        const sampleRate = ctx.sampleRate;
        const duration = 0.15;
        const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
          const t = i / sampleRate;
          const freq1 = 880;
          const freq2 = 1320;
          const envelope = Math.exp(-t * 15);
          data[i] = envelope * 0.3 * (
            Math.sin(2 * Math.PI * freq1 * t) + 
            0.5 * Math.sin(2 * Math.PI * freq2 * t)
          );
        }
        bufferRef.current = buffer;
      }
      
      const source = ctx.createBufferSource();
      source.buffer = bufferRef.current;
      
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.5;
      
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(0);
    } catch (e) {
      // Ignore audio errors silently
    }
  }, []);

  return { playCompletionSound };
};
