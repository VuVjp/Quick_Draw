import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type AuthSession = {
  displayName?: string;
  email?: string;
  uid?: string;
};

const AUTH_SESSION_KEY = 'user_token';

type UserStore = {
  session: AuthSession | null;
  setSession: (s: AuthSession | null) => void;
  clearSession: () => Promise<void>;
  loadSession: () => Promise<void>;
};

export const useUserStore = create<UserStore>((set, get) => ({
  session: null,
  setSession: (s) => set({ session: s }),
  clearSession: async () => {
    set({ session: null });
    try {
      await AsyncStorage.removeItem(AUTH_SESSION_KEY);
    } catch (e) {
      console.error('Failed to clear session', e);
    }
  },
  loadSession: async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_SESSION_KEY);
      if (!token) return;

      try {
        const parsed = JSON.parse(token) as AuthSession;
        if (parsed?.uid) set({ session: parsed });
        else set({ session: { displayName: String(token), uid: String(token), email: '' } });
      } catch {
        set({ session: { displayName: String(token), uid: String(token), email: '' } });
      }
    } catch (e) {
      console.error('Failed to load session', e);
    }
  },
}));

export default useUserStore;

