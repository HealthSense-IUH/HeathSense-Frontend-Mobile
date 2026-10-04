import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  Activity,
  Battery,
  Bluetooth,
  ChevronRight,
  Dumbbell,
  Eye,
  Flame,
  Footprints,
  Heart,
  HeartPulse,
  Sliders,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BackgroundGradient } from '@/components/ui/BackgroundGradient';
import { useBleStore } from '@/services/ble-management/bleStore';
import { MetricCard } from '@/components/ui/MetricCard';
import { useAuthStore } from '@/services/authentication/authStore';
import { AFibScreeningCard } from '@/components/features/health/AFibScreeningCard';
import { PredictionBadge } from '@/components/features/health/PredictionBadge';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { THEME } from '@/constants/theme';
import { useWorkoutCatalogStore } from '@/services/workout/workoutCatalogStore';
import { useMyRecords } from '@/hooks/useHealthHistory';
import { useHealthStatistics } from '@/hooks/useHealthStatistics';
import { getPredictionMeta } from '@/constants/healthRecords';
import { formatHrvNumber, formatRecordDate } from '@/utils/formatters';
import { currentIntlLocale } from '@/i18n';

/** Lời chào theo giờ trong ngày (giống web MemberGreetingBanner). */
function greetingByHour(hour: number, t: TFunction<'health'>): { text: string; sub: string } {
  const slot = hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'afternoon' : 'evening';
  return { text: t(`greeting.${slot}.text`), sub: t(`greeting.${slot}.subtext`) };
}

const cardShadow = { boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)' };

