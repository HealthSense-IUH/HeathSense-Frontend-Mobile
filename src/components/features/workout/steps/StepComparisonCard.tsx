import React from 'react';
import { View, Text } from 'react-native';
import { TrendingUp } from 'lucide-react-native';

interface StepComparisonCardProps {
  avgSteps: number;
}

export const StepComparisonCard: React.FC<StepComparisonCardProps> = ({
  avgSteps,
}) => {
  return (
    <View
      className="mb-8 rounded-3xl bg-white border border-slate-100 p-5 shadow-xs"
      style={{
        shadowColor: 'rgba(15, 23, 42, 0.04)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <Text className="text-base font-bold text-slate-900 mb-1">
        So sánh số bước của bạn
      </Text>
      <Text className="text-xs text-slate-500 mb-4">
        TB {avgSteps.toLocaleString('vi-VN')} bước/ngày so với các thành viên khác
      </Text>

      {/* Comparison distribution indicator */}
      <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs font-semibold text-slate-700">
            Mức độ năng động tuần này
          </Text>
          <View className="flex-row items-center bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <TrendingUp size={12} color="#10B981" className="mr-1" />
            <Text className="text-[10px] font-bold text-emerald-600">+14%</Text>
          </View>
        </View>

        <View className="h-3 bg-slate-200/80 rounded-full overflow-hidden mb-2">
          <View className="h-full bg-[#00C8FF] rounded-full w-2/3" />
        </View>

        <Text className="text-[11px] text-slate-500 leading-relaxed">
          Số bước trung bình của bạn cao hơn 68% người dùng có cùng mục tiêu vận động trong hệ thống HealthSense.
        </Text>
      </View>
    </View>
  );
};
