import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Button,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring
} from 'react-native-reanimated';
import BrushToolbar from '../canvas/BrushToolbar';
import DrawingCanvas, { DrawingCanvasRef } from '../canvas/DrawingCanvas';
import NotebookBackground from '../components/NotebookBackground';
import { useDrawingInference } from '../hooks/useDrawingInference';
import { useTimer } from '../hooks/useTimer';
import { useGameStore } from '../store/useGameStore';
import { Colors } from '../theme/colors';
import { Radius, Shadow, Spacing } from '../theme/spacing';
import { FontFamily, FontSize } from '../theme/typography';

const { width, height } = Dimensions.get('window');
const CANVAS_HEIGHT = height * 0.52;


// ── Timer Ring ──────────────────────────────────────────────────────────────
const TimerDisplay = React.memo(() => {
  const timeLeft = useGameStore((s) => s.timeLeft);
  const isUrgent = timeLeft <= 10;

  const scaleAnim = useSharedValue(1);

  useEffect(() => {
    if (isUrgent) {
      scaleAnim.value = withSequence(
        withSpring(1.15, { damping: 5 }),
        withSpring(1.0, { damping: 8 }),
      );
    }
  }, [timeLeft, isUrgent, scaleAnim]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.timerBox,
        { backgroundColor: isUrgent ? Colors.pastelRed : Colors.primaryYellow },
        style,
      ]}
    >
      <Text style={styles.timerText}>{timeLeft}</Text>
    </Animated.View>
  );
});
TimerDisplay.displayName = 'TimerDisplay';

// ── Drawing Screen ────────────────────────────────────────────────────────────
const DrawingScreen = () => {
  const router = useRouter();
  const canvasRef = useRef<DrawingCanvasRef>(null);

  const players = useGameStore((s) => s.players);
  const currentWord = useGameStore((s) => s.currentWord);
  const wordHint = useGameStore((s) => s.wordHint);
  const currentDrawerId = useGameStore((s) => s.currentDrawerId);
  const currentRound = useGameStore((s) => s.currentRound);
  const rounds = useGameStore((s) => s.rounds);
  const phase = useGameStore((s) => s.phase);
  const startRound = useGameStore((s) => s.startRound);
  const endGame = useGameStore((s) => s.endGame);

  // Start game immediately on mount if in 'waiting'
  useEffect(() => {
    if (phase === 'waiting' || phase === 'choosing') {
      startRound();
    }
  }, []);

  const { progress } = useTimer(undefined, () => {
    endGame();
    router.replace('/win');
  });

  const isDrawer = currentDrawerId === '1'; // mock: local user is always player 1

  const handleUndo = useCallback(() => canvasRef.current?.undo(), []);
  const handleRedo = useCallback(() => canvasRef.current?.redo(), []);
  const handleClear = useCallback(() => canvasRef.current?.clear(), []);
  const { runInference, isReady } = useDrawingInference(false);

  return (
    <NotebookBackground>
      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>X</Text>
          </TouchableOpacity>

          <View style={styles.wordLabelContainer}>
            <Text style={styles.youDrawText}>HÃY VẼ:</Text>
            <Text style={styles.wordText}>Con Mèo</Text>
          </View>

          <TimerDisplay />
        </View>

        {/* ── Canvas ── */}
        <View style={styles.canvasContainer}>
          <View style={styles.canvasInner}>
            <DrawingCanvas
              ref={canvasRef}
              width={width - Spacing.xl * 2}
              height={CANVAS_HEIGHT}
              disabled={!isDrawer}
            />
          </View>
        </View>

        {/* ── Toolbar ── */}
        <View style={styles.toolbarWrapper}>
          <BrushToolbar
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClear={handleClear}
          />
        </View>
        <Button
          title={isReady ? 'Test Inference' : 'Model loading...'}
          disabled={!isReady}
          onPress={async () => {
            const base64 = canvasRef.current?.getSnapshot();
            if (!base64) {
              console.warn('Canvas trống hoặc chưa sẵn sàng');
              return;
            }
            try {
              const result = await runInference(base64, "snowflake");
              console.log('Inference result:', result);
            } catch (e) {
              console.error('Inference error:', e);
            }
          }}
        />
      </View>
    </NotebookBackground>
  );
};

export default DrawingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.md,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.paperWhite,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sketch,
  },
  closeBtnText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: 22,
    color: Colors.warmBlack,
  },
  wordLabelContainer: {
    alignItems: 'center',
  },
  youDrawText: {
    fontFamily: FontFamily.caveatBold,
    fontSize: FontSize.xs,
    color: Colors.warmBlack,
    letterSpacing: 1,
    opacity: 0.6,
  },
  wordText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: 28,
    color: Colors.warmBlack,
    marginTop: -4,
  },
  timerBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.paperWhite,
    borderWidth: 1.5,
    borderColor: '#FF7043', // Orange border
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sketch,
  },
  timerText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: 20,
    color: Colors.warmBlack,
  },
  canvasContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  canvasInner: {
    flex: 1,
    backgroundColor: Colors.paperWhite,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.sketch,
  },
  toolbarWrapper: {
    width: '100%',
  },
});
