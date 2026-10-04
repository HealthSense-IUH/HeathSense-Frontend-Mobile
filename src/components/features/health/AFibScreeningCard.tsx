import React, { useState, useEffect } from 'react';
import { Text, Pressable, View, Alert } from 'react-native';
import { HeartPulse, CheckCircle2, AlertCircle, Play, ArrowRight, Timer } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useBleStore } from '@/services/ble-management/bleStore';
import { LinearGradient } from 'expo-linear-gradient';
import { getAFibScreeningAvailability, useWorkoutEngineStore } from '@/services/workout';
import { useMyRecords } from '@/hooks/useHealthHistory';
import { getPredictionMeta } from '@/constants/healthRecords';
import { formatDateTime } from '@/utils/formatters';

export function AFibScreeningCard() {
  const { t } = useTranslation('health');
  const router = useRouter();
  const aiAnalysisResult = useBleStore(state => state.aiAnalysisResult);
  // Bản ghi mới nhất trên server; lúc chưa tải xong thì dùng kết quả vừa đo trong phiên
  const { data: latestPage } = useMyRecords(1, 1);
  const latestRecord = latestPage?.content?.[0] ?? aiAnalysisResult;
  const latestMeta = latestRecord ? getPredictionMeta(latestRecord.predictionLabel, latestRecord.status) : null;
  const workoutStatus = useWorkoutEngineStore(state => state.status);
  const lastWorkoutEndedAt = useWorkoutEngineStore(state => state.lastWorkoutEndedAt);

  const [availability, setAvailability] = useState(() => getAFibScreeningAvailability());

  useEffect(() => {
    const immediateTimer = setTimeout(() => {
      setAvailability(getAFibScreeningAvailability());
    }, 0);

    const timer = setInterval(() => {
      setAvailability(getAFibScreeningAvailability());
    }, 1000);

    return () => {
      clearTimeout(immediateTimer);
      clearInterval(timer);
    };
  }, [workoutStatus, lastWorkoutEndedAt]);

  const handlePress = () => {
    const current = getAFibScreeningAvailability();
    if (!current.canScreen) {
      if (current.reason === 'WORKOUT_IN_PROGRESS') {
        Alert.alert(
          t('screening.workoutPaused.title'),
          t('screening.workoutPaused.cardMessage'),
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
    setTimeout(() => {
      router.push("/afib-measure" as any);
    }, 50);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="mb-6"
      style={({ pressed }) => [
        {
          borderRadius: 24,
          shadowColor: 'rgba(217, 44, 68, 0.28)',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 1,
          shadowRadius: 20,
          elevation: 5,
        },
        pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] }
      ]}
    >
      <LinearGradient
        colors={['#FF5757', '#F24452', '#D92C44']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.25)' }}
        className="p-5 relative overflow-hidden"
      >
        {/* Background ECG Waveform Accent Decoration (Stitch Specs) */}
        <Svg
          style={{ position: 'absolute', right: -18, bottom: -18, opacity: 0.12 }}
          width={175}
          height={175}
          viewBox="0 0 100 100"
        >
          <Path
            d="M0 50 L20 50 L30 10 L45 90 L60 40 L70 60 L80 50 L100 50"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={8}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>

        {/* Top Section: Title, Clinical Tag & Pulse Icon Badge */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 pr-3">
            <View
              style={{
                backgroundColor: availability.reason === 'COOLDOWN_ACTIVE'
                  ? 'rgba(254, 240, 138, 0.3)'
                  : 'rgba(255, 255, 255, 0.22)',
                paddingHorizontal: 8,
                paddingVertical: 2.5,
                borderRadius: 9999,
                alignSelf: 'flex-start',
                marginBottom: 6,
              }}
            >
              <Text className="text-[10px] font-bold text-white uppercase tracking-wider">
                {availability.reason === 'COOLDOWN_ACTIVE'
                  ? t('screening.card.badge.cooldown', { time: availability.formattedRemainingTime })
                  : availability.reason === 'WORKOUT_IN_PROGRESS'
                  ? t('screening.card.badge.workout')
                  : t('screening.card.badge.default')}
              </Text>
            </View>
            <Text className="text-xl font-extrabold text-white tracking-tight leading-snug">
              {t('screening.card.title')}
            </Text>
          </View>

          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.35)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {availability.reason === 'COOLDOWN_ACTIVE' ? (
              <Timer color="#FFFFFF" size={26} strokeWidth={2.2} />
            ) : (
              <HeartPulse color="#FFFFFF" size={26} strokeWidth={2.2} />
            )}
          </View>
        </View>

        {/* Middle Section: Last result summary or descriptive prompt */}
        {latestRecord && latestMeta ? (
          <View className="bg-white/20 rounded-2xl p-3.5 mb-4 backdrop-blur-sm border border-white/20">
            <View className="flex-row items-center mb-1">
              {latestMeta.isRisk ? (
                <AlertCircle color="#FFFFFF" size={17} className="mr-2" />
              ) : (
                <CheckCircle2 color="#FFFFFF" size={17} className="mr-2" />
              )}
              <Text className="text-sm font-bold text-white flex-1">
                {t('screening.card.latest', { label: latestMeta.label })}
              </Text>
            </View>
            <Text className="text-xs text-white/85 pl-6">
              {latestRecord.confidence != null
                ? `${t('afibHistory.card.afibProbability', { value: (latestRecord.confidence * 100).toFixed(1) })} • `
                : ''}
              {formatDateTime(latestRecord.createdAt)}
            </Text>
          </View>
        ) : (
          <Text className="text-white/90 text-xs sm:text-[13px] leading-relaxed font-normal mb-4 pr-1">
            {availability.reason === 'COOLDOWN_ACTIVE'
              ? t('screening.card.cooldownHint', { time: availability.formattedRemainingTime })
              : t('screening.card.description')}
          </Text>
        )}

        {/* Bottom Section: Prominent Active CTA Button */}
        <View className="flex-row items-center justify-between pt-1">
          <View className={`flex-row items-center justify-center px-4 py-2.5 rounded-xl ${!availability.canScreen ? 'bg-white/80' : 'bg-white'} shadow-md`}>
            {availability.reason === 'COOLDOWN_ACTIVE' ? (
              <Timer color="#D92C44" size={13} className="mr-2" />
            ) : availability.reason === 'WORKOUT_IN_PROGRESS' ? (
              <AlertCircle color="#D92C44" size={13} className="mr-2" />
            ) : (
              <Play color="#D92C44" size={13} fill="#D92C44" className="mr-2" />
            )}
            <Text className="text-[#D92C44] font-bold text-xs tracking-wide">
              {availability.reason === 'COOLDOWN_ACTIVE'
                ? t('screening.card.cta.cooldown', { time: availability.formattedRemainingTime })
                : availability.reason === 'WORKOUT_IN_PROGRESS'
                ? t('screening.card.cta.workout')
                : (latestRecord ? t('screening.card.cta.measureAgain') : t('screening.card.cta.start'))}
            </Text>
          </View>

          <View className="flex-row items-center pr-1 opacity-90">
            <Text className="text-white/90 text-[11px] font-semibold mr-1">
              {availability.reason === 'COOLDOWN_ACTIVE'
                ? t('screening.card.hint.cooldown')
                : availability.reason === 'WORKOUT_IN_PROGRESS'
                ? t('screening.card.hint.workout')
                : t('screening.card.hint.default')}
            </Text>
            <ArrowRight color="#FFFFFF" size={14} strokeWidth={2.4} />
          </View>
        </View>

      </LinearGradient>
    </Pressable>
  );
}