import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import AnimatedButton from './AnimatedButton';
import PaperCard from './PaperCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const AuthModal = ({ visible, onClose }: Props) => {
  const router = useRouter();
  const [mode, setMode] = useState<'select' | 'inputName'>('select');
  const [loginMethod, setLoginMethod] = useState<'guest' | 'google'>('guest');
  const [name, setName] = useState('');

  if (!visible) return null;

  const handleSelectMethod = (method: 'guest' | 'google') => {
    setLoginMethod(method);
    setMode('inputName');
  };

  const handleContinue = async () => {
    if (name.trim().length === 0) return;
    
    try {
      try {
        if (loginMethod === 'guest') {
          await auth().signInAnonymously();
        } else {
          await auth().signInAnonymously(); // Temporary logic
        }
      } catch (authError) {
        console.log('Bỏ qua lỗi Firebase Auth tạm thời:', authError);
      }
      
      await AsyncStorage.setItem('user_token', name.trim());
      
      setMode('select');
      setName('');
      onClose();
      router.push('/(tabs)/lobby');
    } catch (e) {
      console.error('Lỗi đăng nhập', e);
    }
  };

  const handleClose = () => {
    setMode('select');
    setName('');
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      >
        <PaperCard style={styles.modalCard} variant="default">
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>X</Text>
          </TouchableOpacity>

          <View style={styles.contentContainer}>
            <Text style={styles.iconDisplay}>
              {mode === 'select' ? '🎮' : '✍️'}
            </Text>
            
            <Text style={styles.title}>
              {mode === 'select' ? 'Sẵn sàng tranh tài?' : 'Nhập tên của bạn'}
            </Text>
            
            {mode === 'select' ? (
              <>
                <Text style={styles.subtitle}>
                  Vui lòng chọn cách thức đăng nhập
                </Text>

                <View style={styles.actionGroup}>
                  <AnimatedButton
                    label="Đăng nhập Google 🌐"
                    onPress={() => handleSelectMethod('google')}
                    variant="primary"
                    fullWidth
                  />
                  <AnimatedButton
                    label="Chơi với tư cách khách 👤"
                    onPress={() => handleSelectMethod('guest')}
                    variant="ghost"
                    fullWidth
                  />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.subtitle}>
                  Bạn muốn mọi người gọi bạn là gì?
                </Text>
                
                <TextInput
                  style={styles.nameInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Vd: Cọ Vẽ Siêu Tốc..."
                  placeholderTextColor={Colors.softGray}
                  maxLength={20}
                  autoCapitalize="words"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleContinue}
                />
                
                <View style={styles.actionGroup}>
                  <AnimatedButton
                    label="Tiếp tục 🚀"
                    onPress={handleContinue}
                    disabled={name.trim().length === 0}
                    variant="primary"
                    fullWidth
                  />
                </View>
              </>
            )}
          </View>
        </PaperCard>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AuthModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.notebookWhite,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeBtnText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg,
    color: Colors.warmBlack,
    marginTop: -2,
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconDisplay: {
    fontSize: 56,
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.xxl,
    color: Colors.warmBlack,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: FontFamily.caveat,
    fontSize: FontSize.lg,
    color: Colors.warmBlack,
    marginBottom: Spacing.xl,
    opacity: 0.7,
    textAlign: 'center',
  },
  actionGroup: {
    width: '100%',
    gap: Spacing.md,
  },
  nameInput: {
    fontFamily: FontFamily.patrickHand,
    fontSize: 32,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderColor: Colors.primaryYellow,
    paddingVertical: Spacing.sm,
    color: Colors.warmBlack,
    marginBottom: Spacing.xl,
    width: '90%',
  },
});
