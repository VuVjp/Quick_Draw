import React, { useState } from 'react';
import { Dimensions, Image, StyleSheet, View, Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useEntranceAnimation, useFloatAnimation } from '../animations/useAnimations';
import AuthModal from '../components/AuthModal';
import FloatingDoodles from '../components/FloatingDoodles';
import NotebookBackground from '../components/NotebookBackground';
import { Spacing, Radius } from '../theme/spacing';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useGameStore } from '../store/useGameStore';
import { useHaptics } from '../hooks/useHaptics';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const startSinglePlayer = useGameStore((s) => s.startSinglePlayer);
  const { light } = useHaptics();

  // Entrance animations
  const { opacity: titleOpacity, scale: titleScale } = useEntranceAnimation(100);
  const { opacity: btnOpacity } = useEntranceAnimation(400);

  // Logo floating animation
  const logoFloat = useFloatAnimation(8, 2200);

  // Button pressed states
  const scaleSingle = useSharedValue(1);
  const scaleOnline = useSharedValue(1);

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

  const logoStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [
      { scale: titleScale.value },
      { translateY: logoFloat.value },
    ],
  }));

  const btnContainerStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
  }));

  const singleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scaleSingle.value },
      { rotate: '-1.5deg' },
    ],
  }));

  const onlineStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scaleOnline.value },
      { rotate: '1.5deg' },
    ],
  }));

  return (
    <NotebookBackground>
      <FloatingDoodles />
      <View style={styles.centre}>
        {/* Title & Floating Logo */}
        <Animated.View style={[styles.logoBlock, logoStyle]}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.titleText}>Quick Draw!</Text>
          <Text style={styles.subtitleText}>Thử tài hoạ sĩ tí hon</Text>
        </Animated.View>

        {/* Buttons Stack */}
        <Animated.View style={[styles.buttonStack, btnContainerStyle]}>
          {/* Chơi Đơn Button */}
          <Animated.View style={singleStyle}>
            <Pressable
              onPressIn={() => {
                scaleSingle.value = withSpring(0.95, { damping: 10 });
              }}
              onPressOut={() => {
                scaleSingle.value = withSpring(1, { damping: 10 });
              }}
              onPress={() => {
                light();
                startSinglePlayer();
                router.push('/drawing');
              }}
              style={[styles.premiumBtn, { backgroundColor: Colors.primaryYellow }]}
            >
              <View style={styles.btnIconContainer}>
                <Text style={styles.btnEmoji}>🧑‍🎨</Text>
              </View>
              <View style={styles.btnTextContent}>
                <Text style={styles.btnTitle}>CHƠI ĐƠN</Text>
                <Text style={styles.btnSubtitle}>Thử tài vẽ nhanh cùng AI thông minh</Text>
              </View>
            </Pressable>
          </Animated.View>

          {/* Chơi Online Button */}
          <Animated.View style={onlineStyle}>
            <Pressable
              onPressIn={() => {
                scaleOnline.value = withSpring(0.95, { damping: 10 });
              }}
              onPressOut={() => {
                scaleOnline.value = withSpring(1, { damping: 10 });
              }}
              onPress={() => {
                light();
                handleOnlinePress();
              }}
              style={[styles.premiumBtn, { backgroundColor: Colors.pastelRed }]}
            >
              <View style={[styles.btnIconContainer, { backgroundColor: Colors.paperWhite }]}>
                <Text style={styles.btnEmoji}>🌐</Text>
              </View>
              <View style={styles.btnTextContent}>
                <Text style={[styles.btnTitle, { color: Colors.paperWhite }]}>CHƠI ONLINE</Text>
                <Text style={[styles.btnSubtitle, { color: 'rgba(254, 251, 240, 0.9)' }]}>
                  Thách đấu vẽ tranh thời gian thực cùng bạn bè
                </Text>
              </View>
            </Pressable>
          </Animated.View>
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
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xxl,
  },
  logoBlock: {
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.md,
  },
  logoImage: {
    width: 250,
    height: 250,
  },
  buttonStack: {
    width: '100%',
    gap: Spacing.lg,
  },
  premiumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md + 4,
    borderRadius: Radius.lg,
    borderWidth: 2.5,
    borderColor: Colors.border,
    gap: Spacing.md,
    // Premium hand-drawn solid shadow
    shadowColor: Colors.warmBlack,
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  btnIconContainer: {
    width: 54,
    height: 54,
    borderRadius: Radius.md,
    backgroundColor: Colors.paperWhite,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnEmoji: {
    fontSize: FontSize.xl,
  },
  btnTextContent: {
    flex: 1,
    gap: 2,
  },
  btnTitle: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg + 2,
    color: Colors.warmBlack,
    letterSpacing: 0.8,
  },
  btnSubtitle: {
    fontFamily: FontFamily.caveat,
    fontSize: FontSize.sm + 2,
    color: Colors.warmBlack,
    opacity: 0.85,
    lineHeight: 18,
  },
  titleText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.hero,
    color: Colors.warmBlack,
    marginTop: -Spacing.md, // Xích xuống 1 chút (thay vì -Spacing.lg)
  },
  subtitleText: {
    fontFamily: FontFamily.patrickHand, // Đổi sang PatrickHand vì Caveat bị lỗi tiếng Việt
    fontSize: FontSize.xl,
    color: Colors.border,
    marginTop: 0,
  },
});

