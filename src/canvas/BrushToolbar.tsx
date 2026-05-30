import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { Colors } from '../theme/colors';
import { FontFamily } from '../theme/typography';
import { Spacing, Radius, Shadow } from '../theme/spacing';
import { ERASER_SIZES, useDrawingStore } from '../store/useDrawingStore';
import { playClick } from '../store/useAudioStore';
import BrushIcon from '../../assets/brush-icon.svg';
import EraserIcon from '../../assets/Icon/eraser.svg';
import UndoIcon from '../../assets/Icon/arrow-big-left.svg';
import RedoIcon from '../../assets/Icon/arrow-big-right.svg';

const { width } = Dimensions.get('window');

type Props = {
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  disabled?: boolean;
};

const BrushToolbar = ({ onUndo, onRedo, onClear, disabled = false }: Props) => {
  const activeColor = useDrawingStore((s) => s.activeColor);
  const eraserSize = useDrawingStore((s) => s.eraserSize);
  const isEraser = useDrawingStore((s) => s.isEraser);
  const setEraserSize = useDrawingStore((s) => s.setEraserSize);
  const toggleEraser = useDrawingStore((s) => s.toggleEraser);

  const [showSizeSlider, setShowSizeSlider] = React.useState(false);

  return (
    <View style={styles.container}>
      {/* Color Palette Pill (Removed) */}

      {/* Eraser Size Slider (Conditional) */}
      {showSizeSlider && isEraser && (
        <View style={styles.sliderContainer}>
          {ERASER_SIZES.map((size) => {
            const isActive = eraserSize === size;
            return (
              <TouchableOpacity
                key={size}
                onPress={() => {
                  playClick();
                  setEraserSize(size);
                  setShowSizeSlider(false);
                }}
                style={[
                  styles.sizeOption,
                  isActive ? styles.sizeOptionActive : undefined,
                ]}
              >
                <View style={[
                  styles.sizeDot,
                  {
                    width: size * 0.5,
                    height: size * 0.5,
                    backgroundColor: '#F4978E',
                    borderWidth: 1.5,
                    borderColor: Colors.border,
                  }
                ]} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}


      {/* Bottom Toolbar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={() => {
            if (disabled) return;
            playClick();
            if (isEraser) toggleEraser();
            setShowSizeSlider(false);
          }}
          style={[styles.toolBtn, !isEraser ? styles.toolBtnActive : undefined, disabled && styles.toolBtnDisabled]}
          activeOpacity={disabled ? 1 : 0.7}
        >
          <BrushIcon width={24} height={24} color={Colors.warmBlack} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (disabled) return;
            playClick();
            if (!isEraser) toggleEraser();
            setShowSizeSlider(false);
          }}
          style={[styles.toolBtn, isEraser ? styles.toolBtnActive : undefined, disabled && styles.toolBtnDisabled]}
          activeOpacity={disabled ? 1 : 0.7}
        >
          <EraserIcon width={24} height={24} color={Colors.warmBlack} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, showSizeSlider ? styles.toolBtnActive : undefined, disabled && styles.toolBtnDisabled]}
          onPress={() => {
            if (disabled) return;
            playClick();
            if (isEraser) {
              setShowSizeSlider(!showSizeSlider);
            }
          }}
          activeOpacity={disabled ? 1 : (isEraser ? 0.2 : 1)}
        >
          <View style={[
            styles.sizeDot,
            {
              width: 12,
              height: 12,
              backgroundColor: isEraser ? '#F4978E' : activeColor,
              borderWidth: isEraser ? 1 : 0,
              borderColor: Colors.border,
            }
          ]} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { if (disabled) return; playClick(); onUndo(); }} style={[styles.toolBtn, disabled && styles.toolBtnDisabled]} activeOpacity={disabled ? 1 : 0.7}>
          <UndoIcon width={24} height={24} color={Colors.warmBlack} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { if (disabled) return; playClick(); onRedo(); }} style={[styles.toolBtn, disabled && styles.toolBtnDisabled]} activeOpacity={disabled ? 1 : 0.7}>
          <RedoIcon width={24} height={24} color={Colors.warmBlack} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { if (disabled) return; playClick(); onClear(); }} style={[styles.toolBtn, disabled && styles.toolBtnDisabled]} activeOpacity={disabled ? 1 : 0.7}>
          <Text style={styles.clearText}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default React.memo(BrushToolbar);

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  colorPill: {
    flexDirection: 'row',
    backgroundColor: Colors.paperWhite,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
    ...Shadow.sketch,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  swatchSelected: {
    borderWidth: 2,
    borderColor: Colors.border,
    transform: [{ scale: 1.2 }],
  },
  sliderContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.paperWhite,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: Spacing.sm,
    position: 'absolute',
    bottom: 90,
    zIndex: 10,
    ...Shadow.sketch,
  },
  sizeOption: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  sizeOptionActive: {
    backgroundColor: Colors.softGray,
  },
  sizeDot: {
    borderRadius: 100,
    backgroundColor: Colors.warmBlack,
  },
  bottomBar: {
  flexDirection: 'row',
  backgroundColor: Colors.paperWhite,
  borderWidth: 1.5,
  borderColor: Colors.border,
  borderRadius: Radius.xl,

  paddingHorizontal: Spacing.sm,
  paddingVertical: Spacing.sm,

  gap: Spacing.xs,

  alignItems: 'center',
  justifyContent: 'center',

  maxWidth: width * 0.95,

  ...Shadow.sketch,
},
  toolBtn: {
  width: 40,
  height: 40,
  borderRadius: Radius.md,
  alignItems: 'center',
  justifyContent: 'center',
},
  toolBtnActive: {
    backgroundColor: Colors.primaryYellow,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  toolBtnDisabled: {
    opacity: 0.35,
  },
  clearText: {
    fontFamily: FontFamily.patrickHand,
    fontSize: 20,
    color: Colors.warmBlack,
  },
  toolIcon: {
    fontSize: 22,
  },
});
