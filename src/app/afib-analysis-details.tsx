import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ActivityIndicator, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Settings, Info, Plus } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BarChart } from 'react-native-gifted-charts';
import { TimeFilterTabs } from '@/components/features/health/statistics/TimeFilterTabs';
import { PeriodSelector } from '@/components/features/health/statistics/PeriodSelector';
import { ChartLegend } from '@/components/features/health/statistics/ChartLegend';
import { SummaryDonutChart } from '@/components/features/health/statistics/SummaryDonutChart';
import { useHealthStatistics } from '@/hooks/useHealthStatistics';

type FilterType = 'Ngày' | 'Tuần' | 'Tháng' | 'Năm';

const STAT_COLORS = {
  NORMAL: '#10B981',
  UNCERTAIN: '#94A3B8',
  AFIB_SUSPECTED: '#F59E0B',
  AFIB_RISK: '#EF4444',
};

export default function AFibAnalysisDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<FilterType>('Ngày');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const { data, loading, error } = useHealthStatistics(activeFilter, referenceDate);

  const handlePrev = () => {
    const newDate = new Date(referenceDate);
    if (activeFilter === 'Ngày') newDate.setDate(newDate.getDate() - 1);
    else if (activeFilter === 'Tuần') newDate.setDate(newDate.getDate() - 7);
    else if (activeFilter === 'Tháng') newDate.setMonth(newDate.getMonth() - 1);
    else if (activeFilter === 'Năm') newDate.setFullYear(newDate.getFullYear() - 1);
    setReferenceDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(referenceDate);
    if (activeFilter === 'Ngày') newDate.setDate(newDate.getDate() + 1);
    else if (activeFilter === 'Tuần') newDate.setDate(newDate.getDate() + 7);
    else if (activeFilter === 'Tháng') newDate.setMonth(newDate.getMonth() + 1);
    else if (activeFilter === 'Năm') newDate.setFullYear(newDate.getFullYear() + 1);
    setReferenceDate(newDate);
  };

  const periodText = useMemo(() => {
    if (activeFilter === 'Ngày') return `Ngày ${referenceDate.getDate()}/${referenceDate.getMonth() + 1}`;
    if (activeFilter === 'Tuần') return `Tuần này`;
    if (activeFilter === 'Tháng') return `Tháng ${referenceDate.getMonth() + 1}`;
    return `Năm ${referenceDate.getFullYear()}`;
  }, [activeFilter, referenceDate]);

  const badgeLabel = useMemo(() => {
    if (activeFilter === 'Ngày') return 'Hôm nay';
    if (activeFilter === 'Tuần') return 'Tuần này';
    if (activeFilter === 'Tháng') return 'Tháng này';
    return 'Năm này';
  }, [activeFilter]);

  const { chartData, maxValue } = useMemo(() => {
    if (!data?.chartData || data.chartData.length === 0) return { chartData: [], maxValue: 10 };

    let max = 0;
    const mapped = data.chartData.map((item) => {
      const stacks = [];
      let stackSum = 0;
      if (item.normalCount > 0) {
        stacks.push({ value: item.normalCount, color: STAT_COLORS.NORMAL });
        stackSum += item.normalCount;
      }
      if (item.uncertainCount > 0) {
        stacks.push({ value: item.uncertainCount, color: STAT_COLORS.UNCERTAIN, borderTopLeftRadius: 2, borderTopRightRadius: 2 });
        stackSum += item.uncertainCount;
      }
      if (item.afibSuspectedCount > 0) {
        stacks.push({ value: item.afibSuspectedCount, color: STAT_COLORS.AFIB_SUSPECTED, borderTopLeftRadius: 2, borderTopRightRadius: 2 });
        stackSum += item.afibSuspectedCount;
      }
      if (item.afibRiskCount > 0) {
        stacks.push({ value: item.afibRiskCount, color: STAT_COLORS.AFIB_RISK, borderTopLeftRadius: 2, borderTopRightRadius: 2 });
        stackSum += item.afibRiskCount;
      }

      if (stacks.length === 0) {
        stacks.push({ value: 0, color: 'transparent' });
      }

      if (stackSum > max) max = stackSum;

      let displayLabel = item.label;
      if (activeFilter === 'Tháng') {
        const day = parseInt(item.label, 10);
        if (day !== 1 && day % 5 !== 0) {
          displayLabel = '';
        }
      }

      return {
        stacks,
        label: displayLabel,
      };
    });

    const calcMax = Math.max(10, Math.ceil((max * 1.2) / 4) * 4);
    return { chartData: mapped, maxValue: calcMax };
  }, [data, activeFilter]);

  const totalResults = (data?.totalNormal || 0) + (data?.totalAfibRisk || 0) + (data?.totalAfibSuspected || 0) + (data?.totalUncertain || 0);

  const handleSettingsPress = () => {
    Alert.alert(
      'Cài đặt phân tích',
      'Hệ thống AI tự động đồng bộ và phân loại bất thường nhịp tim qua PPG 60s theo chuẩn y khoa.',
      [
        {
          text: 'Đo lâm sàng ngay',
          onPress: () => router.push('/afib-measure' as any),
        },
        { text: 'Đóng', style: 'cancel' },
      ]
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View className="py-20 justify-center items-center">
          <ActivityIndicator size="large" color="#0D6EFD" />
          <Text className="mt-4 text-slate-500 font-medium text-sm">Đang tải dữ liệu...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className="py-12 justify-center items-center px-6">
          <View className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex-row items-center">
            <Text className="text-rose-700 font-semibold text-sm">{error}</Text>
          </View>
        </View>
      );
    }

    if (!isReady) {
      return (
        <View className="py-20 justify-center items-center">
          <ActivityIndicator size="large" color="#0D6EFD" />
          <Text className="mt-4 text-slate-500 font-medium text-sm">Đang chuẩn bị biểu đồ...</Text>
        </View>
      );
    }

    let chartAreaContent;
    if (chartData.length > 0) {
      chartAreaContent = (
        <BarChart
          key={activeFilter}
          isAnimated
          animationDuration={800}
          stackData={chartData}
          barWidth={activeFilter === 'Tháng' ? 6 : (activeFilter === 'Ngày' ? 8 : 12)}
          spacing={activeFilter === 'Tháng' ? 4 : (activeFilter === 'Ngày' ? 8 : 16)}
          xAxisThickness={1}
          xAxisColor="#CBD5E1"
          yAxisThickness={0}
          rulesType="dashed"
          rulesColor="#E2E8F0"
          dashWidth={3}
          dashGap={3}
          yAxisTextStyle={{ color: '#94A3B8', fontSize: 10, fontWeight: '600' }}
          xAxisLabelTextStyle={{ color: '#94A3B8', fontSize: 10, textAlign: 'center' }}
          noOfSections={4}
          maxValue={maxValue}
          height={180}
        />
      );
    } else {
      chartAreaContent = (
        <View style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}>
          <View className="w-full h-0.5 border-b border-dashed border-slate-300 mb-3" />
          <Text className="text-slate-400 font-medium text-xs">Chưa có bản ghi đo nào trong khoảng thời gian này</Text>
        </View>
      );
    }

    return (
      <>
        {/* BEGIN: ResultsOverviewHeader */}
        <View className="px-5 pt-2 pb-1">
          <View className="flex-row items-baseline flex-wrap">
            <Text className="text-3xl font-extrabold text-slate-900 leading-none tracking-tight mr-1.5">
              {totalResults}
            </Text>
            <Text className="text-sm font-medium text-slate-700">
              kết quả, bao gồm <Text className="font-bold text-slate-900">{data?.totalAfibRisk || 0}</Text> có nguy cơ rung tâm nhĩ
            </Text>
          </View>
        </View>
        {/* END: ResultsOverviewHeader */}

        {/* BEGIN: MedicalAnalyticsChartCard */}
        <View
          className="bg-white rounded-3xl p-5 border border-slate-100 mx-5 mt-2"
          style={{
            shadowColor: 'rgba(13, 110, 253, 0.05)',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 20,
            elevation: 2,
          }}
        >
          <View className="relative w-full pb-2">
            {chartAreaContent}
            {/* Year Label at Bottom Left of X-Axis timeline */}
            <Text className="text-slate-600 font-bold text-[10px] mt-1 pl-1">
              {referenceDate.getFullYear()}
            </Text>
          </View>

          {/* Legend placed inside the chart card */}
          <ChartLegend />
        </View>
        {/* END: MedicalAnalyticsChartCard */}

        {/* BEGIN: InspectionSummaryCard */}
        <SummaryDonutChart
          total={totalResults}
          stats={{
            normal: data?.totalNormal || 0,
            uncertain: data?.totalUncertain || 0,
            afibSuspected: data?.totalAfibSuspected || 0,
            afibRisk: data?.totalAfibRisk || 0,
          }}
          badgeLabel={badgeLabel}
        />
        {/* END: InspectionSummaryCard */}

        {/* BEGIN: ClinicalNoteCard */}
        <View className="mx-5 mt-3 mb-4 bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex-row items-start space-x-3">
          <View className="w-6 h-6 rounded-full bg-[#0D6EFD] items-center justify-center shrink-0 mt-0.5 shadow-sm">
            <Info color="#FFFFFF" size={14} strokeWidth={3} />
          </View>
          <Text className="flex-1 text-xs text-blue-900 leading-relaxed ml-2">
            Thuật toán phân tích nhịp tim tự động qua cảm biến PPG. Khi phát hiện các dấu hiệu bất thường lặp lại, hãy liên hệ bác sĩ chuyên khoa tim mạch để được tư vấn đo ECG lâm sàng 12 đạo trình.
          </Text>
        </View>
        {/* END: ClinicalNoteCard */}

        {/* BEGIN: Action Button (In scroll flow) */}
        <View className="px-5 mt-1 mb-6">
          <Pressable
            onPress={() => router.push('/afib-measure' as any)}
            className="w-full py-3.5 px-4 bg-medical-500 active:bg-medical-600 rounded-2xl flex-row items-center justify-center active:opacity-80"
            style={{
              shadowColor: 'rgba(13, 110, 253, 0.35)',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 1,
              shadowRadius: 16,
              elevation: 5,
            }}
          >
            <Plus color="#FFFFFF" size={20} strokeWidth={2.5} />
            <Text className="text-white font-bold text-base tracking-wide ml-2">
              Tiến hành đo lâm sàng ngay
            </Text>
          </Pressable>
        </View>
        {/* END: Action Button */}
      </>
    );
  };

  return (
    <View className="flex-1 bg-[#F4F7FC]">
      <StatusBar style="dark" animated />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* BEGIN: TopNavigationBar (Stitch Specs) */}
        <View className="px-5 py-3 flex-row items-center justify-between relative">
          {/* Back Action Button */}
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center border border-slate-100 active:opacity-80"
            style={{
              shadowColor: 'rgba(13, 110, 253, 0.06)',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 12,
              elevation: 2,
            }}
            aria-label="Quay lại"
          >
            <ChevronLeft color="#334155" size={20} strokeWidth={2.4} />
          </Pressable>

          {/* Main Title */}
          <Text className="text-xl font-extrabold text-slate-900 tracking-tight text-center flex-1 pr-1">
            Chi tiết phân tích
          </Text>

          {/* Settings Action Button */}
          <Pressable
            onPress={handleSettingsPress}
            className="w-10 h-10 rounded-full bg-white items-center justify-center border border-slate-100 active:opacity-80"
            style={{
              shadowColor: 'rgba(13, 110, 253, 0.06)',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 12,
              elevation: 2,
            }}
            aria-label="Cài đặt"
          >
            <Settings color="#64748B" size={18} strokeWidth={2.2} />
          </Pressable>
        </View>
        {/* END: TopNavigationBar */}

        {/* BEGIN: MainContentScrollArea */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }}
          showsVerticalScrollIndicator={false}
        >
          {/* TimeSegmentedControl */}
          <TimeFilterTabs activeFilter={activeFilter} onChange={setActiveFilter} />

          {/* DateNavigatorPill */}
          <PeriodSelector
            year={referenceDate.getFullYear()}
            monthText={periodText}
            onPrev={handlePrev}
            onNext={handleNext}
          />

          {renderContent()}
        </ScrollView>
        {/* END: MainContentScrollArea */}
      </SafeAreaView>
    </View>
  );
}


