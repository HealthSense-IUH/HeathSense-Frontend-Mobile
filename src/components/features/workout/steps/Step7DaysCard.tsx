import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

export interface DayStepItem {
  date: Date;
  dayNum: number;
  isSunday: boolean;
  steps: number;
  isCurrent: boolean;
}

interface Step7DaysCardProps {
  items: DayStepItem[];
  avgSteps: number;
  onPress: () => void;
}

export const Step7DaysCard: React.FC<Step7DaysCardProps> = ({
  items,
  avgSteps,
  onPress,
}) => {
  const maxPastSteps = Math.max(...items.map((p) => p.steps), 3500);

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
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-base font-bold text-slate-900">
          Số bước trong 7 ngày qua
        </Text>
        <ChevronRight size={18} color="#94A3B8" />
      </View>

      {/* 7-Day Chart with Dashed Average Line & Pills/Dots */}
      <View className="h-32 w-full relative justify-end pb-1 pt-4">
        {/* Horizontal Dashed Average Line with TB Badge */}
        <View className="absolute left-0 right-14 top-14 border-b border-dashed border-slate-300" />
        <View className="absolute right-0 top-11 bg-white border border-slate-200/90 px-2 py-0.5 rounded-lg">
          <Text className="text-[10px] font-bold text-slate-600">
            TB {avgSteps.toLocaleString('vi-VN')}
          </Text>
        </View>

        {/* 7 Bars / Dots matching user's screenshot */}
        <View className="flex-row items-end justify-between px-3 h-20">
          {items.map((item) => {
            const isLow = item.steps < 800;
            const barHeight = isLow
              ? 10
              : Math.max(16, (item.steps / maxPastSteps) * 56);

            return (
              <View key={item.date.toISOString()} className="items-center flex-1">
                <View className="h-16 justify-end items-center">
                  {isLow ? (
                    // Small circle dot for low activity day
                    <View className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                  ) : (
                    // Vertical pill bar
                    <View
                      className="w-3 rounded-full bg-[#22C55E]"
                      style={{ height: barHeight }}
                    />
                  )}
                </View>

                {/* Day Number (Red if Sunday, matching day 27 in screenshot) */}
                <Text
                  className={`text-xs mt-2 ${
                    item.isSunday
                      ? 'text-red-500 font-extrabold'
                      : 'text-slate-600 font-bold'
                  }`}
                >
                  {item.dayNum}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </Pressable>
  );
};
