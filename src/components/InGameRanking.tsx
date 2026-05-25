import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useGameStore } from '../store/useGameStore';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, Radius, Shadow } from '../theme/spacing';

const InGameRanking = () => {
  const players = useGameStore(s => s.players);
  const isSinglePlayer = useGameStore(s => s.isSinglePlayer);
  const [expanded, setExpanded] = useState(false);

  // Không hiển thị nếu là chơi đơn hoặc chỉ có 1 người
  if (isSinglePlayer || players.length <= 1) return null;

  // Sắp xếp người chơi theo điểm giảm dần
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <View style={[styles.container, !expanded && styles.collapsed]}>
      <TouchableOpacity 
        style={[styles.header, !expanded && styles.headerCollapsed]} 
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.headerTitle}>🏆 Xếp hạng</Text>
        <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.list}>
          {sortedPlayers.map((p, index) => (
            <View key={p.id} style={styles.playerRow}>
              <Text style={styles.rankText}>#{index + 1}</Text>
              <Text style={styles.avatar}>{p.avatar}</Text>
              <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.score}>{p.score}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default InGameRanking;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    right: Spacing.xl,
    backgroundColor: Colors.paperWhite,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.sketch,
    zIndex: 100,
    width: 160,
  },
  collapsed: {
    width: 120, // Nhỏ hơn khi thu gọn
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
    borderRadius: Radius.md - 2, // Bo tròn cả góc dưới khi thu gọn
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
  score: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.sm,
    color: Colors.warmBlack,
  },
});
