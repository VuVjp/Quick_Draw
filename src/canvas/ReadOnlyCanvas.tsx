import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, Path, Group, Skia, PaintStyle, StrokeCap, StrokeJoin } from '@shopify/react-native-skia';
import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const FALLBACK_CANVAS_WIDTH = screenWidth - 48; // width - Spacing.xl * 2

type StrokeRecord = {
  pathData: string;
  color: string;
  width: number;
};

type Props = {
  width: number;
  height: number;
  strokes: StrokeRecord[];
  originalCanvasSize?: { width: number, height: number } | null;
};

const ReadOnlyCanvas = ({ width, height, strokes, originalCanvasSize }: Props) => {
  // Convert StrokeRecords into ready-to-render objects
  const renderedPaths = useMemo(() => {
    return strokes.map((stroke, index) => {
      const skPath = Skia.Path.MakeFromSVGString(stroke.pathData);
      return {
        id: index,
        path: skPath,
        color: stroke.color,
        width: stroke.width,
      };
    }).filter(s => s.path !== null);
  }, [strokes]);

  // Calculate uniform scale based on both width and height to ensure the drawing fits
  const origW = originalCanvasSize?.width || FALLBACK_CANVAS_WIDTH;
  const origH = originalCanvasSize?.height || (FALLBACK_CANVAS_WIDTH * 1.5); // Fallback ratio

  const scaleX = width / origW;
  const scaleY = height / origH;

  return (
    <Canvas style={[styles.canvas, { width, height }]} pointerEvents="none">
      <Group transform={[{ scaleX }, { scaleY }]}>
        {renderedPaths.map((item) => (
          <Path
            key={item.id}
            path={item.path!}
            color={item.color}
            style="stroke"
            strokeWidth={item.width}
            strokeCap="round"
            strokeJoin="round"
          />
        ))}
      </Group>
    </Canvas>
  );
};

export default React.memo(ReadOnlyCanvas);

const styles = StyleSheet.create({
  canvas: {
    backgroundColor: '#FFFDF8',
  },
});
