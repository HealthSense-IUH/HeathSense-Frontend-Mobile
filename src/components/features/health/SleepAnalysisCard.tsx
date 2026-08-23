import { View, Text, Pressable } from 'react-native';
import { Moon, ChevronRight } from 'lucide-react-native';

export function SleepAnalysisCard() {
  return (
    <View className="bg-card rounded-3xl p-5 shadow-sm border border-asklepios-20 mb-6">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className="h-10 w-10 rounded-full bg-aceso-10 items-center justify-center mr-3">
            <Moon color="#8A3FFC" size={20} />
          </View>
          <Text className="text-lg font-bold text-foreground">Phân tích Giấc ngủ</Text>
        </View>
        <Pressable hitSlop={8} className="active:opacity-70">
          <ChevronRight color="#9EA7B8" size={24} />
        </Pressable>
      </View>
      
      <View className="flex-row justify-between mb-4">
        <View>
          <Text className="text-sm text-muted-foreground mb-1">Thời gian ngủ</Text>
          <Text className="text-2xl font-bold text-foreground">7h 15m</Text>
        </View>
        <View>
          <Text className="text-sm text-muted-foreground mb-1">Chất lượng</Text>
          <Text className="text-2xl font-bold text-aceso-70">Tốt</Text>
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
          <Text className="text-xs text-muted-foreground">Ngủ sâu</Text>
        </View>
        <View className="flex-row items-center">
          <View className="h-2 w-2 rounded-full bg-aceso-20 mr-1" />
          <Text className="text-xs text-muted-foreground">Ngủ nông</Text>
        </View>
        <View className="flex-row items-center">
          <View className="h-2 w-2 rounded-full bg-helios-30 mr-1" />
          <Text className="text-xs text-muted-foreground">Thức</Text>
        </View>
      </View>
    </View>
  );
}
