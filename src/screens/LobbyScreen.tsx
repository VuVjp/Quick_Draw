import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import PaperCard from '../components/PaperCard';
import { useGameStore } from '../store/useGameStore';
import AnimatedButton from '../components/AnimatedButton';

const { height } = Dimensions.get('window');

type Room = { id: string; name: string; players: number; maxPlayers: number; color: 'default' | 'blue' | 'yellow'; isOwner?: boolean };

const RoomCard = React.memo(({ room, index, onJoin, onRemove }: { room: Room; index: number; onJoin: (room: Room) => void; onRemove: (id: string) => void }) => {
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
          <Text style={styles.roomName} numberOfLines={1}>{room.name}</Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {room.isOwner && (
              <AnimatedButton
                label="Hủy"
                onPress={() => onRemove(room.id)}
                variant="danger"
                style={styles.joinBtn}
                textStyle={styles.joinBtnText}
              />
            )}
            <AnimatedButton
              label={isFull ? 'Đầy' : 'Vào'}
              onPress={() => onJoin(room)}
              disabled={isFull}
              variant="ghost"
              style={styles.joinBtn}
              textStyle={styles.joinBtnText}
            />
          </View>
        </View>
      </PaperCard>
    </Animated.View>
  );
});
RoomCard.displayName = 'RoomCard';
const LobbyScreen = () => {
  const router = useRouter();
  const joinRoom = useGameStore((s) => s.joinRoom);
  const availableRooms = useGameStore((s) => s.availableRooms);
  const removeRoom = useGameStore((s) => s.removeRoom);

  const [username, setUsername] = useState('Khách');

  useEffect(() => {
    const loadUser = async () => {
      const token = await AsyncStorage.getItem('user_token');
      if (token) setUsername(token);
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user_token');
    router.replace('/home');
  };

  const handleJoin = useCallback((room: Room) => {
    joinRoom(room.id, room.name, room.players, room.maxPlayers);
    router.push('/drawing');
  }, [router, joinRoom]);

  const handleRemove = useCallback((id: string) => {
    removeRoom(id);
  }, [removeRoom]);

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
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.replace('/home')} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.title}>Phòng Chờ</Text>
            <Text style={styles.greetingText}>Xin chào, {username}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutBtnText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
        <AnimatedButton
          label="Tạo Phòng ➕"
          onPress={() => router.push('/create-room')}
          variant="primary"
          style={styles.createRoomBtn}
          textStyle={styles.createRoomBtnText}
        />
      </View>

      {/* Room list */}
      <FlatList
        data={availableRooms}
        renderItem={({ item, index }) => <RoomCard room={item} index={index} onJoin={handleJoin} onRemove={handleRemove} />}
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
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.paperWhite,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: 24,
    color: Colors.warmBlack,
    marginTop: -2,
  },
  greetingText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.md,
    color: Colors.border,
  },
  logoutBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.pastelRed,
    backgroundColor: Colors.paperWhite,
  },
  logoutBtnText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.sm,
    color: Colors.pastelRed,
  },
  title: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.xxl,
    color: Colors.warmBlack,
    textShadowColor: Colors.softGray,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  createRoomBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
  },
  createRoomBtnText: {
    fontSize: FontSize.md,
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
