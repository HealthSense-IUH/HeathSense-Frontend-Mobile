import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, ChevronRight, Calendar } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useAvailableHistoryDates } from '@/hooks/useHealthHistory';

// Helper to group dates
const groupDates = (dates: string[]) => {
  const tree: Record<string, Record<string, Set<string>>> = {};
  
  dates.forEach((dateStr) => {
    // dateStr is 'YYYY-MM-DD'
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

export default function HistoryScreen() {
  const router = useRouter();
  // We can pass a specific timezone if needed, e.g. 'Asia/Ho_Chi_Minh', but the default is handled in backend
  const { data: dates, isLoading, error } = useAvailableHistoryDates('Asia/Ho_Chi_Minh');

  // State to manage expanded years and months
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const toggleYear = (year: string) => {
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  const toggleMonth = (yearMonth: string) => {
    setExpandedMonths((prev) => ({ ...prev, [yearMonth]: !prev[yearMonth] }));
  };

  const tree = useMemo(() => {
    if (!dates) return {};
    return groupDates(dates);
  }, [dates]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="py-20 justify-center items-center">
          <ActivityIndicator size="large" color="#0F67FE" />
          <Text className="mt-4 text-muted-foreground">Đang tải dữ liệu...</Text>
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

    const years = Object.keys(tree).sort((a, b) => Number(b) - Number(a));

    if (years.length === 0) {
      return (
        <View className="py-20 justify-center items-center">
          <Calendar color="#9EA7B8" size={48} className="mb-4" />
          <Text className="text-muted-foreground font-semibold">Chưa có dữ liệu đo</Text>
        </View>
      );
    }

    return (
      <View className="pb-8">
        {years.map((year) => {
          const isYearExpanded = expandedYears[year];
          const months = Object.keys(tree[year]).sort((a, b) => Number(b) - Number(a));

          return (
            <View key={year} className="mb-4 bg-white rounded-3xl overflow-hidden border border-slate-200/70 shadow-sm p-5">
              <Pressable
                onPress={() => toggleYear(year)}
                className="flex-row items-center justify-between pb-4 border-b border-slate-100 cursor-pointer active:opacity-70"
              >
                <Text className="font-bold text-base text-brand-600 tracking-tight">Năm {year}</Text>
                {isYearExpanded ? (
                  <ChevronDown color="#0F67FE" size={20} />
                ) : (
                  <ChevronRight color="#0F67FE" size={20} />
                )}
              </Pressable>

              {isYearExpanded && (
                <View className="px-4 py-2">
                  {months.map((month) => {
                    const yearMonth = `${year}-${month}`;
                    const isMonthExpanded = expandedMonths[yearMonth];
                    const days = [...tree[year][month]].sort((a, b) => Number(b) - Number(a));

                    return (
                      <View key={yearMonth} className="pt-4 pb-3 border-b border-slate-100 last:border-b-0">
                        <Pressable
                          onPress={() => toggleMonth(yearMonth)}
                          className="flex-row items-center justify-between mb-3 active:opacity-70"
                        >
                          <View className="flex-row items-center gap-2">
                            <Text className="font-bold text-sm text-slate-800">Tháng {Number(month)}</Text>
                          </View>
                          {isMonthExpanded ? (
                            <ChevronDown color="#94A3B8" size={20} strokeWidth={2.2} />
                          ) : (
                            <ChevronRight color="#94A3B8" size={20} strokeWidth={2.2} />
                          )}
                        </Pressable>

                        {isMonthExpanded && (
                          <View className="flex flex-col space-y-2 mt-1">
                            {days.map((day) => (
                              <Pressable
                                key={`${yearMonth}-${day}`}
                                onPress={() => {
                                  router.push({
                                    pathname: '/history-records',
                                    params: { date: `${year}-${month}-${day}` }
                                  } as any);
                                }}
                                className="w-full p-3.5 rounded-2xl bg-brand-50/50 border border-brand-100 hover:border-brand-200 flex-row items-center justify-between transition-all active:scale-[0.98] shadow-sm mb-2"
                              >
                                <View className="flex-row items-center gap-3">
                                  <View className="w-9 h-9 rounded-xl bg-white border border-brand-100 flex items-center justify-center shrink-0">
                                    <Calendar color="#0284C7" size={18} strokeWidth={2} />
                                  </View>
                                  <Text className="text-sm font-bold text-slate-900">Ngày {Number(day)}</Text>
                                </View>
                                <ChevronRight color="#0284C7" size={18} strokeWidth={2.2} />
                              </Pressable>
                            ))}
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
      </View>
    );
  };

  return (
    <ScreenWrapper
      title="Lịch sử đo"
      statusBarStyle="dark"
      contentContainerStyle={{ backgroundColor: '#F8FAFC' }}
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
