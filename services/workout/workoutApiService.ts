import axiosClient from '@/utils/axiosClient';
import { ApiResponse } from '@/types/authentication';
import {
  Exercise,
  ExerciseCategory,
  WorkoutRoutine,
  WorkoutSession,
  WeeklyStatsSummary,
  DailyActivityStats,
} from './workoutTypes';

export const workoutApiService = {
  /**
   * Lấy danh sách bài tập từ Backend
   */
  async getExercises(category?: ExerciseCategory, query?: string): Promise<Exercise[]> {
    try {
      const params: Record<string, string> = {};
      if (category && category !== 'ALL' as any) params.category = category;
      if (query && query.trim().length > 0) params.query = query.trim();

      const res = await axiosClient.get<ApiResponse<any>>('/api/workouts/exercises', { params });
      return (res.data?.data || res.data || []) as Exercise[];
    } catch (error) {
      console.warn('API getExercises failed, fallback to local MMKV:', error);
      throw error;
    }
  },

  /**
   * Tạo bài tập tùy chỉnh mới
   */
  async createCustomExercise(data: {
    name: string;
    category: ExerciseCategory;
    trackingType: string;
    metRate?: number;
    iconName?: string;
    description?: string;
  }): Promise<Exercise> {
    const res = await axiosClient.post<ApiResponse<any>>('/api/workouts/exercises', data);
    return (res.data?.data || res.data) as Exercise;
  },

  /**
   * Xóa bài tập tùy chỉnh
   */
  async deleteCustomExercise(id: string | number): Promise<void> {
    await axiosClient.delete(`/api/workouts/exercises/${id}`);
  },

  /**
   * Lấy danh sách mã bài tập yêu thích (tối đa 3)
   */
  async getFavorites(): Promise<string[]> {
    const res = await axiosClient.get<ApiResponse<string[]>>('/api/workouts/favorites');
    return (res.data?.data || res.data || []) as string[];
  },

  /**
   * Bật/tắt yêu thích (Ràng buộc tối đa 3)
   */
  async toggleFavorite(exerciseCode: string): Promise<boolean> {
    const res = await axiosClient.put<ApiResponse<boolean>>(`/api/workouts/favorites/${exerciseCode}`);
    return Boolean(res.data?.data ?? res.data);
  },

  /**
   * Lấy danh sách lịch trình (Routines)
   */
  async getRoutines(): Promise<WorkoutRoutine[]> {
    const res = await axiosClient.get<ApiResponse<any>>('/api/workouts/routines');
    return (res.data?.data || res.data || []) as WorkoutRoutine[];
  },

  /**
   * Tạo lịch trình mới
   */
  async createRoutine(routine: {
    name: string;
    hasWarmup: boolean;
    warmupDurationSec?: number;
    hasCooldown: boolean;
    cooldownDurationSec?: number;
    itemsJson?: string;
  }): Promise<WorkoutRoutine> {
    const res = await axiosClient.post<ApiResponse<any>>('/api/workouts/routines', routine);
    return (res.data?.data || res.data) as WorkoutRoutine;
  },

  /**
   * Xóa lịch trình
   */
  async deleteRoutine(id: string | number): Promise<void> {
    await axiosClient.delete(`/api/workouts/routines/${id}`);
  },

  /**
   * Lưu phiên tập luyện lên Backend Database
   */
  async saveSession(session: WorkoutSession): Promise<WorkoutSession> {
    try {
      const payload = {
        exerciseCode: session.exerciseId,
        exerciseName: session.exerciseName,
        category: session.category,
        trackingType: session.trackingType,
        iconName: session.iconName,
        startedAt: new Date(session.startedAt).toISOString(),
        endedAt: new Date(session.endedAt).toISOString(),
        durationSeconds: session.durationSeconds,
        caloriesBurned: session.caloriesBurned,
        totalCalories: session.totalCalories,
        distanceMeters: session.distanceKm ? Math.round(session.distanceKm * 1000) : undefined,
        avgSpeedKmh: session.avgSpeedKmh,
        totalSteps: session.totalSteps,
        completedSets: session.completedSets,
        targetType: session.targetType,
        targetValue: session.targetValue,
        gpxTrackJson: session.gpsTrack ? JSON.stringify(session.gpsTrack) : undefined,
        isHeartRateMonitored: session.isHeartRateMonitored,
        avgHeartRate: session.avgHeartRate,
        maxHeartRate: session.maxHeartRate,
        note: session.note,
      };

      const res = await axiosClient.post<ApiResponse<any>>('/api/workouts/sessions', payload);
      return (res.data?.data || res.data) as WorkoutSession;
    } catch (error) {
      console.warn('API saveSession failed, session remains in local MMKV:', error);
      throw error;
    }
  },

  /**
   * Lấy lịch sử các phiên tập luyện
   */
  async getSessions(
    page = 0,
    size = 15,
    from?: string,
    to?: string
  ): Promise<{ content: WorkoutSession[]; totalElements: number }> {
    const params: Record<string, any> = { page, size };
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await axiosClient.get<ApiResponse<any>>('/api/workouts/sessions', {
      params,
    });
    const pageData = res.data?.data || res.data;
    return {
      content: (pageData?.content || []) as WorkoutSession[],
      totalElements: pageData?.totalElements || 0,
    };
  },

  /**
   * Lấy thống kê tuần
   */
  async getWeeklyStats(referenceDate?: string, timezone = 'Asia/Ho_Chi_Minh'): Promise<WeeklyStatsSummary> {
    const res = await axiosClient.get<ApiResponse<WeeklyStatsSummary>>('/api/workouts/stats/weekly', {
      params: { referenceDate, timezone },
    });
    return (res.data?.data || res.data) as WeeklyStatsSummary;
  },

  /**
   * Lấy số liệu hoạt động hàng ngày (Vòng 3 chỉ số + Tải tim mạch)
   */
  async getDailyActivity(date?: string, timezone = 'Asia/Ho_Chi_Minh'): Promise<DailyActivityStats> {
    const res = await axiosClient.get<ApiResponse<DailyActivityStats>>('/api/workouts/stats/daily', {
      params: { date, timezone },
    });
    return (res.data?.data || res.data) as DailyActivityStats;
  },
};
