import { useEffect } from 'react';
import {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

/** Looping vertical float for decorative elements */
export const useFloatAnimation = (amplitude = 10, duration = 2000) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-amplitude, { duration }),
        withTiming(amplitude, { duration }),
      ),
      -1,
      true,
    );
  }, []);

  return translateY;
};

/** Left-right shake (lose screen, error) */
export const useShakeAnimation = () => {
  const translateX = useSharedValue(0);

  const shake = () => {
    translateX.value = withSequence(
      withTiming(-12, { duration: 60 }),
      withTiming(12, { duration: 60 }),
      withTiming(-10, { duration: 60 }),
      withTiming(10, { duration: 60 }),
      withTiming(-6, { duration: 60 }),
      withTiming(6, { duration: 60 }),
      withSpring(0),
    );
  };

  return { translateX, shake };
};

/** Fade + scale entrance */
export const useEntranceAnimation = (delay = 0) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 400 });
      scale.value = withSpring(1, { damping: 14, stiffness: 120 });
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  return { opacity, scale };
};

/** Count-up for numbers */
export const useCountUp = (target: number, duration = 1200) => {
  const value = useSharedValue(0);

  useEffect(() => {
    value.value = withTiming(target, { duration });
  }, [target]);

  return value;
};
