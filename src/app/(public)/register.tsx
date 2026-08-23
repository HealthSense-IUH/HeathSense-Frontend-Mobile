import React from 'react';
import { Alert, KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/services/authentication/authStore';
import { RegisterForm } from '@/components/features/auth/RegisterForm';
import { RegisterRequest } from '@/types/authentication';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();

  const handleRegister = async (data: RegisterRequest) => {
    clearError();
    try {
      await register(data);
      Alert.alert(
        'Đăng ký thành công!',
        'Tài khoản của bạn đã được khởi tạo. Vui lòng đăng nhập để bắt đầu trải nghiệm.',
        [
          {
            text: 'Đăng nhập ngay',
            onPress: () => router.replace('/(public)/login' as any),
          },
        ]
      );
    } catch (err: any) {
      console.warn('[RegisterScreen] Register error:', err.message);
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
          <View className="items-center mb-6">
            <Text className="text-3xl font-extrabold text-primary tracking-tight">
              Health<Text className="text-foreground">Sense</Text>
            </Text>
            <Text className="text-xs text-muted-foreground mt-1">
              Tạo tài khoản mới để kết nối và quản lý dữ liệu sức khỏe
            </Text>
          </View>

          {/* RegisterForm component */}
          <RegisterForm
            onSubmit={handleRegister}
            isLoading={isLoading}
            error={error}
            onNavigateToLogin={() => router.replace('/(public)/login' as any)}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
