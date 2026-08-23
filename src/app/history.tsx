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
            <View key={year} className="mb-3 bg-card rounded-2xl overflow-hidden border border-border shadow-sm">
              <Pressable
                onPress={() => toggleYear(year)}
                className="flex-row items-center justify-between p-4 bg-primary/5 active:opacity-70"
              >
                <Text className="font-bold text-lg text-primary">Năm {year}</Text>
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
                      <View key={yearMonth} className="mt-2 border-b border-border/50 pb-2">
                        <Pressable
                          onPress={() => toggleMonth(yearMonth)}
                          className="flex-row items-center justify-between py-2 active:opacity-70"
                        >
                          <Text className="font-semibold text-base text-foreground">Tháng {Number(month)}</Text>
                          {isMonthExpanded ? (
                            <ChevronDown color="#64748B" size={18} />
                          ) : (
                            <ChevronRight color="#64748B" size={18} />
                          )}
                        </Pressable>

                        {isMonthExpanded && (
                          <View className="flex-row flex-wrap mt-2 mb-1 gap-2">
                            {days.map((day) => (
                              <Pressable
                                key={`${yearMonth}-${day}`}
                                onPress={() => {
                                  router.push({
                                    pathname: '/history-records',
                                    params: { date: `${year}-${month}-${day}` }
                                  } as any);
                                }}
                                className="bg-secondary/80 px-4 py-2 rounded-full border border-border active:opacity-70"
                              >
                                <Text className="text-foreground font-medium text-sm">Ngày {Number(day)}</Text>
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
      headerLeft={
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100 active:opacity-75"
        >
          <ArrowLeft color="#171717" size={20} />
        </Pressable>
      }
    >
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
    </ScreenWrapper>
  );
}
