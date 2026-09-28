/**
 * HealthSense Workout Types & Data Models
 * Standardized based on Samsung Health exercise architecture
 */

export type ExerciseCategory =
  | 'GENERAL'        // Chung
  | 'AEROBIC'        // Hiếu khí / Cardio
  | 'FREE_WEIGHT'    // Tập tạ tự do
  | 'MACHINE_WEIGHT' // Tập tạ với máy
  | 'WILDERNESS'     // Vùng hoang dã / Dã ngoại
  | 'WATER'          // Nước / Bơi lội
  | 'WINTER'         // Mùa đông
  | 'BALL';          // Thể thao bóng

export const EXERCISE_CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  GENERAL: 'Chung',
  AEROBIC: 'Hiếu khí',
  FREE_WEIGHT: 'Tập tạ tự do',
  MACHINE_WEIGHT: 'Tập tạ với máy',
  WILDERNESS: 'Vùng hoang dã',
  WATER: 'Nước',
  WINTER: 'Mùa đông',
  BALL: 'Bóng',
};

export type TrackingMetricType =
  | 'TIME_CALORIES' // Thời gian và calo tiêu hao (không GPS)
  | 'DISTANCE_GPS'  // Khoảng cách, tốc độ và lộ trình (có GPS)
  | 'SETS_REST';    // Số hiệp và nghỉ ngơi

export const TRACKING_TYPE_LABELS: Record<TrackingMetricType, string> = {
  TIME_CALORIES: 'T.gian và calo tiêu hao (không GPS)',
  DISTANCE_GPS: 'K.cách, tốc độ và lộ trình (có GPS)',
  SETS_REST: 'Số hiệp và nghỉ ngơi',
};

export type WorkoutTargetType =
  | 'NONE'      // Không có mục tiêu (Tập tự do)
  | 'TIME'      // Mục tiêu thời gian (phút)
  | 'CALORIES'  // Mục tiêu calo (kcal)
  | 'DISTANCE'  // Mục tiêu khoảng cách (km)
  | 'SETS';     // Mục tiêu số hiệp

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  trackingType: TrackingMetricType;
  met: number; // Metabolic Equivalent of Task (hệ số tiêu hao calo)
  iconName: string; // Identifier cho icon Lucide
  isSystem: boolean; // true nếu là bài có sẵn, false nếu do người dùng tạo
  isFavorite?: boolean;
  defaultTargetType?: WorkoutTargetType;
  defaultTargetValue?: number;
  description?: string;
}

export interface RoutineExerciseItem {
  id: string;
  exerciseId: string;
  exerciseName: string;
  orderIndex: number;
  targetSets?: number;
  targetReps?: number;
  targetDurationSec?: number;
  restDurationSec?: number;
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  hasWarmup: boolean;
  warmupDurationSec: number;
  hasCooldown: boolean;
  cooldownDurationSec: number;
  items: RoutineExerciseItem[];
  createdAt: number;
}

export interface GpsCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number;
  timestamp: number;
}

export interface WorkoutSession {
  id: string;
  exerciseId: string;
  exerciseName: string;
  category: ExerciseCategory;
  trackingType: TrackingMetricType;
  iconName: string;
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  caloriesBurned: number;
  totalCalories?: number;
  distanceKm?: number;
  avgSpeedKmh?: number;
  totalSteps?: number;
  completedSets?: number;
  targetType: WorkoutTargetType;
  targetValue?: number;
  gpsTrack?: GpsCoordinate[];
  encodedPolyline?: string;
  isHeartRateMonitored: boolean;
  avgHeartRate?: number;
  maxHeartRate?: number;
  note?: string;
}

export interface DailyActivityStats {
  date: string; // YYYY-MM-DD
  totalSteps: number;
  targetSteps: number;
  activeMinutes: number;
  targetActiveMinutes: number;
  caloriesBurned: number;
  targetCalories: number;
}

export interface WeeklyStatsSummary {
  weekRangeLabel: string;
  totalDurationSeconds: number;
  totalCalories: number;
  totalSessions: number;
  dailyDistribution: Array<{
    dayNumber: number; // 2 -> 7, 8 (CN)
    dayLabel: string;  // '2', '3', '4', '5', '6', '7', 'CN'
    dateStr: string;
    durationSeconds: number;
    calories: number;
    hasWorkout: boolean;
  }>;
}
