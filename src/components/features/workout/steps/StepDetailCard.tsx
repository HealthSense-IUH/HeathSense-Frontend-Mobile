import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronRight, Search } from 'lucide-react-native';
import { RunningShoeIllustration } from './RunningShoeIllustration';
import { DayStepItem } from './Step7DaysCard';

interface StepDetailCardProps {
  activeTab: 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';
  currentSteps: number;
  distanceKm: string;
  caloriesBurned: number;
  hourlyData: { hour: number; steps: number }[];
  past7DaysData: { items: DayStepItem[]; avgSteps: number };
}

export const StepDetailCard: React.FC<StepDetailCardProps> = ({
  activeTab,
  currentSteps,
  distanceKm,
  caloriesBurned,
  hourlyData,
  past7DaysData,
}) => {
  const rangeTitle =
    activeTab === 'HOURS'
      ? 'Hôm nay 00:00 - 23:59'
      : activeTab === 'DAYS'
      ? '7 ngày qua'
      : activeTab === 'WEEKS'
      ? 'Tháng này'
      : 'Năm nay';

  return (
    <View
      className="mb-5 rounded-3xl bg-white border border-slate-100 p-6 shadow-xs"
      style={{
        shadowColor: 'rgba(15, 23, 42, 0.04)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      {/* Range Title + Running Shoe Illustration Icon */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <Text className="text-sm font-semibold text-slate-600 mr-1.5">
            {rangeTitle}
          </Text>
          <ChevronRight size={16} color="#94A3B8" />
        </View>

        {/* Running Shoe Vector Artwork */}
        <RunningShoeIllustration />
      </View>

      {/* Large Step Stats */}
      <View className="mt-1 mb-4">
        <View className="flex-row items-baseline gap-2">
          <Text className="text-4xl font-extrabold text-slate-900 tracking-tight">
            {currentSteps.toLocaleString('vi-VN')}
          </Text>
          <Text className="text-base font-bold text-slate-700">bước</Text>
        </View>

        <View className="flex-row items-center gap-3 mt-1.5">
          <Text className="text-xs font-semibold text-slate-500">
            {distanceKm} km
          </Text>
          <Text className="text-xs text-slate-300">|</Text>
          <Text className="text-xs font-semibold text-slate-500">
            {caloriesBurned} kcal
          </Text>
        </View>
      </View>

      {/* DETAILED BAR CHART (Image 3: Y-axis 600, 400, 200, 0 + Zoom Icon) */}
      <View className="pt-4 pb-2 relative">
        {/* Horizontal Gridlines & Y-axis labels on Right */}
        <View className="relative h-44 w-full">
          {/* 600 line */}
          <View className="absolute left-0 right-10 top-0 border-b border-slate-100" />
          <Text className="absolute right-0 top-[-6px] text-xs font-medium text-slate-400">
            600
          </Text>

          {/* 400 line */}
          <View className="absolute left-0 right-10 top-14 border-b border-slate-100" />
          <Text className="absolute right-0 top-[48px] text-xs font-medium text-slate-400">
            400
          </Text>

          {/* 200 line */}
          <View className="absolute left-0 right-10 top-28 border-b border-slate-100" />
          <Text className="absolute right-0 top-[104px] text-xs font-medium text-slate-400">
            200
          </Text>

          {/* Baseline 0 */}
          <View className="absolute left-0 right-10 bottom-4 border-b border-slate-200" />

          {/* Chart Bars according to active tab */}
          {activeTab === 'HOURS' ? (
            /* 24-Hours Bars with green spikes at 16h, 17h, 18h */
            <View className="absolute left-2 right-12 bottom-4 h-36 flex-row items-end justify-between">
              {hourlyData.map((item) => {
                const barHeight =
                  item.steps > 0
                    ? Math.min(130, Math.max(16, (item.steps / 250) * 110))
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
          ) : (
            /* Days / Weeks / Months Bars */
            <View className="absolute left-4 right-14 bottom-4 h-36 flex-row items-end justify-between">
              {past7DaysData.items.map((item) => {
                const barH = Math.min(
                  130,
                  Math.max(20, (item.steps / 3600) * 120)
                );
                return (
                  <View key={`bar-${item.date.toISOString()}`} className="items-center flex-1">
                    <View
                      className="w-3 rounded-full bg-[#22C55E]"
                      style={{ height: barH }}
                    />
                  </View>
                );
              })}
            </View>
          )}

          {/* Zoom / Search Icon button (Image 3 bottom right) */}
          <Pressable
            onPress={() => {}}
            className="absolute right-0 bottom-0 w-8 h-8 rounded-full bg-slate-100 border border-slate-200/80 items-center justify-center shadow-xs active:opacity-75"
          >
            <Search color="#64748B" size={14} />
          </Pressable>
        </View>

        {/* X-axis labels (0, 6, 12, 18 for HOURS; dates for DAYS) */}
        <View className="flex-row items-center justify-between pr-14 pl-2 pt-2">
          {activeTab === 'HOURS' ? (
            <>
              <Text className="text-[11px] text-slate-400 font-medium">0</Text>
              <Text className="text-[11px] text-slate-400 font-medium">6</Text>
              <Text className="text-[11px] text-slate-400 font-medium">12</Text>
              <Text className="text-[11px] text-slate-400 font-medium">18</Text>
            </>
          ) : (
            past7DaysData.items.map((item) => (
              <Text
                key={`lbl-${item.date.toISOString()}`}
                className={`text-[11px] font-bold ${
                  item.isSunday ? 'text-red-500' : 'text-slate-500'
                }`}
              >
                {item.dayNum}
              </Text>
            ))
          )}
        </View>
      </View>
    </View>
  );
};
