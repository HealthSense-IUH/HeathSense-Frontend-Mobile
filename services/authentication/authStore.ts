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
  login: (data: LoginRequest) => Promise<UserSession>;
  register: (data: RegisterRequest) => Promise<UserSession>;
  logout: () => Promise<void>;
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

        // Background update profile info
        getProfileApi()
          .then((updatedUser) => {
            if (updatedUser) {
              set({ user: updatedUser });
            }
          })
          .catch(() => {
            // Keep stored user if offline
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

  login: async (data: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const res = await loginApi(data);
      set({
        user: res.userSession,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return res.userSession;
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Đăng nhập không thành công';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true, error: null });
    try {
      const res = await registerApi(data);
      set({ isLoading: false, error: null });
      return res;
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || 'Đăng ký không thành công';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await logoutApi();
    } catch (err) {
      console.warn('[authStore] Logout error:', err);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
