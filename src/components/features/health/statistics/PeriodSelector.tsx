import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react-native';

interface PeriodSelectorProps {
  year: number;
  monthText: string;
  onPrev: () => void;
  onNext: () => void;
}

export function PeriodSelector({ monthText, onPrev, onNext }: PeriodSelectorProps) {
  return (
    <View className="flex justify-center pt-2 pb-1 mx-5">
      <View
        className="bg-white px-3 py-1.5 rounded-full flex-row items-center justify-center border border-slate-100 self-center"
        style={{
          shadowColor: 'rgba(13, 110, 253, 0.06)',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 12,
          elevation: 2,
        }}
      >
        <Pressable
          onPress={onPrev}
          className="w-8 h-8 rounded-full bg-blue-50/90 items-center justify-center active:opacity-75"
          aria-label="Kỳ trước"
        >
          <ChevronLeft color="#0D6EFD" size={16} strokeWidth={2.5} />
        </Pressable>

        <View className="flex-row items-center px-3">
          <Text className="text-sm font-bold text-slate-800 mr-1.5">{monthText}</Text>
          <ChevronDown color="#64748B" size={14} strokeWidth={2.5} />
        </View>

        <Pressable
          onPress={onNext}
          className="w-8 h-8 rounded-full bg-blue-50/90 items-center justify-center active:opacity-75"
          aria-label="Kỳ tiếp theo"
        >
          <ChevronRight color="#0D6EFD" size={16} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

