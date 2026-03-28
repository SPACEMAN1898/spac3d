import { create } from 'zustand';
import type { AuthResponse } from '@clinikchat/shared';
import * as storage from './storage';

interface AuthState {
  accessToken: string | null;
  user: AuthResponse['user'] | null;
  isLoading: boolean;
  setAuth: (data: AuthResponse) => Promise<void>;
  loadAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isLoading: true,

  setAuth: async (data) => {
    await storage.setAccessToken(data.accessToken);
    await storage.setRefreshToken(data.refreshToken);
    await storage.setStoredUser(JSON.stringify(data.user));
    set({ accessToken: data.accessToken, user: data.user, isLoading: false });
  },

  loadAuth: async () => {
    try {
      const token = await storage.getAccessToken();
      const userStr = await storage.getStoredUser();
      if (token && userStr) {
        set({ accessToken: token, user: JSON.parse(userStr), isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await storage.clearAll();
    set({ accessToken: null, user: null });
  },
}));
