import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import AnimatedButton from '../components/AnimatedButton';
import AuthModal from '../components/AuthModal';
import FloatingDoodles from '../components/FloatingDoodles';
import NotebookBackground from '../components/NotebookBackground';
import { Spacing } from '../theme/spacing';

import { useRouter } from 'expo-router';
import { useUserStore } from '../store/useUserStore';
import Logo from '../../assets/logo/Group 7.svg';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';


const HomeScreen = () => {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const session = useUserStore((s) => s.session);

  const handleOnlinePress = () => {
    if (session && session.uid) {
      router.replace('/lobby');
      return;
    }

    setShowAuth(true);
  };

  return (
    <NotebookBackground>
      <FloatingDoodles />
      <View style={styles.centre}>
        <Animated.View
          entering={ZoomIn.duration(600).springify().damping(12).stiffness(100)}
          style={styles.logoBlock}
        >
          <Logo
            width={240}
            height={240}
          />
          <Text style={styles.titleText}>Quick Draw!</Text>
          <Text style={styles.subtitleText}>Thử tài hoạ sĩ tí hon</Text>
        </Animated.View>

        {/* Buttons */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500).springify().damping(14)}
          style={styles.buttonStack}
        >
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
    gap: Spacing.xxxl,
  },
  logoBlock: {
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.md,
  },
  logoImage: {
    width: 240,
    height: 240,
  },
  buttonStack: {
    width: '100%',
    gap: Spacing.md,
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
