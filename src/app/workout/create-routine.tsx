import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  FlatList,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { ExerciseIcon } from '@/components/features/workout/ExerciseIcon';
import { useWorkoutCatalogStore } from '@/services/workout/workoutCatalogStore';
import { RoutineExerciseItem, Exercise } from '@/services/workout/workoutTypes';
import { THEME } from '@/constants/theme';

export default function CreateRoutineScreen() {
  const router = useRouter();
  const createRoutine = useWorkoutCatalogStore((state) => state.createRoutine);
  const exercises = useWorkoutCatalogStore((state) => state.exercises);

  const [routineName, setRoutineName] = useState('Lịch trình của bạn 1');
  const [hasWarmup, setHasWarmup] = useState(false);
  const [hasCooldown, setHasCooldown] = useState(false);
  const [routineItems, setRoutineItems] = useState<RoutineExerciseItem[]>([]);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const itemIdCounterRef = useRef(0);

  const handleAddExercise = useCallback((exercise: Exercise) => {
    itemIdCounterRef.current += 1;
    const newItem: RoutineExerciseItem = {
      id: `item_${itemIdCounterRef.current}_${exercise.id}`,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      orderIndex: routineItems.length + 1,
      targetSets: exercise.trackingType === 'SETS_REST' ? 3 : undefined,
      targetReps: exercise.trackingType === 'SETS_REST' ? 12 : undefined,
      targetDurationSec: exercise.trackingType !== 'SETS_REST' ? 60 : undefined,
      restDurationSec: 30,
    };

    setRoutineItems((prev) => [...prev, newItem]);
    setShowPickerModal(false);
  }, [routineItems.length]);

  const renderExerciseItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <Pressable
        onPress={() => handleAddExercise(item)}
        className="flex-row items-center py-3 border-b border-slate-100 active:bg-slate-50"
      >
        <ExerciseIcon name={item.iconName} size={18} className="mr-3" />
        <Text className="text-base font-medium text-slate-800 flex-1">
          {item.name}
        </Text>
      </Pressable>
    ),
    [handleAddExercise]
  );

  const handleRemoveItem = (id: string) => {
    setRoutineItems(routineItems.filter((item) => item.id !== id));
  };

  const handleSave = () => {
    if (!routineName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên lịch trình');
      return;
    }

    createRoutine({
      name: routineName.trim(),
      hasWarmup,
      warmupDurationSec: hasWarmup ? 180 : 0,
      hasCooldown,
      cooldownDurationSec: hasCooldown ? 180 : 0,
      items: routineItems,
    });

    Alert.alert('Thành công', 'Đã lưu lịch trình tập luyện của bạn.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <ScreenWrapper
      title="Tạo lịch trình tập luyện"
      headerLeft={
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
          hitSlop={8}
        >
          <ArrowLeft color={THEME.colors.textPrimary} size={22} />
        </Pressable>
      }
    >
      <View className="flex-1">
        <ScrollView className="flex-1 px-5 pt-2" showsVerticalScrollIndicator={false}>
          {/* Subtitle Description */}
          <Text className="text-slate-500 text-sm font-medium leading-5 mb-5 px-1">
            Kết hợp một loạt các bài tập thể dục cho một lịch trình tập luyện tùy chỉnh.
          </Text>

          {/* Routine Name Input Card (Image 1) */}
          <View className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm mb-6">
            <TextInput
              value={routineName}
              onChangeText={setRoutineName}
              placeholder="Nhập tên lịch trình..."
              placeholderTextColor="#94A3B8"
              className="text-lg font-bold text-slate-800"
            />
          </View>

          {/* Section: Tập thể dục */}
          <Text className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 px-1">
            Tập thể dục
          </Text>

          <View className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm mb-8">
            {/* ITEM: KHỞI ĐỘNG (WARM-UP) */}
            <View className="flex-row items-center justify-between p-4 border-b border-slate-100">
              <View>
                <Text className="text-base font-semibold text-slate-800">
                  Khởi động
                </Text>
                {hasWarmup && (
                  <Text className="text-xs text-slate-400 mt-0.5">3 phút làm nóng khớp</Text>
                )}
              </View>
              <Switch
                value={hasWarmup}
                onValueChange={setHasWarmup}
                trackColor={{ false: '#E2E8F0', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* LIST OF ADDED EXERCISES */}
            {routineItems.map((item, index) => {
              const matchedEx = exercises.find((e) => e.id === item.exerciseId);

              return (
                <View
                  key={item.id}
                  className="flex-row items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50"
                >
                  <View className="flex-row items-center gap-3 flex-1 min-w-0">
                    <Text className="text-xs font-bold text-slate-400 w-5">
                      #{index + 1}
                    </Text>
                    <ExerciseIcon
                      name={matchedEx?.iconName}
                      size={18}
                      color="#10B981"
                      bgColor="rgba(16, 185, 129, 0.1)"
                    />
                    <View className="flex-1 min-w-0">
                      <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>
                        {item.exerciseName}
                      </Text>
                      <Text className="text-xs text-slate-400 mt-0.5">
                        {item.targetSets ? `${item.targetSets} hiệp • ${item.targetReps} reps` : '60 giây'}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => handleRemoveItem(item.id)}
                    className="p-2 -mr-1 active:opacity-70"
                    hitSlop={8}
                  >
                    <Trash2 color="#EF4444" size={18} />
                  </Pressable>
                </View>
              );
            })}

            {/* BUTTON: '+ THÊM BÀI TẬP THỂ DỤC' */}
            <Pressable
              onPress={() => setShowPickerModal(true)}
              className="flex-row items-center gap-3 p-4 border-b border-slate-100 active:bg-slate-50"
            >
              <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center">
                <Plus color="#10B981" size={18} strokeWidth={2.5} />
              </View>
              <Text className="text-base font-semibold text-emerald-600">
                Thêm bài tập thể dục
              </Text>
            </Pressable>

            {/* ITEM: HẠ NHIỆT (COOL-DOWN) */}
            <View className="flex-row items-center justify-between p-4">
              <View>
                <Text className="text-base font-semibold text-slate-800">
                  Hạ nhiệt
                </Text>
                {hasCooldown && (
                  <Text className="text-xs text-slate-400 mt-0.5">3 phút giãn cơ & hồi phục</Text>
                )}
              </View>
              <Switch
                value={hasCooldown}
                onValueChange={setHasCooldown}
                trackColor={{ false: '#E2E8F0', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View className="h-28" />
        </ScrollView>

        {/* BOTTOM ACTION BAR: 'Thoát' | 'Lưu' (Image 1) */}
        <View className="absolute bottom-6 left-5 right-5 flex-row gap-3">
          <Pressable
            onPress={() => router.back()}
            className="flex-1 py-4 rounded-2xl bg-white border border-slate-200 items-center justify-center shadow-sm active:opacity-75"
          >
            <Text className="text-slate-600 font-semibold text-base">Thoát</Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            className="flex-1 py-4 rounded-2xl bg-slate-900 items-center justify-center shadow-md active:opacity-75"
          >
            <Text className="text-white font-bold text-base">Lưu</Text>
          </Pressable>
        </View>
      </View>

      {/* QUICK EXERCISE PICKER MODAL */}
      {showPickerModal && (
        <View className="absolute inset-0 bg-black/60 z-50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[75%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-slate-900">
                Chọn bài tập vào lịch trình
              </Text>
              <Pressable onPress={() => setShowPickerModal(false)} className="active:opacity-70" hitSlop={8}>
                <Text className="text-slate-500 font-medium">Đóng</Text>
              </Pressable>
            </View>

            <FlatList
              data={exercises}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={renderExerciseItem}
            />
          </View>
        </View>
      )}
    </ScreenWrapper>
  );
}
