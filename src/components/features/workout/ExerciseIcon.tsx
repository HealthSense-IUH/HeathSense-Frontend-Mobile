import React from 'react';
import { View } from 'react-native';
import {
  Footprints,
  Flame,
  Bike,
  Gauge,
  RotateCw,
  Zap,
  Shield,
  ArrowDownCircle,
  ChevronDown,
  Disc,
  Dumbbell,
  ArrowUpCircle,
  Layers,
  Box,
  Target,
  Compass,
  Mountain,
  Waves,
  SunMedium,
  Snowflake,
  CloudSnow,
  Trophy,
  CircleDot,
  Globe,
  Activity,
  Sparkles,
  HeartPulse,
  Music,
  Circle,
} from 'lucide-react-native';
import { THEME } from '@/constants/theme';

interface ExerciseIconProps {
  name?: string;
  size?: number;
  color?: string;
  bgColor?: string;
  className?: string;
}

const ICON_MAP: Record<string, any> = {
  Footprints,
  Flame,
  Bike,
  Gauge,
  RotateCw,
  Zap,
  Shield,
  ArrowDownCircle,
  ChevronDown,
  Disc,
  Dumbbell,
  ArrowUpCircle,
  Layers,
  Box,
  Target,
  Compass,
  Mountain,
  Waves,
  SunMedium,
  Snowflake,
  CloudSnow,
  Trophy,
  CircleDot,
  Globe,
  Activity,
  Sparkles,
  HeartPulse,
  Music,
  Circle,
};

export const ExerciseIcon: React.FC<ExerciseIconProps> = ({
  name = 'Activity',
  size = 22,
  color = THEME.colors.statusNormal,
  bgColor = 'rgba(16, 185, 129, 0.1)',
  className = '',
}) => {
  const IconComponent = ICON_MAP[name] || Activity;

  return (
    <View
      className={`items-center justify-center rounded-2xl ${className}`}
      style={{
        width: size + 18,
        height: size + 18,
        backgroundColor: bgColor,
      }}
    >
      <IconComponent color={color} size={size} strokeWidth={2.2} />
    </View>
  );
};
