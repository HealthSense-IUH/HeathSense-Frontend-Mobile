import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ApiResponse, MobileLoginResponse } from '@/types/authentication';
import { currentLanguage } from '@/i18n';

// Default API Base URL (Android emulator uses 10.0.2.2:8080 to connect to localhost:8080)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.8:8080';

export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const SESSION_ID_KEY = 'session_id';
export const USER_SESSION_KEY = 'user_session';

let onAuthFailedCallback: (() => void) | null = null;
export const setOnAuthFailed = (callback: () => void) => {
  onAuthFailedCallback = callback;
};

export function preserveUnsafeIntegers(json: string): string {
  return json.replace(/([:\[,]\s*)(-?\d{16,})(?=\s*[,}\]])/g, '$1"$2"');
}

export function parseJsonPreservingUnsafeIntegers(data: unknown): unknown {
  if (typeof data !== 'string' || !data.trim()) {
    return data;
  }

  try {
    return JSON.parse(preserveUnsafeIntegers(data));
  } catch {
    return data;
  }
}

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  transformResponse: [parseJsonPreservingUnsafeIntegers],
  headers: {
    'Content-Type': 'application/json',
  },
});

// Race Condition control variables
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const clearStoredTokens = async () => {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(SESSION_ID_KEY);
    await SecureStore.deleteItemAsync(USER_SESSION_KEY);
  } catch (err) {
    console.warn('[axiosClient] Clear tokens error:', err);
  }
};

// --- REQUEST INTERCEPTOR ---
axiosClient.interceptors.request.use(
  async (config) => {
    try {
      const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      // Server trả thông báo theo ngôn ngữ đang chọn trên app (giống web: header lang + Accept-Language)
      const lang = currentLanguage();
      config.headers.lang = lang;
      config.headers['Accept-Language'] = lang;
    } catch (e) {
      console.warn('[axiosClient] Error reading access token:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- RESPONSE INTERCEPTOR ---
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isAuthEndpoint = originalRequest.url?.includes('/api/auth/mobile/refresh') ||
                           originalRequest.url?.includes('/api/auth/mobile/login');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        const sessionId = await SecureStore.getItemAsync(SESSION_ID_KEY);

        if (!refreshToken || !sessionId) {
          throw new Error('Missing refresh_token or session_id');
        }

        // Dedicated refresh request (clean instance to avoid interceptor loops)
        const refreshResponse = await axios.post<ApiResponse<MobileLoginResponse>>(
          `${API_BASE_URL}/api/auth/mobile/refresh`,
          {
            refreshToken,
            sessionId,
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
            transformResponse: [parseJsonPreservingUnsafeIntegers],
          }
        );

        const raw = refreshResponse.data;
        const data = (raw as any)?.data || (raw as any)?.result || raw;
        const newAccessToken = data?.accessToken;
        const newRefreshToken = data?.refreshToken;
        const newSessionId = data?.sessionId || sessionId;

        if (!newAccessToken) {
          throw new Error('Refresh response missing access token');
        }

        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, newAccessToken);
        if (newRefreshToken) {
          await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);
        }
        if (newSessionId) {
          await SecureStore.setItemAsync(SESSION_ID_KEY, newSessionId);
        }
        if (data?.userSession) {
          await SecureStore.setItemAsync(USER_SESSION_KEY, JSON.stringify(data.userSession));
        }

        axiosClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return axiosClient(originalRequest);
      } catch (err: any) {
        processQueue(err, null);
        const status = err?.response?.status;
        // Only clear tokens and trigger logout if refresh token was invalid/expired/rejected
        if (status === 401 || status === 403 || status === 400 || err?.message === 'Missing refresh_token or session_id') {
          await clearStoredTokens();
          onAuthFailedCallback?.();
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
