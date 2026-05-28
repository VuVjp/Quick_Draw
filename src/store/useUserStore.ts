import { create } from 'zustand';
import { MOCK_STATS, MOCK_ACHIEVEMENTS } from '../constants/mockData';

export type Achievement = {
  id: string;
  icon: string;
  name: string;
  desc: string;
  unlocked: boolean;
};

export type UserProfile = {
  id: string;
  name: string;
  avatar: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  matchesPlayed: number;
  wins: number;
  winRate: number;
  bestWord: string;
  avgScore: number;
  achievements: Achievement[];
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  darkMode: boolean;
  bgmVolume: number;
};

type UserStore = UserProfile & {
  setName: (name: string) => void;
  setAvatar: (avatar: string) => void;
  addXP: (amount: number) => void;
  addCoins: (amount: number) => void;
  toggleSound: () => void;
  toggleHaptics: () => void;
  toggleDarkMode: () => void;
  setBgmVolume: (vol: number) => void;
  recordMatch: (won: boolean, score: number, word: string) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  id: 'me',
  name: 'SketchMaster',
  avatar: '🎨',
  level: MOCK_STATS.level,
  xp: MOCK_STATS.totalXP,
  xpToNextLevel: 5000,
  coins: MOCK_STATS.coins,
  matchesPlayed: MOCK_STATS.matchesPlayed,
  wins: MOCK_STATS.wins,
  winRate: MOCK_STATS.winRate,
  bestWord: MOCK_STATS.bestWord,
  avgScore: MOCK_STATS.avgScore,
  achievements: MOCK_ACHIEVEMENTS,
  soundEnabled: true,
  hapticsEnabled: true,
  darkMode: false,
  bgmVolume: 0.25,

  setName: (name) => set({ name }),
  setAvatar: (avatar) => set({ avatar }),

  addXP: (amount) =>
    set((state) => {
      const newXP = state.xp + amount;
      const levelUp = newXP >= state.xpToNextLevel;
      return {
        xp: levelUp ? newXP - state.xpToNextLevel : newXP,
        level: levelUp ? state.level + 1 : state.level,
        xpToNextLevel: levelUp ? state.xpToNextLevel + 1000 : state.xpToNextLevel,
      };
    }),

  addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setBgmVolume: (vol) => set({ bgmVolume: vol }),

  recordMatch: (won, score, word) =>
    set((state) => ({
      matchesPlayed: state.matchesPlayed + 1,
      wins: won ? state.wins + 1 : state.wins,
      winRate: Math.round(((won ? state.wins + 1 : state.wins) / (state.matchesPlayed + 1)) * 100),
      avgScore: Math.round((state.avgScore * state.matchesPlayed + score) / (state.matchesPlayed + 1)),
      bestWord: score > state.avgScore ? word : state.bestWord,
    })),
}));
