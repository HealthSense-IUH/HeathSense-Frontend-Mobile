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
import i18n from '@/i18n';

/**
 * Chuẩn hóa UserSession từ các payload khác nhau (RegisterResponse, UserResponse)
 */
export const normalizeUserSession = (raw: any, fallback?: UserSession | null): UserSession => {
  if (!raw) return raw;
  const userId = raw.userId ?? raw.id ?? fallback?.userId ?? fallback?.id ?? 0;
  const fullName = raw.fullName ?? raw.displayName ?? fallback?.fullName ?? fallback?.displayName ?? '';
  const accountStatus = raw.accountStatus ?? raw.status ?? fallback?.accountStatus ?? fallback?.status ?? 'ACTIVE';

  return {
    userId,
    id: userId,
    email: raw.email ?? fallback?.email ?? '',
    fullName,
    displayName: fullName,
    role: raw.role ?? fallback?.role ?? 'MEMBER',
    accountStatus,
    status: accountStatus,
    timezone: raw.timezone ?? fallback?.timezone,
    avatarUrl: raw.avatarUrl ?? fallback?.avatarUrl,
    phone: raw.phone ?? fallback?.phone,
  };
};

/**
 * Lưu toàn bộ Auth Data (Tokens & Session) vào SecureStore
 */
export const saveAuthData = async (authData: MobileLoginResponse): Promise<void> => {
  try {
    const promises: Promise<void>[] = [];
    if (authData.accessToken) {
      promises.push(SecureStore.setItemAsync(ACCESS_TOKEN_KEY, authData.accessToken));
    }
    if (authData.refreshToken) {
      promises.push(SecureStore.setItemAsync(REFRESH_TOKEN_KEY, authData.refreshToken));
    }
    if (authData.sessionId) {
      promises.push(SecureStore.setItemAsync(SESSION_ID_KEY, authData.sessionId));
    }
    if (authData.userSession) {
      const normalized = normalizeUserSession(authData.userSession);
      promises.push(SecureStore.setItemAsync(USER_SESSION_KEY, JSON.stringify(normalized)));
    }
    await Promise.all(promises);
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
    const parsed = JSON.parse(json);
    return normalizeUserSession(parsed);
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
    const [accessToken, refreshToken, sessionId] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.getItemAsync(SESSION_ID_KEY),
    ]);
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
    throw new Error(response.data?.message || i18n.t('auth:errors.loginFailed'));
  }

  if (result.userSession) {
    result.userSession = normalizeUserSession(result.userSession);
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
    throw new Error(response.data?.message || i18n.t('auth:errors.registerFailed'));
  }

  return normalizeUserSession(result);
};

/**
 * Đăng xuất dành cho Mobile (POST /api/auth/mobile/logout)
 */
export const logoutApi = async (): Promise<void> => {
  try {
    const [refreshToken, sessionId] = await Promise.all([
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.getItemAsync(SESSION_ID_KEY),
    ]);

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
  if (result?.userSession) {
    result.userSession = normalizeUserSession(result.userSession);
  }
  if (result) {
    await saveAuthData(result);
  }
  return result;
};

/**
 * Lấy thông tin User hiện tại từ API (GET /api/users/me)
 */
export const getProfileApi = async (): Promise<UserSession> => {
  const response = await axiosClient.get<ApiResponse<any>>('/api/users/me');
  const raw = response.data?.data || response.data?.result || (response.data as any);
  const currentUser = await getStoredUser();
  const user = normalizeUserSession(raw, currentUser);

  if (user) {
    await SecureStore.setItemAsync(USER_SESSION_KEY, JSON.stringify(user));
  }

  return user;
};

/**
 * Cập nhật thông tin User hiện tại (PATCH /api/users/me)
 */
export const updateProfileApi = async (data: Partial<UserSession>): Promise<UserSession> => {
  const response = await axiosClient.patch<ApiResponse<any>>('/api/users/me', data);
  const raw = response.data?.data || response.data?.result || (response.data as any);
  const currentUser = await getStoredUser();
  const user = normalizeUserSession(raw, currentUser);
  if (user) {
    await SecureStore.setItemAsync(USER_SESSION_KEY, JSON.stringify(user));
  }
  return user;
};

export { clearStoredTokens };
