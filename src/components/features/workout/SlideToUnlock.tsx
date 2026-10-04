import React from 'react';
import { View, Vibration } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Lock, Unlock, ChevronRight } from 'lucide-react-native';

interface SlideToUnlockProps {
  onUnlock: () => void;
  sliderWidth?: number;
}

export function SlideToUnlock({ onUnlock, sliderWidth = 260 }: SlideToUnlockProps) {
  const buttonSize = 48;
  const maxSlide = sliderWidth - buttonSize - 12;
  const translateX = useSharedValue(0);

  const triggerUnlock = () => {
    try {
      Vibration.vibrate(60);
    } catch {}
    onUnlock();
  };

  const panGesture = Gesture.Pan()
    .onChange((event) => {
      if (event.translationX > 0) {
        translateX.value = Math.min(maxSlide, event.translationX);
      }
    })
    .onEnd((event) => {
      if (event.translationX >= maxSlide * 0.65) {
        translateX.value = withTiming(maxSlide, { duration: 90 }, (finished) => {
          if (finished) {
            scheduleOnRN(triggerUnlock);
            translateX.value = 0;
          }
        });
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  const animatedHandleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={{
        width: sliderWidth,
        height: 56,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
      }}
    >
      {/* Draggable White Lock Handle */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            {
              zIndex: 20,
            },
            animatedHandleStyle,
          ]}
        >
          <View className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-lg active:opacity-90">
            <Lock color="#000000" size={20} strokeWidth={2.4} />
          </View>
        </Animated.View>
      </GestureDetector>

      {/* Chevrons Guide (Exact >>>>>>> from Samsung Health) */}
      <View className="flex-row items-center justify-center flex-1 mx-1 pointer-events-none">
        {Array.from({ length: 7 }).map((_, i) => (
          <ChevronRight
            key={`chevron-${i}`}
            color="#4B5563"
            size={18}
            strokeWidth={2.4}
            style={{ marginHorizontal: -4 }}
          />
        ))}
      </View>

      {/* Target White Unlock Icon */}
      <View className="w-10 h-10 items-center justify-center pointer-events-none mr-1">
        <Unlock color="#FFFFFF" size={22} strokeWidth={2.2} />
      </View>
    </View>
  );
}
