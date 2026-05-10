import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  runOnJS,
} from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const SplashScreen = ({ navigation }: Props) => {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.6);
  const pencilRotate = useSharedValue(-30);
  const pencilTranslateX = useSharedValue(-80);
  const pencilOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const dotScale = useSharedValue(1);

  useEffect(() => {
    // Logo entrance
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });

    // Pencil draw animation
    setTimeout(() => {
      pencilOpacity.value = withTiming(1, { duration: 300 });
      pencilTranslateX.value = withTiming(80, { duration: 900 });
      pencilRotate.value = withTiming(15, { duration: 900 });
    }, 400);

    // Tagline fade in
    setTimeout(() => {
      taglineOpacity.value = withTiming(1, { duration: 500 });
    }, 900);

    // Loading dots pulse
    dotScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 400 }),
        withTiming(0.9, { duration: 400 }),
      ),
      -1,
      true,
    );

    // Navigate to Home
    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const pencilStyle = useAnimatedStyle(() => ({
    opacity: pencilOpacity.value,
    transform: [
      { translateX: pencilTranslateX.value },
      { rotate: `${pencilRotate.value}deg` },
    ],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Paper texture lines */}
      {Array.from({ length: 18 }).map((_, i) => (
        <View
          key={i}
          style={[styles.paperLine, { top: 60 + i * 44 }]}
        />
      ))}
      <View style={styles.redLine} />

      {/* Logo block */}
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Text style={styles.logoEmoji}>🎨</Text>
        <Text style={styles.logoTitle}>Quick Draw!</Text>
        <Animated.Text style={[styles.pencilAnim, pencilStyle]}>✏️</Animated.Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, taglineStyle]}>
        Draw • Guess • Win
      </Animated.Text>

      {/* Loading dots */}
      <Animated.View style={[styles.dots, dotStyle]}>
        {['🟡', '🔵', '🔴'].map((dot, i) => (
          <Text key={i} style={styles.dot}>{dot}</Text>
        ))}
      </Animated.View>
    </View>
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
  paperLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.softBlue,
    opacity: 0.35,
  },
  redLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 64,
    width: 2,
    backgroundColor: Colors.pastelRed,
    opacity: 0.4,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  logoEmoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  logoTitle: {
    fontFamily: FontFamily.indieFlower,
    fontSize: FontSize.hero,
    color: Colors.warmBlack,
    textAlign: 'center',
    letterSpacing: 2,
  },
  pencilAnim: {
    fontSize: 40,
    position: 'absolute',
    bottom: -20,
  },
  tagline: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.xl,
    color: Colors.warmBlack,
    opacity: 0.7,
    letterSpacing: 4,
    marginBottom: 60,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    position: 'absolute',
    bottom: 80,
  },
  dot: {
    fontSize: 18,
  },
});
