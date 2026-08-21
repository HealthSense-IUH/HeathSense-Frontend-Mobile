import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Bluetooth, HeartPulse } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { LinearGradient } from 'expo-linear-gradient';

export default function SmartHealthScreen() {
  const router = useRouter();

  return (
    <ScreenWrapper
      title="Phân tích nhịp tim"
      headerRight={
        <TouchableOpacity
          onPress={() => router.push("/(public)/scan" as any)}
          className="h-10 w-10 rounded-full bg-primary/10 items-center justify-center"
        >
          <Bluetooth color="#0F67FE" size={20} />
        </TouchableOpacity>
      }
    >
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        {/* Banner Card - Styled like the user's "Energy Score" illustration */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => {
            setTimeout(() => {
              router.push("/afib-analysis-details");
            }, 50);
          }}
          className="shadow-sm mb-6"
          style={{ borderRadius: 24 }}
        >
          <LinearGradient
            colors={['#5A9EF2', '#2B7DF6']}
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
        </TouchableOpacity>

        {/* View History Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/history")}
          className="bg-card rounded-3xl p-5 flex-row items-center shadow-sm mb-6 border border-border"
        >
          <View className="h-12 w-12 bg-primary/10 rounded-full items-center justify-center mr-4">
            <HeartPulse color="#0F67FE" size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-foreground font-bold text-base mb-1">Lịch sử đo</Text>
            <Text className="text-muted-foreground text-sm">Xem lại các kết quả đo theo thời gian</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}
