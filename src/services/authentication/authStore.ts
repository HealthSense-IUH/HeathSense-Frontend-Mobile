import { create } from 'zustand';
import {
  getProfileApi,
  getStoredTokens,
  getStoredUser,
  loginApi,
  logoutApi,
  registerApi,
  updateProfileApi,
} from './index';
import { setOnAuthFailed } from '@/utils/axiosClient';
import { LoginRequest, RegisterRequest, UserSession } from '@/types/authentication';
import i18n from '@/i18n';

type AuthState = {
  user: UserSession | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  initializeAuth: () => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
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

  login: async (data: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await loginApi(data);
      set({ 
        user: response.userSession || null, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.message || i18n.t('auth:errors.loginFailed'),
        isLoading: false 
      });
      throw error;
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true, error: null });
    try {
      await registerApi(data);
      set({ isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || i18n.t('auth:errors.registerFailed'),
        isLoading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await logoutApi();
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error: any) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      console.warn('[authStore] Logout error:', error);
    }
  },

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
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        updateProfileApi({ timezone: tz })
          .then((updatedUser) => {
            if (updatedUser) {
              set({ user: updatedUser });
            }
          })
          .catch((err) => {
            console.warn('[authStore] Failed to sync timezone:', err?.message || err);
            // Fallback to getProfileApi if timezone update fails
            getProfileApi().then((u) => u && set({ user: u })).catch(() => {});
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

// Cleanly clear store if token refresh permanently fails
setOnAuthFailed(() => {
  useAuthStore.getState().clearUser();
});
