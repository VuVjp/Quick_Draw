import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Radius, Spacing } from '../theme/spacing';

type Props = {
  currentXP: number;
  maxXP: number;
  level: number;
};

const XPProgressBar = ({ currentXP, maxXP, level }: Props) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(currentXP / maxXP, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [currentXP, maxXP]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Level {level}</Text>
        <Text style={styles.xpText}>{currentXP} / {maxXP} XP</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
        {/* Notebook ruling lines */}
        {[25, 50, 75].map((pct) => (
          <View key={pct} style={[styles.ruler, { left: `${pct}%` as any }]} />
        ))}
      </View>
    </View>
  );
};

export default React.memo(XPProgressBar);

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.md,
    color: Colors.warmBlack,
  },
  xpText: {
    fontFamily: FontFamily.caveat,
    fontSize: FontSize.sm,
    color: Colors.warmBlack,
    opacity: 0.7,
  },
  track: {
    height: 20,
    backgroundColor: Colors.softGray,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primaryYellow,
    borderRadius: Radius.full,
  },
  ruler: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: Colors.border,
    opacity: 0.2,
  },
});
