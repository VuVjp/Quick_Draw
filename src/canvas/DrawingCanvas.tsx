import { Canvas, PaintStyle, Path, Picture, Skia, SkPath, SkPicture, StrokeCap, StrokeJoin } from '@shopify/react-native-skia';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useReducer,
  useRef,
} from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useDrawingStore } from '../store/useDrawingStore';
import { startBrushSound, stopBrushSound } from '../store/useAudioStore';

// ─── Types ────────────────────────────────────────────────────────────────────
type StrokePath = {
  path: SkPath;
  color: string;
  width: number;
};

export type DrawingCanvasRef = {
  undo: () => void;
  redo: () => void;
  clear: () => void;
  getSnapshot: () => string | null; // trả về base64 PNG
};

type Props = {
  width: number;
  height: number;
  disabled?: boolean;
};

// ─── DrawingCanvas ────────────────────────────────────────────────────────────
const DrawingCanvas = forwardRef<DrawingCanvasRef, Props>(({ width, height, disabled }, ref) => {
  const activeColor = useDrawingStore((s) => s.activeColor);
  const brushSize = useDrawingStore((s) => s.brushSize);
  const eraserSize = useDrawingStore((s) => s.eraserSize);
  const isEraser = useDrawingStore((s) => s.isEraser);
  const pushStroke = useDrawingStore((s) => s.pushStroke);
  const undoStore = useDrawingStore((s) => s.undo);
  const redoStore = useDrawingStore((s) => s.redo);
  const clearStore = useDrawingStore((s) => s.clearCanvas);

  const completedPaths = useRef<StrokePath[]>([]);
  const currentPath = useRef<SkPath | null>(null);
  const completedPicture = useRef<SkPicture | null>(null);

  const currentColorRef = useRef(activeColor);
  const currentWidthRef = useRef(brushSize);
  const isEraserRef = useRef(isEraser);

  currentColorRef.current = isEraser ? '#FFFDF8' : activeColor;
  currentWidthRef.current = isEraser ? eraserSize : brushSize;
  isEraserRef.current = isEraser;

  const [, forceRepaint] = useReducer((n: number) => n + 1, 0);

  // Optimized picture generator for completed paths
  const updatePicture = useCallback(() => {
    if (width <= 0 || height <= 0) return;

    const recorder = Skia.PictureRecorder();
    const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, width, height));

    completedPaths.current.forEach(stroke => {
      const paint = Skia.Paint();
      paint.setStyle(PaintStyle.Stroke);
      paint.setStrokeCap(StrokeCap.Round);
      paint.setStrokeJoin(StrokeJoin.Round);
      paint.setColor(Skia.Color(stroke.color));
      paint.setStrokeWidth(stroke.width);
      canvas.drawPath(stroke.path, paint);
    });

    completedPicture.current = recorder.finishRecordingAsPicture();
    forceRepaint();
  }, [width, height]);

  // Initial picture
  useEffect(() => {
    updatePicture();
  }, [updatePicture]);

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      stopBrushSound();
    };
  }, []);

  const gesture = Gesture.Pan()
    .minDistance(0)
    .runOnJS(true)
    .onBegin((e) => {
      if (disabled) return;
      const path = Skia.Path.Make();
      path.moveTo(e.x, e.y);
      currentPath.current = path;
      forceRepaint();
      startBrushSound();
    })
    .onUpdate((e) => {
      if (!currentPath.current) return;
      currentPath.current.lineTo(e.x, e.y);
      forceRepaint();
    })
    .onEnd(() => {
      if (!currentPath.current) return;
      const finishedPath = currentPath.current;
      const color = currentColorRef.current;
      const widthValue = currentWidthRef.current;

      completedPaths.current.push({ path: finishedPath, color, width: widthValue });
      pushStroke({ pathData: finishedPath.toSVGString(), color, width: widthValue });
      currentPath.current = null;
      updatePicture(); // Bake the new stroke into the picture
      stopBrushSound();
    })
    .onFinalize(() => {
      stopBrushSound();
    });

  useImperativeHandle(ref, () => ({
    undo: () => {
      if (completedPaths.current.length === 0) return;
      undoStore();
      completedPaths.current = completedPaths.current.slice(0, -1);
      updatePicture();
    },
    redo: () => {
      const redoHistory = useDrawingStore.getState().redoHistory;
      if (redoHistory.length === 0) return;

      const nextStroke = redoHistory[0];
      const nextPath = Skia.Path.MakeFromSVGString(nextStroke.pathData);
      if (nextPath) {
        completedPaths.current.push({
          path: nextPath,
          color: nextStroke.color,
          width: nextStroke.width,
        });
        redoStore();
        updatePicture();
      }
    },
    clear: () => {
      completedPaths.current = [];
      currentPath.current = null;
      completedPicture.current = null;
      clearStore();
      updatePicture();
    },
    getSnapshot: () => {
      if (width <= 0 || height <= 0) return null;

      // Vẽ lại toàn bộ completed paths vào một Surface tạm
      const surface = Skia.Surface.Make(width, height);
      if (!surface) return null;

      const canvas = surface.getCanvas();

      // Nền trắng
      canvas.drawColor(Skia.Color('#FFFDF8'));

      // Vẽ picture đã baked (tất cả completed strokes)
      if (completedPicture.current) {
        canvas.drawPicture(completedPicture.current);
      }

      // Vẽ thêm currentPath nếu đang có nét chưa xong
      if (currentPath.current) {
        const paint = Skia.Paint();
        paint.setStyle(PaintStyle.Stroke);
        paint.setStrokeCap(StrokeCap.Round);
        paint.setStrokeJoin(StrokeJoin.Round);
        paint.setColor(Skia.Color(currentColorRef.current));
        paint.setStrokeWidth(currentWidthRef.current);
        canvas.drawPath(currentPath.current, paint);
      }

      // Encode sang base64 PNG
      const image = surface.makeImageSnapshot();
      return image.encodeToBase64(); // base64 string, không có prefix
    },
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Canvas style={[styles.canvas, { width, height }]}>
        {/* Render all completed strokes as a single cached picture */}
        {completedPicture.current && (
          <Picture picture={completedPicture.current} />
        )}

        {/* Render only the active stroke as a React component for feedback */}
        {currentPath.current && (
          <Path
            path={currentPath.current}
            color={currentColorRef.current}
            style="stroke"
            strokeWidth={currentWidthRef.current}
            strokeCap="round"
            strokeJoin="round"
          />
        )}
      </Canvas>
    </GestureDetector>
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';
export default React.memo(DrawingCanvas);

const styles = StyleSheet.create({
  canvas: {
    backgroundColor: '#FFFDF8',
  },
});
