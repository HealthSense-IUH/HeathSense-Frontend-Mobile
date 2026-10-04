import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface HourlyDataItem {
  hour: number;
  steps: number;
}

interface StepHourlyCardProps {
  hourlyData: HourlyDataItem[];
  activePeriodStr: string;
  onPress: () => void;
}

export const StepHourlyCard: React.FC<StepHourlyCardProps> = ({
  hourlyData,
  activePeriodStr,
  onPress,
}) => {
  const maxHourlyVal = Math.max(...hourlyData.map((h) => h.steps), 100);

  return (
    <Pressable
      onPress={onPress}
      className="mb-4 rounded-3xl bg-white border border-slate-100 p-5 shadow-xs active:opacity-85"
      style={{
        shadowColor: 'rgba(15, 23, 42, 0.04)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-base font-bold text-slate-900">
          Số bước theo thời gian trong ngày
        </Text>
        <ChevronRight size={18} color="#94A3B8" />
      </View>

      <Text className="text-xs text-slate-500 mb-5 leading-relaxed">
        {activePeriodStr}
      </Text>

      {/* 24-Hour Timeline Bar Chart */}
      <View className="h-20 w-full justify-end pb-1">
        {/* Baseline */}
        <View className="absolute left-0 right-0 bottom-6 h-[1px] bg-slate-200" />

        {/* Hourly Green Bars */}
        <View className="flex-row items-end justify-between h-14 px-1 pb-1">
          {hourlyData.map((item) => {
            const barHeight =
              item.steps > 0
                ? Math.max(14, (item.steps / maxHourlyVal) * 44)
                : 0;

            return (
              <View key={item.hour} className="items-center flex-1">
                {item.steps > 0 && (
                  <View
                    className="w-1.5 rounded-full bg-[#22C55E]"
                    style={{ height: barHeight }}
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* X-axis labels (0, 6, 12, 18, (giờ)) */}
        <View className="flex-row items-center justify-between pt-1 px-1">
          <Text className="text-[11px] text-slate-400 font-medium">0</Text>
          <Text className="text-[11px] text-slate-400 font-medium">6</Text>
          <Text className="text-[11px] text-slate-400 font-medium">12</Text>
          <Text className="text-[11px] text-slate-400 font-medium">18</Text>
          <Text className="text-[11px] text-slate-400 font-medium">(giờ)</Text>
        </View>
      </View>

      {/* Footer updated timestamp */}
      <View className="items-end mt-4">
        <Text className="text-[11px] text-slate-400">Đã cập nhật 17:39</Text>
      </View>
    </Pressable>
  );
};
