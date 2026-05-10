import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
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
import { useGameStore } from '../store/useGameStore';
import AnimatedButton from '../components/AnimatedButton';

const { height } = Dimensions.get('window');

// Match reference exactly
const MOCK_ROOMS_REF = [
  { id: '1', name: 'Vẽ Con Chó', players: 4, maxPlayers: 8, color: 'blue' as const },
  { id: '2', name: 'Học Sinh', players: 2, maxPlayers: 8, color: 'default' as const },
  { id: '5', name: 'Siêu Anh Hùng', players: 8, maxPlayers: 8, color: 'yellow' as const },
  { id: '34', name: 'Unknown', players: 1, maxPlayers: 8, color: 'default' as const },
];

type Room = typeof MOCK_ROOMS_REF[0];
type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'LobbyTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

const RoomCard = React.memo(({ room, index, onJoin }: { room: Room; index: number; onJoin: () => void }) => {
  const isFull = room.players >= room.maxPlayers;
  const rotate = index % 2 === 0 ? '-1deg' : '1deg';

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify().damping(14)}>
      <PaperCard style={styles.roomCardWrapper} variant={room.color} rotate={rotate}>
        <View style={styles.cardTop}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>#{room.id.padStart(2, '0')}</Text>
          </View>
          <Text style={styles.playerCount}>
            👤 {room.players}/{room.maxPlayers}{isFull ? ' (Full)' : ''}
          </Text>
        </View>

        <View style={styles.cardBottom}>
          <Text style={styles.roomName}>{room.name}</Text>
          <AnimatedButton
            label={isFull ? 'Đầy' : 'Vào'}
            onPress={onJoin}
            disabled={isFull}
            variant="ghost"
            style={styles.joinBtn}
            textStyle={styles.joinBtnText}
          />
        </View>
      </PaperCard>
    </Animated.View>
  );
});
RoomCard.displayName = 'RoomCard';

const LobbyScreen = ({ navigation }: Props) => {
  const joinRoom = useGameStore((s) => s.joinRoom);

  const handleJoin = useCallback(() => {
    // Navigate directly to Drawing screen
    navigation.navigate('Drawing');
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Hand-drawn style background texture lines */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: Math.floor(height / 40) }).map((_, i) => (
          <View key={i} style={[styles.paperLine, { top: 40 + i * 40 }]} />
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Phòng Chờ</Text>
      </View>

      {/* Room list */}
      <FlatList
        data={MOCK_ROOMS_REF}
        renderItem={({ item, index }) => <RoomCard room={item} index={index} onJoin={handleJoin} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.xl }} />}
      />
    </View>
  );
};

export default LobbyScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.notebookWhite 
  },
  paperLine: {
    position: 'absolute', left: 0, right: 0, height: 1,
    backgroundColor: Colors.softGray, opacity: 0.5,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.xxl,
    color: Colors.warmBlack,
    textShadowColor: Colors.softGray,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  list: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
    paddingBottom: 100,
  },
  roomCardWrapper: {
    padding: Spacing.lg,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  tag: {
    backgroundColor: Colors.paperWhite,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  tagText: {
    fontFamily: FontFamily.caveatBold,
    fontSize: FontSize.xs,
    color: Colors.warmBlack,
  },
  playerCount: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.sm,
    color: Colors.warmBlack,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomName: {
    flex: 1,
    fontFamily: FontFamily.indieFlower,
    fontSize: FontSize.xl + 4,
    color: Colors.warmBlack,
    lineHeight: 36,
  },
  joinBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.paperWhite,
    borderRadius: Radius.md, // slightly more square as in ref
    minWidth: 80,
  },
  joinBtnText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.patrickHand,
  }
});
