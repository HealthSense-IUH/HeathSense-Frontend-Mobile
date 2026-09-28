import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';

export const ShuttlecockIllustration: React.FC<{ size?: number }> = ({ size = 90 }) => {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="corkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#E2E8F0" />
          </LinearGradient>
          <LinearGradient id="featherGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#F1F5F9" />
          </LinearGradient>
          <LinearGradient id="featherShadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#CBD5E1" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#94A3B8" stopOpacity="0.2" />
          </LinearGradient>
        </Defs>

        {/* Cork Head Shadow */}
        <Ellipse cx="40" cy="72" rx="14" ry="5" fill="rgba(0,0,0,0.15)" />

        {/* Feathers Fan (Angled Up-Right) */}
        <Path
          d="M 45 60 L 85 18 C 88 15 92 18 88 23 L 52 66 Z"
          fill="url(#featherGrad)"
          stroke="#E2E8F0"
          strokeWidth="0.8"
        />
        <Path
          d="M 42 62 L 78 12 C 82 9 86 12 82 17 L 48 68 Z"
          fill="url(#featherGrad)"
          stroke="#CBD5E1"
          strokeWidth="0.8"
        />
        <Path
          d="M 38 64 L 68 8 C 72 5 76 8 72 13 L 44 69 Z"
          fill="url(#featherGrad)"
          stroke="#E2E8F0"
          strokeWidth="0.8"
        />
        <Path
          d="M 35 66 L 58 6 C 61 4 65 7 62 12 L 40 70 Z"
          fill="url(#featherGrad)"
          stroke="#CBD5E1"
          strokeWidth="0.8"
        />
        <Path
          d="M 32 68 L 48 10 C 51 8 54 11 51 16 L 36 71 Z"
          fill="url(#featherGrad)"
          stroke="#E2E8F0"
          strokeWidth="0.8"
        />

        {/* Ribbons / thread binding feathers */}
        <Path
          d="M 44 45 Q 60 36 78 40"
          stroke="#94A3B8"
          strokeWidth="1.2"
          fill="none"
        />
        <Path
          d="M 40 54 Q 54 46 70 50"
          stroke="#94A3B8"
          strokeWidth="1.2"
          fill="none"
        />

        {/* Cork Leather Band */}
        <Path
          d="M 30 68 Q 38 64 45 70 L 43 74 Q 36 68 28 72 Z"
          fill="#0F172A"
        />

        {/* Cork Head (Hemisphere) */}
        <Path
          d="M 28 72 Q 22 78 28 85 Q 35 90 42 85 Q 46 78 43 74 Z"
          fill="url(#corkGrad)"
          stroke="#CBD5E1"
          strokeWidth="1"
        />
      </Svg>
    </View>
  );
};
