import React from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Activity, ArrowLeft, ChevronRight, Clock } from 'lucide-react-native';
import { useRecordsByDate } from '@/hooks/useHealthHistory';
import { getPredictionMeta } from '@/constants/healthRecords';
import { PredictionBadge } from '@/components/features/health/PredictionBadge';
import { toLocalDateStr } from '@/utils/formatters';

const formatTime = (isoString: string) =>
  new Date(isoString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const shadow = { boxShadow: '0 4px 18px rgba(9, 30, 66, 0.05)' };

/** Các lần đo trong một ngày (tương ứng bảng "Các lần đo ngày ..." của lịch nhiệt trên web). */
export default function HistoryRecordsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { date } = useLocalSearchParams<{ date: string }>();
  const queryDate = date || toLocalDateStr(new Date());
  const { data: records, isLoading, isFetching, error, refetch } = useRecordsByDate(queryDate);
  const displayDate = queryDate.split('-').reverse().join('/');

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="py-20 justify-center items-center">
          <ActivityIndicator size="large" color="#0D6EFD" />
          <Text className="mt-4 text-slate-500 font-medium text-sm">Đang tải dữ liệu đo của ngày {displayDate}...</Text>
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
          <Activity color="#94A3B8" size={48} />
          <Text className="text-slate-500 font-semibold text-sm mt-4">Không tìm thấy bản ghi đo nào trong ngày này.</Text>
        </View>
      );
    }

    return (
      <View className="pb-8">
        <View className="mt-1 mb-5 flex-row items-center justify-between">
          <Text className="text-[18px] font-bold text-[#141b2d] tracking-tight">Các lần đo ngày {displayDate}</Text>
          <View className="px-2.5 py-1 rounded-full bg-slate-200/60">
            <Text className="text-xs font-semibold text-slate-600">{records.length} lần đo</Text>
          </View>
        </View>

        {records.map((record) => {
          const meta = getPredictionMeta(record.predictionLabel, record.status);
          const hr = record.hrvFeatures?.HR_mean ? Math.round(Number(record.hrvFeatures.HR_mean)) : null;
          const pct = record.confidence !== null && record.confidence !== undefined ? (record.confidence * 100).toFixed(1) : null;

          return (
            <Pressable
              key={String(record.id)}
              onPress={() => router.push(`/health-record/${record.id}` as any)}
              className="bg-white rounded-[22px] p-5 border border-slate-100/80 active:opacity-80 mb-3.5"
              style={shadow}
            >
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Clock color="#64748B" size={16} />
                  <Text className="text-[17px] font-bold text-slate-700">{formatTime(record.createdAt)}</Text>
                </View>
                <PredictionBadge meta={meta} size="sm" />
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-2">
                  <Text className="text-xs text-slate-500" numberOfLines={1}>File: {record.fileName}</Text>
                  <Text className="text-[13px] text-slate-600 mt-1">
                    Nhịp tim: <Text className="font-bold text-slate-800">{hr ? `${hr} BPM` : '--'}</Text>
                    {pct !== null ? (
                      <>
                        {'  •  '}Khả năng AFib: <Text className="font-bold text-slate-800">{pct}%</Text>
                      </>
                    ) : null}
                  </Text>
                  {record.status !== 'COMPLETED' ? (
                    <Text className="text-xs mt-1 font-medium" style={{ color: meta.text }}>{meta.advice}</Text>
                  ) : null}
                </View>
                <View className="flex-row items-center" style={{ gap: 2 }}>
                  <Text className="text-xs font-semibold text-[#0D6EFD]">Chi tiết</Text>
                  <ChevronRight color="#0D6EFD" size={16} strokeWidth={2} />
                </View>
              </View>

              {record.errorMessage ? (
                <View className="mt-3 bg-rose-50 p-3 rounded-xl border border-rose-100">
                  <Text className="text-rose-600 text-xs font-medium">{record.errorMessage}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#F2F5FA]">
      <StatusBar style="dark" animated />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <View className="px-5 pt-3 pb-5 flex-row items-center">
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/history-dates' as any))}
            className="w-10 h-10 rounded-full bg-white border border-slate-100 items-center justify-center active:opacity-80 mr-4"
            style={shadow}
            aria-label="Quay lại"
          >
            <ArrowLeft color="#0B1329" size={20} strokeWidth={2.4} />
          </Pressable>
          <Text className="text-[23px] font-extrabold text-[#0B1329] tracking-tight">Chi tiết theo ngày</Text>
        </View>

        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => refetch()} tintColor="#0D6EFD" />}
        >
          {renderContent()}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
