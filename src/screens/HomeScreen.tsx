import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Image } from 'react-native';
import Animated, {
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing } from '../theme/spacing';
import AnimatedButton from '../components/AnimatedButton';
import NotebookBackground from '../components/NotebookBackground';
import FloatingDoodles from '../components/FloatingDoodles';
import AuthModal from '../components/AuthModal';
import { useEntranceAnimation } from '../animations/useAnimations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useGameStore } from '../store/useGameStore';
import Logo from '../../assets/logo/Group 7.svg';

const { width, height } = Dimensions.get('window');

const HomeScreen = () => {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const startSinglePlayer = useGameStore((s) => s.startSinglePlayer);
  const { opacity: titleOpacity, scale: titleScale } = useEntranceAnimation(100);
  const { opacity: btnOpacity } = useEntranceAnimation(400);

  const handleOnlinePress = async () => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      if (token) {
        // Tự động đăng nhập nếu đã có token
        router.push('/lobby');
      } else {
        setShowAuth(true);
      }
    } catch (e) {
      console.error('Lỗi khi đọc token từ AsyncStorage', e);
      setShowAuth(true);
    }
  };

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
          <Logo width={240} height={240} style={styles.logoImage} />
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={[styles.buttonStack, btnStyle]}>
          <AnimatedButton
            label="Chơi Đơn"
            onPress={() => {
              router.push('/single-player-config');
            }}
            variant="primary"
            fullWidth
          />
          <AnimatedButton
            label="Chơi Online"
            onPress={handleOnlinePress}
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
