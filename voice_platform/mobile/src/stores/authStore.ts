import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import type { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  serverUrl: string | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  setServerUrl: (url: string) => void;
}

// SecureStore 适配器 / SecureStore adapter
const secureStorage = {
  getItem: async (name: string) => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string) => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string) => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      serverUrl: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      updateUser: (user) => set({ user }),
      setServerUrl: (url) => set({ serverUrl: url }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
