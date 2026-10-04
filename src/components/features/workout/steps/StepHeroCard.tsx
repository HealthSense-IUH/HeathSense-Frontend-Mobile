import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Target } from 'lucide-react-native';

interface StepHeroCardProps {
  currentSteps: number;
  distanceKm: string;
  caloriesBurned: number;
  targetGoal: number;
  onOpenGoalModal: () => void;
}

export const StepHeroCard: React.FC<StepHeroCardProps> = ({
  currentSteps,
  distanceKm,
  caloriesBurned,
  targetGoal,
  onOpenGoalModal,
}) => {
  const progressRatio = Math.min(1, currentSteps / targetGoal);

  return (
    <View
      className="mb-4 rounded-3xl bg-white border border-slate-100 p-6 shadow-xs"
      style={{
        shadowColor: 'rgba(15, 23, 42, 0.04)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View className="flex-row items-start justify-between">
        {/* Step Counter */}
        <View>
          <Text className="text-5xl font-extrabold text-slate-900 tracking-tight">
            {currentSteps.toLocaleString('vi-VN')}
          </Text>
          <Text className="text-base font-bold text-slate-700 mt-1">bước</Text>
        </View>

        {/* Distance and Calories */}
        <View className="items-end pt-1">
          <Text className="text-sm font-semibold text-slate-600 mb-1">
            {distanceKm} km
          </Text>
          <Text className="text-sm font-semibold text-slate-600">
            {caloriesBurned} kcal
          </Text>
        </View>
      </View>

      {/* Target Progress Bar */}
      <View className="mt-6 mb-2">
        <View className="h-3 bg-slate-100 rounded-full overflow-hidden w-full">
          <View
            className="h-full bg-[#22C55E] rounded-full"
            style={{ width: `${Math.max(5, progressRatio * 100)}%` }}
          />
        </View>

        {/* Range Labels: 0 and Target Button */}
        <View className="flex-row items-center justify-between mt-2.5">
          <Text className="text-xs font-semibold text-slate-400">0</Text>
          <Pressable
            onPress={onOpenGoalModal}
            className="flex-row items-center bg-slate-100 px-3 py-1.5 rounded-full active:opacity-75"
          >
            <Target size={13} color="#475569" className="mr-1.5" />
            <Text className="text-xs font-bold text-slate-700">
              {targetGoal.toLocaleString('vi-VN')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
