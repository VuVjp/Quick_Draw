import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import AnimatedButton from '../components/AnimatedButton';
import NotebookBackground from '../components/NotebookBackground';
import { useGameStore } from '../store/useGameStore';
import ReadOnlyCanvas from '../canvas/ReadOnlyCanvas';
import { useRoom } from '../hooks/useRoom';
import { useHostGameLifecycle } from '../hooks/useHostGameLifecycle';
import { useLeaderboard } from '../hooks/useLeaderboard';
import firestore from '@react-native-firebase/firestore';

const RoundEndScreen = () => {
  const router = useRouter();
  const currentRound = useGameStore((s) => s.currentRound);
  const rounds = useGameStore((s) => s.rounds);
  const players = useGameStore((s) => s.players);
  const roundDrawing = useGameStore((s) => s.roundDrawing);
  const originalCanvasSize = useGameStore((s) => s.originalCanvasSize);
  const startRound = useGameStore((s) => s.startRound);
  const endGame = useGameStore((s) => s.endGame);
  const lastRoundScores = useGameStore((s) => s.lastRoundScores);
  const roomId = useGameStore((s) => s.roomId);
  const { room, uid } = useRoom(roomId);
  const { players: leaderboardPlayers } = useLeaderboard(roomId);
  useHostGameLifecycle(roomId);

  const isLastRound = useRef(currentRound >= rounds).current;
  const isSinglePlayer = useGameStore((s) => s.isSinglePlayer);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [countdown, setCountdown] = useState<number>(5);
  const isOnline = !!roomId;
  const displayedPlayers = isOnline ? leaderboardPlayers : players;
  const sortedDisplayedPlayers = useMemo(() => {
    return [...displayedPlayers].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }, [displayedPlayers]);
  const top1Player = displayedPlayers[0] as any;

  const [mvpImageBase64, setMvpImageBase64] = useState<string | null>(null);
  const [mvpStrokes, setMvpStrokes] = useState<any[] | null>(null);
  let hasMvpArtwork = !!room?.mvpUid && (mvpImageBase64 !== null || mvpStrokes !== null);
  if (isSinglePlayer) {
    hasMvpArtwork = true // Luôn hiển thị tác phẩm ở chế độ đơn, dù không có MVP chính thức
  }
  useEffect(() => {
    if (isSinglePlayer) return;
    if (!isOnline || !room) return;

    if (room.status === 'drawing') {
      router.replace('/drawing' as any);
      return;
    }

    if (room.status === 'game_end') {
      const top1Id = top1Player?.uid ?? top1Player?.id;
      if (top1Id && uid && top1Id === uid) {
        router.replace('/win' as any);
      } else {
        router.replace('/lose' as any);
      }
    }
  }, [displayedPlayers, isOnline, room, router, top1Player, uid, isSinglePlayer]);

  // Load MVP submission image or strokes from Firestore for the completed round
  useEffect(() => {
    if (!isOnline || !room) {
      setMvpImageBase64(null);
      setMvpStrokes(null);
      return;
    }

    const mvpUid = room.mvpUid;
    if (!mvpUid) {
      setMvpImageBase64(null);
      setMvpStrokes(null);
      return;
    }

    const roundKey = `round_${room.currentRound}`;
    const roundRef = firestore().collection('rooms').doc(roomId).collection('rounds').doc(roundKey);

    let mounted = true;
    roundRef.get().then((snap) => {
      if (!mounted || !snap.exists) return;
      const data = snap.data() as any;
      const sub = data?.submissions?.[mvpUid];
      if (sub) {
        if (sub.imageBase64) {
          setMvpImageBase64(sub.imageBase64);
          setMvpStrokes(null);
        } else if (sub.strokes) {
          setMvpStrokes(sub.strokes);
          setMvpImageBase64(null);
        } else {
          setMvpImageBase64(null);
          setMvpStrokes(null);
        }
      } else {
        setMvpImageBase64(null);
        setMvpStrokes(null);
      }
    }).catch((e) => {
      console.warn('Failed to load MVP submission', e);
      setMvpImageBase64(null);
      setMvpStrokes(null);
    });

    return () => { mounted = false; };
  }, [isOnline, room, roomId]);

  useEffect(() => {
    const countdownActive = room?.status === 'round_countdown' || room?.status === 'round_end';
    if (!room || !countdownActive || !room.roundCountdownStartedAt) {
      setCountdown(0);
      return;
    }

    const tick = () => {
      const totalMs = (room.roundCountdownSecs ?? 0) * 1000;
      const elapsed = Date.now() - room.roundCountdownStartedAt!.getTime();
      const remain = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
      setCountdown(remain);
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [room]);

  const handleNext = () => {

    if (isLastRound) {
      endGame();
      router.replace('/win');
    } else {
      startRound();
      useGameStore.setState(s => ({ currentRound: s.currentRound + 1 }));
      router.replace('/drawing');
    }
  };

  const renderPlayer = ({ item, index }: { item: any; index: number }) => {
    const isTop1 = index === 0;
    const playerId = item.uid ?? item.id;
    const playerName = item.displayName ?? item.name;
    const playerAvatar = item.avatar ?? 'user';
    const totalScore = item.score ?? 0;
    const pointsGained = item.gainedScore ?? lastRoundScores[playerId] ?? 0;
    return (
      <Animated.View
        entering={FadeInDown.delay(300 + index * 100).springify().damping(12)}
        style={[styles.playerRow, isTop1 && styles.top1Row]}
      >
        <Text style={styles.playerRank}>#{index + 1}</Text>
        {/* <Text style={styles.playerAvatar}>{item.avatar}</Text> */}
        <Image
          source={playerAvatar === 'user' ? require('../../assets/images/anonymous.png') : { uri: playerAvatar }}
          style={{ width: 30, height: 30, borderRadius: 15, marginRight: Spacing.sm }}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.playerName} numberOfLines={1}>{playerName}</Text>
          <Text style={styles.playerScore}>Total: {totalScore} P</Text>
        </View>
        <Text style={styles.playerScore}>+{pointsGained} P</Text>
      </Animated.View>
    );
  };

  return (
    <NotebookBackground>
      <View style={styles.container}>
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <Text style={styles.title}>ROUND END {currentRound}/{rounds}</Text>
          {!isSinglePlayer && (
            <FlatList
              data={sortedDisplayedPlayers}
              horizontal
              keyExtractor={(item: any) => String(item.uid ?? item.id)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.miniLeaderboard}
              renderItem={({ item }: { item: any }) => {
                const playerId = item.uid ?? item.id;
                const playerName = item.displayName ?? item.name;
                const playerAvatar = item.avatar ?? 'user';
                const totalScore = item.score ?? 0;
                const pts = item.gainedScore ?? lastRoundScores[playerId] ?? 0;
                return (
                  <View style={styles.miniPlayerRow}>
                    <Image
                      source={playerAvatar ? playerAvatar === 'user' ? require('../../assets/images/anonymous.png') : { uri: playerAvatar } : require('../../assets/images/anonymous.png')}
                      style={{ width: 30, height: 30, borderRadius: 15, marginRight: Spacing.sm }}
                    />
                    <Text style={styles.miniPlayerName} numberOfLines={1}>{playerName ?? 'Player'}</Text>
                    <Text style={styles.miniPlayerScore}>
                      {totalScore} P
                    </Text>
                    <Text style={[styles.miniPlayerScore, pts > 0 && styles.miniPlayerScorePositive]}>
                      {pts > 0 ? `+${pts}P` : `${pts}P`}
                    </Text>
                  </View>
                );
              }}
            />)}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={[styles.artworkContainer, { flex: 1 }]}>
          <Text style={styles.artworkTitle}>Best Artwork</Text>
          <View
            style={[styles.canvasWrapper, { flex: 1, width: '100%', marginBottom: Spacing.md }]}
            onLayout={(e) => {
              const { width: w, height: h } = e.nativeEvent.layout;
              if (w > 0 && h > 0) {
                setCanvasSize({ width: w, height: h });
              }
            }}
          >
            {canvasSize.width > 0 && (
              mvpImageBase64
                ? (
                  <Image
                    source={{ uri: `data:image/png;base64,${mvpImageBase64}` }}
                    style={{ width: canvasSize.width, height: canvasSize.height }}
                  />
                ) : mvpStrokes
                  ? (
                    <ReadOnlyCanvas
                      width={canvasSize.width}
                      height={canvasSize.height}
                      strokes={mvpStrokes}
                      originalCanvasSize={originalCanvasSize}
                    />
                  ) : (
                    <ReadOnlyCanvas
                      width={canvasSize.width}
                      height={canvasSize.height}
                      strokes={roundDrawing}
                      originalCanvasSize={originalCanvasSize}
                    />
                  )
            )}
            {hasMvpArtwork ? (
              <View style={styles.artworkAuthorTag}>
                <Image
                  source={isSinglePlayer || (top1Player?.avatar ?? 'user') === 'user' ? require('../../assets/images/anonymous.png') : { uri: top1Player?.avatar }}
                  style={{ width: 30, height: 30, borderRadius: 15, marginRight: Spacing.sm }}
                />
                <Text style={styles.artworkAuthorText}>{isSinglePlayer ? 'You' : top1Player?.displayName ?? top1Player?.name}</Text>
              </View>
            ) : (
              <View style={styles.noMvpTag}>
                <Text style={styles.noMvpText}>No one finished</Text>
              </View>
            )}

            {showLeaderboard && !isSinglePlayer && (
              <View style={styles.leaderboardOverlay}>
                <Text style={styles.leaderboardTitle}>Leaderboard</Text>
                <FlatList
                  data={displayedPlayers}
                  renderItem={renderPlayer}
                  keyExtractor={(item: any) => item.id ?? item.uid}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={styles.listContent}
                  style={{ width: '100%' }}
                />
              </View>
            )}

          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(800).springify()} style={styles.footer}>
          {/* {!isSinglePlayer && (
            <View style={styles.countdownBox}>
              <Text style={styles.countdownTitle}>New Round Begins In</Text>
              <Text style={styles.countdownValue}>{countdown}</Text>
            </View>
          )} */}

          {/* {isOnline && room?.status === 'round_end' && !isLastRound && (
            <View style={styles.countdownBox}>
              <View style={styles.autoRandomBadge}>
                <Text style={styles.autoRandomBadgeText}>Chủ đề tự động random</Text>
              </View>
              <Text style={styles.countdownTitle}>Vòng mới bắt đầu sau</Text>
              <Text style={styles.countdownValue}>{countdown}</Text>
              <Text style={styles.countdownTopic}>Tất cả người chơi sẽ vào cùng một chủ đề được hệ thống chọn ngẫu nhiên.</Text>
            </View>
          )} */}

          {!isSinglePlayer && (
            <AnimatedButton
              label={showLeaderboard ? `Hide Leaderboard (${countdown})` : `Show Leaderboard (${countdown})`}
              onPress={() => setShowLeaderboard(!showLeaderboard)}
              variant="secondary"
              style={{ marginBottom: Spacing.md }}
              fullWidth
            />
          )}
          {isSinglePlayer && (
            <AnimatedButton
              label={isLastRound ? "View Summary" : "Next Round"}
              onPress={handleNext}
              variant="primary"
              fullWidth
            />
          )}
        </Animated.View>
      </View>
    </NotebookBackground>
  );
};

