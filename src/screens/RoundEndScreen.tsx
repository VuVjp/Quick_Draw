import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import firestore from '@react-native-firebase/firestore';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import AnimatedButton from '../components/AnimatedButton';
import NotebookBackground from '../components/NotebookBackground';
import { useGameStore, Player } from '../store/useGameStore';
import ReadOnlyCanvas from '../canvas/ReadOnlyCanvas';
import { useRoom } from '../hooks/useRoom';

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
  const { room, players: roomPlayers, uid } = useRoom(roomId);
  //const { advanceRound } = useHostGameMaster(roomId ?? '', 5);

  const isLastRound = currentRound >= rounds;
  const isSinglePlayer = !roomId || players.length <= 1;
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [countdown, setCountdown] = useState<number>(5);
  const countdownCommittedRef = useRef(false);
  const isOnline = !!roomId;
  const isHost = !!uid && !!room && uid === room.hostId;

  useEffect(() => {
    if (!isOnline || !room) return;

    if (room.status === 'drawing') {
      router.replace('/drawing' as any);
      return;
    }

    if (room.status === 'game_end') {
      const sorted = [...players].sort((a, b) => b.score - a.score);
      const top1Id = sorted[0]?.id;
      if (top1Id && uid && top1Id === uid) {
        router.replace('/win' as any);
      } else {
        router.replace('/lose' as any);
      }
    }
  }, [isOnline, room, router, players, uid]);

  useEffect(() => {
    const countdownActive = room?.status === 'round_countdown' || room?.status === 'round_end';
    if (!room || !countdownActive || !room.roundCountdownStartedAt) {
      setCountdown(5);
      countdownCommittedRef.current = false;
      return;
    }

    const tick = () => {
      const totalMs = (room.roundCountdownSecs ?? 5) * 1000;
      const elapsed = Date.now() - room.roundCountdownStartedAt!.getTime();
      const remain = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
      setCountdown(remain);
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [room]);

  useEffect(() => {
    if (!isHost || !roomId || !room) return;
    if (room.status !== 'round_end' && room.status !== 'round_countdown') return;
    if (countdown > 0) return;
    if (countdownCommittedRef.current) return;

    countdownCommittedRef.current = true;
    const roomRef = firestore().collection('rooms').doc(roomId);

    if (isLastRound) {
      roomRef.update({
        status: 'game_end',
        endedAt: firestore.FieldValue.serverTimestamp(),
      }).catch((e) => {
        countdownCommittedRef.current = false;
        console.error('[RoundEnd] failed to finish game after countdown', e);
      });
      return;
    }

    //   advanceRound(room.currentRound ?? currentRound, rounds, Object.keys(roomPlayers ?? {}))
    //     .catch((e) => {
    //       countdownCommittedRef.current = false;
    //       console.error('[RoundEnd] failed to advance round after countdown', e);
    //     });
    //
  }, [isHost, roomId, room, countdown, isLastRound, roomPlayers, currentRound, rounds]);

  // The first player in the sorted players list is Top 1
  const top1Player = players[0];

  const handleNext = () => {
    if (isOnline) return;

    if (isLastRound) {
      endGame();
      // Navigate to Win/Lose based on if local player is top 1 (mock logic)
      if (top1Player?.id === '1') {
        router.replace('/win');
      } else {
        router.replace('/lose');
      }
    } else {
      startRound();
      useGameStore.setState(s => ({ currentRound: s.currentRound + 1 }));
      router.replace('/drawing');
    }
  };

  const renderPlayer = ({ item, index }: { item: Player; index: number }) => {
    const isTop1 = index === 0;
    const pointsGained = lastRoundScores[item.id] || 0;
    return (
      <Animated.View
        entering={FadeInDown.delay(300 + index * 100).springify().damping(12)}
        style={[styles.playerRow, isTop1 && styles.top1Row]}
      >
        <Text style={styles.playerRank}>#{index + 1}</Text>
        {/* <Text style={styles.playerAvatar}>{item.avatar}</Text> */}
        <Image
          source={item.avatar === 'user' ? require('../../assets/images/anonymous.png') : { uri: item.avatar }}
          style={{ width: 30, height: 30, borderRadius: 15, marginRight: Spacing.sm }}
        />
        <Text style={styles.playerName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.playerScore}>+{pointsGained} đ</Text>
      </Animated.View>
    );
  };

  return (
    <NotebookBackground>
      <View style={styles.container}>
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <Text style={styles.title}>KẾT THÚC VÒNG {currentRound}/{rounds}</Text>
          <View style={styles.miniLeaderboard}>
            {players.map((p) => {
              const pts = lastRoundScores[p.id] || 0;
              return (
                <View key={p.id} style={styles.miniPlayerRow}>
                  {/* <Text style={styles.miniPlayerAvatar}>{p.avatar}</Text> */}
                  <Image
                    source={p.avatar === 'user' ? require('../../assets/images/anonymous.png') : { uri: p.avatar }}
                    style={{ width: 30, height: 30, borderRadius: 15, marginRight: Spacing.sm }}
                  />
                  <Text style={styles.miniPlayerName} numberOfLines={1}>{p.name}</Text>
                  <Text style={[styles.miniPlayerScore, pts > 0 && styles.miniPlayerScorePositive]}>
                    {pts > 0 ? `+${pts}đ` : `${pts}đ`}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={[styles.artworkContainer, { flex: 1 }]}>
          <Text style={styles.artworkTitle}>Tác phẩm xuất sắc nhất</Text>
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
              <ReadOnlyCanvas
                width={canvasSize.width}
                height={canvasSize.height}
                strokes={roundDrawing}
                originalCanvasSize={originalCanvasSize}
              />
            )}
            <View style={styles.artworkAuthorTag}>
              <Image
                source={top1Player?.avatar === 'user' ? require('../../assets/images/anonymous.png') : { uri: top1Player?.avatar }}
                style={{ width: 30, height: 30, borderRadius: 15, marginRight: Spacing.sm }}
              />
              <Text style={styles.artworkAuthorText}>{top1Player?.name}</Text>
            </View>

            {showLeaderboard && isSinglePlayer && (
              <View style={styles.leaderboardOverlay}>
                <Text style={styles.leaderboardTitle}>Bảng Xếp Hạng</Text>
                <FlatList
                  data={players}
                  renderItem={renderPlayer}
                  keyExtractor={item => item.id}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={styles.listContent}
                  style={{ width: '100%' }}
                />
              </View>
            )}

          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(800).springify()} style={styles.footer}>
          {isOnline && room?.status === 'round_countdown' && (
            <View style={styles.countdownBox}>
              <Text style={styles.countdownTitle}>Vòng mới bắt đầu sau</Text>
              <Text style={styles.countdownValue}>{countdown}</Text>
              <Text style={styles.countdownTopic}>Chủ đề: {room.currentTopic}</Text>
            </View>
          )}

          {isOnline && room?.status === 'round_end' && !isLastRound && (
            <View style={styles.countdownBox}>
              <View style={styles.autoRandomBadge}>
                <Text style={styles.autoRandomBadgeText}>Chủ đề tự động random</Text>
              </View>
              <Text style={styles.countdownTitle}>Vòng mới bắt đầu sau</Text>
              <Text style={styles.countdownValue}>{countdown}</Text>
              <Text style={styles.countdownTopic}>Tất cả người chơi sẽ vào cùng một chủ đề được hệ thống chọn ngẫu nhiên.</Text>
            </View>
          )}

          {isSinglePlayer && (
            <AnimatedButton
              label={showLeaderboard ? "Ẩn BXH" : "Hiện BXH"}
              onPress={() => setShowLeaderboard(!showLeaderboard)}
              variant="secondary"
              style={{ marginBottom: Spacing.md }}
              fullWidth
            />
          )}
          {!isOnline && (
            <AnimatedButton
              label={isLastRound ? "Kết thúc game" : "Vòng tiếp theo"}
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
  artworkAuthorText: {
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
