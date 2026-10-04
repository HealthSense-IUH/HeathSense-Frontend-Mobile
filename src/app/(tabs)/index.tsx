import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
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

/** Lời chào theo giờ trong ngày (giống web MemberGreetingBanner). */
function greetingByHour(hour: number): { text: string; sub: string } {
  if (hour >= 5 && hour < 12) return { text: 'Chào buổi sáng', sub: 'Bắt đầu ngày mới với nhịp tim ổn định nhé.' };
  if (hour >= 12 && hour < 18) return { text: 'Chào buổi chiều', sub: 'Hãy dành vài phút đo nhịp tim để theo dõi sức khỏe.' };
  return { text: 'Chào buổi tối', sub: 'Nghỉ ngơi và đo lại khi cơ thể thư giãn nhé.' };
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
  const { data: stats } = useHealthStatistics('Năm', statsDate);
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
  const greeting = greetingByHour(statsDate.getHours());
  const displayName = user?.fullName || user?.email?.split('@')[0] || 'Bạn';

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
            {isConnected ? 'Đã kết nối' : 'Chờ kết nối'}
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
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">KẾT NỐI BLE</Text>
                  {isConnected && batteryLevel !== null && (
                    <View className="flex-row items-center bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Battery color={THEME.colors.statusNormal} size={13} className="mr-1" />
                      <Text className="text-[11px] font-bold text-emerald-600">{batteryLevel}%</Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm font-bold text-slate-800" numberOfLines={1}>
                  {isConnected ? `${knownDevice?.name || 'Thiết bị đeo'}: Đã kết nối` : knownDevice ? 'Đang kết nối lại...' : 'Chưa ghép đôi thiết bị'}
                </Text>
                <Text className="text-[12px] text-slate-500 mt-0.5" numberOfLines={1}>
                  {isConnected ? 'Đang nhận dữ liệu nhịp tim & SpO2' : 'Chạm vào đây để quét & kết nối ...'}
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
              <Text className="text-white text-xs font-semibold">{isConnected ? 'Đổi' : 'Kết nối'}</Text>
            </LinearGradient>
          </View>
        </TouchableOpacity>

        {/* Tổng quan sức khỏe (4 thẻ như Tổng quan trên web) */}
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-lg font-bold text-slate-900 tracking-tight">Tổng quan sức khỏe</Text>
            <Text className="text-xs text-slate-500">Chỉ số tim mạch mới nhất và các lần tầm soát rung nhĩ</Text>
          </View>
        </View>
        <View className="flex-row flex-wrap justify-between">
          <StatCard label="Lần đo gần nhất" icon={<HeartPulse size={16} color="#EF4444" />} iconBg="rgba(239, 68, 68, 0.1)" value={latestHr ? String(latestHr) : '--'} unit="BPM">
            <Text className="text-[11px] text-slate-500" numberOfLines={1}>{latest ? formatRecordDate(latest.createdAt) : loadingRecent ? 'Đang tải...' : 'Chưa có dữ liệu'}</Text>
          </StatCard>
          <StatCard
            label="Khả năng bị rung nhĩ"
            icon={<TrendingUp size={16} color="#0D6EFD" />}
            iconBg="rgba(13, 110, 253, 0.1)"
            value={latest?.confidence !== null && latest?.confidence !== undefined ? `${(latest.confidence * 100).toFixed(1)}%` : '--'}
          >
            {latestMeta ? <PredictionBadge meta={latestMeta} size="sm" /> : <Text className="text-[11px] text-slate-500">Chưa có đánh giá</Text>}
          </StatCard>
          <StatCard label="Biến thiên nhịp (RMSSD)" icon={<Sliders size={16} color="#0D6EFD" />} iconBg="rgba(13, 110, 253, 0.1)" value={latestRmssd ? formatHrvNumber(latestRmssd, 1) : '--'} unit="ms">
            <Text className="text-[11px] text-slate-500">SDNN: {latestSdnn ? `${formatHrvNumber(latestSdnn, 1)} ms` : '--'}</Text>
          </StatCard>
          <StatCard label="Tổng lượt tầm soát" icon={<Activity size={16} color="#10B981" />} iconBg="rgba(16, 185, 129, 0.1)" value={String(totalScreenings)} unit="lần">
            <Text className="text-[11px] text-slate-500" numberOfLines={1}>{totalNormal} bình thường • {totalWarning} cảnh báo</Text>
          </StatCard>
        </View>

        {/* Tầm soát rung nhĩ */}
        <Text className="text-lg font-bold text-slate-900 tracking-tight mb-3 mt-1">Tầm soát Rung nhĩ (AFib)</Text>
        <AFibScreeningCard />

        {/* Lịch sử đo gần đây (5 lần mới nhất, như web) */}
        <View className="mt-5 rounded-2xl bg-white/95 border border-slate-200/80 overflow-hidden" style={cardShadow}>
          <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-slate-100">
            <View className="flex-1">
              <Text className="text-base font-bold text-slate-900">Lịch sử Đo Gần Đây</Text>
              <Text className="text-xs text-slate-500 mt-0.5">5 lần đo mới nhất của bạn trên hệ thống</Text>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/history' as any)} className="flex-row items-center active:opacity-70" style={{ gap: 2 }}>
              <Text className="text-xs font-semibold text-[#0D6EFD]">Xem tất cả</Text>
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
              <Text className="text-xs text-slate-500 text-center">Chưa có bản ghi đo nào. Hãy đo bằng thiết bị HealthSense để bắt đầu!</Text>
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
                      <Text className="text-[11px] text-slate-500">{pct !== null ? `${pct}%` : '--'}{hr ? ` • ${hr} BPM` : ''}</Text>
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
          <Text className="text-lg font-bold text-slate-900 tracking-tight">Chỉ số hôm nay</Text>
        </View>
        <View className="flex-row flex-wrap justify-between">
          <View className="w-[48%] mb-3.5">
            <MetricCard
              title="Nhịp tim hiện tại"
              value={currentBPM > 0 ? currentBPM : '--'}
              unit="BPM"
              icon={<Heart size={18} fill="rgba(255, 255, 255, 0.25)" strokeWidth={2} />}
              colors={['#F43F5E', '#E11D48']}
              unitBgColor="rgba(190, 18, 60, 0.45)"
              subtitleColor="#FFE4E6"
            />
          </View>
          <View className="w-[48%] mb-3.5">
            <MetricCard
              title="Nồng độ Oxy (SpO2)"
              value={currentSpO2 > 0 ? currentSpO2 : '--'}
              unit="%"
              icon={<Activity size={18} strokeWidth={2.4} />}
              colors={['#0EA5E9', '#2563EB']}
              unitBgColor="rgba(30, 58, 138, 0.45)"
              subtitleColor="#E0F2FE"
            />
          </View>
          <View className="w-[48%] mb-3.5">
            <MetricCard
              title="Số bước chân"
              value={todayStats.totalSteps.toLocaleString('vi-VN')}
              unit="Bước"
              icon={<Footprints size={18} strokeWidth={2.2} />}
              colors={['#10B981', '#0D9488']}
              unitBgColor="rgba(15, 118, 110, 0.45)"
              subtitleColor="#D1FAE5"
            />
          </View>
          <View className="w-[48%] mb-3.5">
            <MetricCard
              title="Calo tiêu thụ"
              value={todayStats.caloriesBurned.toLocaleString('vi-VN')}
              unit="Kcal"
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
              <Text className="text-base font-bold text-slate-900 tracking-tight">Ăn uống & Dinh dưỡng</Text>
              <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>Gợi ý thực phẩm tốt cho tim mạch và đơn ăn uống</Text>
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
              <Text className="text-base font-bold text-slate-900 tracking-tight">Trung tâm luyện tập</Text>
              <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>Bắt đầu buổi tập, theo dõi nhịp tim & calo</Text>
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
