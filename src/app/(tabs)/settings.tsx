import React from 'react';
import { ScrollView, Text, TouchableOpacity, View, Animated } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/services/authentication/authStore';
import { useLogoutMutation } from '@/hooks/mutations/useAuthMutations';
import { useBLE } from '@/context/BLEContext';
import { LogoutButton } from '@/components/features/auth/LogoutButton';
import { Activity, Battery, Bluetooth, Info, Radio, Shield, Trash2, Watch } from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogoutMutation();
  const { knownDevice, connectedDevice, forgetDevice, batteryLevel } = useBLE();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.replace('/(public)/login' as any);
  };

  return (
    <ScreenWrapper 
      title="Cài đặt" 
      description="Quản lý tài khoản, kết nối"
    >
      <View className="px-6 mt-6">
        {/* Bluetooth Device Management Section */}
        <View className="bg-card border border-border rounded-3xl p-5 shadow-sm mb-6">
          <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
            Quản lý kết nối Bluetooth (BLE)
          </Text>

          <View className="flex-row items-center justify-between mb-4 bg-background p-4 rounded-2xl border border-border">
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-11 h-11 bg-primary/10 rounded-xl items-center justify-center mr-3">
                <Watch size={22} color="#0F67FE" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                  {knownDevice ? knownDevice.name || 'HuyWatch Device' : 'Chưa ghép đôi thiết bị'}
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
                  {connectedDevice ? 'Trạng thái: Đã kết nối' : knownDevice ? 'Trạng thái: Chưa kết nối' : 'Nhấn nút bên dưới để quét'}
                </Text>
              </View>
            </View>
            {connectedDevice && batteryLevel !== null && (
              <View className="flex-row items-center bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <Battery color="#10B981" size={14} className="mr-1" />
                <Text className="text-xs font-bold text-emerald-600">{batteryLevel}%</Text>
              </View>
            )}
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push('/(public)/scan' as any)}
              className="flex-1 bg-primary py-3 px-4 rounded-2xl flex-row items-center justify-center active:opacity-80"
            >
              <Radio color="#FFFFFF" size={16} className="mr-2" />
              <Text className="text-xs font-bold text-white">
                {knownDevice ? 'Quét & Đổi thiết bị' : 'Tìm & Kết nối thiết bị'}
              </Text>
            </TouchableOpacity>

            {knownDevice && (
              <TouchableOpacity
                onPress={() => void forgetDevice()}
                className="bg-destructive/10 border border-destructive/20 py-3 px-4 rounded-2xl flex-row items-center justify-center active:opacity-80"
              >
                <Trash2 color="#DA1E2E" size={16} className="mr-1.5" />
                <Text className="text-xs font-bold text-destructive">Hủy ghép đôi</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* App Information Section */}
        <View className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4 mb-6">
          <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Thông tin hệ thống
          </Text>

          <View className="flex-row items-center py-2 border-b border-border/40">
            <View className="w-9 h-9 bg-primary/10 rounded-xl items-center justify-center mr-3">
              <Activity size={18} color="#0F67FE" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">Ứng dụng HealthSense</Text>
              <Text className="text-xs text-muted-foreground">Phiên bản 1.0.0 (Expo SDK 57)</Text>
            </View>
          </View>

          <View className="flex-row items-center py-2 border-b border-border/40">
            <View className="w-9 h-9 bg-secondary/60 rounded-xl items-center justify-center mr-3">
              <Shield size={18} color="#0048CE" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">Bảo mật Token</Text>
              <Text className="text-xs text-muted-foreground">Expo SecureStore (KeyStore/Keychain)</Text>
            </View>
          </View>

          <View className="flex-row items-center py-2">
            <View className="w-9 h-9 bg-accent/20 rounded-xl items-center justify-center mr-3">
              <Info size={18} color="#6EC522" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">Core Service Backend</Text>
              <Text className="text-xs text-muted-foreground">Spring Boot Microservices & Redis</Text>
            </View>
          </View>
        </View>

        {/* Logout Profile Card & Button */}
        <View className="mb-6">
          <LogoutButton user={user} onLogout={handleLogout} isLoading={logoutMutation.isPending} />
        </View>
      </View>
    </ScreenWrapper>
  );
}
