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
  Droplets,
  Dumbbell,
  Eye,
  Flame,
  Footprints,
  HeartPulse,
  UtensilsCrossed,
  Waves,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BackgroundGradient } from '@/components/ui/BackgroundGradient';
import { useBleStore } from '@/services/ble-management/bleStore';
import { useAuthStore } from '@/services/authentication/authStore';
import { AFibScreeningCard } from '@/components/features/health/AFibScreeningCard';
import { PredictionBadge } from '@/components/features/health/PredictionBadge';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { THEME } from '@/constants/theme';
import { getLocalDateStr, useWorkoutCatalogStore } from '@/services/workout/workoutCatalogStore';
import { stepTrackingService } from '@/services/workout/stepTrackingService';
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

/** Thời điểm của số liệu trên thẻ: trực tiếp từ thiết bị / cộng dồn hôm nay / lần đo gần nhất. */
type StatScope = 'live' | 'today' | 'latest';
const SCOPE_STYLE: Record<StatScope, { bg: string; text: string }> = {
  live: { bg: 'rgba(16, 185, 129, 0.12)', text: '#047857' },
  today: { bg: 'rgba(13, 110, 253, 0.10)', text: '#1D4ED8' },
  latest: { bg: '#F1F5F9', text: '#475569' },
};

function StatCard({
  label,
  icon,
  iconBg,
  scope,
  value,
  unit,
  hint,
  onPress,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  scope: StatScope;
  value?: string;
  unit?: string;
  hint?: string;
  onPress?: () => void;
  children?: React.ReactNode;
}) {
  const { t } = useTranslation('health');
  const chip = SCOPE_STYLE[scope];
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="w-[48%] mb-3 rounded-2xl bg-white/95 border border-slate-200/80 p-3.5 active:opacity-80"
      style={cardShadow}
    >
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="h-8 w-8 rounded-xl items-center justify-center" style={{ backgroundColor: iconBg }}>
          {icon}
        </View>
        <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: chip.bg }}>
          <Text className="text-[10px] font-semibold" style={{ color: chip.text }}>{t(`home.overview.scope.${scope}`)}</Text>
        </View>
      </View>
      <Text className="text-[11px] font-semibold text-slate-500" numberOfLines={1}>{label}</Text>
      {children ?? (
        <Text className="text-2xl font-bold text-slate-900 mt-0.5" numberOfLines={1}>
          {value}
          {unit ? <Text className="text-xs font-normal text-slate-500"> {unit}</Text> : null}
        </Text>
      )}
      {hint ? <Text className="text-[11px] text-slate-500 mt-1" numberOfLines={1}>{hint}</Text> : null}
    </Pressable>
  );
}

