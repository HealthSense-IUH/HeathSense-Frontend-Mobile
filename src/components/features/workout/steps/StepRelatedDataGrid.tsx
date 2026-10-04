import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Dumbbell, Shield, Heart, Flame } from 'lucide-react-native';
import { safeRouter } from '@/utils/safeNavigation';

interface StepRelatedDataGridProps {
  activeMinutes: number;
  caloriesBurned: number;
}

export const StepRelatedDataGrid: React.FC<StepRelatedDataGridProps> = ({
  activeMinutes,
  caloriesBurned,
}) => {
  return (
    <View className="mb-8">
      <Text className="text-xs font-bold text-slate-600 mb-3 px-1 uppercase tracking-wider">
        Các dữ liệu khác trong khoảng thời gian này
      </Text>

      <View className="flex-row flex-wrap gap-2.5 justify-between">
        {/* Card 1: Tập thể dục */}
        <Pressable
          onPress={() => safeRouter.navigate('/workout/history')}
          className="w-[48%] bg-white border border-slate-100 p-4 rounded-3xl items-center justify-center active:opacity-85 shadow-xs"
        >
          <View className="w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mb-2.5">
            <Dumbbell color="#475569" size={24} />
          </View>
          <Text className="text-xs font-bold text-slate-800 text-center">
            Tập th.dục
          </Text>
          <Text className="text-[10px] text-slate-400 mt-0.5">
            {activeMinutes} phút
          </Text>
        </Pressable>

        {/* Card 2: Chỉ số thể lực */}
        <Pressable
          onPress={() => {}}
          className="w-[48%] bg-white border border-slate-100 p-4 rounded-3xl items-center justify-center active:opacity-85 shadow-xs"
        >
          <View className="w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mb-2.5">
            <Shield color="#475569" size={24} />
          </View>
          <Text className="text-xs font-bold text-slate-800 text-center">
            Chỉ số thể lực
          </Text>
          <Text className="text-[10px] text-slate-400 mt-0.5">
            Mức tốt (VO2 max)
          </Text>
        </Pressable>

        {/* Card 3: Sức khỏe tim mạch */}
        <Pressable
          onPress={() => safeRouter.navigate('/afib-measure' as any)}
          className="w-[48%] bg-white border border-slate-100 p-4 rounded-3xl items-center justify-center active:opacity-85 shadow-xs"
        >
          <View className="w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mb-2.5">
            <Heart color="#EF4444" size={24} />
          </View>
          <Text className="text-xs font-bold text-slate-800 text-center">
            Sức khỏe tim mạch
          </Text>
          <Text className="text-[10px] text-slate-400 mt-0.5">
            72 bpm trung bình
          </Text>
        </Pressable>

        {/* Card 4: Mức tiêu hao năng lượng */}
        <Pressable
          onPress={() => {}}
          className="w-[48%] bg-white border border-slate-100 p-4 rounded-3xl items-center justify-center active:opacity-85 shadow-xs"
        >
          <View className="w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mb-2.5">
            <Flame color="#F97316" size={24} />
          </View>
          <Text className="text-xs font-bold text-slate-800 text-center">
            Mức tiêu hao
          </Text>
          <Text className="text-[10px] text-slate-400 mt-0.5">
            {caloriesBurned} kcal
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
