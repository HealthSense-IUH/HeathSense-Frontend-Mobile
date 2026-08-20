import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Animated, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Bluetooth } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BarChart } from 'react-native-gifted-charts';
import { TimeFilterTabs } from '@/components/features/health/statistics/TimeFilterTabs';
import { PeriodSelector } from '@/components/features/health/statistics/PeriodSelector';
import { ChartLegend, STATUS_COLORS } from '@/components/features/health/statistics/ChartLegend';
import { SummaryDonutChart } from '@/components/features/health/statistics/SummaryDonutChart';
import { useHealthStatistics } from '@/hooks/useHealthStatistics';
import { router } from 'expo-router';


type FilterType = 'Ngày' | 'Tuần' | 'Tháng' | 'Năm';

export default function SmartHealthScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>('Năm');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Thay thế InteractionManager (đã bị deprecated) bằng setTimeout để đợi Animation mượt mà kết thúc
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 400); // Đợi 400ms tương đương thời gian chạy Animation vuốt màn hình

    return () => clearTimeout(timer);
  }, []);

  const { data, loading, isFetching, error } = useHealthStatistics(activeFilter, referenceDate);

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
    const mapped = data.chartData.map(item => {
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
        const day = parseInt(item.label);
        // Chỉ hiển thị label cho ngày 1, 5, 10, 15, 20, 25, 30 để tránh đè chữ
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
  }, [data]);

  const totalResults = (data?.totalNormal || 0) + (data?.totalAfibRisk || 0) + (data?.totalAfibSuspected || 0) + (data?.totalUncertain || 0);

  return (
    <ScreenWrapper 
      title="Phân tích nhịp tim"
      headerRight={
        <TouchableOpacity
          onPress={() => router.push("/(public)/scan" as any)}
          className="h-10 w-10 rounded-full bg-primary/10 items-center justify-center"
        >
          <Bluetooth color="#0F67FE" size={20} />
        </TouchableOpacity>
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

          {loading ? (
            <View className="py-20 justify-center items-center">
              <ActivityIndicator size="large" color="#0F67FE" />
              <Text className="mt-4 text-muted-foreground">Đang tải dữ liệu...</Text>
            </View>
          ) : error ? (
            <View className="py-20 justify-center items-center">
              <Text className="text-destructive font-bold">{error}</Text>
            </View>
          ) : !isReady ? (
            <View className="py-20 justify-center items-center">
              <ActivityIndicator size="large" color="#0F67FE" />
              <Text className="mt-4 text-muted-foreground">Đang chuẩn bị biểu đồ...</Text>
            </View>
          ) : (
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
                  {chartData.length > 0 ? (
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
                      yAxisTextStyle={{ color: '#9EA7B8', fontSize: 10 }} // using text-asklepios-40 color
                      xAxisLabelTextStyle={{ color: '#9EA7B8', fontSize: 10, textAlign: 'center' }}
                      noOfSections={4}
                      maxValue={maxValue}
                      height={200}
                      dashWidth={0}
                    />
                  ) : (
                    <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
                      <Text className="text-muted-foreground font-semibold">Không có dữ liệu biểu đồ</Text>
                    </View>
                  )}
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
          )}

    </ScreenWrapper>
  );
}
