import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Text, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
import { BRUSH_COLORS, BRUSH_SIZES, ERASER_SIZES, useDrawingStore } from '../store/useDrawingStore';
import { Colors } from '../theme/colors';
import { Spacing, Radius, Shadow } from '../theme/spacing';

type Props = {
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
};

// Override colors for the exact reference look
const EXACT_COLORS = [
  '#4A443F', // warm black
  '#F4978E', // red
  '#B9D7EA', // blue
  '#C1E1C1', // green
  '#F6C445', // yellow
  '#A073CC', // purple
];

const BrushToolbar = ({ onUndo, onRedo, onClear }: Props) => {
  const activeColor = useDrawingStore((s) => s.activeColor);
  const brushSize = useDrawingStore((s) => s.brushSize);
  const eraserSize = useDrawingStore((s) => s.eraserSize);
  const isEraser = useDrawingStore((s) => s.isEraser);
  const setColor = useDrawingStore((s) => s.setColor);
  const setBrushSize = useDrawingStore((s) => s.setBrushSize);
  const setEraserSize = useDrawingStore((s) => s.setEraserSize);
  const toggleEraser = useDrawingStore((s) => s.toggleEraser);

  const [showSizeSlider, setShowSizeSlider] = React.useState(false);

  return (
    <View style={styles.container}>
      {/* Color Palette Pill removed as requested */}

      {/* Eraser Size Slider (Conditional) */}
      {showSizeSlider && isEraser && (
        <View style={styles.sliderContainer}>
          {ERASER_SIZES.map((size) => {
            const isActive = eraserSize === size;
            return (
              <TouchableOpacity
                key={size}
                onPress={() => {
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
            if (isEraser) toggleEraser();
            setShowSizeSlider(false);
          }}
          style={[styles.toolBtn, !isEraser ? styles.toolBtnActive : undefined]}
        >
          <Text style={styles.toolIcon}>🖌️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (!isEraser) toggleEraser();
            setShowSizeSlider(false);
          }}
          style={[styles.toolBtn, isEraser ? styles.toolBtnActive : undefined]}
        >
          <Text style={styles.toolIcon}>🧽</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.toolBtn, showSizeSlider ? styles.toolBtnActive : undefined]}
          onPress={() => {
            if (isEraser) {
              setShowSizeSlider(!showSizeSlider);
            }
          }}
          activeOpacity={isEraser ? 0.2 : 1}
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
        <TouchableOpacity onPress={onUndo} style={styles.toolBtn}>
          <Text style={styles.toolIcon}>↩️</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onRedo} style={styles.toolBtn}>
          <Text style={styles.toolIcon}>↪️</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClear} style={styles.toolBtn}>
          <Text style={styles.toolIcon}>🗑️</Text>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
    width: width * 0.9,
    justifyContent: 'space-between',
    ...Shadow.sketch,
  },
  toolBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnActive: {
    backgroundColor: Colors.primaryYellow,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  toolIcon: {
    fontSize: 22,
  },
});
