import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Headphones,
  Music,
  MoreVertical,
  ChevronDown,
  Check,
} from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { SportMapView } from '@/components/features/workout/SportMapView';
import { SportIllustration } from '@/components/features/workout/SportIllustration';
import { WheelPicker, WheelPickerItem } from '@/components/ui/WheelPicker';
import { useWorkoutCatalogStore } from '@/services/workout/workoutCatalogStore';
import { useWorkoutEngineStore } from '@/services/workout/workoutEngineStore';
import { WorkoutTargetType } from '@/services/workout/workoutTypes';
import { THEME } from '@/constants/theme';

export default function PreWorkoutScreen() {
  const router = useRouter();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();

  const exercises = useWorkoutCatalogStore((state) => state.exercises);
  const exercise = exercises.find((e) => e.id === exerciseId) || exercises[0];

  const setupWorkout = useWorkoutEngineStore((state) => state.setupWorkout);

  // Target mode state
  const [targetType, setTargetType] = useState<WorkoutTargetType>('NONE');
  const [showDropdown, setShowDropdown] = useState(false);
  const [pauseOnTarget, setPauseOnTarget] = useState(false);

  // Distance target values (default 1.00 km - Image 3 Specs)
  const [wholeKm, setWholeKm] = useState<number>(1);
  const [decimalKm, setDecimalKm] = useState<number>(0);

  // Calorie target value (default 300 kcal)
  const [calorieValue, setCalorieValue] = useState<number>(300);

  // Time target values (default 00:30:00)
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(30);
  const [seconds, setSeconds] = useState<number>(0);

  const isGpsSport = exercise?.trackingType === 'DISTANCE_GPS';

  // Target title dropdown text
  const getDropdownLabel = () => {
    switch (targetType) {
      case 'DISTANCE':
        return 'Mục tiêu quãng đường';
      case 'TIME':
        return 'Mục tiêu thời gian';
      case 'CALORIES':
        return 'Mục tiêu calo';
      case 'NONE':
      default:
        return 'Không có mục tiêu';
    }
  };

  // Precomputed datasets for WheelPickers
  const wholeKmData: WheelPickerItem[] = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => ({
      label: String(i),
      value: i,
    }));
  }, []);

  const decimalKmData: WheelPickerItem[] = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => ({
      label: i.toString().padStart(2, '0'),
      value: i,
    }));
  }, []);

  const calorieData: WheelPickerItem[] = useMemo(() => {
    return Array.from({ length: 1951 }, (_, i) => {
      const val = 50 + i;
      return { label: String(val), value: val };
    });
  }, []);

  const hoursData: WheelPickerItem[] = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      label: i.toString().padStart(2, '0'),
      value: i,
    }));
  }, []);

  const minutesData: WheelPickerItem[] = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      label: i.toString().padStart(2, '0'),
      value: i,
    }));
  }, []);

  const secondsData: WheelPickerItem[] = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      label: i.toString().padStart(2, '0'),
      value: i,
    }));
  }, []);

  const handleStart = () => {
    let finalValue = 0;
    if (targetType === 'DISTANCE') {
      finalValue = wholeKm + decimalKm / 100;
    } else if (targetType === 'TIME') {
      finalValue = hours * 3600 + minutes * 60 + seconds;
    } else if (targetType === 'CALORIES') {
      finalValue = calorieValue;
    }

    setupWorkout(exercise, targetType, finalValue, undefined, pauseOnTarget);
    router.push('/workout/active' as any);
  };

  return (
    <ScreenWrapper
      title={exercise?.name || 'Chạy bộ'}
      statusBarStyle="dark"
      scrollable={false}
      className="bg-[#F2F4F7]"
      headerLeft={
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
        >
          <ArrowLeft color={THEME.colors.textPrimary} size={22} />
        </TouchableOpacity>
      }
      headerRight={
        <View className="flex-row items-center gap-1">
          <TouchableOpacity className="w-10 h-10 rounded-full items-center justify-center active:opacity-70">
            <Headphones color={THEME.colors.textPrimary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 rounded-full items-center justify-center active:opacity-70">
            <Music color={THEME.colors.textPrimary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 rounded-full items-center justify-center active:opacity-70">
            <MoreVertical color={THEME.colors.textPrimary} size={20} />
          </TouchableOpacity>
        </View>
      }
    >
      {isGpsSport ? (
        /* ========================================================================= */
        /* GPS MAP WORKOUT PRE-SCREEN (Exact User Screenshots 1, 2, 3)               */
        /* ========================================================================= */
        <View className="flex-1 bg-[#F2F4F7] justify-between">
          {/* Top Half: Light Google Maps Vector Container (~58% height) */}
          <View className="flex-1 w-full relative">
            <SportMapView status="detected" height="100%" />
          </View>

          {/* Bottom Half: Target Selection Card & Start Button */}
          <View className="px-4 pb-6 pt-2 bg-[#F2F4F7]">
            {/* White Target Card with Rounded Top/Corners */}
            <View
              className="bg-white rounded-[32px] p-5 border border-slate-100/90 shadow-sm mb-4 justify-between"
              style={{
                minHeight: targetType === 'NONE' ? 140 : 210,
                shadowColor: 'rgba(15, 23, 42, 0.06)',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 14,
                elevation: 3,
              }}
            >
              {/* Target Dropdown Button */}
              <TouchableOpacity
                onPress={() => setShowDropdown(true)}
                activeOpacity={0.7}
                className="flex-row items-center justify-center gap-1.5 self-center py-1.5 px-3 mb-2"
              >
                <Text className="text-slate-900 text-base font-semibold">
                  {getDropdownLabel()}
                </Text>
                <ChevronDown color="#0F172A" size={18} strokeWidth={2.4} />
              </TouchableOpacity>

              {/* STATE 1: KHÔNG CÓ MỤC TIÊU (Screenshot 1) */}
              {targetType === 'NONE' && (
                <View className="items-center justify-center py-4 px-6">
                  <Text className="text-slate-400 text-sm font-normal text-center leading-relaxed">
                    Thúc đẩy việc tập luyện của bạn bằng mục tiêu tập luyện.
                  </Text>
                </View>
              )}

              {/* STATE 2: MỤC TIÊU QUÃNG ĐƯỜNG (Screenshot 3 - KM , 00 km) */}
              {targetType === 'DISTANCE' && (
                <View className="items-center justify-center w-full py-1">
                  <View className="flex-row items-center justify-center">
                    {/* Whole KM Column */}
                    <WheelPicker
                      data={wholeKmData}
                      selectedValue={wholeKm}
                      onValueChange={setWholeKm}
                      itemHeight={46}
                      width={64}
                      fontSize={34}
                    />

                    {/* Comma separator */}
                    <Text className="text-3xl font-extrabold text-slate-900 mx-2 -mt-1">
                      ,
                    </Text>

                    {/* Decimal KM Column (00-99) */}
                    <WheelPicker
                      data={decimalKmData}
                      selectedValue={decimalKm}
                      onValueChange={setDecimalKm}
                      itemHeight={46}
                      width={64}
                      fontSize={34}
                    />

                    {/* Unit 'km' on the right */}
                    <Text className="text-base font-bold text-slate-900 ml-4">
                      km
                    </Text>
                  </View>
                </View>
              )}

              {/* STATE 3: MỤC TIÊU THỜI GIAN (HH : MM : SS) */}
              {targetType === 'TIME' && (
                <View className="flex-row items-center justify-center w-full py-1">
                  <WheelPicker
                    data={hoursData}
                    selectedValue={hours}
                    onValueChange={setHours}
                    itemHeight={46}
                    width={64}
                    fontSize={32}
                  />
                  <Text className="text-2xl font-bold text-slate-900 mx-1">:</Text>
                  <WheelPicker
                    data={minutesData}
                    selectedValue={minutes}
                    onValueChange={setMinutes}
                    itemHeight={46}
                    width={64}
                    fontSize={32}
                  />
                  <Text className="text-2xl font-bold text-slate-900 mx-1">:</Text>
                  <WheelPicker
                    data={secondsData}
                    selectedValue={seconds}
                    onValueChange={setSeconds}
                    itemHeight={46}
                    width={64}
                    fontSize={32}
                  />
                </View>
              )}

              {/* STATE 4: MỤC TIÊU CALO */}
              {targetType === 'CALORIES' && (
                <View className="items-center justify-center w-full py-1">
                  <WheelPicker
                    data={calorieData}
                    selectedValue={calorieValue}
                    onValueChange={setCalorieValue}
                    itemHeight={46}
                    unit="kcal"
                    width={180}
                    fontSize={36}
                  />
                </View>
              )}

              {/* Bottom Toggle: Tạm dừng khi đạt mục tiêu (Screenshot 3) */}
              {targetType !== 'NONE' && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setPauseOnTarget(!pauseOnTarget)}
                  className="flex-row items-center justify-between pt-3 mt-1 border-t border-slate-100"
                >
                  <Text className="text-sm font-medium text-slate-800">
                    Tạm dừng khi đạt mục tiêu
                  </Text>
                  <Switch
                    value={pauseOnTarget}
                    onValueChange={setPauseOnTarget}
                    trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                    thumbColor="#FFFFFF"
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Bottom Button: Bắt đầu (Screenshot 1, 3) */}
            <TouchableOpacity
              onPress={handleStart}
              activeOpacity={0.8}
              className="w-full py-4 rounded-full bg-[#E2E8F0] items-center justify-center active:bg-slate-300 shadow-xs"
            >
              <Text className="text-slate-950 font-bold text-base tracking-wide">
                Bắt đầu
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* ========================================================================= */
        /* NON-GPS WORKOUT PRE-SCREEN (Gym, Badminton, Yoga, etc.)                   */
        /* ========================================================================= */
        <View className="flex-1 justify-between px-4 pb-6 bg-[#F2F4F7]">
          <View
            className="bg-white rounded-[32px] p-5 border border-slate-100 shadow-sm flex-1 justify-between mb-4 mt-1"
            style={{
              shadowColor: 'rgba(15, 23, 42, 0.04)',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            {/* Sport Illustration */}
            <View className="w-full">
              <SportIllustration />
            </View>

            {/* Target Selector */}
            <View className="items-center justify-center py-2 flex-1">
              <TouchableOpacity
                onPress={() => setShowDropdown(true)}
                activeOpacity={0.7}
                className="flex-row items-center justify-center gap-2 py-2 px-4 rounded-full bg-slate-50 border border-slate-200/80 mb-2 active:bg-slate-100"
              >
                <Text className="text-slate-900 text-base font-semibold">
                  {getDropdownLabel()}
                </Text>
                <ChevronDown color="#334155" size={18} strokeWidth={2.4} />
              </TouchableOpacity>

              {targetType === 'NONE' && (
                <View className="items-center justify-center px-6 my-auto">
                  <Text className="text-slate-400 text-xs font-normal text-center leading-relaxed">
                    Thúc đẩy việc tập luyện của bạn bằng mục tiêu tập luyện.
                  </Text>
                </View>
              )}

              {targetType === 'CALORIES' && (
                <View className="items-center justify-center w-full my-auto">
                  <WheelPicker
                    data={calorieData}
                    selectedValue={calorieValue}
                    onValueChange={setCalorieValue}
                    itemHeight={46}
                    unit="kcal"
                    width={200}
                    fontSize={36}
                  />
                </View>
              )}

              {targetType === 'TIME' && (
                <View className="flex-row items-center justify-center w-full my-auto">
                  <WheelPicker
                    data={hoursData}
                    selectedValue={hours}
                    onValueChange={setHours}
                    itemHeight={46}
                    width={68}
                    fontSize={32}
                  />
                  <Text className="text-2xl font-bold text-slate-900 mx-1">:</Text>
                  <WheelPicker
                    data={minutesData}
                    selectedValue={minutes}
                    onValueChange={setMinutes}
                    itemHeight={46}
                    width={68}
                    fontSize={32}
                  />
                  <Text className="text-2xl font-bold text-slate-900 mx-1">:</Text>
                  <WheelPicker
                    data={secondsData}
                    selectedValue={seconds}
                    onValueChange={setSeconds}
                    itemHeight={46}
                    width={68}
                    fontSize={32}
                  />
                </View>
              )}
            </View>

            {/* Toggle switch for non-GPS */}
            {targetType !== 'NONE' ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setPauseOnTarget(!pauseOnTarget)}
                className="flex-row items-center justify-between pt-4 border-t border-slate-100"
              >
                <Text className="text-sm font-medium text-slate-800">
                  Tạm dừng khi đạt mục tiêu
                </Text>
                <Switch
                  value={pauseOnTarget}
                  onValueChange={setPauseOnTarget}
                  trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              </TouchableOpacity>
            ) : (
              <View className="h-4" />
            )}
          </View>

          {/* Bottom Action Button */}
          <TouchableOpacity
            onPress={handleStart}
            activeOpacity={0.8}
            className="w-full py-4 rounded-full bg-slate-200/90 items-center justify-center active:bg-slate-300 shadow-sm"
          >
            <Text className="text-slate-950 font-bold text-base tracking-wide">
              Bắt đầu
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TARGET SELECTION MODAL (Screenshot 2 Specs)                               */}
      {/* User explicit rule: EXACTLY 4 options, NO route or past result race       */}
      {/* 1. Không có mục tiêu                                                     */}
      {/* 2. Mục tiêu quãng đường (for GPS sports)                                 */}
      {/* 3. Mục tiêu thời gian                                                    */}
      {/* 4. Mục tiêu calo                                                         */}
      {/* ========================================================================= */}
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end pb-16 px-4"
          onPress={() => setShowDropdown(false)}
        >
          <Pressable
            className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-100"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Option 1: Không có mục tiêu */}
            <TouchableOpacity
              onPress={() => {
                setTargetType('NONE');
                setShowDropdown(false);
              }}
              activeOpacity={0.7}
              className="flex-row items-center justify-between py-3.5 px-3 border-b border-slate-100"
            >
              <Text
                className={`text-base ${
                  targetType === 'NONE'
                    ? 'text-emerald-600 font-bold'
                    : 'text-slate-800 font-medium'
                }`}
              >
                Không có mục tiêu
              </Text>
              {targetType === 'NONE' && (
                <Check color="#10B981" size={20} strokeWidth={2.6} />
              )}
            </TouchableOpacity>

            {/* Option 2: Mục tiêu quãng đường (GPS Sports Only) */}
            {isGpsSport && (
              <TouchableOpacity
                onPress={() => {
                  setTargetType('DISTANCE');
                  setShowDropdown(false);
                }}
                activeOpacity={0.7}
                className="flex-row items-center justify-between py-3.5 px-3 border-b border-slate-100"
              >
                <Text
                  className={`text-base ${
                    targetType === 'DISTANCE'
                      ? 'text-emerald-600 font-bold'
                      : 'text-slate-800 font-medium'
                  }`}
                >
                  Mục tiêu quãng đường
                </Text>
                {targetType === 'DISTANCE' && (
                  <Check color="#10B981" size={20} strokeWidth={2.6} />
                )}
              </TouchableOpacity>
            )}

            {/* Option 3: Mục tiêu thời gian */}
            <TouchableOpacity
              onPress={() => {
                setTargetType('TIME');
                setShowDropdown(false);
              }}
              activeOpacity={0.7}
              className="flex-row items-center justify-between py-3.5 px-3 border-b border-slate-100"
            >
              <Text
                className={`text-base ${
                  targetType === 'TIME'
                    ? 'text-emerald-600 font-bold'
                    : 'text-slate-800 font-medium'
                }`}
              >
                Mục tiêu thời gian
              </Text>
              {targetType === 'TIME' && (
                <Check color="#10B981" size={20} strokeWidth={2.6} />
              )}
            </TouchableOpacity>

            {/* Option 4: Mục tiêu calo */}
            <TouchableOpacity
              onPress={() => {
                setTargetType('CALORIES');
                setShowDropdown(false);
              }}
              activeOpacity={0.7}
              className="flex-row items-center justify-between py-3.5 px-3"
            >
              <Text
                className={`text-base ${
                  targetType === 'CALORIES'
                    ? 'text-emerald-600 font-bold'
                    : 'text-slate-800 font-medium'
                }`}
              >
                Mục tiêu calo
              </Text>
              {targetType === 'CALORIES' && (
                <Check color="#10B981" size={20} strokeWidth={2.6} />
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenWrapper>
  );
}
