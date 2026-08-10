import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

type FilterType = 'Ngày' | 'Tuần' | 'Tháng' | 'Năm';
const FILTERS: FilterType[] = ['Ngày', 'Tuần', 'Tháng', 'Năm'];

interface TimeFilterTabsProps {
  activeFilter: FilterType;
  onChange: (filter: FilterType) => void;
}

export function TimeFilterTabs({ activeFilter, onChange }: TimeFilterTabsProps) {
  return (
    <View className="flex-row items-center justify-between mx-6 mt-4 p-1 bg-muted/50 rounded-full">
      {FILTERS.map((filter) => (
        <TouchableOpacity
          key={filter}
          onPress={() => onChange(filter)}
          className={`flex-1 items-center justify-center py-2 rounded-full ${
            activeFilter === filter ? 'bg-popover shadow-sm' : ''
          }`}
        >
          <Text
            className={`text-sm font-semibold ${
              activeFilter === filter ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {filter}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
