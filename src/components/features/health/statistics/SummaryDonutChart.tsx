import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronUp } from 'lucide-react-native';
import { PieChart } from 'react-native-gifted-charts';
import { STATUS_COLORS } from './ChartLegend';

interface SummaryStats {
  normal: number;
  afibRisk: number;
  afibSuspected: number;
}

interface SummaryDonutChartProps {
  total: number;
  stats: SummaryStats;
}

export function SummaryDonutChart({ total, stats }: SummaryDonutChartProps) {
  const pieData = [
    { value: stats.normal || 1, color: STATUS_COLORS.NORMAL }, // Fallback value so chart draws something if all 0
    { value: stats.afibRisk, color: STATUS_COLORS.AFIB_RISK },
    { value: stats.afibSuspected, color: STATUS_COLORS.AFIB_SUSPECTED },
  ].filter(item => item.value > 0);

  return (
    <View className="bg-popover rounded-t-3xl mt-2 p-6 flex-1 min-h-[400px]">
      <View className="flex-row items-center justify-between border-b border-border pb-4 mb-6">
        <View className="flex-row items-baseline">
          <Text className="text-muted-foreground text-sm mr-2">Tổng số lần kiểm tra</Text>
          <Text className="text-foreground text-2xl font-bold mr-1">{total.toLocaleString()}</Text>
          <Text className="text-muted-foreground text-sm">lần</Text>
        </View>
        <TouchableOpacity className="flex-row items-center">
          <Text className="text-muted-foreground text-sm mr-1">Ẩn bớt</Text>
          <ChevronUp color="#9EA7B8" size={16} />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center">
        {/* Donut Chart Container */}
        <View className="w-[140px] items-center justify-center">
          <PieChart
            donut
            innerRadius={45}
            radius={65}
            data={pieData}
            centerLabelComponent={() => {
              return null;
            }}
            backgroundColor="transparent"
          />
        </View>

        {/* Stats List */}
        <View className="flex-1 ml-6">
          <StatRow 
            label="Nghi ngờ rung tâm nhĩ" 
            count={stats.afibSuspected} 
            color={STATUS_COLORS.AFIB_SUSPECTED} 
          />
          <StatRow 
            label="Nguy cơ rung tâm nhĩ" 
            count={stats.afibRisk} 
            color={STATUS_COLORS.AFIB_RISK} 
          />
          <StatRow 
            label="Không có bất thường" 
            count={stats.normal} 
            color={STATUS_COLORS.NORMAL} 
          />
        </View>
      </View>

      <View className="mt-8">
        <Text className="text-muted-foreground text-sm leading-6">
          <Text className="font-bold text-foreground mb-1">• Rung tâm nhĩ </Text>
          có thể không biểu hiện triệu chứng rõ ràng nhưng làm tăng nguy cơ đột quỵ. Hãy luôn theo dõi và tham khảo ý kiến bác sĩ khi cần.
        </Text>
      </View>
    </View>
  );
}

function StatRow({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View className="flex-row items-center justify-between mb-4">
      <View className="flex-row items-center flex-1">
        <View className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: color }} />
        <Text className="text-muted-foreground text-xs flex-1 pr-2" numberOfLines={2}>{label}</Text>
      </View>
      <Text className="text-foreground text-sm">{count.toLocaleString()} lần</Text>
    </View>
  );
}
