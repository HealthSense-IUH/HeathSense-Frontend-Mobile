import React from 'react';
import { View, Text } from 'react-native';
import { STATUS_COLORS } from '@/constants/statusColors';

const LEGEND_ITEMS = [
  { label: 'Không có bất thường', color: STATUS_COLORS.NORMAL },
  { label: 'Không rõ ràng', color: STATUS_COLORS.UNCERTAIN },
  { label: 'Nghi ngờ rung tâm nhĩ', color: STATUS_COLORS.AFIB_SUSPECTED },
  { label: 'Nguy cơ rung tâm nhĩ', color: STATUS_COLORS.AFIB_RISK },
];

export function ChartLegend() {
  return (
    <View className="flex-row flex-wrap px-4 py-4">
      {LEGEND_ITEMS.map((item) => (
        <View key={item.label} className="flex-row items-center w-[48%] mb-3">
          <View
            className="w-2 h-2 rounded-full mr-2"
            style={{ backgroundColor: item.color }}
          />
          <Text className="text-xs text-muted-foreground flex-1">{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
