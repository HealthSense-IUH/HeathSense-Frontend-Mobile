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
} from 'lucide-react-native';

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
};

export const getExerciseCircleColor = (exerciseId: string, _category?: string): string => {
  switch (exerciseId) {
    case 'walking':
      return '#34C759'; // Vibrant Walking Green
    case 'running':
    case 'track_running':
      return '#7CA018'; // Lime Olive Running
    case 'cycling':
    case 'stationary_bike':
      return '#E05A47'; // Coral Red Cycling
    case 'pool_swimming':
    case 'open_water_swimming':
      return '#06B6D4'; // Cyan Swimming
    case 'badminton':
    case 'table_tennis':
      return '#EC4899'; // Pink Racket
    case 'hiking':
    case 'trail_running':
      return '#10B981'; // Emerald Wilderness
    case 'treadmill':
    case 'elliptical':
      return '#8B5CF6'; // Purple Machine
    case 'yoga':
    case 'stretching':
      return '#F59E0B'; // Amber Stretch
    default:
      return '#22C55E';
  }
};

export const getExerciseIconComponent = (iconNameOrId?: string) => {
  if (!iconNameOrId) return Activity;
  return ICON_MAP[iconNameOrId] || Activity;
};
