import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, Modal, KeyboardAvoidingView, TextInput, Platform, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import PaperCard from '../components/PaperCard';
import { useGameStore } from '../store/useGameStore';
import AnimatedButton from '../components/AnimatedButton';
import { usePublicRooms, RoomItem } from '../hooks/usePublicRooms';
import { useJoinRoom } from '../hooks/useJoinRoom';
import { useUserStore } from '../store/useUserStore';
import { Ionicons } from '@expo/vector-icons';
import { playClick } from '../store/useAudioStore';

const { height } = Dimensions.get('window');

// Đổi type Room
type Room = RoomItem & { color: 'blue' | 'yellow' | 'default'; isOwner?: boolean; code: string };
// Màu card theo index
const CARD_COLORS: ('blue' | 'yellow' | 'default')[] = ['blue', 'default', 'yellow', 'default'];

const RoomCard = React.memo(({ room, index, onJoin, onRemove }: { room: Room; index: number; onJoin: (r: Room) => void; onRemove?: (id: string) => void }) => {
  const isFull = room.players >= room.maxPlayers;
  const rotate = index % 2 === 0 ? '-1deg' : '1deg';
  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify().damping(14)}>
      <PaperCard style={styles.roomCardWrapper} variant={room.color} rotate={rotate}>
        <View style={styles.cardTop}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>#{room.code.padStart(2, '0')}</Text>
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
                label="Cancel"
                onPress={() => onRemove?.(room.id)}
                variant="danger"
                style={styles.joinBtn}
                textStyle={styles.joinBtnText}
              />
            )}
            <AnimatedButton
              label={isFull ? 'Full' : 'Join'}
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
  const setRoomConfig = useGameStore((s) => s.setRoomConfig);
  const removeRoom = useGameStore((s) => s.removeRoom);

  const session = useUserStore((s) => s.session);
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.warn('Logout failed', e);
    } finally {
      router.replace('/home');
    }
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

  const handleJoin = async (room: Room) => {
    try {
      await joinRoomByCode(room.code, session?.uid || '', session?.displayName || 'Player')
    } catch {
      throw new Error('Failed to join room'); // Let the error propagate to be caught in the calling function
    } finally {
      router.replace(`/room/${room.id}`);
      joinRoom(room.id, room.name, room.players, room.maxPlayers);
      setRoomConfig({
        roomId: room.id,
        roomName: room.name,
        maxPlayers: room.maxPlayers,
        drawTime: room.roundDurationSecs,
        timeLeft: room.roundDurationSecs,
      });
    }
  };
  const handleJoinByCode = async (code?: string) => {
    try {
      const result = await joinRoomByCode(
        code ?? roomCode,
        session?.uid || '',
        session?.displayName || 'Player',
      );
      if (result) {
        setModalVisible(false);
        setRoomConfig({
          roomId: result.roomId,
          roomName: result.roomName,
          maxPlayers: result.maxPlayers,
          rounds: result.totalRounds,
          drawTime: result.roundDurationSecs,
          timeLeft: result.roundDurationSecs,
          difficulty: result.difficulty as any,
        });
        router.replace(`/room/${result.roomId}`);
      }
    }
    catch (e) {
      console.error('Failed to join room by code:', e);
    }
    finally {
      setRoomCode('');
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
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => {playClick(); router.replace('/home?bypassAuthRedirect=1')}} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.warmBlack} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.title}>Lobby</Text>
            <Text style={styles.greetingText}>Hello, {session?.displayName || 'Player'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerButtons}>
          <AnimatedButton
            label="Create room ➕"
            onPress={() => router.push('/create-room')}
            variant="primary"
            style={styles.createRoomBtn}
            textStyle={styles.createRoomBtnText}
          />
          <AnimatedButton
            label="Enter code 🔑"
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
        renderItem={({ item, index }) => <RoomCard room={item} index={index} onJoin={handleJoin} onRemove={handleRemove} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={true}
        indicatorStyle="black"
        ItemSeparatorComponent={() => <View style={{ height: Spacing.xl }} />}
      />
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            {/* Title */}
            <Text style={styles.modalTitle}>Enter Room Code</Text>
            <Text style={styles.modalHint}>Ask the room host for the 6-character code</Text>

            {/* Input */}
            <TextInput
              style={styles.codeInput}
              value={roomCode}
              onChangeText={(t) => setRoomCode(t.toUpperCase())}
              placeholder="ABC123"
              placeholderTextColor={Colors.softGray}
              maxLength={6}
              autoCapitalize="characters"
              autoFocus
            />

            {/* Error */}
            {joinError && (
              <Text style={styles.errorText}>{joinError}</Text>
            )}

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <AnimatedButton
                label="Cancel"
                onPress={() => {
                  setModalVisible(false);
                  setRoomCode('');
                }}
                variant="ghost"
                style={styles.modalBtn}
              />
              <AnimatedButton
                label={joinLoading ? 'Joining...' : 'Join'}
                onPress={() => handleJoinByCode()}
                disabled={roomCode.length < 6 || joinLoading}
                variant="primary"
                style={styles.modalBtn}
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
  greetingText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.md,
    color: Colors.border,
  },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
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
  minHeight: 340,
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
  fontSize: FontSize.xxl,
  textAlign: 'center',
  letterSpacing: 6,
  borderBottomWidth: 2,
  borderColor: Colors.primaryYellow,
  paddingVertical: Spacing.sm,
  color: Colors.warmBlack,
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
  flex: 1,
  minHeight: 60,
  justifyContent: 'center',
  },
});
