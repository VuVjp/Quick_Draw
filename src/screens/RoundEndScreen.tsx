import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import AnimatedButton from '../components/AnimatedButton';
import NotebookBackground from '../components/NotebookBackground';
import { useGameStore, Player } from '../store/useGameStore';
import ReadOnlyCanvas from '../canvas/ReadOnlyCanvas';

const { width, height } = Dimensions.get('window');

const CANVAS_WIDTH = width - Spacing.xl * 2 - 32; // padding inside card
const CANVAS_HEIGHT = height * 0.45; // make canvas taller to match drawing screen better

const RoundEndScreen = () => {
  const router = useRouter();
  const currentRound = useGameStore((s) => s.currentRound);
  const rounds = useGameStore((s) => s.rounds);
  const players = useGameStore((s) => s.players);
  const roundDrawing = useGameStore((s) => s.roundDrawing);
  const startRound = useGameStore((s) => s.startRound);
  const endGame = useGameStore((s) => s.endGame);

  const isLastRound = currentRound >= rounds;
  const isSinglePlayer = players.length <= 1;
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  // The first player in the sorted players list is Top 1
  const top1Player = players[0];

  const handleNext = () => {
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
    return (
      <Animated.View 
        entering={FadeInDown.delay(300 + index * 100).springify().damping(12)}
        style={[styles.playerRow, isTop1 && styles.top1Row]}
      >
        <Text style={styles.playerRank}>#{index + 1}</Text>
        <Text style={styles.playerAvatar}>{item.avatar}</Text>
        <Text style={styles.playerName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.playerScore}>{item.score} đ</Text>
      </Animated.View>
    );
  };

  return (
    <NotebookBackground>
      <View style={styles.container}>
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <Text style={styles.title}>KẾT THÚC VÒNG {currentRound}/{rounds}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={[styles.artworkContainer, { flex: 1 }]}>
          <Text style={styles.artworkTitle}>Tác phẩm xuất sắc nhất</Text>
          <View style={styles.canvasWrapper}>
            <ReadOnlyCanvas width={CANVAS_WIDTH} height={CANVAS_HEIGHT} strokes={roundDrawing} />
            <View style={styles.artworkAuthorTag}>
              <Text style={styles.artworkAuthorText}>{top1Player?.avatar} {top1Player?.name}</Text>
            </View>

            {showLeaderboard && !isSinglePlayer && (
              <View style={styles.leaderboardOverlay}>
                <Text style={styles.leaderboardTitle}>Bảng Xếp Hạng</Text>
                <FlatList
                  data={players}
                  renderItem={renderPlayer}
                  keyExtractor={item => item.id}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={styles.listContent}
                  style={{ flex: 1 }}
                />
              </View>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(800).springify()} style={styles.footer}>
          {!isSinglePlayer && (
            <AnimatedButton
              label={showLeaderboard ? "Ẩn Bảng Xếp Hạng" : "Xem Bảng Xếp Hạng"}
              onPress={() => setShowLeaderboard(!showLeaderboard)}
              variant="secondary"
              style={{ marginBottom: Spacing.md }}
              fullWidth
            />
          )}
          <AnimatedButton
            label={isLastRound ? "Kết thúc game" : "Vòng tiếp theo"}
            onPress={handleNext}
            variant="primary"
            fullWidth
          />
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
    padding: 8,
    backgroundColor: Colors.paperWhite,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 4,
  },
  artworkAuthorTag: {
    position: 'absolute',
    bottom: -12,
    backgroundColor: Colors.primaryYellow,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  artworkAuthorText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.sm,
    color: Colors.warmBlack,
  },
  leaderboardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 253, 248, 0.96)', // matches Colors.paperWhite with transparency
    borderRadius: Radius.lg,
    padding: Spacing.md,
    zIndex: 10,
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
});
