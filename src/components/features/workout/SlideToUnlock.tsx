import React, { useMemo, useState } from 'react';
import {
  View,
  Animated,
  PanResponder,
  Vibration,
} from 'react-native';
import { Lock, Unlock, ChevronRight } from 'lucide-react-native';

interface SlideToUnlockProps {
  onUnlock: () => void;
  sliderWidth?: number;
}

export function SlideToUnlock({ onUnlock, sliderWidth = 260 }: SlideToUnlockProps) {
  const [pan] = useState(() => new Animated.Value(0));
  const buttonSize = 48;
  const maxSlide = sliderWidth - buttonSize - 12;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dx > 0) {
            pan.setValue(Math.min(maxSlide, gestureState.dx));
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx >= maxSlide * 0.65) {
            // Completed slide to unlock
            Animated.timing(pan, {
              toValue: maxSlide,
              duration: 90,
              useNativeDriver: true,
            }).start(() => {
              try {
                Vibration.vibrate(60);
              } catch {}
              onUnlock();
              pan.setValue(0);
            });
          } else {
            // Spring back to start
            Animated.spring(pan, {
              toValue: 0,
              friction: 6,
              tension: 50,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [maxSlide, onUnlock, pan]
  );

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
      <Animated.View
        style={{
          transform: [{ translateX: pan }],
          zIndex: 20,
        }}
        {...panResponder.panHandlers}
      >
        <View className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-lg active:opacity-90">
          <Lock color="#000000" size={20} strokeWidth={2.4} />
        </View>
      </Animated.View>

      {/* Chevrons Guide (Exact >>>>>>> from Samsung Health) */}
      <View className="flex-row items-center justify-center flex-1 mx-1 pointer-events-none">
        {Array.from({ length: 7 }).map((_, i) => (
          <ChevronRight
            key={i}
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
