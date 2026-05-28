import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
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
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, Radius, Shadow } from '../theme/spacing';
import DrawingCanvas, { DrawingCanvasRef } from '../canvas/DrawingCanvas';
import BrushToolbar from '../canvas/BrushToolbar';
import InGameRanking from '../components/InGameRanking';
import { useGameStore } from '../store/useGameStore';
import { useDrawingStore } from '../store/useDrawingStore';
import { useTimer } from '../hooks/useTimer';
import NotebookBackground from '../components/NotebookBackground';
import AnimatedButton from '../components/AnimatedButton';
import { useDrawingInference } from '../hooks/useDrawingInference';
import { auth } from '../services/firebase';
import { useRoom } from '../hooks/useRoom';
import { useHostGameMaster } from '../hooks/useHostGameMaster';


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
  const timeLeft = useGameStore((s) => s.timeLeft);
  const drawTime = useGameStore((s) => s.drawTime);

  const players = useGameStore((s) => s.players);
  const currentWord = useGameStore((s) => s.currentWord);
  const currentDrawerId = useGameStore((s) => s.currentDrawerId);
  const currentRound = useGameStore((s) => s.currentRound);
  const rounds = useGameStore((s) => s.rounds);
  const phase = useGameStore((s) => s.phase);
  const startRound = useGameStore((s) => s.startRound);
  const maxPlayers = useGameStore((s) => s.maxPlayers);
  const startGame = useGameStore((s) => s.startGame);
  const isSinglePlayer = useGameStore((s) => s.isSinglePlayer);
  const isInferencing = useRef(false);
  const roomId = useGameStore((s) => s.roomId);
  const { room, players: roomPlayers, uid } = useRoom(roomId);
  const { runInference, isReady, submitPendingResult } = useDrawingInference(false);
  const submittedRoundRef = useRef<string | null>(null);
  const lastHandledRoomStatusRef = useRef<string | null>(null);

  useHostGameMaster(roomId ?? '', room?.roundDurationSecs ?? drawTime);

  const saveDrawingToStore = useCallback((scores: Record<string, number>, strokes: any[], size?: { width: number, height: number }) => {
    // End the round in game store
    useGameStore.getState().endRound(scores, strokes, size);

    // Clear local drawing data so it doesn't carry to the next round
    useDrawingStore.getState().clearCanvas();
    canvasRef.current?.clear();
    router.replace('/round-end' as any);
  }, [router]);

  // Sync online room state into local game store for correct drawer permissions and leaderboard data.
  useEffect(() => {
    if (!roomId || !room) return;

    const nextPhase = room.status === 'round_end'
      ? 'roundEnd'
      : room.status === 'drawing'
        ? 'drawing'
        : 'waiting';

    const nextTimeLeft = room.status === 'drawing'
      ? (room.roundDurationSecs || drawTime)
      : 0;

    const mappedPlayers = Object.entries(roomPlayers).map(([playerId, pData]: [string, any]) => ({
      id: playerId,
      name: pData.displayName || 'Người chơi',
      avatar: pData.avatar || 'user',
      xp: 0,
      level: 1,
      score: pData.score ?? 0,
      isDrawing: playerId === room.currentDrawerId,
      isHost: !!pData.isHost,
      color: pData.isHost ? '#7B5EA7' : '#F4978E',
    })).sort((a, b) => b.score - a.score);

    useGameStore.getState().setRoomConfig({
      players: mappedPlayers,
      currentDrawerId: room.currentDrawerId,
      currentWord: room.currentTopic || '',
      currentRound: room.currentRound || 1,
      rounds: room.totalRounds || rounds,
      drawTime: room.roundDurationSecs || drawTime,
      phase: nextPhase,
      timeLeft: nextTimeLeft,
      lastRoundScores: (room as any).lastRoundScores ?? {},
    });

    if (room.status === 'drawing') {
      lastHandledRoomStatusRef.current = 'drawing';
      return;
    }

    if (room.status === 'round_end') {
      if (lastHandledRoomStatusRef.current === 'round_end') return;
      lastHandledRoomStatusRef.current = 'round_end';
      router.replace('/round-end' as any);
      return;
    }

    if (room.status === 'game_end') {
      if (lastHandledRoomStatusRef.current === 'game_end') return;
      lastHandledRoomStatusRef.current = 'game_end';
      const sorted = [...mappedPlayers].sort((a, b) => b.score - a.score);
      const localUid = uid || auth.currentUser?.uid || '1';
      const top1Id = sorted[0]?.id;
      if (top1Id && top1Id === localUid) {
        router.replace('/win' as any);
      } else {
        router.replace('/lose' as any);
      }
      return;
    }
  }, [roomId, room, roomPlayers, router, drawTime, rounds, uid]);

  useEffect(() => {
    // Run periodic inference only when model is ready
    if (!isReady) return;
    if (!canvasRef.current) return;

    const interval = setInterval(async () => {
      if (isInferencing.current) return;
      // mark as running to avoid overlapping snapshot/predict calls
      isInferencing.current = true;
      try {
        // wait one frame to ensure latest UI/skia updates have been painted
        await new Promise((res) => requestAnimationFrame(() => res(null)));

        const strokes = useDrawingStore.getState().strokeHistory;
        if (strokes.length === 0) {
          isInferencing.current = false;
          return;
        }

        const base64 = canvasRef.current?.getSnapshot();
        if (!base64) {
          console.warn('Canvas trống hoặc chưa sẵn sàng');
          isInferencing.current = false;
          return;
        }

        const result = await runInference(base64, currentWord);
        //console.log('Inference result:', result);

        if (isSinglePlayer) {
          if (!result) return;
          if (result.accepted) {
            const scores = drawTime > 0 && timeLeft > 0
              ? {
                '1': Math.floor(
                  (timeLeft / drawTime) * 50
                )
              }
              : { '1': 0 };
            saveDrawingToStore(scores, strokes, canvasSize);
            router.replace('/round-end' as any);
          } else {
            // multiplayer handling
          }
        } else {
          if (!result || !result.accepted || !roomId) return;

          const currentUid = uid || auth.currentUser?.uid;
          if (!currentUid || currentUid !== currentDrawerId) return;

          const roundId = `round_${currentRound}`;
          if (submittedRoundRef.current === roundId) return;

          const elapsedMs = Math.max(0, (drawTime - timeLeft) * 1000);

          await submitPendingResult(
            roomId,
            roundId,
            currentUid,
            result.label,
            result.score,
            elapsedMs,
          );

          submittedRoundRef.current = roundId;
          console.log('[Client] submitted pending result', { roomId, roundId, score: result.score, label: result.label });
        }
      } catch (e) {
        console.error('Inference error:', e);
      } finally {
        isInferencing.current = false;
      }
    }, 300); // moderate polling

    return () => clearInterval(interval);
  }, [
    isReady,
    currentWord,
    isSinglePlayer,
    timeLeft,
    router,
    roomId,
    uid,
    currentDrawerId,
    currentRound,
    drawTime,
    submitPendingResult,
    runInference,
    canvasSize,
    saveDrawingToStore,
  ]);

  useTimer(undefined, () => {
    // End round instead of end game
    const mockScores: Record<string, number> = {};
    players.forEach(p => {
      mockScores[p.id] = Math.floor(Math.random() * 50); // Mock points
    });

    // Give the local drawer a random high score if they are playing single player to simulate drawing good
    if (useGameStore.getState().isSinglePlayer) {
      mockScores['1'] = 45 + Math.floor(Math.random() * 15);
    }
    const strokes = useDrawingStore.getState().strokeHistory;

    // Save current drawing to store
    saveDrawingToStore(mockScores, strokes, canvasSize);
  });

  const localUid = uid || auth.currentUser?.uid || '1';
  const isDrawer = isSinglePlayer ? true : currentDrawerId === localUid;

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
            <Text style={styles.roundIndicator}>Vòng {currentRound}/{rounds} • HÃY VẼ:</Text>
            <Text style={styles.wordText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{currentWord}</Text>
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
                      <Text style={{ fontSize: 24 }}>{p.avatar}</Text>
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
                  style={{ marginTop: Spacing.xl }}
                />
              </View>
            )}
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
        {/* <Button
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
        /> */}
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
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  roundIndicator: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.md,
    color: Colors.warmBlack,
    letterSpacing: 0.5,
    marginBottom: 2,
    opacity: 0.75,
  },
  wordText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: 44,
    color: Colors.warmBlack,
    textAlign: 'center',
    lineHeight: 48,
    letterSpacing: -0.5,
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
