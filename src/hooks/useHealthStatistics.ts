import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getHealthStatisticsApi } from '@/services/health-records';
import { HealthStatisticsResponse } from '@/types/health-records';
import { QUERY_KEYS } from '@/constants/queryKeys';

/** Kỳ thống kê — mã gửi thẳng lên API; nhãn hiển thị lấy qua t('health:analysis.filter.<code>'). */
export type StatisticsPeriod = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
export const STATISTICS_PERIODS: StatisticsPeriod[] = ['DAY', 'WEEK', 'MONTH', 'YEAR'];

export const useHealthStatistics = (filter: StatisticsPeriod, referenceDate: Date) => {
  const period: StatisticsPeriod = filter;

  const formattedDate = referenceDate.toISOString();
  const dateKey = formattedDate.split('T')[0];

  let timezone = 'UTC';
  try {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
  } catch (e) {
    console.warn('Intl not supported, falling back to UTC', e);
  }

  const query = useQuery<HealthStatisticsResponse, Error>({
    queryKey: [QUERY_KEYS.HEALTH_STATS, period, dateKey],
    queryFn: () => getHealthStatisticsApi(period, formattedDate, timezone),
    placeholderData: keepPreviousData, // <--- Giữ data cũ trong lúc fetch data mới để chống giật UI
  });

  return {
    data: query.data,
    loading: query.isLoading, // Chỉ true ở lần đầu tiên hoàn toàn chưa có data
    isFetching: query.isFetching, // True mỗi khi đang call API (kể cả lúc đang hiện data cũ)
    error: query.error?.message || null,
  };
};
