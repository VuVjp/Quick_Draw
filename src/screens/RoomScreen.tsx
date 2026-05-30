import React, { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  Image,
} from 'react-native';
import { playClick } from '../store/useAudioStore';
import { useRouter, useLocalSearchParams } from 'expo-router';
import firestore, { doc, deleteDoc, updateDoc } from '@react-native-firebase/firestore';
import { db } from '../services/firebase';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRoom } from '../hooks/useRoom';
import { useGameStore } from '../store/useGameStore';
import NotebookBackground from '../components/NotebookBackground';
import AnimatedButton from '../components/AnimatedButton';
import PaperCard from '../components/PaperCard';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, Radius, Shadow } from '../theme/spacing';

import ClockIcon from '../../assets/Icon/clock.svg';
import PencilRulerIcon from '../../assets/Icon/pencil-ruler.svg';
import { useHostGameLifecycle } from '../hooks/useHostGameLifecycle';
import { Ionicons } from '@expo/vector-icons';

const RoomScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const roomId = id as string;
  const insets = useSafeAreaInsets();
  const { room, players, uid } = useRoom(roomId);
  const setRoomConfig = useGameStore((s) => s.setRoomConfig);
  const { startGame } = useHostGameLifecycle(roomId);

  // ─── Auto Navigate to Drawing screen when status changes to 'drawing' ───
  useEffect(() => {
    if (room && room.status === 'drawing') {
      console.log('⚡ Room status is drawing, navigating to /drawing!');

      // Update local Zustand state before navigating
      const playerList = Object.entries(players).map(([playerId, pData]) => ({
        id: playerId,
        name: (pData.displayName || 'player') + (playerId === room.hostId ? ' (HOST 👑)' : ''),
        avatar: pData.avatar || 'user', // Default avatar
        xp: 1000,
        level: 1,
        score: 0,
        isDrawing: playerId === room.hostId, // First drawer is host usually
        isHost: playerId === room.hostId,
        color: playerId === room.hostId ? '#7B5EA7' : '#F4978E',
      }));

      // Join room in state
      setRoomConfig({
        roomId,
        currentWord: room.currentTopic,
        roomName: room.roomName || 'Online Room',
        players: playerList,
        maxPlayers: room.maxPlayers || 8,
        rounds: room.totalRounds || 5,
        currentRound: room.currentRound || 1,
        drawTime: room.roundDurationSecs || 80,
        timeLeft: room.roundDurationSecs || 80,
        difficulty: room.difficulty as any || 'Medium',
        isSinglePlayer: false,
        phase: 'drawing',
        currentDrawerId: room.hostId,
      });

      router.replace('/drawing');
    }
  }, [room, roomId, players, setRoomConfig, router]);

  // ─── Kick players if room is deleted ───
  useEffect(() => {
    if (room?.status === 'deleted') {
      Alert.alert('Room Deleted', 'The host has deleted this room.', [
        { text: 'OK', onPress: () => router.replace('/lobby') }
      ]);
    }
  }, [room?.status, router]);

  if (!room || room.status === 'deleted') {
    return (
      <NotebookBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryYellow} />
          <Text style={styles.loadingText}>Connecting to waiting room...</Text>
        </View>
      </NotebookBackground>
    );
  }

  const isHost = uid === room.hostId;
  const playerArray = Object.entries(players).map(([playerId, pData]) => ({
    id: playerId,
    ...pData,
  }));

  const handleStartGame = async () => {
    try {
      await startGame();
    } catch (err) {
      console.error('Error starting game:', err);
    }
  };

  const confirmLeaveOrDelete = () => {
    if (isHost) {
      Alert.alert(
        'Delete Room',
        'You are the host of this room. Leaving will delete the room and kick all players out. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete Room', style: 'destructive', onPress: performDeleteRoom },
        ]
      );
    } else {
      performLeaveRoom();
    }
  };

  const performDeleteRoom = async () => {
    try {
      await deleteDoc(doc(db, 'rooms', roomId));
      router.replace('/lobby');
    } catch (err) {
      console.error('Error deleting room:', err);
      router.replace('/lobby');
    }
  };

  const performLeaveRoom = async () => {
    try {
      if (uid) {
        await deleteDoc(doc(db, 'rooms', roomId, 'players', uid));
        await updateDoc(doc(db, 'rooms', roomId), {
          playerCount: firestore.FieldValue.increment(-1),
        });
      }
      router.replace('/lobby');
    } catch (err) {
      console.error('Error leaving room:', err);
      router.replace('/lobby');
    }
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Draw with me on Quick Draw! Enter room code: ${room.code}`,
      });
    } catch (error) {
      console.error('Error sharing code:', error);
    }
  };

  return (
    <NotebookBackground>
      <View style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              playClick();
              confirmLeaveOrDelete();
            }}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.warmBlack} />
          </TouchableOpacity>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.roomName}>{room.roomName}</Text>
            <Text style={styles.subtitle}>Online Waiting Room</Text>
          </View>
          <View style={{ width: 44 }} />
        </Animated.View>

        {/* Code & Share Card */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.infoCardWrapper}>
          <PaperCard variant="yellow" style={styles.infoCard}>
            <View style={styles.codeSection}>
              <Text style={styles.codeLabel}>Room code</Text>
              <Text style={styles.codeText}>{room.code}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                playClick();
                handleShareCode();
              }}
              style={styles.shareBtn}
            >
              <Text style={styles.shareBtnText}>Share 🔗</Text>
            </TouchableOpacity>
          </PaperCard>
        </Animated.View>

        {/* Configurations Banner */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.configBanner}>
          <View style={styles.configRow}>
            <ClockIcon width={16} height={16} color={Colors.warmBlack} />
            <Text style={styles.configText}>{room.roundDurationSecs}s</Text>
            <Text style={styles.configDivider}>|</Text>
            <PencilRulerIcon width={16} height={16} color={Colors.warmBlack} />
            <Text style={styles.configText}>{room.totalRounds} Rounds</Text>
          </View>
        </Animated.View>

        {/* Player List */}
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>Players ({playerArray.length}/{room.maxPlayers})</Text>

          <FlatList
            data={playerArray}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item, index }) => {
              const rotate = index % 2 === 0 ? '-0.5deg' : '0.5deg';
              const isPlayerHost = item.id === room.hostId;

              return (
                <Animated.View entering={FadeInDown.delay(300 + index * 100).springify().damping(12)}>
                  <PaperCard variant={isPlayerHost ? "blue" : "default"} rotate={rotate} style={styles.playerCard}>
                    <View style={styles.playerInfo}>
                      {/* <Text style={styles.avatarText}>{isPlayerHost ? '👑' : '👾'}</Text> */}
                      <Image
                        source={item.avatar === 'user' ? require('../../assets/images/anonymous.png') : { uri: item.avatar }}
                        style={{ width: 40, height: 40, borderRadius: 10 }}
                      />
                      <View>
                        <Text style={styles.playerName}>{item.displayName}</Text>
                        <Text style={styles.playerStatus}>
                          {isPlayerHost ? 'Room Host' : 'Player'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.onlineBadge}>
                      <View style={styles.onlineDot} />
                      <Text style={styles.onlineText}>Ready</Text>
                    </View>
                  </PaperCard>
                </Animated.View>
              );
            }}
            showsVerticalScrollIndicator={true}
            indicatorStyle="black"
            ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          />
        </View>

        {/* Action Button Footer */}
        <Animated.View
          entering={FadeInDown.delay(500)}
          style={[
            styles.footer,
            {
              bottom: Math.max(insets.bottom + 24, 50),
            },
          ]}
        >
          {isHost ? (
            <View style={styles.hostFooter}>
              <AnimatedButton
              label="Delete Room"
              onPress={() => {
                playClick();
                confirmLeaveOrDelete();
              }}
                variant="danger"
                style={styles.flex1}
              />
              <AnimatedButton
                label="Start Game"
                onPress={() => {
                  playClick();
                  handleStartGame();
                }}
                variant="primary"
                style={styles.flex2}
                disabled={playerArray.length < 1}
              />
            </View>
          ) : (
            <View style={styles.guestFooter}>
              <ActivityIndicator size="small" color={Colors.primaryYellow} />
              <Text style={styles.guestWaitText}>Waiting for the room host to start...</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </NotebookBackground>
  );
};

export default RoomScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontFamily: FontFamily.accent,
    fontSize: FontSize.lg,
    color: Colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: Spacing.lg,
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
    ...Shadow.sketch,
  },
  headerTitleBlock: {
    alignItems: 'center',
  },
  roomName: {
    fontFamily: FontFamily.accent,
    fontSize: FontSize.xl * 1.1,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.softGray,
  },
  infoCardWrapper: {
    marginBottom: Spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  codeSection: {
    gap: 2,
  },
  codeLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.softGray,
    letterSpacing: 1,
  },
  codeText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xxl,
    color: Colors.text,
    letterSpacing: 2,
  },
  shareBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.paperWhite,
    ...Shadow.sketch,
  },
  shareBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  configBanner: {
    backgroundColor: Colors.paperWhite,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
    ...Shadow.sketch,
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  configText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.warmBlack,
  },
  configDivider: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.softGray,
    marginHorizontal: 4,
  },
  listSection: {
    flex: 1,
  },
  listTitle: {
    fontFamily: FontFamily.accent,
    fontSize: FontSize.md,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  listContainer: {
    paddingBottom: 100,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarText: {
    fontSize: FontSize.xxl,
  },
  playerName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  playerStatus: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.softGray,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    backgroundColor: '#E8F5E9',
    borderRadius: Radius.sm,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  onlineText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: '#2E7D32',
  },
  footer: {
  position: 'absolute',
  left: Spacing.xl,
  right: Spacing.xl,
},
  guestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.paperWhite,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    ...Shadow.sketch,
  },
  guestWaitText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  hostFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
});
