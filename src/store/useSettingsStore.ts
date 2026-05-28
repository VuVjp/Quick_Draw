import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const SETTINGS_KEY = 'app_settings_v1';

type Settings = {
  bgmVolume: number; // 0..1
  sfxVolume: number; // 0..1
  soundEnabled: boolean;
  hapticsEnabled: boolean;
};

type SettingsStore = Settings & {
  setBgmVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  toggleSound: () => void;
  toggleHaptics: () => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  bgmVolume: 0.25,
  sfxVolume: 1.0,
  soundEnabled: true,
  hapticsEnabled: true,

  setBgmVolume: (v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    set({ bgmVolume: clamped });
    void get().saveSettings();
  },

  setSfxVolume: (v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    set({ sfxVolume: clamped });
    void get().saveSettings();
  },

  toggleSound: () => {
    set((s) => ({ soundEnabled: !s.soundEnabled }));
    void get().saveSettings();
  },

  toggleHaptics: () => {
    set((s) => ({ hapticsEnabled: !s.hapticsEnabled }));
    void get().saveSettings();
  },

  loadSettings: async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Settings>;
      set((s) => ({ ...s, ...parsed }));
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  },

  saveSettings: async () => {
    try {
      const { bgmVolume, sfxVolume, soundEnabled, hapticsEnabled } = get();
      const payload: Settings = { bgmVolume, sfxVolume, soundEnabled, hapticsEnabled };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  },
}));

export default useSettingsStore;
