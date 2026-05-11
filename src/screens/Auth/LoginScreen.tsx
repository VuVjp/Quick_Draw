import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../firebaseConfig';
import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import AnimatedButton from '../../components/AnimatedButton';
import PaperCard from '../../components/PaperCard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

import { SafeAreaView } from 'react-native-safe-area-context';

const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Success - navigation will be handled by auth state listener or manual navigation
      navigation.replace('MainTabs');
    } catch (error: any) {
      Alert.alert('Đăng nhập thất bại', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Đăng Nhập</Text>
            <Text style={styles.subtitle}>Chào mừng bạn quay trở lại!</Text>

            <PaperCard style={styles.card} variant="white">
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="example@gmail.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mật khẩu</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <AnimatedButton
                label={loading ? "Đang xử lý..." : "Đăng Nhập"}
                onPress={handleLogin}
                disabled={loading}
                style={styles.button}
              />
            </PaperCard>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.linkText}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.notebookWhite,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: FontFamily.indieFlower,
    fontSize: FontSize.hero,
    color: Colors.warmBlack,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: FontFamily.caveat,
    fontSize: FontSize.lg,
    color: Colors.warmBlack,
    opacity: 0.7,
    marginBottom: Spacing.xxl,
  },
  card: {
    width: '100%',
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
    width: '100%',
  },
  label: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.md,
    color: Colors.warmBlack,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.paperWhite,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontFamily: FontFamily.caveat,
    fontSize: FontSize.md,
    color: Colors.warmBlack,
  },
  button: {
    marginTop: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
  },
  footerText: {
    fontFamily: FontFamily.caveat,
    fontSize: FontSize.md,
    color: Colors.warmBlack,
  },
  linkText: {
    fontFamily: FontFamily.caveatBold,
    fontSize: FontSize.md,
    color: Colors.pastelRed,
    textDecorationLine: 'underline',
  },
});
