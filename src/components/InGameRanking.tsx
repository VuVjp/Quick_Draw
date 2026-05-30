import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { useGameStore } from '../store/useGameStore';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, Radius, Shadow } from '../theme/spacing';
import { useLeaderboard } from '../hooks/useLeaderboard';

const InGameRanking = () => {
  const roomId = useGameStore(s => s.roomId);
  const localPlayers = useGameStore(s => s.players);
  const localLastRoundScores = useGameStore(s => s.lastRoundScores);
  const isSinglePlayer = useGameStore(s => s.isSinglePlayer);
  const { players: leaderboardPlayers } = useLeaderboard(roomId);
  const [expanded, setExpanded] = useState(false);

  const isOnline = !!roomId;
  const players = isOnline ? leaderboardPlayers : localPlayers;

  // Chỉ hiển thị ở chế độ online
  if (isSinglePlayer || players.length <= 1) return null;

  const sortedPlayers = isOnline
    ? players
    : [...players].sort((a, b) => b.score - a.score);

  return (
    <View style={[styles.container, !expanded && styles.collapsed]}>
      <TouchableOpacity
        style={[styles.header, !expanded && styles.headerCollapsed]}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.headerTitle}>🏆 Leaderboard</Text>
        <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.list}>
          {sortedPlayers.map((p: any, index) => {
            const playerId = p.uid ?? p.id;
            const playerName = p.displayName ?? p.name;
            const playerAvatar = p.avatar ?? 'user';
            const totalScore = p.score ?? 0;
            const gained = isOnline ? (p.gainedScore ?? 0) : (localLastRoundScores[playerId] ?? 0);
            const rank = isOnline ? (p.rank ?? index + 1) : index + 1;
            return (
              <View key={playerId} style={styles.playerRow}>
                <Text style={styles.rankText}>#{rank}</Text>
                <Image source={playerAvatar === 'user' ? require('../assets/user.png') : { uri: playerAvatar }} style={{ width: 24, height: 24, borderRadius: 12 }} />
                {/* <Text style={styles.avatar}>{playerAvatar === 'user' ? '👤' : playerAvatar}</Text> */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>{playerName}</Text>
                  <Text style={styles.totalScore}>Tổng: {totalScore}đ</Text>
                </View>
                <View style={styles.scoreCol}>
                  <Text style={styles.score}>{totalScore}</Text>
                  {gained != null && gained > 0 && (
                    <Text style={styles.gained}>+{gained}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default InGameRanking;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 160 : 140,
    right: Spacing.xl,
    backgroundColor: Colors.paperWhite,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.sketch,
    zIndex: 120,
    width: 160,
  },
  collapsed: {
    width: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    backgroundColor: Colors.primaryYellow,
    borderTopLeftRadius: Radius.md - 2,
    borderTopRightRadius: Radius.md - 2,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.border,
  },
  headerCollapsed: {
    borderRadius: Radius.md - 2,
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.md,
    color: Colors.warmBlack,
  },
  expandIcon: {
    fontSize: 10,
    color: Colors.warmBlack,
  },
  list: {
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  rankText: {
    fontFamily: FontFamily.caveatBold,
    fontSize: FontSize.sm,
    color: Colors.warmBlack,
    width: 22,
  },
  avatar: {
    fontSize: 16,
  },
  name: {
    flex: 1,
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.sm,
    color: Colors.warmBlack,
  },
  scoreCol: {
    alignItems: 'flex-end',
  },
  score: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.sm,
    color: Colors.warmBlack,
  },
  totalScore: {
    fontFamily: FontFamily.caveatBold,
    fontSize: FontSize.xs,
    color: Colors.warmBlack,
    opacity: 0.8,
  },
  gained: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.xs,
    color: '#4A9B6F',
  },
});


