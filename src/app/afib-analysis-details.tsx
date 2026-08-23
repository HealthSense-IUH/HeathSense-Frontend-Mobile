import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BarChart } from 'react-native-gifted-charts';
import { TimeFilterTabs } from '@/components/features/health/statistics/TimeFilterTabs';
import { PeriodSelector } from '@/components/features/health/statistics/PeriodSelector';
import { ChartLegend } from '@/components/features/health/statistics/ChartLegend';
import { STATUS_COLORS } from '@/constants/statusColors';
import { SummaryDonutChart } from '@/components/features/health/statistics/SummaryDonutChart';
import { useHealthStatistics } from '@/hooks/useHealthStatistics';

type FilterType = 'Ngày' | 'Tuần' | 'Tháng' | 'Năm';

export default function AFibAnalysisDetailsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>('Ngày');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 400); 

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

  const { chartData, maxValue } = useMemo(() => {
    if (!data?.chartData || data.chartData.length === 0) return { chartData: [], maxValue: 10 };

    let max = 0;
    const mapped = data.chartData.map((item) => {
      const stacks = [];
      let stackSum = 0;
      if (item.normalCount > 0) {
        stacks.push({ value: item.normalCount, color: STATUS_COLORS.NORMAL });
        stackSum += item.normalCount;
      }
      if (item.uncertainCount > 0) {
        stacks.push({ value: item.uncertainCount, color: STATUS_COLORS.UNCERTAIN, borderTopLeftRadius: 2, borderTopRightRadius: 2 });
        stackSum += item.uncertainCount;
      }
      if (item.afibSuspectedCount > 0) {
        stacks.push({ value: item.afibSuspectedCount, color: STATUS_COLORS.AFIB_SUSPECTED, borderTopLeftRadius: 2, borderTopRightRadius: 2 });
        stackSum += item.afibSuspectedCount;
      }
      if (item.afibRiskCount > 0) {
        stacks.push({ value: item.afibRiskCount, color: STATUS_COLORS.AFIB_RISK, borderTopLeftRadius: 2, borderTopRightRadius: 2 });
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

    let calcMax = Math.max(10, Math.ceil((max * 1.2) / 4) * 4);
    return { chartData: mapped, maxValue: calcMax };
  }, [data, activeFilter]);

  const totalResults = (data?.totalNormal || 0) + (data?.totalAfibRisk || 0) + (data?.totalAfibSuspected || 0) + (data?.totalUncertain || 0);

  const renderContent = () => {
    if (loading) {
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
          <Text className="text-destructive font-bold">{error}</Text>
        </View>
      );
    }

    if (!isReady) {
      return (
        <View className="py-20 justify-center items-center">
          <ActivityIndicator size="large" color="#0F67FE" />
          <Text className="mt-4 text-muted-foreground">Đang chuẩn bị biểu đồ...</Text>
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
          hideRules
          xAxisThickness={0}
          yAxisThickness={0}
          yAxisTextStyle={{ color: '#9EA7B8', fontSize: 10 }} 
          xAxisLabelTextStyle={{ color: '#9EA7B8', fontSize: 10, textAlign: 'center' }}
          noOfSections={4}
          maxValue={maxValue}
          height={200}
          dashWidth={0}
        />
      );
    } else {
      chartAreaContent = (
        <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
          <Text className="text-muted-foreground font-semibold">Không có dữ liệu biểu đồ</Text>
        </View>
      );
    }

    return (
      <>
        {/* Summary Title */}
        <View className="px-6 mt-4 mb-8">
          <Text className="text-foreground text-center text-base">
            <Text className="font-bold text-3xl">{totalResults} </Text>
            kết quả, bao gồm {data?.totalAfibRisk || 0} có nguy cơ rung tâm nhĩ
          </Text>
        </View>

        {/* Bar Chart Area */}
        <View className="bg-card rounded-2xl p-4 shadow-sm border border-border mx-6 mt-4">
          <View className="px-2 pr-4">
            {chartAreaContent}
            <Text className="text-muted-foreground font-semibold text-[10px] ml-4 -mt-2">{referenceDate.getFullYear()}</Text>
          </View>

          {/* Legend placed inside the chart card */}
          <ChartLegend />
        </View>

        {/* Bottom Summary Section */}
        <SummaryDonutChart
          total={totalResults}
          stats={{
            normal: data?.totalNormal || 0,
            uncertain: data?.totalUncertain || 0,
            afibSuspected: data?.totalAfibSuspected || 0,
            afibRisk: data?.totalAfibRisk || 0
          }}
        />
      </>
    );
  };

  return (
    <ScreenWrapper 
      title="Chi tiết phân tích"
      headerLeft={
        <Pressable 
          onPress={() => router.back()}
          className="h-10 w-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100 active:opacity-75"
        >
          <ArrowLeft color="#171717" size={20} />
        </Pressable>
      }
      stickyHeaderHeight={130}
      stickyHeader={
        <>
          <TimeFilterTabs activeFilter={activeFilter} onChange={setActiveFilter} />
          <PeriodSelector 
            year={referenceDate.getFullYear()} 
            monthText={periodText} 
            onPrev={handlePrev}
            onNext={handleNext}
          />
        </>
      }
    >
      {renderContent()}
    </ScreenWrapper>
  );
}
