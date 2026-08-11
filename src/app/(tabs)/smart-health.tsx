import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-gifted-charts';
import { TimeFilterTabs } from '@/components/features/health/statistics/TimeFilterTabs';
import { PeriodSelector } from '@/components/features/health/statistics/PeriodSelector';
import { ChartLegend, STATUS_COLORS } from '@/components/features/health/statistics/ChartLegend';
import { SummaryDonutChart } from '@/components/features/health/statistics/SummaryDonutChart';
import { useHealthStatistics } from '@/hooks/useHealthStatistics';

type FilterType = 'Ngày' | 'Tuần' | 'Tháng' | 'Năm';

export default function SmartHealthScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('Năm');
  const [referenceDate, setReferenceDate] = useState(new Date());

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
    const mapped = data.chartData.map(item => {
      const stacks = [];
      let stackSum = 0;
      if (item.normalCount > 0) {
        stacks.push({ value: item.normalCount, color: STATUS_COLORS.NORMAL });
        stackSum += item.normalCount;
      }
      if (item.afibRiskCount > 0) {
        stacks.push({ value: item.afibRiskCount, color: STATUS_COLORS.AFIB_RISK, borderTopLeftRadius: 2, borderTopRightRadius: 2 });
        stackSum += item.afibRiskCount;
      }
      if (item.uncertainCount > 0) {
        stacks.push({ value: item.uncertainCount, color: STATUS_COLORS.AFIB_SUSPECTED, borderTopLeftRadius: 2, borderTopRightRadius: 2 });
        stackSum += item.uncertainCount;
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

  const totalResults = (data?.totalNormal || 0) + (data?.totalAfibRisk || 0) + (data?.totalUncertain || 0);

  // FIX: Thay vì phụ thuộc 100% vào class "flex-1" của Tailwind trên SafeAreaView (có thể bị lỗi trên phiên bản NativeWind hiện tại), 
  // FIX: Gán cứng flex: 1 để không bị bóp height, nhưng giữ className bg-background để hỗ trợ Dark Mode.
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="px-6 pt-4 pb-2 flex-row justify-between items-center bg-card rounded-b-3xl shadow-sm mb-4">
          <View>
            <Text className="text-xs font-semibold text-primary">Phân tích nhịp tim</Text>
            <Text className="text-lg font-bold text-foreground">
              Bằng sóng xung (PPG)
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <TimeFilterTabs activeFilter={activeFilter} onChange={setActiveFilter} />

        {/* Period Selector */}
        <PeriodSelector 
          year={referenceDate.getFullYear()} 
          monthText={periodText} 
          onPrev={handlePrev}
          onNext={handleNext}
        />

        {loading ? (
          <View className="py-20 justify-center items-center">
            <ActivityIndicator size="large" color="#0F67FE" />
            <Text className="mt-4 text-muted-foreground">Đang tải dữ liệu...</Text>
          </View>
        ) : error ? (
          <View className="py-20 justify-center items-center">
            <Text className="text-destructive font-bold">{error}</Text>
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
                afibRisk: data?.totalAfibRisk || 0,
                afibSuspected: data?.totalUncertain || 0
              }} 
            />
          </>
        )}
        
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}
