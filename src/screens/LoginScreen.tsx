// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal, KeyboardAvoidingView,
  Platform, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import AnimatedButton from '../components/AnimatedButton';
import NotebookBackground from '../components/NotebookBackground';
import { useAuth } from '../hooks/useAuth';

const LoginScreen = () => {
  const router = useRouter();
  const { signInWithGoogle, signInAsGuest, loading, error } = useAuth();
  const [guestModalVisible, setGuestModalVisible] = useState(false);
  const [guestName, setGuestName] = useState('');

  const handleGoogle = async () => {
    const user = await signInWithGoogle();
    if (user) router.replace('/lobby');
  };

  const handleGuestPress = () => {
    setGuestName(`Khách${Math.floor(Math.random() * 9999)}`);
    setGuestModalVisible(true);
  };

  const handleGuestConfirm = async () => {
    if (!guestName.trim()) return;
    setGuestModalVisible(false);
    const user = await signInAsGuest(guestName.trim());
    if (user) router.replace('/lobby');
  };

  return (
    <NotebookBackground>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Đăng nhập</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        {/* Illustration */}
        <View style={styles.illustrationBox}>
          <Text style={styles.illustrationEmoji}>🎨</Text>
          <Text style={styles.illustrationText}>Quick Draw!</Text>
          <Text style={styles.illustrationHint}>Draw fast, guess well</Text>
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primaryYellow} />
        ) : (
          <View style={styles.btnGroup}>
            {/* Google */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogle}
              activeOpacity={0.85}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleBtnText}>Login with Google</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Guest */}
            <AnimatedButton
              label="Play as Guest 👤"
              onPress={handleGuestPress}
              variant="ghost"
              style={styles.guestBtn}
            />
          </View>
        )}

        <Text style={styles.guestNote}>
          * Guest accounts do not save progress when exiting the app
        </Text>
      </View>

      {/* Modal nhập tên guest */}
      <Modal
        visible={guestModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGuestModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>What is your name?</Text>
            <Text style={styles.modalHint}>Ingame name</Text>

            <TextInput
              style={styles.nameInput}
              value={guestName}
              onChangeText={setGuestName}
              placeholder="VD: Picasso..."
              placeholderTextColor={Colors.softGray}
              maxLength={20}
              autoFocus
              selectTextOnFocus
            />

            <View style={styles.modalButtons}>
              <AnimatedButton
                label="Cancel"
                onPress={() => setGuestModalVisible(false)}
                variant="ghost"
                style={styles.modalBtn}
              />
              <AnimatedButton
                label="Join"
                onPress={handleGuestConfirm}
                disabled={!guestName.trim() || loading}
                variant="primary"
                style={styles.modalBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </NotebookBackground>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
    paddingBottom: Spacing.md,
  },
  title: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.xxl,
    color: Colors.warmBlack,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.paperWhite,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: 24, color: Colors.warmBlack, marginTop: -2,
  },
  content: {
    flex: 1, padding: Spacing.xl,
    justifyContent: 'center', gap: Spacing.xl,
  },
  illustrationBox: {
    alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  illustrationEmoji: { fontSize: 64 },
  illustrationText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.hero, color: Colors.warmBlack,
  },
  illustrationHint: {
    fontFamily: FontFamily.caveat,
    fontSize: FontSize.lg, color: Colors.warmBlack, opacity: 0.6,
  },
  errorBox: {
    backgroundColor: '#FFE5E5',
    borderRadius: Radius.md, padding: Spacing.md,
  },
  errorText: {
    fontFamily: FontFamily.caveat, fontSize: FontSize.md,
    color: Colors.pastelRed, textAlign: 'center',
  },
  btnGroup: { gap: Spacing.md },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.md,
    backgroundColor: Colors.paperWhite,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl,
  },
  googleIcon: {
    fontFamily: FontFamily.patrickHand,
    fontSize: 20, color: '#4285F4', fontWeight: '700',
  },
  googleBtnText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg, color: Colors.warmBlack,
  },
  divider: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: {
    fontFamily: FontFamily.caveat, fontSize: FontSize.md,
    color: Colors.warmBlack, opacity: 0.5,
  },
  guestBtn: { paddingVertical: Spacing.md },
  guestNote: {
    fontFamily: FontFamily.caveat, fontSize: FontSize.sm,
    color: Colors.warmBlack, opacity: 0.4, textAlign: 'center',
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%', backgroundColor: Colors.paperWhite,
    borderRadius: Radius.lg, borderWidth: 1.5,
    borderColor: Colors.border, padding: Spacing.xl, gap: Spacing.md,
  },
  modalTitle: {
    fontFamily: FontFamily.patrickHand, fontSize: FontSize.xxl,
    color: Colors.warmBlack, textAlign: 'center',
  },
  modalHint: {
    fontFamily: FontFamily.caveat, fontSize: FontSize.md,
    color: Colors.warmBlack, opacity: 0.6, textAlign: 'center',
  },
  nameInput: {
    fontFamily: FontFamily.patrickHand, fontSize: FontSize.xxl,
    textAlign: 'center', borderBottomWidth: 2,
    borderColor: Colors.primaryYellow,
    paddingVertical: Spacing.md, color: Colors.warmBlack,
  },
  modalButtons: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  modalBtn: { flex: 1, paddingVertical: Spacing.sm },
});