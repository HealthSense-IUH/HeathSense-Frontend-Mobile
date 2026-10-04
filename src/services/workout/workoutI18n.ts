import i18n, { currentIntlLocale } from '@/i18n';
import {
  Exercise,
  ExerciseCategory,
  TrackingMetricType,
  EXERCISE_CATEGORY_LABELS,
  TRACKING_TYPE_LABELS,
} from './workoutTypes';

/**
 * Lớp dịch cho dữ liệu bài tập: seed giữ tên tiếng Việt làm mặc định,
 * các helper này tra key `workout:exercises.<id>` / `workout:categories.<CODE>`
 * theo ngôn ngữ đang chọn. Bài tự tạo (không có key) giữ nguyên tên người dùng nhập.
 */
export function getExerciseName(exercise: Pick<Exercise, 'id' | 'name'>): string {
  return i18n.t(`workout:exercises.${exercise.id}`, { defaultValue: exercise.name });
}

export function getCategoryLabel(code: ExerciseCategory): string {
  return i18n.t(`workout:categories.${code}`, {
    defaultValue: EXERCISE_CATEGORY_LABELS[code] ?? code,
  });
}

export function getTrackingTypeLabel(code: TrackingMetricType): string {
  return i18n.t(`workout:trackingTypes.${code}`, {
    defaultValue: TRACKING_TYPE_LABELS[code] ?? code,
  });
}

/** Nhãn thứ ngắn (1 ký tự/số) theo JS getDay(): 0 = Chủ nhật. */
export function getWeekdayShort(day: number): string {
  return i18n.t(`workout:weekdays.short.${day}`);
}

/** Nhãn thứ viết tắt (T.2 / Mon) theo JS getDay(): 0 = Chủ nhật. */
export function getWeekdayAbbr(day: number): string {
  return i18n.t(`workout:weekdays.abbr.${day}`);
}

/** Tên tháng ngắn (Th10 / Oct); month tính từ 1. */
export function getMonthShort(month: number): string {
  return i18n.t(`workout:months.short.${month}`);
}

/** Tên tháng đầy đủ (tháng 10 / October); month tính từ 1. */
export function getMonthLong(month: number): string {
  return i18n.t(`workout:months.long.${month}`);
}

/** Số thập phân theo locale đang chọn (vi: 1,25 — en: 1.25). */
export function formatWorkoutDecimal(value: number, digits = 2): string {
  return value.toLocaleString(currentIntlLocale(), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
