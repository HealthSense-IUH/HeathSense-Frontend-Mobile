import React from 'react';
import { View, Text } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Check, AlertTriangle, ShieldAlert } from 'lucide-react-native';

interface SummaryStats {
  normal: number;
  uncertain: number;
  afibSuspected: number;
  afibRisk: number;
}

interface SummaryDonutChartProps {
  total: number;
  stats: SummaryStats;
  badgeLabel?: string;
}

const STAT_COLORS = {
  NORMAL: '#10B981',
  UNCERTAIN: '#94A3B8',
  AFIB_SUSPECTED: '#F59E0B',
  AFIB_RISK: '#EF4444',
};

export function SummaryDonutChart({ total, stats, badgeLabel = 'Hôm nay' }: SummaryDonutChartProps) {
  const pieData = [
    { value: stats.normal || (total === 0 ? 1 : 0), color: STAT_COLORS.NORMAL },
    { value: stats.afibRisk, color: STAT_COLORS.AFIB_RISK },
    { value: stats.afibSuspected, color: STAT_COLORS.AFIB_SUSPECTED },
    { value: stats.uncertain, color: STAT_COLORS.UNCERTAIN },
  ].filter(item => item.value > 0);

  const hasRisk = stats.afibRisk > 0;
  const hasSuspected = stats.afibSuspected > 0;

  return (
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
      {/* Card Title */}
      <View className="flex-row items-center justify-between pb-4 border-b border-slate-100">
        <View className="flex-row items-baseline space-x-1.5">
          <Text className="text-sm font-semibold text-slate-600 mr-1">Tổng số lần kiểm tra</Text>
          <Text className="text-2xl font-extrabold text-slate-900 mr-1">{total.toLocaleString()}</Text>
          <Text className="text-xs font-semibold text-slate-500">lần</Text>
        </View>
        <View className="bg-blue-50 px-2.5 py-1 rounded-full">
          <Text className="text-[11px] font-semibold text-brand-600">{badgeLabel}</Text>
        </View>
      </View>

      {/* Breakdown Section */}
      <View className="mt-5 flex-row items-center">
        {/* Donut Chart Container */}
        <View className="w-28 h-28 shrink-0 flex items-center justify-center relative">
          <PieChart
            donut
            innerRadius={36}
            radius={52}
            data={pieData}
            centerLabelComponent={() => null}
            backgroundColor="transparent"
          />
          <View className="absolute inset-0 flex-col items-center justify-center pointer-events-none">
            {hasRisk ? (
              <>
                <ShieldAlert color="#EF4444" size={20} strokeWidth={2.4} />
                <Text className="text-[10px] font-bold text-rose-600 mt-0.5">Nguy cơ</Text>
              </>
            ) : hasSuspected ? (
              <>
                <AlertTriangle color="#F59E0B" size={20} strokeWidth={2.4} />
                <Text className="text-[10px] font-bold text-amber-600 mt-0.5">Nghi ngờ</Text>
              </>
            ) : (
              <>
                <Check color="#10B981" size={22} strokeWidth={2.6} />
                <Text className="text-[10px] font-bold text-slate-600 mt-0.5">Ổn định</Text>
              </>
            )}
          </View>
        </View>

        {/* Counter Details Column */}
        <View className="ml-4 flex-1 space-y-2.5">
          <StatRow 
            label="Nguy cơ rung tâm nhĩ" 
            count={stats.afibRisk} 
            color={STAT_COLORS.AFIB_RISK} 
          />
          <StatRow 
            label="Nghi ngờ rung tâm nhĩ" 
            count={stats.afibSuspected} 
            color={STAT_COLORS.AFIB_SUSPECTED} 
          />
          <StatRow 
            label="Không rõ ràng" 
            count={stats.uncertain} 
            color={STAT_COLORS.UNCERTAIN} 
          />
          <StatRow 
            label="Không có bất thường" 
            count={stats.normal} 
            color={STAT_COLORS.NORMAL} 
          />
        </View>
      </View>
    </View>
  );
}

function StatRow({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View className="flex-row items-center justify-between mb-2.5">
      <View className="flex-row items-center flex-1 space-x-1.5 pr-2">
        <View className="w-2 h-2 rounded-full shrink-0 mr-1.5" style={{ backgroundColor: color }} />
        <Text className="text-slate-600 text-xs" numberOfLines={1}>{label}</Text>
      </View>
      <Text className="font-bold text-slate-900 text-xs">
        {count.toLocaleString()} <Text className="text-[11px] font-normal text-slate-400">lần</Text>
      </Text>
    </View>
  );
}

