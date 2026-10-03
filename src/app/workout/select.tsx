import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { safeRouter } from '@/utils/safeNavigation';
import { ArrowLeft, Search, X, Plus } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { ExerciseIcon } from '@/components/features/workout/ExerciseIcon';
import { CreateExerciseModal } from '@/components/features/workout/CreateExerciseModal';
import { useWorkoutCatalogStore } from '@/services/workout/workoutCatalogStore';
import {
  ExerciseCategory,
  EXERCISE_CATEGORY_LABELS,
  Exercise,
} from '@/services/workout/workoutTypes';
import { THEME } from '@/constants/theme';

export default function SelectExerciseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const isRoutinePicker = params.mode === 'routine';

  const exercises = useWorkoutCatalogStore((state) => state.exercises);
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const categories: (ExerciseCategory | 'ALL')[] = [
    'ALL',
    'GENERAL',
    'AEROBIC',
    'FREE_WEIGHT',
    'MACHINE_WEIGHT',
    'WILDERNESS',
    'WATER',
    'WINTER',
    'BALL',
  ];

  const filteredExercises = exercises.filter((ex) => {
    const matchesCategory = selectedCategory === 'ALL' || ex.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim().length === 0 ||
      ex.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchesCategory && matchesSearch;
  });

  const handleSelect = (exercise: Exercise) => {
    if (isRoutinePicker) {
      // Return selected exercise to routine builder
      safeRouter.back();
      // Store can be updated or handled via callback
    } else {
      safeRouter.navigate({
        pathname: '/workout/pre-workout' as any,
        params: { exerciseId: exercise.id },
      });
    }
  };

  return (
    <ScreenWrapper
      title="Chọn bài tập"
      headerLeft={
        <TouchableOpacity
          onPress={() => safeRouter.back()}
          className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
        >
          <ArrowLeft color={THEME.colors.textPrimary} size={22} />
        </TouchableOpacity>
      }
      headerRight={
        <TouchableOpacity
          onPress={() => setIsSearchVisible(!isSearchVisible)}
          className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
        >
          <Search color={THEME.colors.textPrimary} size={22} />
        </TouchableOpacity>
      }
    >
      <View className="flex-1">
        {/* OPTIONAL SEARCH BAR */}
        {isSearchVisible && (
          <View className="px-5 mb-2">
            <View className="flex-row items-center bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
              <Search color="#94A3B8" size={18} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Tìm kiếm bài tập..."
                placeholderTextColor="#94A3B8"
                autoFocus
                className="flex-1 ml-2.5 text-slate-800 text-base font-medium"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X color="#94A3B8" size={18} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* HORIZONTALLY SCROLLABLE FILTER CHIPS (Image 4) */}
        <View className="py-2.5">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              const label = cat === 'ALL' ? 'Tất cả' : EXERCISE_CATEGORY_LABELS[cat];

              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full items-center justify-center ${
                    isSelected ? 'bg-[#E5E7EB]' : 'bg-transparent'
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      isSelected ? 'font-bold text-slate-900' : 'font-medium text-slate-500'
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* LIST OF EXERCISES */}
        <ScrollView className="flex-1 px-5 pt-2" showsVerticalScrollIndicator={false}>
          <View className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm mb-24">
            {filteredExercises.length === 0 ? (
              <View className="p-8 items-center justify-center">
                <Text className="text-slate-400 text-sm font-medium">
                  Không tìm thấy bài tập phù hợp
                </Text>
              </View>
            ) : (
              filteredExercises.map((exercise, index) => {
                const isLast = index === filteredExercises.length - 1;

                return (
                  <TouchableOpacity
                    key={exercise.id}
                    onPress={() => handleSelect(exercise)}
                    activeOpacity={0.7}
                    className={`flex-row items-center px-4 py-3.5 ${
                      !isLast ? 'border-b border-slate-100' : ''
                    }`}
                  >
                    {/* Selection Radio Circle */}
                    <View className="w-5 h-5 rounded-full border-2 border-slate-300 mr-3.5 items-center justify-center" />

                    {/* Icon */}
                    <ExerciseIcon
                      name={exercise.iconName}
                      size={20}
                      color="#10B981"
                      bgColor="rgba(16, 185, 129, 0.1)"
                      className="mr-3.5"
                    />

                    {/* Name */}
                    <Text
                      className="text-base font-semibold text-slate-800 flex-1"
                      numberOfLines={1}
                    >
                      {exercise.name}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* STICKY BOTTOM BUTTON: '+ Tạo bài tập thể dục mới' (Exact One UI layout from Image 4) */}
        <View className="absolute bottom-6 left-5 right-5 items-center">
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.85}
            className="flex-row items-center justify-center bg-slate-900/95 py-3.5 px-6 rounded-full shadow-lg border border-slate-700/80"
            style={{ elevation: 5 }}
          >
            <Plus color="#10B981" size={20} className="mr-2" />
            <Text className="text-white font-bold text-base">
              Tạo bài tập thể dục mới
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CREATE EXERCISE MODAL */}
      <CreateExerciseModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(id) => {
          const created = exercises.find((e) => e.id === id);
          if (created) handleSelect(created);
        }}
      />
    </ScreenWrapper>
  );
}
