import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRoom } from '../hooks/useRoom';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import NotebookBackground from '../components/NotebookBackground';
import AnimatedButton from '../components/AnimatedButton';
import PaperCard from '../components/PaperCard';
import { Colors } from '../theme/colors';
import { Spacing, Radius, Shadow } from '../theme/spacing';
import { FontFamily, FontSize } from '../theme/typography';
import { useGameStore } from '../store/useGameStore';
import { useEntranceAnimation } from '../animations/useAnimations';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useHaptics } from '../hooks/useHaptics';

// Beautiful pastel cartoon avatars
const AVATARS = ['🦊', '🐱', '🐼', '🐨', '🐯', '🐰', '🦁', '🐸'];

const RoomScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { room, players, uid } = useRoom(id);
  const setRoomConfig = useGameStore((s) => s.setRoomConfig);
  const { light, success } = useHaptics();

  // Entrance animations
  const { opacity: listOpacity } = useEntranceAnimation(150);

  const isHost = room ? uid === room.hostId : false;
  const playerArray = Object.values(players);

  // Auto-redirect guest and host when room status becomes 'drawing'
  useEffect(() => {
    if (room && room.status === 'drawing' && playerArray.length > 0) {
      success();
      // Sync Firestore room & player data to local Zustand store
      const syncedPlayers = playerArray.map((p: any, idx) => ({
        id: p.id,
        name: p.displayName || 'Người chơi',
        avatar: AVATARS[idx % AVATARS.length],
        xp: p.xp || 120,
        level: p.level || 1,
        score: p.score || 0,
        isDrawing: p.id === (room.currentDrawerId || room.hostId),
        isHost: p.id === room.hostId,
        color: idx % 2 === 0 ? 'blue' : 'yellow',
      }));

      setRoomConfig({
        roomId: id,
        roomName: room.roomName,
        maxPlayers: room.maxPlayers,
        rounds: room.totalRounds,
        currentRound: 1,
        drawTime: room.roundDurationSecs,
        peerReviewEnabled: room.peerReviewEnabled,
        isSinglePlayer: false,
        players: syncedPlayers,
        currentDrawerId: room.currentDrawerId || room.hostId,
        phase: 'drawing',
      });

      router.replace('/drawing');
    }
  }, [room?.status, players]);

  const handleStartGame = async () => {
    if (!id || !room) return;
    try {
      light();
      // Choose host as the first drawer to start
      await firestore().collection('rooms').doc(id).update({
        status: 'drawing',
        currentRound: 1,
        currentDrawerId: room.hostId,
      });
    } catch (e: any) {
      console.error(e);
      Alert.alert('Lỗi', 'Không thể khởi động game.');
    }
  };

  const handleLeaveRoom = async () => {
    const currentUid = uid || auth().currentUser?.uid;
    try {
      light();
      if (id && currentUid) {
        // Delete player document from room sub-collection
        await firestore()
          .collection('rooms')
          .doc(id)
          .collection('players')
          .doc(currentUid)
          .delete();

        // If host leaves, optionally delete the room or update status to expired
        if (isHost) {
          await firestore().collection('rooms').doc(id).update({
            status: 'abandoned',
          });
        }
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      router.replace('/(tabs)/lobby');
    }
  };

  if (!room) {
    return (
      <NotebookBackground>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải thông tin phòng... ✏️</Text>
        </View>
      </NotebookBackground>
    );
  }

  return (
    <NotebookBackground>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLeaveRoom} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>🚪 Rời</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.roomName}>{room.roomName}</Text>
          <Text style={styles.roomCode}>Mã: {room.code}</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        {/* Info Card */}
        <PaperCard style={styles.infoCard} variant="default" rotate="-0.5deg">
          <Text style={styles.infoTitle}>Cấu hình trận đấu ⚙️</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số vòng:</Text>
              <Text style={styles.infoValue}>{room.totalRounds} vòng</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Thời gian vẽ:</Text>
              <Text style={styles.infoValue}>{room.roundDurationSecs} giây</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Đánh giá chéo:</Text>
              <Text style={styles.infoValue}>{room.peerReviewEnabled ? 'Bật' : 'Tắt'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Người chơi:</Text>
              <Text style={styles.infoValue}>{playerArray.length}/{room.maxPlayers}</Text>
            </View>
          </View>
        </PaperCard>

        {/* Players Section Header */}
        <Text style={styles.sectionTitle}>Danh sách người chơi ({playerArray.length})</Text>

        {/* Players List */}
        <Animated.View style={[{ flex: 1 }, { opacity: listOpacity.value }]}>
          <FlatList
            data={playerArray}
            keyExtractor={(item: any) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.playersList}
            renderItem={({ item, index }: any) => {
              const avatar = AVATARS[index % AVATARS.length];
              const isPlayerHost = item.id === room.hostId;
              const rotate = index % 2 === 0 ? '-1deg' : '1deg';

              return (
                <Animated.View entering={FadeInDown.delay(index * 80)}>
                  <PaperCard
                    style={styles.playerCard}
                    variant={index % 2 === 0 ? 'blue' : 'yellow'}
                    rotate={rotate}
                  >
                    <View style={styles.playerRow}>
                      <View style={styles.avatarBox}>
                        <Text style={styles.avatarText}>{avatar}</Text>
                      </View>
                      <View style={styles.playerNameContainer}>
                        <Text style={styles.playerName}>{item.displayName || 'Người chơi'}</Text>
                        {isPlayerHost && (
                          <View style={styles.hostBadge}>
                            <Text style={styles.hostBadgeText}>Chủ phòng 👑</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </PaperCard>
                </Animated.View>
              );
            }}
          />
        </Animated.View>
      </View>

      {/* Footer Start Button */}
      <View style={styles.footer}>
        {isHost ? (
          <AnimatedButton
            label="Bắt đầu game 🚀"
            onPress={handleStartGame}
            variant="primary"
            fullWidth
            style={styles.actionBtn}
          />
        ) : (
          <View style={styles.waitingBadge}>
            <Text style={styles.waitingText}>Đợi chủ phòng bắt đầu... 🕒</Text>
          </View>
        )}
      </View>
    </NotebookBackground>
  );
};

export default RoomScreen;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.paperWhite,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sketch,
  },
  backBtnText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: 16,
    color: Colors.warmBlack,
  },
  headerCenter: {
    alignItems: 'center',
  },
  roomName: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.xl,
    color: Colors.warmBlack,
  },
  roomCode: {
    fontFamily: FontFamily.caveatBold,
    fontSize: FontSize.md,
    color: Colors.warmBlack,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  infoCard: {
    padding: Spacing.md,
    borderWidth: 2,
  },
  infoTitle: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg,
    color: Colors.warmBlack,
    marginBottom: Spacing.xs,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.xs,
  },
  infoRow: {
    width: '50%',
    flexDirection: 'row',
    gap: 4,
  },
  infoLabel: {
    fontFamily: FontFamily.caveat,
    fontSize: FontSize.sm + 2,
    color: Colors.warmBlack,
    opacity: 0.7,
  },
  infoValue: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.sm + 2,
    color: Colors.warmBlack,
  },
  sectionTitle: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg + 2,
    color: Colors.warmBlack,
    marginTop: Spacing.xs,
  },
  playersList: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  playerCard: {
    padding: Spacing.sm,
    borderWidth: 1.5,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.paperWhite,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FontSize.xl,
  },
  playerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  playerName: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg,
    color: Colors.warmBlack,
  },
  hostBadge: {
    backgroundColor: Colors.primaryYellow,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  hostBadgeText: {
    fontFamily: FontFamily.caveatBold,
    fontSize: FontSize.xs - 1,
    color: Colors.warmBlack,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  actionBtn: {
    paddingVertical: Spacing.md,
  },
  waitingBadge: {
    width: '100%',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.paperWhite,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sketch,
  },
  waitingText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg,
    color: Colors.warmBlack,
  },
});
