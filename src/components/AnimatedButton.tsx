import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Radius, Shadow, Spacing } from '../theme/spacing';
import { useHaptics } from '../hooks/useHaptics';
import { playClick } from '../store/useAudioStore';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'gold';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: string;
  fullWidth?: boolean;
};

const BG: Record<Variant, string> = {
  primary: Colors.primaryYellow,
  secondary: Colors.softBlue,
  danger: Colors.pastelRed,
  ghost: Colors.paperWhite,
  gold: Colors.goldAccent,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const AnimatedButton = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
  icon,
  fullWidth = false,
}: Props) => {
  const { light } = useHaptics();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.93, { damping: 10, stiffness: 300 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  }, []);

  const handlePress = useCallback(() => {
    light();
    playClick();
    onPress();
  }, [onPress, light]);

  return (
    <Animated.View style={[animatedStyle, fullWidth && styles.fullWidth]}>
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.button,
          { backgroundColor: disabled ? Colors.softGray : BG[variant] },
          style,
          fullWidth && styles.fullWidth,
        ]}
      >
        {icon ? (
          <Text style={styles.icon}>{icon}</Text>
        ) : null}
        <Text
          style={[
            styles.label,
            disabled && styles.labelDisabled,
            textStyle,
          ]}
        >
          {label}
        </Text>
      </AnimatedPressable>
    </Animated.View>
  );
};

export default React.memo(AnimatedButton);

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadow.sketch,
  },
  label: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg,
    color: Colors.warmBlack,
    letterSpacing: 0.5,
  },
  labelDisabled: {
    color: Colors.warmBlack,
    opacity: 0.5,
  },
  icon: {
    fontSize: FontSize.lg,
  },
});
