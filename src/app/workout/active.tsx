import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  Vibration,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Headphones,
  Music,
  MoreVertical,
  Lock,
  Unlock,
  Settings,
  Heart,
} from 'lucide-react-native';
import Svg, { Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { SlideToUnlock } from '@/components/features/workout/SlideToUnlock';
import { SportMapView } from '@/components/features/workout/SportMapView';
import { useWorkoutEngineStore } from '@/services/workout/workoutEngineStore';
import { locationTrackingService } from '@/services/workout/locationTrackingService';
import { workoutApiService } from '@/services/workout/workoutApiService';

export default function ActiveWorkoutScreen() {
  const router = useRouter();

  const status = useWorkoutEngineStore((state) => state.status);
  const exercise = useWorkoutEngineStore((state) => state.exercise);
  const targetType = useWorkoutEngineStore((state) => state.targetType);
  const targetValue = useWorkoutEngineStore((state) => state.targetValue);
  const elapsedSeconds = useWorkoutEngineStore((state) => state.elapsedSeconds);
  const currentCalories = useWorkoutEngineStore((state) => state.currentCalories);
  const currentHeartRate = useWorkoutEngineStore((state) => state.currentHeartRate);
  const countdownValue = useWorkoutEngineStore((state) => state.countdownValue);
  const isScreenLocked = useWorkoutEngineStore((state) => state.isScreenLocked);
  const currentDistanceKm = useWorkoutEngineStore((state) => state.currentDistanceKm);
  const currentSpeedKmh = useWorkoutEngineStore((state) => state.currentSpeedKmh);
  const currentSteps = useWorkoutEngineStore((state) => state.currentSteps);

  const startCountdown = useWorkoutEngineStore((state) => state.startCountdown);
  const pauseWorkout = useWorkoutEngineStore((state) => state.pauseWorkout);
  const resumeWorkout = useWorkoutEngineStore((state) => state.resumeWorkout);
  const finishWorkout = useWorkoutEngineStore((state) => state.finishWorkout);
  const resetWorkout = useWorkoutEngineStore((state) => state.resetWorkout);
  const toggleScreenLock = useWorkoutEngineStore((state) => state.toggleScreenLock);

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const hasCelebratedRef = useRef(false);
  const [activeMetricPage, setActiveMetricPage] = useState<number>(0);

  const isGpsSport = exercise?.trackingType === 'DISTANCE_GPS';

  // Target Progress & Goal Reached Logic (DISTANCE, TIME, CALORIES)
  const hasTarget =
    (targetType === 'TIME' || targetType === 'CALORIES' || targetType === 'DISTANCE') &&
    targetValue > 0;
  
  let isGoalReached = false;
  let targetProgressPercent = 0;
  let targetHeaderText = '';

  if (targetType === 'DISTANCE' && targetValue > 0) {
    isGoalReached = currentDistanceKm >= targetValue;
    targetProgressPercent = Math.min(100, Math.max(0, (currentDistanceKm / targetValue) * 100));
    const remainingKm = Math.max(0, targetValue - currentDistanceKm);
    targetHeaderText = `Khoảng cách còn lại | ${remainingKm.toFixed(2).replace('.', ',')} km`;
  } else if (targetType === 'TIME' && targetValue > 0) {
    isGoalReached = elapsedSeconds >= targetValue;
    targetProgressPercent = Math.min(100, Math.max(0, (elapsedSeconds / targetValue) * 100));
    const remainingSecs = Math.max(0, targetValue - elapsedSeconds);
    const mins = Math.floor(remainingSecs / 60);
    const secs = remainingSecs % 60;
    const formattedRemaining = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    targetHeaderText = `Thời gian còn lại | ${formattedRemaining}`;
  } else if (targetType === 'CALORIES' && targetValue > 0) {
    isGoalReached = currentCalories >= targetValue;
    targetProgressPercent = Math.min(100, Math.max(0, (currentCalories / targetValue) * 100));
    const remainingCal = Math.max(0, Math.round(targetValue - currentCalories));
    targetHeaderText = `Calo còn lại | ${remainingCal} kcal`;
  }

  // Format running pace: m'ss"
  const formatPace = () => {
    if (currentDistanceKm <= 0.005 || elapsedSeconds === 0) return '--';
    const paceSecondsPerKm = elapsedSeconds / currentDistanceKm;
    if (paceSecondsPerKm > 3600 || paceSecondsPerKm < 60) return '--';
    const m = Math.floor(paceSecondsPerKm / 60);
    const s = Math.floor(paceSecondsPerKm % 60);
    return `${m}'${s.toString().padStart(2, '0')}"`;
  };

  // Format running cadence: SPM (steps per minute)
  const formatCadence = () => {
    if (elapsedSeconds < 3 || currentSteps === 0) return '--';
    const spm = Math.round((currentSteps / elapsedSeconds) * 60);
    return `${spm}`;
  };

  // Trigger celebration haptic vibration when goal is reached
  useEffect(() => {
    if (isGoalReached && !hasCelebratedRef.current) {
      hasCelebratedRef.current = true;
      try {
        Vibration.vibrate([0, 150, 100, 200]);
      } catch {}
    }
  }, [isGoalReached]);

  // Trigger countdown automatically on mount if status is READY
  useEffect(() => {
    if (status === 'READY') {
      startCountdown();
    }
  }, [status, startCountdown]);

  // Real-time GPS Location Tracking lifecycle for outdoor exercises
  useEffect(() => {
    if (isGpsSport && status === 'ACTIVE') {
      void locationTrackingService.startTracking();
    } else if (status === 'PAUSED' || status === 'COMPLETED' || status === 'IDLE') {
      void locationTrackingService.stopTracking();
    }

    return () => {
      void locationTrackingService.stopTracking();
    };
  }, [status, isGpsSport]);

  // Format seconds to mm:ss or hh:mm:ss
  const formatDuration = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const handleFinish = async () => {
    const session = finishWorkout();
    if (session) {
      // Async background sync with Backend
      workoutApiService.saveSession(session).catch((err) => {
        console.warn('Backend sync failed, session kept in MMKV:', err);
      });

      // Navigate directly to summary screen (Image 4)
      router.replace({
        pathname: '/workout/summary' as any,
        params: {
          exerciseId: session.exerciseId || exercise?.id || '',
          exerciseName: session.exerciseName,
          durationSeconds: String(session.durationSeconds),
          caloriesBurned: String(session.caloriesBurned),
          totalCalories: String(session.totalCalories || session.caloriesBurned),
          distanceKm: session.distanceKm ? String(session.distanceKm) : undefined,
          avgHeartRate: session.avgHeartRate ? String(session.avgHeartRate) : undefined,
          startedAt: String(session.startedAt),
        },
      });
    }
  };

  // =========================================================================
  // SCREEN LOCKED (FOCUS MODE) - Exact Samsung Health Image Specs
  // =========================================================================
  if (isScreenLocked) {
    return (
      <ScreenWrapper
        statusBarStyle="light"
        scrollable={false}
        className="bg-black"
      >
        <View className="flex-1 justify-between bg-black px-4 pb-6">
          {/* Top Bar: Only sport name, no exit/action buttons while locked */}
          <View className="pt-2 pb-1 px-1">
            <Text className="text-white font-bold text-xl tracking-tight">
              {exercise?.name || 'Cầu lông'}
            </Text>
          </View>

          {/* Target Header & Progress Bar (Only if hasTarget) */}
          {hasTarget && (
            <View className="items-center justify-center pt-1 pb-2">
              {isGoalReached ? (
                <Text className="text-[#8E95A2] font-bold text-[17px] tracking-tight">
                  Đã đạt mục tiêu!
                </Text>
              ) : (
                <>
                  <Text className="text-[#8E95A2] font-medium text-[14px] tracking-tight mb-2">
                    {targetHeaderText}
                  </Text>
                  <View className="w-[62%] h-[6px] bg-[#27282B] rounded-full overflow-hidden">
                    <View
                      className="h-full bg-[#00C853] rounded-full"
                      style={{ width: `${Math.max(targetProgressPercent, 3)}%` }}
                    />
                  </View>
                </>
              )}
            </View>
          )}

          {/* Live Heart Rate Chip (If available) */}
          {currentHeartRate > 0 && (
            <View className="flex-row items-center justify-center gap-1.5 self-center bg-rose-950/40 border border-rose-800/40 px-3.5 py-1 rounded-full mb-1">
              <Heart color="#F43F5E" size={14} fill="#F43F5E" />
              <Text className="text-rose-400 font-bold text-xs">
                {currentHeartRate} bpm
              </Text>
            </View>
          )}

          {/* Two Dark Focus Cards */}
          <View className="flex-1 justify-between mb-4 mt-1">
            {/* CARD 1: THỜI LƯỢNG */}
            <View
              className="bg-[#18181A] rounded-[32px] p-6 flex-1 items-center justify-center mb-3.5 relative overflow-hidden"
              style={{
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 10,
                elevation: 3,
              }}
            >
              {/* Confetti specks for Goal Reached */}
              {hasTarget && isGoalReached && (
                <>
                  <View
                    className="absolute w-4 h-1.5 rounded-full bg-amber-400 opacity-80"
                    style={{ top: 36, left: 28, transform: [{ rotate: '-25deg' }] }}
                  />
                  <View
                    className="absolute w-4 h-2 rounded-full bg-emerald-500 opacity-90"
                    style={{ top: 24, left: '52%', transform: [{ rotate: '15deg' }] }}
                  />
                  <View
                    className="absolute w-3 h-1.5 rounded-full bg-amber-400 opacity-85"
                    style={{ top: 85, left: 38, transform: [{ rotate: '42deg' }] }}
                  />
                </>
              )}

              <Text className="text-[#8E95A2] text-sm font-medium mb-2.5">
                Thời lượng
              </Text>
              <Text className="text-[52px] font-extrabold tracking-tight text-white">
                {formatDuration(elapsedSeconds)}
              </Text>
            </View>

            {/* CARD 2: KHOẢNG CÁCH (GPS) HOẶC CALO */}
            <View
              className="bg-[#18181A] rounded-[32px] p-6 flex-1 items-center justify-center"
              style={{
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 10,
                elevation: 3,
              }}
            >
              <Text className="text-[#8E95A2] text-sm font-medium mb-2.5">
                {isGpsSport && targetType !== 'CALORIES' ? 'Khoảng cách' : 'Calo'}
              </Text>
              <Text className="text-[52px] font-extrabold tracking-tight text-white">
                {isGpsSport && targetType !== 'CALORIES'
                  ? `${currentDistanceKm.toFixed(2).replace('.', ',')} km`
                  : `${Math.round(currentCalories)} kcal`}
              </Text>
            </View>
          </View>

          {/* Bottom Slide to Unlock Slider */}
          <View className="pt-2 pb-1">
            <SlideToUnlock onUnlock={toggleScreenLock} />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      statusBarStyle="dark"
      scrollable={false}
      className="bg-[#F2F4F7]"
    >
      <View className="flex-1 justify-between bg-[#F2F4F7] px-4 pb-6">
        {/* ========================================================================= */}
        {/* TOP COMPACT BAR: < Cầu lông                [headphones] [music] [more]    */}
        {/* ========================================================================= */}
        <View className="flex-row items-center justify-between pt-1 pb-1">
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setShowExitConfirm(true)}
              className="w-10 h-10 items-center justify-center -ml-2 active:opacity-70"
              hitSlop={8}
            >
              <ArrowLeft color="#0F172A" size={24} strokeWidth={2.2} />
            </Pressable>
            <Text className="text-slate-900 font-bold text-xl tracking-tight">
              {exercise?.name || 'Cầu lông'}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <Pressable className="w-10 h-10 items-center justify-center active:opacity-70" hitSlop={6}>
              <Headphones color="#0F172A" size={22} strokeWidth={2} />
            </Pressable>
            <Pressable className="w-10 h-10 items-center justify-center active:opacity-70" hitSlop={6}>
              <Music color="#0F172A" size={22} strokeWidth={2} />
            </Pressable>
            <Pressable className="w-10 h-10 items-center justify-center active:opacity-70" hitSlop={6}>
              <MoreVertical color="#0F172A" size={22} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* TARGET HEADER & PROGRESS BAR (Images 1 & 2 Specs)                         */}
        {/* ========================================================================= */}
        {hasTarget && (
          <View className="items-center justify-center pt-1 pb-2">
            {isGoalReached ? (
              <Text className="text-[#788292] font-bold text-[17px] tracking-tight">
                Đã đạt mục tiêu!
              </Text>
            ) : (
              <>
                <Text className="text-[#788292] font-medium text-[14px] tracking-tight mb-2">
                  {targetHeaderText}
                </Text>
                <View className="w-[62%] h-[6px] bg-[#E3E6EB] rounded-full overflow-hidden">
                  <View
                    className="h-full bg-[#00C853] rounded-full"
                    style={{ width: `${Math.max(targetProgressPercent, 3)}%` }}
                  />
                </View>
              </>
            )}
          </View>
        )}

        {/* Live Heart Rate Chip (When BLE Wearable is reading HR) */}
        {currentHeartRate > 0 && (
          <View className="flex-row items-center justify-center gap-1.5 self-center bg-rose-50 border border-rose-200/80 px-3.5 py-1 rounded-full mb-1 shadow-xs">
            <Heart color="#F43F5E" size={14} fill="#F43F5E" />
            <Text className="text-rose-600 font-bold text-xs">
              {currentHeartRate} bpm
            </Text>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STATE 1: COUNTDOWN (3 -> 2 -> 1)                                          */}
        {/* ========================================================================= */}
        {status === 'COUNTDOWN' ? (
          <View
            className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex-1 items-center justify-center mb-4 mt-1"
            style={{
              shadowColor: 'rgba(15, 23, 42, 0.04)',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            {/* Giant Green Gradient Number */}
            <Svg height="240" width="200" viewBox="0 0 100 120">
              <Defs>
                <LinearGradient id="countdownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#4ADE80" />
                  <Stop offset="50%" stopColor="#22C55E" />
                  <Stop offset="100%" stopColor="#16A34A" />
                </LinearGradient>
              </Defs>
              <SvgText
                x="50"
                y="100"
                fontSize="110"
                fontWeight="900"
                textAnchor="middle"
                fill="url(#countdownGrad)"
              >
                {countdownValue}
              </SvgText>
            </Svg>
          </View>
        ) : isGpsSport ? (
          /* ========================================================================= */
          /* GPS MAP WORKOUT ACTIVE/PAUSED SCREEN (Exact Screenshot 4 Specs)           */
          /* ========================================================================= */
          <View className="flex-1 justify-between mb-3 mt-1">
            {/* Top Section: Map Container (~48% height) */}
            <View
              className="w-full h-[47%] rounded-[28px] overflow-hidden mb-2.5 border border-slate-200/80 shadow-sm"
              style={{
                shadowColor: 'rgba(15, 23, 42, 0.05)',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 1,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              <SportMapView status="detected" height="100%" showPolyline />
            </View>

            {/* Bottom Section: 2x2 Metric Cards Grid + Pagination Dots */}
            <View className="flex-1 justify-between">
              {activeMetricPage === 0 ? (
                /* Page 0: Thời lượng, Khoảng cách, Nhịp độ, Nhịp (Screenshot 4) */
                <View className="flex-1 flex-col justify-between py-0.5">
                  {/* Row 1 */}
                  <View className="flex-row gap-3 flex-1 mb-2.5">
                    {/* Card 1: Thời lượng */}
                    <View
                      className="flex-1 bg-white rounded-[22px] p-4 border border-slate-100/90 shadow-sm justify-center"
                      style={{
                        shadowColor: 'rgba(15, 23, 42, 0.04)',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 1,
                        shadowRadius: 6,
                        elevation: 1,
                      }}
                    >
                      <Text className="text-[#788292] text-xs font-medium mb-1">
                        Thời lượng
                      </Text>
                      <Text
                        className={`text-[26px] font-extrabold tracking-tight ${
                          status === 'PAUSED' ? 'text-slate-300' : 'text-[#1E232A]'
                        }`}
                      >
                        {formatDuration(elapsedSeconds)}
                      </Text>
                    </View>

                    {/* Card 2: Khoảng cách */}
                    <View
                      className="flex-1 bg-white rounded-[22px] p-4 border border-slate-100/90 shadow-sm justify-center"
                      style={{
                        shadowColor: 'rgba(15, 23, 42, 0.04)',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 1,
                        shadowRadius: 6,
                        elevation: 1,
                      }}
                    >
                      <Text className="text-[#788292] text-xs font-medium mb-1">
                        Khoảng cách
                      </Text>
                      <View className="flex-row items-baseline">
                        <Text
                          className={`text-[26px] font-extrabold tracking-tight ${
                            status === 'PAUSED' ? 'text-slate-300' : 'text-[#1E232A]'
                          }`}
                        >
                          {currentDistanceKm.toFixed(2).replace('.', ',')}
                        </Text>
                        <Text className="text-sm font-semibold text-slate-800 ml-1.5">
                          km
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Row 2 */}
                  <View className="flex-row gap-3 flex-1">
                    {/* Card 3: Nhịp độ */}
                    <View
                      className="flex-1 bg-white rounded-[22px] p-4 border border-slate-100/90 shadow-sm justify-center"
                      style={{
                        shadowColor: 'rgba(15, 23, 42, 0.04)',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 1,
                        shadowRadius: 6,
                        elevation: 1,
                      }}
                    >
                      <Text className="text-[#788292] text-xs font-medium mb-1">
                        Nhịp độ
                      </Text>
                      <View className="flex-row items-baseline">
                        <Text
                          className={`text-[26px] font-extrabold tracking-tight ${
                            status === 'PAUSED' ? 'text-slate-300' : 'text-[#1E232A]'
                          }`}
                        >
                          {formatPace()}
                        </Text>
                        <Text className="text-xs font-semibold text-slate-500 ml-1">
                          /km
                        </Text>
                      </View>
                    </View>

                    {/* Card 4: Nhịp */}
                    <View
                      className="flex-1 bg-white rounded-[22px] p-4 border border-slate-100/90 shadow-sm justify-center"
                      style={{
                        shadowColor: 'rgba(15, 23, 42, 0.04)',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 1,
                        shadowRadius: 6,
                        elevation: 1,
                      }}
                    >
                      <Text className="text-[#788292] text-xs font-medium mb-1">
                        Nhịp
                      </Text>
                      <View className="flex-row items-baseline">
                        <Text
                          className={`text-[26px] font-extrabold tracking-tight ${
                            status === 'PAUSED' ? 'text-slate-300' : 'text-[#1E232A]'
                          }`}
                        >
                          {formatCadence()}
                        </Text>
                        <Text className="text-xs font-semibold text-slate-500 ml-1">
                          spm
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                /* Page 1: Calo, Nhịp tim, Tốc độ, Bước chân */
                <View className="flex-1 flex-col justify-between py-0.5">
                  {/* Row 1 */}
                  <View className="flex-row gap-3 flex-1 mb-2.5">
                    {/* Card 1: Calo */}
                    <View
                      className="flex-1 bg-white rounded-[22px] p-4 border border-slate-100/90 shadow-sm justify-center"
                      style={{
                        shadowColor: 'rgba(15, 23, 42, 0.04)',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 1,
                        shadowRadius: 6,
                        elevation: 1,
                      }}
                    >
                      <Text className="text-[#788292] text-xs font-medium mb-1">
                        Calo
                      </Text>
                      <View className="flex-row items-baseline">
                        <Text
                          className={`text-[26px] font-extrabold tracking-tight ${
                            status === 'PAUSED' ? 'text-slate-300' : 'text-[#1E232A]'
                          }`}
                        >
                          {Math.round(currentCalories)}
                        </Text>
                        <Text className="text-xs font-semibold text-slate-500 ml-1.5">
                          kcal
                        </Text>
                      </View>
                    </View>

                    {/* Card 2: Nhịp tim */}
                    <View
                      className="flex-1 bg-white rounded-[22px] p-4 border border-slate-100/90 shadow-sm justify-center"
                      style={{
                        shadowColor: 'rgba(15, 23, 42, 0.04)',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 1,
                        shadowRadius: 6,
                        elevation: 1,
                      }}
                    >
                      <Text className="text-[#788292] text-xs font-medium mb-1">
                        Nhịp tim
                      </Text>
                      <View className="flex-row items-baseline">
                        <Text
                          className={`text-[26px] font-extrabold tracking-tight ${
                            status === 'PAUSED' ? 'text-slate-300' : 'text-[#1E232A]'
                          }`}
                        >
                          {currentHeartRate > 0 ? currentHeartRate : '--'}
                        </Text>
                        <Text className="text-xs font-semibold text-slate-500 ml-1.5">
                          bpm
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Row 2 */}
                  <View className="flex-row gap-3 flex-1">
                    {/* Card 3: Tốc độ */}
                    <View
                      className="flex-1 bg-white rounded-[22px] p-4 border border-slate-100/90 shadow-sm justify-center"
                      style={{
                        shadowColor: 'rgba(15, 23, 42, 0.04)',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 1,
                        shadowRadius: 6,
                        elevation: 1,
                      }}
                    >
                      <Text className="text-[#788292] text-xs font-medium mb-1">
                        Tốc độ
                      </Text>
                      <View className="flex-row items-baseline">
                        <Text
                          className={`text-[26px] font-extrabold tracking-tight ${
                            status === 'PAUSED' ? 'text-slate-300' : 'text-[#1E232A]'
                          }`}
                        >
                          {currentSpeedKmh.toFixed(1).replace('.', ',')}
                        </Text>
                        <Text className="text-xs font-semibold text-slate-500 ml-1.5">
                          km/h
                        </Text>
                      </View>
                    </View>

                    {/* Card 4: Số bước */}
                    <View
                      className="flex-1 bg-white rounded-[22px] p-4 border border-slate-100/90 shadow-sm justify-center"
                      style={{
                        shadowColor: 'rgba(15, 23, 42, 0.04)',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 1,
                        shadowRadius: 6,
                        elevation: 1,
                      }}
                    >
                      <Text className="text-[#788292] text-xs font-medium mb-1">
                        Số bước
                      </Text>
                      <View className="flex-row items-baseline">
                        <Text
                          className={`text-[26px] font-extrabold tracking-tight ${
                            status === 'PAUSED' ? 'text-slate-300' : 'text-[#1E232A]'
                          }`}
                        >
                          {currentSteps}
                        </Text>
                        <Text className="text-xs font-semibold text-slate-500 ml-1.5">
                          bước
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Pagination Indicator Dots (Screenshot 4) */}
              <View className="flex-row items-center justify-center gap-2 pt-2 pb-0.5">
                <Pressable
                  onPress={() => setActiveMetricPage(0)}
                  className={`rounded-full ${
                    activeMetricPage === 0
                      ? 'w-2.5 h-2.5 bg-slate-700'
                      : 'w-2 h-2 bg-slate-300'
                  }`}
                  hitSlop={8}
                />
                <Pressable
                  onPress={() => setActiveMetricPage(1)}
                  className={`rounded-full ${
                    activeMetricPage === 1
                      ? 'w-2.5 h-2.5 bg-slate-700'
                      : 'w-2 h-2 bg-slate-300'
                  }`}
                  hitSlop={8}
                />
              </View>
            </View>
          </View>
        ) : (
          /* ========================================================================= */
          /* NON-GPS ACTIVE & PAUSED - Standard 2 Big Cards                            */
          /* ========================================================================= */
          <View className="flex-1 justify-between mb-3 mt-1">
            {/* CARD 1: THỜI LƯỢNG */}
            <View
              className="bg-white rounded-[32px] p-6 shadow-sm flex-1 items-center justify-center mb-3.5 relative overflow-hidden"
              style={{
                shadowColor: 'rgba(15, 23, 42, 0.04)',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 12,
                elevation: 2,
              }}
            >
              {/* Confetti specks for Goal Reached */}
              {hasTarget && isGoalReached && (
                <>
                  <View
                    className="absolute w-4 h-1.5 rounded-full bg-amber-400 opacity-80"
                    style={{
                      top: 36,
                      left: 28,
                      transform: [{ rotate: '-25deg' }],
                    }}
                  />
                  <View
                    className="absolute w-4 h-2 rounded-full bg-emerald-500 opacity-90"
                    style={{
                      top: 24,
                      left: '52%',
                      transform: [{ rotate: '15deg' }],
                    }}
                  />
                  <View
                    className="absolute w-3 h-1.5 rounded-full bg-amber-400 opacity-85"
                    style={{
                      top: 85,
                      left: 38,
                      transform: [{ rotate: '42deg' }],
                    }}
                  />
                </>
              )}

              <Text className="text-[#788292] text-sm font-medium mb-2.5">
                Thời lượng
              </Text>
              <Text
                className={`text-[52px] font-extrabold tracking-tight ${
                  status === 'PAUSED' ? 'text-slate-200' : 'text-[#1E232A]'
                }`}
              >
                {formatDuration(elapsedSeconds)}
              </Text>
            </View>

            {/* CARD 2: CALO */}
            <View
              className="bg-white rounded-[32px] p-6 shadow-sm flex-1 items-center justify-center"
              style={{
                shadowColor: 'rgba(15, 23, 42, 0.04)',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 12,
                elevation: 2,
              }}
            >
              <Text className="text-[#788292] text-sm font-medium mb-2.5">
                Calo
              </Text>
              <Text
                className={`text-[52px] font-extrabold tracking-tight ${
                  status === 'PAUSED' ? 'text-slate-300' : 'text-[#1E232A]'
                }`}
              >
                {Math.round(currentCalories)} kcal
              </Text>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* BOTTOM CONTROLS BAR (Images 1, 2, 3)                                     */}
        {/* ========================================================================= */}
        <View className="flex-row items-center justify-between pt-2">
          {/* Lock Button */}
          <Pressable
            disabled={status === 'COUNTDOWN'}
            onPress={toggleScreenLock}
            className={`w-[50px] h-[50px] rounded-full items-center justify-center shadow-sm ${
              status === 'COUNTDOWN' ? 'bg-[#EAECEF]/60' : 'bg-[#EAECEF] active:bg-slate-300'
            }`}
            hitSlop={6}
          >
            {isScreenLocked ? (
              <Unlock color="#1E232A" size={22} strokeWidth={2.2} />
            ) : (
              <Lock
                color={status === 'COUNTDOWN' ? '#94A3B8' : '#1E232A'}
                size={22}
                strokeWidth={2.2}
              />
            )}
          </Pressable>

          {/* Central Actions depending on Status */}
          {status === 'COUNTDOWN' ? (
            /* Disabled "Tạm dừng" button during countdown (Image 1) */
            <View className="flex-1 py-4 bg-[#EAECEF]/60 rounded-full items-center justify-center mx-3 shadow-sm">
              <Text className="text-slate-400 font-bold text-base tracking-wide">
                Tạm dừng
              </Text>
            </View>
          ) : status === 'ACTIVE' ? (
            /* Active "Tạm dừng" button (Image 2) */
            <Pressable
              onPress={pauseWorkout}
              className="flex-1 py-4 bg-[#EAECEF] active:bg-slate-300 rounded-full items-center justify-center mx-3 shadow-sm"
            >
              <Text className="text-[#1E232A] font-bold text-base tracking-wide">
                Tạm dừng
              </Text>
            </Pressable>
          ) : (
            /* Paused State: "Tiếp tục" + "Hoàn tất" (Image 3) */
            <View className="flex-1 flex-row mx-2">
              {/* Nút Tiếp tục */}
              <Pressable
                onPress={resumeWorkout}
                className="flex-1 py-4 bg-[#EAECEF] active:bg-slate-300 rounded-full items-center justify-center mr-2 shadow-sm"
              >
                <Text className="text-[#1E232A] font-bold text-base tracking-wide">
                  Tiếp tục
                </Text>
              </Pressable>

              {/* Nút Hoàn tất (Red Pill) */}
              <Pressable
                onPress={handleFinish}
                className="flex-1 py-4 bg-[#D91B1B] active:bg-red-700 rounded-full items-center justify-center ml-2 shadow-md"
              >
                <Text className="text-white font-bold text-base tracking-wide">
                  Hoàn tất
                </Text>
              </Pressable>
            </View>
          )}

          {/* Settings Gear Button */}
          <Pressable
            disabled={status === 'COUNTDOWN'}
            className={`w-[50px] h-[50px] rounded-full items-center justify-center shadow-sm ${
              status === 'COUNTDOWN' ? 'bg-[#EAECEF]/60' : 'bg-[#EAECEF] active:bg-slate-300'
            }`}
            hitSlop={6}
          >
            <Settings
              color={status === 'COUNTDOWN' ? '#94A3B8' : '#1E232A'}
              size={22}
              strokeWidth={2.2}
            />
          </Pressable>
        </View>

        {/* SCREEN LOCK OVERLAY */}
        {isScreenLocked && (
          <View className="absolute inset-0 bg-black/60 z-50 items-center justify-center rounded-[32px] m-4">
            <Pressable
              onPress={toggleScreenLock}
              className="items-center p-6 bg-white rounded-3xl border border-slate-200 shadow-2xl active:opacity-85"
            >
              <Lock color="#10B981" size={40} className="mb-3" />
              <Text className="text-slate-900 font-bold text-base mb-1">
                Màn hình đang khóa
              </Text>
              <Text className="text-slate-500 text-xs">
                Chạm vào đây để mở khóa
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* CONFIRM EXIT MODAL */}
      <Modal
        visible={showExitConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitConfirm(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-6">
          <View className="bg-white rounded-3xl p-6 border border-slate-100 w-full max-w-sm shadow-2xl">
            <Text className="text-slate-900 font-bold text-lg mb-2">
              Dừng buổi tập?
            </Text>
            <Text className="text-slate-500 text-sm leading-5 mb-6">
              Bạn có chắc chắn muốn thoát khỏi phiên tập hiện tại không? Số liệu buổi tập sẽ không được lưu nếu chưa kết thúc.
            </Text>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowExitConfirm(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 active:bg-slate-200 items-center justify-center"
              >
                <Text className="text-slate-700 font-semibold">Tiếp tục tập</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowExitConfirm(false);
                  resetWorkout();
                  router.back();
                }}
                className="flex-1 py-3 rounded-2xl bg-red-600 active:bg-red-700 items-center justify-center"
              >
                <Text className="text-white font-bold">Thoát</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}
