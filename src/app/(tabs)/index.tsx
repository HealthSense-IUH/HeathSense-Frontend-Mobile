import { View, Text, ScrollView, Image } from 'react-native';
import { Heart, Activity, Footprints, Flame, Bell } from 'lucide-react-native';
import { useBLE } from '@/context/BLEContext';

export default function HomeScreen() {
  const { currentBPM, currentSpO2, connectedDevice } = useBLE();

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-16 pb-6 flex-row justify-between items-center bg-card rounded-b-3xl shadow-sm">
        <View className="flex-row items-center">
          <View className="h-12 w-12 rounded-full bg-zoi-20 items-center justify-center mr-4">
            {/* Placeholder for avatar */}
            <Text className="text-zoi-80 font-bold text-lg">U</Text>
          </View>
          <View>
            <Text className="text-sm font-semibold text-primary">HealthSense</Text>
            <Text className="text-xl font-bold text-foreground">
              {connectedDevice ? "Đã kết nối thiết bị" : "Chào mừng trở lại"}
            </Text>
          </View>
        </View>
        <View className="h-10 w-10 rounded-full bg-asklepios-10 items-center justify-center">
          <Bell color="#0F67FE" size={20} />
        </View>
      </View>

      <View className="px-6 mt-6">
        {/* Main Status */}
        <View className="bg-zoi-10 rounded-3xl p-6 shadow-sm border border-zoi-20 flex-row items-center mb-6">
          <View className="h-12 w-12 rounded-full bg-zoi-20 items-center justify-center mr-4">
            <Heart color="#55A316" size={24} fill="#55A316" />
          </View>
          <View>
            <Text className="text-sm text-zoi-70 font-medium">Trạng thái thiết bị</Text>
            <Text className="text-xl font-bold text-zoi-90 mt-1">
              {connectedDevice ? "Đang theo dõi sức khoẻ..." : "Chưa kết nối thiết bị"}
            </Text>
          </View>
        </View>

        <Text className="text-lg font-bold text-foreground mb-4">Chỉ số hôm nay</Text>

        {/* Quick Stats Grid */}
        <View className="flex-row flex-wrap justify-between">
          
          {/* BPM */}
          <View className="w-[48%] bg-card rounded-2xl p-4 shadow-sm border border-asklepios-20 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <View className="h-10 w-10 rounded-full bg-hygieia-10 items-center justify-center">
                <Heart color="#DA1E2E" size={20} />
              </View>
              <Text className="text-xs font-semibold text-hygieia-60">BPM</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">{currentBPM > 0 ? currentBPM : "--"}</Text>
            <Text className="text-xs text-muted-foreground mt-1">Nhịp tim</Text>
          </View>

          {/* SpO2 */}
          <View className="w-[48%] bg-card rounded-2xl p-4 shadow-sm border border-asklepios-20 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <View className="h-10 w-10 rounded-full bg-therapeia-10 items-center justify-center">
                <Activity color="#0F67FE" size={20} />
              </View>
              <Text className="text-xs font-semibold text-therapeia-60">%</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">{currentSpO2 > 0 ? currentSpO2 : "--"}</Text>
            <Text className="text-xs text-muted-foreground mt-1">Nồng độ SpO2</Text>
          </View>

          {/* Steps */}
          <View className="w-[48%] bg-card rounded-2xl p-4 shadow-sm border border-asklepios-20 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <View className="h-10 w-10 rounded-full bg-zoi-10 items-center justify-center">
                <Footprints color="#55A316" size={20} />
              </View>
              <Text className="text-xs font-semibold text-zoi-60">Bước</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">7,200</Text>
            <Text className="text-xs text-muted-foreground mt-1">Số bước chân</Text>
          </View>

          {/* Calories */}
          <View className="w-[48%] bg-card rounded-2xl p-4 shadow-sm border border-asklepios-20 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <View className="h-10 w-10 rounded-full bg-helios-10 items-center justify-center">
                <Flame color="#F59E0B" size={20} />
              </View>
              <Text className="text-xs font-semibold text-helios-60">Kcal</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">450</Text>
            <Text className="text-xs text-muted-foreground mt-1">Calo tiêu thụ</Text>
          </View>

        </View>
      </View>
    </ScrollView>
  );
}
