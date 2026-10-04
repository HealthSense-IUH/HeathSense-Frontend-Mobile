import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { Activity, BarChart3, ChevronLeft, ChevronRight, Droplets, HeartPulse, RefreshCw } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { getMyRecordsApi } from '@/services/health-records';
import { useHealthStatistics } from '@/hooks/useHealthStatistics';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { formatHrvNumber } from '@/utils/formatters';
import type { HealthRecordResponse } from '@/types/health-records';

const shadow = { boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)' };

interface DayPoint {
  date: string;
  avg: number;
  min: number;
  max: number;
}

/** Gom các phép đo theo ngày: trung bình / thấp nhất / cao nhất (giống web reports), lấy 14 ngày có dữ liệu gần nhất. */
function buildTrend(records: HealthRecordResponse[]): DayPoint[] {
  const byDay = new Map<string, { hr: number[]; min: number[]; max: number[] }>();
  records.forEach((r) => {
    const f = r.hrvFeatures;
    if (r.status !== 'COMPLETED' || typeof f?.HR_mean !== 'number') return;
    const day = r.createdAt.slice(0, 10);
    const bucket = byDay.get(day) ?? { hr: [], min: [], max: [] };
    bucket.hr.push(f.HR_mean);
    if (typeof f.hrMin === 'number') bucket.min.push(f.hrMin);
    if (typeof f.hrMax === 'number') bucket.max.push(f.hrMax);
    byDay.set(day, bucket);
  });
  return [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([date, b]) => {
      const avg = b.hr.reduce((s, v) => s + v, 0) / b.hr.length;
      return {
        date,
        avg,
        min: b.min.length ? Math.min(...b.min) : avg,
        max: b.max.length ? Math.max(...b.max) : avg,
      };
    });
}

/** Biểu đồ đường 3 chuỗi (cao nhất / trung bình / thấp nhất) vẽ bằng SVG. */
function TrendChart({ points, width }: { points: DayPoint[]; width: number }) {
  const H = 200;
  const M = { left: 34, right: 12, top: 12, bottom: 26 };
  if (width <= 0 || points.length === 0) return <View style={{ height: H }} />;
  const plotW = width - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const all = points.flatMap((p) => [p.avg, p.min, p.max]);
  const lo = Math.max(0, Math.floor((Math.min(...all) - 5) / 10) * 10);
  const hi = Math.ceil((Math.max(...all) + 5) / 10) * 10;
  const sx = (i: number) => M.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const sy = (v: number) => M.top + plotH - ((v - lo) / Math.max(1, hi - lo)) * plotH;
  const line = (key: keyof DayPoint) => points.map((p, i) => `${sx(i)},${sy(p[key] as number)}`).join(' ');
  const ticks = [0, 1, 2, 3, 4].map((i) => Math.round(lo + ((hi - lo) * i) / 4));
  const labelEvery = Math.max(1, Math.ceil(points.length / 5));

  return (
    <Svg width={width} height={H}>
      {ticks.map((t) => (
        <React.Fragment key={t}>
          <Line x1={M.left} y1={sy(t)} x2={M.left + plotW} y2={sy(t)} stroke="#E2E8F0" strokeWidth={1} />
          <SvgText x={M.left - 6} y={sy(t) + 3} fontSize={9} fill="#64748B" textAnchor="end">{t}</SvgText>
        </React.Fragment>
      ))}
      <Polyline points={line('max')} fill="none" stroke="#EF4444" strokeWidth={1.5} />
      <Polyline points={line('min')} fill="none" stroke="#94A3B8" strokeWidth={1.5} />
      <Polyline points={line('avg')} fill="none" stroke="#0D6EFD" strokeWidth={2.5} />
      {points.map((p, i) => (
        <Circle key={p.date} cx={sx(i)} cy={sy(p.avg)} r={3} fill="#0D6EFD" />
      ))}
      {points.map((p, i) =>
        i % labelEvery === 0 || i === points.length - 1 ? (
          <SvgText key={`l-${p.date}`} x={sx(i)} y={H - 8} fontSize={9} fill="#64748B" textAnchor="middle">
            {p.date.slice(5).replace('-', '/')}
          </SvgText>
        ) : null
      )}
    </Svg>
  );
}

