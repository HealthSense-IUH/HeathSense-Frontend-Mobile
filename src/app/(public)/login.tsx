import React from 'react';
import { KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/services/authentication/authStore';
import { useBleStore } from '@/services/ble-management/bleStore';
import { LoginForm } from '@/components/features/auth/LoginForm';
import { LoginRequest } from '@/types/authentication';

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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center px-4 py-6 w-full my-auto">
          {/* Brand Header */}
          <View className="items-center mb-8">
            <Text className="text-3xl font-extrabold text-primary tracking-tight">
              Health<Text className="text-foreground">Sense</Text>
            </Text>
            <Text className="text-xs text-muted-foreground mt-1">
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
    </KeyboardAvoidingView>
  );
}
