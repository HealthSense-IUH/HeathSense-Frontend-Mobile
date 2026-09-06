import React from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock, Activity, ShieldAlert, AlertCircle, Heart } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useRecordsByDate } from '@/hooks/useHealthHistory';

const STATUS_COLORS = {
  NORMAL: { bg: 'bg-[#ebfbf3]', text: 'text-[#0fa958]', icon: Heart, iconColor: '#0fa958', label: 'Bình thường' },
  AFIB: { bg: 'bg-rose-50', text: 'text-rose-600', icon: ShieldAlert, iconColor: '#E11D48', label: 'Phát hiện AFib' },
  AFIB_SUSPECTED: { bg: 'bg-amber-50', text: 'text-amber-600', icon: AlertCircle, iconColor: '#D97706', label: 'Nghi ngờ AFib' },
  UNCERTAIN: { bg: 'bg-slate-100', text: 'text-slate-600', icon: Activity, iconColor: '#64748b', label: 'Không chắc chắn' },
};

const formatTime = (isoString: string) => {
  const d = new Date(isoString);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

export default function HistoryRecordsScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();

  // Ensure date has a fallback if undefined (though it shouldn't be)
  const queryDate = date || new Date().toISOString().split('T')[0];

  const { data: records, isLoading, error } = useRecordsByDate(queryDate, 'Asia/Ho_Chi_Minh');

  // Format date for display: YYYY-MM-DD to DD/MM/YYYY
  const displayDate = queryDate.split('-').reverse().join('/');

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
        <View className="mt-2 mb-5 flex-row items-center justify-between">
          <Text className="text-[18px] font-bold text-[#141b2d] tracking-tight">
            Kết quả đo ngày <Text className="text-[#0f172a]">{displayDate}</Text>
          </Text>
          <View className="px-2.5 py-1 rounded-full bg-slate-200/60">
            <Text className="text-xs font-semibold text-slate-600">{records.length} lượt đo</Text>
          </View>
        </View>

        <View className="flex flex-col space-y-4">
          {records.map((record) => {
            const statusInfo = STATUS_COLORS[record.predictionLabel as keyof typeof STATUS_COLORS] || STATUS_COLORS.UNCERTAIN;
            const Icon = statusInfo.icon;
            const confidencePercent = record.confidence ? Math.round(record.confidence * 100) : 0;

            return (
              <View key={record.id} className="bg-white rounded-[22px] p-5 border border-slate-100/80 shadow-sm active:scale-[0.99]">
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-row items-center space-x-2 text-slate-600 font-medium">
                    <Clock color="#64748B" size={16} />
                    <Text className="text-[17px] font-bold text-slate-700">{formatTime(record.createdAt)}</Text>
                  </View>
                  <View className="bg-cyan-50 px-3 py-1 rounded-lg border border-cyan-100/60">
                    <Text className="text-[12px] font-semibold tracking-wide text-cyan-600">ID: #{record.id}</Text>
                  </View>
                </View>

                <View className="flex-row items-center mt-2">
                  <View className={`h-[52px] w-[52px] rounded-full items-center justify-center mr-4 flex-shrink-0 ${statusInfo.bg}`}>
                    <Icon color={statusInfo.iconColor} size={28} strokeWidth={2.2} />
                  </View>
                  <View className="flex-1">
                    <Text className={`font-bold text-[19px] leading-tight ${statusInfo.text}`}>
                      {statusInfo.label}
                    </Text>
                    {record.status === 'COMPLETED' ? (
                      <Text className="text-[14px] text-slate-500 mt-1">
                        Độ tin cậy AI: <Text className="font-bold text-slate-800">{confidencePercent}%</Text>
                      </Text>
                    ) : (
                      <Text className="text-[14px] text-amber-500 mt-1 font-medium">
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
      </View>
    );
  };

  return (
    <ScreenWrapper
      title="Chi tiết theo ngày"
      statusBarStyle="dark"
      contentContainerStyle={{ backgroundColor: '#F2F5FA' }}
      headerLeft={
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 active:opacity-80 transition-transform"
        >
          <ArrowLeft color="#1e293b" size={20} strokeWidth={2.5} />
        </Pressable>
      }
    >
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
    </ScreenWrapper>
  );
}
