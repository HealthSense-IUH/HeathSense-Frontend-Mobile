import axiosClient from '@/utils/axiosClient';
import { HealthStatisticsResponse } from '@/types/health-records';
import { ApiResponse } from '@/types/authentication'; // Reusing ApiResponse if it's generic

export const getHealthStatisticsApi = async (
  period: string,
  referenceDate?: string,
  timezone?: string
): Promise<HealthStatisticsResponse> => {
  const response = await axiosClient.get<ApiResponse<HealthStatisticsResponse>>(
    '/api/health-records/statistics',
    {
      params: {
        period,
        referenceDate,
        timezone,
      },
    }
  );
  const result = response.data?.data || response.data?.result || (response.data as any);
  return result;
};

export const getAvailableHistoryDatesApi = async (
  timezone?: string
): Promise<string[]> => {
  const response = await axiosClient.get<ApiResponse<string[]>>(
    '/api/health-records/history/available-dates',
    { params: { timezone } }
  );
  return response.data?.data || response.data?.result || (response.data as any);
};

export const getRecordsByDateApi = async (
  date: string,
  timezone?: string
): Promise<import('@/types/health-records').HealthRecordResponse[]> => {
  const response = await axiosClient.get<ApiResponse<import('@/types/health-records').HealthRecordResponse[]>>(
    '/api/health-records/history/by-date',
    { params: { date, timezone } }
  );
  return response.data?.data || response.data?.result || (response.data as any);
};
