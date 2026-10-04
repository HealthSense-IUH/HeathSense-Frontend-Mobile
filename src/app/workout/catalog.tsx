import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { safeRouter } from '@/utils/safeNavigation';
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Star,
  ListOrdered,
  PlusCircle,
  Timer,
} from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { ExerciseIcon } from '@/components/features/workout/ExerciseIcon';
import { CreateExerciseModal } from '@/components/features/workout/CreateExerciseModal';
import { useWorkoutCatalogStore } from '@/services/workout/workoutCatalogStore';
import { Exercise } from '@/services/workout/workoutTypes';
import { getExerciseName } from '@/services/workout/workoutI18n';
import { THEME } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

export default function WorkoutCatalogScreen() {
  const { t } = useTranslation('workout');

  const exercises = useWorkoutCatalogStore((state) => state.exercises);
  const favoriteIds = useWorkoutCatalogStore((state) => state.favoriteIds);
  const toggleFavorite = useWorkoutCatalogStore((state) => state.toggleFavorite);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Group into Favorites and Others
  const favoriteExercises = favoriteIds
    .map((id) => exercises.find((ex) => ex.id === id))
    .filter((ex): ex is Exercise => Boolean(ex));

  const otherExercises = exercises.filter((ex) => !favoriteIds.includes(ex.id));

  const handleToggleStar = (exerciseId: string) => {
    const result = toggleFavorite(exerciseId);
    if (!result.success && result.message) {
      setToastMessage(result.message);
      setTimeout(() => {
        setToastMessage(null);
      }, 2800);
    }
  };

  const handleSelectExercise = (exercise: Exercise) => {
    safeRouter.navigate({
      pathname: '/workout/pre-workout' as any,
      params: { exerciseId: exercise.id },
    });
  };

  return (
    <ScreenWrapper
      title={t('catalog.title')}
      statusBarStyle="dark"
      className="bg-slate-50"
      headerLeft={
        <Pressable
          onPress={() => safeRouter.back()}
          className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
        >
          <ArrowLeft color={THEME.colors.textPrimary} size={22} />
        </Pressable>
      }
      headerRight={
        <View className="flex-row items-center gap-1">
          <Pressable
            onPress={() => setShowAddMenu(true)}
            className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
          >
            <Plus color={THEME.colors.textPrimary} size={24} />
          </Pressable>
          <Pressable
            onPress={() => setShowAddMenu(true)}
            className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
          >
            <MoreVertical color={THEME.colors.textPrimary} size={20} />
          </Pressable>
        </View>
      }
    >
      <ScrollView className="flex-1 px-4 pt-2 bg-slate-50" showsVerticalScrollIndicator={false}>
        {/* SECTION 1: YÊU THÍCH (Visible ONLY when favorites exist, matching Image 2) */}
        {favoriteExercises.length > 0 && (
          <View className="mb-6">
            <Text className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 px-1">
              {t('catalog.favorites')}
            </Text>

            <View className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
              {favoriteExercises.map((exercise, index) => {
                const isLast = index === favoriteExercises.length - 1;
                return (
                  <Pressable
                    key={exercise.id}
                    onPress={() => handleSelectExercise(exercise)}
                    className={`flex-row items-center justify-between py-3.5 px-4 active:bg-slate-50 ${
                      !isLast ? 'border-b border-slate-100' : ''
                    }`}
                  >
                    {/* Left: Icon + Exercise Name */}
                    <View className="flex-row items-center gap-3.5 flex-1 min-w-0">
                      <ExerciseIcon
                        name={exercise.iconName}
                        size={22}
                        color="#10B981"
                        bgColor="rgba(16, 185, 129, 0.12)"
                      />
                      <Text
                        className="text-base font-semibold text-slate-900 flex-1"
                        numberOfLines={1}
                      >
                        {getExerciseName(exercise)}
                      </Text>
                    </View>

                    {/* Right: Vertical Line Divider + Solid Yellow Star */}
                    <View className="flex-row items-center">
                      <View className="w-[1px] h-5 bg-slate-200 mr-2" />
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleToggleStar(exercise.id);
                        }}
                        className="p-1.5 active:opacity-60"
                      >
                        <Star color="#EAB308" fill="#EAB308" size={22} />
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* SECTION 2: BÀI TẬP KHÁC (Light Theme matching Image 2) */}
        <View className="mb-8">
          <Text className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 px-1">
            {t('catalog.others')}
          </Text>

          <View className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
            {otherExercises.map((exercise, index) => {
              const isLast = index === otherExercises.length - 1;
              return (
                <Pressable
                  key={exercise.id}
                  onPress={() => handleSelectExercise(exercise)}
                  className={`flex-row items-center justify-between py-3.5 px-4 active:bg-slate-50 ${
                    !isLast ? 'border-b border-slate-100' : ''
                  }`}
                >
                  {/* Left: Icon + Exercise Name */}
                  <View className="flex-row items-center gap-3.5 flex-1 min-w-0">
                    <ExerciseIcon
                      name={exercise.iconName}
                      size={22}
                      color="#10B981"
                      bgColor="rgba(16, 185, 129, 0.12)"
                    />
                    <Text
                      className="text-base font-medium text-slate-800 flex-1"
                      numberOfLines={1}
                    >
                      {getExerciseName(exercise)}
                    </Text>
                  </View>

                  {/* Right: Vertical Line Divider + Star Outline */}
                  <View className="flex-row items-center">
                    <View className="w-[1px] h-5 bg-slate-200 mr-2" />
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleToggleStar(exercise.id);
                      }}
                      className="p-1.5 active:opacity-60"
                    >
                      <Star color="#94A3B8" size={22} strokeWidth={1.8} />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="h-10" />
      </ScrollView>

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <View className="absolute bottom-10 left-6 right-6 z-50 items-center pointer-events-none">
          <View
            className="bg-slate-900/95 px-5 py-3.5 rounded-full shadow-2xl border border-slate-800 max-w-[95%]"
            style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)' }}
          >
            <Text className="text-white text-xs font-medium text-center leading-4">
              {toastMessage}
            </Text>
          </View>
        </View>
      )}

      {/* ACTION MENU FOR '+' BUTTON */}
      <Modal
        visible={showAddMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddMenu(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setShowAddMenu(false)}
        >
          <Pressable
            className="bg-white rounded-t-3xl p-6 border-t border-slate-200"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 px-1">
              {t('catalog.addMenuTitle')}
            </Text>

            <Pressable
              onPress={() => {
                setShowAddMenu(false);
                safeRouter.navigate('/workout/select');
              }}
              className="flex-row items-center gap-4 py-3.5 px-4 rounded-2xl bg-slate-50 mb-3 border border-slate-200/80 active:bg-slate-100"
            >
              <ListOrdered color="#10B981" size={22} />
              <Text className="text-slate-800 font-semibold text-base">
                {t('catalog.chooseFromList')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setShowAddMenu(false);
                setShowCreateModal(true);
              }}
              className="flex-row items-center gap-4 py-3.5 px-4 rounded-2xl bg-slate-50 mb-3 border border-slate-200/80 active:bg-slate-100"
            >
              <PlusCircle color="#0EA5E9" size={22} />
              <Text className="text-slate-800 font-semibold text-base">
                {t('catalog.createExercise')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setShowAddMenu(false);
                safeRouter.navigate('/workout/create-routine');
              }}
              className="flex-row items-center gap-4 py-3.5 px-4 rounded-2xl bg-slate-50 border border-slate-200/80 active:bg-slate-100"
            >
              <Timer color="#F59E0B" size={22} />
              <Text className="text-slate-800 font-semibold text-base">
                {t('catalog.createRoutine')}
              </Text>
            </Pressable>

            <View className="h-4" />
          </Pressable>
        </Pressable>
      </Modal>

      {/* CREATE EXERCISE MODAL */}
      <CreateExerciseModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </ScreenWrapper>
  );
}
