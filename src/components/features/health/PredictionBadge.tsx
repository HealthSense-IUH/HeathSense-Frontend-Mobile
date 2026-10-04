import React from 'react';
import { Text, View } from 'react-native';
import type { PredictionMeta } from '@/constants/healthRecords';

interface PredictionBadgeProps {
  meta: PredictionMeta;
  /** Hiện dải xác suất bên cạnh nhãn (dùng ở chú thích) */
  withRange?: boolean;
  size?: 'sm' | 'md';
}

/** Huy hiệu kết luận AI: màu theo nhãn, cùng bảng màu với web. */
export function PredictionBadge({ meta, withRange = false, size = 'md' }: PredictionBadgeProps) {
  return (
    <View
      className={`flex-row items-center rounded-full border ${size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1'}`}
      style={{ backgroundColor: meta.bg, borderColor: meta.border, gap: 6 }}
    >
      <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
      <Text className={`font-bold ${size === 'sm' ? 'text-[11px]' : 'text-xs'}`} style={{ color: meta.text }}>
        {meta.label}
      </Text>
      {withRange ? (
        <Text className="text-[11px]" style={{ color: meta.text, opacity: 0.75 }}>
          ({meta.rangeText})
        </Text>
      ) : null}
    </View>
  );
}
