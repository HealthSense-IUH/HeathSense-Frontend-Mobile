import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { safeRouter } from '@/utils/safeNavigation';
import { Bluetooth, HeartPulse } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';

export default function SmartHealthScreen() {
  return (
    <ScreenWrapper
      title="Phân tích nhịp tim"
      headerRight={
        <Pressable
          onPress={() => safeRouter.navigate("/(public)/scan")}
          className="h-10 w-10 rounded-full bg-primary/10 items-center justify-center active:opacity-75"
        >
          <Bluetooth color={THEME.colors.primary} size={20} />
        </Pressable>
      }
    >
      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {/* Banner Card - Styled like the user's "Energy Score" illustration */}
        <Pressable 
          onPress={() => {
            safeRouter.navigate("/afib-analysis-details");
          }}
          className="shadow-sm mb-6 active:opacity-90"
          style={{ borderRadius: 24 }}
        >
          <LinearGradient
            colors={[THEME.colors.primary, THEME.colors.primaryM3]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24 }}
            className="p-6 overflow-hidden"
          >
            <View className="flex-row justify-between items-start mb-12">
              <Text className="text-white font-bold text-lg">Phân tích Rung nhĩ</Text>

              {/* Flame/Heart Icon representing the 3D graphic in the illustration */}
              <View className="bg-white/20 p-3 rounded-full">
                <HeartPulse color="#FFFFFF" size={32} />
              </View>
            </View>

            <Text className="text-blue-50 text-sm leading-5 font-medium">
              Tìm hiểu và theo dõi rủi ro rung tâm nhĩ (AFib) thông qua các phép đo nhịp tim hàng ngày để bảo vệ tim mạch của bạn.
            </Text>
          </LinearGradient>
        </Pressable>

        {/* View History Button */}
        <Pressable
          onPress={() => safeRouter.navigate("/history")}
          className="bg-card rounded-3xl p-5 flex-row items-center shadow-sm mb-6 border border-border active:opacity-85"
        >
          <View className="h-12 w-12 bg-primary/10 rounded-full items-center justify-center mr-4">
            <HeartPulse color="#0F67FE" size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-foreground font-bold text-base mb-1">Lịch sử đo</Text>
            <Text className="text-muted-foreground text-sm">Xem lại các kết quả đo theo thời gian</Text>
          </View>
        </Pressable>
      </ScrollView>
    </ScreenWrapper>
  );
}
