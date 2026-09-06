import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Bluetooth, Activity, Flame, Footprints, Heart, Battery, Settings } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BackgroundGradient } from '@/components/ui/BackgroundGradient';

import { useBleStore } from '@/services/ble-management/bleStore';
import { MetricCard } from '@/components/ui/MetricCard';
import { useAuthStore } from '@/services/authentication/authStore';
import { AFibScreeningCard } from '@/components/features/health/AFibScreeningCard';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { THEME } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const currentBPM = useBleStore(state => state.currentBPM);
  const currentSpO2 = useBleStore(state => state.currentSpO2);
  const connectedDevice = useBleStore(state => state.connectedDeviceId);
  const knownDevice = useBleStore(state => state.knownDevice);
  const batteryLevel = useBleStore(state => state.batteryLevel);
  useAuthStore();

  const isConnected = Boolean(connectedDevice);

  return (
    <ScreenWrapper
      title="HealthSense"
      statusBarStyle="dark"
      backgroundComponent={<BackgroundGradient />}
      headerRight={
        <TouchableOpacity
          onPress={() => {
            setTimeout(() => {
              router.push("/(public)/scan" as any);
            }, 50);
          }}
          activeOpacity={0.8}
          className="flex-row items-center gap-1.5 py-1.5 px-3 rounded-full bg-white/90 border border-blue-100 shadow-sm"
          style={{
            shadowColor: 'rgba(13, 110, 253, 0.08)',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <Bluetooth
            color={isConnected ? THEME.colors.statusNormal : THEME.colors.primary}
            size={14}
            strokeWidth={2.4}
          />
          <Text
            className="text-xs font-semibold"
            style={{ color: isConnected ? THEME.colors.statusNormal : THEME.colors.primary }}
          >
            {isConnected ? 'Đã kết nối' : 'Chờ kết nối'}
          </Text>
        </TouchableOpacity>
      }
    >
      <View className="px-5 mt-3">
        {/* Interactive BLE Connection Status Card (Stitch Specs) */}
        <TouchableOpacity
          onPress={() => {
            setTimeout(() => {
              router.push("/(public)/scan" as any);
            }, 50);
          }}
          activeOpacity={0.85}
          className="relative overflow-hidden rounded-2xl bg-white/90 border border-slate-200/80 p-4 mb-5 shadow-sm"
          style={{
            shadowColor: 'rgba(15, 23, 42, 0.06)',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 16,
            elevation: 3,
          }}
        >
          {/* Ambient gradient behind card */}
          <View
            className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-blue-500/10 pointer-events-none"
            style={{ opacity: 0.8 }}
          />

          <View className="flex-row items-center justify-between gap-3">
            {/* Icon & Status Information */}
            <View className="flex-row items-center gap-3.5 flex-1 min-w-0">
              {/* Rounded Bluetooth Badge */}
              <View
                className="w-12 h-12 rounded-xl flex items-center justify-center border border-blue-200/60"
                style={{ backgroundColor: 'rgba(13, 110, 253, 0.08)' }}
              >
                <Bluetooth
                  color={isConnected ? THEME.colors.statusNormal : THEME.colors.primary}
                  size={24}
                  strokeWidth={2.2}
                />
              </View>

              {/* Texts */}
              <View className="flex-1 min-w-0">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                    KẾT NỐI BLE
                  </Text>
                  {isConnected && batteryLevel !== null && (
                    <View className="flex-row items-center bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Battery color={THEME.colors.statusNormal} size={13} className="mr-1" />
                      <Text className="text-[11px] font-bold text-emerald-600">{batteryLevel}%</Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm font-bold text-slate-800" numberOfLines={1}>
                  {isConnected
                    ? `${knownDevice?.name || 'HuyWatch'}: Đã kết nối`
                    : knownDevice
                      ? 'Đang kết nối lại...'
                      : 'Chưa ghép đôi thiết bị'}
                </Text>
                <Text className="text-[12px] text-slate-500 mt-0.5" numberOfLines={1}>
                  {isConnected
                    ? 'Đang nhận dữ liệu nhịp tim & SpO2'
                    : 'Chạm vào đây để quét & kết nối ...'}
                </Text>
              </View>
            </View>

            {/* Action Button: Gradient Blue with ping indicator */}
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
              <Text className="text-white text-xs font-semibold">
                {isConnected ? 'Đổi' : 'Kết nối'}
              </Text>
            </LinearGradient>
          </View>
        </TouchableOpacity>

        {/* Section Header with Quick Settings Gear Button */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-slate-900 tracking-tight">Chỉ số hôm nay</Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/smart-health' as any)}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-sm items-center justify-center active:opacity-80"
            style={{
              shadowColor: 'rgba(15, 23, 42, 0.05)',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 1,
              shadowRadius: 6,
              elevation: 1,
            }}
            aria-label="Cài đặt chỉ số"
          >
            <Settings color="#64748B" size={16} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* 2x2 Metrics Grid (100% Stitch Gradient Cards) */}
        <View className="flex-row flex-wrap justify-between">
          {/* Card 1: Nhịp tim trung bình */}
          <View className="w-[48%] mb-3.5">
            <MetricCard
              title="Nhịp tim trung bình"
              value={currentBPM > 0 ? currentBPM : '--'}
              unit="BPM"
              icon={<Heart size={18} fill="rgba(255, 255, 255, 0.25)" strokeWidth={2} />}
              colors={['#F43F5E', '#E11D48']}
              unitBgColor="rgba(190, 18, 60, 0.45)"
              subtitleColor="#FFE4E6"
            />
          </View>

          {/* Card 2: Nồng độ Oxy (SpO2) */}
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

          {/* Card 3: Số bước chân */}
          <View className="w-[48%] mb-3.5">
            <MetricCard
              title="Số bước chân"
              value="7,200"
              unit="Bước"
              icon={<Footprints size={18} strokeWidth={2.2} />}
              colors={['#10B981', '#0D9488']}
              unitBgColor="rgba(15, 118, 110, 0.45)"
              subtitleColor="#D1FAE5"
            />
          </View>

          {/* Card 4: Calo tiêu thụ */}
          <View className="w-[48%] mb-3.5">
            <MetricCard
              title="Calo tiêu thụ"
              value="450"
              unit="Kcal"
              icon={<Flame size={18} strokeWidth={2.2} />}
              colors={['#F59E0B', '#EA580C']}
              unitBgColor="rgba(194, 65, 12, 0.45)"
              subtitleColor="#FEF3C7"
            />
          </View>
        </View>

        {/* AFib Screening Section */}
        <Text className="text-lg font-bold text-slate-900 tracking-tight mb-3 mt-2">
          Tầm soát Rung nhĩ (AFib)
        </Text>
        <AFibScreeningCard />
        <View className="h-6" />
      </View>
    </ScreenWrapper>
  );
}

