import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import AnimatedButton from '../components/AnimatedButton';
import NotebookBackground from '../components/NotebookBackground';

const RegisterScreen = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    // Tạm thời bỏ qua logic đăng ký
    if (username.trim()) {
      try {
        await AsyncStorage.setItem('user_token', username);
      } catch (e) {
        console.error('Failed to save register session', e);
      }
    }
    router.replace('/(tabs)/lobby');
  };

  return (
    <NotebookBackground>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Đăng ký</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên đăng nhập mới</Text>
            <TextInput
              style={styles.textInput}
              value={username}
              onChangeText={setUsername}
              placeholder="VD: art_master_123"
              placeholderTextColor={Colors.softGray}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <TextInput
              style={styles.textInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Tạo mật khẩu..."
              placeholderTextColor={Colors.softGray}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nhập lại mật khẩu</Text>
            <TextInput
              style={styles.textInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Xác nhận mật khẩu..."
              placeholderTextColor={Colors.softGray}
              secureTextEntry
            />
          </View>
        </View>

        <AnimatedButton
          label="Tạo tài khoản 📝"
          onPress={handleRegister}
          variant="primary"
          style={styles.submitBtn}
        />

        <TouchableOpacity onPress={() => router.replace('/login')} style={styles.switchLink}>
          <Text style={styles.switchLinkText}>Đã có tài khoản? Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </NotebookBackground>
  );
};

export default RegisterScreen;

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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.paperWhite,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: 24,
    color: Colors.warmBlack,
    marginTop: -2,
  },
  content: {
    padding: Spacing.xl,
  },
  formCard: {
    backgroundColor: Colors.paperWhite,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.xl,
    gap: Spacing.xl,
    marginBottom: Spacing.xxxl,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg,
    color: Colors.warmBlack,
  },
  textInput: {
    fontFamily: FontFamily.indieFlower,
    fontSize: FontSize.lg,
    borderBottomWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    color: Colors.warmBlack,
  },
  submitBtn: {
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xl,
  },
  switchLink: {
    alignItems: 'center',
  },
  switchLinkText: {
    fontFamily: FontFamily.caveatBold,
    fontSize: FontSize.md,
    color: Colors.goldAccent,
    textDecorationLine: 'underline',
  },
});
