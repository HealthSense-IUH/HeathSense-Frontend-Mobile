import React from 'react';
import { View, Text } from 'react-native';

const LEGEND_ITEMS = [
  { label: 'Không có bất thường', color: '#10B981', ringColor: '#D1FAE5' },
  { label: 'Không rõ ràng', color: '#94A3B8', ringColor: '#E2E8F0' },
  { label: 'Nghi ngờ rung tâm nhĩ', color: '#F59E0B', ringColor: '#FEF3C7' },
  { label: 'Nguy cơ rung tâm nhĩ', color: '#EF4444', ringColor: '#FEE2E2' },
];

export function ChartLegend() {
  return (
    <View className="mt-6 pt-4 border-t border-slate-100 flex-row flex-wrap justify-between">
      {LEGEND_ITEMS.map((item) => (
        <View key={item.label} className="flex-row items-center w-[48%] mb-2.5">
          <View
            className="w-2.5 h-2.5 rounded-full mr-2 items-center justify-center border-2"
            style={{
              backgroundColor: item.color,
              borderColor: item.ringColor,
            }}
          />
          <Text className="text-[12px] font-medium text-slate-700">{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

