import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, ChevronRight, Calendar, Settings, Info } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAvailableHistoryDates } from '@/hooks/useHealthHistory';

// Helper to group dates into tree: { [year]: { [month]: Set(day) } }
const groupDates = (dates: string[]) => {
  const tree: Record<string, Record<string, Set<string>>> = {};
  
  dates.forEach((dateStr) => {
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return;
    
    if (!tree[year]) {
      tree[year] = {};
    }
    if (!tree[year][month]) {
      tree[year][month] = new Set<string>();
    }
    tree[year][month].add(day);
  });

  const result: Record<string, Record<string, string[]>> = {};
  Object.keys(tree).forEach((year) => {
    result[year] = {};
    Object.keys(tree[year]).forEach((month) => {
      result[year][month] = Array.from(tree[year][month]);
    });
  });

  return result;
};

const getSubtitle = (year: string, month: string, day: string) => {
  const today = new Date();
  const y = today.getFullYear().toString();
  const m = (today.getMonth() + 1).toString().padStart(2, '0');
  const d = today.getDate().toString().padStart(2, '0');

  const paddedMonth = month.padStart(2, '0');
  const paddedDay = day.padStart(2, '0');

  if (year === y && paddedMonth === m && paddedDay === d) {
    return 'Hôm nay • Bản ghi gần nhất';
  }
  return 'Chỉ số ổn định';
};

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: dates, isLoading, error } = useAvailableHistoryDates('Asia/Ho_Chi_Minh');

  // State to manage manual expanded overrides for years and months
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const tree = useMemo(() => {
    if (!dates) return {};
    return groupDates(dates);
  }, [dates]);

  const years = useMemo(() => Object.keys(tree).sort((a, b) => Number(b) - Number(a)), [tree]);
  const latestYear = years[0];

  const toggleYear = (year: string) => {
    setExpandedYears((prev) => {
      const current = prev[year] !== undefined ? prev[year] : year === latestYear;
      return { ...prev, [year]: !current };
    });
  };

  const toggleMonth = (yearMonth: string, isDefaultExpanded: boolean) => {
    setExpandedMonths((prev) => {
      const current = prev[yearMonth] !== undefined ? prev[yearMonth] : isDefaultExpanded;
      return { ...prev, [yearMonth]: !current };
    });
  };

  const handleSettingsPress = () => {
    Alert.alert(
      'Tùy chọn lịch sử',
      'Dữ liệu lịch sử đo được đồng bộ tự động từ thiết bị và lưu trữ theo mốc thời gian.',
      [{ text: 'Đóng', style: 'cancel' }]
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="py-20 justify-center items-center">
          <ActivityIndicator size="large" color="#0D6EFD" />
          <Text className="mt-4 text-slate-500 font-medium text-sm">Đang tải lịch sử đo...</Text>
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

    if (years.length === 0) {
      return (
        <View className="py-20 justify-center items-center">
          <Calendar color="#94A3B8" size={48} className="mb-4" />
          <Text className="text-slate-500 font-semibold text-sm">Chưa có dữ liệu đo nào</Text>
        </View>
      );
    }

    return (
      <View className="pb-8 space-y-4">
        {years.map((year) => {
          const isYearExpanded = expandedYears[year] !== undefined ? expandedYears[year] : year === latestYear;
          const months = Object.keys(tree[year]).sort((a, b) => Number(b) - Number(a));
          const latestMonth = months[0];

          return (
            <View
              key={year}
              className="bg-white rounded-3xl border border-slate-200/70 p-5 mb-4"
              style={{
                shadowColor: 'rgba(13, 110, 253, 0.04)',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 1,
                shadowRadius: 30,
                elevation: 2,
              }}
            >
              {/* Year Header Selector */}
              <Pressable
                onPress={() => toggleYear(year)}
                className="flex-row items-center justify-between pb-4 border-b border-slate-100 active:opacity-75"
              >
                <Text className="font-bold text-base text-[#0D6EFD] tracking-tight">Năm {year}</Text>
                {isYearExpanded ? (
                  <ChevronDown color="#0D6EFD" size={20} strokeWidth={2.4} />
                ) : (
                  <ChevronRight color="#0D6EFD" size={20} strokeWidth={2.4} />
                )}
              </Pressable>

              {/* Month Sections */}
              {isYearExpanded && (
                <View className="pt-1">
                  {months.map((month, idx) => {
                    const yearMonth = `${year}-${month}`;
                    const isDefaultMonthExpanded = year === latestYear && month === latestMonth;
                    const isMonthExpanded = expandedMonths[yearMonth] !== undefined
                      ? expandedMonths[yearMonth]
                      : isDefaultMonthExpanded;
                    const days = [...tree[year][month]].sort((a, b) => Number(b) - Number(a));
                    const isLastMonth = idx === months.length - 1;

                    return (
                      <View
                        key={yearMonth}
                        className={`pt-4 pb-3 ${!isLastMonth ? 'border-b border-slate-100' : ''}`}
                      >
                        {/* Month Header */}
                        <Pressable
                          onPress={() => toggleMonth(yearMonth, isDefaultMonthExpanded)}
                          className="flex-row items-center justify-between mb-3 active:opacity-75"
                        >
                          <Text className="font-bold text-sm text-slate-800">Tháng {Number(month)}</Text>
                          {isMonthExpanded ? (
                            <ChevronDown color="#94A3B8" size={18} strokeWidth={2.2} />
                          ) : (
                            <ChevronRight color="#94A3B8" size={18} strokeWidth={2.2} />
                          )}
                        </Pressable>

                        {/* Measurement Days List */}
                        {isMonthExpanded && (
                          <View className="space-y-2 mt-1">
                            {days.map((day) => {
                              const formattedDateTitle = `Ngày ${day.padStart(2, '0')} Tháng ${month.padStart(2, '0')}`;
                              const subtitle = getSubtitle(year, month, day);

                              return (
                                <Pressable
                                  key={`${yearMonth}-${day}`}
                                  onPress={() => {
                                    router.push({
                                      pathname: '/history-records',
                                      params: { date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` }
                                    } as any);
                                  }}
                                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex-row items-center justify-between transition-all active:opacity-80 mb-2"
                                >
                                  <View className="flex-row items-center gap-3">
                                    <View className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 items-center justify-center shrink-0">
                                      <Calendar color="#475569" size={16} strokeWidth={2} />
                                    </View>
                                    <View className="text-left">
                                      <Text className="text-sm font-semibold text-slate-800">
                                        {formattedDateTitle}
                                      </Text>
                                      <Text className="text-xs text-slate-400 font-medium mt-0.5">
                                        {subtitle}
                                      </Text>
                                    </View>
                                  </View>
                                  <ChevronRight color="#94A3B8" size={18} strokeWidth={2} />
                                </Pressable>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* BEGIN: Notice Banner Card (Stitch Specs) */}
        <View className="p-4 rounded-2xl bg-blue-50/80 border border-sky-100 flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center shrink-0">
            <Info color="#0D6EFD" size={18} strokeWidth={2.2} />
          </View>
          <Text className="flex-1 text-xs font-medium text-slate-600 leading-relaxed">
            Chọn một ngày để xem chi tiết các kết quả đo và điện tâm đồ.
          </Text>
        </View>
        {/* END: Notice Banner Card */}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <StatusBar style="dark" animated />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* BEGIN: TopNavigationBar (Stitch Specs) */}
        <View className="px-5 pt-3 pb-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3.5">
            <Pressable
              onPress={() => router.back()}
              className="w-11 h-11 rounded-full bg-white border border-slate-100 items-center justify-center active:opacity-80"
              style={{
                shadowColor: 'rgba(15, 23, 42, 0.05)',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 20,
                elevation: 2,
              }}
              aria-label="Quay lại"
            >
              <ArrowLeft color="#334155" size={20} strokeWidth={2.2} />
            </Pressable>
            <Text className="text-2xl font-bold tracking-tight text-slate-900">
              Lịch sử đo
            </Text>
          </View>

          {/* Quick Action / Settings Button */}
          <Pressable
            onPress={handleSettingsPress}
            className="w-10 h-10 rounded-full bg-white border border-slate-100 items-center justify-center active:opacity-80"
            style={{
              shadowColor: 'rgba(15, 23, 42, 0.05)',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 20,
              elevation: 2,
            }}
            aria-label="Tùy chọn"
          >
            <Settings color="#64748B" size={18} strokeWidth={2} />
          </Pressable>
        </View>
        {/* END: TopNavigationBar */}

        {/* Main Content Flow */}
        <ScrollView
          className="flex-1 px-5 pt-2"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 32) }}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

