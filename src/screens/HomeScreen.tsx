import React, { useState } from 'react';
import { Dimensions, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import AnimatedButton from '../components/AnimatedButton';
import AuthModal from '../components/AuthModal';
import FloatingDoodles from '../components/FloatingDoodles';
import NotebookBackground from '../components/NotebookBackground';
import SettingsModal from '../components/SettingsModal';
import { Spacing, Radius, Shadow } from '../theme/spacing';

import { useRouter } from 'expo-router';
import { playClick } from '../store/useAudioStore';
import { useUserStore } from '../store/useUserStore';
import Logo from '../../assets/logo/Group 7.svg';
import CogIcon from '../../assets/Icon/cog.svg';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { useGameStore } from '../store/useGameStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const HomeScreen = () => {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const session = useUserStore((s) => s.session);
  const [showSettings, setShowSettings] = useState(false);


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

      {/* Settings Button - wrapped safely */}
      <SafeAreaView style={styles.settingsWrapper} edges={['top', 'right']}>
        <TouchableOpacity
          style={styles.settingsBtn}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          onPress={() => {
            //console.log('Settings button tapped!');
            playClick();
            setShowSettings(true);
          }}
        >
          <CogIcon width={28} height={28} fill={Colors.warmBlack} />
        </TouchableOpacity>
      </SafeAreaView>

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
          <Text style={styles.subtitleText}>Thử tài hoạ sĩ</Text>
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

      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
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
    marginTop: -Spacing.md,
  },
  subtitleText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.xl,
    color: Colors.border,
    marginTop: 0,
  },
  settingsWrapper: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.xl,
    zIndex: 9999,
    elevation: 9999,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.paperWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.sketch,
  },
});
