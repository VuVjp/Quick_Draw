import { create } from 'zustand';

export type BrushColor = string;
export type BrushSize = number;

export type StrokeRecord = {
  pathData: string; // SVG path string for serialization
  color: BrushColor;
  width: BrushSize;
};

type DrawingStore = {
  // Tool state
  activeColor: BrushColor;
  brushSize: BrushSize;
  isEraser: boolean;

  // History
  strokeHistory: StrokeRecord[];
  redoHistory: StrokeRecord[];

  // Actions
  setColor: (color: BrushColor) => void;
  setBrushSize: (size: BrushSize) => void;
  toggleEraser: () => void;
  pushStroke: (stroke: StrokeRecord) => void;
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
};

export const BRUSH_COLORS: BrushColor[] = [
  '#1E1E1E', // warm black
  '#FFFFFF', // white
  '#F6C445', // primary yellow
  '#F4978E', // pastel red
  '#B9D7EA', // soft blue
  '#A8D5BA', // success green
  '#F4B942', // gold
  '#F7D6D0', // light pink
  '#7B5EA7', // purple
  '#FF7043', // orange
  '#4CAF50', // green
  '#2196F3', // blue
];

export const BRUSH_SIZES: BrushSize[] = [3, 6, 10, 18, 30];

export const useDrawingStore = create<DrawingStore>((set) => ({
  activeColor: '#1E1E1E',
  brushSize: 6,
  isEraser: false,
  strokeHistory: [],
  redoHistory: [],

  setColor: (color) => set({ activeColor: color, isEraser: false }),
  setBrushSize: (size) => set({ brushSize: size }),
  toggleEraser: () => set((state) => ({ isEraser: !state.isEraser })),
  pushStroke: (stroke) =>
    set((state) => ({ 
      strokeHistory: [...state.strokeHistory, stroke],
      redoHistory: [] // Clear redo history when drawing something new
    })),
  undo: () =>
    set((state) => {
      if (state.strokeHistory.length === 0) return state;
      const last = state.strokeHistory[state.strokeHistory.length - 1];
      return {
        strokeHistory: state.strokeHistory.slice(0, -1),
        redoHistory: [last, ...state.redoHistory],
      };
    }),
  redo: () =>
    set((state) => {
      if (state.redoHistory.length === 0) return state;
      const first = state.redoHistory[0];
      return {
        strokeHistory: [...state.strokeHistory, first],
        redoHistory: state.redoHistory.slice(1),
      };
    }),
  clearCanvas: () => set({ strokeHistory: [], redoHistory: [] }),
}));
