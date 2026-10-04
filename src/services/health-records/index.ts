import axiosClient from '@/utils/axiosClient';
import {
  HealthRecordPageResponse,
  HealthRecordResponse,
  HealthStatisticsResponse,
  PresignedUrlResponse,
} from '@/types/health-records';
import { ApiResponse } from '@/types/authentication';

/** Server bọc kết quả trong { data } (một số bản cũ dùng { result }). */
const unwrap = <T>(response: { data: ApiResponse<T> | T }): T => {
  const body = response.data as any;
  return body?.data ?? body?.result ?? body;
};

export const getHealthStatisticsApi = async (
  period: string,
  referenceDate?: string,
  timezone?: string
): Promise<HealthStatisticsResponse> => {
  const response = await axiosClient.get<ApiResponse<HealthStatisticsResponse>>(
    '/api/health-records/statistics',
    { params: { period, referenceDate, timezone } }
  );
  return unwrap(response);
};

export const getAvailableHistoryDatesApi = async (timezone?: string): Promise<string[]> => {
  const response = await axiosClient.get<ApiResponse<string[]>>(
    '/api/health-records/history/available-dates',
    { params: { timezone } }
  );
  return unwrap(response);
};

export const getRecordsByDateApi = async (
  date: string,
  timezone?: string
): Promise<HealthRecordResponse[]> => {
  const response = await axiosClient.get<ApiResponse<HealthRecordResponse[]>>(
    '/api/health-records/history/by-date',
    { params: { date, timezone } }
  );
  return unwrap(response);
};

/** Danh sách bản ghi của tôi, mới nhất trước, trang bắt đầu từ 1 (giống web). */
export const getMyRecordsApi = async (page = 1, size = 10): Promise<HealthRecordPageResponse> => {
  const response = await axiosClient.get<ApiResponse<HealthRecordPageResponse>>(
    '/api/health-records/my-records',
    { params: { page, size } }
  );
  return unwrap(response);
};

export const getHealthRecordApi = async (id: string | number): Promise<HealthRecordResponse> => {
  const response = await axiosClient.get<ApiResponse<HealthRecordResponse>>(`/api/health-records/${id}`);
  return unwrap(response);
};

/** Link tải file CSV gốc (presigned, có hạn). */
export const getRecordDownloadUrlApi = async (id: string | number): Promise<string | null> => {
  const response = await axiosClient.get<ApiResponse<PresignedUrlResponse>>(
    `/api/health-records/${id}/download-url`
  );
  return unwrap(response)?.uploadUrl ?? null;
};
