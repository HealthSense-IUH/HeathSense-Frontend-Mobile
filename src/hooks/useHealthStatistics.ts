import { useState, useEffect } from 'react';
import { getHealthStatisticsApi } from '@/services/health-records';
import { HealthStatisticsResponse } from '@/types/health-records';

type FilterType = 'Ngày' | 'Tuần' | 'Tháng' | 'Năm';

export const useHealthStatistics = (filter: FilterType, referenceDate: Date) => {
  const [data, setData] = useState<HealthStatisticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError(null);

        let period = 'YEAR';
        switch (filter) {
          case 'Ngày': period = 'DAY'; break;
          case 'Tuần': period = 'WEEK'; break;
          case 'Tháng': period = 'MONTH'; break;
          case 'Năm': period = 'YEAR'; break;
        }

        let timezone = 'UTC';
        try {
          if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
            timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          }
        } catch (e) {
          console.warn('Intl not supported, falling back to UTC', e);
        }
        
        const formattedDate = referenceDate.toISOString(); // e.g., 2026-08-11T00:00:00.000Z

        const result = await getHealthStatisticsApi(period, formattedDate, timezone);
        
        if (isMounted) {
          setData(result);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Lỗi khi tải dữ liệu thống kê');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStatistics();

    return () => {
      isMounted = false;
    };
  }, [filter, referenceDate]);

  return { data, loading, error };
};
