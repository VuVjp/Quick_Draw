import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Radius } from '../theme/spacing';

type Props = {
  name: string;
  avatar: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  score?: number;
  isDrawing?: boolean;
  isHost?: boolean;
};

const SIZE_MAP = { sm: 36, md: 48, lg: 64 };
const FONT_MAP = { sm: 18, md: 24, lg: 36 };

const PlayerAvatar = ({ name, avatar, color, size = 'md', score, isDrawing, isHost }: Props) => {
  const dim = SIZE_MAP[size];
  const fontSz = FONT_MAP[size];

  return (
    <View style={styles.container}>
      <View style={[styles.ring, { borderColor: color ?? Colors.border, width: dim + 6, height: dim + 6, borderRadius: (dim + 6) / 2 }]}>
        <View style={[styles.avatar, { width: dim, height: dim, borderRadius: dim / 2 }]}>
          <Text style={{ fontSize: fontSz }}>{avatar}</Text>
        </View>
      </View>
      {isDrawing && <View style={styles.drawingBadge}><Text style={styles.drawingText}>✏️</Text></View>}
      {isHost && <View style={styles.hostBadge}><Text style={styles.hostText}>👑</Text></View>}
      {size !== 'sm' && (
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
      )}
      {score !== undefined && (
        <Text style={styles.score}>{score} pts</Text>
      )}
    </View>
  );
};

export default React.memo(PlayerAvatar);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  ring: {
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.notebookWhite,
  },
  avatar: {
    backgroundColor: Colors.paperWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  drawingBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  hostBadge: {
    position: 'absolute',
    top: -8,
    right: -4,
  },
  drawingText: { fontSize: 14 },
  hostText: { fontSize: 14 },
  name: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.sm,
    color: Colors.warmBlack,
    maxWidth: 70,
    textAlign: 'center',
  },
  score: {
    fontFamily: FontFamily.caveatBold,
    fontSize: FontSize.sm,
    color: Colors.warmBlack,
    opacity: 0.7,
  },
});
