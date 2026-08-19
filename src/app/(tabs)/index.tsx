import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Activity, Footprints, Flame, Bell, Bluetooth, Radio, Battery } from 'lucide-react-native';
import { useBleStore } from '@/services/ble-management/bleStore';
import { useAuthStore } from '@/services/authentication/authStore';
import { AFibScreeningCard } from '@/components/features/health/AFibScreeningCard';

export default function HomeScreen() {
  const router = useRouter();
  const currentBPM = useBleStore(state => state.currentBPM);
  const currentSpO2 = useBleStore(state => state.currentSpO2);
  const connectedDevice = useBleStore(state => state.connectedDeviceId);
  const knownDevice = useBleStore(state => state.knownDevice);
  const batteryLevel = useBleStore(state => state.batteryLevel);
  const { user } = useAuthStore();

  const isConnected = Boolean(connectedDevice);

  return (
    <ScrollView 
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Header */}
      <View className="px-6 pt-16 pb-6 flex-row justify-between items-center bg-card rounded-b-3xl shadow-sm">
        <View className="flex-row items-center">
          <View className="h-12 w-12 rounded-full bg-primary/10 items-center justify-center mr-4">
            <Text className="text-primary font-extrabold text-lg">
              {user?.fullName?.charAt(0).toUpperCase() || 'H'}
            </Text>
          </View>
          <View>
            <Text className="text-xs font-semibold text-primary">HealthSense Mobile</Text>
            <Text className="text-lg font-bold text-foreground">
              {user?.fullName ? `Xin chào, ${user.fullName}` : 'Chào mừng trở lại'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(public)/scan" as any)}
          className="h-10 w-10 rounded-full bg-primary/10 items-center justify-center"
        >
          <Bluetooth color="#0F67FE" size={20} />
        </TouchableOpacity>
      </View>

      <View className="px-6 mt-6">
        {/* Interactive BLE Connection Status Card */}
        <TouchableOpacity
          onPress={() => router.push("/(public)/scan" as any)}
          activeOpacity={0.85}
          className={`rounded-3xl p-5 border shadow-sm flex-row items-center justify-between mb-6 ${
            isConnected
              ? 'bg-accent/10 border-accent/30'
              : knownDevice
              ? 'bg-primary/10 border-primary/20'
              : 'bg-destructive/10 border-destructive/20'
          }`}
        >
          <View className="flex-row items-center flex-1 mr-3">
            <View
              className={`h-12 w-12 rounded-2xl items-center justify-center mr-3.5 ${
                isConnected ? 'bg-accent/20' : 'bg-primary/20'
              }`}
            >
              <Bluetooth color={isConnected ? '#55A316' : '#0F67FE'} size={24} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Kết nối BLE
                </Text>
                {isConnected && batteryLevel !== null && (
                  <View className="flex-row items-center bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <Battery color="#10B981" size={13} className="mr-1" />
                    <Text className="text-[11px] font-bold text-emerald-600">{batteryLevel}%</Text>
                  </View>
                )}
              </View>
              <Text className="text-base font-bold text-foreground mt-0.5" numberOfLines={1}>
                {isConnected
                  ? `HuyWatch: Đã kết nối`
                  : knownDevice
                  ? `Đang kết nối lại...`
                  : `Chưa ghép đôi thiết bị`}
              </Text>
              <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
                {isConnected
                  ? 'Đang nhận dữ liệu nhịp tim & SpO2'
                  : 'Chạm vào đây để quét & kết nối đồng hồ'}
              </Text>
            </View>
          </View>

          <View className="bg-primary px-3.5 py-2 rounded-xl flex-row items-center">
            <Radio color="#FFFFFF" size={14} className="mr-1.5" />
            <Text className="text-xs font-bold text-white">
              {isConnected ? 'Đổi' : 'Kết nối'}
            </Text>
          </View>
        </TouchableOpacity>

        <Text className="text-lg font-bold text-foreground mb-4">Chỉ số hôm nay</Text>

        {/* Quick Stats Grid */}
        <View className="flex-row flex-wrap justify-between">
          {/* BPM */}
          <View className="w-[48%] bg-card rounded-2xl p-4 shadow-sm border border-border mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <View className="h-10 w-10 rounded-full bg-destructive/10 items-center justify-center">
                <Heart color="#DA1E2E" size={20} />
              </View>
              <Text className="text-xs font-semibold text-destructive">BPM</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">{currentBPM > 0 ? currentBPM : '--'}</Text>
            <Text className="text-xs text-muted-foreground mt-1">Nhịp tim trung bình</Text>
          </View>

          {/* SpO2 */}
          <View className="w-[48%] bg-card rounded-2xl p-4 shadow-sm border border-border mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <View className="h-10 w-10 rounded-full bg-primary/10 items-center justify-center">
                <Activity color="#0F67FE" size={20} />
              </View>
              <Text className="text-xs font-semibold text-primary">%</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">{currentSpO2 > 0 ? currentSpO2 : '--'}</Text>
            <Text className="text-xs text-muted-foreground mt-1">Nồng độ Oxy (SpO2)</Text>
          </View>

          {/* Steps */}
          <View className="w-[48%] bg-card rounded-2xl p-4 shadow-sm border border-border mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <View className="h-10 w-10 rounded-full bg-accent/10 items-center justify-center">
                <Footprints color="#55A316" size={20} />
              </View>
              <Text className="text-xs font-semibold text-accent">Bước</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">7,200</Text>
            <Text className="text-xs text-muted-foreground mt-1">Số bước chân</Text>
          </View>

          {/* Calories */}
          <View className="w-[48%] bg-card rounded-2xl p-4 shadow-sm border border-border mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <View className="h-10 w-10 rounded-full bg-amber-500/10 items-center justify-center">
                <Flame color="#F59E0B" size={20} />
              </View>
              <Text className="text-xs font-semibold text-amber-500">Kcal</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">450</Text>
            <Text className="text-xs text-muted-foreground mt-1">Calo tiêu thụ</Text>
          </View>
        </View>
        
        {/* AFib Screening Section */}
        <Text className="text-lg font-bold text-foreground mb-4 mt-2">Tầm soát Rung nhĩ (AFib)</Text>
        <AFibScreeningCard />
        <View className="h-6" />
      </View>
    </ScrollView>
  );
}
