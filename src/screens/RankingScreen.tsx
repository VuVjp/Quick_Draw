import React from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MainTabParamList } from '../navigation/MainTabs';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import PaperCard from '../components/PaperCard';

const { height } = Dimensions.get('window');

const MOCK_RANKINGS = [
  { id: '1', rank: 1, name: 'Họa Sĩ Mèo', title1: 'Huyền Thoại', title2: 'Doodle', score: '15,420', avatar: '👨‍🎨', color: 'yellow' as const },
  { id: '2', rank: 2, name: 'Vẽ Bầu Ba', title1: 'Cao thủ', title2: 'Sketch', score: '14,890', avatar: '👩‍🎨', color: 'blue' as const },
  { id: '3', rank: 3, name: 'Cô Xinh Xắn', title1: 'Nghệ sĩ', title2: 'Tiềm năng', score: '13,200', avatar: '👧', color: 'pink' as const },
  { id: '4', rank: 4, name: 'Tân Binh', title1: 'Người mới', title2: '', score: '10,500', avatar: '🧑', color: 'default' as const },
];

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'RankingTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

const RankingCard = React.memo(({ item, index }: { item: typeof MOCK_RANKINGS[0]; index: number }) => {
  const isTop3 = item.rank <= 3;
  const rotate = index % 2 === 0 ? '-1deg' : '1deg';

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify().damping(14)}>
      <PaperCard style={styles.rankCard} variant={item.color} rotate={isTop3 ? rotate : undefined}>
        <View style={styles.rankContent}>
          
          <View style={styles.rankBadge}>
            <Text style={[styles.rankBadgeText, !isTop3 && { color: Colors.warmBlack }]}>
              #{item.rank}
            </Text>
          </View>

          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>{item.avatar}</Text>
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.playerName}>{item.name}</Text>
            <View style={styles.titlesRow}>
              <Text style={styles.playerTitle}>{item.title1}</Text>
              {item.title2 ? <Text style={styles.playerTitle}>{item.title2}</Text> : null}
            </View>
          </View>

          <View style={styles.scoreCol}>
            <Text style={styles.scoreValue}>{item.score}</Text>
            <Text style={styles.scoreLabel}>🏆 Thắng</Text>
          </View>
          
        </View>
      </PaperCard>
    </Animated.View>
  );
});
RankingCard.displayName = 'RankingCard';

const RankingScreen = ({ navigation }: Props) => {
  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: Math.floor(height / 40) }).map((_, i) => (
          <View key={i} style={[styles.paperLine, { top: 40 + i * 40 }]} />
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bảng xếp hạng</Text>
        <View style={styles.headerLines}>
          <View style={styles.hLine} />
          <View style={[styles.hLine, { marginTop: 4, width: '90%' }]} />
        </View>
      </View>

      {/* List */}
      <FlatList
        data={MOCK_RANKINGS}
        renderItem={({ item, index }) => <RankingCard item={item} index={index} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.xl }} />}
      />
    </View>
  );
};

export default RankingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.notebookWhite,
  },
  paperLine: {
    position: 'absolute', left: 0, right: 0, height: 1,
    borderBottomWidth: 1, borderBottomColor: Colors.softGray, borderStyle: 'dashed', opacity: 0.5,
  },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#F3E5AB', // Torn yellow paper effect color
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 20,
    marginBottom: Spacing.lg,
  },
  backBtn: {
    position: 'absolute',
    top: 60,
    left: Spacing.lg,
    backgroundColor: Colors.primaryYellow,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    transform: [{ rotate: '-5deg' }],
  },
  backBtnText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg,
  },
  title: {
    fontFamily: FontFamily.indieFlower,
    fontSize: 32,
    color: Colors.warmBlack,
  },
  headerLines: {
    alignItems: 'center',
    width: '60%',
    marginTop: 4,
  },
  hLine: {
    height: 2,
    width: '100%',
    backgroundColor: Colors.warmBlack,
    borderRadius: 2,
  },
  list: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100,
  },
  rankCard: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  rankContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.paperWhite,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  rankBadgeText: {
    fontFamily: FontFamily.caveatBold,
    fontSize: FontSize.md,
    color: Colors.pastelRed, // Red for top 3
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.paperWhite,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatar: {
    fontSize: 24,
  },
  infoCol: {
    flex: 1,
  },
  playerName: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg,
    color: Colors.warmBlack,
  },
  titlesRow: {
    flexDirection: 'column',
  },
  playerTitle: {
    fontFamily: FontFamily.caveat,
    fontSize: FontSize.sm,
    color: Colors.warmBlack,
    opacity: 0.7,
  },
  scoreCol: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg,
    color: Colors.warmBlack,
  },
  scoreLabel: {
    fontFamily: FontFamily.caveat,
    fontSize: FontSize.xs,
    color: Colors.warmBlack,
  },
});
