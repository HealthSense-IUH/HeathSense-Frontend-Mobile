import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { STATISTICS_PERIODS, type StatisticsPeriod } from '@/hooks/useHealthStatistics';

interface TimeFilterTabsProps {
  activeFilter: StatisticsPeriod;
  onChange: (filter: StatisticsPeriod) => void;
}

export function TimeFilterTabs({ activeFilter, onChange }: TimeFilterTabsProps) {
  const { t } = useTranslation('health');
  return (
    <View className="flex-row items-center justify-between mx-5 mt-4 p-1 bg-[#E9EEF7] rounded-2xl">
      {STATISTICS_PERIODS.map((filter) => (
        <Pressable
          key={filter}
          onPress={() => onChange(filter)}
          className={`flex-1 items-center justify-center py-2 rounded-xl transition-all active:opacity-80 ${
            activeFilter === filter ? 'bg-white shadow-sm' : 'bg-transparent'
          }`}
        >
          <Text
            className={`text-sm ${
              activeFilter === filter ? 'text-medical-500 font-bold' : 'text-slate-500 font-semibold'
            }`}
          >
            {t(`analysis.filter.${filter}`)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
