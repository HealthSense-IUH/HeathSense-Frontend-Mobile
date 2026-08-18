import React from 'react';
import { View, Text } from 'react-native';

export const STATUS_COLORS = {
  NORMAL: '#6EC522', // status-normal
  UNCERTAIN: '#9EA7B8', // status-uncertain
  AFIB_SUSPECTED: '#D97706', // status-afib-suspected
  AFIB_RISK: '#750E13', // status-afib
};

const LEGEND_ITEMS = [
  { label: 'Không có bất thường', color: STATUS_COLORS.NORMAL },
  { label: 'Không rõ ràng', color: STATUS_COLORS.UNCERTAIN },
  { label: 'Nghi ngờ rung tâm nhĩ', color: STATUS_COLORS.AFIB_SUSPECTED },
  { label: 'Nguy cơ rung tâm nhĩ', color: STATUS_COLORS.AFIB_RISK },
];

export function ChartLegend() {
  return (
    <View className="flex-row flex-wrap px-4 py-4">
      {LEGEND_ITEMS.map((item, index) => (
        <View key={index} className="flex-row items-center w-[48%] mb-3">
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
