import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  getAvailableHistoryDatesApi,
  getHealthRecordApi,
  getMyRecordsApi,
  getRecordsByDateApi,
} from '@/services/health-records';
import { HealthRecordPageResponse, HealthRecordResponse } from '@/types/health-records';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { queryClient } from '@/utils/queryClient';
import { getDeviceTimezone } from '@/utils/formatters';

export const useAvailableHistoryDates = (timezone: string = getDeviceTimezone()) => {
  return useQuery<string[]>({
    queryKey: [QUERY_KEYS.HEALTH_HISTORY_DATES, timezone],
    queryFn: () => getAvailableHistoryDatesApi(timezone),
  });
};

export const useRecordsByDate = (date: string, timezone: string = getDeviceTimezone()) => {
  return useQuery<HealthRecordResponse[]>({
    queryKey: [QUERY_KEYS.HEALTH_HISTORY_BY_DATE, date, timezone],
    queryFn: () => getRecordsByDateApi(date, timezone),
    enabled: !!date,
  });
};

/** Trang bản ghi của tôi; giữ trang cũ trong lúc tải trang mới để danh sách không nháy. */
export const useMyRecords = (page: number, size = 10) => {
  return useQuery<HealthRecordPageResponse>({
    queryKey: [QUERY_KEYS.HEALTH_RECORDS, page, size],
    queryFn: () => getMyRecordsApi(page, size),
    placeholderData: keepPreviousData,
  });
};

/** Tìm bản ghi trong các danh sách đã tải (my-records, theo ngày) để màn chi tiết hiện ngay. */
const findRecordInCache = (id: string): HealthRecordResponse | undefined => {
  for (const [, data] of queryClient.getQueriesData<HealthRecordPageResponse>({ queryKey: [QUERY_KEYS.HEALTH_RECORDS] })) {
    const found = data?.content?.find((r) => String(r.id) === id);
    if (found) return found;
  }
  for (const [, data] of queryClient.getQueriesData<HealthRecordResponse[]>({ queryKey: [QUERY_KEYS.HEALTH_HISTORY_BY_DATE] })) {
    const found = data?.find((r) => String(r.id) === id);
    if (found) return found;
  }
  return undefined;
};

export const useHealthRecord = (id?: string | number) => {
  const key = id != null ? String(id) : '';
  return useQuery<HealthRecordResponse>({
    queryKey: [QUERY_KEYS.HEALTH_RECORD, key],
    queryFn: () => getHealthRecordApi(key),
    enabled: !!key,
    placeholderData: () => findRecordInCache(key),
    // Bản ghi đang được AI phân tích thì tự hỏi lại server mỗi 3 giây tới khi có kết quả
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'PROCESSING' || status === 'PENDING_ANALYSIS' || status === 'PENDING_UPLOAD' ? 3000 : false;
    },
  });
};
