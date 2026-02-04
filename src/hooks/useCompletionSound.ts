import { useCallback, useRef } from 'react';

// A cheerful completion sound encoded as base64
const COMPLETION_SOUND_BASE64 = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAA4T/////////AAAAAAAAAAAAAAAAAAAAAP/7kGQAAAAAANIAAAAAExBRgAAADSAAAA38HvK4YAACHgAAAV+qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr//tSZAUAAADSAAAAAATEFGAAAANIAAAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uSZAcAAADSAAAAAATEFGAAAANIAAAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//tSZA4AAADSAAAAAATEFGAAAANIAAAABMQUU/8AAAANIAAAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';

export const useCompletionSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playCompletionSound = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(COMPLETION_SOUND_BASE64);
        audioRef.current.volume = 0.5;
      }
      
      // Reset and play
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Ignore autoplay errors - user may not have interacted yet
      });
    } catch (e) {
      // Ignore audio errors
    }
  }, []);

  return { playCompletionSound };
};
