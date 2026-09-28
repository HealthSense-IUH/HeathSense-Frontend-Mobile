import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
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
import { THEME } from '@/constants/theme';

export default function WorkoutCatalogScreen() {
  const router = useRouter();

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
    router.push({
      pathname: '/workout/pre-workout' as any,
      params: { exerciseId: exercise.id },
    });
  };

  return (
    <ScreenWrapper
      title="Bài tập thể dục của bạn"
      statusBarStyle="dark"
      className="bg-slate-50"
      headerLeft={
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
        >
          <ArrowLeft color={THEME.colors.textPrimary} size={22} />
        </TouchableOpacity>
      }
      headerRight={
        <View className="flex-row items-center gap-1">
          <TouchableOpacity
            onPress={() => setShowAddMenu(true)}
            className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
          >
            <Plus color={THEME.colors.textPrimary} size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowAddMenu(true)}
            className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
          >
            <MoreVertical color={THEME.colors.textPrimary} size={20} />
          </TouchableOpacity>
        </View>
      }
    >
      <ScrollView className="flex-1 px-4 pt-2 bg-slate-50" showsVerticalScrollIndicator={false}>
        {/* SECTION 1: YÊU THÍCH (Visible ONLY when favorites exist, matching Image 2) */}
        {favoriteExercises.length > 0 && (
          <View className="mb-6">
            <Text className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 px-1">
              Yêu thích
            </Text>

            <View className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
              {favoriteExercises.map((exercise, index) => {
                const isLast = index === favoriteExercises.length - 1;
                return (
                  <TouchableOpacity
                    key={exercise.id}
                    onPress={() => handleSelectExercise(exercise)}
                    activeOpacity={0.7}
                    className={`flex-row items-center justify-between py-3.5 px-4 ${
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
                        {exercise.name}
                      </Text>
                    </View>

                    {/* Right: Vertical Line Divider + Solid Yellow Star */}
                    <View className="flex-row items-center">
                      <View className="w-[1px] h-5 bg-slate-200 mr-2" />
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleToggleStar(exercise.id);
                        }}
                        className="p-1.5"
                        activeOpacity={0.7}
                      >
                        <Star color="#EAB308" fill="#EAB308" size={22} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* SECTION 2: BÀI TẬP KHÁC (Light Theme matching Image 2) */}
        <View className="mb-8">
          <Text className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 px-1">
            Bài tập khác
          </Text>

          <View className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
            {otherExercises.map((exercise, index) => {
              const isLast = index === otherExercises.length - 1;
              return (
                <TouchableOpacity
                  key={exercise.id}
                  onPress={() => handleSelectExercise(exercise)}
                  activeOpacity={0.7}
                  className={`flex-row items-center justify-between py-3.5 px-4 ${
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
                      {exercise.name}
                    </Text>
                  </View>

                  {/* Right: Vertical Line Divider + Star Outline */}
                  <View className="flex-row items-center">
                    <View className="w-[1px] h-5 bg-slate-200 mr-2" />
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleToggleStar(exercise.id);
                      }}
                      className="p-1.5"
                      activeOpacity={0.7}
                    >
                      <Star color="#94A3B8" size={22} strokeWidth={1.8} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
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
            style={{ elevation: 8 }}
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
              Thêm bài tập thể dục
            </Text>

            <TouchableOpacity
              onPress={() => {
                setShowAddMenu(false);
                router.push('/workout/select' as any);
              }}
              activeOpacity={0.8}
              className="flex-row items-center gap-4 py-3.5 px-4 rounded-2xl bg-slate-50 mb-3 border border-slate-200/80"
            >
              <ListOrdered color="#10B981" size={22} />
              <Text className="text-slate-800 font-semibold text-base">
                Chọn từ danh sách bài tập
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowAddMenu(false);
                setShowCreateModal(true);
              }}
              activeOpacity={0.8}
              className="flex-row items-center gap-4 py-3.5 px-4 rounded-2xl bg-slate-50 mb-3 border border-slate-200/80"
            >
              <PlusCircle color="#0EA5E9" size={22} />
              <Text className="text-slate-800 font-semibold text-base">
                Tạo bài tập thể dục mới
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowAddMenu(false);
                router.push('/workout/create-routine' as any);
              }}
              activeOpacity={0.8}
              className="flex-row items-center gap-4 py-3.5 px-4 rounded-2xl bg-slate-50 border border-slate-200/80"
            >
              <Timer color="#F59E0B" size={22} />
              <Text className="text-slate-800 font-semibold text-base">
                Tạo lịch trình tập luyện
              </Text>
            </TouchableOpacity>

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
