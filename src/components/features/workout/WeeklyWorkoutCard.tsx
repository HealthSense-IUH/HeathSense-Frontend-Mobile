import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { safeRouter } from '@/utils/safeNavigation';
import { useWorkoutCatalogStore } from '@/services/workout/workoutCatalogStore';

export function WeeklyWorkoutCard() {
  const getWeeklyStats = useWorkoutCatalogStore((state) => state.getWeeklyStats);
  const syncSessionsWithBackend = useWorkoutCatalogStore(
    (state) => state.syncSessionsWithBackend
  );
  useWorkoutCatalogStore((state) => state.sessions);

  // Sync latest sessions from backend on mount
  useEffect(() => {
    void syncSessionsWithBackend();
  }, [syncSessionsWithBackend]);

  const weeklyStats = getWeeklyStats();
  const { totalDurationSeconds, totalCalories, totalSessions, dailyDistribution } =
    weeklyStats;

  const hasWorkouts = totalDurationSeconds > 0 || totalSessions > 0;

  // Format duration: "00:00:00" when empty, "MM:SS" or "HH:MM:SS" when active
  const formatWeeklyDuration = (totalSec: number): string => {
    if (totalSec <= 0) return '00:00:00';
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const formattedDuration = formatWeeklyDuration(totalDurationSeconds);

  // Maximum daily duration to scale the pillar heights (min 10 mins baseline)
  const maxDayDuration = Math.max(
    600,
    ...dailyDistribution.map((d) => d.durationSeconds || 0)
  );

  return (
    <Pressable
      onPress={() =>
        safeRouter.navigate({
          pathname: '/workout/history',
          params: { tab: 'DAYS' },
        } as any)
      }
      className="mb-5 rounded-3xl bg-white border border-slate-200/80 p-5 shadow-sm active:opacity-90"
      style={{
        shadowColor: 'rgba(15, 23, 42, 0.05)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      {/* Top Header Row */}
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-bold text-slate-800">Bài tập tuần này</Text>
        {/* Active Session Notification Indicator Dot (as seen in Image 2) */}
        {hasWorkouts && (
          <View className="w-2 h-2 rounded-full bg-orange-500" />
        )}
      </View>

      {/* Main Stats & Day Pillars Row */}
      <View className="flex-row items-end justify-between mt-3">
        {/* Left Side: Duration & Sub-Metrics */}
        <View className="flex-1 pr-2 justify-end">
          <Text className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
            {formattedDuration}
          </Text>

          {hasWorkouts && (
            <View className="mt-1">
              <Text className="text-xs font-semibold text-slate-600">
                {totalSessions} buổi
              </Text>
              <Text className="text-xs font-medium text-slate-500 mt-0.5">
                {totalCalories.toLocaleString('vi-VN')} kcal
              </Text>
            </View>
          )}
        </View>

        {/* Right Side: 7-Day Pillars (2, 3, 4, 5, 6, 7, CN) */}
        <View className="flex-row items-end gap-1.5 pb-0.5">
          {dailyDistribution.map((item, index) => {
            const hasActivity = item.durationSeconds > 0;
            // Height proportional to duration (clamped between 18px and 46px)
            const pillarHeight = hasActivity
              ? Math.max(
                  18,
                  Math.min(46, Math.round((item.durationSeconds / maxDayDuration) * 40) + 14)
                )
              : 0;

            const isSunday = item.dayLabel === 'CN';

            return (
              <View key={item.dayLabel} className="items-center w-5">
                {/* Fixed-height track container so day labels stay aligned */}
                <View className="h-12 justify-end items-center w-full">
                  {hasActivity ? (
                    <View
                      className="w-3 rounded-full bg-[#00C8FF]"
                      style={{ height: pillarHeight }}
                    />
                  ) : null}
                </View>

                {/* Day label: CN is red/rose, 2-7 are slate-400 */}
                <Text
                  className={`text-[11px] font-bold mt-1.5 ${
                    isSunday ? 'text-red-500' : 'text-slate-400'
                  }`}
                >
                  {item.dayLabel}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </Pressable>
  );
}
