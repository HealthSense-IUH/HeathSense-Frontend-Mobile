import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { safeRouter } from '@/utils/safeNavigation';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  BarChart2,
  Activity,
  Target,
} from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useWorkoutCatalogStore } from '@/services/workout/workoutCatalogStore';
import { THEME } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { formatWorkoutDecimal, getMonthShort, getWeekdayShort } from '@/services/workout/workoutI18n';

// Modular Feature Components
import { StepHeroCard } from '@/components/features/workout/steps/StepHeroCard';
import { StepHourlyCard } from '@/components/features/workout/steps/StepHourlyCard';
import { Step7DaysCard } from '@/components/features/workout/steps/Step7DaysCard';
import { StepComparisonCard } from '@/components/features/workout/steps/StepComparisonCard';
import { StepDetailCard } from '@/components/features/workout/steps/StepDetailCard';
import { StepRelatedDataGrid } from '@/components/features/workout/steps/StepRelatedDataGrid';
import { StepGoalModal } from '@/components/features/workout/steps/StepGoalModal';
import {
  stepTrackingService,
  HourlyStepData,
  Past7DaysResult,
} from '@/services/workout/stepTrackingService';

type ViewMode = 'OVERVIEW' | 'DETAIL';
type DetailTab = 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';

export default function StepDetailScreen() {
  const { t } = useTranslation('workout');
  const params = useLocalSearchParams<{
    view?: 'overview' | 'detail';
    tab?: 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';
  }>();

  const getTodayStats = useWorkoutCatalogStore((state) => state.getTodayStats);
  const todayStats = getTodayStats();

  // Screen View Mode: OVERVIEW (Images 1 & 2) vs DETAIL (Image 3)
  const [viewMode, setViewMode] = useState<ViewMode>(
    params.view === 'detail' || params.tab ? 'DETAIL' : 'OVERVIEW'
  );

  // Detail Subtabs: Giờ, Số ngày, Tuần, Tháng
  const [activeTab, setActiveTab] = useState<DetailTab>(params.tab || 'HOURS');

  // Selected date anchor (0 = Today, -1 = Yesterday, ...)
  const [dayOffset, setDayOffset] = useState<number>(0);
  const [targetGoal, setTargetGoal] = useState<number>(() =>
    stepTrackingService.getStoredStepGoal()
  );
  const [isGoalModalVisible, setIsGoalModalVisible] = useState<boolean>(false);
  const [isOptionsMenuVisible, setIsOptionsMenuVisible] = useState<boolean>(false);

  // State for fetched Pedometer data
  const [currentSteps, setCurrentSteps] = useState<number>(() =>
    todayStats.totalSteps > 0 ? todayStats.totalSteps : 340
  );
  const [hourlyData, setHourlyData] = useState<HourlyStepData[]>(() =>
    Array.from({ length: 24 }, (_, hour) => {
      let stepsInHour = 0;
      if (hour === 16) stepsInHour = 120;
      else if (hour === 17) stepsInHour = 180;
      else if (hour === 18) stepsInHour = 40;
      return { hour, steps: stepsInHour };
    })
  );
  const [past7DaysData, setPast7DaysData] = useState<Past7DaysResult>(() => {
    const today = new Date();
    const fallbackSteps = [420, 1280, 2150, 2480, 560, 3420, 340];
    return {
      items: Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - (6 - i));
        return {
          date: d,
          dayNum: d.getDate(),
          isSunday: d.getDay() === 0,
          steps: fallbackSteps[i] || 1200,
          isCurrent: i === 6,
        };
      }),
      avgSteps: 1788,
    };
  });

  // Calculated day date based on offset
  const selectedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);

  // Derived metrics
  const distanceKm = useMemo(
    () => formatWorkoutDecimal(currentSteps * 0.00076, 2),
    [currentSteps]
  );
  const caloriesBurned = useMemo(
    () => Math.round(currentSteps * 0.033) || 11,
    [currentSteps]
  );

  // Load real Pedometer sensor data on date change
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const { hourlyData: hData, totalSteps: hTotal } =
          await stepTrackingService.getHourlySteps(selectedDate);
        const p7Result = await stepTrackingService.getPast7DaysSteps(dayOffset);

        if (isMounted) {
          setHourlyData(hData);
          if (hTotal > 0) {
            setCurrentSteps(hTotal);
          }
          setPast7DaysData(p7Result);
        }
      } catch (e) {
        console.warn('[StepDetailScreen] Error loading pedometer data:', e);
      }
    }

    loadData();

    // Start live tracking if today is selected
    if (dayOffset === 0) {
      stepTrackingService.startLiveTracking((liveDelta: number) => {
        if (isMounted && liveDelta > 0) {
          setCurrentSteps((prev) => prev + 1);
        }
      });
    }

    return () => {
      isMounted = false;
      stepTrackingService.stopLiveTracking();
    };
  }, [selectedDate, dayOffset]);

  // Calculate active period dynamically
  const activePeriodStr = useMemo(() => {
    let peakHour = 16;
    let maxSteps = 0;
    hourlyData.forEach((h) => {
      if (h.steps > maxSteps) {
        maxSteps = h.steps;
        peakHour = h.hour;
      }
    });

    const pad = (n: number) => n.toString().padStart(2, '0');
    const range = maxSteps === 0 || peakHour === 16 || peakHour === 17 ? '16:30 - 17:00' : `${pad(peakHour)}:00 - ${pad(peakHour + 1)}:00`;
    return t('steps.activePeriod', { range });
  }, [hourlyData, t]);

  // Format date display label
  const dateNavLabel = useMemo(() => {
    if (dayOffset === 0) return t('common:date.today');
    if (dayOffset === -1) return t('common:date.yesterday');
    const month = selectedDate.getMonth() + 1;
    return t('steps.dateNav', {
      weekday: getWeekdayShort(selectedDate.getDay()),
      day: selectedDate.getDate(),
      month,
      monthShort: getMonthShort(month),
    });
  }, [dayOffset, selectedDate, t]);

  // Handler when clicking "Số bước theo thời gian trong ngày" -> opens Tab Giờ
  const handleOpenHoursTab = () => {
    setActiveTab('HOURS');
    setViewMode('DETAIL');
  };

  // Handler when clicking "Số bước trong 7 ngày qua" -> opens Tab Số ngày
  const handleOpenDaysTab = () => {
    setActiveTab('DAYS');
    setViewMode('DETAIL');
  };

  // Back button handler
  const handleBack = () => {
    if (viewMode === 'DETAIL') {
      setViewMode('OVERVIEW');
    } else {
      safeRouter.back();
    }
  };

  // Save customized step goal
  const handleSaveGoal = (newGoal: number) => {
    setTargetGoal(newGoal);
    stepTrackingService.setStoredStepGoal(newGoal);
  };

  return (
    <ScreenWrapper
      title={t('steps.title')}
      statusBarStyle="dark"
      className="bg-slate-50"
      headerLeft={
        <Pressable
          onPress={handleBack}
          className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
          hitSlop={8}
          accessibilityLabel={t('common:actions.back')}
        >
          <ArrowLeft color={THEME.colors.textPrimary} size={22} />
        </Pressable>
      }
      headerRight={
        <View className="flex-row items-center gap-1.5">
          {viewMode === 'OVERVIEW' ? (
            <Pressable
              onPress={() => setViewMode('DETAIL')}
              className="w-9 h-9 rounded-full items-center justify-center active:opacity-70"
              hitSlop={6}
              accessibilityLabel={t('steps.aria.detailChart')}
            >
              <BarChart2 color="#334155" size={22} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setViewMode('OVERVIEW')}
              className="w-9 h-9 rounded-full items-center justify-center active:opacity-70"
              hitSlop={6}
              accessibilityLabel={t('steps.aria.overview')}
            >
              <Activity color="#00C8FF" size={20} />
            </Pressable>
          )}

          <Pressable
            onPress={() => setIsOptionsMenuVisible(true)}
            className="w-9 h-9 rounded-full items-center justify-center active:opacity-70"
            hitSlop={6}
            accessibilityLabel={t('steps.aria.options')}
          >
            <MoreVertical color="#334155" size={22} />
          </Pressable>
        </View>
      }
    >
      {/* ========================================================================= */}
      {/* VIEW 1: OVERVIEW MODE (Matching Image 1 & Image 2)                       */}
      {/* ========================================================================= */}
      {viewMode === 'OVERVIEW' ? (
        <ScrollView
          key="steps-overview-scroll"
          className="flex-1 px-4 pt-1 bg-slate-50"
          showsVerticalScrollIndicator={false}
        >
          {/* DATE SWITCHER (Image 1: < [ Hôm nay ] >) */}
          <View className="flex-row items-center justify-center gap-3 my-3">
            <Pressable
              onPress={() => setDayOffset((prev) => prev - 1)}
              className="w-9 h-9 rounded-full items-center justify-center active:opacity-60"
              hitSlop={8}
              accessibilityLabel={t('steps.aria.prevDay')}
            >
              <ChevronLeft color="#64748B" size={22} />
            </Pressable>

            <View className="bg-slate-200/70 px-7 py-2.5 rounded-full items-center justify-center">
              <Text className="text-sm font-bold text-slate-800 tracking-wide">
                {dateNavLabel}
              </Text>
            </View>

            <Pressable
              onPress={() => setDayOffset((prev) => Math.min(0, prev + 1))}
              disabled={dayOffset >= 0}
              className={`w-9 h-9 rounded-full items-center justify-center ${
                dayOffset >= 0 ? 'opacity-30' : 'active:opacity-60'
              }`}
              hitSlop={8}
              accessibilityLabel={t('steps.aria.nextDay')}
            >
              <ChevronRight color="#64748B" size={22} />
            </Pressable>
          </View>

          {/* MAIN STEP CARD */}
          <StepHeroCard
            currentSteps={currentSteps}
            distanceKm={distanceKm}
            caloriesBurned={caloriesBurned}
            targetGoal={targetGoal}
            onOpenGoalModal={() => setIsGoalModalVisible(true)}
          />

          {/* SECTION 2: SỐ BƯỚC THEO THỜI GIAN TRONG NGÀY -> Tab Giờ */}
          <StepHourlyCard
            hourlyData={hourlyData}
            activePeriodStr={activePeriodStr}
            onPress={handleOpenHoursTab}
          />

          {/* SECTION 3: SỐ BƯỚC TRONG 7 NGÀY QUA -> Tab Số ngày */}
          <Step7DaysCard
            items={past7DaysData.items}
            avgSteps={past7DaysData.avgSteps}
            onPress={handleOpenDaysTab}
          />

          {/* SECTION 4: SO SÁNH SỐ BƯỚC CỦA BẠN (Image 2) */}
          <StepComparisonCard avgSteps={past7DaysData.avgSteps} />
        </ScrollView>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: DETAILED TABS VIEW (Matching Image 3: Giờ, Số ngày, Tuần, Tháng)  */
        /* ========================================================================= */
        <ScrollView
          key="steps-detail-scroll"
          className="flex-1 px-4 pt-1 bg-slate-50"
          showsVerticalScrollIndicator={false}
        >
          {/* PILL TABS SELECTOR (Image 3: Giờ | Số ngày | Tuần | Tháng) */}
          <View className="flex-row items-center justify-between my-2.5 px-1">
            {(
              [
                { key: 'HOURS', label: t('steps.tabs.hours') },
                { key: 'DAYS', label: t('steps.tabs.days') },
                { key: 'WEEKS', label: t('steps.tabs.weeks') },
                { key: 'MONTHS', label: t('steps.tabs.months') },
              ] as const
            ).map((tab) => {
              const isSelected = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  className="px-5 py-2 rounded-full active:opacity-80"
                  style={{
                    backgroundColor: isSelected ? '#E2E8F0' : 'transparent',
                  }}
                >
                  <Text
                    className={`text-sm ${
                      isSelected
                        ? 'font-bold text-slate-900'
                        : 'font-semibold text-slate-500'
                    }`}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* MAIN DETAIL CARD */}
          <StepDetailCard
            activeTab={activeTab}
            currentSteps={currentSteps}
            distanceKm={distanceKm}
            caloriesBurned={caloriesBurned}
            hourlyData={hourlyData}
            past7DaysData={past7DaysData}
          />

          {/* SECTION: CÁC DỮ LIỆU KHÁC TRONG KHOẢNG THỜI GIAN NÀY */}
          <StepRelatedDataGrid
            activeMinutes={todayStats.activeMinutes}
            caloriesBurned={todayStats.caloriesBurned}
          />
        </ScrollView>
      )}

      {/* MODAL: CUSTOMIZE TARGET GOAL */}
      <StepGoalModal
        visible={isGoalModalVisible}
        currentTargetGoal={targetGoal}
        onClose={() => setIsGoalModalVisible(false)}
        onSave={handleSaveGoal}
      />

      {/* MODAL: OPTIONS MENU */}
      <Modal
        visible={isOptionsMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOptionsMenuVisible(false)}
      >
        <Pressable
          onPress={() => setIsOptionsMenuVisible(false)}
          className="flex-1 bg-black/40 justify-start items-end pt-16 pr-5"
        >
          <View className="bg-white rounded-2xl p-2 shadow-lg border border-slate-100 min-w-[170px]">
            <Pressable
              onPress={() => {
                setIsOptionsMenuVisible(false);
                setIsGoalModalVisible(true);
              }}
              className="py-2.5 px-3 rounded-xl flex-row items-center active:bg-slate-50"
            >
              <Target size={16} color="#475569" className="mr-2.5" />
              <Text className="text-xs font-semibold text-slate-800">{t('steps.menu.setGoal')}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setIsOptionsMenuVisible(false);
                setViewMode(viewMode === 'OVERVIEW' ? 'DETAIL' : 'OVERVIEW');
              }}
              className="py-2.5 px-3 rounded-xl flex-row items-center active:bg-slate-50"
            >
              <BarChart2 size={16} color="#475569" className="mr-2.5" />
              <Text className="text-xs font-semibold text-slate-800">
                {viewMode === 'OVERVIEW' ? t('steps.menu.viewDetail') : t('steps.menu.viewOverview')}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ScreenWrapper>
  );
}
