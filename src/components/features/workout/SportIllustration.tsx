import React from 'react';
import { View } from 'react-native';
import Svg, {
  Path,
  Rect,
  Circle,
  G,
  Defs,
  LinearGradient,
  Stop,
  Ellipse,
} from 'react-native-svg';

export const SportIllustration: React.FC = () => {
  return (
    <View className="w-full h-48 rounded-3xl overflow-hidden bg-slate-100/90 items-center justify-center relative">
      <Svg width="100%" height="100%" viewBox="0 0 340 180">
        <Defs>
          {/* Cyan to Blue Gradient for right shorts */}
          <LinearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#38BDF8" />
            <Stop offset="100%" stopColor="#2563EB" />
          </LinearGradient>

          {/* Pink Basketball Gradient */}
          <LinearGradient id="pinkBallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#F43F5E" />
            <Stop offset="100%" stopColor="#E11D48" />
          </LinearGradient>

          {/* Floor Shadow */}
          <LinearGradient id="shadowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#CBD5E1" stopOpacity="0.4" />
            <Stop offset="50%" stopColor="#94A3B8" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.4" />
          </LinearGradient>
        </Defs>

        {/* Floor Shadow Ellipses */}
        <Ellipse cx="100" cy="155" rx="35" ry="8" fill="url(#shadowGrad)" />
        <Ellipse cx="160" cy="160" rx="25" ry="6" fill="url(#shadowGrad)" />
        <Ellipse cx="225" cy="155" rx="35" ry="8" fill="url(#shadowGrad)" />

        {/* --- LEFT ATHLETE --- */}
        {/* Left Shorts (Royal Blue) */}
        <Path
          d="M 35 70 L 105 70 L 95 115 L 45 115 Z"
          fill="#1D4ED8"
        />

        {/* Left Player Leg & Knee (Stylized white curve) */}
        <Path
          d="M 50 105 Q 40 125 75 145 L 85 145 Q 60 120 70 105 Z"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="1.5"
        />
        {/* Left Sock with stripe */}
        <Rect x="72" y="135" width="18" height="15" fill="#FFFFFF" rx="2" />
        <Rect x="72" y="138" width="18" height="3" fill="#1D4ED8" />

        {/* Left Sneaker (Blue with white accents) */}
        <Path
          d="M 68 152 Q 80 148 95 150 Q 112 153 115 158 L 68 158 Z"
          fill="#2563EB"
        />
        <Path
          d="M 72 158 L 112 158 L 110 162 L 70 162 Z"
          fill="#94A3B8"
        />
        {/* Cleat studs / sole */}
        <Circle cx="76" cy="163" r="2" fill="#64748B" />
        <Circle cx="86" cy="163" r="2" fill="#64748B" />
        <Circle cx="104" cy="163" r="2" fill="#64748B" />

        {/* Left Athlete Behind Leg */}
        <Path
          d="M 30 110 Q 15 130 35 145 L 45 145 Q 25 125 40 110 Z"
          fill="#F8FAFC"
          opacity="0.8"
        />

        {/* --- RIGHT ATHLETE --- */}
        {/* Right Shorts (Gradient Cyan to Blue) */}
        <Path
          d="M 230 70 L 305 70 L 300 115 L 225 115 Z"
          fill="url(#blueGradient)"
        />

        {/* Right Leg & Knee */}
        <Path
          d="M 245 105 Q 260 125 240 145 L 230 145 Q 245 120 235 105 Z"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="1.5"
        />
        {/* Right Sock (Royal Blue with white stripe) */}
        <Rect x="220" y="132" width="22" height="18" fill="#1D4ED8" rx="2" />
        <Rect x="220" y="135" width="22" height="3" fill="#FFFFFF" />

        {/* Right Sneaker (Cyan / Blue) */}
        <Path
          d="M 200 158 Q 202 152 220 150 Q 238 148 250 154 L 250 158 Z"
          fill="#38BDF8"
        />
        <Path
          d="M 198 158 L 248 158 L 246 162 L 202 162 Z"
          fill="#94A3B8"
        />
        <Circle cx="206" cy="163" r="2" fill="#64748B" />
        <Circle cx="224" cy="163" r="2" fill="#64748B" />
        <Circle cx="240" cy="163" r="2" fill="#64748B" />

        {/* Right Athlete Behind Leg */}
        <Path
          d="M 270 105 Q 295 125 315 135 L 310 140 Q 285 125 260 105 Z"
          fill="#F8FAFC"
          opacity="0.8"
        />

        {/* Right Player Hand holding Basketball */}
        <Path
          d="M 180 90 Q 170 95 165 110 Q 175 115 185 100 Z"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="1"
        />

        {/* --- BALLS --- */}
        {/* 1. Pink Basketball (in hand) */}
        <Circle cx="190" cy="110" r="26" fill="url(#pinkBallGrad)" />
        {/* Basketball Seams */}
        <Path
          d="M 164 110 Q 190 90 216 110"
          stroke="#9F1239"
          strokeWidth="1.6"
          fill="none"
        />
        <Path
          d="M 164 110 Q 190 130 216 110"
          stroke="#9F1239"
          strokeWidth="1.6"
          fill="none"
        />
        <Path
          d="M 190 84 L 190 136"
          stroke="#9F1239"
          strokeWidth="1.6"
          fill="none"
        />

        {/* 2. Pink & White Soccer Ball (on ground) */}
        <Circle cx="160" cy="150" r="24" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
        {/* Center Pentagon */}
        <Path
          d="M 160 142 L 167 147 L 164 155 L 156 155 L 153 147 Z"
          fill="#F43F5E"
        />
        {/* Side Pentagons */}
        <Path
          d="M 160 142 L 160 134 L 153 130 L 148 136 L 153 147 Z"
          fill="#F43F5E"
          opacity="0.85"
        />
        <Path
          d="M 167 147 L 175 143 L 180 150 L 174 156 L 164 155 Z"
          fill="#F43F5E"
          opacity="0.85"
        />
        <Path
          d="M 156 155 L 153 164 L 160 170 L 167 164 L 164 155 Z"
          fill="#F43F5E"
          opacity="0.85"
        />
        <Path
          d="M 153 147 L 144 150 L 142 160 L 149 164 L 156 155 Z"
          fill="#F43F5E"
          opacity="0.85"
        />
      </Svg>
    </View>
  );
};
