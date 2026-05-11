import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../firebaseConfig';
import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import AnimatedButton from '../../components/AnimatedButton';
import PaperCard from '../../components/PaperCard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

import { SafeAreaView } from 'react-native-safe-area-context';

const SignupScreen = ({ navigation }: Props) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      Alert.alert('Thành công', 'Tài khoản của bạn đã được tạo!');
      navigation.replace('MainTabs');
    } catch (error: any) {
      Alert.alert('Đăng ký thất bại', error.message);
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
            <Text style={styles.title}>Đăng Ký</Text>
            <Text style={styles.subtitle}>Gia nhập cộng đồng họa sĩ!</Text>

            <PaperCard style={styles.card} variant="white">
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tên hiển thị</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Họa sĩ tí hon"
                  value={name}
                  onChangeText={setName}
                />
              </View>

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

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Xác nhận mật khẩu</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <AnimatedButton
                label={loading ? "Đang xử lý..." : "Đăng Ký"}
                onPress={handleSignup}
                disabled={loading}
                style={styles.button}
                variant="secondary"
              />
            </PaperCard>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignupScreen;

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
    marginBottom: Spacing.lg,
  },
  card: {
    width: '100%',
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
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
