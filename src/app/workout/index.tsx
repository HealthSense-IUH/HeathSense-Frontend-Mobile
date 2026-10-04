import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  User,
  MoreVertical,
  Award,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { FavoriteWorkoutSection } from '@/components/features/workout/FavoriteWorkoutSection';
import { WeeklyWorkoutCard } from '@/components/features/workout/WeeklyWorkoutCard';
import { useWorkoutCatalogStore } from '@/services/workout/workoutCatalogStore';
import { THEME } from '@/constants/theme';

export default function WorkoutHubScreen() {
  const router = useRouter();
  const getTodayStats = useWorkoutCatalogStore((state) => state.getTodayStats);
  const getWeeklyStats = useWorkoutCatalogStore((state) => state.getWeeklyStats);

  const todayStats = getTodayStats();
  const weeklyStats = getWeeklyStats();

  // Thời lượng tập 7 ngày trong tuần (dữ liệu thật từ store); cột cao theo tỉ lệ với ngày tập nhiều nhất
  const dailyDist = weeklyStats.dailyDistribution || [];
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const maxDuration = Math.max(0, ...dailyDist.map((item) => item.durationSeconds));

  return (
    <ScreenWrapper
      title="Trung Tâm Luyện Tập"
      statusBarStyle="dark"
      className="bg-slate-50"
      headerLeft={
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
        >
          <ArrowLeft color={THEME.colors.textPrimary} size={22} />
        </TouchableOpacity>
      }
      headerRight={
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => {}}
            className="w-9 h-9 rounded-full bg-white border border-slate-200/80 items-center justify-center shadow-sm active:opacity-80"
          >
            <User color="#475569" size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/workout/catalog' as any)}
            className="w-9 h-9 rounded-full bg-white border border-slate-200/80 items-center justify-center shadow-sm active:opacity-80"
          >
            <MoreVertical color="#475569" size={18} />
          </TouchableOpacity>
        </View>
      }
    >
      <ScrollView className="flex-1 px-4 pt-2 bg-slate-50" showsVerticalScrollIndicator={false}>
        {/* TOP FITNESS BANNER (Green Gradient Header Banner - Image 1) */}
        <LinearGradient
          colors={['#0D9488', '#0F766E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-5 rounded-3xl mb-5 relative border border-emerald-500/20 shadow-md"
        >
          <Text className="text-white text-base font-semibold leading-relaxed pr-6">
            Theo dõi mức độ thể lực để được cung cấp nội dung cũng như mục tiêu dựa trên trọng tâm luyện tập của bạn.
          </Text>
        </LinearGradient>

        {/* SECTION 1: BƯỚC (Weekly Step Progress Card - Light Theme) */}
        <View
          className="mb-5 rounded-3xl bg-white border border-slate-200/80 p-5 shadow-sm"
          style={{
            shadowColor: 'rgba(15, 23, 42, 0.05)',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <Text className="text-sm font-bold text-slate-800 mb-3">Bước</Text>

          <View className="flex-row items-end justify-between">
            {/* Step Count Number */}
            <View>
              <Text className="text-4xl font-extrabold text-slate-900 tracking-tight">
                {todayStats.totalSteps.toLocaleString('vi-VN')}
              </Text>
              <Text className="text-xs text-slate-500 mt-1 font-medium">
                {todayStats.targetSteps.toLocaleString('vi-VN')} bước
              </Text>
            </View>

            {/* 7-Day Bar Chart Representation */}
            <View className="flex-row items-end gap-2 pb-1">
              {dailyDist.map((item) => {
                const dayNum = Number(item.dateStr.slice(8, 10));
                const isToday = item.dateStr === todayStr;
                const barHeight = maxDuration > 0 ? 6 + (item.durationSeconds / maxDuration) * 36 : 6;

                return (
                  <View key={item.dateStr} className="items-center">
                    {/* Vertical Bar */}
                    <View
                      className={`w-3.5 rounded-full ${
                        isToday ? 'bg-emerald-500' : 'bg-emerald-200'
                      }`}
                      style={{ height: barHeight }}
                    />
                    {/* Day Number */}
                    <Text
                      className={`text-[11px] font-bold mt-2 ${
                        isToday ? 'text-red-500' : 'text-slate-400'
                      }`}
                    >
                      {dayNum}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* SECTION: BÀI TẬP TUẦN NÀY (Samsung Health This Week's Workouts Card - Image 1 & 2) */}
        <WeeklyWorkoutCard />

        {/* SECTION 2: HUẤN LUYỆN CHẠY (Running Coach Beta Card - Light Theme) */}
        <TouchableOpacity
          onPress={() => router.push('/workout/catalog' as any)}
          activeOpacity={0.88}
          className="mb-5 rounded-3xl bg-white border border-slate-200/80 p-5 shadow-sm"
          style={{
            shadowColor: 'rgba(15, 23, 42, 0.05)',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <View className="flex-row items-center gap-2 mb-3">
            <Text className="text-sm font-bold text-slate-800">H.luyện chạy</Text>
            <View className="bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              <Text className="text-[10px] font-bold text-slate-600">Beta</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-4">
            {/* Running Badge Graphic */}
            <View className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 items-center justify-center p-2">
              <Award color="#EF4444" size={28} />
            </View>

            {/* Content */}
            <View className="flex-1">
              <Text className="text-base font-bold text-slate-900 tracking-tight">
                Xác định cấp độ chạy bộ
              </Text>
              <Text className="text-xs text-slate-500 mt-1 leading-relaxed" numberOfLines={2}>
                Nhận kế hoạch tập chi tiết để đạt mục tiêu chạy bộ của bạn.
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* SECTION 3: TẬP THỂ DỤC (Favorite Exercises Card - Light Theme) */}
        <FavoriteWorkoutSection />

        <View className="h-10" />
      </ScrollView>
    </ScreenWrapper>
  );
}
