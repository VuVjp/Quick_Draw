import { useEffect, useRef } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';
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
    progress.value = withTiming(Math.max(0, timeLeft) / 80, { duration: 500 });
  }, [timeLeft]);

  useEffect(() => {
    if (phase !== 'drawing') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    if (timeRef.current <= 0) {
      setTimeLeft(0);
      onExpire?.();
      return;
    }

    intervalRef.current = setInterval(() => {
      const next = Math.max(0, timeRef.current - 1);
      timeRef.current = next;
      setTimeLeft(next);
      onTick?.(next);

      if (next <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        onExpire?.();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [phase]);

  return { progress };
};
