import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface WorkoutCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  workoutDates?: Set<string>; // 'YYYY-MM-DD' formatted strings of dates with workout sessions
}

export function WorkoutCalendarModal({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
  workoutDates = new Set(),
}: WorkoutCalendarModalProps) {
  // Calendar viewing year & month
  const [viewingYear, setViewingYear] = useState(selectedDate.getFullYear());
  const [viewingMonth, setViewingMonth] = useState(selectedDate.getMonth()); // 0-indexed

  // Keep viewing month in sync when selectedDate changes externally
  React.useEffect(() => {
    if (visible) {
      setViewingYear(selectedDate.getFullYear());
      setViewingMonth(selectedDate.getMonth());
    }
  }, [visible, selectedDate]);

  const handlePrevMonth = () => {
    if (viewingMonth === 0) {
      setViewingMonth(11);
      setViewingYear((prev) => prev - 1);
    } else {
      setViewingMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewingMonth === 11) {
      setViewingMonth(0);
      setViewingYear((prev) => prev + 1);
    } else {
      setViewingMonth((prev) => prev + 1);
    }
  };

  // Generate 7x5 or 7x6 day grid for current viewing month
  const calendarCells = useMemo(() => {
    // Number of days in current viewing month
    const daysInMonth = new Date(viewingYear, viewingMonth + 1, 0).getDate();

    // Monday-based first day offset (0 = Monday, 1 = Tuesday ... 6 = Sunday)
    const firstDaySundayBased = new Date(viewingYear, viewingMonth, 1).getDay(); // 0 is Sunday
    const mondayOffset = (firstDaySundayBased + 6) % 7;

    // Days in previous month
    const daysInPrevMonth = new Date(viewingYear, viewingMonth, 0).getDate();

    const cells: Array<{
      dayNum: number;
      isCurrentMonth: boolean;
      date: Date;
      dateStr: string;
      isSunday: boolean;
    }> = [];

    const pad = (n: number) => n.toString().padStart(2, '0');

    // 1. Fill leading previous month days
    for (let i = mondayOffset - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(viewingYear, viewingMonth - 1, dayNum);
      const isSunday = prevDate.getDay() === 0;
      const dateStr = `${prevDate.getFullYear()}-${pad(prevDate.getMonth() + 1)}-${pad(prevDate.getDate())}`;
      cells.push({
        dayNum,
        isCurrentMonth: false,
        date: prevDate,
        dateStr,
        isSunday,
      });
    }

    // 2. Fill current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const curDate = new Date(viewingYear, viewingMonth, day);
      const isSunday = curDate.getDay() === 0;
      const dateStr = `${viewingYear}-${pad(viewingMonth + 1)}-${pad(day)}`;
      cells.push({
        dayNum: day,
        isCurrentMonth: true,
        date: curDate,
        dateStr,
        isSunday,
      });
    }

    // 3. Fill trailing next month days to complete 7-day grid rows (35 or 42 cells)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(viewingYear, viewingMonth + 1, i);
      const isSunday = nextDate.getDay() === 0;
      const dateStr = `${nextDate.getFullYear()}-${pad(nextDate.getMonth() + 1)}-${pad(nextDate.getDate())}`;
      cells.push({
        dayNum: i,
        isCurrentMonth: false,
        date: nextDate,
        dateStr,
        isSunday,
      });
    }

    return cells;
  }, [viewingYear, viewingMonth]);

  const selectedDateStr = useMemo(() => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(
      selectedDate.getDate()
    )}`;
  }, [selectedDate]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Semi-transparent Backdrop */}
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/40 justify-end"
      >
        {/* Prevent taps inside modal from dismissing */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="bg-white rounded-t-[32px] px-6 pt-5 pb-8 shadow-2xl"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          {/* Header Row: Prev Month, Title, Next Month */}
          <View className="flex-row items-center justify-between mb-6 px-1">
            <TouchableOpacity
              onPress={handlePrevMonth}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="w-9 h-9 rounded-full items-center justify-center active:opacity-60"
            >
              <ChevronLeft color="#94A3B8" size={22} strokeWidth={2.2} />
            </TouchableOpacity>

            <Text className="text-base font-bold text-slate-800 tracking-tight">
              tháng {viewingMonth + 1} năm {viewingYear}
            </Text>

            <TouchableOpacity
              onPress={handleNextMonth}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="w-9 h-9 rounded-full items-center justify-center active:opacity-60"
            >
              <ChevronRight color="#94A3B8" size={22} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          {/* Weekday Labels Row: T.2 -> CN (Sunday in Red) */}
          <View className="flex-row justify-between mb-3 px-1">
            {['T.2', 'T.3', 'T.4', 'T.5', 'T.6', 'T.7', 'CN'].map((dayLabel) => {
              const isSunday = dayLabel === 'CN';
              return (
                <View key={dayLabel} className="w-10 items-center justify-center">
                  <Text
                    className={`text-xs font-semibold ${
                      isSunday ? 'text-red-500 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {dayLabel}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Days Grid */}
          <View className="flex-row flex-wrap justify-between">
            {calendarCells.map((cell, idx) => {
              const isSelected = cell.dateStr === selectedDateStr;
              const hasWorkout = cell.isCurrentMonth && workoutDates.has(cell.dateStr);

              return (
                <View
                  key={`${cell.dateStr}_${idx}`}
                  className="w-10 h-11 items-center justify-center my-0.5"
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      onSelectDate(cell.date);
                      onClose();
                    }}
                    className={`w-9 h-9 rounded-full items-center justify-center ${
                      isSelected
                        ? 'bg-black shadow-xs'
                        : hasWorkout
                        ? 'bg-blue-100'
                        : ''
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        isSelected
                          ? 'text-white font-bold'
                          : hasWorkout
                          ? 'text-blue-600 font-bold'
                          : !cell.isCurrentMonth
                          ? 'text-slate-300'
                          : cell.isSunday
                          ? 'text-red-500 font-semibold'
                          : 'text-slate-800 font-medium'
                      }`}
                    >
                      {cell.dayNum}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
