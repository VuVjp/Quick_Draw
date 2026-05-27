import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, Radius, Shadow } from '../theme/spacing';
import DrawingCanvas, { DrawingCanvasRef } from '../canvas/DrawingCanvas';
import BrushToolbar from '../canvas/BrushToolbar';
import WordHint from '../components/WordHint';
import PlayerAvatar from '../components/PlayerAvatar';
import InGameRanking from '../components/InGameRanking';
import { useGameStore } from '../store/useGameStore';
import { useDrawingStore } from '../store/useDrawingStore';
import { useTimer } from '../hooks/useTimer';
import NotebookBackground from '../components/NotebookBackground';
import AnimatedButton from '../components/AnimatedButton';


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
  const insets = useSafeAreaInsets();
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const [canvasSize, setCanvasSize] = useState({ width: width - Spacing.xl * 2, height: CANVAS_HEIGHT });

  const players = useGameStore((s) => s.players);
  const currentWord = useGameStore((s) => s.currentWord);
  const wordHint = useGameStore((s) => s.wordHint);
  const currentDrawerId = useGameStore((s) => s.currentDrawerId);
  const currentRound = useGameStore((s) => s.currentRound);
  const rounds = useGameStore((s) => s.rounds);
  const phase = useGameStore((s) => s.phase);
  const startRound = useGameStore((s) => s.startRound);
  const endGame = useGameStore((s) => s.endGame);
  const maxPlayers = useGameStore((s) => s.maxPlayers);
  const addPlayer = useGameStore((s) => s.addPlayer);
  const startGame = useGameStore((s) => s.startGame);



  const { progress } = useTimer(undefined, () => {
    endGame();
    router.replace('/win');
  });

  const isDrawer = currentDrawerId === '1'; // mock: local user is always player 1

  const handleUndo = useCallback(() => canvasRef.current?.undo(), []);
  const handleRedo = useCallback(() => canvasRef.current?.redo(), []);
  const handleClear = useCallback(() => canvasRef.current?.clear(), []);

  return (
    <NotebookBackground>
      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top + Spacing.sm, 40) }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>X</Text>
          </TouchableOpacity>

          <View style={styles.wordLabelContainer}>
            <Text style={styles.youDrawText}>HÃY VẼ:</Text>
            <Text style={styles.wordText}>Con Mèo</Text>
          </View>

          <TimerDisplay />
        </View>

        {/* ── In-Game Ranking Tab ── */}
        <InGameRanking />

        {/* ── Canvas ── */}
        <View style={styles.canvasContainer}>
          <View 
            style={styles.canvasInner}
            onLayout={(e) => {
              const { width: w, height: h } = e.nativeEvent.layout;
              if (w > 0 && h > 0) {
                setCanvasSize({ width: w, height: h });
              }
            }}
          >
            <DrawingCanvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              disabled={!isDrawer}
            />

            {/* Waiting Overlay */}
            {phase === 'waiting' && (
              <View style={styles.waitingOverlay}>
                <Text style={styles.waitingTitle}>Đang chờ người chơi...</Text>
                <Text style={styles.waitingCount}>{players.length} / {maxPlayers}</Text>
                
                <View style={styles.waitingPlayers}>
                  {players.map(p => (
                    <View key={p.id} style={[styles.waitingAvatar, { borderColor: p.color }]}>
                      <Text style={{fontSize: 24}}>{p.avatar}</Text>
                    </View>
                  ))}
                </View>

                <AnimatedButton 
                  label="Bắt đầu ngay 🚀"
                  onPress={() => {
                    startGame();
                    setTimeout(() => startRound(), 100);
                  }}
                  variant="primary"
                  style={{marginTop: Spacing.xl}}
                />
              </View>
            )}
          </View>
        </View>

        {/* ── Toolbar ── */}
        <View style={[styles.toolbarWrapper, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          <BrushToolbar 
            onUndo={handleUndo} 
            onRedo={handleRedo}
            onClear={handleClear} 
          />
        </View>
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
  waitingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  waitingTitle: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.xxl,
    color: Colors.warmBlack,
    marginBottom: Spacing.sm,
  },
  waitingCount: {
    fontFamily: FontFamily.caveatBold,
    fontSize: FontSize.xl,
    color: Colors.primaryYellow,
    marginBottom: Spacing.xl,
  },
  waitingPlayers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  waitingAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    backgroundColor: Colors.paperWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
