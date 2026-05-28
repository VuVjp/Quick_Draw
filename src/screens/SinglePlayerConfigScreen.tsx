import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import AnimatedButton from '../components/AnimatedButton';
import { useGameStore } from '../store/useGameStore';
import NotebookBackground from '../components/NotebookBackground';
import { playClick } from '../store/useAudioStore';
import { useHaptics } from '../hooks/useHaptics';

const SinglePlayerConfigScreen = () => {
  const router = useRouter();
  const startSinglePlayer = useGameStore((s) => s.startSinglePlayer);

  const [nickname, setNickname] = useState('Player');
  const [rounds, setRounds] = useState(5);
  const [drawTime, setDrawTime] = useState(80);
  const [botCount, setBotCount] = useState(3);

  const { light } = useHaptics();
  const insets = useSafeAreaInsets();

  const handleStart = () => {
    const finalName = nickname.trim();
    if (!finalName) return;
    startSinglePlayer(finalName, rounds, drawTime, 'Trung bình', botCount);
    router.replace('/drawing');
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Cấu hình chơi đơn</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={[styles.content, { flex: 1 }]}>
        <View style={[styles.formCard, {
          flex: 1,
          paddingTop: 0,
          paddingBottom: 0,
          paddingLeft: 0,
          paddingRight: 0,
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          gap: 0
        }]}>
          <View
            style={{
              paddingTop: Spacing.xl,
              paddingBottom: Spacing.md,
              paddingLeft: Spacing.xl,
              paddingRight: Spacing.xl,
              gap: Spacing.xl
            }}
          >
            {renderOptionSelector('Số vòng', [3, 5, 10], rounds, setRounds)}
            {renderOptionSelector('Thời gian (giây)', [40, 60, 80, 120], drawTime, setDrawTime)}
          </View>

          <View style={{ flex: 1, width: '100%' }}>
            <Image 
              source={require('../../assets/images/MADE BY DSN.png')} 
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.xl) }]}>
        <AnimatedButton
          label="Bắt đầu"
          onPress={handleStart}
          variant="primary"
          style={styles.createBtn}
        />
      </View>
    </NotebookBackground>
  );
};

export default SinglePlayerConfigScreen;

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
  backBtnText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: 24,
    color: Colors.warmBlack,
    marginTop: -2,
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
  createBtn: {
    paddingVertical: Spacing.md,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  }
});
