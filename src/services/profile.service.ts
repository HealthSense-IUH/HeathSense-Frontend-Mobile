import axios from 'axios';
import axiosClient from '@/utils/axiosClient';
import type { ApiResponse } from '@/types/base';
import type { AvatarPresignedUrlResponse, ProfileUpdateRequest, UserProfile } from '@/types/profile';

const unwrap = <T>(res: { data: ApiResponse<T> | T }): T => {
  const body = res.data as any;
  return body?.data ?? body?.result ?? body;
};

/** Hồ sơ tài khoản — cùng endpoint với web services/profile.service.ts */
export const profileApi = {
  /** GET /api/users/me */
  async getMe(): Promise<UserProfile> {
    return unwrap<UserProfile>(await axiosClient.get<ApiResponse<UserProfile>>('/api/users/me'));
  },
  /** PATCH /api/users/me */
  async updateMe(payload: ProfileUpdateRequest): Promise<UserProfile> {
    return unwrap<UserProfile>(await axiosClient.patch<ApiResponse<UserProfile>>('/api/users/me', payload));
  },
  /** Tải ảnh đại diện: xin link S3 → PUT file → trả publicUrl để lưu vào hồ sơ. */
  async uploadAvatar(localUri: string, fileName: string, contentType: string): Promise<string> {
    const presigned = unwrap<AvatarPresignedUrlResponse>(
      await axiosClient.post<ApiResponse<AvatarPresignedUrlResponse>>('/api/users/me/avatar/presigned-url', { fileName, contentType })
    );
    const blob = await (await fetch(localUri)).blob();
    await axios.put(presigned.uploadUrl, blob, { headers: { 'Content-Type': contentType } });
    return presigned.publicUrl;
  },
};
