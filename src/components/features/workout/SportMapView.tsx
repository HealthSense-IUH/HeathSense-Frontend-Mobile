import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, {
  Path,
  Circle,
  Polygon,
  Rect,
  G,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { Layers, Crosshair, MapPin } from 'lucide-react-native';
interface SportMapViewProps {
  status?: 'searching' | 'detected';
  height?: number | string;
  showPolyline?: boolean;
  onRecenter?: () => void;
  onToggleLayer?: () => void;
}

export const SportMapView: React.FC<SportMapViewProps> = ({
  status = 'detected',
  height = 320,
  showPolyline = false,
  onRecenter,
  onToggleLayer,
}) => {
  const [gpsStatus, setGpsStatus] = useState<'searching' | 'detected'>(status);
  const [layerType, setLayerType] = useState<'standard' | 'satellite'>('standard');

  useEffect(() => {
    if (status === 'searching') {
      const timer = setTimeout(() => {
        setGpsStatus('detected');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleRecenter = () => {
    if (onRecenter) onRecenter();
  };

  const handleToggleLayer = () => {
    if (onToggleLayer) onToggleLayer();
    setLayerType((prev) => (prev === 'standard' ? 'satellite' : 'standard'));
  };

  return (
    <View
      className="relative overflow-hidden bg-[#F2F4F3]"
      style={{ height: height as any, width: '100%' }}
    >
      {/* Google Maps Light Mode Vector Aesthetic */}
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 400 360"
        style={StyleSheet.absoluteFill}
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <LinearGradient id="activePolylineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#10B981" />
            <Stop offset="100%" stopColor="#059669" />
          </LinearGradient>
        </Defs>

        {/* 1. Base Terrain Canvas */}
        <Rect width="400" height="360" fill={layerType === 'satellite' ? '#1E293B' : '#F4F6F4'} />

        {/* 2. Light Green Agricultural Farmland & Park Zones */}
        <Polygon
          points="0,0 200,0 180,80 140,110 80,180 0,220"
          fill={layerType === 'satellite' ? '#1E3A2B' : '#E6F4EA'}
          opacity={0.9}
        />
        <Polygon
          points="0,230 70,190 120,240 60,320 0,340"
          fill={layerType === 'satellite' ? '#163124' : '#EDF7EE'}
          opacity={0.8}
        />
        <Polygon
          points="160,70 230,65 240,130 180,135"
          fill={layerType === 'satellite' ? '#1E3A2B' : '#EAF7EC'}
          stroke={layerType === 'satellite' ? '#22543D' : '#CEEAD6'}
          strokeWidth="1"
        />

        {/* 3. Pathways */}
        <Path
          d="M 20 50 Q 80 60 140 55 T 240 65"
          stroke={layerType === 'satellite' ? '#334155' : '#DCE2EA'}
          strokeWidth="3.5"
          fill="none"
        />
        <Path
          d="M 50 160 Q 120 150 180 180 T 250 145"
          stroke={layerType === 'satellite' ? '#334155' : '#DCE2EA'}
          strokeWidth="3.5"
          fill="none"
        />
        <Path
          d="M 170 140 L 220 135 L 245 150"
          stroke={layerType === 'satellite' ? '#334155' : '#DCE2EA'}
          strokeWidth="3.5"
          fill="none"
        />
        <Path
          d="M 100 240 L 160 235 L 150 270 L 105 285 Z"
          stroke={layerType === 'satellite' ? '#334155' : '#DCE2EA'}
          strokeWidth="2.5"
          fill={layerType === 'satellite' ? '#0F172A' : '#FAFBF9'}
        />

        {/* 4. Primary Vertical Road / Boulevard */}
        <Path
          d="M 252 -20 L 252 140 L 245 200 L 245 380"
          stroke={layerType === 'satellite' ? '#475569' : '#D1D5DB'}
          strokeWidth="11"
          fill="none"
        />
        <Path
          d="M 252 -20 L 252 140 L 245 200 L 245 380"
          stroke={layerType === 'satellite' ? '#64748B' : '#FFFFFF'}
          strokeWidth="7"
          fill="none"
        />

        {/* 5. Cross Highways */}
        <Path
          d="M 60 380 L 380 190"
          stroke={layerType === 'satellite' ? '#475569' : '#D1D5DB'}
          strokeWidth="10"
          fill="none"
        />
        <Path
          d="M 60 380 L 380 190"
          stroke={layerType === 'satellite' ? '#64748B' : '#FFFFFF'}
          strokeWidth="6"
          fill="none"
        />

        {/* 6. Live polyline route */}
        {showPolyline && (
          <Path
            d="M 180 180 L 190 165 L 185 145 L 200 130"
            stroke="url(#activePolylineGrad)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}

        {/* 7. Landmark Markers & Labels */}
        <G transform="translate(100, 195)">
          <Circle cx="10" cy="10" r="12" fill={layerType === 'satellite' ? '#334155' : '#E8EAED'} />
          <Circle cx="10" cy="10" r="8" fill={layerType === 'satellite' ? '#64748B' : '#5F6368'} opacity={0.6} />
          <Circle cx="10" cy="7" r="2.5" fill="#FFFFFF" />
          <Circle cx="13" cy="10" r="2.5" fill="#FFFFFF" />
          <Circle cx="10" cy="13" r="2.5" fill="#FFFFFF" />
          <Circle cx="7" cy="10" r="2.5" fill="#FFFFFF" />
          <SvgText
            x="-20"
            y="7"
            fontSize="10"
            fontWeight="500"
            fill={layerType === 'satellite' ? '#94A3B8' : '#5F6368'}
            textAnchor="end"
          >
            Vườn Thanh
          </SvgText>
          <SvgText
            x="-20"
            y="20"
            fontSize="10"
            fontWeight="500"
            fill={layerType === 'satellite' ? '#94A3B8' : '#5F6368'}
            textAnchor="end"
          >
            Long Đức Hồ
          </SvgText>
        </G>

        <G transform="translate(230, 260)">
          <Circle cx="10" cy="10" r="12" fill={layerType === 'satellite' ? '#334155' : '#E8EAED'} />
          <Rect x="5" y="7" width="10" height="7" rx="1" fill={layerType === 'satellite' ? '#94A3B8' : '#70757A'} />
          <Polygon points="5,7 10,3 15,7" fill={layerType === 'satellite' ? '#64748B' : '#5F6368'} />
          <SvgText
            x="-18"
            y="6"
            fontSize="9.5"
            fontWeight="500"
            fill={layerType === 'satellite' ? '#94A3B8' : '#5F6368'}
            textAnchor="end"
          >
            UBND Xã Hàm
          </SvgText>
          <SvgText
            x="-18"
            y="18"
            fontSize="9.5"
            fontWeight="500"
            fill={layerType === 'satellite' ? '#94A3B8' : '#5F6368'}
            textAnchor="end"
          >
            Thuận Nam
          </SvgText>
        </G>

        {/* 8. Center User Navigation Pointer (Bright Green Chevron Arrow - 45 deg) */}
        <G transform="translate(185, 140)">
          <Circle cx="15" cy="15" r="20" fill="rgba(16, 185, 129, 0.18)" />
          <Polygon
            points="15,0 30,28 15,21 0,28"
            fill="#00C853"
            transform="rotate(35, 15, 15)"
          />
        </G>
      </Svg>

      {/* Floating Status Pill: "Đã phát hiện" (Top-Left) */}
      <View className="absolute top-4 left-4 z-10">
        <View className="flex-row items-center bg-white px-3.5 py-1.5 rounded-full border border-slate-200/90 shadow-sm">
          <MapPin
            color="#10B981"
            fill="#10B981"
            size={14}
            className="mr-1.5"
          />
          <Text className="text-slate-800 text-xs font-semibold">
            {gpsStatus === 'detected' ? 'Đã phát hiện' : 'Đang tìm kiếm...'}
          </Text>
        </View>
      </View>

      {/* Floating Action Buttons: Recenter & Layers (Top-Right) */}
      <View className="absolute top-4 right-4 z-10 flex-col gap-2.5">
        <Pressable
          onPress={handleRecenter}
          className="w-10 h-10 rounded-full bg-white border border-slate-200/90 items-center justify-center shadow-sm active:bg-slate-100 active:opacity-70"
        >
          <Crosshair color="#00C853" size={20} strokeWidth={2.4} />
        </Pressable>

        <Pressable
          onPress={handleToggleLayer}
          className="w-10 h-10 rounded-full bg-white border border-slate-200/90 items-center justify-center shadow-sm active:bg-slate-100 active:opacity-70"
        >
          <Layers
            color={layerType === 'satellite' ? '#00C853' : '#475569'}
            size={19}
            strokeWidth={2.2}
          />
        </Pressable>
      </View>

      {/* Google Watermark Logo (Bottom-Left) */}
      <View className="absolute bottom-3 left-4 z-10 pointer-events-none">
        <Text className="text-slate-500/80 font-black text-sm tracking-wider">
          Google
        </Text>
      </View>
    </View>
  );
};



