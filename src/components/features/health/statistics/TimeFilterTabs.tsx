import React from 'react';
import { View, Text, Pressable } from 'react-native';

type FilterType = 'Ngày' | 'Tuần' | 'Tháng' | 'Năm';
const FILTERS: FilterType[] = ['Ngày', 'Tuần', 'Tháng', 'Năm'];

interface TimeFilterTabsProps {
  activeFilter: FilterType;
  onChange: (filter: FilterType) => void;
}

export const TimeFilterTabs = React.memo(function TimeFilterTabs({
  activeFilter,
  onChange,
}: TimeFilterTabsProps) {
  const handlePress = (filter: FilterType) => {
    if (filter === activeFilter) return;
    onChange(filter);
  };

  return (
    <View className="px-6 py-2.5">
      <View className="flex-row items-center justify-between">
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <Pressable
              key={filter}
              onPress={() => handlePress(filter)}
              className={`px-4 py-2 rounded-full items-center justify-center ${
                isActive ? 'bg-[#E5E7EB]' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-sm ${
                  isActive ? 'font-bold text-slate-900' : 'font-medium text-slate-500'
                }`}
              >
                {filter}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});
