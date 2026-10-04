import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ActivityIndicator, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Settings, Info, Plus } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BarChart } from 'react-native-gifted-charts';
import { Trans, useTranslation } from 'react-i18next';
import { TimeFilterTabs } from '@/components/features/health/statistics/TimeFilterTabs';
import { PeriodSelector } from '@/components/features/health/statistics/PeriodSelector';
import { ChartLegend } from '@/components/features/health/statistics/ChartLegend';
import { SummaryDonutChart } from '@/components/features/health/statistics/SummaryDonutChart';
import { useHealthStatistics, type StatisticsPeriod } from '@/hooks/useHealthStatistics';
import { currentIntlLocale } from '@/i18n';

const STAT_COLORS = {
  NORMAL: '#10B981',
  UNCERTAIN: '#94A3B8',
  AFIB_SUSPECTED: '#F59E0B',
  AFIB_RISK: '#EF4444',
};

export default function AFibAnalysisDetailsScreen() {
  const { t } = useTranslation('health');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<StatisticsPeriod>('DAY');
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
    if (activeFilter === 'DAY') newDate.setDate(newDate.getDate() - 1);
    else if (activeFilter === 'WEEK') newDate.setDate(newDate.getDate() - 7);
    else if (activeFilter === 'MONTH') newDate.setMonth(newDate.getMonth() - 1);
    else if (activeFilter === 'YEAR') newDate.setFullYear(newDate.getFullYear() - 1);
    setReferenceDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(referenceDate);
    if (activeFilter === 'DAY') newDate.setDate(newDate.getDate() + 1);
    else if (activeFilter === 'WEEK') newDate.setDate(newDate.getDate() + 7);
    else if (activeFilter === 'MONTH') newDate.setMonth(newDate.getMonth() + 1);
    else if (activeFilter === 'YEAR') newDate.setFullYear(newDate.getFullYear() + 1);
    setReferenceDate(newDate);
  };

  // Nhãn kỳ đang xem tính từ referenceDate (không cố định "Hôm nay/Tuần này" khi đã lùi sang kỳ trước)
  const periodText = useMemo(() => {
    const d = referenceDate;
    const locale = currentIntlLocale();
    const dayMonth = (x: Date) => x.toLocaleDateString(locale, { day: 'numeric', month: 'numeric' });
    if (activeFilter === 'DAY') return t('analysis.period.day', { date: dayMonth(d) });
    if (activeFilter === 'WEEK') {
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return `${dayMonth(monday)} - ${dayMonth(sunday)}`;
    }
    if (activeFilter === 'MONTH') {
      return t('analysis.period.month', { month: d.getMonth() + 1, year: d.getFullYear(), monthName: t(`heatmap.months.${d.getMonth()}`) });
    }
    return t('analysis.period.year', { year: d.getFullYear() });
  }, [activeFilter, referenceDate, t]);

  const badgeLabel = useMemo(() => {
    const now = new Date();
    const d = referenceDate;
    const sameYear = d.getFullYear() === now.getFullYear();
    const sameMonth = sameYear && d.getMonth() === now.getMonth();
    const startOfWeek = (x: Date) => {
      const m = new Date(x.getFullYear(), x.getMonth(), x.getDate());
      m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
      return m.getTime();
    };
    if (activeFilter === 'DAY') return sameMonth && d.getDate() === now.getDate() ? t('common:date.today') : periodText;
    if (activeFilter === 'WEEK') return startOfWeek(d) === startOfWeek(now) ? t('analysis.badge.thisWeek') : periodText;
    if (activeFilter === 'MONTH') return sameMonth ? t('analysis.badge.thisMonth') : periodText;
    return sameYear ? t('analysis.badge.thisYear') : periodText;
  }, [activeFilter, referenceDate, periodText, t]);

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
      if (activeFilter === 'MONTH') {
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
      t('analysis.settingsAlert.title'),
      t('analysis.settingsAlert.message'),
      [
        {
          text: t('analysis.settingsAlert.measureNow'),
          onPress: () => router.push('/afib-measure' as any),
        },
        { text: t('common:actions.close'), style: 'cancel' },
      ]
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View className="py-20 justify-center items-center">
          <ActivityIndicator size="large" color="#0D6EFD" />
          <Text className="mt-4 text-slate-500 font-medium text-sm">{t('common:state.loading')}</Text>
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
          <Text className="mt-4 text-slate-500 font-medium text-sm">{t('analysis.preparingChart')}</Text>
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
          barWidth={activeFilter === 'MONTH' ? 6 : (activeFilter === 'DAY' ? 8 : 12)}
          spacing={activeFilter === 'MONTH' ? 4 : (activeFilter === 'DAY' ? 8 : 16)}
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
          <Text className="text-slate-400 font-medium text-xs">{t('analysis.emptyRange')}</Text>
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
              <Trans
                t={t}
                i18nKey="analysis.summary"
                values={{ riskCount: data?.totalAfibRisk || 0 }}
                components={{ b: <Text className="font-bold text-slate-900" /> }}
              />
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
            {t('analysis.clinicalNote')}
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
              {t('analysis.measureNowCta')}
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
            aria-label={t('common:actions.back')}
          >
            <ChevronLeft color="#334155" size={20} strokeWidth={2.4} />
          </Pressable>

          {/* Main Title */}
          <Text className="text-xl font-extrabold text-slate-900 tracking-tight text-center flex-1 pr-1">
            {t('analysis.title')}
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
            aria-label={t('common:tabs.settings')}
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


