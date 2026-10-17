import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Share2,
  Pencil,
  MoreVertical,
  FileText,
  Check,
  MapPin,
} from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { SportSummaryHeaderGraphic } from '@/components/features/workout/SportSummaryHeaderGraphic';
import { SportMapView } from '@/components/features/workout/SportMapView';
import { decodePolyline } from '@/utils/polylineEncoder';
import { getSportThemeConfig } from '@/components/features/workout/sportThemeConfig';
import { useWorkoutEngineStore } from '@/services/workout/workoutEngineStore';
import { useWorkoutCatalogStore } from '@/services/workout/workoutCatalogStore';
import {
  formatWorkoutDecimal,
  getExerciseName,
  getMonthShort,
  getWeekdayAbbr,
} from '@/services/workout/workoutI18n';
import { useTranslation } from 'react-i18next';

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const { t } = useTranslation('workout');
  const params = useLocalSearchParams();
  const lastSession = useWorkoutEngineStore((state) => state.lastCompletedSession);
  const sessions = useWorkoutCatalogStore((state) => state.sessions);
  const saveSession = useWorkoutCatalogStore((state) => state.saveSession);

  // Buổi tập đang xem: theo sessionId (mở từ lịch sử hoặc vừa kết thúc), không có thì là buổi vừa tập xong
  const sessionId = params.sessionId as string | undefined;
  const session = (sessionId && sessions.find((s) => s.id === sessionId)) || (!sessionId ? lastSession : null);

  const exerciseId = (params.exerciseId as string) || session?.exerciseId || '';
  // Tên gốc (tiếng Việt, lưu trong session) dùng để nhận diện theme; tên hiển thị dịch theo id
  const exerciseName = (params.exerciseName as string) || session?.exerciseName || t('common.workout');
  const displayExerciseName = exerciseId
    ? getExerciseName({ id: exerciseId, name: exerciseName })
    : exerciseName;
  const durationSeconds = Number(params.durationSeconds) || session?.durationSeconds || 0;
  const caloriesBurned = Number(params.caloriesBurned) || session?.caloriesBurned || 0;
  const totalCalories = Number(params.totalCalories) || session?.totalCalories || caloriesBurned;
  const avgHeartRate = Number(params.avgHeartRate) || session?.avgHeartRate;
  const totalSteps = Number(params.totalSteps) || session?.totalSteps;
  const avgSpeedKmh = Number(params.avgSpeedKmh) || session?.avgSpeedKmh;
  const [startedAt] = useState(() => Number(params.startedAt) || session?.startedAt || Date.now());

  const [note, setNote] = useState<string>(session?.note || (params.note as string) || '');
  const [isSaved, setIsSaved] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Lưu ghi chú khi rời ô nhập (saveSession tự đồng bộ lên server) — không gọi API mỗi lần gõ phím
  const handleNoteBlur = () => {
    if (!session || note === (session.note || '')) return;
    saveSession({ ...session, note });
    setIsSaved(true);
  };

  const effectiveGpsTrack = React.useMemo(() => {
    if (session?.gpsTrack && session.gpsTrack.length >= 2) {
      return session.gpsTrack;
    }
    if (session?.encodedPolyline && session.encodedPolyline.trim().length > 0) {
      const decoded = decodePolyline(session.encodedPolyline);
      if (decoded.length >= 2) {
        return decoded.map((coord, idx) => ({
          ...coord,
          timestamp: (session.startedAt || 0) + idx * 1000,
        }));
      }
    }
    return null;
  }, [session]);

  // Tự động khôi phục quãng đường từ danh sách tọa độ GPS nếu session chưa có distanceKm
  const calculatedTrackDistanceKm = React.useMemo(() => {
    if (!effectiveGpsTrack || effectiveGpsTrack.length < 2) return 0;
    let totalKm = 0;
    const R = 6371; // Bán kính Trái Đất (km)
    for (let i = 1; i < effectiveGpsTrack.length; i++) {
      const p1 = effectiveGpsTrack[i - 1];
      const p2 = effectiveGpsTrack[i];
      const dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
      const dLon = ((p2.longitude - p1.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((p1.latitude * Math.PI) / 180) *
          Math.cos((p2.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c;
      if (d > 0.0005 && d < 0.2) {
        totalKm += d;
      }
    }
    return totalKm;
  }, [effectiveGpsTrack]);

  const rawDistance = Number(params.distanceKm) || session?.distanceKm || 0;
  const resolvedDistanceKm = rawDistance > 0 ? rawDistance : calculatedTrackDistanceKm;

  const isDistanceSport =
    session?.trackingType === 'DISTANCE_GPS' ||
    session?.trackingType === 'INDOOR_STEP' ||
    exerciseId.includes('walk') ||
    exerciseId.includes('run') ||
    exerciseId.includes('cycl') ||
    exerciseId.includes('hik') ||
    Boolean(effectiveGpsTrack && effectiveGpsTrack.length >= 2) ||
    resolvedDistanceKm > 0;

  // Tự động cập nhật lưu quãng đường đã khôi phục vào storage nếu session cũ bị thiếu
  React.useEffect(() => {
    if (session && (!session.distanceKm || session.distanceKm <= 0) && calculatedTrackDistanceKm > 0) {
      saveSession({
        ...session,
        distanceKm: Math.round(calculatedTrackDistanceKm * 100) / 100,
      });
    }
  }, [session, calculatedTrackDistanceKm, saveSession]);

  const themeConfig = getSportThemeConfig(exerciseId, exerciseName);

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSummaryDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const hrs = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return t('date.dateTime', {
      weekday: getWeekdayAbbr(date.getDay()),
      day: date.getDate(),
      monthShort: getMonthShort(date.getMonth() + 1),
      year: date.getFullYear(),
      time: `${hrs}:${mins}`,
    });
  };

  return (
    <ScreenWrapper statusBarStyle="light">
      <View style={{ flex: 1, backgroundColor: themeConfig.bgColor }}>
        <ScrollView
          style={{ backgroundColor: themeConfig.bgColor, flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
        {/* ========================================================================= */}
        {/* TOP SECTION: SPORT COURT / THEME BANNER (Dynamic per Sport)              */}
        {/* ========================================================================= */}
        <View className="px-5 pt-3 pb-8 relative">
          {/* Header Action Row */}
          <View className="flex-row items-center justify-between mb-8">
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/workout' as any);
                }
              }}
              className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
              hitSlop={8}
            >
              <ArrowLeft color="#FFFFFF" size={24} />
            </Pressable>

            <View className="flex-row items-center gap-2">
              <Pressable className="w-10 h-10 rounded-full items-center justify-center active:opacity-70" hitSlop={6}>
                <Share2 color="#FFFFFF" size={20} />
              </Pressable>
              <Pressable className="w-10 h-10 rounded-full items-center justify-center active:opacity-70" hitSlop={6}>
                <Pencil color="#FFFFFF" size={20} />
              </Pressable>
              <Pressable className="w-10 h-10 rounded-full items-center justify-center active:opacity-70" hitSlop={6}>
                <MoreVertical color="#FFFFFF" size={20} />
              </Pressable>
            </View>
          </View>

          {/* Sport Equipment Graphic (Top-Right, e.g. Shuttlecock, Running Shoe, Bike, etc.) */}
          <View className="absolute right-5 top-12 opacity-95">
            <SportSummaryHeaderGraphic exerciseId={exerciseId} exerciseName={exerciseName} />
          </View>

          {/* Session Overview Titles */}
          <View className="pr-28">
            <Text className="text-white text-base font-medium">
              {displayExerciseName}
            </Text>
            {isDistanceSport && resolvedDistanceKm > 0 ? (
              <>
                <View className="flex-row items-baseline mt-1">
                  <Text className="text-white text-5xl font-extrabold tracking-tight">
                    {formatWorkoutDecimal(resolvedDistanceKm, 2)}
                  </Text>
                  <Text className="text-white/90 text-2xl font-bold ml-2">km</Text>
                </View>
                <Text className="text-white/80 text-xs font-normal mt-2">
                  {formatDuration(durationSeconds)} • {formatSummaryDate(startedAt)}
                </Text>
              </>
            ) : (
              <>
                <Text className="text-white text-5xl font-extrabold mt-1 tracking-tight">
                  {formatDuration(durationSeconds)}
                </Text>
                <Text className="text-white/80 text-xs font-normal mt-2">
                  {formatSummaryDate(startedAt)}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* ========================================================================= */}
        {/* BOTTOM SECTION: CHI TIẾT TẬP LUYỆN (Image 4 Specs)                        */}
        {/* ========================================================================= */}
        <View
          className="bg-white rounded-t-[36px] p-6 flex-1 shadow-2xl"
          style={{ minHeight: 460 }}
        >
          <Text className="text-slate-900 text-lg font-bold mb-4">
            {t('summary.details')}
          </Text>

          {/* ========================================================================= */}
          {/* WORKOUT ROUTE MAP CARD (If GPS Track Exists)                              */}
          {/* ========================================================================= */}
          {effectiveGpsTrack && effectiveGpsTrack.length >= 2 ? (
            <View className="mb-5 bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm">
              {/* Header bar của Card Bản đồ */}
              <View className="px-4 py-3 flex-row items-center justify-between bg-slate-50 border-b border-slate-100">
                <View className="flex-row items-center gap-2">
                  <View className="w-7 h-7 rounded-lg bg-emerald-100 items-center justify-center">
                    <MapPin color="#059669" size={16} />
                  </View>
                  <View>
                    <Text className="text-xs font-bold text-slate-800">
                      {t('map.routeMap')}
                    </Text>
                    <Text className="text-[10px] text-slate-500 font-medium">
                      {t('map.routePointsCount', { count: effectiveGpsTrack.length })}
                    </Text>
                  </View>
                </View>

                {isDistanceSport ? (
                  <View className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/70">
                    <Text className="text-xs font-bold text-emerald-700">
                      {formatWorkoutDecimal(resolvedDistanceKm, 2)} km
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Khung bản đồ Native MapLibre / MapTiler */}
              <SportMapView
                gpsTrack={effectiveGpsTrack}
                height={260}
                showPolyline={true}
                showUserLocation={false}
                showStartFinishMarkers={true}
                fitBoundsOnMount={true}
              />

              {/* Footer chú giải: Điểm xuất phát (Start) và Điểm kết thúc (Finish) + Pace / Vận tốc */}
              <View className="p-3.5 bg-white flex-row items-center justify-between border-t border-slate-100">
                <View className="flex-row items-center gap-4">
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-2.5 h-2.5 rounded-full bg-[#10B981] border border-white shadow-xs" />
                    <Text className="text-[11px] font-semibold text-slate-600">
                      {t('map.startPoint')}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-2.5 h-2.5 rounded-full bg-[#EF4444] border border-white shadow-xs" />
                    <Text className="text-[11px] font-semibold text-slate-600">
                      {t('map.finishPoint')}
                    </Text>
                  </View>
                </View>

                {session?.avgSpeedKmh && session.avgSpeedKmh > 0 ? (
                  <Text className="text-[11px] font-bold text-slate-700">
                    {formatWorkoutDecimal(session.avgSpeedKmh, 1)} km/h
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* 4 Metric Cards Grid */}
          <View className="flex-row flex-wrap justify-between gap-y-3.5 mb-4">
            {/* Card Khoảng cách: Luôn hiển thị cho môn vận động có quãng đường / GPS */}
            {isDistanceSport ? (
              <View className="w-[48%] bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                <Text className="text-emerald-500 font-semibold text-xs mb-1.5">
                  {t('summary.distance')}
                </Text>
                <Text className="text-slate-900 font-bold text-2xl tracking-tight">
                  {formatWorkoutDecimal(resolvedDistanceKm, 2)}{' '}
                  <Text className="text-base font-normal text-slate-700">km</Text>
                </Text>
              </View>
            ) : null}

            {/* Card: Tổng thời gian */}
            <View className="w-[48%] bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <Text className="text-cyan-500 font-semibold text-xs mb-1.5">
                {t('summary.totalTime')}
              </Text>
              <Text className="text-slate-900 font-bold text-2xl tracking-tight">
                {formatDuration(durationSeconds)}
              </Text>
            </View>

            {/* Card 2: Calo tập luyện */}
            <View className="w-[48%] bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <Text className="text-purple-400 font-semibold text-xs mb-1.5">
                {t('summary.activeCalories')}
              </Text>
              <Text className="text-slate-900 font-bold text-2xl tracking-tight">
                {caloriesBurned} <Text className="text-base font-normal text-slate-700">kcal</Text>
              </Text>
            </View>

            {/* Card 3: Tổng lượng calo */}
            <View className="w-[48%] bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <Text className="text-purple-400 font-semibold text-xs mb-1.5">
                {t('summary.totalCalories')}
              </Text>
              <Text className="text-slate-900 font-bold text-2xl tracking-tight">
                {totalCalories} <Text className="text-base font-normal text-slate-700">kcal</Text>
              </Text>
            </View>

            {/* Card 4: Nhịp tim trung bình (Nếu có từ đồng hồ) */}
            {avgHeartRate && avgHeartRate > 0 ? (
              <View className="w-[48%] bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                <Text className="text-rose-500 font-semibold text-xs mb-1.5">
                  {t('summary.avgHeartRate')}
                </Text>
                <Text className="text-slate-900 font-bold text-2xl tracking-tight">
                  {avgHeartRate} <Text className="text-base font-normal text-slate-700">bpm</Text>
                </Text>
              </View>
            ) : null}

            {/* Card 5: Số bước chân */}
            {totalSteps && totalSteps > 0 ? (
              <View className="w-[48%] bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                <Text className="text-amber-500 font-semibold text-xs mb-1.5">
                  {t('active.steps')}
                </Text>
                <Text className="text-slate-900 font-bold text-2xl tracking-tight">
                  {totalSteps}{' '}
                  <Text className="text-base font-normal text-slate-700">{t('common:units.steps')}</Text>
                </Text>
              </View>
            ) : null}

            {/* Card 6: Vận tốc trung bình */}
            {avgSpeedKmh && avgSpeedKmh > 0 ? (
              <View className="w-[48%] bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                <Text className="text-indigo-500 font-semibold text-xs mb-1.5">
                  {t('active.speed')}
                </Text>
                <Text className="text-slate-900 font-bold text-2xl tracking-tight">
                  {formatWorkoutDecimal(avgSpeedKmh, 1)}{' '}
                  <Text className="text-base font-normal text-slate-700">km/h</Text>
                </Text>
              </View>
            ) : null}
          </View>

          {/* Ghi chú Card (Image 4 Specs - Interactive Editable Note) */}
          <Pressable
            onPress={() => inputRef.current?.focus()}
            className="flex-row items-start gap-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mt-2 shadow-sm active:opacity-90"
          >
            <View className="pt-0.5">
              <FileText color="#94A3B8" size={20} />
            </View>
            <TextInput
              ref={inputRef}
              value={note}
              onChangeText={(text) => {
                setNote(text);
                setIsSaved(false);
              }}
              onBlur={handleNoteBlur}
              editable={!!session}
              placeholder={t('summary.notePlaceholder')}
              placeholderTextColor="#94A3B8"
              multiline
              className="flex-1 text-slate-800 font-medium text-sm p-0 m-0 leading-5"
              style={{ minHeight: 24, textAlignVertical: 'top' }}
            />
            {note.trim().length > 0 && isSaved && (
              <View className="pt-0.5">
                <Check color="#10B981" size={18} strokeWidth={2.5} />
              </View>
            )}
          </Pressable>
        </View>
      </ScrollView>
      </View>
    </ScreenWrapper>
  );
}
