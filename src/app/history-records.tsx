import React from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock, Activity, ShieldAlert, AlertCircle, Heart, ChevronRight, SlidersHorizontal } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRecordsByDate } from '@/hooks/useHealthHistory';

const STATUS_UI = {
  NORMAL: {
    bg: 'bg-[#ebfbf3]',
    text: 'text-[#0fa958]',
    icon: Heart,
    iconColor: '#0fa958',
    label: 'Bình thường',
  },
  AFIB: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    icon: ShieldAlert,
    iconColor: '#EF4444',
    label: 'Phát hiện AFib',
  },
  AFIB_SUSPECTED: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    icon: AlertCircle,
    iconColor: '#F59E0B',
    label: 'Nghi ngờ AFib',
  },
  UNCERTAIN: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    icon: Activity,
    iconColor: '#94A3B8',
    label: 'Không chắc chắn',
  },
};

const formatTime = (isoString: string) => {
  const d = new Date(isoString);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

export default function HistoryRecordsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { date } = useLocalSearchParams<{ date: string }>();

  // Ensure date has a fallback if undefined
  const queryDate = date || new Date().toISOString().split('T')[0];

  const { data: records, isLoading, error } = useRecordsByDate(queryDate, 'Asia/Ho_Chi_Minh');

  // Format date for display: YYYY-MM-DD to DD/MM/YYYY
  const displayDate = queryDate.split('-').reverse().join('/');

  const handleRecordPress = (record: any) => {
    const statusInfo = STATUS_UI[record.predictionLabel as keyof typeof STATUS_UI] || STATUS_UI.UNCERTAIN;
    const confidencePercent = record.confidence ? Math.round(record.confidence * 100) : 0;
    Alert.alert(
      `Chi tiết lượt đo: ${formatTime(record.createdAt)}`,
      `Mã bản ghi: #${record.id}\nKết quả: ${statusInfo.label}\nKhả năng bị rung nhĩ: ${confidencePercent}%\nTrạng thái: ${record.status}`,
      [{ text: 'Đóng', style: 'default' }]
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="py-20 justify-center items-center">
          <ActivityIndicator size="large" color="#0D6EFD" />
          <Text className="mt-4 text-slate-500 font-medium text-sm">Đang tải dữ liệu đo...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className="py-20 justify-center items-center px-6">
          <View className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex-row items-center">
            <Text className="text-rose-700 font-semibold text-sm">Lỗi tải dữ liệu. Vui lòng thử lại.</Text>
          </View>
        </View>
      );
    }

    if (!records || records.length === 0) {
      return (
        <View className="py-20 justify-center items-center">
          <Activity color="#94A3B8" size={48} className="mb-4" />
          <Text className="text-slate-500 font-semibold text-sm">Không có dữ liệu đo trong ngày này</Text>
        </View>
      );
    }

    return (
      <View className="pb-8">
        {/* BEGIN: DateTitleSection */}
        <View className="mt-1 mb-5 flex-row items-center justify-between">
          <Text className="text-[18px] font-bold text-[#141b2d] tracking-tight">
            Kết quả đo ngày <Text className="text-[#0f172a]">{displayDate}</Text>
          </Text>
          <View className="px-2.5 py-1 rounded-full bg-slate-200/60">
            <Text className="text-xs font-semibold text-slate-600">{records.length} lượt đo</Text>
          </View>
        </View>
        {/* END: DateTitleSection */}

        {/* BEGIN: MeasurementList */}
        <View className="flex flex-col space-y-4">
          {records.map((record) => {
            const statusInfo = STATUS_UI[record.predictionLabel as keyof typeof STATUS_UI] || STATUS_UI.UNCERTAIN;
            const Icon = statusInfo.icon;
            const confidencePercent = record.confidence ? Math.round(record.confidence * 100) : 0;

            return (
              <Pressable
                key={record.id}
                onPress={() => handleRecordPress(record)}
                className="bg-white rounded-[22px] p-5 border border-slate-100/80 active:opacity-80 transition-all mb-3.5"
                style={{
                  shadowColor: 'rgba(9, 30, 66, 0.05)',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 1,
                  shadowRadius: 18,
                  elevation: 2,
                }}
              >
                {/* Hàng 1: Thời gian & Mã ID kết quả */}
                <View className="flex-row justify-between items-center mb-4">
                  <View className="flex-row items-center space-x-1.5">
                    <Clock color="#64748B" size={16} />
                    <Text className="text-[17px] font-bold text-slate-700 ml-1.5">
                      {formatTime(record.createdAt)}
                    </Text>
                  </View>
                  <View className="bg-cyan-50 px-3 py-1 rounded-lg border border-cyan-100/60">
                    <Text className="text-[12px] font-semibold tracking-wide text-cyan-600">
                      ID: #{record.id}
                    </Text>
                  </View>
                </View>

                {/* Hàng 2: Chi tiết kết quả lâm sàng */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1 pr-2">
                    <View className={`h-[52px] w-[52px] rounded-full items-center justify-center mr-4 flex-shrink-0 ${statusInfo.bg}`}>
                      <Icon color={statusInfo.iconColor} size={28} strokeWidth={2.2} />
                    </View>
                    <View className="flex-1">
                      <Text className={`font-bold text-[19px] leading-tight ${statusInfo.text}`}>
                        {statusInfo.label}
                      </Text>
                      {record.status === 'COMPLETED' ? (
                        <Text className="text-[14px] text-slate-500 mt-1">
                          Khả năng bị rung nhĩ: <Text className="font-bold text-slate-800">{confidencePercent}%</Text>
                        </Text>
                      ) : (
                        <Text className="text-[14px] text-amber-500 mt-1 font-medium">
                          Trạng thái: {record.status}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Right Chevron */}
                  <ChevronRight color="#CBD5E1" size={20} strokeWidth={2} />
                </View>

                {record.errorMessage && (
                  <View className="mt-3 bg-rose-50 p-3 rounded-xl border border-rose-100">
                    <Text className="text-rose-600 text-xs font-medium">{record.errorMessage}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
        {/* END: MeasurementList */}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#F2F5FA]">
      <StatusBar style="dark" animated />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* BEGIN: NavigationHeader (Stitch Specs) */}
        <View className="px-5 pt-3 pb-5 flex-row items-center justify-between">
          <View className="flex-row items-center gap-4">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white border border-slate-100 items-center justify-center active:opacity-80"
              style={{
                shadowColor: 'rgba(15, 23, 42, 0.05)',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 16,
                elevation: 2,
              }}
              aria-label="Quay lại lịch sử đo"
            >
              <ArrowLeft color="#0B1329" size={20} strokeWidth={2.4} />
            </Pressable>
            <Text className="text-[23px] font-extrabold text-[#0B1329] tracking-tight">
              Chi tiết theo ngày
            </Text>
          </View>

          <Pressable
            onPress={() => {
              Alert.alert('Tùy chọn', 'Chi tiết các lần đo nhịp tim và sàng lọc AFib trong ngày.');
            }}
            className="w-10 h-10 rounded-full bg-white/60 border border-slate-100/60 items-center justify-center active:opacity-80"
            aria-label="Tùy chọn"
          >
            <SlidersHorizontal color="#64748B" size={18} strokeWidth={2} />
          </Pressable>
        </View>
        {/* END: NavigationHeader */}

        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

