import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { ExerciseIcon } from '@/components/features/workout/ExerciseIcon';
import { useWorkoutCatalogStore } from '@/services/workout/workoutCatalogStore';
import { RoutineExerciseItem, Exercise } from '@/services/workout/workoutTypes';
import { getExerciseName } from '@/services/workout/workoutI18n';
import { THEME } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

export default function CreateRoutineScreen() {
  const router = useRouter();
  const { t } = useTranslation('workout');
  const createRoutine = useWorkoutCatalogStore((state) => state.createRoutine);
  const exercises = useWorkoutCatalogStore((state) => state.exercises);

  const [routineName, setRoutineName] = useState(() => t('createRoutine.defaultName', { n: 1 }));
  const [hasWarmup, setHasWarmup] = useState(false);
  const [hasCooldown, setHasCooldown] = useState(false);
  const [routineItems, setRoutineItems] = useState<RoutineExerciseItem[]>([]);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const itemIdCounterRef = useRef(0);

  const handleAddExercise = (exercise: Exercise) => {
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
  };

  const handleRemoveItem = (id: string) => {
    setRoutineItems(routineItems.filter((item) => item.id !== id));
  };

  const handleSave = () => {
    if (!routineName.trim()) {
      Alert.alert(t('common:error.title'), t('createRoutine.nameRequired'));
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

    Alert.alert(t('createRoutine.savedTitle'), t('createRoutine.savedMessage'), [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <ScreenWrapper
      title={t('catalog.createRoutine')}
      headerLeft={
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
        >
          <ArrowLeft color={THEME.colors.textPrimary} size={22} />
        </TouchableOpacity>
      }
    >
      <View className="flex-1">
        <ScrollView className="flex-1 px-5 pt-2" showsVerticalScrollIndicator={false}>
          {/* Subtitle Description */}
          <Text className="text-slate-500 text-sm font-medium leading-5 mb-5 px-1">
            {t('createRoutine.subtitle')}
          </Text>

          {/* Routine Name Input Card (Image 1) */}
          <View className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm mb-6">
            <TextInput
              value={routineName}
              onChangeText={setRoutineName}
              placeholder={t('createRoutine.namePlaceholder')}
              placeholderTextColor="#94A3B8"
              className="text-lg font-bold text-slate-800"
            />
          </View>

          {/* Section: Tập thể dục */}
          <Text className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 px-1">
            {t('createRoutine.exercisesSection')}
          </Text>

          <View className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm mb-8">
            {/* ITEM: KHỞI ĐỘNG (WARM-UP) */}
            <View className="flex-row items-center justify-between p-4 border-b border-slate-100">
              <View>
                <Text className="text-base font-semibold text-slate-800">
                  {t('createRoutine.warmup')}
                </Text>
                {hasWarmup && (
                  <Text className="text-xs text-slate-400 mt-0.5">{t('createRoutine.warmupHint')}</Text>
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
                        {getExerciseName({ id: item.exerciseId, name: item.exerciseName })}
                      </Text>
                      <Text className="text-xs text-slate-400 mt-0.5">
                        {item.targetSets
                          ? t('createRoutine.setsReps', { sets: item.targetSets, reps: item.targetReps })
                          : t('createRoutine.seconds', { value: 60 })}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleRemoveItem(item.id)}
                    className="p-2 -mr-1"
                  >
                    <Trash2 color="#EF4444" size={18} />
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* BUTTON: '+ THÊM BÀI TẬP THỂ DỤC' */}
            <TouchableOpacity
              onPress={() => setShowPickerModal(true)}
              activeOpacity={0.7}
              className="flex-row items-center gap-3 p-4 border-b border-slate-100 active:bg-slate-50"
            >
              <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center">
                <Plus color="#10B981" size={18} strokeWidth={2.5} />
              </View>
              <Text className="text-base font-semibold text-emerald-600">
                {t('createRoutine.addExercise')}
              </Text>
            </TouchableOpacity>

            {/* ITEM: HẠ NHIỆT (COOL-DOWN) */}
            <View className="flex-row items-center justify-between p-4">
              <View>
                <Text className="text-base font-semibold text-slate-800">
                  {t('createRoutine.cooldown')}
                </Text>
                {hasCooldown && (
                  <Text className="text-xs text-slate-400 mt-0.5">{t('createRoutine.cooldownHint')}</Text>
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
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            className="flex-1 py-4 rounded-2xl bg-white border border-slate-200 items-center justify-center shadow-sm active:opacity-75"
          >
            <Text className="text-slate-600 font-semibold text-base">{t('common.exit')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.8}
            className="flex-1 py-4 rounded-2xl bg-slate-900 items-center justify-center shadow-md active:opacity-75"
          >
            <Text className="text-white font-bold text-base">{t('common:actions.save')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* QUICK EXERCISE PICKER MODAL */}
      {showPickerModal && (
        <View className="absolute inset-0 bg-black/60 z-50 justify-end">
          <View className="bg-white rounded-t-3xl p-5 max-h-[75%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-slate-900">
                {t('createRoutine.pickerTitle')}
              </Text>
              <TouchableOpacity onPress={() => setShowPickerModal(false)}>
                <Text className="text-slate-500 font-medium">{t('common:actions.close')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {exercises.map((ex) => (
                <TouchableOpacity
                  key={ex.id}
                  onPress={() => handleAddExercise(ex)}
                  className="flex-row items-center py-3 border-b border-slate-100"
                >
                  <ExerciseIcon name={ex.iconName} size={18} className="mr-3" />
                  <Text className="text-base font-medium text-slate-800 flex-1">
                    {getExerciseName(ex)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </ScreenWrapper>
  );
}
