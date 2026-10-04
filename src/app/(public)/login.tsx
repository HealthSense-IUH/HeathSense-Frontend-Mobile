import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { ArrowLeft, HeartPulse } from 'lucide-react-native';
import { useAuthStore } from '@/services/authentication/authStore';
import { useBleStore } from '@/services/ble-management/bleStore';
import { LoginForm } from '@/components/features/auth/LoginForm';
import { LoginRequest } from '@/types/authentication';

const BRAND = '#2B6CB0';
const CANVAS = '#EFF3F6';

/** Hai quầng sáng mờ phía sau thẻ (thiết kế dùng blur; ở đây là gradient tròn nhạt dần). */
function AmbientGlow() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Svg width={300} height={300} style={{ position: 'absolute', top: -110, right: -110 }}>
        <Defs>
          <RadialGradient id="glowBlue" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={BRAND} stopOpacity={0.16} />
            <Stop offset="1" stopColor={BRAND} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={150} cy={150} r={150} fill="url(#glowBlue)" />
      </Svg>
      <Svg width={260} height={260} style={{ position: 'absolute', top: '30%', left: -130 }}>
        <Defs>
          <RadialGradient id="glowCyan" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#ACEDFF" stopOpacity={0.5} />
            <Stop offset="1" stopColor="#ACEDFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={130} cy={130} r={130} fill="url(#glowCyan)" />
      </Svg>
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const canGoBack = router.canGoBack();

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
    <View style={{ flex: 1, backgroundColor: CANVAS }}>
      <StatusBar style="dark" />
      <AmbientGlow />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header: nút quay lại (khi có màn trước) + logo */}
            <View className="flex-row items-center justify-between pt-2 pb-4">
              {canGoBack ? (
                <Pressable
                  onPress={() => router.back()}
                  accessibilityLabel="Quay lại"
                  className="w-10 h-10 rounded-full bg-white items-center justify-center active:opacity-80"
                  style={{ boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)' }}
                >
                  <ArrowLeft size={22} color="#0B1C30" />
                </Pressable>
              ) : (
                <View className="w-10 h-10" />
              )}

              <View
                className="flex-row items-center rounded-full px-2 py-1"
                style={{ gap: 6, backgroundColor: 'rgba(255, 255, 255, 0.8)', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)' }}
              >
                <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: BRAND }}>
                  <HeartPulse size={15} color="#FFFFFF" />
                </View>
                <Text className="text-lg font-semibold tracking-tight" style={{ color: '#0B1C30' }}>
                  Health<Text className="font-bold" style={{ color: BRAND }}>Sense</Text>
                </Text>
              </View>

              <View className="w-10 h-10" />
            </View>

            {/* Thẻ đăng nhập ở giữa phần còn lại của màn hình */}
            <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 16 }}>
              <LoginForm
                onSubmit={handleLogin}
                isLoading={isLoading}
                error={error}
                onNavigateToRegister={() => router.push('/(public)/register' as any)}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
