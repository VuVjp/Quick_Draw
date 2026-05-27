import { create } from 'zustand';
import { MOCK_PLAYERS } from '../constants/mockData';
import { getRandomWord } from '../constants/words';

export type Player = {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  score: number;
  isDrawing: boolean;
  isHost: boolean;
  color: string;
};

export type GamePhase = 'waiting' | 'choosing' | 'drawing' | 'roundEnd' | 'gameEnd';
export type Difficulty = 'Dễ' | 'Trung bình' | 'Khó';

type GameStore = {
  // Room
  roomId: string | null;
  roomName: string;
  players: Player[];
  maxPlayers: number;
  rounds: number;
  currentRound: number;
  drawTime: number;
  difficulty: Difficulty;
  peerReviewEnabled: boolean;
  isSinglePlayer: boolean;
  isPrivate: boolean;

  // Drawing phase
  phase: GamePhase;
  currentWord: string;
  wordHint: string;
  currentDrawerId: string | null;
  timeLeft: number;

  // Actions
  joinRoom: (roomId: string, roomName: string) => void;
  leaveRoom: () => void;
  startGame: () => void;
  startRound: () => void;
  endRound: (scores: Record<string, number>) => void;
  endGame: () => void;
  setPhase: (phase: GamePhase) => void;
  setTimeLeft: (t: number) => void;
  setRoomConfig: (config: Partial<GameStore>) => void;
  startSinglePlayer: () => void;
  addPlayer: (player: Player) => void;
  removePlayer: (id: string) => void;
  updateScore: (playerId: string, points: number) => void;
  revealHintLetter: () => void;
};

export const useGameStore = create<GameStore>((set, get) => ({
  roomId: null,
  roomName: '',
  players: MOCK_PLAYERS,
  maxPlayers: 8,
  rounds: 5,
  currentRound: 0,
  drawTime: 80,
  difficulty: 'Trung bình',
  peerReviewEnabled: false,
  isSinglePlayer: false,
  isPrivate: false,
  phase: 'waiting',
  currentWord: '',
  wordHint: '',
  currentDrawerId: null,
  timeLeft: 80,

  joinRoom: (roomId, roomName) =>
    set({ roomId, roomName, phase: 'waiting' }),

  leaveRoom: () =>
    set({ roomId: null, roomName: '', phase: 'waiting', currentRound: 0 }),

  startGame: () => {
    const { players } = get();
    const drawer = players[0];
    set({
      phase: 'choosing',
      currentRound: 1,
      currentDrawerId: drawer.id,
      players: players.map((p) => ({ ...p, score: 0, isDrawing: p.id === drawer.id })),
    });
  },

  startRound: () => {
    const word = getRandomWord();
    const { drawTime } = get();
    set({ phase: 'drawing', currentWord: word, wordHint: '', timeLeft: drawTime });
  },

  endRound: (scores) =>
    set((state) => ({
      phase: 'roundEnd',
      players: state.players.map((p) => ({
        ...p,
        score: p.score + (scores[p.id] ?? 0),
      })),
    })),

  endGame: () => set({ phase: 'gameEnd' }),

  setPhase: (phase) => set({ phase }),

  setTimeLeft: (t) => set({ timeLeft: t }),

  setRoomConfig: (config) => set((state) => ({ ...state, ...config })),

  startSinglePlayer: () => {
    const word = getRandomWord();
    set({
      isSinglePlayer: true,
      phase: 'drawing',
      players: [{ ...MOCK_PLAYERS[0], isDrawing: true, score: 0 }],
      currentDrawerId: MOCK_PLAYERS[0].id,
      currentRound: 1,
      currentWord: word,
      wordHint: '',
      timeLeft: 80,
      difficulty: 'Trung bình', // Default for single player
      peerReviewEnabled: false,
    });
  },

  addPlayer: (player) =>
    set((state) => ({ players: [...state.players, player] })),

  removePlayer: (id) =>
    set((state) => ({ players: state.players.filter((p) => p.id !== id) })),

  updateScore: (playerId, points) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, score: p.score + points } : p
      ),
    })),

  revealHintLetter: () =>
    set((state) => {
      const word = state.currentWord;
      const current = state.wordHint;
      const hiddenIndices = current
        .split('')
        .map((c, i) => (c === '_' ? i : -1))
        .filter((i) => i !== -1);
      if (hiddenIndices.length === 0) return {};
      const revealIdx = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
      const newHint = current.split('');
      newHint[revealIdx] = word[revealIdx];
      return { wordHint: newHint.join('') };
    }),
}));
