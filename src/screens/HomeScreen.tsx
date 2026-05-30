import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  ZoomIn,
} from 'react-native-reanimated';

import AuthModal from '../components/AuthModal';
import FloatingDoodles from '../components/FloatingDoodles';
import NotebookBackground from '../components/NotebookBackground';
import SettingsModal from '../components/SettingsModal';

import { useRouter } from 'expo-router';

import { playClick } from '../store/useAudioStore';
import { useUserStore } from '../store/useUserStore';

import Logo from '../../assets/logo/Group 7.svg';
import CogIcon from '../../assets/Icon/cog.svg';

import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Radius, Shadow, Spacing } from '../theme/spacing';

const HomeScreen = () => {
  const router = useRouter();

  const [showAuth, setShowAuth] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const session = useUserStore((s) => s.session);

  const handleOnlinePress = () => {
    if (session?.uid) {
      router.replace('/lobby');
      return;
    }

    setShowAuth(true);
  };

  return (
    <NotebookBackground>
      <FloatingDoodles />

      {/* SETTINGS */}
      <SafeAreaView
        style={styles.settingsWrapper}
        edges={['top', 'right']}
      >
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => {
            playClick();
            setShowSettings(true);
          }}
        >
          <CogIcon
            width={24}
            height={24}
            fill={Colors.warmBlack}
          />
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.container}>
        {/* LOGO */}
        <Animated.View
          entering={ZoomIn.duration(700)}
          style={styles.logoSection}
        >
          <View style={styles.logoPaper}>
            <View style={styles.tape} />

            <Logo
              width={150}
              height={150}
            />
          </View>

          <Text style={styles.title}>
            QUICK DRAW!
          </Text>

          <View style={styles.underline} />

          <Text style={styles.subtitle}>
            Test your drawing skills
          </Text>
        </Animated.View>

        {/* BUTTONS */}
        <Animated.View
          entering={FadeInDown.delay(200)}
          style={styles.buttonStack}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.sketchButton,
              styles.soloButton,
            ]}
            onPress={() =>
              router.push('/single-player-config')
            }
          >
            <Text style={styles.buttonEmoji}>
              🎨
            </Text>

            <View style={{ flex: 1 }}>
              <Text style={styles.buttonTitle}>
                PLAY SOLO
              </Text>

              <Text style={styles.buttonSubtitle}>
                Practice and improve your
                drawing skills
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.sketchButton,
              styles.onlineButton,
            ]}
            onPress={handleOnlinePress}
          >
            <View style={styles.hotBadge}>
              <Text style={styles.hotText}>
                HOT
              </Text>
            </View>

            <Text style={styles.buttonEmoji}>
              🌍
            </Text>

            <View style={{ flex: 1 }}>
              <Text style={styles.buttonTitle}>
                PLAY ONLINE
              </Text>

              <Text style={styles.buttonSubtitle}>
                Challenge real players
                worldwide
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <AuthModal
        visible={showAuth}
        onClose={() => setShowAuth(false)}
      />

      <SettingsModal
        visible={showSettings}
        onClose={() =>
          setShowSettings(false)
        }
      />
    </NotebookBackground>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  logoSection: {
    alignItems: 'center',
     marginBottom: 35,
  },

  logoPaper: {
  backgroundColor: Colors.paperWhite,
  padding: 18,

  borderRadius: 28,
  borderWidth: 2,
  borderColor: Colors.border,

  transform: [{ rotate: '-2deg' }],

  overflow: 'visible',

  ...Shadow.sketch,
},

  tape: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',

    width: 70,
  height: 18,

    borderRadius: 6,

    backgroundColor: '#F7E6A2',

    opacity: 0.9,

    transform: [{ rotate: '-8deg' }],
  },

  title: {
    marginTop: 10,

    fontFamily: FontFamily.patrickHand,
    fontSize: 42,

    color: Colors.warmBlack,

    letterSpacing: 1.5,
  },

  underline: {
    width: 140,
    height: 3,

    borderRadius: 10,

    backgroundColor: Colors.warmBlack,

    marginTop: -4,
    marginBottom: 8,

    transform: [{ rotate: '-2deg' }],
  },

  subtitle: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg,

    color: Colors.border,
  },

  buttonStack: {
    gap: 22,
  },

  sketchButton: {
    backgroundColor: Colors.paperWhite,

    borderWidth: 2.5,
    borderColor: Colors.border,

    paddingVertical: 16,
paddingHorizontal: 18,

borderRadius: 22,

    flexDirection: 'row',
    alignItems: 'center',

    ...Shadow.sketch,
  },

  soloButton: {
    transform: [{ rotate: '-1.2deg' }],
  },

  onlineButton: {
    transform: [{ rotate: '1.2deg' }],
    borderWidth: 3,
  },

  buttonEmoji: {
    fontSize: 28,
    marginRight: 16,
  },

  buttonTitle: {
    fontFamily: FontFamily.patrickHand,
    fontSize: 24,

    color: Colors.warmBlack,

    letterSpacing: 1.5,
  },

  buttonSubtitle: {
    marginTop: 2,

    fontFamily: FontFamily.patrickHand,
    fontSize: 14,

    color: Colors.border,
  },

  hotBadge: {
    position: 'absolute',

    top: -12,
    right: 20,

    backgroundColor: '#FFE066',

    paddingHorizontal: 10,
    paddingVertical: 4,

    borderRadius: 12,

    borderWidth: 1.5,
    borderColor: Colors.border,

    transform: [{ rotate: '10deg' }],
  },

  hotText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.warmBlack,
  },

  settingsWrapper: {
    position: 'absolute',

    top: Spacing.md,
    right: Spacing.xl,

    zIndex: 999,
  },

  settingsBtn: {
    width: 52,
    height: 52,

    borderRadius: 18,

    backgroundColor: Colors.paperWhite,

    borderWidth: 2,
    borderColor: Colors.border,

    justifyContent: 'center',
    alignItems: 'center',

    transform: [{ rotate: '8deg' }],

    ...Shadow.sketch,
  },
  
});