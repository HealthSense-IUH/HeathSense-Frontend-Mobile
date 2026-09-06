import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Settings,
  HeartPulse,
  ShieldAlert,
  Heart,
  AlertTriangle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useBleStore } from '@/services/ble-management/bleStore';
import { useBLE } from '@/context/BLEContext';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { StitchHeartEcgIcon } from '@/components/ui/icons/StitchIcons';
import { THEME } from '@/constants/theme';

export default function AFibMeasureScreen() {
  const router = useRouter();
  const { sendCommand, stopExportAndUploadPpgRecording } = useBLE();
  const store = useBleStore();

  const [countdown, setCountdown] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [localUploadMsg, setLocalUploadMsg] = useState<string | null>(null);

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persistent React Native animation value
  const [rotateAnim] = useState(() => new Animated.Value(0));

  // Sync with global state
  const isRecording = store.isRecordingPpg;
  const isAnalyzing = store.isAnalyzing;
  const result = store.aiAnalysisResult;
  const error = store.recordingError;
  const startedAt = store.recordingStartedAt;
  const isConnected = Boolean(store.connectedDeviceId);

  // Rotating dashed radar ring animation loop (Stitch specs)
  useEffect(() => {
    const rotation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 28000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotation.start();
    return () => rotation.stop();
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Timer logic for measuring
  useEffect(() => {
    if (!isRecording || !startedAt) {
      return;
    }
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording, startedAt]);

  // Clean up countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const startMeasurement = async () => {
    try {
      await sendCommand("CMD:START_SCREENING");
    } catch (err) {
      console.warn("Lỗi gửi lệnh đo:", err);
    }
  };

  const startCountdown = () => {
    if (!isConnected) return;
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setLocalUploadMsg(null);
    setTimeLeft(60);
    store.setRecordingState({ aiAnalysisResult: null, recordingError: null });
    setCountdown(3);

    let counter = 3;
    countdownIntervalRef.current = setInterval(() => {
      counter -= 1;
      if (counter > 0) {
        setCountdown(counter);
      } else {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdown(null);
        void startMeasurement();
      }
    }, 1000);
  };

  const handleManualUpload = async () => {
    if (!isRecording) return;
    setLocalUploadMsg("Đang xử lý dữ liệu...");
    try {
      await stopExportAndUploadPpgRecording();
    } catch (err: any) {
      setLocalUploadMsg(err?.message || "Lỗi khi upload.");
    }
  };

  const handleShowProtocolInfo = () => {
    Alert.alert(
      "Quy trình chuẩn y khoa AFib 60s",
      "1. Ngồi yên tĩnh trên ghế tựa lưng thoải mái.\n2. Giữ cánh tay đặt ngang tầm tim.\n3. Không cử động hoặc nói chuyện trong suốt 60 giây đo.\n4. Cảm biến PPG sẽ tự động thu thập tín hiệu quang học và gửi về mô hình AI chẩn đoán.",
      [{ text: "Đã hiểu", style: "default" }]
    );
  };

  return (
    <ScreenWrapper
      title="Tầm soát Rung nhĩ"
      statusBarStyle="dark"
      backgroundComponent={
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#F4F8FC', overflow: 'hidden' }]}>
          {/* Ambient Medical Glow Orbs (Stitch Specs) */}
          <View
            className="absolute top-12 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-blue-200/40 pointer-events-none"
            style={{ opacity: 0.55 }}
          />
          <View
            className="absolute bottom-20 right-4 w-60 h-60 rounded-full bg-rose-100/35 pointer-events-none"
            style={{ opacity: 0.45 }}
          />
        </View>
      }
      headerLeft={
        <Pressable
          onPress={() => router.back()}
          className="w-11 h-11 rounded-full bg-white/95 shadow-sm border border-blue-100 items-center justify-center active:opacity-80"
          style={{
            shadowColor: 'rgba(13, 110, 253, 0.08)',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 6,
            elevation: 2,
          }}
          aria-label="Quay lại"
        >
          <ArrowLeft color={THEME.colors.primary} size={20} strokeWidth={2.4} />
        </Pressable>
      }
      headerRight={
        <Pressable
          onPress={handleShowProtocolInfo}
          className="w-11 h-11 rounded-full bg-slate-100/90 items-center justify-center shadow-inner active:opacity-80"
          aria-label="Cài đặt đo lâm sàng"
        >
          <Settings color="#64748B" size={18} strokeWidth={2} />
        </Pressable>
      }
    >
      <View className="px-6 flex-1 justify-between pb-7 pt-2">
        {/* BEGIN: InstructionalGuidanceSection */}
        <View className="items-center mt-1">
          <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/70 border border-blue-200/70 mb-2.5">
            <View className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
            <Text className="text-blue-700 text-xs font-semibold">
              Quy trình chuẩn y khoa AFib 60s
            </Text>
          </View>
          <Text className="text-[13.5px] leading-relaxed text-slate-600 font-medium max-w-[310px] text-center">
            Đảm bảo giữ yên cánh tay và dây đeo vừa vặn với cổ tay trong suốt{" "}
            <Text className="font-bold text-[#0B1E3F]">60 giây đo</Text>.
          </Text>
        </View>
        {/* END: InstructionalGuidanceSection */}

        {/* BEGIN: PulseRadarSensorSection */}
        <View className="flex-1 items-center justify-center my-4">
          {countdown !== null ? (
            <View
              style={{
                width: 176,
                height: 176,
                borderRadius: 88,
                backgroundColor: '#EFF6FF',
                borderWidth: 6,
                borderColor: '#0D6EFD',
                shadowColor: 'rgba(13, 110, 253, 0.25)',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 1,
                shadowRadius: 20,
                elevation: 6,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text className="text-6xl font-extrabold text-[#0D6EFD]">{countdown}</Text>
              <Text className="text-xs font-bold text-blue-600 mt-1 uppercase tracking-wider">
                Chuẩn bị
              </Text>
            </View>
          ) : isRecording ? (
            <View className="relative items-center justify-center w-64 h-64 sm:w-72 sm:h-72">
              {/* Animated Ripples */}
              <View
                className="absolute w-72 h-72 rounded-full border border-blue-300/40"
                style={{ opacity: 0.7 }}
              />
              <View
                className="absolute w-60 h-60 rounded-full border border-blue-400/25"
                style={{ opacity: 0.5 }}
              />

              {/* Central Active Recording Pod */}
              <View
                style={{
                  width: 176,
                  height: 176,
                  borderRadius: 88,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#F0F9FF',
                  shadowColor: 'rgba(225, 29, 72, 0.18)',
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 1,
                  shadowRadius: 28,
                  elevation: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HeartPulse color="#E11D48" size={46} strokeWidth={2.2} className="mb-1" />
                <Text className="text-3xl font-extrabold text-rose-600 tracking-tight">
                  {timeLeft}s
                </Text>
                <View className="flex-row items-center mt-1">
                  <View className="w-2 h-2 rounded-full bg-rose-500 mr-1.5 animate-ping" />
                  <Text className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">
                    Đang thu thập
                  </Text>
                </View>
              </View>
            </View>
          ) : isAnalyzing ? (
            <View
              style={{
                width: 176,
                height: 176,
                borderRadius: 88,
                backgroundColor: '#F8FAFC',
                borderWidth: 3,
                borderColor: '#0D6EFD',
                shadowColor: 'rgba(13, 110, 253, 0.2)',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 1,
                shadowRadius: 20,
                elevation: 5,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActivityIndicator size="large" color="#0D6EFD" />
              <Text className="text-sm font-bold text-slate-800 mt-3">AI đang phân tích...</Text>
              <Text className="text-[11px] text-slate-400 mt-0.5">Xử lý tín hiệu PPG</Text>
            </View>
          ) : result ? (
            <View
              style={{
                width: 192,
                height: 192,
                borderRadius: 96,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 4,
                borderColor:
                  result.predictionLabel === 'NORMAL' ? '#10B981' : '#F43F5E',
                backgroundColor:
                  result.predictionLabel === 'NORMAL' ? '#ECFDF5' : '#FFF1F2',
                shadowColor:
                  result.predictionLabel === 'NORMAL'
                    ? 'rgba(16, 185, 129, 0.25)'
                    : 'rgba(244, 63, 94, 0.25)',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 1,
                shadowRadius: 24,
                elevation: 6,
              }}
            >
              {result.predictionLabel === 'NORMAL' ? (
                <Heart color="#10B981" size={54} />
              ) : (
                <ShieldAlert color="#F43F5E" size={54} />
              )}
              <Text
                className={`text-lg font-bold mt-2 ${result.predictionLabel === 'NORMAL'
                  ? 'text-emerald-700'
                  : 'text-rose-700'
                  }`}
              >
                {result.predictionLabel === 'NORMAL'
                  ? 'Bình thường'
                  : 'Rung nhĩ (AFib)'}
              </Text>
              <Text className="text-xs text-slate-500 font-medium mt-0.5">
                Khả năng bị rung nhĩ: {Math.round((result.confidence ?? 0) * 100)}%
              </Text>
            </View>
          ) : (
            /* Ready / Idle State with Rotating Dashed Ring (Stitch Specs) */
            <View className="relative w-64 h-64 sm:w-72 sm:h-72 items-center justify-center">
              {/* Outer Rotating Dashed Ring */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 270,
                  height: 270,
                  transform: [{ rotate: spin }],
                }}
              >
                <Svg width={270} height={270} viewBox="0 0 280 280">
                  <Circle
                    cx="140"
                    cy="140"
                    r="126"
                    fill="none"
                    stroke="#A8C8F0"
                    strokeWidth={4.5}
                    strokeDasharray="10 12"
                    strokeLinecap="round"
                    opacity={0.9}
                  />
                </Svg>
              </Animated.View>

              {/* Secondary Static Guide Ring */}
              <LinearGradient
                colors={[
                  'rgba(255, 255, 255, 0.95)',
                  'rgba(255, 255, 255, 0.5)',
                  'rgba(239, 246, 255, 0.4)',
                ]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{
                  position: 'absolute',
                  width: 210,
                  height: 210,
                  borderRadius: 105,
                  borderWidth: 2,
                  borderColor: 'rgba(191, 219, 254, 0.8)',
                }}
              />

              {/* Central Interactive Sensor Pod */}
              <View
                style={{
                  width: 168,
                  height: 168,
                  borderRadius: 84,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#F0F9FF',
                  shadowColor: 'rgba(13, 110, 253, 0.14)',
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 1,
                  shadowRadius: 28,
                  elevation: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16,
                }}
              >
                {/* Floating ECG Heart Rhythm Icon */}
                <View className="w-16 h-16 items-center justify-center mb-1">
                  <View className="absolute inset-0 bg-blue-50/80 rounded-full" />
                  <StitchHeartEcgIcon size={52} heartColor="#4F80E1" ecgColor="#2563EB" />
                </View>

                <Text className="text-[14px] font-bold text-[#1E3A8A] tracking-tight">
                  Sẵn sàng đo
                </Text>
                <Text className="text-[11px] font-medium text-slate-400 mt-0.5">
                  Cảm biến PPG sạch
                </Text>
              </View>
            </View>
          )}

          {/* Error & Upload Status */}
          <View className="mt-4 w-full px-4">
            {error ? (
              <View className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex-row items-center">
                <AlertTriangle color="#E11D48" size={18} className="mr-2" />
                <Text className="text-xs font-semibold text-rose-700 flex-1">{error}</Text>
              </View>
            ) : localUploadMsg ? (
              <Text className="text-xs text-slate-500 font-medium text-center">
                {localUploadMsg}
              </Text>
            ) : null}
          </View>
        </View>
        {/* END: PulseRadarSensorSection */}

        {/* BEGIN: BottomSection */}
        <View className="w-full">
          {/* Clinical Guidelines Card (Stitch Specs) */}
          {!isRecording && countdown === null && !isAnalyzing && !result && (
            <View
              className="rounded-2xl p-3.5 border border-white flex-row items-center justify-between mb-4"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                shadowColor: 'rgba(15, 23, 42, 0.04)',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              {/* Step 1 */}
              <View className="flex-row items-center space-x-2">
                <View className="w-7 h-7 rounded-xl bg-blue-100/90 items-center justify-center mr-2">
                  <Text className="text-blue-700 text-xs font-bold">1</Text>
                </View>
                <Text className="text-xs font-semibold text-slate-700">Ngồi yên tĩnh</Text>
              </View>
              <View className="w-px h-6 bg-slate-200" />
              {/* Step 2 */}
              <View className="flex-row items-center space-x-2">
                <View className="w-7 h-7 rounded-xl bg-blue-100/90 items-center justify-center mr-2">
                  <Text className="text-blue-700 text-xs font-bold">2</Text>
                </View>
                <Text className="text-xs font-semibold text-slate-700">Tay không chuyển động</Text>
              </View>
              <View className="w-px h-6 bg-slate-200" />
              {/* Step 3 */}
              <View className="flex-row items-center space-x-2">
                <View className="w-7 h-7 rounded-xl bg-blue-100/90 items-center justify-center mr-2">
                  <Text className="text-blue-700 text-xs font-bold">3</Text>
                </View>
                <Text className="text-xs font-semibold text-slate-700">Không nói</Text>
              </View>
            </View>
          )}

          {/* Primary Action Buttons */}
          <View className="w-full">
            {isRecording ? (
              <Pressable
                onPress={handleManualUpload}
                className="w-full bg-rose-500 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-rose-500/30 active:opacity-80 mb-2"
              >
                <Text className="text-base font-bold text-white">Dừng & Phân tích ngay</Text>
              </Pressable>
            ) : (
              /* Stitch Gradient 3-tone CTA Button */
              <LinearGradient
                colors={['#6CA3FA', '#4D8BF5', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 16,
                  shadowColor: '#3B82F6',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.35,
                  shadowRadius: 18,
                  elevation: 5,
                  opacity: !isConnected || countdown !== null || isAnalyzing ? 0.6 : 1,
                }}
              >
                <Pressable
                  onPress={startCountdown}
                  disabled={!isConnected || countdown !== null || isAnalyzing}
                  className="w-full py-4 rounded-2xl flex-row items-center justify-center gap-2.5 active:opacity-90"
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M2.25 12h3.75l2.25-6 3.75 12 2.25-6H21.75"
                      stroke="#FFFFFF"
                      strokeWidth={2.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text className="text-white font-bold text-base tracking-wide">
                    {isAnalyzing ? "Đang xử lý kết quả..." : "Bắt đầu đo 60 giây"}
                  </Text>
                </Pressable>
              </LinearGradient>
            )}

            {/* BLE Connection Reminder Warning Tag (Stitch Specs) */}
            {!isConnected && (
              <View className="flex-row items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50/90 border border-rose-200/80 shadow-xs mt-3">
                <AlertTriangle color="#E11D48" size={15} />
                <Text className="text-xs font-semibold text-rose-600 tracking-tight text-center">
                  Vui lòng kết nối đồng hồ BLE trong mục{" "}
                  <Text
                    className="underline font-bold"
                    onPress={() => router.push("/(public)/scan" as any)}
                  >
                    Cài đặt
                  </Text>{" "}
                  trước khi đo.
                </Text>
              </View>
            )}
          </View>
        </View>
        {/* END: BottomSection */}
      </View>
    </ScreenWrapper>
  );
}

