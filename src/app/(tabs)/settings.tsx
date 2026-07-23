import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/services/authentication/authStore';
import { LogoutButton } from '@/components/features/auth/LogoutButton';
import { Activity, Info, Shield } from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(public)/login' as any);
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Header */}
      <View className="mb-6 pt-4">
        <Text className="text-2xl font-extrabold text-foreground">Cài đặt & Tài khoản</Text>
        <Text className="text-xs text-muted-foreground mt-1">
          Quản lý tài khoản, kết nối và ứng dụng HealthSense
        </Text>
      </View>

      {/* Logout Profile Card & Button */}
      <View className="mb-6">
        <LogoutButton user={user} onLogout={handleLogout} isLoading={isLoading} />
      </View>

      {/* App Information Section */}
      <View className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
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
    </ScrollView>
  );
}
