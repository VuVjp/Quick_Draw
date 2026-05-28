import React from 'react';
import { Modal, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing, Radius, Shadow } from '../theme/spacing';
import { useUserStore } from '../store/useUserStore';
import { playClick, setBgmVolume as setStoreBgmVolume, pauseBgm, playBgm } from '../store/useAudioStore';
import AnimatedButton from './AnimatedButton';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const SettingsModal = ({ visible, onClose }: Props) => {
  const soundEnabled = useUserStore((s) => s.soundEnabled);
  const toggleSound = useUserStore((s) => s.toggleSound);
  const bgmVolume = useUserStore((s) => s.bgmVolume);
  const setBgmVolume = useUserStore((s) => s.setBgmVolume);

  const [isMuted, setIsMuted] = React.useState(false);

  if (!visible) return null;

  const handleToggleMute = () => {
    playClick();
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (newMuted) {
      pauseBgm();
    } else {
      if (bgmVolume > 0) playBgm();
    }
  };

  const handleVolumeChange = (val: number) => {
    const newVol = val / 100;
    setBgmVolume(newVol);
    setStoreBgmVolume(newVol);
    if (isMuted && newVol > 0) {
      setIsMuted(false);
      playBgm();
    }
  };

  const handleClose = () => {
    playClick();
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={styles.modalContent}>
          <Text style={styles.title}>Cài Đặt</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.label}>Tắt tiếng</Text>
            <TouchableOpacity 
              style={[styles.toggleBtn, isMuted && styles.toggleBtnOff]} 
              onPress={handleToggleMute}
            >
              <Text style={styles.toggleText}>{isMuted ? 'BẬT (Đã Tắt)' : 'TẮT (Đang Mở)'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.label}>Âm lượng</Text>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={100}
                step={1}
                value={Math.round(bgmVolume * 100)}
                onValueChange={handleVolumeChange}
                minimumTrackTintColor={Colors.primaryYellow}
                maximumTrackTintColor={Colors.softGray}
                thumbTintColor={Colors.warmBlack}
              />
              <Text style={styles.volText}>{Math.round(bgmVolume * 100)}</Text>
            </View>
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Cài đặt thêm</Text>

          <View style={styles.settingRow}>
            <Text style={styles.label}>SFX (Âm thanh vẽ)</Text>
            <TouchableOpacity 
              style={[styles.toggleBtn, !soundEnabled && styles.toggleBtnOff]} 
              onPress={() => {
                playClick();
                toggleSound();
              }}
            >
              <Text style={styles.toggleText}>{soundEnabled ? 'BẬT' : 'TẮT'}</Text>
            </TouchableOpacity>
          </View>

          <AnimatedButton
            label="Đóng"
            onPress={handleClose}
            variant="secondary"
            style={{ marginTop: Spacing.xl }}
            fullWidth
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

export default SettingsModal;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.paperWhite,
    width: '100%',
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadow.medium,
  },
  title: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.xxl,
    color: Colors.warmBlack,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg,
    color: Colors.warmBlack,
  },
  divider: {
    height: 2,
    backgroundColor: Colors.softGray,
    marginVertical: Spacing.md,
    opacity: 0.5,
  },
  sectionTitle: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.lg,
    color: Colors.warmBlack,
    opacity: 0.7,
    marginBottom: Spacing.sm,
  },
  toggleBtn: {
    backgroundColor: Colors.primaryYellow,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  toggleBtnOff: {
    backgroundColor: Colors.softGray,
  },
  toggleText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.md,
    color: Colors.warmBlack,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: Spacing.xl,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  volText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: FontSize.md,
    color: Colors.warmBlack,
    width: 36,
    textAlign: 'right',
  },
});
