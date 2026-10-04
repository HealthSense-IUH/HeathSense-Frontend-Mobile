export type ProfileAccountStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'LOCKED' | 'PENDING_VERIFY' | string;

/** Hồ sơ tài khoản (GET /api/users/me) — cùng cấu trúc với web types/profile. */
export interface UserProfile {
  id?: string | number;
  email?: string;
  role?: string;
  status?: ProfileAccountStatus;
  displayName?: string;
  fullName?: string;
  phone?: string;
  /** yyyy-MM-dd */
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  avatarUrl?: string;
  timezone?: string;
  citizenId?: string;
  bankAccount?: string;
  healthInsuranceNumber?: string;
  identityCardFrontUrl?: string;
  identityCardBackUrl?: string;
  identityCardFrontRotate?: number;
  identityCardBackRotate?: number;
  createdAt?: string | number;
  updatedAt?: string | number;
}

export interface ProfileUpdateRequest {
  displayName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  avatarUrl?: string;
  citizenId?: string;
  bankAccount?: string;
  healthInsuranceNumber?: string;
  identityCardFrontUrl?: string;
  identityCardBackUrl?: string;
  identityCardFrontRotate?: number;
  identityCardBackRotate?: number;
}

export interface AvatarPresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  s3Key: string;
}
