import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface PeriodSelectorProps {
  year: number;
  monthText: string;
  onPrev: () => void;
  onNext: () => void;
}

export function PeriodSelector({ year, monthText, onPrev, onNext }: PeriodSelectorProps) {
  return (
    <View className="mt-6 mb-2 items-center">
      <View className="flex-row items-center justify-between w-full px-12 mb-2">
        <TouchableOpacity onPress={onPrev} className="p-2">
          <ChevronLeft color="#9EA7B8" size={24} />
        </TouchableOpacity>
        
        <View className="flex-row items-center">
          <Text className="text-foreground text-lg font-bold">{year}</Text>
          {/* A small down arrow icon could go here if it's a dropdown, but design just shows a triangle */}
          <View className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-muted-foreground ml-2" />
        </View>

        <TouchableOpacity onPress={onNext} className="p-2">
          <ChevronRight color="#9EA7B8" size={24} />
        </TouchableOpacity>
      </View>
      <Text className="text-muted-foreground text-base">{monthText}</Text>
    </View>
  );
}
