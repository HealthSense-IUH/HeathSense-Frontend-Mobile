import * as SecureStore from 'expo-secure-store';
import {
  ApiResponse,
  LoginRequest,
  MobileLoginResponse,
  MobileLogoutRequest,
  MobileRefreshRequest,
  RegisterRequest,
  UserSession,
} from '@/types/authentication';
import axiosClient, {
  ACCESS_TOKEN_KEY,
  clearStoredTokens,
  REFRESH_TOKEN_KEY,
  SESSION_ID_KEY,
  USER_SESSION_KEY,
} from '@/utils/axiosClient';

/**
 * Lưu toàn bộ Auth Data (Tokens & Session) vào SecureStore
 */
export const saveAuthData = async (authData: MobileLoginResponse): Promise<void> => {
  try {
    if (authData.accessToken) {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, authData.accessToken);
    }
    if (authData.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, authData.refreshToken);
    }
    if (authData.sessionId) {
      await SecureStore.setItemAsync(SESSION_ID_KEY, authData.sessionId);
    }
    if (authData.userSession) {
      await SecureStore.setItemAsync(USER_SESSION_KEY, JSON.stringify(authData.userSession));
    }
  } catch (error) {
    console.error('[authService] Error saving auth data:', error);
  }
};

/**
 * Lấy UserSession đã lưu trong SecureStore
 */
export const getStoredUser = async (): Promise<UserSession | null> => {
  try {
    const json = await SecureStore.getItemAsync(USER_SESSION_KEY);
    if (!json) return null;
    return JSON.parse(json) as UserSession;
  } catch (error) {
    console.error('[authService] Error reading stored user:', error);
    return null;
  }
};

/**
 * Lấy toàn bộ Tokens đã lưu
 */
export const getStoredTokens = async () => {
  try {
    const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    const sessionId = await SecureStore.getItemAsync(SESSION_ID_KEY);
    return { accessToken, refreshToken, sessionId };
  } catch (error) {
    console.error('[authService] Error reading stored tokens:', error);
    return { accessToken: null, refreshToken: null, sessionId: null };
  }
};

/**
 * Đăng nhập dành cho Mobile (POST /api/auth/mobile/login)
 */
export const loginApi = async (data: LoginRequest): Promise<MobileLoginResponse> => {
  const response = await axiosClient.post<ApiResponse<MobileLoginResponse>>(
    '/api/auth/mobile/login',
    data
  );

  const result = response.data?.data || response.data?.result || (response.data as any);
  if (!result || !result.accessToken) {
    throw new Error(response.data?.message || 'Đăng nhập không thành công');
  }

  await saveAuthData(result);
  return result;
};

/**
 * Đăng ký tài khoản (POST /api/auth/register)
 */
export const registerApi = async (data: RegisterRequest): Promise<UserSession> => {
  const response = await axiosClient.post<ApiResponse<UserSession>>(
    '/api/auth/register',
    data
  );

  const result = response.data?.data || response.data?.result || (response.data as any);
  if (!result) {
    throw new Error(response.data?.message || 'Đăng ký không thành công');
  }

  return result;
};

/**
 * Đăng xuất dành cho Mobile (POST /api/auth/mobile/logout)
 */
export const logoutApi = async (): Promise<void> => {
  try {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    const sessionId = await SecureStore.getItemAsync(SESSION_ID_KEY);

    if (refreshToken && sessionId) {
      const payload: MobileLogoutRequest = { refreshToken, sessionId };
      await axiosClient.post('/api/auth/mobile/logout', payload).catch((err) => {
        console.warn('[authService] Backend logout notice:', err?.response?.data || err?.message);
      });
    }
  } finally {
    await clearStoredTokens();
  }
};

/**
 * Làm mới Token dành cho Mobile (POST /api/auth/mobile/refresh)
 */
export const mobileRefreshApi = async (
  data: MobileRefreshRequest
): Promise<MobileLoginResponse> => {
  const response = await axiosClient.post<ApiResponse<MobileLoginResponse>>(
    '/api/auth/mobile/refresh',
    data
  );

  const result = response.data?.data || response.data?.result || (response.data as any);
  if (result) {
    await saveAuthData(result);
  }
  return result;
};

/**
 * Lấy thông tin User hiện tại từ API (GET /api/auth/me)
 */
export const getProfileApi = async (): Promise<UserSession> => {
  const response = await axiosClient.get<ApiResponse<UserSession>>('/api/auth/me');
  const user = response.data?.data || response.data?.result || (response.data as any);

  if (user) {
    await SecureStore.setItemAsync(USER_SESSION_KEY, JSON.stringify(user));
  }

  return user;
};

export { clearStoredTokens };
