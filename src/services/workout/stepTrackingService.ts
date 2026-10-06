import { Platform } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { workoutApiService } from './workoutApiService';

const storage = createMMKV({ id: 'step_tracking_storage' });

// An toàn: Dùng dynamic require để tránh crash ứng dụng khi chạy trên môi trường không có expo-sensors
function getPedometerModule() {
  try {
    const Sensors = require('expo-sensors');
    return Sensors?.Pedometer || null;
  } catch {
    return null;
  }
}

export interface HourlyStepData {
  hour: number;
  steps: number;
}

export interface DayStepData {
  date: Date;
  dayNum: number;
  isSunday: boolean;
  steps: number;
  isCurrent: boolean;
}

export interface Past7DaysResult {
  items: DayStepData[];
  avgSteps: number;
  comparisonPercentile?: number;
  activeWeeklyTrendPercent?: number;
}

const STEP_GOAL_KEY = 'user_daily_step_goal';
const DEFAULT_GOAL = 6000;

class StepTrackingService {
  private isAvailable: boolean | null = null;
  private hasPermission: boolean | null = null;
  private subscription: { remove: () => void } | null = null;
  private lastRawSteps: number | null = null;
  private listeners: Set<(totalTodaySteps: number) => void> = new Set();
  private syncTimeout: any = null;

  getDateKey(date: Date = new Date()): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Lấy số bước tổng hôm nay đã lưu trong MMKV (đồng bộ, tức thì, không giật về 0)
   */
  getTodayTotalSteps(): number {
    const todayKey = this.getDateKey(new Date());
    return storage.getNumber(`daily_steps_${todayKey}`) || 0;
  }

