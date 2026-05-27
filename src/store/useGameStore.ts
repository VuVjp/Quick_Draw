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

export type RoomInfo = {
  id: string;
  name: string;
  players: number;
  maxPlayers: number;
  color: 'default' | 'blue' | 'yellow';
  isOwner?: boolean;
};

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
  roundDrawing: any[]; // We will use StrokeRecord[] but use any[] here to avoid circular dependency if not imported or just import it

  // Lobby
  availableRooms: RoomInfo[];

  // Actions
  joinRoom: (roomId: string, roomName: string, initialPlayersCount?: number, maxPlayers?: number) => void;
  leaveRoom: () => void;
  startGame: () => void;
  startRound: () => void;
  endRound: (scores: Record<string, number>, drawing: any[]) => void;
  endGame: () => void;
  setPhase: (phase: GamePhase) => void;
  setTimeLeft: (t: number) => void;
  setRoomConfig: (config: Partial<GameStore>) => void;
  startSinglePlayer: (nickname: string, rounds: number, drawTime: number, difficulty: Difficulty, botCount: number) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (id: string) => void;
  updateScore: (playerId: string, points: number) => void;
  revealHintLetter: () => void;
  addRoom: (room: RoomInfo) => void;
  removeRoom: (id: string) => void;
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
  roundDrawing: [],
  availableRooms: [
    { id: '1', name: 'Doodle to Win ', players: 4, maxPlayers: 8, color: 'blue' },
    { id: '2', name: 'Nét Vẽ Chết Chóc ', players: 2, maxPlayers: 8, color: 'default' },
    { id: '5', name: 'Chiến Thần Hội Họa ', players: 8, maxPlayers: 8, color: 'yellow' },
    { id: '34', name: 'Vẽ Hay Hoặc Chết ', players: 1, maxPlayers: 8, color: 'default' },
  ],

  joinRoom: (roomId, roomName, initialPlayersCount = 1, maxPlayers = 8) => {
    const realPlayer = MOCK_PLAYERS[0];
    
    const avatars = ['🤖', '👾', '👻', '👽', '🤠', '🤡', '🎃', '🐯', '🐼', '🦊'];
    const colors = ['#F4978E', '#B9D7EA', '#A8D5BA', '#F7D6D0', '#7B5EA7', '#FF7043', '#4CAF50', '#FFEB3B', '#00BCD4', '#E91E63'];
    
    const botsCount = Math.max(0, initialPlayersCount - 1);
    const bots = Array.from({ length: botsCount }).map((_, i) => ({
      id: `bot-${i}`,
      name: `Player ${i + 2}`,
      avatar: avatars[i % avatars.length],
      xp: 1000 + i * 500,
      level: 5 + i,
      score: 0,
      isDrawing: false,
      isHost: false,
      color: colors[i % colors.length]
    }));

    set({ 
      roomId, 
      roomName, 
      phase: 'waiting', 
      players: [realPlayer, ...bots],
      maxPlayers,
      isSinglePlayer: false,
    });
  },

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

  endRound: (scores, drawing) =>
    set((state) => ({
      phase: 'roundEnd',
      roundDrawing: drawing,
      players: state.players.map((p) => ({
        ...p,
        score: p.score + (scores[p.id] ?? 0),
      })).sort((a, b) => b.score - a.score),
    })),

  endGame: () => set({ phase: 'gameEnd' }),

  setPhase: (phase) => set({ phase }),

  setTimeLeft: (t) => set({ timeLeft: t }),

  setRoomConfig: (config) => set((state) => ({ ...state, ...config })),

  startSinglePlayer: (nickname, rounds, drawTime, difficulty, botCount) => {
    const word = getRandomWord();
    const hint = word.replace(/[a-zA-Z]/g, '_');
    
    const realPlayer = { ...MOCK_PLAYERS[0], name: nickname, isDrawing: true, score: 0 };
    
    const avatars = ['🤖', '👾', '👻', '👽', '🤠', '🤡', '🎃'];
    const colors = ['#F4978E', '#B9D7EA', '#A8D5BA', '#F7D6D0', '#7B5EA7', '#FF7043', '#4CAF50'];
    const bots = Array.from({ length: botCount }).map((_, i) => ({
      id: `bot-${i}`,
      name: `Bot ${i + 1}`,
      avatar: avatars[i % avatars.length],
      xp: 1000 + i * 500,
      level: 5 + i,
      score: 0,
      isDrawing: false,
      isHost: false,
      color: colors[i % colors.length]
    }));

    set({
      isSinglePlayer: true,
      phase: 'drawing',
      players: [realPlayer, ...bots],
      currentDrawerId: realPlayer.id,
      rounds,
      drawTime,
      currentRound: 1,
      currentWord: word,
      wordHint: hint,
      timeLeft: drawTime,
      difficulty,
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

  addRoom: (room) => set((state) => ({ availableRooms: [room, ...state.availableRooms] })),
  removeRoom: (id) => set((state) => ({ availableRooms: state.availableRooms.filter(r => r.id !== id) })),
}));
