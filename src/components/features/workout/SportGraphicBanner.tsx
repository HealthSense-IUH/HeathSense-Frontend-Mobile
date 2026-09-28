import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Rect, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { ExerciseIcon } from './ExerciseIcon';

interface SportGraphicBannerProps {
  exerciseName?: string;
  iconName?: string;
  category?: string;
}

export const SportGraphicBanner: React.FC<SportGraphicBannerProps> = ({
  exerciseName = 'Thể thao',
  iconName = 'Activity',
}) => {
  return (
    <View className="w-full h-72 items-center justify-center relative overflow-hidden bg-[#0B1015]">
      {/* Background Graphic Illustration Container */}
      <View
        className="w-[88%] h-44 rounded-3xl overflow-hidden relative items-center justify-center"
        style={{
          backgroundColor: '#1E293B',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
        }}
      >
        <Svg width="100%" height="100%" viewBox="0 0 340 180" className="absolute">
          <Defs>
            <LinearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#1E293B" />
              <Stop offset="100%" stopColor="#0F172A" />
            </LinearGradient>
            <LinearGradient id="ballGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#EC4899" />
              <Stop offset="100%" stopColor="#F43F5E" />
            </LinearGradient>
            <LinearGradient id="ballGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#38BDF8" />
              <Stop offset="100%" stopColor="#2563EB" />
            </LinearGradient>
          </Defs>

          <Rect width="340" height="180" fill="url(#bgGrad)" />

          {/* Decorative shapes resembling Samsung Health sports banner */}
          <Circle cx="60" cy="140" r="45" fill="rgba(59, 130, 246, 0.2)" />
          <Circle cx="280" cy="50" r="55" fill="rgba(236, 72, 153, 0.15)" />
          <Circle cx="260" cy="130" r="28" fill="url(#ballGrad1)" opacity={0.8} />
          <Circle cx="80" cy="60" r="22" fill="url(#ballGrad2)" opacity={0.8} />

          {/* Court lines */}
          <Path d="M 0 140 Q 170 120 340 140" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" fill="none" />
          <Path d="M 170 0 L 170 180" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" fill="none" />
        </Svg>

        {/* Central Icon & Title */}
        <View className="items-center justify-center z-10">
          <ExerciseIcon
            name={iconName}
            size={36}
            color="#FFFFFF"
            bgColor="rgba(16, 185, 129, 0.85)"
            className="mb-2 shadow-lg"
          />
          <Text className="text-white font-bold text-lg tracking-wide">
            {exerciseName}
          </Text>
        </View>
      </View>
    </View>
  );
};
