import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList } from 'react-native';
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
import { Spacing, Radius, Shadow } from '../theme/spacing';
import AnimatedButton from '../components/AnimatedButton';
import NotebookBackground from '../components/NotebookBackground';
import { useGameStore } from '../store/useGameStore';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useRoom } from '../hooks/useRoom';
import { useHostGameLifecycle } from '../hooks/useHostGameLifecycle';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

const formatDuration = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const remaining = safeSeconds % 60;
    if (minutes <= 0) {
        return `${remaining}s`;
    }
    return `${minutes}m ${remaining.toString().padStart(2, '0')}s`;
};

const getPlayerId = (player: any) => player?.uid ?? player?.id;
const getPlayerName = (player: any) => player?.displayName ?? player?.name ?? 'Unknown';

const WinScreen = () => {
    const router = useRouter();
    const leaveRoom = useGameStore((s) => s.leaveRoom);
    const roomId = useGameStore((s) => s.roomId);
    const roomName = useGameStore((s) => s.roomName);
    const players = useGameStore((s) => s.players);
    const rounds = useGameStore((s) => s.rounds);
    const roundResults = useGameStore((s) => s.roundResults);
    const { room, uid } = useRoom(roomId);
    const { manualReset } = useHostGameLifecycle(roomId);
    const { players: leaderboardPlayers } = useLeaderboard(roomId);
    const isSinglePlayer = useGameStore((s) => s.isSinglePlayer);

    const isOnline = !!roomId;
    const [countdown, setCountdown] = useState(10);

    const containerScale = useSharedValue(0.8);
    const opacity = useSharedValue(0);
    const star1Y = useSharedValue(0);
    const star2Y = useSharedValue(0);

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 400 });
        containerScale.value = withSpring(1, { damping: 12 });
        star1Y.value = withRepeat(withTiming(-10, { duration: 1500 }), -1, true);
        star2Y.value = withDelay(500, withRepeat(withTiming(-15, { duration: 2000 }), -1, true));
    }, [containerScale, opacity, star1Y, star2Y]);

    useEffect(() => {
        if (!isOnline) {
            setCountdown(10);
            return;
        }

        // If this client is the host and the room is stuck at game_end (host may have navigated away),
        // attempt a manual reset to ensure the room transitions back to waiting.
        if (countdown <= 0 && room?.hostId === uid && room?.status === 'game_end') {
            void manualReset();
        }

        const tick = () => {
            if (!room?.endedAt) {
                setCountdown(10);
                return;
            }

            const elapsedSeconds = Math.floor((Date.now() - room.endedAt.getTime()) / 1000);
            setCountdown(Math.max(0, 10 - elapsedSeconds));
        };
        if (room?.status === 'waiting') {
            setCountdown(0);
            router.replace(`/room/${roomId}`);
            return;
        }

        tick();
        const timer = setInterval(tick, 250);
        return () => clearInterval(timer);
    }, [isOnline, room?.endedAt, room, manualReset, roomId, router, uid, countdown]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: containerScale.value }],
    }));

    const s1Style = useAnimatedStyle(() => ({ transform: [{ translateY: star1Y.value }] }));
    const s2Style = useAnimatedStyle(() => ({ transform: [{ translateY: star2Y.value }] }));

    const onlinePlayers = leaderboardPlayers.length > 0 ? leaderboardPlayers : players;
    const sortedOnlinePlayers = useMemo(
        () => [...onlinePlayers].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
        [onlinePlayers]
    );
    const myRank = useMemo(() => {
        if (!isOnline) return null;
        const index = sortedOnlinePlayers.findIndex((player) => getPlayerId(player) === uid);
        return index >= 0 ? index + 1 : null;
    }, [isOnline, sortedOnlinePlayers, uid]);

    const localPlayer = players[0];
    const localScore = localPlayer?.score ?? 0;

    const renderOnlinePlayer = ({ item, index }: { item: any; index: number }) => {
        const playerId = getPlayerId(item);
        const isMe = playerId === uid;
        return (
            <View style={[styles.leaderRow, isMe && styles.leaderRowMe]}>
                <Text style={styles.leaderRank}>#{index + 1}</Text>
                <Text style={styles.leaderName} numberOfLines={1}>{getPlayerName(item)}</Text>
                <Text style={styles.leaderScore}>{item.score ?? 0} đ</Text>
            </View>
        );
    };

    const renderRoundResult = ({ item }: { item: any }) => (
        <View style={styles.roundCard}>
            <View style={styles.roundHeader}>
                <Text style={styles.roundTitle}>Round {item.round}</Text>
                <Text style={[styles.roundBadge, item.aiCorrect ? styles.roundBadgeSuccess : styles.roundBadgeFail]}>
                    {item.aiCorrect ? 'AI guessed correctly' : 'AI guessed incorrectly'}
                </Text>
            </View>
            <Text style={styles.roundWord}>Topic: {item.word}</Text>
            <Text style={styles.roundMeta}>Drawing Time: {formatDuration(item.timeSpent)} / {formatDuration(item.drawTime)}</Text>
            <Text style={styles.roundMeta}>Guess: {item.aiLabel ?? 'None'}</Text>
            {/* {item.aiScore != null && (
        <Text style={styles.roundMeta}>Confidence: {(item.aiScore * 100).toFixed(1)}%</Text>
      )} */}
        </View>
    );

    if (!isSinglePlayer) {
        return (
            <NotebookBackground>
                <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
                    <View style={styles.shell}>
                        <Animated.View style={[styles.mainFrame, styles.onlineFrame, containerStyle]}>
                            <Animated.Text style={[styles.star1, s1Style]}>⭐</Animated.Text>
                            <Animated.Text style={[styles.star2, s2Style]}>⭐</Animated.Text>
                            <View style={styles.circle1} />
                            <View style={styles.circle2} />

                            <Text style={styles.trophy}>🏆</Text>
                            <Text style={styles.title}>GAME RESULTS</Text>
                            <Text style={styles.subtitle}>{roomName || room?.roomName || 'Final Leaderboard'}</Text>

                            <View style={styles.rankCard}>
                                <Text style={styles.rankLabel}>Your Rank</Text>
                                <Text style={styles.rankValue}>#{myRank ?? '-'}</Text>
                                <Text style={styles.rankHint}>
                                    {room?.status === 'waiting'
                                        ? 'Room is waiting, you can rejoin the lobby.'
                                        : `Room will be waiting in ${countdown}s`}
                                </Text>
                            </View>

                            <View style={styles.listBlock}>
                                <Text style={styles.sectionTitle}>Final Leaderboard</Text>
                                <FlatList
                                    data={sortedOnlinePlayers.slice(0, 6)}
                                    renderItem={renderOnlinePlayer}
                                    keyExtractor={(item: any) => String(getPlayerId(item))}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.flatListContent}
                                    style={styles.flatList}
                                />
                            </View>

                            <View style={styles.actions}>
                                <AnimatedButton
                                    label="Back to Lobby"
                                    onPress={() => {
                                        leaveRoom();
                                        router.replace('/lobby');
                                    }}
                                    variant="ghost"
                                    style={styles.actionBtn}
                                    textStyle={styles.btnText}
                                />
                            </View>
                        </Animated.View>
                    </View>
                </SafeAreaView>
            </NotebookBackground>
        );
    }

    return (
  <NotebookBackground>
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.shell}>
        <Animated.View
          style={[styles.mainFrame, styles.offlineFrame, containerStyle]}
        >
          <Animated.Text style={[styles.star1, s1Style]}>⭐</Animated.Text>
          <Animated.Text style={[styles.star2, s2Style]}>⭐</Animated.Text>

          <View style={styles.circle1} />
          <View style={styles.circle2} />

          <FlatList
            style={styles.flatList}
            showsVerticalScrollIndicator={false}
            data={
            roundResults.length > 0
                ? roundResults
                : ([{ round: 0, empty: true }] as any)
            }
            keyExtractor={(item: any, index) =>
              String(item.round ?? index)
            }
            ListHeaderComponent={
                 <View style={styles.listHeader}>
              <>
                <Text style={styles.trophy}>🏆</Text>

                <Text style={styles.title}>Result</Text>

                <Text style={styles.subtitle}>
                  Round-by-round results
                </Text>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>
                    Total Score
                  </Text>

                  <Text style={styles.summaryValue}>
                    {localScore} points
                  </Text>

                  <Text style={styles.summaryHint}>
                    {roundResults.length}/{rounds} rounds completed
                  </Text>
                </View>

                <Text style={styles.sectionTitle}>
                  Round Details
                </Text>
              </>
              </View>
            }
            renderItem={({ item }) => {
              if ((item as any).empty) {
                return (
                  <View style={styles.roundCard}>
                    <Text style={styles.roundTitle}>
                      No round data available
                    </Text>

                    <Text style={styles.roundMeta}>
                      Play again to see the results for each round.
                    </Text>
                  </View>
                );
              }

              return renderRoundResult({ item } as any);
            }}
            contentContainerStyle={styles.flatListContent}
          />

          <View style={styles.actions}>
            <AnimatedButton
              label="Play Again"
              onPress={() => {
                leaveRoom();
                router.replace('/single-player-config');
              }}
              variant="ghost"
              style={styles.actionBtn}
              textStyle={styles.btnText}
            />

            <AnimatedButton
              label="Main Menu"
              onPress={() => {
                leaveRoom();
                router.dismissAll();
                router.replace('/home');
              }}
              variant="ghost"
              style={styles.actionBtn}
              textStyle={styles.btnText}
            />
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  </NotebookBackground>
);
};

