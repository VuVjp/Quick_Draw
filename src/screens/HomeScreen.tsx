import React, { useState } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useEntranceAnimation } from '../animations/useAnimations';
import AnimatedButton from '../components/AnimatedButton';
import AuthModal from '../components/AuthModal';
import FloatingDoodles from '../components/FloatingDoodles';
import NotebookBackground from '../components/NotebookBackground';
import { Spacing } from '../theme/spacing';

import { useRouter } from 'expo-router';
import { useGameStore } from '../store/useGameStore';

const { width, height } = Dimensions.get('window');

const HomeScreen = () => {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const startSinglePlayer = useGameStore((s) => s.startSinglePlayer);
  const { opacity: titleOpacity, scale: titleScale } = useEntranceAnimation(100);
  const { opacity: btnOpacity } = useEntranceAnimation(400);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));

  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
  }));

  return (
    <NotebookBackground>
      <FloatingDoodles />
      <View style={styles.centre}>
        {/* Title & Logo */}
        <Animated.View style={[styles.logoBlock, titleStyle]}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={[styles.buttonStack, btnStyle]}>
          <AnimatedButton
            label="Chơi Đơn 🧑"
            onPress={() => {
              startSinglePlayer();
              router.push('/Drawing');
            }}
            variant="primary"
            fullWidth
          />
          <AnimatedButton
            label="Chơi Online 🌐"
            onPress={() => setShowAuth(true)}
            variant="primary"
            fullWidth
          />
        </Animated.View>
      </View>

      <AuthModal
        visible={showAuth}
        onClose={() => setShowAuth(false)}
      />
    </NotebookBackground>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.xxxl * 1.5,
  },
  logoBlock: {
    alignItems: 'center',
    width: '100%',
  },
  logoImage: {
    width: 240,
    height: 240,
  },
  buttonStack: {
    width: '100%',
    gap: Spacing.md,
  },
});
