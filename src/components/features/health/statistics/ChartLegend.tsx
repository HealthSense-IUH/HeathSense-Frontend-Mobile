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
    <View className="mt-6 pt-4 border-t border-slate-100 flex-row flex-wrap justify-between">
      {LEGEND_ITEMS.map((item) => (
        <View key={item.label} className="flex-row items-center w-[48%] mb-2.5">
          <View
            className="w-2.5 h-2.5 rounded-full mr-2 border-2"
            style={{ backgroundColor: item.color, borderColor: `${item.color}33` }}
          />
          <Text className="text-[12px] font-medium text-slate-700">{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
