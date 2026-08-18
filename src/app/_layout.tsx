import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { BLEProvider } from '@/context/BLEContext';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { useAuthStore } from '@/services/authentication/authStore';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/utils/queryClient';
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
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(public)" />
          </Stack>
        </BLEProvider>
      </GluestackUIProvider>
    </QueryClientProvider>
  );
}
