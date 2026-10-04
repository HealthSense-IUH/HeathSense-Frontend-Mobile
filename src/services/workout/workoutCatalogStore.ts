import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import {
  Exercise,
  ExerciseCategory,
  WorkoutRoutine,
  WorkoutSession,
  WeeklyStatsSummary,
  DailyActivityStats,
} from './workoutTypes';
import { SEED_EXERCISES } from './exerciseSeedData';
import i18n from '@/i18n';
import { getMonthShort, getWeekdayShort } from './workoutI18n';

const storage = createMMKV({
  id: 'healthsense-workout-storage',
});

const STORAGE_KEYS = {
  FAVORITES: 'workout_favorite_ids',
  CUSTOM_EXERCISES: 'workout_custom_exercises',
  ROUTINES: 'workout_routines',
  SESSIONS: 'workout_sessions',
};

const DEFAULT_FAVORITES = ['walking', 'running', 'cycling'];

interface WorkoutCatalogState {
  exercises: Exercise[];
  favoriteIds: string[];
  routines: WorkoutRoutine[];
  sessions: WorkoutSession[];
  selectedCategory: ExerciseCategory | 'ALL';
  searchQuery: string;

  // Actions
  setSelectedCategory: (category: ExerciseCategory | 'ALL') => void;
  setSearchQuery: (query: string) => void;
  toggleFavorite: (exerciseId: string) => { success: boolean; message?: string };
  addCustomExercise: (
    data: Omit<Exercise, 'id' | 'isSystem' | 'isFavorite'>
  ) => Exercise;
  deleteCustomExercise: (exerciseId: string) => void;
  createRoutine: (
    routine: Omit<WorkoutRoutine, 'id' | 'createdAt'>
  ) => WorkoutRoutine;
  deleteRoutine: (routineId: string) => void;
  saveSession: (session: WorkoutSession) => void;
  deleteSession: (sessionId: string) => void;
  syncSessionsWithBackend: (from?: string, to?: string) => Promise<void>;

  // Selectors / Helpers
  getFavoriteExercises: () => Exercise[];
  getFilteredExercises: () => Exercise[];
  getExerciseById: (id: string) => Exercise | undefined;
  getTodayStats: () => DailyActivityStats;
  getWeeklyStats: (targetDate?: Date) => WeeklyStatsSummary;
}

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  const raw = storage.getString(key);
  if (!raw) return defaultValue;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, data: T): void => {
  storage.set(key, JSON.stringify(data));
};