export default RoundEndScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.xxl,
    color: Colors.warmBlack,
  },
  artworkContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  artworkTitle: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg,
    color: Colors.goldAccent,
    marginBottom: Spacing.sm,
  },
  canvasWrapper: {
    backgroundColor: Colors.paperWhite,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 4,
  },
  artworkAuthorTag: {
    position: 'absolute',
    bottom: -12,
    left: 0,
    right: 0,
    backgroundColor: Colors.primaryYellow,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMvpTag: {
    position: 'absolute',
    bottom: -12,
    left: 0,
    right: 0,
    backgroundColor: Colors.lightPink,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkAuthorText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.sm,
    color: Colors.warmBlack,
  },
  noMvpText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.sm,
    color: Colors.warmBlack,
  },
  leaderboardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 215, 90, 0.95)',
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.md,
    zIndex: 20,
    overflow: 'hidden',
  },
  leaderboardTitle: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg,
    color: Colors.warmBlack,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  listContent: {
    gap: Spacing.sm,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.notebookWhite,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.softGray,
  },
  top1Row: {
    backgroundColor: Colors.goldAccent,
    borderColor: Colors.border,
    borderWidth: 1.5,
  },
  playerRank: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.md,
    color: Colors.warmBlack,
    width: 30,
  },
  playerAvatar: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  playerName: {
    flex: 1,
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.md,
    color: Colors.warmBlack,
  },
  playerScore: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.md,
    color: Colors.warmBlack,
  },
  footer: {
    marginBottom: Spacing.md,
  },
  countdownBox: {
    width: '100%',
    backgroundColor: Colors.primaryYellow,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  autoRandomBadge: {
    backgroundColor: Colors.paperWhite,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    marginBottom: Spacing.sm,
  },
  autoRandomBadgeText: {
    fontFamily: FontFamily.caveatBold,
    fontSize: FontSize.sm,
    color: Colors.warmBlack,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countdownTitle: {
    fontFamily: FontFamily.caveat,
    fontSize: FontSize.md,
    color: Colors.warmBlack,
  },
  countdownValue: {
    fontFamily: FontFamily.caveatBold,
    fontSize: FontSize.xxl,
    color: Colors.warmBlack,
    lineHeight: FontSize.xxl + 2,
  },
  countdownTopic: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.sm,
    color: Colors.warmBlack,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  miniLeaderboard: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  miniPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.paperWhite,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
    maxWidth: 150,
  },
  miniPlayerAvatar: {
    fontSize: 14,
  },
  miniPlayerName: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.xs,
    color: Colors.warmBlack,
    flex: 1,
  },
  miniPlayerScore: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.xs,
    color: Colors.warmBlack,
  },
  miniPlayerScorePositive: {
    color: '#4A9B6F',
  },
});
