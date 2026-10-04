import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { safeRouter } from '@/utils/safeNavigation';
import { ListOrdered, ChevronRight } from 'lucide-react-native';
import { useWorkoutCatalogStore } from '@/services/workout/workoutCatalogStore';
import { Exercise } from '@/services/workout/workoutTypes';
import { getExerciseName } from '@/services/workout/workoutI18n';
import { useTranslation } from 'react-i18next';
import {
  getExerciseCircleColor,
  getExerciseIconComponent,
} from './workoutThemeUtils';

export { getExerciseCircleColor, getExerciseIconComponent };

export const FavoriteWorkoutSection: React.FC = () => {
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
    safeRouter.navigate('/workout/catalog');
  };

  const handleSelectFavorite = (exercise: Exercise) => {
    safeRouter.navigate({
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
      <Pressable
        onPress={handleNavigateToCatalog}
        className="flex-row items-center justify-between mb-3 active:opacity-70"
      >
        <Text className="text-base font-bold text-slate-900 tracking-tight">{t('favorites.title')}</Text>
        <ChevronRight color="#94A3B8" size={18} />
      </Pressable>

      {/* Main Content */}
      {hasFavorites ? (
        <View className="flex-row items-start justify-around pt-2">
          {/* Render 1, 2, or 3 Favorite Items */}
          {favoriteExercises.map((exercise) => {
            const IconComp = getExerciseIconComponent(exercise.iconName);
            const circleBg = getExerciseCircleColor(exercise.id, exercise.category);

            return (
              <Pressable
                key={exercise.id}
                onPress={() => handleSelectFavorite(exercise)}
                className="items-center w-[72px] active:opacity-75"
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
              </Pressable>
            );
          })}

          {/* "Nhiều hơn" (More) Circle Button (Visible ONLY if favoriteCount > 0) */}
          <Pressable
            onPress={handleNavigateToCatalog}
            className="items-center w-[72px] active:opacity-75"
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
          </Pressable>
        </View>
      ) : (
        /* Zero Favorites State - Light Mode matching Image 1 exactly */
        <Pressable
          onPress={handleNavigateToCatalog}
          className="pt-6 pb-2 min-h-[95px] justify-end active:opacity-70"
        >
          <Text className="text-xs text-slate-600 leading-relaxed font-normal">
            {t('favorites.empty')}
          </Text>
        </Pressable>
      )}
    </View>
  );
};
