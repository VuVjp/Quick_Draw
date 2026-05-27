import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import AnimatedButton from './AnimatedButton';
import PaperCard from './PaperCard';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const AuthModal = ({ visible, onClose }: Props) => {
  const router = useRouter();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <PaperCard style={styles.modalCard} variant="default">
          <View style={styles.header}>
            <Text style={styles.title}>Chế độ Online</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>X</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.subtitle}>
            Vui lòng chọn phương thức đăng nhập để tiếp tục:
          </Text>

          <View style={styles.actionGroup}>
            <AnimatedButton
              label="Đăng ký 📝"
              onPress={() => {
                onClose();
                router.push('/register');
              }}
              variant="primary"
              fullWidth
            />
            <AnimatedButton
              label="Đăng nhập 🔑"
              onPress={() => {
                onClose();
                router.push('/login');
              }}
              variant="primary"
              fullWidth
            />
            <AnimatedButton
              label="Chơi với tư cách khách 👤"
              onPress={async () => {
                onClose();
                const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
                const guestName = `Guest${Math.floor(Math.random() * 10000)}`;
                await AsyncStorage.setItem('user_token', guestName);
                router.push('/lobby');
              }}
              variant="ghost"
              fullWidth
            />
          </View>
        </PaperCard>
      </View>
    </Modal>
  );
};

export default AuthModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.xl + 4,
    color: Colors.warmBlack,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.notebookWhite,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg,
    color: Colors.warmBlack,
    marginTop: -2,
  },
  subtitle: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.md,
    color: Colors.warmBlack,
    marginBottom: Spacing.xl,
    opacity: 0.8,
  },
  actionGroup: {
    gap: Spacing.md,
  },
});