  /**
   * Kiểm tra thiết bị có hỗ trợ cảm biến Pedometer không
   */
  async checkAvailability(): Promise<boolean> {
    const pedometer = getPedometerModule();
    if (!pedometer) {
      this.isAvailable = false;
      return false;
    }
    if (this.isAvailable !== null) return this.isAvailable;
    try {
      this.isAvailable = await pedometer.isAvailableAsync();
      return Boolean(this.isAvailable);
    } catch {
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Yêu cầu quyền truy cập Activity Recognition (Android/iOS)
   */
  async requestPermissions(): Promise<boolean> {
    const pedometer = getPedometerModule();
    if (!pedometer) {
      this.hasPermission = false;
      return false;
    }
    if (this.hasPermission !== null) return this.hasPermission;
    try {
      const { status } = await pedometer.requestPermissionsAsync();
      this.hasPermission = status === 'granted';
      return this.hasPermission;
    } catch {
      this.hasPermission = false;
      return false;
    }
  }

  /**
   * Bắt đầu theo dõi bước chân thời gian thực.
   * Trả về hàm cleanup () => void để hủy đăng ký listener.
   */
  startLiveTracking(onStepUpdate?: (totalTodaySteps: number) => void): () => void {
    if (onStepUpdate) {
      this.listeners.add(onStepUpdate);
    }

    this.ensureSubscription();

    return () => {
      if (onStepUpdate) {
        this.listeners.delete(onStepUpdate);
      }
    };
  }

  stopLiveTracking(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
      this.lastRawSteps = null;
    }
  }

  private async ensureSubscription(): Promise<void> {
    if (this.subscription) return;

    const available = await this.checkAvailability();
    if (!available) return;

    const granted = await this.requestPermissions();
    if (!granted) return;

    const pedometer = getPedometerModule();
    if (!pedometer) return;

    try {
      this.lastRawSteps = null;
      this.subscription = pedometer.watchStepCount((result: { steps: number }) => {
        const raw = result.steps;
        if (typeof raw !== 'number' || raw < 0) return;

        if (this.lastRawSteps === null) {
          // Lần đọc đầu tiên sau khi subscribe: dùng làm mốc ban đầu
          this.lastRawSteps = raw;
          return;
        }

        const delta = raw - this.lastRawSteps;
        this.lastRawSteps = raw;

        if (delta > 0) {
          this.handleStepDelta(delta);
        }
      });
    } catch (e) {
      console.warn('[StepTrackingService] watchStepCount error:', e);
    }
  }

  /**
   * Cộng dồn số bước mới vào tổng hôm nay và mảng 24 giờ
   */
  private handleStepDelta(delta: number): void {
    const todayKey = this.getDateKey(new Date());
    const currentTotal = storage.getNumber(`daily_steps_${todayKey}`) || 0;
    const newTotal = currentTotal + delta;
    storage.set(`daily_steps_${todayKey}`, newTotal);

    // Cập nhật giờ hiện tại
    const currentHour = new Date().getHours();
    let hourly: HourlyStepData[] = [];
    const cachedStr = storage.getString(`hourly_steps_${todayKey}`);
    if (cachedStr) {
      try {
        hourly = JSON.parse(cachedStr);
      } catch {}
    }
    if (!hourly || hourly.length !== 24) {
      hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, steps: 0 }));
    }
    hourly[currentHour].steps = (hourly[currentHour].steps || 0) + delta;
    storage.set(`hourly_steps_${todayKey}`, JSON.stringify(hourly));

    // Báo cho toàn bộ component đang nghe
    this.listeners.forEach((listener) => {
      try {
        listener(newTotal);
      } catch (err) {
        console.warn('[StepTrackingService] listener callback error:', err);
      }
    });

    // Debounced sync lên Backend (chờ 4 giây không có bước mới thì gửi)
    if (this.syncTimeout) clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(() => {
      this.syncWithBackend(todayKey, newTotal, hourly).catch(() => {});
    }, 4000);
  }

  /**
   * Lấy số bước theo 24 giờ của một ngày cụ thể (Hourly Steps)
   */
  async getHourlySteps(targetDate: Date = new Date()): Promise<{ hourlyData: HourlyStepData[]; totalSteps: number }> {
    const dateKey = this.getDateKey(targetDate);
    const isTargetToday = targetDate.toDateString() === new Date().toDateString();

    // 1. Nếu trên iOS và hỗ trợ getStepCountAsync: thử đọc từ CoreMotion
    if (Platform.OS === 'ios') {
      const available = await this.checkAvailability();
      const granted = await this.requestPermissions();
      if (available && granted) {
        try {
          const pedometer = getPedometerModule();
          if (pedometer && typeof pedometer.getStepCountAsync === 'function') {
            const currentHour = isTargetToday ? new Date().getHours() : 23;
            const promises = Array.from({ length: currentHour + 1 }, async (_, hour) => {
              const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), hour, 0, 0, 0);
              const end = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), hour, 59, 59, 999);
              try {
                const res = await pedometer.getStepCountAsync(start, end);
                return { hour, steps: res.steps || 0 };
              } catch {
                return { hour, steps: 0 };
              }
            });
            const results = await Promise.all(promises);
            const hourlyData: HourlyStepData[] = [];
            let totalSteps = 0;
            for (let h = 0; h < 24; h++) {
              const match = results.find((r) => r.hour === h);
              const count = match ? match.steps : 0;
              hourlyData.push({ hour: h, steps: count });
              totalSteps += count;
            }

            if (totalSteps > 0) {
              storage.set(`hourly_steps_${dateKey}`, JSON.stringify(hourlyData));
              storage.set(`daily_steps_${dateKey}`, totalSteps);
              this.syncWithBackend(dateKey, totalSteps, hourlyData).catch(() => {});
              return { hourlyData, totalSteps };
            }
          }
        } catch (e) {
          console.warn('[StepTrackingService] iOS getStepCountAsync error:', e);
        }
      }
    }

    // 2. Kiểm tra bộ nhớ cache cục bộ MMKV (trên Android hoặc khi đã có dữ liệu)
    const cachedHourlyStr = storage.getString(`hourly_steps_${dateKey}`);
    const cachedTotal = storage.getNumber(`daily_steps_${dateKey}`);
    if (cachedHourlyStr) {
      try {
        const parsed = JSON.parse(cachedHourlyStr) as HourlyStepData[];
        if (Array.isArray(parsed) && parsed.length === 24) {
          const total = typeof cachedTotal === 'number' ? cachedTotal : parsed.reduce((sum, h) => sum + h.steps, 0);
          return { hourlyData: parsed, totalSteps: total };
        }
      } catch {}
    }

    // 3. Thử lấy từ Backend API
    try {
      const serverDetail = await workoutApiService.getDailyStepDetail(dateKey);
      if (serverDetail && Array.isArray(serverDetail.hourlyData) && serverDetail.hourlyData.length > 0) {
        const total = typeof serverDetail.totalSteps === 'number' ? serverDetail.totalSteps : 0;
        storage.set(`hourly_steps_${dateKey}`, JSON.stringify(serverDetail.hourlyData));
        storage.set(`daily_steps_${dateKey}`, total);
        return {
          hourlyData: serverDetail.hourlyData,
          totalSteps: total,
        };
      }
    } catch {}

    // 4. Mặc định: 24 giờ với 0 bước
    const zeroHourly: HourlyStepData[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      steps: 0,
    }));
    return { hourlyData: zeroHourly, totalSteps: cachedTotal || 0 };
  }

  /**
   * Lấy số bước của 7 ngày gần nhất
   */
  async getPast7DaysSteps(dayOffset: number = 0): Promise<Past7DaysResult> {
    const today = new Date();

    // 1. Thử lấy lịch sử từ Backend API
    try {
      const serverHistory = await workoutApiService.getStepHistory(dayOffset);
      if (serverHistory && Array.isArray(serverHistory.items) && serverHistory.items.length > 0) {
        const todayKey = this.getDateKey(today);
        const todayLiveSteps = this.getTodayTotalSteps();

        const mappedItems: DayStepData[] = serverHistory.items.map((it: any) => {
          const isTodayItem = it.isCurrent || it.date === todayKey;
          const stepsCount = isTodayItem ? Math.max(it.steps || 0, todayLiveSteps) : (it.steps || 0);
          return {
            date: new Date(it.date),
            dayNum: it.dayNum,
            isSunday: it.isSunday,
            steps: stepsCount,
            isCurrent: isTodayItem,
          };
        });

        const totalSum = mappedItems.reduce((acc, cur) => acc + cur.steps, 0);
        const avgSteps = Math.round(totalSum / mappedItems.length);

        return {
          items: mappedItems,
          avgSteps,
          comparisonPercentile: serverHistory.comparisonPercentile || 0,
          activeWeeklyTrendPercent: serverHistory.activeWeeklyTrendPercent || 0,
        };
      }
    } catch (e) {
      console.warn('[StepTrackingService] getStepHistory error:', e);
    }

    // 2. Fallback: xây dựng danh sách 7 ngày từ cache MMKV
    const items: DayStepData[] = [];
    let totalSum = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i + dayOffset);
      const dateKey = this.getDateKey(d);
      const isTodayItem = i === 0 && dayOffset === 0;

      const stepsCount = storage.getNumber(`daily_steps_${dateKey}`) || 0;
      totalSum += stepsCount;

      items.push({
        date: d,
        dayNum: d.getDate(),
        isSunday: d.getDay() === 0,
        steps: stepsCount,
        isCurrent: isTodayItem,
      });
    }

    const avgSteps = Math.round(totalSum / items.length);

    return {
      items,
      avgSteps,
      comparisonPercentile: 0,
      activeWeeklyTrendPercent: 0,
    };
  }

  /**
   * Lưu & Lấy mục tiêu số bước cá nhân (Target Goal)
   */
  getStoredStepGoal(): number {
    const saved = storage.getNumber(STEP_GOAL_KEY);
    return saved && saved > 0 ? saved : DEFAULT_GOAL;
  }

  setStoredStepGoal(goal: number): void {
    storage.set(STEP_GOAL_KEY, goal);
    workoutApiService.updateStepGoal(goal).catch(() => {});
  }

  /**
   * Đồng bộ dữ liệu bước chân lên Backend Server
   */
  async syncWithBackend(
    dateKey: string,
    totalSteps: number,
    hourlyData: HourlyStepData[]
  ): Promise<void> {
    try {
      await workoutApiService.syncStepData({
        date: dateKey,
        totalSteps,
        hourlySteps: hourlyData,
        deviceSource: Platform.OS === 'ios' ? 'IOS_CORE_MOTION' : 'ANDROID_PEDOMETER',
      });
    } catch (e) {
      // Ignore background sync errors
    }
  }
}

export const stepTrackingService = new StepTrackingService();
