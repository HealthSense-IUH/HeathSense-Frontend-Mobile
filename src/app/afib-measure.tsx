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
import { useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Settings,
  HeartPulse,
  ShieldAlert,
  Heart,
  AlertTriangle,
  ChevronRight,
  Activity,
  Zap,
  Square,
  ArrowRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { Trans, useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { LiveMeasurementCard } from '@/components/features/health/LiveMeasurementCard';
import { useBleStore } from '@/services/ble-management/bleStore';
import { bleService } from '@/services/ble-management/bleService';
import { ppgRecorder } from '@/services/ppg-management/ppgRecorder';
import { safeRouter } from '@/utils/safeNavigation';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { StitchHeartEcgIcon } from '@/components/ui/icons/StitchIcons';
import { THEME } from '@/constants/theme';
import { getPredictionMeta } from '@/constants/healthRecords';
import {
  getAFibScreeningAvailability,
  useWorkoutEngineStore,
} from '@/services/workout';

// Sub-component riêng cho Spot-check để việc cập nhật BPM/SpO2 liên tục không làm re-render toàn bộ màn hình đo AFib
const SpotCheckActivePod = React.memo(function SpotCheckActivePod() {
  const { t } = useTranslation('health');
  const { liveBPM, currentBPM, liveSpO2, currentSpO2 } = useBleStore(
    useShallow(state => ({
      liveBPM: state.liveBPM,
      currentBPM: state.currentBPM,
      liveSpO2: state.liveSpO2,
      currentSpO2: state.currentSpO2,
    }))
  );

  const spotBPM = liveBPM ?? (currentBPM > 0 ? currentBPM : null);
  const spotSpO2 = liveSpO2 ?? (currentSpO2 > 0 ? currentSpO2 : null);

  return (
    <View
      style={{
        width: 176,
        height: 176,
        borderRadius: 88,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#10B981',
        shadowColor: 'rgba(16, 185, 129, 0.25)',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 28,
        elevation: 6,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
      }}
    >
      <View className="flex-row items-center gap-1.5 mb-1">
        <HeartPulse color="#E11D48" size={24} strokeWidth={2.4} />
        <Text className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {spotBPM !== null && spotBPM > 0 ? spotBPM : '--'}
        </Text>
        <Text className="text-xs font-bold text-slate-500">BPM</Text>
      </View>
      <View className="flex-row items-center bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200/60 mt-0.5">
        <Text className="text-xs font-semibold text-cyan-800">
          SpO2: <Text className="font-extrabold text-cyan-700">{spotSpO2 !== null && spotSpO2 > 0 ? `${spotSpO2}%` : '--'}</Text>
        </Text>
      </View>
      <Text className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mt-2">
        {t('measure.spotCheck.measuring')}
      </Text>
    </View>
  );
});

export default function AFibMeasureScreen() {
  const { t } = useTranslation('health');
  const params = useLocalSearchParams<{ mode?: string }>();
  const [measureMode, setMeasureMode] = useState<'afib' | 'spot_check'>(
    params.mode === 'spot_check' ? 'spot_check' : 'afib'
  );

  const store = useBleStore(useShallow(state => ({
    isRecordingPpg: state.isRecordingPpg,
    isSpotChecking: state.isSpotChecking,
    isAnalyzing: state.isAnalyzing,
    aiAnalysisResult: state.aiAnalysisResult,
    recordingError: state.recordingError,
    recordingStartedAt: state.recordingStartedAt,
    connectedDeviceId: state.connectedDeviceId,
    setRecordingState: state.setRecordingState,
  })));

  const isSpotChecking = store.isSpotChecking;

  const workoutStatus = useWorkoutEngineStore((state) => state.status);
  const lastWorkoutEndedAt = useWorkoutEngineStore((state) => state.lastWorkoutEndedAt);
  const [availability, setAvailability] = useState(() => getAFibScreeningAvailability());

  useEffect(() => {
    const check = () => setAvailability(getAFibScreeningAvailability());
    check();
    const current = getAFibScreeningAvailability();
    if (current.canScreen) return;
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [workoutStatus, lastWorkoutEndedAt]);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [localUploadMsg, setLocalUploadMsg] = useState<string | null>(null);

  const countdownTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isCountingDownRef = useRef(false);

  // Persistent React Native animation value
  const [rotateAnim] = useState(() => new Animated.Value(0));

  // Sync with global state
  const isRecording = store.isRecordingPpg;
  const isAnalyzing = store.isAnalyzing;
  const result = store.aiAnalysisResult;
  const resultMeta = getPredictionMeta(result?.predictionLabel, result?.status);
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

  // Timer logic for measuring: đếm lùi 60s và tự động hoàn tất khi về 0s
  useEffect(() => {
    if (!isRecording || !startedAt) {
      return;
    }
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        // Ngay khi về 0s, tự động dừng ghi và xuất upload phân tích AI ngay lập tức
        void ppgRecorder.stopExportAndUpload().catch((err) => {
          console.warn('[AFibMeasure] Tự động xuất CSV & upload PPG khi hết 60s thất bại:', err);
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording, startedAt]);

  const clearAllCountdownTimeouts = () => {
    countdownTimeoutsRef.current.forEach((t) => clearTimeout(t));
    countdownTimeoutsRef.current = [];
    isCountingDownRef.current = false;
  };

  // Clean up countdown and stop spot-check on unmount
  useEffect(() => {
    return () => {
      clearAllCountdownTimeouts();
      if (useBleStore.getState().isSpotChecking) {
        void bleService.stopSpotCheck().catch(() => {});
      }
    };
  }, []);

  const handleSpotCheckToggle = async () => {
    if (!isConnected) return;
    try {
      if (isSpotChecking) {
        await bleService.stopSpotCheck();
      } else {
        await bleService.startSpotCheck();
      }
    } catch (err) {
      console.warn('[SpotCheck] Failed to toggle spot check:', err);
    }
  };

  const startMeasurement = async () => {
    try {
      ppgRecorder.start();
      await bleService.sendCommand("CMD:START_SCREENING");
    } catch (err) {
      console.warn("[AFibMeasure] Failed to send screening command:", err);
    }
  };

  const startCountdown = () => {
    if (isCountingDownRef.current || isRecording || isAnalyzing) return;
    const current = getAFibScreeningAvailability();
    if (!current.canScreen) {
      if (current.reason === 'WORKOUT_IN_PROGRESS') {
        Alert.alert(
          t('screening.workoutPaused.title'),
          t('screening.workoutPaused.measureMessage'),
          [{ text: t('screening.understood') }]
        );
      } else if (current.reason === 'COOLDOWN_ACTIVE') {
        Alert.alert(
          t('screening.cooldown.title'),
          t('screening.cooldown.message', { time: current.formattedRemainingTime }),
          [{ text: t('screening.understood') }]
        );
      }
      return;
    }

    if (!isConnected) return;

    clearAllCountdownTimeouts();
    isCountingDownRef.current = true;
    setLocalUploadMsg(null);
    setTimeLeft(60);
    store.setRecordingState({ aiAnalysisResult: null, recordingError: null });
    setCountdown(3);

    // Chuỗi timeout chính xác 1s mỗi bước (3 -> 2 -> 1 -> Bắt đầu), không bị nhảy bước do nghẽn interval
    const t2 = setTimeout(() => {
      setCountdown(2);
    }, 1000);

    const t1 = setTimeout(() => {
      setCountdown(1);
    }, 2000);

    const tStart = setTimeout(() => {
      setCountdown(null);
      isCountingDownRef.current = false;
      void startMeasurement();
    }, 3000);

    countdownTimeoutsRef.current = [t2, t1, tStart];
  };

  const handleManualUpload = async () => {
    if (!isRecording) return;
    setLocalUploadMsg(t('measure.processingData'));
    try {
      await ppgRecorder.stopExportAndUpload();
    } catch (err: any) {
      setLocalUploadMsg(err?.message || t('measure.uploadError'));
    }
  };

  const handleCancelMeasurement = async () => {
    ppgRecorder.cancelRecording(t('ppg.cancelled'));
    setLocalUploadMsg(null);
    setTimeLeft(60);
    try {
      await bleService.sendCommand("CMD:IDLE");
    } catch (err) {
      console.warn('[AFibMeasure] Failed to send IDLE command on cancel:', err);
    }
  };

  const handleShowProtocolInfo = () => {
    Alert.alert(
      t('measure.protocolBadge'),
      t('measure.protocolSteps'),
      [{ text: t('screening.understood'), style: "default" }]
    );
  };

  return (
    <ScreenWrapper
      title={measureMode === 'spot_check' ? t('measure.spotCheck.tabTitle') : t('measure.title')}
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
          onPress={() => safeRouter.back()}
          className="w-11 h-11 rounded-full bg-white/95 shadow-sm border border-blue-100 items-center justify-center active:opacity-80"
          style={{
            shadowColor: 'rgba(13, 110, 253, 0.08)',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 6,
            elevation: 2,
          }}
          aria-label={t('common:actions.back')}
        >
          <ArrowLeft color={THEME.colors.primary} size={20} strokeWidth={2.4} />
        </Pressable>
      }
      headerRight={
        <Pressable
          onPress={handleShowProtocolInfo}
          className="w-11 h-11 rounded-full bg-slate-100/90 items-center justify-center shadow-inner active:opacity-80"
          aria-label={t('measure.settingsAria')}
        >
          <Settings color="#64748B" size={18} strokeWidth={2} />
        </Pressable>
      }
    >
      <View className="px-6 flex-1 justify-between pb-7 pt-1">
        {/* Mode Selector Tabs (AFib 60s vs Spot-check) */}
        <View className="flex-row bg-slate-200/80 p-1 rounded-2xl mb-2.5 self-center">
          <Pressable
            key="mode-tab-afib"
            onPress={() => {
              if (!isRecording && !isSpotChecking) setMeasureMode('afib');
            }}
            className={`px-4 py-2 rounded-xl flex-row items-center gap-1.5 will-change-variable ${
              measureMode === 'afib' ? 'bg-white shadow-xs' : 'opacity-75'
            }`}
          >
            <Activity size={14} color={measureMode === 'afib' ? '#0D6EFD' : '#64748B'} strokeWidth={2.4} />
            <Text
              className={`text-xs font-bold ${
                measureMode === 'afib' ? 'text-slate-900' : 'text-slate-600'
              }`}
            >
              {t('measure.spotCheck.screeningTabTitle')}
            </Text>
          </Pressable>

          <Pressable
            key="mode-tab-spot-check"
            onPress={() => {
              if (!isRecording && !isSpotChecking) setMeasureMode('spot_check');
            }}
            className={`px-4 py-2 rounded-xl flex-row items-center gap-1.5 will-change-variable ${
              measureMode === 'spot_check' ? 'bg-white shadow-xs' : 'opacity-75'
            }`}
          >
            <Zap size={14} color={measureMode === 'spot_check' ? '#059669' : '#64748B'} strokeWidth={2.4} />
            <Text
              className={`text-xs font-bold ${
                measureMode === 'spot_check' ? 'text-slate-900' : 'text-slate-600'
              }`}
            >
              {t('measure.spotCheck.tabTitle')}
            </Text>
          </Pressable>
        </View>

        {/* Instructional Guidance */}
        <View className="items-center mt-0.5">
          <Text className="text-[13px] leading-relaxed text-slate-600 font-medium max-w-[320px] text-center">
            {measureMode === 'spot_check' ? (
              t('measure.spotCheck.description')
            ) : (
              <Trans t={t} i18nKey="measure.instruction" components={{ b: <Text className="font-bold text-[#0B1E3F]" /> }} />
            )}
          </Text>
        </View>

        {/* BEGIN: PulseRadarSensorSection */}
        <View className="flex-1 items-center justify-center my-4">
          {measureMode === 'spot_check' ? (
            isSpotChecking ? (
              <View className="relative items-center justify-center w-64 h-64 sm:w-72 sm:h-72">
                {/* Animated Ripples Emerald */}
                <View
                  className="absolute w-72 h-72 rounded-full border border-emerald-300/40"
                  style={{ opacity: 0.7 }}
                />
                <View
                  className="absolute w-60 h-60 rounded-full border border-emerald-400/25"
                  style={{ opacity: 0.5 }}
                />

                {/* Central Active Spot-checking Pod */}
                <SpotCheckActivePod />
              </View>
            ) : (
              /* Ready / Idle State for Spot-check */
              <View className="relative w-64 h-64 sm:w-72 sm:h-72 items-center justify-center">
                {/* Outer Rotating Dashed Ring Emerald */}
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
                      stroke="#6EE7B7"
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
                    'rgba(236, 253, 245, 0.4)',
                  ]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={{
                    position: 'absolute',
                    width: 210,
                    height: 210,
                    borderRadius: 105,
                    borderWidth: 2,
                    borderColor: 'rgba(167, 243, 208, 0.8)',
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
                    borderColor: '#ECFDF5',
                    shadowColor: 'rgba(5, 150, 105, 0.16)',
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 1,
                    shadowRadius: 28,
                    elevation: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                  }}
                >
                  <View className="w-16 h-16 items-center justify-center mb-1">
                    <View className="absolute inset-0 bg-emerald-50/80 rounded-full" />
                    <Zap size={36} color="#059669" strokeWidth={2.4} />
                  </View>

                  <Text className="text-[14px] font-bold text-slate-800 tracking-tight text-center">
                    {t('measure.ready')}
                  </Text>
                  <Text className="text-[11px] font-medium text-slate-400 mt-0.5 text-center">
                    {t('measure.readySub')}
                  </Text>
                </View>
              </View>
            )
          ) : countdown !== null ? (
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
                {t('measure.preparing')}
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
                <Text className="text-[11px] font-bold text-rose-500 uppercase tracking-wider mt-1">
                  {t('measure.recording')}
                </Text>
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
              <Text className="text-sm font-bold text-slate-800 mt-3">{t('measure.analyzing')}</Text>
              <Text className="text-[11px] text-slate-400 mt-0.5">{t('measure.analyzingSub')}</Text>
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
                borderColor: resultMeta.dot,
                backgroundColor: resultMeta.bg,
                shadowColor: resultMeta.dot,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.25,
                shadowRadius: 24,
                elevation: 6,
              }}
            >
              {resultMeta.isRisk ? (
                <ShieldAlert color={resultMeta.dot} size={54} />
              ) : (
                <Heart color={resultMeta.dot} size={54} />
              )}
              <Text className="text-lg font-bold mt-2" style={{ color: resultMeta.text }}>
                {resultMeta.label}
              </Text>
              <Text className="text-xs text-slate-500 font-medium mt-0.5">
                {t('afibHistory.card.afibProbability', { value: ((result.confidence ?? 0) * 100).toFixed(1) })}
              </Text>
              <Pressable
                onPress={() => safeRouter.navigate(`/health-record/${result.id}` as any)}
                hitSlop={8}
                className="mt-1.5 flex-row items-center active:opacity-70"
                style={{ gap: 2 }}
              >
                <Text className="text-xs font-semibold text-[#0D6EFD]">{t('common:actions.viewDetails')}</Text>
                <ChevronRight color="#0D6EFD" size={14} strokeWidth={2.2} />
              </Pressable>
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
                  {t('measure.ready')}
                </Text>
                <Text className="text-[11px] font-medium text-slate-400 mt-0.5">
                  {t('measure.readySub')}
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

        {(isRecording || isSpotChecking) ? <LiveMeasurementCard /> : null}

        {/* BEGIN: BottomSection */}
        <View className="w-full">
          {/* Clinical Guidelines Card (Stitch Specs) */}
          {!isRecording && !isSpotChecking && countdown === null && !isAnalyzing && !result && (
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
                <Text className="text-xs font-semibold text-slate-700">{t('measure.steps.sitStill')}</Text>
              </View>
              <View className="w-px h-6 bg-slate-200" />
              {/* Step 2 */}
              <View className="flex-row items-center space-x-2">
                <View className="w-7 h-7 rounded-xl bg-blue-100/90 items-center justify-center mr-2">
                  <Text className="text-blue-700 text-xs font-bold">2</Text>
                </View>
                <Text className="text-xs font-semibold text-slate-700">{t('measure.steps.armStill')}</Text>
              </View>
              <View className="w-px h-6 bg-slate-200" />
              {/* Step 3 */}
              <View className="flex-row items-center space-x-2">
                <View className="w-7 h-7 rounded-xl bg-blue-100/90 items-center justify-center mr-2">
                  <Text className="text-blue-700 text-xs font-bold">3</Text>
                </View>
                <Text className="text-xs font-semibold text-slate-700">{t('measure.steps.noTalking')}</Text>
              </View>
            </View>
          )}

          {/* Primary Action Buttons */}
          <View className="w-full">
            {measureMode === 'spot_check' ? (
              isSpotChecking ? (
                <Pressable
                  onPress={handleSpotCheckToggle}
                  className="w-full bg-rose-500 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-rose-500/30 active:opacity-80 mb-2 gap-2"
                >
                  <Square size={18} color="#FFFFFF" fill="#FFFFFF" />
                  <Text className="text-base font-bold text-white">
                    {t('measure.spotCheck.stopCta')}
                  </Text>
                </Pressable>
              ) : (
                <LinearGradient
                  colors={['#10B981', '#059669', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    shadowColor: '#059669',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.35,
                    shadowRadius: 18,
                    elevation: 5,
                    opacity: !isConnected ? 0.75 : 1,
                  }}
                >
                  <Pressable
                    onPress={handleSpotCheckToggle}
                    disabled={!isConnected}
                    className="w-full py-4 rounded-2xl flex-row items-center justify-center gap-2.5 active:opacity-90"
                  >
                    <Zap size={20} color="#FFFFFF" strokeWidth={2.4} />
                    <Text className="text-white font-bold text-base tracking-wide">
                      {t('measure.spotCheck.startCta')}
                    </Text>
                  </Pressable>
                </LinearGradient>
              )
            ) : isRecording ? (
              <View className="gap-2.5 mb-2">
                <Pressable
                  onPress={handleManualUpload}
                  className="w-full bg-rose-500 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-rose-500/30 active:opacity-80"
                >
                  <Text className="text-base font-bold text-white">{t('measure.stopAndAnalyze')}</Text>
                </Pressable>
                <Pressable
                  onPress={handleCancelMeasurement}
                  className="w-full py-3 rounded-2xl flex-row items-center justify-center active:opacity-75 bg-slate-100/90 border border-slate-200"
                >
                  <Text className="text-sm font-semibold text-slate-600">{t('common:actions.cancel')}</Text>
                </Pressable>
              </View>
            ) : (
              /* Stitch Gradient 3-tone CTA Button */
              <LinearGradient
                colors={!availability.canScreen ? ['#94A3B8', '#64748B', '#475569'] : ['#6CA3FA', '#4D8BF5', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 16,
                  shadowColor: !availability.canScreen ? '#64748B' : '#3B82F6',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.35,
                  shadowRadius: 18,
                  elevation: 5,
                  opacity: !isConnected || countdown !== null || isAnalyzing || !availability.canScreen ? 0.75 : 1,
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
                    {availability.reason === 'COOLDOWN_ACTIVE'
                      ? t('measure.cta.cooldown', { time: availability.formattedRemainingTime })
                      : availability.reason === 'WORKOUT_IN_PROGRESS'
                      ? t('measure.cta.workout')
                      : isAnalyzing
                      ? t('measure.cta.processing')
                      : t('measure.cta.start')}
                  </Text>
                </Pressable>
              </LinearGradient>
            )}

            {/* Workout / Cooldown Warning Banner & Alternative Spot Check CTA */}
            {measureMode === 'afib' && !availability.canScreen ? (
              <View className="mt-3">
                <View className="flex-row items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-50/90 border border-amber-200/80 shadow-xs">
                  <AlertTriangle color="#D97706" size={15} />
                  <Text className="text-xs font-semibold text-amber-700 tracking-tight text-center">
                    {availability.reason === 'COOLDOWN_ACTIVE'
                      ? t('measure.banner.cooldown', { time: availability.formattedRemainingTime })
                      : t('measure.banner.workout')}
                  </Text>
                </View>

                {availability.reason === 'COOLDOWN_ACTIVE' && (
                  <View className="mt-2.5 p-3 rounded-2xl bg-blue-50/90 border border-blue-200/80">
                    <View className="flex-row items-center gap-1.5 mb-1.5">
                      <Zap size={14} color="#0D6EFD" />
                      <Text className="text-xs font-medium text-blue-900 flex-1">
                        {t('measure.spotCheck.cooldownAlternative')}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setMeasureMode('spot_check')}
                      className="bg-blue-600 py-2.5 px-3 rounded-xl flex-row items-center justify-center gap-1.5 active:opacity-85 mt-1"
                    >
                      <Text className="text-xs font-bold text-white">
                        {t('measure.spotCheck.switchToSpotCheck')}
                      </Text>
                      <ArrowRight size={14} color="#FFFFFF" strokeWidth={2.4} />
                    </Pressable>
                  </View>
                )}
              </View>
            ) : !isConnected ? (
              <View className="flex-row items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50/90 border border-rose-200/80 shadow-xs mt-3">
                <AlertTriangle color="#E11D48" size={15} />
                <Text className="text-xs font-semibold text-rose-600 tracking-tight text-center">
                  <Trans
                    t={t}
                    i18nKey="measure.banner.notConnected"
                    components={{
                      link: (
                        <Text
                          className="underline font-bold"
                          onPress={() => safeRouter.navigate("/(public)/scan" as any)}
                        />
                      ),
                    }}
                  />
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        {/* END: BottomSection */}
      </View>
    </ScreenWrapper>
  );
}

