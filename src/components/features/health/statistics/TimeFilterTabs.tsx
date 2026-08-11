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
    <View className="flex-row items-center justify-between mx-6 mt-4 p-1 bg-card rounded-2xl shadow-sm border border-border">
      {FILTERS.map((filter) => (
        <TouchableOpacity
          key={filter}
          onPress={() => onChange(filter)}
          className={`flex-1 items-center justify-center py-2.5 rounded-xl ${
            activeFilter === filter ? 'bg-primary/10' : 'bg-transparent'
          }`}
        >
          <Text
            className={`text-sm ${
              activeFilter === filter ? 'text-primary font-bold' : 'text-muted-foreground font-semibold'
            }`}
          >
            {filter}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