export default WinScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    shell: {
        flex: 1,
        padding: Spacing.xl,
    },
    mainFrame: {
        width: '100%',
        flex: 1,
        backgroundColor: Colors.paperWhite,
        borderRadius: 44,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: 'center',
        paddingTop: 56,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
        ...Shadow.sketch,
    },
    offlineFrame: {
  minHeight: height * 0.87,
  paddingBottom: 0, // bỏ padding dưới
},
    onlineFrame: {
        minHeight: height * 0.87,
    },
    star1: { position: 'absolute', top: 120, right: 40, fontSize: 24 },
    star2: { position: 'absolute', top: 220, left: 30, fontSize: 18 },
    circle1: {
        position: 'absolute',
        top: 80,
        left: 50,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.border,
    },
    circle2: {
        position: 'absolute',
        bottom: 150,
        right: 50,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primaryYellow,
        borderWidth: 1,
        borderColor: Colors.border,
    },
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
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontFamily: FontFamily.caveat,
        fontSize: FontSize.md,
        color: Colors.warmBlack,
        opacity: 0.75,
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    summaryCard: {
        width: '100%',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: Radius.lg,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: 'center',
        backgroundColor: Colors.notebookWhite,
        marginBottom: Spacing.lg,
    },
    summaryLabel: {
        fontFamily: FontFamily.caveat,
        fontSize: FontSize.md,
        color: Colors.warmBlack,
    },
    summaryValue: {
        fontFamily: FontFamily.patrickHand,
        fontSize: 34,
        color: Colors.warmBlack,
    },
    summaryHint: {
        fontFamily: FontFamily.caveatBold,
        fontSize: FontSize.sm,
        color: Colors.warmBlack,
        opacity: 0.8,
    },
    rankCard: {
        width: '100%',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: Radius.lg,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: 'center',
        marginBottom: Spacing.lg,
        backgroundColor: Colors.notebookWhite,
    },
    rankLabel: {
        fontFamily: FontFamily.caveatBold,
        fontSize: FontSize.sm,
        color: Colors.warmBlack,
    },
    rankValue: {
        fontFamily: FontFamily.patrickHand,
        fontSize: 36,
        lineHeight: 38,
        color: Colors.warmBlack,
    },
    rankHint: {
        marginTop: 4,
        fontFamily: FontFamily.caveat,
        fontSize: FontSize.sm,
        color: Colors.warmBlack,
        opacity: 0.8,
        textAlign: 'center',
    },
    leaderboardCard: {
        width: '100%',
        borderWidth: 2,
        borderColor: Colors.border,
        borderRadius: Radius.lg,
        backgroundColor: Colors.paperWhite,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
    width: '100%',
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg,
    color: Colors.warmBlack,
    marginBottom: Spacing.sm,
    },
    listBlock: {
        flex: 1,
        width: '100%',
        marginBottom: Spacing.md,
    },
    flatList: {
    flex: 1,
    width: '100%',
    },
    flatListContent: {
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    },
    leaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: Radius.md,
    },
    leaderRowMe: {
        backgroundColor: Colors.primaryYellow,
    },
    leaderRank: {
        fontFamily: FontFamily.patrickHand,
        fontSize: FontSize.sm,
        color: Colors.warmBlack,
        width: 36,
    },
    leaderName: {
        flex: 1,
        fontFamily: FontFamily.patrickHand,
        fontSize: FontSize.md,
        color: Colors.warmBlack,
    },
    leaderScore: {
        fontFamily: FontFamily.patrickHand,
        fontSize: FontSize.md,
        color: Colors.warmBlack,
    },
    roundList: {
        width: '100%',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    roundCard: {
        width: '100%',
        borderWidth: 2,
        borderColor: Colors.border,
        borderRadius: Radius.lg,
        backgroundColor: Colors.paperWhite,
        padding: Spacing.md,
        gap: 4,
    },
    roundHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.sm,
    },
    roundTitle: {
        fontFamily: FontFamily.patrickHand,
        fontSize: FontSize.lg,
        color: Colors.warmBlack,
    },
    roundBadge: {
        fontFamily: FontFamily.caveatBold,
        fontSize: FontSize.sm,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Radius.full,
        overflow: 'hidden',
    },
    roundBadgeSuccess: {
        backgroundColor: Colors.successGreen,
        color: Colors.warmBlack,
    },
    roundBadgeFail: {
        backgroundColor: Colors.lightPink,
        color: Colors.warmBlack,
    },
    roundWord: {
        fontFamily: FontFamily.caveatBold,
        fontSize: FontSize.md,
        color: Colors.warmBlack,
    },
    roundMeta: {
        fontFamily: FontFamily.caveat,
        fontSize: FontSize.md,
        color: Colors.warmBlack,
    },
    actions: {
    width: '100%',
    gap: Spacing.md,

    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    },
    actionBtn: {
        paddingVertical: Spacing.sm,
        borderRadius: Radius.full,
        width: '100%',
    },
    btnText: {
        fontSize: FontSize.md,
    },
    listHeader: {
  width: '100%',
  alignItems: 'center',
},
});
