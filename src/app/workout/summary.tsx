import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
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
import {
  SportSummaryHeaderGraphic,
  getSportThemeConfig,
} from '@/components/features/workout/SportSummaryHeaderGraphic';
import { useWorkoutEngineStore } from '@/services/workout/workoutEngineStore';
import { useWorkoutCatalogStore } from '@/services/workout/workoutCatalogStore';
import { workoutApiService } from '@/services/workout/workoutApiService';

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const lastSession = useWorkoutEngineStore((state) => state.lastCompletedSession);

  const exerciseId = (params.exerciseId as string) || lastSession?.exerciseId || '';
  const exerciseName = (params.exerciseName as string) || lastSession?.exerciseName || 'Cầu lông';
  const durationSeconds = Number(params.durationSeconds) || lastSession?.durationSeconds || 19;
  const caloriesBurned = Number(params.caloriesBurned) || lastSession?.caloriesBurned || 1;
  const totalCalories =
    Number(params.totalCalories) ||
    lastSession?.totalCalories ||
    Math.max(caloriesBurned, Math.round(caloriesBurned + (durationSeconds * 1560) / 86400));
  const distanceKm = Number(params.distanceKm) || lastSession?.distanceKm;
  const avgHeartRate = Number(params.avgHeartRate) || lastSession?.avgHeartRate;
  const startedAt = Number(params.startedAt) || lastSession?.startedAt || Date.now();

  const saveSession = useWorkoutCatalogStore((state) => state.saveSession);
  const [note, setNote] = useState<string>(lastSession?.note || (params.note as string) || '');
  const [isSaved, setIsSaved] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleNoteChange = (text: string) => {
    setNote(text);
    setIsSaved(true);
    if (lastSession) {
      const updatedSession = { ...lastSession, note: text };
      saveSession(updatedSession);
      // Background sync with backend database
      workoutApiService.saveSession(updatedSession).catch(() => {});
    }
  };

  const themeConfig = getSportThemeConfig(exerciseId, exerciseName);

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSummaryDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const dayName = days[date.getDay()];
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    const hrs = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${dayName}, ${d} Th${m}, ${y} ${hrs}:${mins}`;
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
            <TouchableOpacity
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/workout' as any);
                }
              }}
              className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
            >
              <ArrowLeft color="#FFFFFF" size={24} />
            </TouchableOpacity>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity className="w-10 h-10 rounded-full items-center justify-center active:opacity-70">
                <Share2 color="#FFFFFF" size={20} />
              </TouchableOpacity>
              <TouchableOpacity className="w-10 h-10 rounded-full items-center justify-center active:opacity-70">
                <Pencil color="#FFFFFF" size={20} />
              </TouchableOpacity>
              <TouchableOpacity className="w-10 h-10 rounded-full items-center justify-center active:opacity-70">
                <MoreVertical color="#FFFFFF" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sport Equipment Graphic (Top-Right, e.g. Shuttlecock, Running Shoe, Bike, etc.) */}
          <View className="absolute right-5 top-12 opacity-95">
            <SportSummaryHeaderGraphic exerciseId={exerciseId} exerciseName={exerciseName} />
          </View>

          {/* Session Overview Titles */}
          <View className="pr-28">
            <Text className="text-white text-base font-medium">
              {exerciseName}
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
            Chi tiết tập luyện
          </Text>

          {/* 3 Metric Cards Grid */}
          <View className="flex-row flex-wrap justify-between gap-y-3.5 mb-4">
            {/* Card 1: Tổng thời gian */}
            <View className="w-[48%] bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <Text className="text-cyan-500 font-semibold text-xs mb-1.5">
                Tổng thời gian
              </Text>
              <Text className="text-slate-900 font-bold text-2xl tracking-tight">
                {formatDuration(durationSeconds)}
              </Text>
            </View>

            {/* Card: Khoảng cách (Nếu là bài tập có quãng đường) */}
            {distanceKm && distanceKm > 0 ? (
              <View className="w-[48%] bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                <Text className="text-emerald-500 font-semibold text-xs mb-1.5">
                  Khoảng cách
                </Text>
                <Text className="text-slate-900 font-bold text-2xl tracking-tight">
                  {distanceKm.toFixed(2).replace('.', ',')}{' '}
                  <Text className="text-base font-normal text-slate-700">km</Text>
                </Text>
              </View>
            ) : null}

            {/* Card 2: Calo tập luyện */}
            <View className="w-[48%] bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <Text className="text-purple-400 font-semibold text-xs mb-1.5">
                Calo tập luyện
              </Text>
              <Text className="text-slate-900 font-bold text-2xl tracking-tight">
                {caloriesBurned} <Text className="text-base font-normal text-slate-700">kcal</Text>
              </Text>
            </View>

            {/* Card 3: Tổng lượng calo */}
            <View className="w-[48%] bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <Text className="text-purple-400 font-semibold text-xs mb-1.5">
                Tổng lượng calo
              </Text>
              <Text className="text-slate-900 font-bold text-2xl tracking-tight">
                {totalCalories} <Text className="text-base font-normal text-slate-700">kcal</Text>
              </Text>
            </View>

            {/* Card 4: Nhịp tim trung bình (Nếu có từ đồng hồ) */}
            {avgHeartRate && avgHeartRate > 0 ? (
              <View className="w-[48%] bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                <Text className="text-rose-500 font-semibold text-xs mb-1.5">
                  Nhịp tim TB
                </Text>
                <Text className="text-slate-900 font-bold text-2xl tracking-tight">
                  {avgHeartRate} <Text className="text-base font-normal text-slate-700">bpm</Text>
                </Text>
              </View>
            ) : null}
          </View>

          {/* Ghi chú Card (Image 4 Specs - Interactive Editable Note) */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => inputRef.current?.focus()}
            className="flex-row items-start gap-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mt-2 shadow-sm"
          >
            <View className="pt-0.5">
              <FileText color="#94A3B8" size={20} />
            </View>
            <TextInput
              ref={inputRef}
              value={note}
              onChangeText={handleNoteChange}
              placeholder="Ghi chú"
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
          </TouchableOpacity>
        </View>
      </ScrollView>
      </View>
    </ScreenWrapper>
  );
}
