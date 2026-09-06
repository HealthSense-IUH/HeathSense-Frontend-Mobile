import React from 'react';
import Svg, { Rect, Path, Circle } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Biểu tượng Đồng hồ thông minh chuẩn thiết kế Stitch (HealthSense)
 * Khung đồng hồ bo góc, quai đeo trên dưới và chấm cảm biến quang học ở tâm.
 */
export const StitchSmartwatchIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#FFFFFF',
  strokeWidth = 2.2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x={6}
      y={7}
      width={12}
      height={10}
      rx={3}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Path
      d="M9 7V3C9 2.45 9.45 2 10 2H14C14.55 2 15 2.45 15 3V7"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M9 17V21C9 21.55 9.45 22 10 22H14C14.55 22 15 21.55 15 21V17"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Circle cx={12} cy={12} r={1.75} fill={color} />
  </Svg>
);

/**
 * Biểu tượng Sóng phát BLE đồng tâm chuẩn thiết kế Stitch (HealthSense)
 * Tâm phát sóng và 4 dải sóng đồng tâm hai bên.
 */
export const StitchBleWaveIcon: React.FC<IconProps> = ({
  size = 32,
  color = '#FFFFFF',
  strokeWidth = 2.2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={2.2} fill={color} />
    <Path
      d="M8.5 8.5a5 5 0 0 0 0 7"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Path
      d="M15.5 8.5a5 5 0 0 1 0 7"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Path
      d="M5.5 5.5a9.2 9.2 0 0 0 0 13"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Path
      d="M18.5 5.5a9.2 9.2 0 0 1 0 13"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

/**
 * Biểu tượng Trái tim lồng sóng ECG nhịp tim chuẩn thiết kế Stitch (HealthSense AFib 60s)
 */
export const StitchHeartEcgIcon: React.FC<{
  size?: number;
  heartColor?: string;
  ecgColor?: string;
}> = ({
  size = 64,
  heartColor = '#4F80E1',
  ecgColor = '#2563EB',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      stroke={heartColor}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7.5 12h2.2l1.3-3.2 2 6.4 1.4-4.2 1 1h2.1"
      stroke={ecgColor}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

