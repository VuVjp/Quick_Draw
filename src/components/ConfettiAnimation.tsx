import React, { useEffect, useRef } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../theme/colors';

type Particle = {
  id: number;
  x: number;
  color: string;
};

const CONFETTI_COLORS = [
  Colors.primaryYellow,
  Colors.softBlue,
  Colors.pastelRed,
  Colors.lightPink,
  Colors.successGreen,
  Colors.goldAccent,
];

const PARTICLE_COUNT = 28;

const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
}));

const ConfettiParticle = ({ particle, height }: { particle: Particle; height: number }) => {
  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0.5 + Math.random() * 0.8);

  useEffect(() => {
    const delay = Math.random() * 600;
    const duration = 1200 + Math.random() * 800;
    setTimeout(() => {
      translateY.value = withTiming(height + 40, { duration });
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: duration - 200 }),
      );
      rotate.value = withRepeat(withTiming(360, { duration: 500 }), -1, false);
    }, delay);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        style,
        {
          left: `${particle.x}%` as any,
          backgroundColor: particle.color,
          width: 8 + Math.random() * 6,
          height: 8 + Math.random() * 6,
          borderRadius: Math.random() > 0.5 ? 4 : 2,
        },
      ]}
    />
  );
};

type Props = { height: number };

const ConfettiAnimation = ({ height }: Props) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {particles.map((p) => (
      <ConfettiParticle key={p.id} particle={p} height={height} />
    ))}
  </View>
);

export default React.memo(ConfettiAnimation);

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
    borderWidth: 1,
    borderColor: Colors.border,
    opacity: 0.9,
  },
});
