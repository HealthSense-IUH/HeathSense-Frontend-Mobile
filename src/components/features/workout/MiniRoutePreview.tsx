import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { decodePolyline } from '@/utils/polylineEncoder';
import type { GpsCoordinate } from '@/services/workout/workoutTypes';

interface MiniRoutePreviewProps {
  gpsTrack?: GpsCoordinate[];
  encodedPolyline?: string;
  size?: number;
  strokeWidth?: number;
  strokeColor?: string;
}

export const MiniRoutePreview: React.FC<MiniRoutePreviewProps> = ({
  gpsTrack,
  encodedPolyline,
  size = 48,
  strokeWidth = 2.4,
  strokeColor = '#00C8FF',
}) => {
  const coordinates = useMemo(() => {
    if (gpsTrack && gpsTrack.length >= 2) {
      return gpsTrack;
    }
    if (encodedPolyline && encodedPolyline.trim().length > 0) {
      const decoded = decodePolyline(encodedPolyline);
      if (decoded.length >= 2) {
        return decoded;
      }
    }
    return null;
  }, [gpsTrack, encodedPolyline]);

  const { pathData, startPoint, endPoint } = useMemo(() => {
    if (!coordinates || coordinates.length < 2) {
      return { pathData: '', startPoint: null, endPoint: null };
    }

    let minLng = coordinates[0].longitude;
    let maxLng = coordinates[0].longitude;
    let minLat = coordinates[0].latitude;
    let maxLat = coordinates[0].latitude;

    for (let i = 1; i < coordinates.length; i++) {
      const pt = coordinates[i];
      if (pt.longitude < minLng) minLng = pt.longitude;
      if (pt.longitude > maxLng) maxLng = pt.longitude;
      if (pt.latitude < minLat) minLat = pt.latitude;
      if (pt.latitude > maxLat) maxLat = pt.latitude;
    }

    const padding = 5;
    const drawSize = size - padding * 2;
    const deltaLng = maxLng - minLng || 0.0001;
    const deltaLat = maxLat - minLat || 0.0001;

    // Giữ nguyên aspect ratio để hình vẽ cung đường không bị co giãn méo
    const scale = Math.min(drawSize / deltaLng, drawSize / deltaLat);
    const offsetX = padding + (drawSize - deltaLng * scale) / 2;
    const offsetY = padding + (drawSize - deltaLat * scale) / 2;

    const points = coordinates.map((pt) => {
      const x = offsetX + (pt.longitude - minLng) * scale;
      // Trục Y của SVG hướng xuống dưới, trong khi Latitude hướng lên trên
      const y = size - (offsetY + (pt.latitude - minLat) * scale);
      return [x, y];
    });

    const path = points.reduce((acc, [x, y], idx) => {
      return idx === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');

    return {
      pathData: path,
      startPoint: points[0],
      endPoint: points[points.length - 1],
    };
  }, [coordinates, size]);

  if (!coordinates || !pathData) {
    return null;
  }

  return (
    <View
      className="items-center justify-center bg-slate-50/90 rounded-xl border border-slate-200/80 overflow-hidden shadow-xs"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Glow / Outline */}
        <Path
          d={pathData}
          fill="none"
          stroke="rgba(0, 200, 255, 0.25)"
          strokeWidth={strokeWidth + 2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Main Route Line */}
        <Path
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Start Point (Green dot) */}
        {startPoint && (
          <Circle
            cx={startPoint[0]}
            cy={startPoint[1]}
            r={2.5}
            fill="#10B981"
            stroke="#FFFFFF"
            strokeWidth={1}
          />
        )}

        {/* End Point (Red dot) */}
        {endPoint && (
          <Circle
            cx={endPoint[0]}
            cy={endPoint[1]}
            r={2.5}
            fill="#EF4444"
            stroke="#FFFFFF"
            strokeWidth={1}
          />
        )}
      </Svg>
    </View>
  );
};
