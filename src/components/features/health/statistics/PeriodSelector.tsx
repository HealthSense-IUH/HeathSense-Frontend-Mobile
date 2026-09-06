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
    <View className="flex justify-center pt-3 pb-2 mx-5">
      <View className="bg-white px-3 py-1.5 rounded-full shadow-sm flex-row items-center justify-center space-x-3 border border-slate-100 self-center">
        <Pressable onPress={onPrev} className="w-8 h-8 rounded-full bg-medical-50 flex items-center justify-center active:opacity-80">
          <ChevronLeft color="#0D6EFD" size={16} strokeWidth={2.5} />
        </Pressable>
        
        <View className="flex-row items-center space-x-1.5 px-2">
          <Text className="text-sm font-bold text-slate-800 mr-1">{monthText}</Text>
          <ChevronDown color="#64748B" size={14} strokeWidth={2.5} />
        </View>

        <Pressable onPress={onNext} className="w-8 h-8 rounded-full bg-medical-50 flex items-center justify-center active:opacity-80">
          <ChevronRight color="#0D6EFD" size={16} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}
