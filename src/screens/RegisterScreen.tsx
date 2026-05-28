import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import AnimatedButton from '../components/AnimatedButton';
import NotebookBackground from '../components/NotebookBackground';

const AUTH_SESSION_KEY = 'user_token';

const RegisterScreen = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    // Tạm thời bỏ qua logic đăng ký
    if (username.trim()) {
      try {
        await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({
          displayName: displayName.trim() || username.trim(),
          email: '',
          uid: username.trim(),
        }));
      } catch (e) {
        console.error('Failed to save register session', e);
      }
    }
    router.replace('/lobby');
  };

  return (
    <NotebookBackground>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Register</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Username</Text>
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
            <Text style={styles.label}>Display Name (ingame name)</Text>
            <TextInput
              style={styles.textInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="VD: Art Master"
              placeholderTextColor={Colors.softGray}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.textInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password..."
              placeholderTextColor={Colors.softGray}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.textInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password..."
              placeholderTextColor={Colors.softGray}
              secureTextEntry
            />
          </View>
        </View>

        <AnimatedButton
          label="Create Account 📝"
          onPress={handleRegister}
          variant="primary"
          style={styles.submitBtn}
        />

        <AnimatedButton
          label="Play as Guest 👤"
          onPress={async () => {
            const guestName = `Guest${Math.floor(Math.random() * 10000)}`;
            await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({
              displayName: guestName,
              email: '',
              uid: guestName,
            }));
            router.replace('/lobby');
          }}
          variant="ghost"
          style={styles.guestBtn}
        />

        <TouchableOpacity onPress={() => router.replace('/login')} style={styles.switchLink}>
          <Text style={styles.switchLinkText}>Already have an account? Log in</Text>
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
    marginBottom: Spacing.md,
  },
  guestBtn: {
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
