import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { playClick } from '../store/useAudioStore';

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
import { useSubmitDrawing } from '../hooks/useSubmitDrawing';
import { useHostGameLifecycle } from '../hooks/useHostGameLifecycle';
import { useHostElection } from '../hooks/useHostElection';


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
  const maxPlayers = useGameStore((s) => s.maxPlayers);
  const startGame = useGameStore((s) => s.startGame);
  const isSinglePlayer = useGameStore((s) => s.isSinglePlayer);
  const isInferencing = useRef(false);
  const roomId = useGameStore((s) => s.roomId);
  const { room, players: roomPlayers, uid } = useRoom(roomId);
  useHostElection(roomId, room, roomPlayers, uid, { timeoutMs: 30000 });
  const { runInference, isReady } = useDrawingInference(false);
  const submittedRoundRef = useRef<string | null>(null);
  const lastHandledRoomStatusRef = useRef<string | null>(null);
  const { submitDrawing, submitting, submitted, startTimer } = useSubmitDrawing(roomId ?? '', currentRound);
  //const [localSubmitted, setLocalSubmitted] = useState(false);
  const { finishRound } = useHostGameLifecycle(roomId);
  const currentUid = uid || auth.currentUser?.uid || null;
  const lastRoomSyncKeyRef = useRef<string>('');
  const roundEndNavigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentGuess, setCurrentGuess] = useState('...');
  const [guessedCorrectly, setGuessedCorrectly] = useState(false);
  // useHostGameMaster(roomId ?? '', room?.roundDurationSecs ?? drawTime);

  const saveDrawingToStore = useCallback((scores: Record<string, number>, strokes: any[], size?: { width: number, height: number }) => {
    // End the round in game store
    useGameStore.getState().endRound(scores, strokes, size);

    // Clear local drawing data so it doesn't carry to the next round
    useDrawingStore.getState().clearCanvas();
    canvasRef.current?.clear();
    router.replace('/round-end' as any);
  }, [router]);

  const recordSinglePlayerRound = useCallback((aiCorrect: boolean, aiLabel: string | null, aiScore: number | null) => {
    useGameStore.getState().recordRoundResult({
      round: currentRound,
      word: currentWord,
      drawTime,
      timeSpent: aiCorrect ? Math.max(0, drawTime - timeLeft) : drawTime,
      aiCorrect,
      aiLabel,
      aiScore,
    });
  }, [currentRound, currentWord, drawTime, timeLeft]);

  const handleRoundExpire = useCallback(() => {
    if (!isSinglePlayer) {
      return;
    }

    const strokes = useDrawingStore.getState().strokeHistory;
    recordSinglePlayerRound(false, null, null);
    saveDrawingToStore({}, strokes, canvasSize);
  }, [canvasSize, players, recordSinglePlayerRound, roomId, saveDrawingToStore]);

  const clearRoundEndNavigateTimer = useCallback(() => {
    if (roundEndNavigateTimerRef.current) {
      clearTimeout(roundEndNavigateTimerRef.current);
      roundEndNavigateTimerRef.current = null;
    }
  }, []);

  // Sync online room state into local game store for correct drawer permissions and leaderboard data.
  useEffect(() => {
    if (isSinglePlayer) return;
    if (!roomId || !room) return;

    const roomSyncKey = [
      room.status,
      room.currentRound,
      room.currentDrawerId,
      room.currentTopic,
      room.roundDurationSecs,
      room.totalRounds,
      JSON.stringify(room.lastRoundScores ?? {}),
      Object.entries(roomPlayers)
        .map(([playerId, player]) => `${playerId}:${player.score ?? 0}:${player.isHost ? 1 : 0}`)
        .sort()
        .join('|'),
    ].join('::');

    if (lastRoomSyncKeyRef.current === roomSyncKey) return;
    lastRoomSyncKeyRef.current = roomSyncKey;

    const nextPhase = room.status === 'round_end' || room.status === 'round_scoring'
      ? 'roundEnd'
      : room.status === 'drawing'
        ? 'drawing'
        : 'waiting';

    const nextTimeLeft = room.status === 'drawing'
      ? (room.roundDurationSecs || drawTime)
      : 0;

    const mappedPlayers = Object.entries(roomPlayers).map(([playerId, pData]: [string, any]) => ({
      id: playerId,
      name: pData.displayName || 'Player',
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
      clearRoundEndNavigateTimer();
      lastHandledRoomStatusRef.current = 'drawing';

      // Clear any previous strokes to avoid immediate inference when a new round starts
      try {
        useDrawingStore.getState().clearCanvas();
        canvasRef.current?.clear();
      } catch (e) {
        console.warn('Failed to clear canvas on round start', e);
      }

      // Reset submitted flag for the new round and inference guard
      submittedRoundRef.current = null;
      isInferencing.current = false;

      startTimer();
      return;
    }

    if (room.status === 'round_end') {
      if (lastHandledRoomStatusRef.current === 'round_end') return;
      lastHandledRoomStatusRef.current = 'round_end';
      clearRoundEndNavigateTimer();
      roundEndNavigateTimerRef.current = setTimeout(() => {
        router.replace('/round-end' as any);
      }, 1000);
      return;
    }

    if (room.status === 'round_scoring') {
      clearRoundEndNavigateTimer();
      lastHandledRoomStatusRef.current = 'round_scoring';
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
  }, [clearRoundEndNavigateTimer, roomId, room, roomPlayers, router, drawTime, rounds, uid, startTimer]);

  useEffect(() => {
    return () => {
      clearRoundEndNavigateTimer();
    };
  }, [clearRoundEndNavigateTimer]);

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
          console.warn('Canvas snapshot failed or is empty');
          isInferencing.current = false;
          return;
        }

        const result = await runInference(base64, currentWord);
        if (result?.label) {
  setCurrentGuess(result.label);
}
        //console.log('Inference result:', result);

        if (isSinglePlayer) {
          if (!result) return;
          if (result.accepted) {
            setGuessedCorrectly(true);
            recordSinglePlayerRound(true, result.label, result.score);
            const scores = drawTime > 0 && timeLeft > 0
              ? {
                '1': Math.floor(
                  (timeLeft / drawTime) * 50
                )
              }
              : { '1': 0 };
            saveDrawingToStore(scores, strokes, canvasSize);
            router.replace('/round-end' as any);
          }
        } else {
          if (!result || !result.accepted || !roomId) return;

          const currentUid = uid || auth.currentUser?.uid;
          if (!currentUid) return;

          const roundId = `round_${currentRound}`;
          if (submittedRoundRef.current === roundId) return;

          await submitDrawing({
            imageBase64: base64,
            aiLabel: result.label,
            aiScore: result.score,
          });
          submittedRoundRef.current = roundId;
          console.log('[Client] submitted pending result', { roomId, roundId, score: result.score, label: result.label });
        }
      } catch (e) {
        console.error('Inference error:', e);
      } finally {
        isInferencing.current = false;
      }
    }, 300); // moderate polling

    return () => {
      clearInterval(interval);
    };
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
    runInference,
    canvasSize,
    saveDrawingToStore,
    recordSinglePlayerRound,
    startTimer,
    submitDrawing,
  ]);

  useTimer(undefined, () => {
    if (isSinglePlayer) {
      handleRoundExpire();
    }
    if (roomId) {
      void finishRound();
      return;
    }
  });

  // Clear canvas when component mounts to avoid showing stale drawing from previous game
  useEffect(() => {
    useDrawingStore.getState().clearCanvas();
    canvasRef.current?.clear();
  }
    , []);

  let isDrawer = true
  const lockMessage = roomId
    ? submitted
      ? 'Drawing submitted, waiting for others...'
      : room?.status === 'round_scoring'
        ? 'Processing results...'
        : room?.status === 'round_end'
          ? 'Transitioning to results screen...'
          : room?.status !== 'drawing'
            ? 'Waiting for host to advance round'
            // : currentUid === currentDrawerId
            //   ? null
            //   : 'Waiting for your turn to draw...'
            : null
    : null;

  const handleUndo = useCallback(() => canvasRef.current?.undo(), []);
  const handleRedo = useCallback(() => canvasRef.current?.redo(), []);
  const handleClear = useCallback(() => canvasRef.current?.clear(), []);

  return (
    <NotebookBackground>
      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top + Spacing.sm, 40) }]}>
          <TouchableOpacity onPress={() => { playClick(); router.back() }} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>X</Text>
          </TouchableOpacity>

          <View style={styles.wordLabelContainer}>
            <Text style={styles.roundIndicator}>Rounds {currentRound}/{rounds} • Let's drawing:</Text>
            <Text style={styles.wordText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{currentWord}</Text>
          </View>

          <TimerDisplay />
        </View>

        {/* ── In-Game Ranking Tab ── */}
        <InGameRanking />
<View
  style={[
    styles.aiPanel,
    guessedCorrectly && styles.aiPanelCorrect,
  ]}
>
  <Text style={styles.aiTitle}>
    {guessedCorrectly
      ? 'AI guessed correctly!'
      : 'AI thinks it is:'}
  </Text>

  <Text
    style={[
      styles.aiGuess,
      guessedCorrectly && styles.aiGuessCorrect,
    ]}
  >
    {currentGuess}
  </Text>
</View>
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

            {!isSinglePlayer && roomId && lockMessage && (
              <View style={styles.lockOverlay}>
                <View style={styles.lockCard}>
                  {!submitted ? (
                    <ActivityIndicator size="large" color={Colors.primaryYellow} />
                  ) : (
                    <Text style={[styles.lockTitle, { fontSize: 42, marginBottom: Spacing.xs }]}>✓</Text>
                  )}
                  <Text style={styles.lockTitle}>{submitted ? 'Drawing submitted, waiting for others...' : 'Canvas locked'}</Text>
                  <Text style={styles.lockText}>{lockMessage}</Text>
                </View>
              </View>
            )}

            {/* Waiting Overlay */}
            {phase === 'waiting' && (
              <View style={styles.waitingOverlay}>
                <Text style={styles.waitingTitle}>Waiting for players...</Text>
                <Text style={styles.waitingCount}>{players.length} / {maxPlayers}</Text>

                <View style={styles.waitingPlayers}>
                  {players.map(p => (
                    <View key={p.id} style={[styles.waitingAvatar, { borderColor: p.color }]}>
                      <Text style={{ fontSize: 24 }}>{p.avatar}</Text>
                    </View>
                  ))}
                </View>

                <AnimatedButton
                  label="Start Game 🚀"
                  onPress={() => {
                    startGame();
                  }}
                  variant="primary"
                  style={{ marginTop: Spacing.xl }}
                />
              </View>
            )}
          </View>
        </View>

        {/* ── Toolbar ── */}
        <View
          style={[
            styles.toolbarWrapper,
            { paddingBottom: Math.max(insets.bottom, 8) }
          ]}
        >
          <BrushToolbar
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClear={handleClear}
            disabled={!isDrawer || lockMessage !== null && !isSinglePlayer}
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
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(254, 251, 240, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 90,
  },
  lockCard: {
    backgroundColor: Colors.paperWhite,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    ...Shadow.sketch,
  },
  lockTitle: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.xl,
    color: Colors.warmBlack,
    marginBottom: Spacing.xs,
  },
  lockText: {
    fontFamily: FontFamily.caveatBold,
    fontSize: FontSize.md,
    color: Colors.warmBlack,
    textAlign: 'center',
    opacity: 0.85,
  },
  aiPanel: {
  marginHorizontal: Spacing.xl,
  marginBottom: Spacing.sm,
  backgroundColor: Colors.paperWhite,
  borderRadius: Radius.lg,
  borderWidth: 1.5,
  borderColor: Colors.border,
  paddingVertical: 12,
  alignItems: 'center',
  ...Shadow.sketch,
},

aiPanelCorrect: {
  borderColor: '#22C55E',
  backgroundColor: '#F0FDF4',
},

aiTitle: {
  fontFamily: FontFamily.patrickHand,
  fontSize: FontSize.md,
  color: Colors.warmBlack,
  opacity: 0.7,
},

aiGuess: {
  marginTop: 2,
  fontFamily: FontFamily.patrickHand,
  fontSize: 30,
  color: '#3B82F6',
},

aiGuessCorrect: {
  color: '#16A34A',
  fontSize: 34,
},

aiHistory: {
  marginTop: 6,
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: 8,
},

aiHistoryText: {
  fontFamily: FontFamily.caveatBold,
  fontSize: 16,
  color: '#666',
},
});
