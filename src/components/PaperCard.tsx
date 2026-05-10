import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../theme/colors';
import { Radius, Shadow, Spacing } from '../theme/spacing';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'yellow' | 'blue' | 'pink' | 'red';
  rotate?: string;
};

const VARIANT_COLORS: Record<string, string> = {
  default: Colors.paperWhite,
  yellow: Colors.primaryYellow,
  blue: Colors.softBlue,
  pink: Colors.lightPink,
  red: Colors.pastelRed,
};

/**
 * Hand-drawn notebook card with sketch shadow border.
 * Used as the base for all card UI elements.
 */
const PaperCard = ({ children, style, variant = 'default', rotate }: Props) => {
  return (
    <View style={[
      styles.card,
      { backgroundColor: VARIANT_COLORS[variant], transform: rotate ? [{ rotate }] : undefined },
      style
    ]}>
      {children}
    </View>
  );
};

export default React.memo(PaperCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    backgroundColor: Colors.paperWhite,
    ...Shadow.sketch,
  },
});
