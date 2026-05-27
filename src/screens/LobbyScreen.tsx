import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, Modal, KeyboardAvoidingView, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import PaperCard from '../components/PaperCard';
import { useGameStore } from '../store/useGameStore';
import AnimatedButton from '../components/AnimatedButton';
import { usePublicRooms, RoomItem } from '../hooks/usePublicRooms';
import { ActivityIndicator } from 'react-native';
import { useJoinRoom } from '../hooks/useJoinRoom';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const { height } = Dimensions.get('window');

// Đổi type Room
type Room = RoomItem & { color: 'blue' | 'yellow' | 'default' };
// Màu card theo index
const CARD_COLORS: Array<'blue' | 'yellow' | 'default'> = ['blue', 'default', 'yellow', 'default'];

// Match reference exactly
const MOCK_ROOMS_REF = [
  { id: '1', name: 'Doodle to Win ', players: 4, maxPlayers: 8, color: 'blue' as const },
  { id: '2', name: 'Nét Vẽ Chết Chóc ', players: 2, maxPlayers: 8, color: 'default' as const },
  { id: '5', name: 'Chiến Thần Hội Họa ', players: 8, maxPlayers: 8, color: 'yellow' as const },
  { id: '34', name: 'Vẽ Hay Hoặc Chết ', players: 1, maxPlayers: 8, color: 'default' as const },
];

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
  const insets = useSafeAreaInsets();
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

  const handleRemove = useCallback((id: string) => {
    removeRoom(id);
  }, [removeRoom]);
  const { joinRoomByCode, loading: joinLoading, error: joinError } = useJoinRoom();
  const [modalVisible, setModalVisible] = useState(false);
  const [roomCode, setRoomCode] = useState('');

  const { rooms, loading } = usePublicRooms();

  const roomsWithColor: Room[] = rooms.map((room, index) => ({
    ...room,
    color: CARD_COLORS[index % CARD_COLORS.length],
  }));

  const handleJoin = useCallback(async (roomId: string) => {
    const uid = auth().currentUser?.uid || 'user_001';
    const username = await AsyncStorage.getItem('user_token') || 'Player 1';
    try {
      await firestore()
        .collection('rooms')
        .doc(roomId)
        .collection('players')
        .doc(uid)
        .set({
          displayName: username,
          score: 0,
          isOnline: true,
          joinedAt: firestore.FieldValue.serverTimestamp(),
        });
      router.push(`/room/${roomId}`);
    } catch (e) {
      console.error('[handleJoin]', e);
    }
  }, [router]);

  const handleJoinByCode = async () => {
    const uid = auth().currentUser?.uid || 'user_001';
    const username = await AsyncStorage.getItem('user_token') || 'Player 1';
    const result = await joinRoomByCode(
      roomCode,
      uid,
      username,
    );
    if (result) {
      setModalVisible(false);
      setRoomCode('');
      router.push(`/room/${result.roomId}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hand-drawn style background texture lines */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: Math.floor(height / 40) }).map((_, i) => (
          <View key={i} style={[styles.paperLine, { top: 40 + i * 40 }]} />
        ))}
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
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
        <View style={styles.headerButtons}>
          <AnimatedButton
            label="Tạo Phòng ➕"
            onPress={() => router.push('/create-room')}
            variant="primary"
            style={styles.createRoomBtn}
            textStyle={styles.createRoomBtnText}
          />
          <AnimatedButton
            label="Nhập mã 🔑"
            onPress={() => setModalVisible(true)}
            variant="ghost"
            style={styles.joinCodeBtn}
            textStyle={styles.createRoomBtnText}
          />
        </View>
      </View>

      {loading && (
        <ActivityIndicator
          size="large"
          color={Colors.primaryYellow}
          style={{ marginTop: 40 }}
        />
      )}
      {/* Room list */}
      <FlatList
        data={roomsWithColor}
        renderItem={({ item, index }) => <RoomCard room={item} index={index} onJoin={handleJoin} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.xl }} />}
      />
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            {/* Title */}
            <Text style={styles.modalTitle}>Nhập mã phòng</Text>
            <Text style={styles.modalHint}>Hỏi chủ phòng để lấy mã 6 ký tự</Text>

            {/* Input */}
            <TextInput
              style={styles.codeInput}
              value={roomCode}
              onChangeText={(t) => setRoomCode(t.toUpperCase().trim())}
              placeholder="ABC123"
              placeholderTextColor={Colors.softGray}
              maxLength={6}
              autoCapitalize="characters"
              autoFocus
              returnKeyType="go"
              onSubmitEditing={() => {
                if (roomCode.length >= 6 && !joinLoading) {
                  handleJoinByCode();
                }
              }}
            />

            {/* Error */}
            {joinError && (
              <Text style={styles.errorText}>{joinError}</Text>
            )}

            {/* Buttons */}
            <View style={[styles.modalButtons, { justifyContent: 'center' }]}>
              <AnimatedButton
                label="Huỷ"
                onPress={() => {
                  setModalVisible(false);
                  setRoomCode('');
                }}
                variant="ghost"
                style={{ paddingVertical: 10, paddingHorizontal: 20 }}
                textStyle={{ fontSize: 16 }}
              />
              <AnimatedButton
                label={joinLoading ? 'Đang vào...' : 'Vào phòng →'}
                onPress={handleJoinByCode}
                disabled={roomCode.length < 6 || joinLoading}
                variant="primary"
                style={{ paddingVertical: 10, paddingHorizontal: 20 }}
                textStyle={{ fontSize: 16 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingTop: Spacing.md,
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
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.xl,
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
  },
  headerButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  joinCodeBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.paperWhite,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  modalTitle: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.xxl,
    color: Colors.warmBlack,
    textAlign: 'center',
  },
  modalHint: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg,
    color: Colors.warmBlack,
    opacity: 0.6,
    textAlign: 'center',
  },
  codeInput: {
    fontFamily: FontFamily.patrickHand,
    fontSize: 36,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderColor: Colors.primaryYellow,
    paddingVertical: Spacing.sm,
    color: Colors.warmBlack,
    width: '80%',
    alignSelf: 'center',
  },
  errorText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg,
    color: Colors.pastelRed,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  modalBtn: {
    paddingVertical: Spacing.sm,
  },
});