function StatCard({ label, icon, iconBg, value, unit, children }: { label: string; icon: React.ReactNode; iconBg: string; value: string; unit?: string; children?: React.ReactNode }) {
  return (
    <View className="w-[48%] mb-3 rounded-2xl bg-white/95 border border-slate-200/80 p-3.5" style={cardShadow}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-[11px] font-semibold text-slate-500 flex-1" numberOfLines={2}>{label}</Text>
        <View className="h-8 w-8 rounded-xl items-center justify-center" style={{ backgroundColor: iconBg }}>
          {icon}
        </View>
      </View>
      <Text className="text-2xl font-bold text-slate-900">
        {value}
        {unit ? <Text className="text-xs font-normal text-slate-500"> {unit}</Text> : null}
      </Text>
      <View className="mt-1">{children}</View>
    </View>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation('health');
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const currentBPM = useBleStore((state) => state.currentBPM);
  const currentSpO2 = useBleStore((state) => state.currentSpO2);
  const connectedDevice = useBleStore((state) => state.connectedDeviceId);
  const knownDevice = useBleStore((state) => state.knownDevice);
  const batteryLevel = useBleStore((state) => state.batteryLevel);
  // Bước / calo hôm nay = tổng các buổi tập hôm nay (đồng hồ chỉ đếm bước khi đang tập); đọc sessions để tự cập nhật
  useWorkoutCatalogStore((state) => state.sessions);
  const todayStats = useWorkoutCatalogStore.getState().getTodayStats();

  // Tổng quan như web: 5 lần đo gần nhất + thống kê tầm soát cả năm
  const { data: recentPage, isLoading: loadingRecent } = useMyRecords(1, 5);
  const [statsDate] = useState(() => new Date());
  const { data: stats } = useHealthStatistics('YEAR', statsDate);
  const recentRecords = recentPage?.content ?? [];
  const latest = recentRecords[0] ?? null;
  const latestMeta = latest ? getPredictionMeta(latest.predictionLabel, latest.status) : null;
  const latestHr = latest?.hrvFeatures?.HR_mean ? Math.round(Number(latest.hrvFeatures.HR_mean)) : null;
  const latestRmssd = latest?.hrvFeatures?.RMSSD ? Number(latest.hrvFeatures.RMSSD) : null;
  const latestSdnn = latest?.hrvFeatures?.SDNN ? Number(latest.hrvFeatures.SDNN) : null;
  const totalNormal = stats?.totalNormal || 0;
  const totalWarning = (stats?.totalAfibRisk || 0) + (stats?.totalAfibSuspected || 0);
  const totalScreenings = totalNormal + totalWarning + (stats?.totalUncertain || 0);

  const isConnected = Boolean(connectedDevice);
  const greeting = greetingByHour(statsDate.getHours(), t);
  const displayName = user?.fullName || user?.email?.split('@')[0] || t('greeting.fallbackName');
  const locale = currentIntlLocale();

  return (
    <ScreenWrapper
      title="HealthSense"
      description={`${greeting.text}, ${displayName}`}
      withBottomNav
      statusBarStyle="dark"
      backgroundComponent={<BackgroundGradient />}
      headerRight={
        <TouchableOpacity
          onPress={() => {
            setTimeout(() => {
              router.push('/(public)/scan' as any);
            }, 50);
          }}
          activeOpacity={0.8}
          className="flex-row items-center gap-1.5 py-1.5 px-3 rounded-full bg-white/90 border border-blue-100 shadow-sm"
          style={{ boxShadow: '0 2px 6px rgba(13, 110, 253, 0.08)' }}
        >
          <Bluetooth color={isConnected ? THEME.colors.statusNormal : THEME.colors.primary} size={14} strokeWidth={2.4} />
          <Text className="text-xs font-semibold" style={{ color: isConnected ? THEME.colors.statusNormal : THEME.colors.primary }}>
            {isConnected ? t('home.ble.connected') : t('home.ble.waiting')}
          </Text>
        </TouchableOpacity>
      }
    >
      <View className="px-5 mt-3">
        {/* Thẻ kết nối thiết bị đeo */}
        <TouchableOpacity
          onPress={() => {
            setTimeout(() => {
              router.push('/(public)/scan' as any);
            }, 50);
          }}
          activeOpacity={0.85}
          className="relative overflow-hidden rounded-2xl bg-white/90 border border-slate-200/80 p-4 mb-5 shadow-sm"
          style={{ boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)' }}
        >
          <View className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-blue-500/10 pointer-events-none" style={{ opacity: 0.8 }} />
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-row items-center gap-3.5 flex-1 min-w-0">
              <View className="w-12 h-12 rounded-xl flex items-center justify-center border border-blue-200/60" style={{ backgroundColor: 'rgba(13, 110, 253, 0.08)' }}>
                <Bluetooth color={isConnected ? THEME.colors.statusNormal : THEME.colors.primary} size={24} strokeWidth={2.2} />
              </View>
              <View className="flex-1 min-w-0">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{t('home.ble.sectionLabel')}</Text>
                  {isConnected && batteryLevel !== null && (
                    <View className="flex-row items-center bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Battery color={THEME.colors.statusNormal} size={13} className="mr-1" />
                      <Text className="text-[11px] font-bold text-emerald-600">{batteryLevel}%</Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm font-bold text-slate-800" numberOfLines={1}>
                  {isConnected
                    ? t('home.ble.deviceConnected', { name: knownDevice?.name || t('home.ble.defaultDeviceName') })
                    : knownDevice
                    ? t('home.ble.reconnecting')
                    : t('home.ble.notPaired')}
                </Text>
                <Text className="text-[12px] text-slate-500 mt-0.5" numberOfLines={1}>
                  {isConnected ? t('home.ble.receiving') : t('home.ble.tapToScan')}
                </Text>
              </View>
            </View>
            <LinearGradient
              colors={['#0D6EFD', '#1D4ED8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="px-3.5 py-2 rounded-xl flex-row items-center shadow-md active:opacity-80"
              style={{
                shadowColor: 'rgba(13, 110, 253, 0.3)',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 8,
                elevation: 3,
                borderRadius: 4,
              }}
            >
              <View className="w-2 h-2 rounded-full bg-emerald-300 mr-1.5 border-radius-4" />
              <Text className="text-white text-xs font-semibold">{isConnected ? t('home.ble.change') : t('home.ble.connect')}</Text>
            </LinearGradient>
          </View>
        </TouchableOpacity>

        {/* Tổng quan sức khỏe (4 thẻ như Tổng quan trên web) */}
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-lg font-bold text-slate-900 tracking-tight">{t('dashboard.title')}</Text>
            <Text className="text-xs text-slate-500">{t('dashboard.description')}</Text>
          </View>
        </View>
        <View className="flex-row flex-wrap justify-between">
          <StatCard label={t('memberDashboard.latestMeasurement')} icon={<HeartPulse size={16} color="#EF4444" />} iconBg="rgba(239, 68, 68, 0.1)" value={latestHr ? String(latestHr) : '--'} unit={t('common:units.bpm')}>
            <Text className="text-[11px] text-slate-500" numberOfLines={1}>{latest ? formatRecordDate(latest.createdAt) : loadingRecent ? t('common:state.loading') : t('common:state.noData')}</Text>
          </StatCard>
          <StatCard
            label={t('memberDashboard.afibProbability')}
            icon={<TrendingUp size={16} color="#0D6EFD" />}
            iconBg="rgba(13, 110, 253, 0.1)"
            value={latest?.confidence !== null && latest?.confidence !== undefined ? `${(latest.confidence * 100).toFixed(1)}%` : '--'}
          >
            {latestMeta ? <PredictionBadge meta={latestMeta} size="sm" /> : <Text className="text-[11px] text-slate-500">{t('memberDashboard.noAssessment')}</Text>}
          </StatCard>
          <StatCard label={t('memberDashboard.hrvRmssd')} icon={<Sliders size={16} color="#0D6EFD" />} iconBg="rgba(13, 110, 253, 0.1)" value={latestRmssd ? formatHrvNumber(latestRmssd, 1) : '--'} unit={t('common:units.ms')}>
            <Text className="text-[11px] text-slate-500">{t('memberDashboard.sdnn', { value: latestSdnn ? `${formatHrvNumber(latestSdnn, 1)} ${t('common:units.ms')}` : '--' })}</Text>
          </StatCard>
          <StatCard label={t('memberDashboard.totalScreenings')} icon={<Activity size={16} color="#10B981" />} iconBg="rgba(16, 185, 129, 0.1)" value={String(totalScreenings)} unit={t('common:units.times')}>
            <Text className="text-[11px] text-slate-500" numberOfLines={1}>{t('memberDashboard.screeningsBreakdown', { normal: totalNormal, warning: totalWarning })}</Text>
          </StatCard>
        </View>

        {/* Tầm soát rung nhĩ */}
        <Text className="text-lg font-bold text-slate-900 tracking-tight mb-3 mt-1">{t('home.afibSection')}</Text>
        <AFibScreeningCard />

        {/* Lịch sử đo gần đây (5 lần mới nhất, như web) */}
        <View className="mt-5 rounded-2xl bg-white/95 border border-slate-200/80 overflow-hidden" style={cardShadow}>
          <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-slate-100">
            <View className="flex-1">
              <Text className="text-base font-bold text-slate-900">{t('memberDashboard.recent.title')}</Text>
              <Text className="text-xs text-slate-500 mt-0.5">{t('memberDashboard.recent.description')}</Text>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/history' as any)} className="flex-row items-center active:opacity-70" style={{ gap: 2 }}>
              <Text className="text-xs font-semibold text-[#0D6EFD]">{t('common:actions.viewAll')}</Text>
              <ChevronRight size={14} color="#0D6EFD" />
            </Pressable>
          </View>
          {loadingRecent && recentRecords.length === 0 ? (
            <View className="py-8 items-center">
              <ActivityIndicator color="#0D6EFD" />
            </View>
          ) : recentRecords.length === 0 ? (
            <View className="py-8 items-center px-4" style={{ gap: 6 }}>
              <Activity size={28} color="#CBD5E1" />
              <Text className="text-xs text-slate-500 text-center">{t('memberDashboard.recent.empty')}</Text>
            </View>
          ) : (
            recentRecords.map((record, idx) => {
              const meta = getPredictionMeta(record.predictionLabel, record.status);
              const hr = record.hrvFeatures?.HR_mean ? Math.round(Number(record.hrvFeatures.HR_mean)) : null;
              const pct = record.confidence !== null && record.confidence !== undefined ? (record.confidence * 100).toFixed(1) : null;
              return (
                <Pressable
                  key={String(record.id)}
                  onPress={() => router.push(`/health-record/${record.id}` as any)}
                  className={`px-4 py-3 flex-row items-center active:bg-slate-50 ${idx < recentRecords.length - 1 ? 'border-b border-slate-100' : ''}`}
                  style={{ gap: 10 }}
                >
                  <View className="w-1.5 h-9 rounded-full" style={{ backgroundColor: meta.dot }} />
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-slate-900">{formatRecordDate(record.createdAt)}</Text>
                    <View className="flex-row items-center mt-1" style={{ gap: 6 }}>
                      <PredictionBadge meta={meta} size="sm" />
                      <Text className="text-[11px] text-slate-500">{pct !== null ? `${pct}%` : '--'}{hr ? ` • ${hr} ${t('common:units.bpm')}` : ''}</Text>
                    </View>
                  </View>
                  <Eye size={16} color="#94A3B8" />
                </Pressable>
              );
            })
          )}
        </View>

        {/* Chỉ số trực tiếp từ thiết bị + vận động (riêng của app) */}
        <View className="flex-row items-center justify-between mb-3 mt-6">
          <Text className="text-lg font-bold text-slate-900 tracking-tight">{t('home.todayMetrics.title')}</Text>
        </View>
        <View className="flex-row flex-wrap justify-between">
          <View className="w-[48%] mb-3.5">
            <MetricCard
              title={t('home.todayMetrics.currentHeartRate')}
              value={currentBPM > 0 ? currentBPM : '--'}
              unit={t('common:units.bpm')}
              icon={<Heart size={18} fill="rgba(255, 255, 255, 0.25)" strokeWidth={2} />}
              colors={['#F43F5E', '#E11D48']}
              unitBgColor="rgba(190, 18, 60, 0.45)"
              subtitleColor="#FFE4E6"
            />
          </View>
          <View className="w-[48%] mb-3.5">
            <MetricCard
              title={t('home.todayMetrics.spo2')}
              value={currentSpO2 > 0 ? currentSpO2 : '--'}
              unit={t('common:units.percent')}
              icon={<Activity size={18} strokeWidth={2.4} />}
              colors={['#0EA5E9', '#2563EB']}
              unitBgColor="rgba(30, 58, 138, 0.45)"
              subtitleColor="#E0F2FE"
            />
          </View>
          <View className="w-[48%] mb-3.5">
            <MetricCard
              title={t('home.todayMetrics.steps')}
              value={todayStats.totalSteps.toLocaleString(locale)}
              unit={t('common:units.steps')}
              icon={<Footprints size={18} strokeWidth={2.2} />}
              colors={['#10B981', '#0D9488']}
              unitBgColor="rgba(15, 118, 110, 0.45)"
              subtitleColor="#D1FAE5"
            />
          </View>
          <View className="w-[48%] mb-3.5">
            <MetricCard
              title={t('home.todayMetrics.calories')}
              value={todayStats.caloriesBurned.toLocaleString(locale)}
              unit={t('common:units.kcal')}
              icon={<Flame size={18} strokeWidth={2.2} />}
              colors={['#F59E0B', '#EA580C']}
              unitBgColor="rgba(194, 65, 12, 0.45)"
              subtitleColor="#FEF3C7"
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/nutrition' as any)}
          activeOpacity={0.8}
          className="mb-3 rounded-2xl bg-white/95 border border-slate-200/80 p-4 shadow-sm flex-row items-center justify-between"
          style={cardShadow}
        >
          <View className="flex-row items-center gap-3.5 flex-1 min-w-0">
            <View className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 items-center justify-center">
              <UtensilsCrossed color="#D97706" size={24} strokeWidth={2.2} />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-base font-bold text-slate-900 tracking-tight">{t('home.nutrition.title')}</Text>
              <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>{t('home.nutrition.description')}</Text>
            </View>
          </View>
          <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center ml-2">
            <ChevronRight color="#64748B" size={18} strokeWidth={2.4} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/workout' as any)}
          activeOpacity={0.8}
          className="mb-5 rounded-2xl bg-white/95 border border-slate-200/80 p-4 shadow-sm flex-row items-center justify-between"
          style={cardShadow}
        >
          <View className="flex-row items-center gap-3.5 flex-1 min-w-0">
            <View className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 items-center justify-center">
              <Dumbbell color="#059669" size={24} strokeWidth={2.2} />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-base font-bold text-slate-900 tracking-tight">{t('home.workout.title')}</Text>
              <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>{t('home.workout.description')}</Text>
            </View>
          </View>
          <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center ml-2">
            <ChevronRight color="#64748B" size={18} strokeWidth={2.4} />
          </View>
        </TouchableOpacity>
        <View className="h-6" />
      </View>
    </ScreenWrapper>
  );
}
