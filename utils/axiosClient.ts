import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ApiResponse, MobileLoginResponse } from '../types/authentication';

// Default API Base URL (Android emulator uses 10.0.2.2:8080 to connect to localhost:8080)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/';

export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const SESSION_ID_KEY = 'session_id';
export const USER_SESSION_KEY = 'user_session';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
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

    if (error.response?.status === 401 && !originalRequest._retry) {
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
          }
        );

        const data = refreshResponse.data?.result || (refreshResponse.data as any);
        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;
        const newSessionId = data.sessionId || sessionId;

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

        axiosClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return axiosClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        await clearStoredTokens();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
