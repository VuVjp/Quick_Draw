import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import AnimatedButton from '../components/AnimatedButton';
import { useGameStore, Difficulty } from '../store/useGameStore';
import NotebookBackground from '../components/NotebookBackground';
import { useCreateRoom } from '../hooks/useCreateRoom';
import { playClick } from '../store/useAudioStore';
import { useHaptics } from '../hooks/useHaptics';
import { useUserStore } from '../store/useUserStore';
import { Ionicons } from '@expo/vector-icons';

const CreateRoomScreen = () => {
  const router = useRouter();
  const setRoomConfig = useGameStore((s) => s.setRoomConfig);
  const joinRoom = useGameStore((s) => s.joinRoom);
  const addRoom = useGameStore((s) => s.addRoom);

  const [roomName, setRoomName] = useState('My Room');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [rounds, setRounds] = useState(5);
  const [drawTime, setDrawTime] = useState(80);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [peerReview, setPeerReview] = useState(false);
  const [roomType, setRoomType] = useState('Public');

  const { light } = useHaptics();
  const insets = useSafeAreaInsets();
  const { createRoom, loading } = useCreateRoom();
  const session = useUserStore((s) => s.session);

  const handleCreate = async () => {
    // Vẫn giữ setRoomConfig cho local store
    setRoomConfig({
      maxPlayers,
      rounds,
      drawTime,
      timeLeft: drawTime,
      difficulty,
      peerReviewEnabled: peerReview,
      isSinglePlayer: false,
      isPrivate: roomType === 'Private',
    });

    const result = await createRoom({
      hostId: session?.uid || '',           // TODO: thay bằng auth uid sau
      hostName: session?.displayName || 'Player',         // TODO: thay bằng tên thật sau
      roomName,
      maxPlayers,
      totalRounds: rounds,
      roundDurationSecs: drawTime,
      difficulty,
      peerReviewEnabled: peerReview,
      isPrivate: roomType === 'Private',
    });

    if (!result) return; // Lỗi đã được log trong hook

    console.log('✅ Room created:', result.roomId, '| Code:', result.code);
    // Giữ joinRoom cho local state
    joinRoom(result.roomId, roomName);

    // Navigate sang waiting room — truyền roomId
    router.replace(`/room/${result.roomId}`);
  };

  const renderOptionSelector = (
    label: string,
    options: number[] | string[],
    currentValue: any,
    onSelect: (val: any) => void
  ) => (
    <View style={styles.optionGroup}>
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={styles.optionButtons}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.toString()}
            style={[
              styles.optionBtn,
              currentValue === opt && styles.optionBtnActive,
            ]}
            onPress={() => {
              light();
              playClick();
              onSelect(opt);
            }}
          >
            <Text
              style={[
                styles.optionBtnText,
                currentValue === opt && styles.optionBtnTextActive,
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <NotebookBackground>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + Spacing.md, 40) }]}>
        <TouchableOpacity onPress={() =>{playClick(); router.back()}} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.warmBlack} />
        </TouchableOpacity>
        <Text style={styles.title}>Room Config</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={[styles.content, { flex: 1 ,  marginTop: -15 } ]}>
        <View style={[styles.formCard, {
          flex: 1,
          paddingTop: Spacing.md,
          paddingBottom: Spacing.md,
          paddingLeft: Spacing.sm,
          paddingRight: Spacing.md,
          gap: 0
        }]}>
          <ScrollView
            showsVerticalScrollIndicator={true}
            persistentScrollbar={true}
            indicatorStyle="default"
            contentContainerStyle={{
              paddingTop: Spacing.md,
              paddingBottom: Spacing.md,
              paddingLeft: Spacing.lg,
              paddingRight: Spacing.md,
              gap: Spacing.xl
            }}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.optionLabel}>Room Name</Text>
              <TextInput
                style={styles.textInput}
                value={roomName}
                onChangeText={setRoomName}
                placeholder="Enter room name..."
                placeholderTextColor={Colors.softGray}
              />
            </View>

            {renderOptionSelector('Room Type', ['Public', 'Private'], roomType, setRoomType)}
            {renderOptionSelector('Max Players', [2, 4, 8, 12], maxPlayers, setMaxPlayers)}
            {renderOptionSelector('Number of Rounds', [3, 5, 10], rounds, setRounds)}
            {renderOptionSelector('Draw Time (seconds)', [30, 60, 80, 120], drawTime, setDrawTime)}
            {/* {renderOptionSelector('Difficulty', ['Easy', 'Medium', 'Hard'], difficulty, setDifficulty)} */}

            <View style={styles.switchGroup}>
              <View>
                <Text style={styles.optionLabel}>Peer Review (Comming Soon)</Text>
                <Text style={styles.optionHint}>Allow players to rate each other's drawings</Text>
              </View>
              <Switch
                disabled={true} // Tạm thời khóa vì chưa hoàn thiện backend
                value={peerReview}
                onValueChange={setPeerReview}
                trackColor={{ false: Colors.softGray, true: Colors.goldAccent }}
                thumbColor={peerReview ? Colors.paperWhite : Colors.paperWhite}
              />
            </View>
          </ScrollView>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.xl) }]}>
        <AnimatedButton
          label={loading ? 'Creating...' : 'Create Room'}
          onPress={handleCreate}
          disabled={loading}
          variant="primary"
          style={styles.createBtn}
        />
      </View>
    </NotebookBackground>
  );
};

export default CreateRoomScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.xxl,
    color: Colors.warmBlack,
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
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  formCard: {
    backgroundColor: Colors.paperWhite,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  optionGroup: {
    gap: Spacing.sm,
  },
  optionLabel: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg,
    color: Colors.warmBlack,
  },
  optionHint: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.sm,
    color: Colors.warmBlack,
    opacity: 0.6,
  },
  textInput: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg,
    borderBottomWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    color: Colors.warmBlack,
  },
  optionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.notebookWhite,
  },
  optionBtnActive: {
    backgroundColor: Colors.primaryYellow,
  },
  optionBtnText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg,
    color: Colors.warmBlack,
  },
  optionBtnTextActive: {
    fontFamily: FontFamily.patrickHand,
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  createBtn: {
    paddingVertical: Spacing.md,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
});
