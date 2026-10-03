import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { safeRouter } from '@/utils/safeNavigation';
import {
  ArrowLeft,
  Calendar,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  Timer,
  Footprints,
  Zap,
  Check,
  Dumbbell,
} from 'lucide-react-native';
import Svg, {
  Path,
  Circle,
  Line,
} from 'react-native-svg';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useWorkoutCatalogStore } from '@/services/workout/workoutCatalogStore';
import { WorkoutSession } from '@/services/workout/workoutTypes';
import { getExerciseIconComponent } from '@/components/features/workout/FavoriteWorkoutSection';
import { WorkoutCalendarModal } from '@/components/features/workout/WorkoutCalendarModal';

type TabView = 'DAYS' | 'WEEKS' | 'MONTHS';

interface ChartColumnItem {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
  durationSeconds: number;
  calories: number;
  count: number;
  sessions: WorkoutSession[];
  isSunday?: boolean;
}

export default function WorkoutHistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: TabView }>();
  const sessions = useWorkoutCatalogStore((state) => state.sessions);
  const syncSessionsWithBackend = useWorkoutCatalogStore(
    (state) => state.syncSessionsWithBackend
  );

  const [activeTab, setActiveTab] = useState<TabView>(() => {
    if (params.tab && ['DAYS', 'WEEKS', 'MONTHS'].includes(params.tab)) {
      return params.tab as TabView;
    }
    return 'DAYS';
  });
  const [selectedSportFilter, setSelectedSportFilter] = useState<string>('ALL');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<boolean>(false);
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [selectedIndex, setSelectedIndex] = useState<number>(-1); // -1 = latest item
  const [isCalendarVisible, setIsCalendarVisible] = useState<boolean>(false);

  useEffect(() => {
    if (params.tab && ['DAYS', 'WEEKS', 'MONTHS'].includes(params.tab) && params.tab !== activeTab) {
      setActiveTab(params.tab as TabView);
      setSelectedIndex(-1);
    }
  }, [params.tab]);


  // When tab changes, reset selected index to latest
  const handleTabChange = (tab: TabView) => {
    if (tab === activeTab) return;
    React.startTransition(() => {
      setActiveTab(tab);
      setSelectedIndex(-1);
    });
  };

  // Set of dates with workout sessions ('YYYY-MM-DD') for Calendar Modal
  const workoutDatesSet = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      if (s.startedAt) {
        const d = new Date(s.startedAt);
        const pad = (n: number) => n.toString().padStart(2, '0');
        const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        set.add(dateStr);
      }
    });
    return set;
  }, [sessions]);

  // Format date helper: "Ngày DD tháng MM"
  const formatDayMonth = (d: Date) => `Ngày ${d.getDate()} tháng ${d.getMonth() + 1}`;

  // Build the time period range, range label, and columns depending on activeTab
  const { rangeLabel, columns } = useMemo(() => {
    if (activeTab === 'DAYS') {
      // 7 CONSECUTIVE DAYS (Monday to Sunday) - Image 3
      const monday = new Date(anchorDate);
      const day = anchorDate.getDay();
      monday.setDate(anchorDate.getDate() - day + (day === 0 ? -6 : 1));
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const rangeLabel = `${formatDayMonth(monday)} - ${formatDayMonth(sunday)}`;

      const cols: ChartColumnItem[] = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);

        const dayNum = d.getDate();
        const monthNum = d.getMonth() + 1;
        // Label: "1/10" if day 1 of month, otherwise "28", "29", "30" (matching Image 3)
        const label = dayNum === 1 ? `1/${monthNum}` : `${dayNum}`;

        const colSessions = sessions.filter((s) => {
          if (selectedSportFilter !== 'ALL' && s.exerciseId !== selectedSportFilter) {
            return false;
          }
          const sTime = typeof s.startedAt === 'string' ? new Date(s.startedAt).getTime() : s.startedAt;
          return sTime >= start.getTime() && sTime <= end.getTime();
        });

        const dur = colSessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
        const cal = colSessions.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0);

        return {
          id: `day_${i}`,
          label,
          startDate: start,
          endDate: end,
          durationSeconds: dur,
          calories: cal,
          count: colSessions.length,
          sessions: colSessions,
          isSunday: d.getDay() === 0,
        };
      });

      return { rangeLabel, columns: cols };
    } else if (activeTab === 'WEEKS') {
      // 8 WEEKS (Multi-week range ending in current week) - Image 4
      const currentMonday = new Date(anchorDate);
      const day = anchorDate.getDay();
      currentMonday.setDate(anchorDate.getDate() - day + (day === 0 ? -6 : 1));
      currentMonday.setHours(0, 0, 0, 0);

      // Start 7 weeks before currentMonday (Total 8 weeks)
      const startMonday = new Date(currentMonday);
      startMonday.setDate(currentMonday.getDate() - 7 * 7);

      const endSunday = new Date(currentMonday);
      endSunday.setDate(currentMonday.getDate() + 6);
      endSunday.setHours(23, 59, 59, 999);

      const rangeLabel = `${formatDayMonth(startMonday)} - ${formatDayMonth(endSunday)}`;

      const cols: ChartColumnItem[] = Array.from({ length: 8 }, (_, i) => {
        const wMonday = new Date(startMonday);
        wMonday.setDate(startMonday.getDate() + i * 7);
        const wSunday = new Date(wMonday);
        wSunday.setDate(wMonday.getDate() + 6);
        wSunday.setHours(23, 59, 59, 999);

        // Label: "16", "23", "30", "9/6", "13", "20", "27", "10/4" (matching Image 4)
        const prevMonday = new Date(wMonday);
        prevMonday.setDate(wMonday.getDate() - 7);
        const isNewMonth = i === 0 || wMonday.getMonth() !== prevMonday.getMonth();
        const label = isNewMonth
          ? `${wMonday.getMonth() + 1}/${wMonday.getDate()}`
          : `${wMonday.getDate()}`;

        const colSessions = sessions.filter((s) => {
          if (selectedSportFilter !== 'ALL' && s.exerciseId !== selectedSportFilter) {
            return false;
          }
          const sTime = typeof s.startedAt === 'string' ? new Date(s.startedAt).getTime() : s.startedAt;
          return sTime >= wMonday.getTime() && sTime <= wSunday.getTime();
        });

        const dur = colSessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
        const cal = colSessions.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0);

        return {
          id: `week_${i}`,
          label,
          startDate: wMonday,
          endDate: wSunday,
          durationSeconds: dur,
          calories: cal,
          count: colSessions.length,
          sessions: colSessions,
        };
      });

      return { rangeLabel, columns: cols };
    } else {
      // 6 MONTHS WINDOW
      const startMonthDate = new Date(
        anchorDate.getFullYear(),
        anchorDate.getMonth() - 5,
        1,
        0,
        0,
        0
      );
      const endMonthDate = new Date(
        anchorDate.getFullYear(),
        anchorDate.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      const rangeLabel = `Tháng ${startMonthDate.getMonth() + 1} - Tháng ${
        endMonthDate.getMonth() + 1
      } năm ${endMonthDate.getFullYear()}`;

      const cols: ChartColumnItem[] = Array.from({ length: 6 }, (_, i) => {
        const mStart = new Date(
          anchorDate.getFullYear(),
          anchorDate.getMonth() - 5 + i,
          1,
          0,
          0,
          0
        );
        const mEnd = new Date(mStart.getFullYear(), mStart.getMonth() + 1, 0, 23, 59, 59);

        const colSessions = sessions.filter((s) => {
          if (selectedSportFilter !== 'ALL' && s.exerciseId !== selectedSportFilter) {
            return false;
          }
          const sTime = typeof s.startedAt === 'string' ? new Date(s.startedAt).getTime() : s.startedAt;
          return sTime >= mStart.getTime() && sTime <= mEnd.getTime();
        });

        const dur = colSessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
        const cal = colSessions.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0);

        return {
          id: `month_${i}`,
          label: `T.${mStart.getMonth() + 1}`,
          startDate: mStart,
          endDate: mEnd,
          durationSeconds: dur,
          calories: cal,
          count: colSessions.length,
          sessions: colSessions,
        };
      });

      return { rangeLabel, columns: cols };
    }
  }, [activeTab, anchorDate, sessions, selectedSportFilter]);

  // Active / Selected column in the chart (defaults to the latest column)
  const activeColumnIndex = useMemo(() => {
    if (selectedIndex >= 0 && selectedIndex < columns.length) {
      return selectedIndex;
    }
    // Default to the column that contains anchorDate or the last column
    const foundIdx = columns.findIndex(
      (c) =>
        anchorDate.getTime() >= c.startDate.getTime() &&
        anchorDate.getTime() <= c.endDate.getTime()
    );
    return foundIdx >= 0 ? foundIdx : columns.length - 1;
  }, [selectedIndex, columns, anchorDate]);

  const activeColumn = columns[activeColumnIndex] || columns[columns.length - 1];

  // Maximum duration across columns to scale pillar heights (min 600s baseline)
  const maxDurationAcrossColumns = Math.max(
    600,
    ...columns.map((c) => c.durationSeconds)
  );

  // Format MM:SS or HH:MM:SS
  const formatDurationDisplay = (totalSec: number) => {
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

  // Format axis duration as G:P (e.g., 01:00 or 00:30)
  const formatChartAxisDuration = (totalSec: number) => {
    if (totalSec <= 0) return '00:00';
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}`;
  };

  // Quick navigation through previous / next periods
  const handleShiftPeriod = (direction: -1 | 1) => {
    React.startTransition(() => {
      const next = new Date(anchorDate);
      if (activeTab === 'DAYS') {
        next.setDate(anchorDate.getDate() + direction * 7);
      } else if (activeTab === 'WEEKS') {
        next.setDate(anchorDate.getDate() + direction * 7 * 8);
      } else {
        next.setMonth(anchorDate.getMonth() + direction * 6);
      }
      setAnchorDate(next);
      setSelectedIndex(-1);
    });
  };

  // Prevent shifting into future periods
  const canGoNext = useMemo(() => {
    const now = new Date();
    const lastCol = columns[columns.length - 1];
    if (!lastCol) return false;
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return lastCol.startDate.getTime() < startOfToday;
  }, [columns]);

  // Synchronize active date range with backend lazily
  useEffect(() => {
    if (columns.length > 0) {
      const start = columns[0].startDate.toISOString();
      const end = columns[columns.length - 1].endDate.toISOString();
      void syncSessionsWithBackend(start, end);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, anchorDate]);

  // Group active column's sessions by day for the bottom list (sorted latest first)
  const groupedSessions = useMemo(() => {
    const list = activeColumn?.sessions || [];
    const groups: {
      dateKey: string;
      headerLabel: string;
      totalDayDurationSec: number;
      totalDayCalories: number;
      items: WorkoutSession[];
    }[] = [];

    const sorted = [...list].sort((a, b) => b.startedAt - a.startedAt);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;

    sorted.forEach((session) => {
      const sessionDate = new Date(session.startedAt);
      const dateKey = `${sessionDate.getFullYear()}-${pad(sessionDate.getMonth() + 1)}-${pad(sessionDate.getDate())}`;

      let group = groups.find((g) => g.dateKey === dateKey);
      if (!group) {

        let headerLabel = '';
        const dayOfMonth = sessionDate.getDate();
        const monthNum = sessionDate.getMonth() + 1;
        const dayOfWeek = sessionDate.getDay();
        const dayOfWeekNames = ['CN', 'T.2', 'T.3', 'T.4', 'T.5', 'T.6', 'T.7'];

        if (dateKey === todayStr) {
          headerLabel = `Hôm nay, ${dayOfMonth} Th${monthNum}`;
        } else if (dateKey === yesterdayStr) {
          headerLabel = `Hôm qua, ${dayOfMonth} Th${monthNum}`;
        } else {
          headerLabel = `${dayOfWeekNames[dayOfWeek]}, ${dayOfMonth} Th${monthNum}`;
        }

        group = {
          dateKey,
          headerLabel,
          totalDayDurationSec: 0,
          totalDayCalories: 0,
          items: [],
        };
        groups.push(group);
      }

      group.items.push(session);
      group.totalDayDurationSec += session.durationSeconds || 0;
      group.totalDayCalories += session.caloriesBurned || 0;
    });

    return groups;
  }, [activeColumn]);

  // When a date is selected from Calendar Modal
  const handleSelectDateFromCalendar = (date: Date) => {
    setAnchorDate(date);
    setSelectedIndex(-1);
  };

  // Exercises that exist in workout history (Image Specs)
  const filterOptions = useMemo(() => {
    const map = new Map<string, string>();
    sessions.forEach((s) => {
      if (s.exerciseId && s.exerciseName) {
        map.set(s.exerciseId, s.exerciseName);
      }
    });

    // Seed defaults matching Samsung Health if no sessions yet recorded
    if (map.size === 0) {
      map.set('badminton', 'Cầu lông');
      map.set('running', 'Chạy bộ');
      map.set('walking', 'Đi bộ');
      map.set('combo', 'Bài tập kết hợp');
    }

    return [
      { id: 'ALL', name: 'Tất cả' },
      ...Array.from(map.entries()).map(([id, name]) => ({ id, name })),
    ];
  }, [sessions]);

  const currentFilterLabel = useMemo(() => {
    if (selectedSportFilter === 'ALL') return 'Tất cả';
    const found = filterOptions.find((o) => o.id === selectedSportFilter);
    return found ? found.name : 'Tất cả';
  }, [selectedSportFilter, filterOptions]);

  const isDistanceSport = useMemo(() => {
    return (
      selectedSportFilter === 'walking' ||
      selectedSportFilter === 'running' ||
      selectedSportFilter === 'cycling' ||
      currentFilterLabel.toLowerCase().includes('bộ') ||
      currentFilterLabel.toLowerCase().includes('chạy') ||
      currentFilterLabel.toLowerCase().includes('xe')
    );
  }, [selectedSportFilter, currentFilterLabel]);

  // Max distance across columns if filtering by a distance sport
  const maxDistanceAcrossColumns = useMemo(() => {
    return Math.max(
      1.1,
      ...columns.map((c) =>
        c.sessions.reduce((sum, s) => sum + (s.distanceKm || 0), 0)
      )
    );
  }, [columns]);

  return (
    <ScreenWrapper
      title="Tập thể dục"
      statusBarStyle="dark"
      className="bg-slate-50"
      headerLeft={
        <Pressable
          onPress={() => safeRouter.back()}
          className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
        >
          <ArrowLeft color="#0F172A" size={22} />
        </Pressable>
      }
      headerRight={
        <View className="flex-row items-center gap-1.5">
          <Pressable
            onPress={() => setIsCalendarVisible(true)}
            className="w-9 h-9 rounded-full bg-white border border-slate-200/80 items-center justify-center shadow-xs active:opacity-80"
          >
            <Calendar color="#475569" size={17} />
          </Pressable>
          <Pressable
            onPress={() => safeRouter.navigate('/workout/catalog')}
            className="w-9 h-9 rounded-full bg-white border border-slate-200/80 items-center justify-center shadow-xs active:opacity-80"
          >
            <MoreVertical color="#475569" size={17} />
          </Pressable>
        </View>
      }
    >
      <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
        {/* TAB SWITCHER: Số ngày | Tuần | Tháng (Images 3 & 4) */}
        <View className="px-6 py-2.5">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => handleTabChange('DAYS')}
              className={`px-5 py-2 rounded-full items-center justify-center ${
                activeTab === 'DAYS' ? 'bg-[#E5E7EB]' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-sm ${
                  activeTab === 'DAYS'
                    ? 'font-bold text-slate-900'
                    : 'font-medium text-slate-500'
                }`}
              >
                Số ngày
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleTabChange('WEEKS')}
              className={`px-5 py-2 rounded-full items-center justify-center ${
                activeTab === 'WEEKS' ? 'bg-[#E5E7EB]' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-sm ${
                  activeTab === 'WEEKS'
                    ? 'font-bold text-slate-900'
                    : 'font-medium text-slate-500'
                }`}
              >
                Tuần
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleTabChange('MONTHS')}
              className={`px-5 py-2 rounded-full items-center justify-center ${
                activeTab === 'MONTHS' ? 'bg-[#E5E7EB]' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-sm ${
                  activeTab === 'MONTHS'
                    ? 'font-bold text-slate-900'
                    : 'font-medium text-slate-500'
                }`}
              >
                Tháng
              </Text>
            </Pressable>
          </View>
        </View>

        {/* TOP SUMMARY & CHART CARD (Images 3, 4, 6) */}
        <View
          className="mx-4 mt-1 mb-5 rounded-3xl bg-white border border-slate-200/80 p-5 shadow-sm relative overflow-hidden"
          style={{
            shadowColor: 'rgba(15, 23, 42, 0.05)',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          {/* Top Line: Date Range & Quick Period Navigation */}
          <View className="flex-row items-center justify-between mb-2">
            <Pressable
              onPress={() => setIsCalendarVisible(true)}
              className="flex-row items-center gap-1.5 py-0.5 active:opacity-70"
            >
              <Text className="text-xs font-bold text-slate-700">
                {rangeLabel}
              </Text>
              <ChevronDown color="#64748B" size={13} />
            </Pressable>

            <View className="flex-row items-center gap-1">
              <Pressable
                onPress={() => handleShiftPeriod(-1)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="w-7 h-7 rounded-full bg-slate-100 items-center justify-center active:opacity-70"
              >
                <ChevronLeft color="#475569" size={15} strokeWidth={2.2} />
              </Pressable>
              <Pressable
                onPress={() => handleShiftPeriod(1)}
                disabled={!canGoNext}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className={`w-7 h-7 rounded-full bg-slate-100 items-center justify-center active:opacity-70 ${
                  !canGoNext ? 'opacity-35' : ''
                }`}
              >
                <ChevronRight color="#475569" size={15} strokeWidth={2.2} />
              </Pressable>
            </View>
          </View>

          {/* Row with Sport Filter & Samsung Milestone Graphic */}
          <View className="flex-row items-center justify-between mb-3">
            {/* Filter Pill (Clicking opens Samsung Health Dropdown Popover) */}
            <Pressable
              onPress={() => setIsFilterMenuOpen(true)}
              className="flex-row items-center bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200/60 active:opacity-75"
            >
              <Text className="text-xs font-bold text-slate-700 mr-1.5">
                {currentFilterLabel}
              </Text>
              <ChevronDown color="#64748B" size={13} />
            </Pressable>

            {/* Samsung Milestone Tent Graphic (Image 3 & 4) */}
            <View className="w-12 h-12 rounded-full overflow-hidden items-center justify-center shadow-xs">
              <Svg width={48} height={48} viewBox="0 0 48 48">
                <Circle cx={24} cy={24} r={22} fill="#F1F5F9" />
                <Path d="M24 10 L36 34 L12 34 Z" fill="#3B82F6" opacity={0.15} />
                <Path d="M12 34 L18 34 L24 20 L20 28 Z" fill="#10B981" />
                <Path d="M18 34 L24 34 L24 16 L22 22 Z" fill="#06B6D4" />
                <Path d="M24 34 L30 34 L26 22 L24 16 Z" fill="#F43F5E" />
                <Path d="M30 34 L36 34 L28 28 L24 20 Z" fill="#84CC16" />
                <Line x1={24} y1={10} x2={24} y2={18} stroke="#1E293B" strokeWidth={1.5} />
                <Path d="M24 10 L29 12.5 L24 15 Z" fill="#EF4444" />
              </Svg>
            </View>
          </View>

          {/* Large Duration & Calo display ONLY shown when active column has workouts (Image 4 & 6 vs Image 3) */}
          {(activeColumn?.durationSeconds || 0) > 0 ? (
            <View className="mb-4">
              <Text className="text-4xl font-black text-slate-900 tracking-tight font-sans">
                {formatDurationDisplay(activeColumn.durationSeconds)}
              </Text>
              <View className="flex-row items-center gap-2 mt-1">
                <Text className="text-xs font-semibold text-slate-500">
                  Calo{' '}
                  <Text className="text-purple-600 font-bold">
                    {(activeColumn.calories || 0).toLocaleString('vi-VN')} kcal
                  </Text>
                </Text>
                <Text className="text-xs text-slate-300">|</Text>
                <Text className="text-xs font-semibold text-slate-500">
                  phiên{' '}
                  <Text className="text-slate-800 font-bold">{activeColumn.count || 0}</Text>
                </Text>
              </View>
            </View>
          ) : (
            /* Spacer if empty like Image 3 */
            <View className="h-6" />
          )}

          {/* Dynamic Samsung Health Bar Chart (Images 3, 4, 6, 7) */}
          <View className="pt-2 pb-1 relative">
            {/* Horizontal Dashed Guidelines */}
            <View className="absolute left-0 right-12 top-0 border-b border-dashed border-slate-200" />
            <View className="absolute left-0 right-12 top-8 border-b border-dashed border-slate-200" />
            <View className="absolute left-0 right-12 top-16 border-b border-dashed border-slate-200" />

            {/* Y-axis Labels on Right (matching Images 3, 4, 6 and latest screenshot) */}
            <View className="absolute right-0 top-[-4px] items-end">
              <Text className="text-[10px] text-slate-400 font-medium">
                {isDistanceSport ? '(km)' : '(g:p)'}
              </Text>
              <Text className="text-[10px] text-slate-400 font-medium mt-3.5">
                {isDistanceSport
                  ? maxDistanceAcrossColumns.toFixed(2).replace('.', ',')
                  : maxDurationAcrossColumns > 0
                  ? formatChartAxisDuration(maxDurationAcrossColumns)
                  : '00:00'}
              </Text>
              <Text className="text-[10px] text-slate-400 font-medium mt-3.5">
                {isDistanceSport
                  ? (maxDistanceAcrossColumns / 2).toFixed(2).replace('.', ',')
                  : maxDurationAcrossColumns > 0
                  ? formatChartAxisDuration(Math.round(maxDurationAcrossColumns / 2))
                  : '00:00'}
              </Text>
            </View>

            {/* Dynamic Columns according to active tab */}
            <View className="flex-row items-end justify-between pr-14 pt-4">
              {columns.map((item, idx) => {
                const isSelected = idx === activeColumnIndex;
                const hasAct = item.durationSeconds > 0;
                const barHeight = hasAct
                  ? Math.max(
                      18,
                      Math.min(
                        52,
                        Math.round((item.durationSeconds / Math.max(1, maxDurationAcrossColumns)) * 48) + 10
                      )
                    )
                  : 0;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      React.startTransition(() => {
                        setSelectedIndex(idx);
                      });
                    }}
                    hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
                    className="items-center flex-1 active:opacity-75"
                  >
                    <View className="h-16 justify-end items-center w-full">
                      {hasAct ? (
                        activeTab === 'MONTHS' ? (
                          <View className="w-2.5 h-2.5 rounded-full bg-amber-400 mb-1" />
                        ) : (
                          <View
                            className="w-3 rounded-full bg-[#00C8FF]"
                            style={{ height: barHeight }}
                          />
                        )
                      ) : null}
                    </View>

                    {/* Column Label / Day or Week Number */}
                    <Text
                      className={`text-[11px] mt-2 ${
                        isSelected
                          ? 'text-slate-900 font-extrabold'
                          : item.durationSeconds > 0
                          ? 'text-slate-700 font-bold'
                          : 'text-slate-400 font-medium'
                      }`}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <View className="w-1.5 h-1.5 rounded-full bg-slate-800 mt-1" />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Floating Search/Zoom Icon on Bottom Right (Image 3 & 4) */}
            <Pressable
              className="absolute right-0 bottom-[-2px] w-8 h-8 rounded-full bg-slate-100 border border-slate-200/80 items-center justify-center shadow-xs active:opacity-75"
            >
              <Search color="#64748B" size={14} />
            </Pressable>
          </View>
        </View>

        {/* WORKOUT SESSIONS LIST FOR SELECTED PERIOD (Images 4 & 5) */}
        {groupedSessions.length > 0 ? (
          <View className="px-4">
            {groupedSessions.map((group) => {
              return (
                <View key={group.dateKey} className="mb-4">
                  {/* Group Header: Date Label on Left, Day Totals on Right */}
                  <View className="flex-row items-center justify-between mb-2 px-1">
                    <Text className="text-sm font-bold text-slate-800">
                      {group.headerLabel}
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="text-xs font-bold text-[#00C8FF]">
                        {formatDurationDisplay(group.totalDayDurationSec)}
                      </Text>
                      {group.totalDayCalories > 0 && (
                        <Text className="text-xs font-bold text-purple-600 ml-2">
                          {group.totalDayCalories} kcal
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Sessions in this day */}
                  {group.items.map((session) => {
                    const sessionTimeStr = new Date(session.startedAt).toLocaleTimeString(
                      'vi-VN',
                      {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      }
                    );

                    const IconComp = getExerciseIconComponent(
                      session.iconName || session.exerciseId
                    );

                    return (
                      <Pressable
                        key={session.id}
                        onPress={() => {
                          safeRouter.navigate({
                            pathname: '/workout/summary',
                            params: {
                              exerciseId: session.exerciseId,
                              exerciseName: session.exerciseName,
                              durationSeconds: session.durationSeconds,
                              caloriesBurned: session.caloriesBurned,
                              totalCalories: session.totalCalories,
                              distanceKm: session.distanceKm,
                              avgHeartRate: session.avgHeartRate,
                              startedAt: session.startedAt,
                              note: session.note,
                            },
                          } as any);
                        }}
                        className="bg-white rounded-2xl p-4 mb-2.5 border border-slate-200/70 shadow-xs flex-row items-center justify-between active:opacity-80"
                      >
                        {/* Left: Sport Icon */}
                        <View className="w-11 h-11 rounded-2xl bg-slate-100 items-center justify-center mr-3 border border-slate-200/60">
                          <IconComp color="#475569" size={22} />
                        </View>

                        {/* Middle: Metrics and Sport Name */}
                        <View className="flex-1 pr-2">
                          <View className="flex-row items-center gap-2">
                            {session.distanceKm !== undefined && session.distanceKm > 0 ? (
                              <Text className="text-sm font-bold text-amber-500">
                                {session.distanceKm.toFixed(2).replace('.', ',')} km
                              </Text>
                            ) : null}

                            <Text className="text-sm font-bold text-[#00C8FF]">
                              {formatDurationDisplay(session.durationSeconds)}
                            </Text>

                            {session.caloriesBurned > 0 && (
                              <Text className="text-sm font-bold text-purple-600">
                                {session.caloriesBurned} kcal
                              </Text>
                            )}
                          </View>

                          <Text className="text-xs font-semibold text-slate-500 mt-1">
                            {session.exerciseName}
                          </Text>
                        </View>

                        {/* Right: Timestamp */}
                        <Text className="text-xs font-semibold text-slate-400">
                          {sessionTimeStr}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              );
            })}
          </View>
        ) : (
          <View className="mx-4 mb-6 p-6 rounded-3xl bg-white border border-slate-200/80 items-center justify-center shadow-xs">
            <View className="w-13 h-13 rounded-2xl bg-slate-100 items-center justify-center mb-3">
              <Dumbbell color="#94A3B8" size={26} />
            </View>
            <Text className="text-sm font-bold text-slate-800 mb-1">
              Không có buổi tập nào
            </Text>
            <Text className="text-xs text-slate-500 text-center mb-4 max-w-[260px] leading-relaxed">
              Chưa có dữ liệu vận động được ghi nhận trong {activeTab === 'DAYS' ? 'ngày này' : 'khoảng thời gian này'}. Hãy bắt đầu buổi tập ngay!
            </Text>
            <Pressable
              onPress={() => safeRouter.navigate('/workout/select')}
              className="px-5 py-2.5 rounded-full bg-[#00C8FF] active:opacity-85 shadow-xs"
            >
              <Text className="text-xs font-bold text-white">
                Bắt đầu bài tập
              </Text>
            </Pressable>
          </View>
        )}

        {/* BOTTOM SECTION: CÁC DỮ LIỆU KHÁC TRONG KHOẢNG THỜI GIAN NÀY (Images 3, 4, 5) */}
        <View className="mt-2 mb-10 px-4">
          <Text className="text-xs font-bold text-slate-500 mb-3 px-1">
            Các dữ liệu khác trong khoảng thời gian này
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {/* Tile 1: Mức tải tim mạch */}
            <View className="bg-white rounded-2xl p-4 mr-3 w-36 border border-slate-200/70 shadow-xs">
              <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center mb-3">
                <Timer color="#3B82F6" size={18} />
              </View>
              <Text className="text-xs font-bold text-slate-700 leading-tight mb-1" numberOfLines={2}>
                Mức tải tim mạch hằng ng...
              </Text>
              <Text className="text-[11px] font-semibold text-emerald-600 mt-auto">
                Tối ưu
              </Text>
            </View>

            {/* Tile 2: Bước */}
            <View className="bg-white rounded-2xl p-4 mr-3 w-36 border border-slate-200/70 shadow-xs">
              <View className="w-9 h-9 rounded-xl bg-emerald-50 items-center justify-center mb-3">
                <Footprints color="#10B981" size={18} />
              </View>
              <Text className="text-xs font-bold text-slate-700 leading-tight mb-1">
                Bước
              </Text>
              <Text className="text-[11px] font-semibold text-slate-500 mt-auto">
                Theo dõi hàng ngày
              </Text>
            </View>

            {/* Tile 3: Điểm năng lượng */}
            <View className="bg-white rounded-2xl p-4 mr-3 w-36 border border-slate-200/70 shadow-xs">
              <View className="w-9 h-9 rounded-xl bg-amber-50 items-center justify-center mb-3">
                <Zap color="#F59E0B" size={18} />
              </View>
              <Text className="text-xs font-bold text-slate-700 leading-tight mb-1">
                Điểm năng lượng
              </Text>
              <Text className="text-[11px] font-semibold text-slate-500 mt-auto">
                85 / 100
              </Text>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Samsung Health Style Exercise Filter Popover Menu (Matching User Screenshot) */}
      <Modal
        visible={isFilterMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFilterMenuOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/10"
          onPress={() => setIsFilterMenuOpen(false)}
        >
          <View
            className="absolute bg-white rounded-[26px] py-2.5 px-1 border border-slate-100 shadow-2xl"
            style={{
              top: 155,
              left: 24,
              minWidth: 220,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.16,
              shadowRadius: 18,
              elevation: 12,
            }}
          >
            {filterOptions.map((opt) => {
              const isSelected = selectedSportFilter === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => {
                    setSelectedSportFilter(opt.id);
                    setIsFilterMenuOpen(false);
                    setSelectedIndex(-1);
                  }}
                  className="flex-row items-center justify-between px-5 py-3 rounded-2xl active:bg-slate-100"
                >
                  <Text
                    className={`text-[15px] ${
                      isSelected
                        ? 'font-bold text-[#00C8FF]'
                        : 'font-semibold text-slate-800'
                    }`}
                  >
                    {opt.name}
                  </Text>
                  {isSelected && (
                    <Check color="#00C8FF" size={20} strokeWidth={2.5} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      {/* Samsung Health Style Calendar Picker Modal (Bottom Sheet) */}
      <WorkoutCalendarModal
        visible={isCalendarVisible}
        onClose={() => setIsCalendarVisible(false)}
        selectedDate={anchorDate}
        onSelectDate={handleSelectDateFromCalendar}
        workoutDates={workoutDatesSet}
      />
    </ScreenWrapper>
  );
}
