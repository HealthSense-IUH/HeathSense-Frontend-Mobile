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
              <Stack.Screen name="history" getId={() => 'history'} />
              <Stack.Screen
                name="history-records"
                getId={({ params }) => `history-records-${(params as any)?.date || 'default'}`}
              />
              <Stack.Screen name="afib-analysis-details" getId={() => 'afib-analysis-details'} />
              <Stack.Screen name="afib-measure" getId={() => 'afib-measure'} />
              <Stack.Screen name="consultation/create-request" getId={() => 'consultation-create-request'} />
              <Stack.Screen
                name="consultation/chat/[sessionId]"
                getId={({ params }) => `consultation-chat-${(params as any)?.sessionId || 'default'}`}
              />
              <Stack.Screen name="workout/index" getId={() => 'workout-index'} />
              <Stack.Screen name="workout/catalog" getId={() => 'workout-catalog'} />
              <Stack.Screen name="workout/history" getId={() => 'workout-history'} />
              <Stack.Screen name="workout/select" getId={() => 'workout-select'} />
              <Stack.Screen name="workout/create-routine" getId={() => 'workout-create-routine'} />
              <Stack.Screen
                name="workout/pre-workout"
                getId={({ params }) => `workout-pre-${(params as any)?.id || 'default'}`}
              />
              <Stack.Screen name="workout/active" getId={() => 'workout-active'} />
              <Stack.Screen name="workout/summary" getId={() => 'workout-summary'} />
            </Stack>
          </View>
        </BLEProvider>
      </GluestackUIProvider>
    </QueryClientProvider>
  );
}
