// src/components/AuthModal.tsx
import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import AnimatedButton from './AnimatedButton';
import PaperCard from './PaperCard';
import { useAuth } from '../hooks/useAuth';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const AuthModal = ({ visible, onClose }: Props) => {
  const router = useRouter();
  const { signInWithGoogle, signInAsGuest, loading, error } = useAuth();
  const [guestModalVisible, setGuestModalVisible] = useState(false);
  const [guestName, setGuestName] = useState('');

  const handleGoogle = async () => {
    const user = await signInWithGoogle();
    if (user) { onClose(); router.replace('/lobby'); }
  };

  const handleGuestPress = () => {
    setGuestName(`Guest${Math.floor(Math.random() * 9999)}`);
    setGuestModalVisible(true);
  };

  const handleGuestConfirm = async () => {
    if (!guestName.trim()) return;
    setGuestModalVisible(false);
    const user = await signInAsGuest(guestName.trim());
    if (user) { onClose(); router.replace('/lobby'); }
  };

  if (!visible) return null;

  return (
    <>
      <Modal
        transparent visible={visible}
        animationType="fade" onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <PaperCard style={styles.modalCard} variant="default">
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Online Mode</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>X</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>
              Select a login method to continue:
            </Text>

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {loading ? (
              <ActivityIndicator size="large" color={Colors.primaryYellow} />
            ) : (
              <View style={styles.actionGroup}>
                {/* Google */}
                <TouchableOpacity
                  style={styles.googleBtn}
                  onPress={handleGoogle}
                  activeOpacity={0.85}
                >
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.googleBtnText}>Sign in with Google</Text>
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
                  fullWidth
                />
              </View>
            )}
          </PaperCard>
        </View>
      </Modal>

      {/* Modal nhập tên guest — nested ngoài modal chính */}
      <Modal
        visible={guestModalVisible}
        transparent animationType="fade"
        onRequestClose={() => setGuestModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.overlay}
        >
          <View style={styles.nameCard}>
            <Text style={styles.title}>What's your name?</Text>
            <Text style={styles.subtitle}>Ingame name</Text>

            <TextInput
              style={styles.nameInput}
              value={guestName}
              onChangeText={setGuestName}
              placeholder="e.g., Picasso..."
              placeholderTextColor={Colors.softGray}
              maxLength={20}
              autoFocus
              selectTextOnFocus
            />

            <View style={styles.nameButtons}>
              <AnimatedButton
                label="Cancel"
                onPress={() => setGuestModalVisible(false)}
                variant="ghost"
                style={styles.nameBtn}
              />
              <AnimatedButton
                label="Confirm"
                onPress={handleGuestConfirm}
                disabled={!guestName.trim() || loading}
                variant="primary"
                style={styles.nameBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

export default AuthModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: { width: '100%', padding: Spacing.xl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: Spacing.md,
  },
  title: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.xl + 4, color: Colors.warmBlack,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.notebookWhite,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg, color: Colors.warmBlack, marginTop: -2,
  },
  subtitle: {
  fontFamily: FontFamily.patrickHand,
  fontSize: FontSize.lg,
  color: Colors.warmBlack,
  marginBottom: Spacing.md, // giảm từ xl xuống md
  opacity: 0.8,
  },
  errorBox: {
    backgroundColor: '#FFE5E5', borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  errorText: {
    fontFamily: FontFamily.caveat, fontSize: FontSize.md,
    color: Colors.pastelRed, textAlign: 'center',
  },
  actionGroup: { gap: Spacing.md },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.md,
    backgroundColor: Colors.paperWhite,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
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
  nameCard: {
  width: '100%',
  minHeight: 300,
  backgroundColor: Colors.paperWhite,
  borderRadius: Radius.lg,
  borderWidth: 1.5,
  borderColor: Colors.border,
  padding: Spacing.xl,
  justifyContent: 'flex-start',
  },
  nameInput: {
    fontFamily: FontFamily.patrickHand, fontSize: FontSize.xxl,
    textAlign: 'center', borderBottomWidth: 2,
    borderColor: Colors.primaryYellow,
    paddingVertical: Spacing.md, color: Colors.warmBlack,
  },
  nameButtons: {
  flexDirection: 'row',
  gap: Spacing.md,
  marginTop: Spacing.lg,
  alignSelf: 'center',
  },

  nameBtn: {
    flex: 1,
    minHeight: 58,
    justifyContent: 'center',
  },
});