import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import AnimatedButton from '../components/AnimatedButton';
import { useGameStore } from '../store/useGameStore';
import { useShakeAnimation } from '../animations/useAnimations';


const LoseScreen = () => {
  const router = useRouter();
  const leaveRoom = useGameStore((s) => s.leaveRoom);
  const { translateX, shake } = useShakeAnimation();

  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    setTimeout(() => shake(), 700);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, style]}>
        
        <Text style={styles.heart}>💔</Text>
        
        <Text style={styles.title}>THUA RỒI!</Text>
        <Text style={styles.subtitle}>Ai không thể hiểu được{'\n'}nghệ thuật của bạn.</Text>

        <View style={styles.graphicBox}>
          <Text style={styles.scribble}>〰️〰️〰️</Text>
          <Text style={styles.redX}>❌</Text>
        </View>

        <Text style={styles.answerText}>CON MÈO</Text>

        <View style={styles.rewardRow}>
          <Text style={styles.rewardIcon}>⭐</Text>
          <Text style={styles.rewardText}>Thường an ủi: +5 EXP</Text>
        </View>

        <View style={styles.actions}>
          <AnimatedButton
            label="Xem đáp án"
            onPress={() => {}}
            variant="ghost"
            style={styles.actionBtn}
            textStyle={styles.btnText}
          />
          <AnimatedButton
            label="Sảnh chính"
            onPress={() => { leaveRoom(); router.dismissAll(); router.replace('/home'); }}
            variant="ghost"
            style={styles.actionBtn}
            textStyle={styles.btnText}
          />
        </View>

      </Animated.View>
    </View>
  );
};

export default LoseScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.paperWhite,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  heart: {
    fontSize: 56,
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: FontFamily.patrickHand,
    fontSize: 42,
    color: Colors.warmBlack,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: FontFamily.caveat,
    fontSize: FontSize.md,
    color: Colors.warmBlack,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  graphicBox: {
    width: 140,
    height: 140,
    backgroundColor: Colors.softGray,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  scribble: {
    fontSize: 32,
    opacity: 0.3,
    position: 'absolute',
  },
  redX: {
    fontSize: 64,
  },
  answerText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.xl,
    color: Colors.pastelRed,
    marginBottom: Spacing.xl,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  rewardIcon: { fontSize: 16 },
  rewardText: {
    fontFamily: FontFamily.caveatBold,
    fontSize: FontSize.md,
    color: Colors.goldAccent,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    justifyContent: 'center',
  },
  actionBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    minWidth: 120,
    borderRadius: Radius.md,
  },
  btnText: {
    fontSize: FontSize.sm,
  }
});
