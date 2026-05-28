import React, { useEffect, useRef } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import firestore, { doc, updateDoc, deleteDoc } from '@react-native-firebase/firestore';
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
import { LABLES } from '../constants/words';

const RoomScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const roomId = id as string;

  const { room, players, uid } = useRoom(roomId);
  const hasNavigatedToDrawingRef = useRef(false);

  // ─── Auto Navigate to Drawing screen when status changes to 'drawing' ───
  useEffect(() => {
    if (room?.status !== 'drawing') {
      hasNavigatedToDrawingRef.current = false;
      return;
    }

    if (hasNavigatedToDrawingRef.current) return;
    hasNavigatedToDrawingRef.current = true;

    if (room && room.status === 'drawing') {
      console.log('⚡ Room status is drawing, navigating to /drawing!');

      // Update local Zustand state before navigating
      const playerList = Object.entries(players).map(([playerId, pData]) => ({
        id: playerId,
        name: (pData.displayName || 'Người chơi') + (playerId === room.hostId ? ' (HOST 👑)' : ''),
        avatar: pData.avatar || 'user', // Default avatar
        xp: 1000,
        level: 1,
        score: pData.score ?? 0,
        bestDrawTime: pData.bestDrawTime,
        isDrawing: playerId === room.currentDrawerId,
        isHost: playerId === room.hostId,
        color: playerId === room.hostId ? '#7B5EA7' : '#F4978E',
      }));
 
      // Join room in state
      useGameStore.getState().setRoomConfig({
        roomId,
        roomName: room.roomName || 'Phòng Online',
        players: playerList,
        maxPlayers: room.maxPlayers || 8,
        rounds: room.totalRounds || 5,
        currentRound: room.currentRound || 1,
        drawTime: room.roundDurationSecs || 80,
        difficulty: room.difficulty as any || 'Trung bình',
        isSinglePlayer: false,
        phase: 'drawing',
        currentDrawerId: room.currentDrawerId || room.hostId,
        currentWord: room.currentTopic || '',
      });

      router.replace('/drawing');
    }
  }, [room, roomId, players, router]);

  // ─── Kick players if room is deleted ───
  useEffect(() => {
    if (room?.status === 'deleted') {
      Alert.alert('Phòng đã giải tán', 'Chủ phòng đã xoá phòng này.', [
        { text: 'OK', onPress: () => router.replace('/lobby') }
      ]);
    }
  }, [room?.status, router]);

  if (!room || room.status === 'deleted') {
    return (
      <NotebookBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryYellow} />
          <Text style={styles.loadingText}>Đang kết nối phòng chờ...</Text>
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
      const randomTopic = LABLES[Math.floor(Math.random() * LABLES.length)];
      const roomRef = firestore().collection('rooms').doc(roomId);
      const roundRef = roomRef.collection('rounds').doc('round_1');

      const batch = firestore().batch();
      batch.update(roomRef, {
        status: 'drawing',
        currentDrawerId: room.hostId,
        currentRound: 1,
        currentTopic: randomTopic,
        roundStartedAt: firestore.FieldValue.serverTimestamp(),
        roundCountdownStartedAt: null,
        roundCountdownSecs: 5,
      });

      batch.set(roundRef, {
        drawerId: room.hostId,
        topic: randomTopic,
        status: 'pending',
        aiLabel: null,
        aiScore: null,
        drawDurationMs: null,
        score: null,
        validatedAt: null,
        validationSource: null,
      }, { merge: true });

      await batch.commit();
    } catch (err) {
      console.error('Error starting game:', err);
    }
  };

  const confirmLeaveOrDelete = () => {
    if (isHost) {
      Alert.alert(
        'Xoá phòng',
        'Bạn là chủ phòng. Việc thoát sẽ xoá phòng và đẩy tất cả người chơi ra ngoài. Bạn có chắc chắn?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Xoá phòng', style: 'destructive', onPress: performDeleteRoom },
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
        message: `Vẽ cùng tôi trên Quick Draw nhé! Nhập mã phòng: ${room.code}`,
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
          <TouchableOpacity onPress={confirmLeaveOrDelete} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.roomName}>{room.roomName}</Text>
            <Text style={styles.subtitle}>Phòng chờ trực tuyến</Text>
          </View>
          <View style={{ width: 44 }} />
        </Animated.View>

        {/* Code & Share Card */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.infoCardWrapper}>
          <PaperCard variant="yellow" style={styles.infoCard}>
            <View style={styles.codeSection}>
              <Text style={styles.codeLabel}>MÃ PHÒNG</Text>
              <Text style={styles.codeText}>{room.code}</Text>
            </View>
            <TouchableOpacity onPress={handleShareCode} style={styles.shareBtn}>
              <Text style={styles.shareBtnText}>Chia sẻ 🔗</Text>
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
            <Text style={styles.configText}>{room.totalRounds} vòng</Text>
          </View>
        </Animated.View>

        {/* Player List */}
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>Người chơi ({playerArray.length}/{room.maxPlayers})</Text>

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
                          {isPlayerHost ? 'Chủ phòng' : 'Người chơi'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.onlineBadge}>
                      <View style={styles.onlineDot} />
                      <Text style={styles.onlineText}>Sẵn sàng</Text>
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
        <Animated.View entering={FadeInDown.delay(500)} style={styles.footer}>
          {isHost ? (
            <View style={styles.hostFooter}>
              <AnimatedButton
                label="Huỷ phòng"
                onPress={confirmLeaveOrDelete}
                variant="danger"
                style={styles.flex1}
              />
              <AnimatedButton
                label="Bắt đầu ngay"
                onPress={handleStartGame}
                variant="primary"
                style={styles.flex2}
                disabled={playerArray.length < 1}
              />
            </View>
          ) : (
            <View style={styles.guestFooter}>
              <ActivityIndicator size="small" color={Colors.primaryYellow} />
              <Text style={styles.guestWaitText}>Đang chờ chủ phòng bắt đầu...</Text>
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
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg,
    color: Colors.warmBlack,
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
  backBtnText: {
    fontFamily: FontFamily.caveatBold,
    fontSize: FontSize.xl,
    color: Colors.warmBlack,
  },
  headerTitleBlock: {
    alignItems: 'center',
  },
  roomName: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.xl * 1.1,
    color: Colors.warmBlack,
  },
  subtitle: {
    fontFamily: FontFamily.caveat,
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
    fontFamily: FontFamily.caveat,
    fontSize: FontSize.xs,
    color: Colors.softGray,
    letterSpacing: 1,
  },
  codeText: {
    fontFamily: FontFamily.caveatBold,
    fontSize: FontSize.xxl,
    color: Colors.warmBlack,
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
    fontFamily: FontFamily.caveatBold,
    fontSize: FontSize.sm,
    color: Colors.warmBlack,
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
    fontFamily: FontFamily.caveat,
    fontSize: FontSize.sm,
    color: Colors.warmBlack,
  },
  configDivider: {
    fontFamily: FontFamily.caveat,
    fontSize: FontSize.sm,
    color: Colors.softGray,
    marginHorizontal: 4,
  },
  listSection: {
    flex: 1,
  },
  listTitle: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.md,
    color: Colors.warmBlack,
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
    fontFamily: FontFamily.caveatBold,
    fontSize: FontSize.md,
    color: Colors.warmBlack,
  },
  playerStatus: {
    fontFamily: FontFamily.caveat,
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
    fontFamily: FontFamily.caveat,
    fontSize: FontSize.xs,
    color: '#2E7D32',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
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
    fontFamily: FontFamily.caveat,
    fontSize: FontSize.md,
    color: Colors.warmBlack,
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