/** Ô lối tắt nửa chiều rộng (Ăn uống, Luyện tập) cùng ngôn ngữ hình ảnh với StatCard. */
function ShortcutTile({ title, description, icon, iconClassName, onPress }: { title: string; description: string; icon: React.ReactNode; iconClassName: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} className="w-[48%] rounded-2xl bg-white/95 border border-slate-200/80 p-3.5" style={cardShadow}>
      <View className="flex-row items-center justify-between mb-3">
        <View className={`w-10 h-10 rounded-xl items-center justify-center border ${iconClassName}`}>{icon}</View>
        <View className="w-7 h-7 rounded-full bg-slate-100 items-center justify-center">
          <ChevronRight color="#64748B" size={16} strokeWidth={2.4} />
        </View>
      </View>
      <Text className="text-sm font-bold text-slate-900 tracking-tight" numberOfLines={1}>{title}</Text>
      <Text className="text-[11px] text-slate-500 mt-0.5" numberOfLines={2}>{description}</Text>
    </TouchableOpacity>
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
  const sessions = useWorkoutCatalogStore((state) => state.sessions);
  const todayStats = useWorkoutCatalogStore.getState().getTodayStats();
  const stepGoal = stepTrackingService.getStoredStepGoal();
  const stepPercent = stepGoal > 0 ? Math.min(100, Math.round((todayStats.totalSteps / stepGoal) * 100)) : 0;

  // Tổng quan như web: 5 lần đo gần nhất + thống kê tầm soát cả năm
  const { data: recentPage, isLoading: loadingRecent } = useMyRecords(1, 5);
  const [statsDate] = useState(() => new Date());
  const todayKey = getLocalDateStr(statsDate);
  const todaySessionCount = sessions.filter((s) => getLocalDateStr(s.startedAt) === todayKey).length;
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
  const liveHr = isConnected && currentBPM > 0 ? currentBPM : null;
  const liveSpo2 = isConnected && currentSpO2 > 0 ? currentSpO2 : null;
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

        {/* Tổng quan sức khỏe: 6 thẻ, mỗi thẻ gắn nhãn thời điểm (trực tiếp / hôm nay / lần đo gần nhất) */}
        <View className="mb-3">
          <Text className="text-lg font-bold text-slate-900 tracking-tight">{t('home.overview.title')}</Text>
          <Text className="text-xs text-slate-500">{t('home.overview.description')}</Text>
        </View>
        <View className="flex-row flex-wrap justify-between">
          <StatCard
            label={t('home.overview.heartRate.title')}
            icon={<HeartPulse size={16} color="#EF4444" />}
            iconBg="rgba(239, 68, 68, 0.1)"
            scope={liveHr ? 'live' : 'latest'}
            value={liveHr ? String(liveHr) : latestHr ? String(latestHr) : '--'}
            unit={t('common:units.bpm')}
            hint={
              liveHr
                ? t('home.overview.heartRate.latestHint', { value: latestHr ? `${latestHr} ${t('common:units.bpm')}` : '--' })
                : latest
                ? formatRecordDate(latest.createdAt)
                : loadingRecent
                ? t('common:state.loading')
                : t('common:state.noData')
            }
            onPress={latest ? () => router.push(`/health-record/${latest.id}` as any) : undefined}
          />
          <StatCard
            label={t('home.overview.spo2.title')}
            icon={<Droplets size={16} color="#0891B2" />}
            iconBg="rgba(8, 145, 178, 0.1)"
            scope="live"
            value={liveSpo2 ? String(liveSpo2) : '--'}
            unit={t('common:units.percent')}
            hint={
              !isConnected
                ? t('home.overview.noDevice')
                : liveSpo2
                ? liveSpo2 >= 95 ? t('home.overview.spo2.normal') : t('home.overview.spo2.low')
                : t('home.overview.waitingSignal')
            }
            onPress={isConnected ? undefined : () => router.push('/(public)/scan' as any)}
          />
          <StatCard
            label={t('home.overview.afib.title')}
            icon={<Activity size={16} color="#0D6EFD" />}
            iconBg="rgba(13, 110, 253, 0.1)"
            scope="latest"
            hint={totalScreenings > 0 ? t('home.overview.afib.screenings', { total: totalScreenings, normal: totalNormal }) : t('home.overview.afib.noScreenings')}
            onPress={() => router.push('/(tabs)/history' as any)}
          >
            {latestMeta ? (
              <View className="flex-row items-center mt-1.5" style={{ gap: 6 }}>
                <PredictionBadge meta={latestMeta} size="sm" />
                {latest?.confidence !== null && latest?.confidence !== undefined ? (
                  <Text className="text-sm font-bold text-slate-900">{(latest.confidence * 100).toFixed(1)}%</Text>
                ) : null}
              </View>
            ) : (
              <Text className="text-sm font-semibold text-slate-400 mt-1.5">{t('home.overview.afib.noAssessment')}</Text>
            )}
          </StatCard>
          <StatCard
            label={t('home.overview.hrv.title')}
            icon={<Waves size={16} color="#7C3AED" />}
            iconBg="rgba(124, 58, 237, 0.1)"
            scope="latest"
            value={latestRmssd ? formatHrvNumber(latestRmssd, 1) : '--'}
            unit={t('home.overview.hrv.unit')}
            hint={t('home.overview.hrv.sdnn', { value: latestSdnn ? formatHrvNumber(latestSdnn, 1) : '--' })}
            onPress={latest ? () => router.push(`/health-record/${latest.id}` as any) : undefined}
          />
          <StatCard
            label={t('home.overview.steps.title')}
            icon={<Footprints size={16} color="#059669" />}
            iconBg="rgba(5, 150, 105, 0.1)"
            scope="today"
            value={todayStats.totalSteps.toLocaleString(locale)}
            unit={t('common:units.steps')}
            hint={t('home.overview.steps.goal', { goal: stepGoal.toLocaleString(locale), percent: stepPercent })}
            onPress={() => router.push('/workout/steps' as any)}
          />
          <StatCard
            label={t('home.overview.calories.title')}
            icon={<Flame size={16} color="#EA580C" />}
            iconBg="rgba(234, 88, 12, 0.1)"
            scope="today"
            value={todayStats.caloriesBurned.toLocaleString(locale)}
            unit={t('common:units.kcal')}
            hint={todaySessionCount > 0 ? t('home.overview.calories.sessions', { count: todaySessionCount }) : t('home.overview.calories.noSessions')}
            onPress={() => router.push('/workout' as any)}
          />
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

        {/* Chăm sóc hằng ngày: lối tắt tới Ăn uống & Luyện tập */}
        <Text className="text-lg font-bold text-slate-900 tracking-tight mb-3 mt-6">{t('home.dailyCare.title')}</Text>
        <View className="flex-row justify-between mb-5">
          <ShortcutTile
            title={t('home.nutrition.title')}
            description={t('home.nutrition.description')}
            icon={<UtensilsCrossed color="#D97706" size={20} strokeWidth={2.2} />}
            iconClassName="bg-amber-50 border-amber-100"
            onPress={() => router.push('/nutrition' as any)}
          />
          <ShortcutTile
            title={t('home.workout.title')}
            description={t('home.workout.description')}
            icon={<Dumbbell color="#059669" size={20} strokeWidth={2.2} />}
            iconClassName="bg-emerald-50 border-emerald-100"
            onPress={() => router.push('/workout' as any)}
          />
        </View>
        <View className="h-6" />
      </View>
    </ScreenWrapper>
  );
}
