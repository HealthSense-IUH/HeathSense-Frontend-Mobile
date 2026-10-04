import { create } from 'zustand';
import {
  Exercise,
  WorkoutTargetType,
  WorkoutSession,
  GpsCoordinate,
} from './workoutTypes';
import { useWorkoutCatalogStore } from './workoutCatalogStore';
import { useBleStore } from '@/services/ble-management/bleStore';
import { encodePolyline } from '@/utils/polylineEncoder';

// Decouple bleService to avoid require cycle (bleService <-> workoutEngineStore)
const sendBleWorkoutCommand = (cmd: string) => {
  try {
    const { bleService } = require('@/services/ble-management/bleService');
    if (bleService && typeof bleService.sendCommand === 'function') {
      void bleService.sendCommand(cmd).catch(() => {});
    }
  } catch {}
};

export type WorkoutRuntimeStatus =
  | 'IDLE'
  | 'READY'
  | 'COUNTDOWN'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED';

export interface UserFitnessProfile {
  weightKg?: number;
  heightCm?: number;
  age?: number;
  gender?: 'MALE' | 'FEMALE';
}

interface WorkoutEngineState {
  status: WorkoutRuntimeStatus;
  exercise: Exercise | null;
  targetType: WorkoutTargetType;
  targetValue: number;
  countdownValue: number;

  // Real-time metrics
  elapsedSeconds: number;
  currentCalories: number; // Active burned calories (kcal)
  totalCalories: number;   // Active + BMR (Total energy expenditure)
  currentHeartRate: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  currentDistanceKm: number;
  currentSpeedKmh: number;
  currentSteps: number;
  gpsTrack: GpsCoordinate[];

  // Sets & Rest metrics (For gym / calisthenics)
  currentSet: number;
  completedSets: number;
  isResting: boolean;
  restSecondsLeft: number;

  isScreenLocked: boolean;
  pauseOnTarget: boolean;
  userWeightKg: number;
  userHeightCm: number;
  userAge: number;
  userGender: 'MALE' | 'FEMALE';
  startedAt: number | null;
  endedAt: number | null;
  lastCompletedSession: WorkoutSession | null;
  lastWorkoutEndedAt: number | null;

  // Actions
  setupWorkout: (
    exercise: Exercise,
    targetType?: WorkoutTargetType,
    targetValue?: number,
    profileOrWeight?: UserFitnessProfile | number,
    pauseOnTarget?: boolean
  ) => void;
  setTarget: (targetType: WorkoutTargetType, targetValue: number) => void;
  setPauseOnTarget: (pause: boolean) => void;
  startCountdown: () => void;
  startActiveWorkout: () => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  finishWorkout: () => WorkoutSession | null;
  resetWorkout: () => void;
  clearCooldown: () => void;
  toggleScreenLock: () => void;
  completeSetAndRest: (restDurationSec?: number) => void;
  skipRest: () => void;
  updateGpsLocation: (coord: Omit<GpsCoordinate, 'timestamp'>) => void;
  addSteps: (steps: number) => void;
}

// Timer handles maintained outside store state to avoid serialization issues
let workoutIntervalTimer: ReturnType<typeof setInterval> | null = null;
let countdownIntervalTimer: ReturnType<typeof setInterval> | null = null;
let restIntervalTimer: ReturnType<typeof setInterval> | null = null;
let heartRateSamples: number[] = [];

