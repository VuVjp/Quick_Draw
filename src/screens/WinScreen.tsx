import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import AnimatedButton from '../components/AnimatedButton';
import { useGameStore } from '../store/useGameStore';

const { height } = Dimensions.get('window');


const WinScreen = () => {
  const router = useRouter();
  const leaveRoom = useGameStore((s) => s.leaveRoom);

  const containerScale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  // Floating stars
  const star1Y = useSharedValue(0);
  const star2Y = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    containerScale.value = withSpring(1, { damping: 12 });

    star1Y.value = withRepeat(withTiming(-10, { duration: 1500 }), -1, true);
    star2Y.value = withDelay(500, withRepeat(withTiming(-15, { duration: 2000 }), -1, true));
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  const s1Style = useAnimatedStyle(() => ({ transform: [{ translateY: star1Y.value }] }));
  const s2Style = useAnimatedStyle(() => ({ transform: [{ translateY: star2Y.value }] }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.mainFrame, containerStyle]}>
        
        {/* Floating decorations */}
        <Animated.Text style={[styles.star1, s1Style]}>⭐</Animated.Text>
        <Animated.Text style={[styles.star2, s2Style]}>⭐</Animated.Text>
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        <Text style={styles.trophy}>🏆</Text>
        
        <Text style={styles.title}>CHIẾN{'\n'}THẮNG!</Text>

        <View style={styles.answerBox}>
          <Text style={styles.answerLabel}>Ai đó đoán đúng:</Text>
          <Text style={styles.answerText}>Con Mèo</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statValue}>+50 Điểm</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statValue}>12 Giây</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <AnimatedButton
            label="Vẽ tiếp"
            onPress={() => { 
              leaveRoom(); 
              if (useGameStore.getState().isSinglePlayer) {
                router.replace('/single-player-config');
              } else {
                router.replace('/lobby'); 
              }
            }}
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

export default WinScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.notebookWhite,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  mainFrame: {
    width: '100%',
    height: height * 0.8,
    backgroundColor: Colors.paperWhite,
    borderRadius: 200, // Large pill shape
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
  },
  star1: { position: 'absolute', top: 120, right: 40, fontSize: 24 },
  star2: { position: 'absolute', top: 220, left: 30, fontSize: 18 },
  circle1: { position: 'absolute', top: 80, left: 50, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: Colors.border },
  circle2: { position: 'absolute', bottom: 150, right: 50, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primaryYellow, borderWidth: 1, borderColor: Colors.border },
  trophy: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: FontFamily.patrickHand,
    fontSize: 42,
    color: Colors.warmBlack,
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: Spacing.xxl,
  },
  answerBox: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  answerLabel: {
    fontFamily: FontFamily.caveat,
    fontSize: FontSize.md,
    color: Colors.warmBlack,
    opacity: 0.7,
  },
  answerText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.xl,
    color: Colors.warmBlack,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xxl,
    marginBottom: Spacing.xxxl,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.sm,
    color: Colors.warmBlack,
  },
  actions: {
    width: '100%',
    gap: Spacing.md,
  },
  actionBtn: {
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    width: '100%',
  },
  btnText: {
    fontSize: FontSize.md,
  }
});
