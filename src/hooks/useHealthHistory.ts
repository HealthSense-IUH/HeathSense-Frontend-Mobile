import { useQuery } from '@tanstack/react-query';
import { getAvailableHistoryDatesApi, getRecordsByDateApi } from '@/services/health-records';
import { HealthRecordResponse } from '@/types/health-records';

export const useAvailableHistoryDates = (timezone?: string) => {
  return useQuery<string[]>({
    queryKey: ['health-records-history-dates', timezone],
    queryFn: () => getAvailableHistoryDatesApi(timezone),
  });
};

export const useRecordsByDate = (date: string, timezone?: string) => {
  return useQuery<HealthRecordResponse[]>({
    queryKey: ['health-records-history-by-date', date, timezone],
    queryFn: () => getRecordsByDateApi(date, timezone),
    enabled: !!date,
  });
};
