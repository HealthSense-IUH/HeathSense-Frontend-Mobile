import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/services/authentication/authStore';
import { LoginForm } from '@/components/features/auth/LoginForm';
import { LoginRequest } from '@/types/authentication';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogin = async (data: LoginRequest) => {
    clearError();
    setSuccessMessage(null);
    try {
      await login(data);
      // Login successful -> Redirect to tabs
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      console.warn('[LoginScreen] Login error:', err.message);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      className="flex-1 bg-background"
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 justify-center items-center p-4 py-8">
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
  );
}
