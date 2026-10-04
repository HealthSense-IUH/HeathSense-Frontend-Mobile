import { View, Text, Pressable } from 'react-native';
import { Moon, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export function SleepAnalysisCard() {
  const { t } = useTranslation('health');
  return (
    <View className="bg-card rounded-3xl p-5 shadow-sm border border-asklepios-20 mb-6">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className="h-10 w-10 rounded-full bg-aceso-10 items-center justify-center mr-3">
            <Moon color="#8A3FFC" size={20} />
          </View>
          <Text className="text-lg font-bold text-foreground">{t('sleep.title')}</Text>
        </View>
        <Pressable hitSlop={8} className="active:opacity-70">
          <ChevronRight color="#9EA7B8" size={24} />
        </Pressable>
      </View>

      <View className="flex-row justify-between mb-4">
        <View>
          <Text className="text-sm text-muted-foreground mb-1">{t('sleep.duration')}</Text>
          <Text className="text-2xl font-bold text-foreground">7h 15m</Text>
        </View>
        <View>
          <Text className="text-sm text-muted-foreground mb-1">{t('sleep.quality')}</Text>
          <Text className="text-2xl font-bold text-aceso-70">{t('sleep.good')}</Text>
        </View>
      </View>

      {/* Simple Mock Progress Bar */}
      <View className="h-2 w-full bg-asklepios-10 rounded-full overflow-hidden flex-row">
        <View className="h-full bg-aceso-50 w-[65%]" />
        <View className="h-full bg-aceso-20 w-[20%]" />
        <View className="h-full bg-helios-30 w-[15%]" />
      </View>
      <View className="flex-row justify-between mt-2">
        <View className="flex-row items-center">
          <View className="h-2 w-2 rounded-full bg-aceso-50 mr-1" />
          <Text className="text-xs text-muted-foreground">{t('sleep.deep')}</Text>
        </View>
        <View className="flex-row items-center">
          <View className="h-2 w-2 rounded-full bg-aceso-20 mr-1" />
          <Text className="text-xs text-muted-foreground">{t('sleep.light')}</Text>
        </View>
        <View className="flex-row items-center">
          <View className="h-2 w-2 rounded-full bg-helios-30 mr-1" />
          <Text className="text-xs text-muted-foreground">{t('sleep.awake')}</Text>
        </View>
      </View>
    </View>
  );
}
