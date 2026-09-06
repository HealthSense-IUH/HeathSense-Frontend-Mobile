import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { BLEProvider } from '@/context/BLEContext';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { useAuthStore } from '@/services/authentication/authStore';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/utils/queryClient';
import { THEME } from '@/constants/theme';
import '@/services/notifee-management/notifeeForegroundService';
import '@/global.css';

export default function RootLayout() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <GluestackUIProvider mode="system">
        <BLEProvider>
          <View style={{ flex: 1, backgroundColor: THEME.colors.canvas }}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: THEME.colors.canvas },
                animation: 'slide_from_bottom' // Native smooth slide transition
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(public)" />
            </Stack>
          </View>
        </BLEProvider>
      </GluestackUIProvider>
    </QueryClientProvider>
  );
}
