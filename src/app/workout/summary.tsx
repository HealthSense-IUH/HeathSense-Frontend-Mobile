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
} from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { SportSummaryHeaderGraphic } from '@/components/features/workout/SportSummaryHeaderGraphic';
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
  const distanceKm = Number(params.distanceKm) || session?.distanceKm;
  const avgHeartRate = Number(params.avgHeartRate) || session?.avgHeartRate;
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
            <Text className="text-white text-5xl font-extrabold mt-1 tracking-tight">
              {formatDuration(durationSeconds)}
            </Text>
            <Text className="text-white/80 text-xs font-normal mt-2">
              {formatSummaryDate(startedAt)}
            </Text>
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

          {/* 3 Metric Cards Grid */}
          <View className="flex-row flex-wrap justify-between gap-y-3.5 mb-4">
            {/* Card 1: Tổng thời gian */}
            <View className="w-[48%] bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <Text className="text-cyan-500 font-semibold text-xs mb-1.5">
                {t('summary.totalTime')}
              </Text>
              <Text className="text-slate-900 font-bold text-2xl tracking-tight">
                {formatDuration(durationSeconds)}
              </Text>
            </View>

            {/* Card: Khoảng cách (Nếu là bài tập có quãng đường) */}
            {distanceKm && distanceKm > 0 ? (
              <View className="w-[48%] bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                <Text className="text-emerald-500 font-semibold text-xs mb-1.5">
                  {t('summary.distance')}
                </Text>
                <Text className="text-slate-900 font-bold text-2xl tracking-tight">
                  {formatWorkoutDecimal(distanceKm, 2)}{' '}
                  <Text className="text-base font-normal text-slate-700">km</Text>
                </Text>
              </View>
            ) : null}

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
