import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Bluetooth, Activity, Flame, Footprints, Heart, Radio, Battery } from 'lucide-react-native';
import { BackgroundGradient } from '@/components/ui/BackgroundGradient';
import { LinearGradient } from 'expo-linear-gradient';
import { useBleStore } from '@/services/ble-management/bleStore';
import { MetricCard } from '@/components/ui/MetricCard';
import { useAuthStore } from '@/services/authentication/authStore';
import { AFibScreeningCard } from '@/components/features/health/AFibScreeningCard';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';

export default function HomeScreen() {
  const router = useRouter();
  const currentBPM = useBleStore(state => state.currentBPM);
  const currentSpO2 = useBleStore(state => state.currentSpO2);
  const connectedDevice = useBleStore(state => state.connectedDeviceId);
  const knownDevice = useBleStore(state => state.knownDevice);
  const batteryLevel = useBleStore(state => state.batteryLevel);
  const { user } = useAuthStore();

  const isConnected = Boolean(connectedDevice);

  return (
    <ScreenWrapper
      title="HealthSense"
      statusBarStyle="light"
      backgroundComponent={<BackgroundGradient />}
      headerRight={
        <TouchableOpacity
          onPress={() => {
            setTimeout(() => {
              router.push("/(public)/scan" as any);
            }, 50);
          }}
          className="h-10 w-10 rounded-full bg-primary/10 items-center justify-center"
        >
          <Bluetooth color="#0F67FE" size={20} />
        </TouchableOpacity>
      }
    >
      <View className="px-6 mt-6">
        {/* Interactive BLE Connection Status Card */}
        <TouchableOpacity
          onPress={() => {
            setTimeout(() => {
              router.push("/(public)/scan" as any);
            }, 50);
          }}
          activeOpacity={0.85}
          className={`rounded-3xl p-5 border shadow-sm flex-row items-center justify-between mb-6 ${isConnected
            ? 'bg-accent/10 border-accent/30'
            : knownDevice
              ? 'bg-primary/10 border-primary/20'
              : 'bg-destructive/10 border-destructive/20'
            }`}
        >
          <View className="flex-row items-center flex-1 mr-3">
            <View
              className={`h-12 w-12 rounded-2xl items-center justify-center mr-3.5 ${isConnected ? 'bg-accent/20' : 'bg-primary/20'
                }`}
            >
              <Bluetooth color={isConnected ? '#55A316' : '#0F67FE'} size={24} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Kết nối BLE
                </Text>
                {isConnected && batteryLevel !== null && (
                  <View className="flex-row items-center bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <Battery color="#10B981" size={13} className="mr-1" />
                    <Text className="text-[11px] font-bold text-emerald-600">{batteryLevel}%</Text>
                  </View>
                )}
              </View>
              <Text className="text-base font-bold text-foreground mt-0.5" numberOfLines={1}>
                {isConnected
                  ? `HuyWatch: Đã kết nối`
                  : knownDevice
                    ? `Đang kết nối lại...`
                    : `Chưa ghép đôi thiết bị`}
              </Text>
              <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
                {isConnected
                  ? 'Đang nhận dữ liệu nhịp tim & SpO2'
                  : 'Chạm vào đây để quét & kết nối đồng hồ'}
              </Text>
            </View>
          </View>

          <View className="bg-primary px-3.5 py-2 rounded-xl flex-row items-center">
            <Radio color="#FFFFFF" size={14} className="mr-1.5" />
            <Text className="text-xs font-bold text-white">
              {isConnected ? 'Đổi' : 'Kết nối'}
            </Text>
          </View>
        </TouchableOpacity>

        <Text className="text-lg font-bold text-foreground mb-4">Chỉ số hôm nay</Text>

        {/* Quick Stats Grid */}
        <View className="flex-row flex-wrap justify-between">
          <View className="w-[48%] mb-4">
            <MetricCard
              title="Nhịp tim trung bình"
              value={currentBPM > 0 ? currentBPM : '--'}
              unit="BPM"
              icon={<Heart color="#FFFFFF" size={20} />}
              colors={['#F43F5E', '#E11D48']} // rose-500 to rose-600
              unitBgColorClass="bg-rose-700/30"
              unitTextColorClass="text-rose-100"
              titleColorClass="text-rose-100"
            />
          </View>

          <View className="w-[48%] mb-4">
            <MetricCard
              title="Nồng độ Oxy (SpO2)"
              value={currentSpO2 > 0 ? currentSpO2 : '--'}
              unit="%"
              icon={<Activity color="#FFFFFF" size={20} />}
              colors={['#0EA5E9', '#2563EB']} // sky-500 to blue-600
              unitBgColorClass="bg-sky-700/30"
              unitTextColorClass="text-sky-100"
              titleColorClass="text-sky-100"
            />
          </View>

          <View className="w-[48%] mb-4">
            <MetricCard
              title="Số bước chân"
              value="7,200"
              unit="Bước"
              icon={<Footprints color="#FFFFFF" size={20} />}
              colors={['#10B981', '#0D9488']} // emerald-500 to teal-600
              unitBgColorClass="bg-emerald-700/30"
              unitTextColorClass="text-emerald-100"
              titleColorClass="text-emerald-100"
            />
          </View>

          <View className="w-[48%] mb-4">
            <MetricCard
              title="Calo tiêu thụ"
              value="450"
              unit="Kcal"
              icon={<Flame color="#FFFFFF" size={20} />}
              colors={['#F59E0B', '#EA580C']} // amber-500 to orange-600
              unitBgColorClass="bg-amber-700/30"
              unitTextColorClass="text-amber-100"
              titleColorClass="text-amber-100"
            />
          </View>
        </View>

        {/* AFib Screening Section */}
        <Text className="text-lg font-bold text-foreground mb-4 mt-2">Tầm soát Rung nhĩ (AFib)</Text>
        <AFibScreeningCard />
        <View className="h-6" />
      </View>
    </ScreenWrapper>
  );
}
