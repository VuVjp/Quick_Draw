import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useReducer,
} from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, Path, Skia, SkPath } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useDrawingStore } from '../store/useDrawingStore';

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
};

type Props = {
  width: number;
  height: number;
  disabled?: boolean;
};

// ─── DrawingCanvas ────────────────────────────────────────────────────────────
/**
 * Fully isolated Skia canvas.
 * • Completed paths live in a ref — no React state during drawing
 * • Current in-progress path also in a ref
 * • A single useReducer counter forces a repaint only when needed
 * • Zero parent re-renders during a stroke
 */
const DrawingCanvas = forwardRef<DrawingCanvasRef, Props>(({ width, height, disabled }, ref) => {
  const activeColor = useDrawingStore((s) => s.activeColor);
  const brushSize = useDrawingStore((s) => s.brushSize);
  const isEraser = useDrawingStore((s) => s.isEraser);
  const pushStroke = useDrawingStore((s) => s.pushStroke);
  const undoStore = useDrawingStore((s) => s.undo);
  const redoStore = useDrawingStore((s) => s.redo);
  const clearStore = useDrawingStore((s) => s.clearCanvas);

  // All path data in refs — avoids React re-renders
  const completedPaths = useRef<StrokePath[]>([]);
  const currentPath = useRef<SkPath | null>(null);
  const currentColorRef = useRef(activeColor);
  const currentWidthRef = useRef(brushSize);
  const isEraserRef = useRef(isEraser);

  // Sync refs to store values (store changes = tool bar interaction, rare)
  currentColorRef.current = isEraser ? '#FFFDF8' : activeColor;
  currentWidthRef.current = isEraser ? brushSize * 3 : brushSize;
  isEraserRef.current = isEraser;

  // Single counter to trigger canvas repaint without heavy re-renders
  const [, forceRepaint] = useReducer((n: number) => n + 1, 0);

  const handleRepaint = useCallback(() => {
    forceRepaint();
  }, []);

  // ── Gesture ──────────────────────────────────────────────────────────────
  const gesture = Gesture.Pan()
    .minDistance(0)
    .runOnJS(true)
    .onBegin((e) => {
      if (disabled) return;
      const path = Skia.Path.Make();
      path.moveTo(e.x, e.y);
      currentPath.current = path;
      handleRepaint();
    })
    .onUpdate((e) => {
      if (!currentPath.current) return;
      currentPath.current.lineTo(e.x, e.y);
      handleRepaint();
    })
    .onEnd(() => {
      if (!currentPath.current) return;
      const finishedPath = currentPath.current;
      const color = currentColorRef.current;
      const width = currentWidthRef.current;

      completedPaths.current.push({ path: finishedPath, color, width });
      // Persist to Zustand for undo history (stores SVG string, lightweight)
      pushStroke({ pathData: finishedPath.toSVGString(), color, width });
      currentPath.current = null;
      handleRepaint();
    });

  // ── Imperative API ────────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    undo: () => {
      if (completedPaths.current.length === 0) return;
      undoStore();
      completedPaths.current = completedPaths.current.slice(0, -1);
      forceRepaint();
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
        forceRepaint();
      }
    },
    clear: () => {
      completedPaths.current = [];
      currentPath.current = null;
      clearStore();
      forceRepaint();
    },
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Canvas style={[styles.canvas, { width, height }]}>
        {/* Render completed strokes */}
        {completedPaths.current.map((stroke, i) => (
          <Path
            key={i}
            path={stroke.path}
            color={stroke.color}
            style="stroke"
            strokeWidth={stroke.width}
            strokeCap="round"
            strokeJoin="round"
          />
        ))}

        {/* Render in-progress stroke */}
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
