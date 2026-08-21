import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock, Activity, ShieldAlert, AlertCircle, Heart } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useRecordsByDate } from '@/hooks/useHealthHistory';

const STATUS_COLORS = {
  NORMAL: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: Heart, iconColor: '#10B981', label: 'Bình thường' },
  AFIB: { bg: 'bg-rose-50', text: 'text-rose-600', icon: ShieldAlert, iconColor: '#E11D48', label: 'Phát hiện AFib' },
  AFIB_SUSPECTED: { bg: 'bg-amber-50', text: 'text-amber-600', icon: AlertCircle, iconColor: '#D97706', label: 'Nghi ngờ AFib' },
  UNCERTAIN: { bg: 'bg-gray-100', text: 'text-gray-600', icon: Activity, iconColor: '#6B7280', label: 'Không chắc chắn' },
};

export default function HistoryRecordsScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();

  // Ensure date has a fallback if undefined (though it shouldn't be)
  const queryDate = date || new Date().toISOString().split('T')[0];
  
  const { data: records, isLoading, error } = useRecordsByDate(queryDate, 'Asia/Ho_Chi_Minh');

  // Format date for display: YYYY-MM-DD to DD/MM/YYYY
  const displayDate = queryDate.split('-').reverse().join('/');

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="py-20 justify-center items-center">
          <ActivityIndicator size="large" color="#0F67FE" />
          <Text className="mt-4 text-muted-foreground">Đang tải dữ liệu đo...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className="py-20 justify-center items-center">
          <Text className="text-destructive font-bold">Lỗi tải dữ liệu. Vui lòng thử lại.</Text>
        </View>
      );
    }

    if (!records || records.length === 0) {
      return (
        <View className="py-20 justify-center items-center">
          <Activity color="#9EA7B8" size={48} className="mb-4" />
          <Text className="text-muted-foreground font-semibold">Không có dữ liệu đo trong ngày này</Text>
        </View>
      );
    }

    return (
      <View className="pb-8">
        <Text className="text-lg font-bold text-foreground mb-4">Kết quả đo ngày {displayDate}</Text>
        
        {records.map((record, index) => {
          const statusInfo = STATUS_COLORS[record.predictionLabel as keyof typeof STATUS_COLORS] || STATUS_COLORS.UNCERTAIN;
          const Icon = statusInfo.icon;
          const confidencePercent = record.confidence ? Math.round(record.confidence * 100) : 0;

          return (
            <View key={record.id} className="bg-card rounded-2xl p-4 mb-4 border border-border shadow-sm">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center">
                  <Clock color="#64748B" size={16} />
                  <Text className="text-muted-foreground ml-2 font-medium">{formatTime(record.createdAt)}</Text>
                </View>
                <View className="bg-secondary px-2 py-1 rounded-full">
                  <Text className="text-xs font-semibold text-primary">ID: #{record.id}</Text>
                </View>
              </View>

              <View className="flex-row items-center mt-2">
                <View className={`h-12 w-12 rounded-full items-center justify-center mr-4 ${statusInfo.bg}`}>
                  <Icon color={statusInfo.iconColor} size={24} />
                </View>
                <View className="flex-1">
                  <Text className={`font-bold text-lg ${statusInfo.text}`}>
                    {statusInfo.label}
                  </Text>
                  {record.status === 'COMPLETED' ? (
                    <Text className="text-muted-foreground text-sm mt-1">
                      Độ tin cậy AI: <Text className="font-bold text-foreground">{confidencePercent}%</Text>
                    </Text>
                  ) : (
                    <Text className="text-amber-500 text-sm mt-1 font-medium">
                      Trạng thái: {record.status}
                    </Text>
                  )}
                </View>
              </View>

              {record.errorMessage && (
                <View className="mt-3 bg-rose-50 p-3 rounded-xl border border-rose-100">
                  <Text className="text-rose-600 text-xs">{record.errorMessage}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ScreenWrapper
      title="Chi tiết theo ngày"
      headerLeft={
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100"
        >
          <ArrowLeft color="#171717" size={20} />
        </TouchableOpacity>
      }
    >
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
    </ScreenWrapper>
  );
}
