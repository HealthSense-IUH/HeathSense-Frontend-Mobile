import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react-native';

interface PeriodSelectorProps {
  year: number;
  monthText: string;
  onPrev: () => void;
  onNext: () => void;
}

export function PeriodSelector({ year, monthText, onPrev, onNext }: PeriodSelectorProps) {
  return (
    <View className="mt-6 mb-2 items-center">
      <View className="flex-row items-center justify-between bg-card px-4 py-2 rounded-full shadow-sm border border-border min-w-[200px]">
        <TouchableOpacity onPress={onPrev} className="p-1.5 bg-primary/10 rounded-full">
          <ChevronLeft color="#0F67FE" size={18} />
        </TouchableOpacity>
        
        <View className="items-center flex-row px-4">
          <Text className="text-foreground text-sm font-bold mr-1">{monthText}</Text>
          <ChevronDown color="#5D6A85" size={14} />
        </View>

        <TouchableOpacity onPress={onNext} className="p-1.5 bg-primary/10 rounded-full">
          <ChevronRight color="#0F67FE" size={18} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
