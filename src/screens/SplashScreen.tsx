import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import SpiralBinder from '../components/SpiralBinder';
import FloatingDoodles from '../components/FloatingDoodles';

const { width } = Dimensions.get('window');

import { useRouter } from 'expo-router';

const TITLE = "Quick Draw!";
const CHARS = TITLE.split("");

const SplashScreen = () => {
  const router = useRouter();
  const progress = useSharedValue(0);
  const pencilX = useSharedValue(-width * 0.4);
  const pencilY = useSharedValue(0);
  const pencilRotate = useSharedValue(-15);
  const containerOpacity = useSharedValue(1);
  const containerScale = useSharedValue(1);

  // Wobble effect for when drawing is done
  const logoWobble = useSharedValue(0);

  useEffect(() => {
    // Start drawing animation with a slight delay
    // No more background fading to prevent flashing
    const timer = setTimeout(() => {
      pencilX.value = withTiming(width * 0.35, { duration: 1800 }, (finished) => {
        if (finished) {
          logoWobble.value = withSequence(
            withTiming(1, { duration: 150 }),
            withTiming(-1, { duration: 150 }),
            withTiming(0, { duration: 150 })
          );

          setTimeout(() => {
            containerOpacity.value = withTiming(0, { duration: 400 });
            containerScale.value = withTiming(1.05, { duration: 400 }, (ok) => {
              if (ok) runOnJS(router.replace)('/home');
            });
          }, 800);
        }
      });

      progress.value = withTiming(1, { duration: 1800 });

      pencilY.value = withSequence(
        withTiming(-12, { duration: 300 }),
        withTiming(0, { duration: 300 }),
        withTiming(-8, { duration: 300 }),
        withTiming(0, { duration: 300 }),
        withTiming(-4, { duration: 300 }),
        withTiming(0, { duration: 300 })
      );

      pencilRotate.value = withTiming(20, { duration: 1800 });
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  const pencilStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pencilX.value },
      { translateY: pencilY.value },
      { rotate: `${pencilRotate.value}deg` },
    ],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${logoWobble.value * 2}deg` },
      { scale: 1 + Math.abs(logoWobble.value) * 0.05 }
    ],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Static Background elements to prevent flashing */}
      <View style={styles.paperBase}>
        {Array.from({ length: 22 }).map((_, i) => (
          <View key={i} style={[styles.paperLine, { top: 40 + i * 42 }]} />
        ))}
        <View style={styles.redLine} />
      </View>

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <SpiralBinder />
      </View>

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <FloatingDoodles />
      </View>

      {/* Title with sequential appearance */}
      <Animated.View style={[styles.logoWrapper, logoStyle]}>
        <View style={styles.charContainer}>
          {CHARS.map((char, index) => {
            const charOpacity = useDerivedValue(() => {
              const threshold = index / CHARS.length;
              return progress.value > threshold ? 1 : 0;
            });
            const charScale = useDerivedValue(() => {
              const threshold = index / CHARS.length;
              return progress.value > threshold ? withSpring(1) : 0.4;
            });

            const charStyle = useAnimatedStyle(() => ({
              opacity: charOpacity.value,
              transform: [{ scale: charScale.value }],
            }));

            return (
              <Animated.Text key={index} style={[styles.logoTitle, charStyle]}>
                {char === " " ? "\u00A0" : char}
              </Animated.Text>
            );
          })}
        </View>

        {/* Animated Pencil */}
        <Animated.View style={[styles.pencilContainer, pencilStyle]}>
          <Text style={styles.pencilEmoji}>✏️</Text>
        </Animated.View>
      </Animated.View>

      <Animated.Text style={[styles.tagline, { opacity: progress }]}>
        From Doodles to Victory
      </Animated.Text>

      {/* Decorative dots at bottom */}
      <View style={styles.footer}>
        {['🟡', '🔵', '🔴'].map((dot, i) => (
          <Text key={i} style={styles.dot}>{dot}</Text>
        ))}
      </View>
    </Animated.View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.notebookWhite,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  paperBase: {
    ...StyleSheet.absoluteFillObject,
  },
  paperLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.softBlue,
    opacity: 0.25,
  },
  redLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 55,
    width: 2,
    backgroundColor: Colors.pastelRed,
    opacity: 0.25,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    height: 120,
    width: '100%',
  },
  charContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoTitle: {
    fontFamily: FontFamily.indieFlower,
    fontSize: FontSize.hero,
    color: Colors.warmBlack,
  },
  pencilContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  pencilEmoji: {
    fontSize: 48,
  },
  tagline: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.xl,
    color: Colors.warmBlack,
    opacity: 0.7,
    marginTop: 24,
    letterSpacing: 2,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    position: 'absolute',
    bottom: 60,
  },
  dot: {
    fontSize: 16,
  },
});



