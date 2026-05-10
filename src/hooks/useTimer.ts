import { useEffect, useRef } from 'react';
import { useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
import { useGameStore } from '../store/useGameStore';

export const useTimer = (onTick?: (t: number) => void, onExpire?: () => void) => {
  const timeLeft = useGameStore((s) => s.timeLeft);
  const setTimeLeft = useGameStore((s) => s.setTimeLeft);
  const phase = useGameStore((s) => s.phase);

  const progress = useSharedValue(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeRef = useRef(timeLeft);

  useEffect(() => {
    timeRef.current = timeLeft;
    progress.value = withTiming(timeLeft / 80, { duration: 500 });
  }, [timeLeft]);

  useEffect(() => {
    if (phase !== 'drawing') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const next = timeRef.current - 1;
      timeRef.current = next;
      setTimeLeft(next);
      onTick?.(next);

      if (next <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        onExpire?.();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase]);

  return { progress };
};