export const getLocalDateStr = (d: Date | number): string => {
  const date = typeof d === 'number' ? new Date(d) : d;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const useWorkoutCatalogStore = create<WorkoutCatalogState>((set, get) => {
  // Initial load from storage
  const storedFavorites = loadFromStorage<string[]>(
    STORAGE_KEYS.FAVORITES,
    DEFAULT_FAVORITES
  );
  const storedCustomExercises = loadFromStorage<Exercise[]>(
    STORAGE_KEYS.CUSTOM_EXERCISES,
    []
  );
  const storedRoutines = loadFromStorage<WorkoutRoutine[]>(
    STORAGE_KEYS.ROUTINES,
    []
  );
  const storedSessions = loadFromStorage<WorkoutSession[]>(
    STORAGE_KEYS.SESSIONS,
    []
  );

  const initialExercises: Exercise[] = [
    ...SEED_EXERCISES.map((ex) => ({
      ...ex,
      isFavorite: storedFavorites.includes(ex.id),
    })),
    ...storedCustomExercises.map((ex) => ({
      ...ex,
      isFavorite: storedFavorites.includes(ex.id),
    })),
  ];

  return {
    exercises: initialExercises,
    favoriteIds: storedFavorites,
    routines: storedRoutines,
    sessions: storedSessions,
    selectedCategory: 'ALL',
    searchQuery: '',

    setSelectedCategory: (category) => set({ selectedCategory: category }),
    setSearchQuery: (query) => set({ searchQuery: query }),

    toggleFavorite: (exerciseId: string) => {
      const { favoriteIds, exercises } = get();
      const isAlreadyFavorite = favoriteIds.includes(exerciseId);

      if (isAlreadyFavorite) {
        const nextFavorites = favoriteIds.filter((id) => id !== exerciseId);
        saveToStorage(STORAGE_KEYS.FAVORITES, nextFavorites);

        set({
          favoriteIds: nextFavorites,
          exercises: exercises.map((ex) =>
            ex.id === exerciseId ? { ...ex, isFavorite: false } : ex
          ),
        });
        return { success: true };
      }

      // Check max 3 favorites constraint
      if (favoriteIds.length >= 3) {
        return {
          success: false,
          message: i18n.t('workout:catalog.maxFavorites'),
        };
      }

      const nextFavorites = [...favoriteIds, exerciseId];
      saveToStorage(STORAGE_KEYS.FAVORITES, nextFavorites);

      set({
        favoriteIds: nextFavorites,
        exercises: exercises.map((ex) =>
          ex.id === exerciseId ? { ...ex, isFavorite: true } : ex
        ),
      });

      return { success: true };
    },

    addCustomExercise: (data) => {
      const newExercise: Exercise = {
        ...data,
        id: `custom_${Date.now()}`,
        isSystem: false,
        isFavorite: false,
      };

      const customList = loadFromStorage<Exercise[]>(
        STORAGE_KEYS.CUSTOM_EXERCISES,
        []
      );
      const updatedCustomList = [newExercise, ...customList];
      saveToStorage(STORAGE_KEYS.CUSTOM_EXERCISES, updatedCustomList);

      set((state) => ({
        exercises: [newExercise, ...state.exercises],
      }));

      return newExercise;
    },

    deleteCustomExercise: (exerciseId: string) => {
      const customList = loadFromStorage<Exercise[]>(
        STORAGE_KEYS.CUSTOM_EXERCISES,
        []
      );
      const updatedCustomList = customList.filter((ex) => ex.id !== exerciseId);
      saveToStorage(STORAGE_KEYS.CUSTOM_EXERCISES, updatedCustomList);

      const nextFavorites = get().favoriteIds.filter((id) => id !== exerciseId);
      saveToStorage(STORAGE_KEYS.FAVORITES, nextFavorites);

      set((state) => ({
        favoriteIds: nextFavorites,
        exercises: state.exercises.filter((ex) => ex.id !== exerciseId),
      }));
    },

    createRoutine: (routineData) => {
      const newRoutine: WorkoutRoutine = {
        ...routineData,
        id: `routine_${Date.now()}`,
        createdAt: Date.now(),
      };

      const updatedRoutines = [newRoutine, ...get().routines];
      saveToStorage(STORAGE_KEYS.ROUTINES, updatedRoutines);
      set({ routines: updatedRoutines });

      return newRoutine;
    },

    deleteRoutine: (routineId: string) => {
      const updatedRoutines = get().routines.filter((r) => r.id !== routineId);
      saveToStorage(STORAGE_KEYS.ROUTINES, updatedRoutines);
      set({ routines: updatedRoutines });
    },

    saveSession: (session: WorkoutSession) => {
      const currentSessions = get().sessions;
      const index = currentSessions.findIndex((s) => s.id === session.id);
      let updatedSessions: WorkoutSession[];
      if (index >= 0) {
        updatedSessions = [...currentSessions];
        updatedSessions[index] = session;
      } else {
        updatedSessions = [session, ...currentSessions];
      }
      saveToStorage(STORAGE_KEYS.SESSIONS, updatedSessions);
      set({ sessions: updatedSessions });

      // Background sync with Spring Boot backend
      try {
        const { workoutApiService } = require('./workoutApiService');
        workoutApiService.saveSession(session)
          .then((savedServerSession: any) => {
            if (savedServerSession && savedServerSession.id) {
              const serverId = String(savedServerSession.id);
              // Reconcile temporary local ID with real server Snowflake ID
              if (session.id !== serverId) {
                const refreshed = get().sessions.map((s) =>
                  s.id === session.id ? { ...s, id: serverId } : s
                );
                saveToStorage(STORAGE_KEYS.SESSIONS, refreshed);
                set({ sessions: refreshed });
              }
            }
          })
          .catch(() => {});
      } catch {}
    },

    deleteSession: (sessionId: string) => {
      const updatedSessions = get().sessions.filter((s) => s.id !== sessionId);
      saveToStorage(STORAGE_KEYS.SESSIONS, updatedSessions);
      set({ sessions: updatedSessions });
    },

    syncSessionsWithBackend: async (from?: string, to?: string) => {
      try {
        const { workoutApiService } = require('./workoutApiService');
        const res = await workoutApiService.getSessions(0, 50, from, to);
        if (res && res.content && Array.isArray(res.content) && res.content.length > 0) {
          const localSessions = get().sessions;
          const sessionMap = new Map<string, WorkoutSession>();

          res.content.forEach((s: any) => {
            const parsedStarted = typeof s.startedAt === 'string' ? new Date(s.startedAt).getTime() : s.startedAt;
            const parsedEnded = typeof s.endedAt === 'string' ? new Date(s.endedAt).getTime() : s.endedAt;
            const item: WorkoutSession = {
              id: s.id ? String(s.id) : `session_${parsedStarted}`,
              exerciseId: s.exerciseCode || s.exerciseId || 'other',
              exerciseName: s.exerciseName || i18n.t('workout:common.exercise'),
              category: s.category || 'OTHER',
              trackingType: s.trackingType || 'TIME_ONLY',
              iconName: s.iconName || 'Activity',
              startedAt: parsedStarted,
              endedAt: parsedEnded,
              durationSeconds: s.durationSeconds || 0,
              caloriesBurned: s.caloriesBurned || 0,
              totalCalories: s.totalCalories,
              distanceKm: s.distanceMeters ? s.distanceMeters / 1000 : s.distanceKm,
              avgSpeedKmh: s.avgSpeedKmh,
              totalSteps: s.totalSteps,
              completedSets: s.completedSets,
              targetType: s.targetType || 'NONE',
              targetValue: s.targetValue,
              isHeartRateMonitored: Boolean(s.isHeartRateMonitored),
              avgHeartRate: s.avgHeartRate,
              maxHeartRate: s.maxHeartRate,
              note: s.note,
            };
            sessionMap.set(item.id, item);
          });

          // Merge local sessions that are not yet on backend
          localSessions.forEach((local) => {
            // Check if this local session is already represented on backend
            // (by exact ID, or matching exerciseId + startedAt within 3 seconds)
            const isAlreadyOnServer = Array.from(sessionMap.values()).some((server) => {
              if (server.id === local.id) return true;
              const sameExercise = server.exerciseId === local.exerciseId;
              const timeDiff = Math.abs(server.startedAt - local.startedAt);
              return sameExercise && timeDiff <= 3000;
            });

            if (!isAlreadyOnServer) {
              sessionMap.set(local.id, local);
            }
          });

          // Deduplicate the merged list (cleans up any existing duplicate records from earlier runs)
          const allMerged = Array.from(sessionMap.values()).sort((a, b) => b.startedAt - a.startedAt);
          const deduplicated: WorkoutSession[] = [];
          for (const s of allMerged) {
            const hasDuplicate = deduplicated.some((existing) => {
              const sameExercise = existing.exerciseId === s.exerciseId;
              const timeDiff = Math.abs(existing.startedAt - s.startedAt);
              return sameExercise && timeDiff <= 3000;
            });
            if (!hasDuplicate) {
              deduplicated.push(s);
            }
          }

          saveToStorage(STORAGE_KEYS.SESSIONS, deduplicated);
          set({ sessions: deduplicated });
        }
      } catch {
        // Silently preserve local sessions when backend unreachable
      }
    },

    getFavoriteExercises: () => {
      const { exercises, favoriteIds } = get();
      return favoriteIds
        .map((id) => exercises.find((ex) => ex.id === id))
        .filter((ex): ex is Exercise => Boolean(ex));
    },

    getFilteredExercises: () => {
      const { exercises, selectedCategory, searchQuery } = get();
      let result = exercises;

      if (selectedCategory !== 'ALL') {
        result = result.filter((ex) => ex.category === selectedCategory);
      }

      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        result = result.filter((ex) => ex.name.toLowerCase().includes(query));
      }

      return result;
    },

    getExerciseById: (id: string) => {
      return get().exercises.find((ex) => ex.id === id);
    },

    getTodayStats: () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const startTime = todayStart.getTime();
      const endTime = todayEnd.getTime();

      const todaySessions = get().sessions.filter((s) => {
        const sTime = typeof s.startedAt === 'string' ? new Date(s.startedAt).getTime() : s.startedAt;
        return sTime >= startTime && sTime <= endTime;
      });

      const activeSeconds = todaySessions.reduce(
        (sum, s) => sum + (s.durationSeconds || 0),
        0
      );
      const caloriesBurned = todaySessions.reduce(
        (sum, s) => sum + (s.caloriesBurned || 0),
        0
      );
      const totalSteps = todaySessions.reduce(
        (sum, s) => sum + (s.totalSteps || 0),
        0
      );

      return {
        date: getLocalDateStr(now),
        totalSteps,
        targetSteps: 6000,
        activeMinutes: Math.round(activeSeconds / 60),
        targetActiveMinutes: 30,
        caloriesBurned: Math.round(caloriesBurned),
        targetCalories: 300,
      };
    },

    getWeeklyStats: (targetDate = new Date()) => {
      // Calculate Monday to Sunday of current week in LOCAL time
      const current = new Date(targetDate);
      const day = current.getDay(); // 0 is Sunday, 1 is Monday...
      const diffToMonday = current.getDate() - day + (day === 0 ? -6 : 1);

      const monday = new Date(
        current.getFullYear(),
        current.getMonth(),
        diffToMonday,
        0,
        0,
        0,
        0
      );

      const sunday = new Date(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate() + 6,
        23,
        59,
        59,
        999
      );

      // Thứ 2 → Chủ nhật theo JS getDay() (1..6, 0); nhãn theo ngôn ngữ đang chọn
      const dayLabels = [1, 2, 3, 4, 5, 6, 0].map(getWeekdayShort);
      const dailyDistribution = dayLabels.map((label, index) => {
        const dayStart = new Date(
          monday.getFullYear(),
          monday.getMonth(),
          monday.getDate() + index,
          0,
          0,
          0,
          0
        );
        const dayEnd = new Date(
          monday.getFullYear(),
          monday.getMonth(),
          monday.getDate() + index,
          23,
          59,
          59,
          999
        );

        const startTime = dayStart.getTime();
        const endTime = dayEnd.getTime();

        // Filter sessions strictly within this local day's 00:00:00 - 23:59:59
        const daySessions = get().sessions.filter((s) => {
          const sTime = typeof s.startedAt === 'string' ? new Date(s.startedAt).getTime() : s.startedAt;
          return sTime >= startTime && sTime <= endTime;
        });

        const dur = daySessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
        const cal = daySessions.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0);

        return {
          dayNumber: index + 2,
          dayLabel: label,
          dateStr: getLocalDateStr(dayStart),
          durationSeconds: dur,
          calories: cal,
          hasWorkout: daySessions.length > 0,
        };
      });

      const weekSessions = get().sessions.filter((s) => {
        const sTime = typeof s.startedAt === 'string' ? new Date(s.startedAt).getTime() : s.startedAt;
        return sTime >= monday.getTime() && sTime <= sunday.getTime();
      });

      const totalDurationSeconds = weekSessions.reduce(
        (sum, s) => sum + (s.durationSeconds || 0),
        0
      );
      const totalCalories = weekSessions.reduce(
        (sum, s) => sum + (s.caloriesBurned || 0),
        0
      );

      const weekRangeLabel = i18n.t('workout:date.weekRange', {
        startDay: monday.getDate(),
        endDay: sunday.getDate(),
        month: sunday.getMonth() + 1,
        monthShort: getMonthShort(sunday.getMonth() + 1),
      });

      return {
        weekRangeLabel,
        totalDurationSeconds,
        totalCalories,
        totalSessions: weekSessions.length,
        dailyDistribution,
      };
    },
  };
});
