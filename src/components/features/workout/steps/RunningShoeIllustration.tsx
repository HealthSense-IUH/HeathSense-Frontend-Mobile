import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Line, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

export const RunningShoeIllustration: React.FC = () => {
  return (
    <View className="w-18 h-18 rounded-full bg-slate-100/90 border border-slate-200/60 items-center justify-center overflow-hidden">
      <Svg width={54} height={54} viewBox="0 0 100 100">
        <Defs>
          <SvgGradient id="shoeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#00A2FF" />
            <Stop offset="100%" stopColor="#0066FF" />
          </SvgGradient>
          <SvgGradient id="laceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#FF3366" />
            <Stop offset="100%" stopColor="#FF6699" />
          </SvgGradient>
        </Defs>
        {/* Shoe Outline Top View */}
        <Path
          d="M 50 10 C 35 10 22 25 22 45 C 22 65 28 85 45 92 C 55 92 78 85 78 45 C 78 25 65 10 50 10 Z"
          fill="url(#shoeGradient)"
        />
        {/* Toe Cap */}
        <Path
          d="M 32 30 C 32 20 40 14 50 14 C 60 14 68 20 68 30 C 60 26 40 26 32 30 Z"
          fill="#0044CC"
        />
        {/* Inner Shoe Opening */}
        <Path
          d="M 50 48 C 42 48 37 58 37 72 C 37 84 43 88 50 88 C 57 88 63 84 63 72 C 63 58 58 48 50 48 Z"
          fill="#1E293B"
        />
        {/* Pink Laces */}
        <Line x1="38" y1="36" x2="62" y2="36" stroke="url(#laceGradient)" strokeWidth="3.5" strokeLinecap="round" />
        <Line x1="40" y1="42" x2="60" y2="42" stroke="url(#laceGradient)" strokeWidth="3.5" strokeLinecap="round" />
        <Line x1="42" y1="48" x2="58" y2="48" stroke="url(#laceGradient)" strokeWidth="3.5" strokeLinecap="round" />
        {/* White Accent Lines */}
        <Path
          d="M 24 55 Q 32 60 36 75"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M 76 55 Q 68 60 64 75"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};
