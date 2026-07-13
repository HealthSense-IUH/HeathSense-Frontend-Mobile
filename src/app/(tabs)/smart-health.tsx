import { View, Text, ScrollView } from 'react-native';
import { AFibScreeningCard } from '@/components/features/health/AFibScreeningCard';
import { SleepAnalysisCard } from '@/components/features/health/SleepAnalysisCard';
import { ConsultationBanner } from '@/components/features/health/ConsultationBanner';

export default function SmartHealthScreen() {
  return (
    <ScrollView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-16 pb-6 bg-card rounded-b-3xl shadow-sm">
        <Text className="text-2xl font-bold text-foreground">Sức khoẻ thông minh</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Phân tích chuyên sâu từ dữ liệu cơ thể của bạn
        </Text>
      </View>

      <View className="px-6 mt-6">
        
        {/* AFib Section */}
        <AFibScreeningCard />

        {/* Sleep Analysis Section */}
        <SleepAnalysisCard />

        {/* Professional Consultation */}
        <ConsultationBanner />
        
      </View>
    </ScrollView>
  );
}
