import React from 'react';
import { View } from 'react-native';
import Svg, {
  Path,
  Circle,
  Rect,
  Ellipse,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';
import { ShuttlecockIllustration } from './ShuttlecockIllustration';

interface SportHeaderConfig {
  bgColor: string;
  renderGraphic: () => React.ReactNode;
}

export const getSportThemeConfig = (exerciseId = '', exerciseName = ''): SportHeaderConfig => {
  const key = (exerciseId + ' ' + exerciseName).toLowerCase();

  // 1. Cầu lông (Badminton)
  if (key.includes('badminton') || key.includes('cầu lông')) {
    return {
      bgColor: '#246B4E', // Badminton Court Green
      renderGraphic: () => <ShuttlecockIllustration size={110} />,
    };
  }

  // 2. Chạy bộ (Running)
  if (key.includes('running') || key.includes('chạy')) {
    return {
      bgColor: '#991B1B', // Running Track Crimson
      renderGraphic: () => (
        <Svg width="110" height="110" viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="shoeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="100%" stopColor="#F1F5F9" />
            </LinearGradient>
            <LinearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#F87171" />
              <Stop offset="100%" stopColor="#EF4444" />
            </LinearGradient>
          </Defs>
          <Ellipse cx="50" cy="80" rx="35" ry="8" fill="rgba(0,0,0,0.15)" />
          {/* Running Shoe Vector */}
          <Path
            d="M 20 68 Q 28 50 48 50 Q 65 48 78 58 L 86 70 Q 75 74 50 74 Q 25 74 20 68 Z"
            fill="url(#shoeGrad)"
            stroke="#CBD5E1"
            strokeWidth="1.2"
          />
          {/* Shoe Nike-style Swoosh / Accent Stripe */}
          <Path
            d="M 32 64 Q 52 56 70 66"
            stroke="url(#accentGrad)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          {/* Sole Cushion */}
          <Path
            d="M 18 69 L 88 71 Q 84 78 50 78 Q 22 78 18 69 Z"
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          {/* Laces */}
          <Path d="M 44 51 L 48 56" stroke="#EF4444" strokeWidth="2" />
          <Path d="M 48 50 L 52 55" stroke="#EF4444" strokeWidth="2" />
          <Path d="M 52 49 L 56 54" stroke="#EF4444" strokeWidth="2" />
          {/* Speed Wind Streaks */}
          <Path d="M 10 45 L 30 45" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
          <Path d="M 14 55 L 26 55" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
        </Svg>
      ),
    };
  }

  // 3. Đạp xe (Cycling)
  if (key.includes('cycling') || key.includes('đạp xe') || key.includes('bike')) {
    return {
      bgColor: '#0369A1', // Open Road Ocean Blue
      renderGraphic: () => (
        <Svg width="110" height="110" viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="helmetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="100%" stopColor="#E2E8F0" />
            </LinearGradient>
          </Defs>
          <Ellipse cx="50" cy="78" rx="30" ry="7" fill="rgba(0,0,0,0.15)" />
          {/* Aerodynamic Cycling Helmet */}
          <Path
            d="M 20 62 Q 22 38 48 35 Q 75 32 88 56 Q 72 65 48 64 Q 28 65 20 62 Z"
            fill="url(#helmetGrad)"
            stroke="#CBD5E1"
            strokeWidth="1.2"
          />
          {/* Air Vents */}
          <Path d="M 38 43 Q 48 40 58 45" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" fill="none" />
          <Path d="M 44 50 Q 56 48 68 53" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" fill="none" />
          <Path d="M 52 56 Q 64 54 75 58" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Helmet Visor Tip */}
          <Path d="M 82 52 L 92 60 L 80 63 Z" fill="#0284C7" />
        </Svg>
      ),
    };
  }

  // 4. Đi bộ / Dã ngoại (Walking / Hiking)
  if (key.includes('walking') || key.includes('đi bộ') || key.includes('hiking')) {
    return {
      bgColor: '#15803D', // Forest Park Green
      renderGraphic: () => (
        <Svg width="110" height="110" viewBox="0 0 100 100">
          <Ellipse cx="50" cy="80" rx="32" ry="7" fill="rgba(0,0,0,0.15)" />
          {/* Stylized Footprints & Nature Compass */}
          <Circle cx="50" cy="48" r="26" fill="rgba(255,255,255,0.2)" stroke="#FFFFFF" strokeWidth="1.5" />
          <Circle cx="50" cy="48" r="2" fill="#FFFFFF" />
          {/* Compass Needle */}
          <Path d="M 50 26 L 55 48 L 50 44 L 45 48 Z" fill="#EF4444" />
          <Path d="M 50 70 L 55 48 L 50 52 L 45 48 Z" fill="#FFFFFF" />
          {/* Trail Mountain behind */}
          <Path d="M 22 75 L 36 58 L 50 75 Z" fill="rgba(255,255,255,0.3)" />
          <Path d="M 42 75 L 58 52 L 74 75 Z" fill="rgba(255,255,255,0.4)" />
        </Svg>
      ),
    };
  }

  // 5. Bơi lội (Swimming)
  if (key.includes('swimming') || key.includes('bơi')) {
    return {
      bgColor: '#0284C7', // Crystal Pool Azure
      renderGraphic: () => (
        <Svg width="110" height="110" viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="goggleLens" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#38BDF8" />
              <Stop offset="100%" stopColor="#0284C7" />
            </LinearGradient>
          </Defs>
          {/* Swimming Goggles */}
          <Ellipse cx="38" cy="50" rx="14" ry="11" fill="url(#goggleLens)" stroke="#FFFFFF" strokeWidth="2.5" />
          <Ellipse cx="62" cy="50" rx="14" ry="11" fill="url(#goggleLens)" stroke="#FFFFFF" strokeWidth="2.5" />
          {/* Nose Bridge */}
          <Path d="M 48 48 Q 50 44 52 48" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
          {/* Straps */}
          <Path d="M 24 50 Q 15 48 8 50" stroke="#FFFFFF" strokeWidth="2" fill="none" />
          <Path d="M 76 50 Q 85 48 92 50" stroke="#FFFFFF" strokeWidth="2" fill="none" />
          {/* Water Ripples */}
          <Path d="M 18 72 Q 35 66 50 72 Q 65 78 82 72" stroke="rgba(255,255,255,0.6)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <Path d="M 25 80 Q 40 76 55 80 Q 70 84 80 80" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </Svg>
      ),
    };
  }

  // 6. Tập tạ / Gym / Kháng lực (Weights / Gym)
  if (key.includes('tạ') || key.includes('gym') || key.includes('press') || key.includes('hít') || key.includes('pull')) {
    return {
      bgColor: '#334155', // Fitness Charcoal Slate
      renderGraphic: () => (
        <Svg width="110" height="110" viewBox="0 0 100 100">
          <Ellipse cx="50" cy="78" rx="34" ry="7" fill="rgba(0,0,0,0.2)" />
          {/* Dumbbell Vector */}
          <G transform="rotate(-25 50 50)">
            {/* Bar */}
            <Rect x="25" y="47" width="50" height="6" fill="#E2E8F0" rx="2" />
            {/* Left Plates */}
            <Rect x="20" y="32" width="7" height="36" fill="#F8FAFC" rx="3" stroke="#CBD5E1" strokeWidth="1" />
            <Rect x="13" y="36" width="6" height="28" fill="#F1F5F9" rx="2" stroke="#CBD5E1" strokeWidth="1" />
            {/* Right Plates */}
            <Rect x="73" y="32" width="7" height="36" fill="#F8FAFC" rx="3" stroke="#CBD5E1" strokeWidth="1" />
            <Rect x="81" y="36" width="6" height="28" fill="#F1F5F9" rx="2" stroke="#CBD5E1" strokeWidth="1" />
            {/* Center Grip Collar */}
            <Rect x="42" y="46" width="16" height="8" fill="#94A3B8" rx="1" />
          </G>
        </Svg>
      ),
    };
  }

  // 7. Bóng đá (Soccer)
  if (key.includes('bóng đá') || key.includes('soccer') || key.includes('football')) {
    return {
      bgColor: '#166534', // Pitch Deep Green
      renderGraphic: () => (
        <Svg width="110" height="110" viewBox="0 0 100 100">
          <Ellipse cx="50" cy="78" rx="26" ry="6" fill="rgba(0,0,0,0.2)" />
          <Circle cx="50" cy="50" r="26" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
          {/* Center Pentagon */}
          <Path d="M 50 42 L 57 47 L 54 56 L 46 56 L 43 47 Z" fill="#0F172A" />
          {/* Outer Accents */}
          <Path d="M 50 42 L 50 32 L 44 26 L 38 34 L 43 47 Z" fill="#1E293B" opacity="0.9" />
          <Path d="M 57 47 L 66 43 L 72 50 L 65 57 L 54 56 Z" fill="#1E293B" opacity="0.9" />
          <Path d="M 46 56 L 43 66 L 50 72 L 57 66 L 54 56 Z" fill="#1E293B" opacity="0.9" />
          <Path d="M 43 47 L 34 50 L 32 60 L 39 64 L 46 56 Z" fill="#1E293B" opacity="0.9" />
        </Svg>
      ),
    };
  }

  // 8. Bóng bàn (Table Tennis)
  if (key.includes('bóng bàn') || key.includes('table_tennis') || key.includes('ping')) {
    return {
      bgColor: '#1E40AF', // Table Tennis Royal Navy
      renderGraphic: () => (
        <Svg width="110" height="110" viewBox="0 0 100 100">
          <Ellipse cx="50" cy="80" rx="28" ry="6" fill="rgba(0,0,0,0.2)" />
          {/* Racket Blade (Red Rubber) */}
          <Circle cx="46" cy="42" r="22" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
          {/* Handle */}
          <Path d="M 58 56 L 76 74 L 70 80 L 52 62 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
          {/* Handle Wood stripes */}
          <Path d="M 62 60 L 73 71" stroke="#94A3B8" strokeWidth="2" />
          {/* White Ball */}
          <Circle cx="30" cy="62" r="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
        </Svg>
      ),
    };
  }

  // 9. Yoga / Giãn cơ (Yoga / Stretching)
  if (key.includes('yoga') || key.includes('giãn cơ') || key.includes('stretch')) {
    return {
      bgColor: '#6D28D9', // Zen Amethyst Violet
      renderGraphic: () => (
        <Svg width="110" height="110" viewBox="0 0 100 100">
          <Ellipse cx="50" cy="78" rx="28" ry="6" fill="rgba(0,0,0,0.2)" />
          {/* Lotus Petals Vector */}
          <Path d="M 50 30 Q 38 48 50 66 Q 62 48 50 30 Z" fill="#FFFFFF" opacity="0.9" />
          <Path d="M 50 42 Q 32 46 36 64 Q 48 64 50 66 Z" fill="#F5D0FE" opacity="0.85" />
          <Path d="M 50 42 Q 68 46 64 64 Q 52 64 50 66 Z" fill="#F5D0FE" opacity="0.85" />
          <Path d="M 50 50 Q 24 55 26 68 Q 44 68 50 66 Z" fill="#E879F9" opacity="0.8" />
          <Path d="M 50 50 Q 76 55 74 68 Q 56 68 50 66 Z" fill="#E879F9" opacity="0.8" />
        </Svg>
      ),
    };
  }

  // 10. Mặc định (Trophy & Laurel)
  return {
    bgColor: '#059669', // Vibrant Emerald
    renderGraphic: () => (
      <Svg width="110" height="110" viewBox="0 0 100 100">
        <Ellipse cx="50" cy="80" rx="28" ry="6" fill="rgba(0,0,0,0.15)" />
        {/* Golden Trophy Vector */}
        <Path d="M 36 32 L 64 32 L 60 56 Q 50 66 40 56 Z" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5" />
        {/* Handles */}
        <Path d="M 36 36 Q 22 40 34 50" stroke="#F59E0B" strokeWidth="3" fill="none" />
        <Path d="M 64 36 Q 78 40 66 50" stroke="#F59E0B" strokeWidth="3" fill="none" />
        {/* Stem & Base */}
        <Rect x="47" y="58" width="6" height="12" fill="#F59E0B" />
        <Rect x="38" y="70" width="24" height="6" fill="#FCD34D" rx="2" stroke="#F59E0B" strokeWidth="1" />
        {/* Star in Cup */}
        <Circle cx="50" cy="44" r="5" fill="#FFFFFF" />
      </Svg>
    ),
  };
};

export const SportSummaryHeaderGraphic: React.FC<{
  exerciseId?: string;
  exerciseName?: string;
}> = ({ exerciseId = '', exerciseName = '' }) => {
  const config = getSportThemeConfig(exerciseId, exerciseName);
  return <View>{config.renderGraphic()}</View>;
};
