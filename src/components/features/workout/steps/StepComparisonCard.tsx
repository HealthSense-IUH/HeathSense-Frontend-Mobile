import React from 'react';
import { View, Text } from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { currentIntlLocale } from '@/i18n';

interface StepComparisonCardProps {
  avgSteps: number;
  comparisonPercentile?: number;
  trendPercent?: number;
}

export const StepComparisonCard: React.FC<StepComparisonCardProps> = ({
  avgSteps,
  comparisonPercentile = 0,
  trendPercent = 0,
}) => {
  const { t } = useTranslation('workout');
  const hasData = avgSteps > 0;
  const isPositive = trendPercent >= 0;
  const progressPercent = Math.min(100, Math.max(5, comparisonPercentile));

  return (
    <View
      className="mb-8 rounded-3xl bg-white border border-slate-100 p-5 shadow-xs"
      style={{
        shadowColor: 'rgba(15, 23, 42, 0.04)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <Text className="text-base font-bold text-slate-900 mb-1">{t('steps.comparison.title')}</Text>
      <Text className="text-xs text-slate-500 mb-4">
        {t('steps.comparison.subtitle', { value: avgSteps.toLocaleString(currentIntlLocale()) })}
      </Text>

      {/* Comparison distribution indicator */}
      <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs font-semibold text-slate-700">{t('steps.comparison.activityLevel')}</Text>
          {hasData ? (
            <View className={`flex-row items-center px-2 py-0.5 rounded-full border ${isPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              {trendPercent === 0 ? (
                <Minus size={12} color="#64748B" className="mr-1" />
              ) : isPositive ? (
                <TrendingUp size={12} color="#10B981" className="mr-1" />
              ) : (
                <TrendingDown size={12} color="#EF4444" className="mr-1" />
              )}
              <Text className={`text-[10px] font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trendPercent > 0 ? `+${trendPercent}%` : `${trendPercent}%`}
              </Text>
            </View>
          ) : (
            <Text className="text-[10px] font-medium text-slate-400">--</Text>
          )}
        </View>

        <View className="h-3 bg-slate-200/80 rounded-full overflow-hidden mb-2">
          <View
            className="h-full bg-[#00C8FF] rounded-full"
            style={{ width: `${hasData ? progressPercent : 0}%` }}
          />
        </View>

        <Text className="text-[11px] text-slate-500 leading-relaxed">
          {hasData
            ? t('steps.comparison.note', { percent: comparisonPercentile })
            : t('steps.comparison.noData', { defaultValue: 'Chưa có đủ dữ liệu để so sánh với cộng đồng HealthSense trong tuần này.' })}
        </Text>
      </View>
    </View>
  );
};
