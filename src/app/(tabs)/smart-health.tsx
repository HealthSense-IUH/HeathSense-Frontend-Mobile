import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-gifted-charts';
import { TimeFilterTabs } from '@/components/features/health/statistics/TimeFilterTabs';
import { PeriodSelector } from '@/components/features/health/statistics/PeriodSelector';
import { ChartLegend, STATUS_COLORS } from '@/components/features/health/statistics/ChartLegend';
import { SummaryDonutChart } from '@/components/features/health/statistics/SummaryDonutChart';

type FilterType = 'Ngày' | 'Tuần' | 'Tháng' | 'Năm';

const MOCK_BAR_DATA = [
  { stacks: [{ value: 0, color: 'transparent' }], label: '1' },
  { stacks: [{ value: 0, color: 'transparent' }], label: '2' },
  { 
    stacks: [
      { value: 380, color: STATUS_COLORS.NORMAL },
      { value: 20, color: STATUS_COLORS.AFIB_RISK, borderTopLeftRadius: 2, borderTopRightRadius: 2 }
    ], 
    label: '3' 
  },
  { 
    stacks: [
      { value: 1100, color: STATUS_COLORS.NORMAL },
      { value: 40, color: STATUS_COLORS.AFIB_RISK, borderTopLeftRadius: 2, borderTopRightRadius: 2 }
    ], 
    label: '4' 
  },
  { 
    stacks: [
      { value: 1250, color: STATUS_COLORS.NORMAL },
      { value: 50, color: STATUS_COLORS.AFIB_RISK, borderTopLeftRadius: 2, borderTopRightRadius: 2 }
    ], 
    label: '5' 
  },
  { 
    stacks: [
      { value: 1200, color: STATUS_COLORS.NORMAL },
      { value: 30, color: STATUS_COLORS.AFIB_RISK, borderTopLeftRadius: 2, borderTopRightRadius: 2 }
    ], 
    label: '6' 
  },
  { 
    stacks: [
      { value: 1150, color: STATUS_COLORS.NORMAL },
      { value: 25, color: STATUS_COLORS.AFIB_RISK, borderTopLeftRadius: 2, borderTopRightRadius: 2 }
    ], 
    label: '7' 
  },
  { 
    stacks: [
      { value: 280, color: STATUS_COLORS.NORMAL },
      { value: 14, color: STATUS_COLORS.AFIB_RISK, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
      { value: 2, color: STATUS_COLORS.AFIB_SUSPECTED, borderTopLeftRadius: 2, borderTopRightRadius: 2 }
    ], 
    label: '8' 
  },
  { stacks: [{ value: 0, color: 'transparent' }], label: '9' },
  { stacks: [{ value: 0, color: 'transparent' }], label: '10' },
  { stacks: [{ value: 0, color: 'transparent' }], label: '11' },
  { stacks: [{ value: 0, color: 'transparent' }], label: '12' },
];

const MOCK_STATS = {
  normal: 5763,
  afibRisk: 139,
  afibSuspected: 5,
};

export default function SmartHealthScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('Năm');
  const [year, setYear] = useState(2026);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <Text className="text-xl font-bold text-foreground text-center">
            Phân tích rối loạn nhịp tim bằng sóng xung
          </Text>
        </View>

        {/* Tabs */}
        <TimeFilterTabs activeFilter={activeFilter} onChange={setActiveFilter} />

        {/* Period Selector */}
        <PeriodSelector 
          year={year} 
          monthText="Thg 8" 
          onPrev={() => setYear(y => y - 1)}
          onNext={() => setYear(y => y + 1)}
        />

        {/* Summary Title */}
        <View className="px-6 mt-4 mb-8">
          <Text className="text-foreground text-center text-base">
            <Text className="font-bold text-3xl">294 </Text> 
            kết quả, bao gồm 16 có nguy cơ rung tâm nhĩ
          </Text>
        </View>

        {/* Bar Chart Area */}
        <View className="px-2 pr-6">
          <BarChart
            stackData={MOCK_BAR_DATA}
            barWidth={12}
            spacing={16}
            hideRules
            xAxisThickness={0}
            yAxisThickness={0}
            yAxisTextStyle={{ color: '#5D6A85', fontSize: 10 }}
            xAxisLabelTextStyle={{ color: '#5D6A85', fontSize: 10, textAlign: 'center' }}
            noOfSections={4}
            maxValue={1600}
            height={200}
            dashWidth={0}
            yAxisLabelTexts={['0', '400', '800', '1200', '1600']}
          />
          <Text className="text-[#5D6A85] text-[10px] ml-4 -mt-2">2026</Text>
        </View>

        {/* Legend */}
        <ChartLegend />

        {/* Bottom Summary Section */}
        <SummaryDonutChart 
          total={MOCK_STATS.normal + MOCK_STATS.afibRisk + MOCK_STATS.afibSuspected} 
          stats={MOCK_STATS} 
        />
        
      </ScrollView>
    </SafeAreaView>
  );
}
