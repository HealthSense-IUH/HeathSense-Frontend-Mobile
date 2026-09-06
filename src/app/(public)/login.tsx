import React from 'react';
import { KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/services/authentication/authStore';
import { useBleStore } from '@/services/ble-management/bleStore';
import { LoginForm } from '@/components/features/auth/LoginForm';
import { LoginRequest } from '@/types/authentication';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async (data: LoginRequest) => {
    clearError();
    try {
      await login(data);
      // Kiểm tra nếu thiết bị BLE đã ghép đôi thì vào Tabs, chưa ghép đôi thì chuyển sang trang Dò tìm BLE Scan
      const knownDevice = useBleStore.getState().knownDevice;
      if (knownDevice) {
        router.replace('/(tabs)' as any);
      } else {
        router.replace('/(public)/scan' as any);
      }
    } catch (err: any) {
      console.warn('[LoginScreen] Login error:', err.message);
    }
  };

  return (
    <ScreenWrapper withKeyboardHandling>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        className="flex-1 px-5"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center py-6 w-full my-auto">
          {/* Brand Header */}
          <View className="items-center mb-8">
            <Text className="text-3xl font-extrabold tracking-tight text-medical-500">
              HealthSense
            </Text>
            <Text className="text-sm font-medium text-slate-500 max-w-[280px] text-center mt-1 leading-snug">
              Hệ thống theo dõi và chăm sóc sức khỏe thông minh
            </Text>
          </View>

          {/* LoginForm component */}
          <LoginForm
            onSubmit={handleLogin}
            isLoading={isLoading}
            error={error}
            onNavigateToRegister={() => router.push('/(public)/register' as any)}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
