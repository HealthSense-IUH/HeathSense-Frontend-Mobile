import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ListOrdered,
  Footprints,
  Flame,
  Bike,
  Gauge,
  RotateCw,
  Zap,
  Shield,
  ArrowDownCircle,
  ChevronDown,
  Disc,
  Dumbbell,
  ArrowUpCircle,
  Layers,
  Box,
  Target,
  Compass,
  Mountain,
  Waves,
  SunMedium,
  Snowflake,
  CloudSnow,
  Trophy,
  CircleDot,
  Globe,
  Activity,
  Sparkles,
  HeartPulse,
  Music,
  ChevronRight,
} from 'lucide-react-native';
import { useWorkoutCatalogStore } from '@/services/workout/workoutCatalogStore';
import { Exercise } from '@/services/workout/workoutTypes';
import { getExerciseName } from '@/services/workout/workoutI18n';
import { useTranslation } from 'react-i18next';

// Lucide icon mapping
const ICON_MAP: Record<string, any> = {
  Footprints,
  Flame,
  Bike,
  Gauge,
  RotateCw,
  Zap,
  Shield,
  ArrowDownCircle,
  ChevronDown,
  Disc,
  Dumbbell,
  ArrowUpCircle,
  Layers,
  Box,
  Target,
  Compass,
  Mountain,
  Waves,
  SunMedium,
  Snowflake,
  CloudSnow,
  Trophy,
  CircleDot,
  Globe,
  Activity,
  Sparkles,
  HeartPulse,
  Music,
};

/**
 * Circle color assignment matching Samsung Health aesthetic
 */
const getExerciseCircleColor = (exerciseId: string, category?: string): string => {
  switch (exerciseId) {
    case 'walking':
      return '#34C759'; // Vibrant Walking Green
    case 'running':
    case 'track_running':
      return '#7CA018'; // Lime Olive Running
    case 'cycling':
    case 'stationary_bike':
      return '#E05A47'; // Coral Red Cycling
    case 'pool_swimming':
    case 'open_water_swimming':
      return '#06B6D4'; // Cyan Swimming
    case 'badminton':
    case 'table_tennis':
      return '#EC4899'; // Pink Racket
    case 'hiking':
    case 'trail_running':
      return '#10B981'; // Emerald Wilderness
    case 'treadmill':
    case 'elliptical':
      return '#8B5CF6'; // Purple Machine
    case 'yoga':
    case 'stretching':
      return '#F59E0B'; // Amber Stretch
    default:
      return '#22C55E';
  }
};

export const getExerciseIconComponent = (iconNameOrId?: string) => {
  if (!iconNameOrId) return Activity;
  return ICON_MAP[iconNameOrId] || Activity;
};

export { getExerciseCircleColor };

export const FavoriteWorkoutSection: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation('workout');
  const exercises = useWorkoutCatalogStore((state) => state.exercises);
  const favoriteIds = useWorkoutCatalogStore((state) => state.favoriteIds);

  // Map favorite IDs to full exercise objects (up to 3 max)
  const favoriteExercises = favoriteIds
    .map((id) => exercises.find((ex) => ex.id === id))
    .filter((ex): ex is Exercise => Boolean(ex))
    .slice(0, 3);

  const hasFavorites = favoriteExercises.length > 0;

  const handleNavigateToCatalog = () => {
    router.push('/workout/catalog' as any);
  };

  const handleSelectFavorite = (exercise: Exercise) => {
    router.push({
      pathname: '/workout/pre-workout' as any,
      params: { exerciseId: exercise.id },
    });
  };

  return (
    <View
      className="mb-5 rounded-3xl bg-white border border-slate-200/80 p-5 shadow-sm"
      style={{
        shadowColor: 'rgba(15, 23, 42, 0.06)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      {/* Section Header */}
      <TouchableOpacity
        onPress={handleNavigateToCatalog}
        activeOpacity={0.7}
        className="flex-row items-center justify-between mb-3"
      >
        <Text className="text-base font-bold text-slate-900 tracking-tight">{t('favorites.title')}</Text>
        <ChevronRight color="#94A3B8" size={18} />
      </TouchableOpacity>

      {/* Main Content */}
      {hasFavorites ? (
        <View className="flex-row items-start justify-around pt-2">
          {/* Render 1, 2, or 3 Favorite Items */}
          {favoriteExercises.map((exercise) => {
            const IconComp = ICON_MAP[exercise.iconName] || Activity;
            const circleBg = getExerciseCircleColor(exercise.id, exercise.category);

            return (
              <TouchableOpacity
                key={exercise.id}
                onPress={() => handleSelectFavorite(exercise)}
                activeOpacity={0.75}
                className="items-center w-[72px]"
              >
                {/* Colored Circle Button */}
                <View
                  className="w-[62px] h-[62px] rounded-full items-center justify-center shadow-sm"
                  style={{ backgroundColor: circleBg }}
                >
                  <IconComp color="#FFFFFF" size={28} strokeWidth={2.2} />
                </View>

                {/* Exercise Label */}
                <Text
                  className="text-xs font-semibold text-slate-800 text-center mt-2.5 leading-4"
                  numberOfLines={1}
                >
                  {getExerciseName(exercise)}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* "Nhiều hơn" (More) Circle Button (Visible ONLY if favoriteCount > 0) */}
          <TouchableOpacity
            onPress={handleNavigateToCatalog}
            activeOpacity={0.75}
            className="items-center w-[72px]"
          >
            {/* Soft Grey Circle Button */}
            <View className="w-[62px] h-[62px] rounded-full bg-slate-200/90 border border-slate-300/80 items-center justify-center shadow-sm">
              <ListOrdered color="#475569" size={26} strokeWidth={2.2} />
            </View>

            {/* Label */}
            <Text
              className="text-xs font-semibold text-slate-700 text-center mt-2.5 leading-4"
              numberOfLines={1}
            >
              {t('favorites.more')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Zero Favorites State - Light Mode matching Image 1 exactly */
        <TouchableOpacity
          onPress={handleNavigateToCatalog}
          activeOpacity={0.7}
          className="pt-6 pb-2 min-h-[95px] justify-end"
        >
          <Text className="text-xs text-slate-600 leading-relaxed font-normal">
            {t('favorites.empty')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
