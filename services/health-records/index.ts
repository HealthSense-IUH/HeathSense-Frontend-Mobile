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
