import { create } from 'zustand';
import {
  getProfileApi,
  getStoredTokens,
  getStoredUser,
  loginApi,
  logoutApi,
  registerApi,
} from './index';
import { LoginRequest, RegisterRequest, UserSession } from '@/types/authentication';

type AuthState = {
  user: UserSession | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  initializeAuth: () => Promise<void>;
  setUser: (user: UserSession) => void;
  clearUser: () => void;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  error: null,

  initializeAuth: async () => {
    try {
      set({ isLoading: true });
      const { accessToken } = await getStoredTokens();
      const user = await getStoredUser();

      if (accessToken && user) {
        set({
          user,
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false,
        });

        // Background update profile info & sync timezone
        import('./index').then(({ updateProfileApi }) => {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          updateProfileApi({ timezone: tz })
            .then((updatedUser) => {
              if (updatedUser) {
                set({ user: updatedUser });
              }
            })
            .catch((err) => {
              console.warn('[authStore] Failed to sync timezone:', err);
              // Fallback to getProfileApi if update fails
              getProfileApi().then(u => u && set({ user: u })).catch(() => {});
            });
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isInitialized: true,
          isLoading: false,
        });
      }
    } catch (err) {
      set({
        user: null,
        isAuthenticated: false,
        isInitialized: true,
        isLoading: false,
      });
    }
  },

  setUser: (user: UserSession) => set({
    user,
    isAuthenticated: true,
    error: null,
  }),

  clearUser: () => set({
    user: null,
    isAuthenticated: false,
    error: null,
  }),

  clearError: () => set({ error: null }),
}));