export const useWorkoutEngineStore = create<WorkoutEngineState>((set, get) => ({
  status: 'IDLE',
  exercise: null,
  targetType: 'NONE',
  targetValue: 0,
  countdownValue: 3,

  elapsedSeconds: 0,
  currentCalories: 0,
  totalCalories: 0,
  currentHeartRate: 0,
  avgHeartRate: undefined,
  maxHeartRate: undefined,
  currentDistanceKm: 0,
  currentSpeedKmh: 0,
  currentSteps: 0,
  gpsTrack: [],

  currentSet: 1,
  completedSets: 0,
  isResting: false,
  restSecondsLeft: 0,

  isScreenLocked: false,
  pauseOnTarget: false,
  userWeightKg: 65,
  userHeightCm: 170,
  userAge: 25,
  userGender: 'MALE',
  startedAt: null,
  endedAt: null,
  lastCompletedSession: null,
  lastWorkoutEndedAt: null,

  setupWorkout: (
    exercise,
    targetType = 'NONE',
    targetValue = 0,
    profileOrWeight?: UserFitnessProfile | number,
    pauseOnTarget = false
  ) => {
    // Clear any previous running timers
    if (workoutIntervalTimer) clearInterval(workoutIntervalTimer);
    if (countdownIntervalTimer) clearInterval(countdownIntervalTimer);
    if (restIntervalTimer) clearInterval(restIntervalTimer);

    heartRateSamples = [];

    const isWeightNum = typeof profileOrWeight === 'number';
    const weight = isWeightNum
      ? profileOrWeight
      : profileOrWeight?.weightKg || get().userWeightKg || 65;
    const height =
      !isWeightNum && profileOrWeight?.heightCm
        ? profileOrWeight.heightCm
        : get().userHeightCm || 170;
    const age =
      !isWeightNum && profileOrWeight?.age
        ? profileOrWeight.age
        : get().userAge || 25;
    const gender =
      !isWeightNum && profileOrWeight?.gender
        ? profileOrWeight.gender
        : get().userGender || 'MALE';

    const resolvedTargetType = targetType || exercise.defaultTargetType || 'NONE';
    let resolvedTargetValue = targetValue || 0;
    if (!resolvedTargetValue && exercise.defaultTargetValue) {
      resolvedTargetValue =
        resolvedTargetType === 'TIME'
          ? exercise.defaultTargetValue * 60
          : exercise.defaultTargetValue;
    }

    set({
      status: 'READY',
      exercise,
      targetType: resolvedTargetType,
      targetValue: resolvedTargetValue,
      pauseOnTarget,
      userWeightKg: weight,
      userHeightCm: height,
      userAge: age,
      userGender: gender,
      countdownValue: 3,
      elapsedSeconds: 0,
      currentCalories: 0,
      totalCalories: 0,
      currentHeartRate: 0,
      avgHeartRate: undefined,
      maxHeartRate: undefined,
      currentDistanceKm: 0,
      currentSpeedKmh: 0,
      currentSteps: 0,
      gpsTrack: [],
      currentSet: 1,
      completedSets: 0,
      isResting: false,
      restSecondsLeft: 0,
      isScreenLocked: false,
      startedAt: null,
      endedAt: null,
      lastCompletedSession: null,
      lastWorkoutEndedAt: null, // Reset cooldown timer when a new workout is started
    });
  },

  setTarget: (targetType, targetValue) => {
    set({ targetType, targetValue });
  },

  setPauseOnTarget: (pause) => {
    set({ pauseOnTarget: pause });
  },

  startCountdown: () => {
    if (countdownIntervalTimer) clearInterval(countdownIntervalTimer);

    set({ status: 'COUNTDOWN', countdownValue: 3 });

    let count = 3;
    countdownIntervalTimer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        set({ countdownValue: count });
      } else {
        if (countdownIntervalTimer) clearInterval(countdownIntervalTimer);
        get().startActiveWorkout();
      }
    }, 1000);
  },

  startActiveWorkout: () => {
    if (workoutIntervalTimer) clearInterval(workoutIntervalTimer);

    const now = Date.now();
    set({
      status: 'ACTIVE',
      startedAt: get().startedAt || now,
    });

    // Phát lệnh BLE khởi chạy chế độ tập luyện trên ESP32
    sendBleWorkoutCommand('CMD:WORKOUT_START');

    workoutIntervalTimer = setInterval(() => {
      const {
        elapsedSeconds,
        exercise,
        userWeightKg,
        userHeightCm,
        userAge,
        userGender,
        currentCalories: prevActiveCalories,
        currentDistanceKm,
      } = get();
      const nextSeconds = elapsedSeconds + 1;

      // 1. Nhận nhịp tim thời gian thực từ BLE Wearable Sensor
      const currentBPM = useBleStore.getState().currentBPM;
      let activeBurnRatePerSec = 0;

      if (currentBPM >= 50) {
        heartRateSamples.push(currentBPM);
        // Công thức Keytel et al. (2005) chuẩn y học thể thao
        // kcal/phút chuyển đổi sang kcal/giây (/ 60)
        // Lưu ý: mẫu số 4.184 * 60 = 251.04
        if (userGender === 'FEMALE') {
          activeBurnRatePerSec =
            (-20.4022 + 0.4472 * currentBPM - 0.1263 * userWeightKg + 0.074 * userAge) /
            251.04;
        } else {
          activeBurnRatePerSec =
            (-55.0969 + 0.6309 * currentBPM + 0.1988 * userWeightKg + 0.2017 * userAge) /
            251.04;
        }
        // Giới hạn biên độ an toàn sinh học (0.005 kcal/s ~ 18 kcal/h, tối đa 0.6 kcal/s)
        activeBurnRatePerSec = Math.max(0.005, Math.min(activeBurnRatePerSec, 0.6));
      } else {
        // Fallback: ACSM 2011 METs (Khi chưa kết nối hoặc không có nhịp tim)
        // Calo/giây = (MET * Weight) / 3600
        const met = exercise?.met || 4.0;
        activeBurnRatePerSec = (met * userWeightKg) / 3600;
      }

      const nextActiveCalories = prevActiveCalories + activeBurnRatePerSec;

      // 2. Chuyển hóa cơ bản BMR theo giây (Công thức chuẩn Mifflin-St Jeor)
      const bmrDaily =
        userGender === 'FEMALE'
          ? 10 * userWeightKg + 6.25 * userHeightCm - 5 * userAge - 161
          : 10 * userWeightKg + 6.25 * userHeightCm - 5 * userAge + 5;
      const bmrPerSec = bmrDaily / 86400;
      const nextTotalCalories = nextActiveCalories + bmrPerSec * nextSeconds;

      // 3. Thống kê nhịp tim
      let avgHeartRate: number | undefined;
      let maxHeartRate: number | undefined;
      if (heartRateSamples.length > 0) {
        avgHeartRate = Math.round(
          heartRateSamples.reduce((sum, h) => sum + h, 0) / heartRateSamples.length
        );
        maxHeartRate = Math.max(...heartRateSamples);
      }

      // Calculate instantaneous speed (km/h) if distance is available
      const speedKmh =
        nextSeconds > 0 ? currentDistanceKm / (nextSeconds / 3600) : 0;

      set({
        elapsedSeconds: nextSeconds,
        currentCalories: Math.round(nextActiveCalories * 10) / 10,
        totalCalories: Math.round(nextTotalCalories * 10) / 10,
        currentHeartRate: currentBPM > 0 ? currentBPM : 0,
        avgHeartRate,
        maxHeartRate,
        currentSpeedKmh: Math.round(speedKmh * 10) / 10,
      });

      // Check target goal completion for automatic pause if requested
      const { pauseOnTarget, targetType, targetValue } = get();
      if (pauseOnTarget && targetType !== 'NONE' && targetValue > 0) {
        let reached = false;
        if (targetType === 'TIME' && nextSeconds >= targetValue) reached = true;
        if (targetType === 'CALORIES' && nextActiveCalories >= targetValue) reached = true;
        if (targetType === 'DISTANCE' && currentDistanceKm >= targetValue) reached = true;
        if (reached) {
          get().pauseWorkout();
        }
      }
    }, 1000);
  },

  pauseWorkout: () => {
    if (workoutIntervalTimer) {
      clearInterval(workoutIntervalTimer);
      workoutIntervalTimer = null;
    }
    if (restIntervalTimer) {
      clearInterval(restIntervalTimer);
      restIntervalTimer = null;
    }
    set({ status: 'PAUSED' });
    sendBleWorkoutCommand('CMD:WORKOUT_PAUSE');
  },

  resumeWorkout: () => {
    get().startActiveWorkout();
    sendBleWorkoutCommand('CMD:WORKOUT_RESUME');
  },

  finishWorkout: () => {
    if (workoutIntervalTimer) {
      clearInterval(workoutIntervalTimer);
      workoutIntervalTimer = null;
    }
    if (restIntervalTimer) {
      clearInterval(restIntervalTimer);
      restIntervalTimer = null;
    }
    sendBleWorkoutCommand('CMD:WORKOUT_STOP');

    const {
      exercise,
      startedAt,
      elapsedSeconds,
      currentCalories,
      totalCalories,
      currentDistanceKm,
      currentSpeedKmh,
      currentSteps,
      completedSets,
      targetType,
      targetValue,
      gpsTrack,
      avgHeartRate,
      maxHeartRate,
    } = get();

    if (!exercise) return null;

    const endedAt = Date.now();
    const activeCal = Math.max(Math.round(currentCalories), 1);
    const totCal = Math.max(Math.round(totalCalories), activeCal);

    const session: WorkoutSession = {
      id: `session_${Date.now()}`,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      category: exercise.category,
      trackingType: exercise.trackingType,
      iconName: exercise.iconName,
      startedAt: startedAt || endedAt - elapsedSeconds * 1000,
      endedAt,
      durationSeconds: Math.max(elapsedSeconds, 1),
      caloriesBurned: activeCal,
      totalCalories: totCal,
      distanceKm: currentDistanceKm > 0 ? currentDistanceKm : undefined,
      avgSpeedKmh: currentSpeedKmh > 0 ? currentSpeedKmh : undefined,
      totalSteps: currentSteps > 0 ? currentSteps : undefined,
      completedSets: completedSets > 0 ? completedSets : undefined,
      targetType,
      targetValue,
      gpsTrack: gpsTrack.length > 0 ? gpsTrack : undefined,
      encodedPolyline: gpsTrack.length > 0 ? encodePolyline(gpsTrack) : undefined,
      isHeartRateMonitored: heartRateSamples.length > 0,
      avgHeartRate,
      maxHeartRate,
    };

    // Auto-save to workout history storage
    useWorkoutCatalogStore.getState().saveSession(session);

    set({
      status: 'COMPLETED',
      endedAt,
      lastWorkoutEndedAt: endedAt, // Starts 10-minute cardiac stabilization cooldown
      lastCompletedSession: session,
    });

    return session;
  },

  resetWorkout: () => {
    if (workoutIntervalTimer) clearInterval(workoutIntervalTimer);
    if (countdownIntervalTimer) clearInterval(countdownIntervalTimer);
    if (restIntervalTimer) clearInterval(restIntervalTimer);

    // Note: lastWorkoutEndedAt is preserved so the 10-minute cooldown
    // remains active even after leaving the workout summary screen.
    set({
      status: 'IDLE',
      exercise: null,
      elapsedSeconds: 0,
      currentCalories: 0,
      totalCalories: 0,
      currentHeartRate: 0,
      avgHeartRate: undefined,
      maxHeartRate: undefined,
      currentDistanceKm: 0,
      currentSpeedKmh: 0,
      currentSteps: 0,
      gpsTrack: [],
      currentSet: 1,
      completedSets: 0,
      isResting: false,
      restSecondsLeft: 0,
      isScreenLocked: false,
      startedAt: null,
      endedAt: null,
    });
  },

  clearCooldown: () => {
    set({ lastWorkoutEndedAt: null });
  },

  toggleScreenLock: () => {
    set((state) => ({ isScreenLocked: !state.isScreenLocked }));
  },

  completeSetAndRest: (restDurationSec = 30) => {
    if (restIntervalTimer) clearInterval(restIntervalTimer);

    const nextCompletedSets = get().completedSets + 1;
    const nextCurrentSet = get().currentSet + 1;

    set({
      completedSets: nextCompletedSets,
      currentSet: nextCurrentSet,
      isResting: true,
      restSecondsLeft: restDurationSec,
    });

    restIntervalTimer = setInterval(() => {
      const { restSecondsLeft } = get();
      if (restSecondsLeft <= 1) {
        if (restIntervalTimer) clearInterval(restIntervalTimer);
        set({ isResting: false, restSecondsLeft: 0 });
      } else {
        set({ restSecondsLeft: restSecondsLeft - 1 });
      }
    }, 1000);
  },

  skipRest: () => {
    if (restIntervalTimer) {
      clearInterval(restIntervalTimer);
      restIntervalTimer = null;
    }
    set({ isResting: false, restSecondsLeft: 0 });
  },

  updateGpsLocation: (coord) => {
    const timestamp = Date.now();
    const newCoord: GpsCoordinate = { ...coord, timestamp };

    const { gpsTrack, currentDistanceKm } = get();

    if (gpsTrack.length === 0) {
      set({ gpsTrack: [newCoord] });
      return;
    }

    const prevCoord = gpsTrack[gpsTrack.length - 1];

    // Haversine formula to calculate delta distance in km
    const R = 6371; // Earth radius in km
    const dLat = ((newCoord.latitude - prevCoord.latitude) * Math.PI) / 180;
    const dLon = ((newCoord.longitude - prevCoord.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((prevCoord.latitude * Math.PI) / 180) *
        Math.cos((newCoord.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const deltaKm = R * c;

    // Filter out GPS jump noise (> 100 km/h)
    if (deltaKm > 0.001 && deltaKm < 0.1) {
      const nextDistance = currentDistanceKm + deltaKm;
      set({
        gpsTrack: [...gpsTrack, newCoord],
        currentDistanceKm: Math.round(nextDistance * 100) / 100,
      });
    }
  },

  addSteps: (steps) => {
    set((state) => ({ currentSteps: state.currentSteps + steps }));
  },
}));

/**
 * 10-minute cardiac stabilization window post-exercise (600,000 ms).
 * Essential to avoid false positive AFib alerts caused by post-exercise sinus recovery
 * and sympathetic nervous system reactivation.
 */
export const AFIB_POST_WORKOUT_COOLDOWN_MS = 10 * 60 * 1000;

export interface AFibScreeningAvailability {
  canScreen: boolean;
  reason?: 'WORKOUT_IN_PROGRESS' | 'COOLDOWN_ACTIVE';
  remainingSeconds: number;
  formattedRemainingTime: string;
}

/**
 * Calculates current AFib screening availability based on workout status
 * and post-exercise 10-minute stabilization cooldown.
 */
export const getAFibScreeningAvailability = (): AFibScreeningAvailability => {
  const { status, lastWorkoutEndedAt } = useWorkoutEngineStore.getState();

  // 1. In workout: strictly blocked
  if (status === 'COUNTDOWN' || status === 'ACTIVE' || status === 'PAUSED') {
    return {
      canScreen: false,
      reason: 'WORKOUT_IN_PROGRESS',
      remainingSeconds: 0,
      formattedRemainingTime: '00:00',
    };
  }

  // 2. 10-minute post-exercise recovery cooldown
  if (lastWorkoutEndedAt) {
    const elapsedMs = Date.now() - lastWorkoutEndedAt;
    if (elapsedMs < AFIB_POST_WORKOUT_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((AFIB_POST_WORKOUT_COOLDOWN_MS - elapsedMs) / 1000);
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      const formattedRemainingTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      return {
        canScreen: false,
        reason: 'COOLDOWN_ACTIVE',
        remainingSeconds,
        formattedRemainingTime,
      };
    }
  }

  // 3. Fully available
  return {
    canScreen: true,
    remainingSeconds: 0,
    formattedRemainingTime: '00:00',
  };
};
