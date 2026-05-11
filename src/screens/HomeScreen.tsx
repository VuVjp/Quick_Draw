import { View, Text, StyleSheet, Dimensions, Platform, Image, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import AnimatedButton from '../components/AnimatedButton';
import NotebookBackground from '../components/NotebookBackground';
import FloatingDoodles from '../components/FloatingDoodles';
import { useEntranceAnimation } from '../animations/useAnimations';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {
  const { opacity: titleOpacity, scale: titleScale } = useEntranceAnimation(100);
  const { opacity: btnOpacity } = useEntranceAnimation(400);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));

  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
  }));

  return (
    <NotebookBackground>
      <FloatingDoodles />
      
      {/* Profile Link */}
      <TouchableOpacity 
        style={styles.profileLink}
        onPress={() => navigation.navigate('MainTabs')}
      >
        <Feather name="user" size={24} color={Colors.warmBlack} />
      </TouchableOpacity>

      <View style={styles.centre}>
        {/* Title & Logo */}
        <Animated.View style={[styles.logoBlock, titleStyle]}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={[styles.buttonStack, btnStyle]}>
          <AnimatedButton
            label="Let's Draw ✏️"
            onPress={() => navigation.navigate('MainTabs')}
            variant="primary"
            fullWidth
          />
          <AnimatedButton
            label="EXIT ✖️"
            onPress={() => {}}
            variant="primary"
            fullWidth
          />
        </Animated.View>
      </View>
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
    gap: Spacing.xxxl * 1.5,
  },
  logoBlock: {
    alignItems: 'center',
    width: '100%',
  },
  logoImage: {
    width: 240,
    height: 240,
  },
  profileLink: {
    position: 'absolute',
    top: 60,
    right: Spacing.xl,
    padding: Spacing.sm,
    backgroundColor: Colors.paperWhite,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    zIndex: 10,
  },
  buttonStack: {
    width: '100%',
    gap: Spacing.md,
  },
});
