import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface PeriodSelectorProps {
  year: number;
  monthText: string;
  onPrev: () => void;
  onNext: () => void;
  disableNext?: boolean;
}

export function PeriodSelector({ monthText, onPrev, onNext, disableNext = false }: PeriodSelectorProps) {
  const { t } = useTranslation('health');
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
          aria-label={t('analysis.period.prevAria')}
        >
          <ChevronLeft color="#0D6EFD" size={16} strokeWidth={2.5} />
        </Pressable>

        <View className="flex-row items-center px-3">
          <Text className="text-sm font-bold text-slate-800">{monthText}</Text>
        </View>

        <Pressable
          onPress={onNext}
          disabled={disableNext}
          className={`w-8 h-8 rounded-full items-center justify-center ${
            disableNext ? 'bg-slate-100 opacity-40' : 'bg-blue-50/90 active:opacity-75'
          }`}
          aria-label={t('analysis.period.nextAria')}
        >
          <ChevronRight color={disableNext ? '#94A3B8' : '#0D6EFD'} size={16} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

