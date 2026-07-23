//////////Common//////////
export interface UserSession {
    userId: number;
    email: string;
    fullName: string;
    role: string;
    accountStatus: string;
}

export interface ApiResponse<T> {
    code?: number;
    message?: string;
    data?: T;
    result?: T;
}

//////////Request////////
export interface MobileRefreshRequest {
    refreshToken: string;
    sessionId: string;
    seassionId?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    fullName: string;
}

export interface MobileLogoutRequest {
    refreshToken: string;
    sessionId: string;
}

//////////Response////////
export interface MobileLoginResponse {
    accessToken: string;
    refreshToken: string;
    sessionId: string;
    tokenType: string;
    userSession: UserSession;
}