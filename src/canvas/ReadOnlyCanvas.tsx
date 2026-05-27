import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, Path, Skia, PaintStyle, StrokeCap, StrokeJoin } from '@shopify/react-native-skia';

type StrokeRecord = {
  pathData: string;
  color: string;
  width: number;
};

type Props = {
  width: number;
  height: number;
  strokes: StrokeRecord[];
};

const ReadOnlyCanvas = ({ width, height, strokes }: Props) => {
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

  return (
    <Canvas style={[styles.canvas, { width, height }]} pointerEvents="none">
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
    </Canvas>
  );
};

export default React.memo(ReadOnlyCanvas);

const styles = StyleSheet.create({
  canvas: {
    backgroundColor: '#FFFDF8',
  },
});