/** Báo cáo sức khỏe — tương ứng trang Báo cáo của web: trung bình các chỉ số, tầm soát 30 ngày, xu hướng nhịp tim. */
export default function ReportsScreen() {
  const { t } = useTranslation('health');
  const router = useRouter();
  const [chartWidth, setChartWidth] = useState(0);
  const [statsDate] = useState(() => new Date());
  const { data: page, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.HEALTH_RECORDS, 'reports', 100],
    queryFn: () => getMyRecordsApi(1, 100),
  });
  const { data: stats } = useHealthStatistics('MONTH', statsDate);

  const completed = useMemo(() => (page?.content ?? []).filter((r) => r.status === 'COMPLETED'), [page]);
  const avg = (pick: (r: HealthRecordResponse) => number | undefined) => {
    const values = completed.map(pick).filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    return values.length ? values.reduce((s, v) => s + v, 0) / values.length : null;
  };
  const avgHr = avg((r) => r.hrvFeatures?.HR_mean);
  const avgSpo2 = avg((r) => r.hrvFeatures?.deviceSpO2);
  const avgRmssd = avg((r) => r.hrvFeatures?.RMSSD);
  const trend = useMemo(() => buildTrend(completed), [completed]);
  const screeningTotal = (stats?.totalNormal || 0) + (stats?.totalUncertain || 0) + (stats?.totalAfibSuspected || 0) + (stats?.totalAfibRisk || 0);

  const cards = [
    { label: t('reports.avgHeartRate'), value: avgHr != null ? formatHrvNumber(avgHr, 0) : '--', unit: t('common:units.bpm'), hint: t('reports.heartRateReference'), Icon: HeartPulse, color: '#EF4444' },
    { label: t('reports.avgSpo2'), value: avgSpo2 != null ? formatHrvNumber(avgSpo2, 1) : '--', unit: t('common:units.percent'), hint: avgSpo2 != null ? t('reports.spo2Reference') : t('reports.spo2NoData'), Icon: Droplets, color: '#0EA5E9' },
    { label: t('reports.avgHrv'), value: avgRmssd != null ? formatHrvNumber(avgRmssd, 1) : '--', unit: t('common:units.ms'), hint: t('reports.hrvHint'), Icon: Activity, color: '#0D6EFD' },
  ];
  const screening = [
    { label: t('reports.screening.normal'), value: stats?.totalNormal || 0, color: '#059669' },
    { label: t('reports.screening.uncertain'), value: stats?.totalUncertain || 0, color: '#D97706' },
    { label: t('reports.screening.afibSuspected'), value: stats?.totalAfibSuspected || 0, color: '#D97706' },
    { label: t('reports.screening.afib'), value: stats?.totalAfibRisk || 0, color: '#DC2626' },
  ];

  return (
    <ScreenWrapper
      title={t('reports.title')}
      description={t('reports.description', { count: completed.length })}
      headerLeft={
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/history' as any))} className="h-10 w-10 items-center justify-center bg-muted rounded-full active:opacity-70" aria-label={t('common:actions.back')}>
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
      }
      headerRight={
        <Pressable onPress={() => refetch()} className="h-10 w-10 items-center justify-center bg-white border border-slate-200/80 rounded-full active:opacity-70" aria-label={t('common:actions.refresh')}>
          {isFetching && !isLoading ? <ActivityIndicator size="small" color="#0D6EFD" /> : <RefreshCw size={18} color="#64748B" />}
        </Pressable>
      }
    >
      <View className="px-5 pb-10 mt-2" style={{ gap: 14 }}>
        {error ? (
          <View className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
            <Text className="text-rose-700 text-xs font-semibold">{t('reports.loadError')}</Text>
          </View>
        ) : null}

        {isLoading ? (
          <View className="py-16 items-center">
            <ActivityIndicator size="large" color="#0D6EFD" />
          </View>
        ) : (
          <>
            {cards.map((c) => (
              <View key={c.label} className="bg-white rounded-2xl border border-slate-200/70 p-4 flex-row items-center" style={{ gap: 14, ...shadow }}>
                <View className="h-11 w-11 rounded-xl items-center justify-center" style={{ backgroundColor: `${c.color}1A` }}>
                  <c.Icon size={22} color={c.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-500">{c.label}</Text>
                  <Text className="text-2xl font-bold text-slate-900 mt-0.5">
                    {c.value} <Text className="text-xs font-normal text-slate-500">{c.unit}</Text>
                  </Text>
                  <Text className="text-[11px] text-slate-500">{c.hint}</Text>
                </View>
              </View>
            ))}

            {screeningTotal > 0 ? (
              <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                {screening.map((s) => (
                  <View key={s.label} className="bg-white rounded-2xl border border-slate-200/70 p-3.5" style={{ width: '48%', flexGrow: 1, ...shadow }}>
                    <Text className="text-[11px] font-semibold text-slate-500">{s.label}</Text>
                    <Text className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</Text>
                    <Text className="text-[10px] text-slate-500">{t('reports.screening.per30Days')}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View className="bg-white rounded-2xl border border-slate-200/70 p-4" style={shadow}>
              <Text className="text-base font-bold text-slate-900">{t('reports.trend.title')}</Text>
              <Text className="text-xs text-slate-500 mt-0.5">{t('reports.trend.description')}</Text>
              <View className="mt-3" onLayout={(e: LayoutChangeEvent) => setChartWidth(Math.floor(e.nativeEvent.layout.width))}>
                {trend.length === 0 ? (
                  <Text className="text-xs text-slate-500 text-center py-10">{t('reports.trend.empty')}</Text>
                ) : (
                  <TrendChart points={trend} width={chartWidth} />
                )}
              </View>
              <View className="flex-row justify-center mt-2" style={{ gap: 14 }}>
                {[
                  { label: t('reports.trend.max'), color: '#EF4444' },
                  { label: t('reports.trend.avg'), color: '#0D6EFD' },
                  { label: t('reports.trend.min'), color: '#94A3B8' },
                ].map((l) => (
                  <View key={l.label} className="flex-row items-center" style={{ gap: 4 }}>
                    <View className="w-3 h-1 rounded-full" style={{ backgroundColor: l.color }} />
                    <Text className="text-[11px] text-slate-500">{l.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Pressable onPress={() => router.push('/afib-analysis-details' as any)} className="bg-white rounded-2xl border border-slate-200/70 p-4 flex-row items-center active:opacity-80" style={{ gap: 12, ...shadow }}>
              <View className="h-10 w-10 rounded-xl bg-primary/10 items-center justify-center">
                <BarChart3 size={20} color="#0D6EFD" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900">{t('reports.periodAnalysis.title')}</Text>
                <Text className="text-xs text-slate-500">{t('reports.periodAnalysis.description')}</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </Pressable>
          </>
        )}
      </View>
    </ScreenWrapper>
  );
}
