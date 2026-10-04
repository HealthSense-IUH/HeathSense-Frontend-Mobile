import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

const LEGEND_ITEMS = [
  { key: 'normal', color: '#10B981', ringColor: '#D1FAE5' },
  { key: 'uncertain', color: '#94A3B8', ringColor: '#E2E8F0' },
  { key: 'afibSuspected', color: '#F59E0B', ringColor: '#FEF3C7' },
  { key: 'afibRisk', color: '#EF4444', ringColor: '#FEE2E2' },
] as const;

export function ChartLegend() {
  const { t } = useTranslation('health');
  return (
    <View className="mt-6 pt-4 border-t border-slate-100 flex-row flex-wrap justify-between">
      {LEGEND_ITEMS.map((item) => (
        <View key={item.key} className="flex-row items-center w-[48%] mb-2.5">
          <View
            className="w-2.5 h-2.5 rounded-full mr-2 items-center justify-center border-2"
            style={{
              backgroundColor: item.color,
              borderColor: item.ringColor,
            }}
          />
          <Text className="text-[12px] font-medium text-slate-700">{t(`analysis.legend.${item.key}`)}</Text>
        </View>
      ))}
    </View>
  );
}

