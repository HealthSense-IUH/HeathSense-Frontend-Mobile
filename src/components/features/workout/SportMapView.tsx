import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Map,
  Camera,
  UserLocation,
  GeoJSONSource,
  Layer,
  type CameraRef,
} from '@maplibre/maplibre-react-native';
import { Layers, Crosshair, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useWorkoutEngineStore } from '@/services/workout/workoutEngineStore';

interface SportMapViewProps {
  status?: 'searching' | 'detected';
  height?: number | string;
  showPolyline?: boolean;
  onRecenter?: () => void;
  onToggleLayer?: () => void;
}

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_API_KEY || 'm0175FqEJjwNaaZTt7uv';

const MAP_STYLES = {
  standard: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
  satellite: `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`,
};

// Tọa độ trung tâm mặc định tại Việt Nam nếu chưa nhận được GPS (TP. Hồ Chí Minh)
const DEFAULT_CENTER: [number, number] = [106.6823, 10.8223];

export const SportMapView: React.FC<SportMapViewProps> = ({
  status = 'detected',
  height = 320,
  showPolyline = false,
  onRecenter,
  onToggleLayer,
}) => {
  const { t } = useTranslation('workout');
  const cameraRef = useRef<CameraRef>(null);

  const [gpsStatus, setGpsStatus] = useState<'searching' | 'detected'>(status);
  const [layerType, setLayerType] = useState<'standard' | 'satellite'>('standard');
  const [hasFollowedInitialGps, setHasFollowedInitialGps] = useState(false);

  // Lấy dữ liệu tọa độ thật từ WorkoutEngineStore
  const gpsTrack = useWorkoutEngineStore((state) => state.gpsTrack);

  // Điểm tọa độ mới nhất của người dùng
  const latestCoord = useMemo<[number, number] | null>(() => {
    if (!gpsTrack || gpsTrack.length === 0) return null;
    const lastPoint = gpsTrack[gpsTrack.length - 1];
    return [lastPoint.longitude, lastPoint.latitude];
  }, [gpsTrack]);

  // Tạo GeoJSON LineString thật từ danh sách tọa độ GPS
  const routeGeoJson = useMemo<GeoJSON.FeatureCollection | null>(() => {
    if (!showPolyline || !gpsTrack || gpsTrack.length < 2) return null;

    const coordinates = gpsTrack.map((pt) => [pt.longitude, pt.latitude]);

    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates,
          },
        },
      ],
    };
  }, [gpsTrack, showPolyline]);

  // Cập nhật trạng thái GPS khi có tọa độ thật đổ về
  useEffect(() => {
    if (gpsTrack && gpsTrack.length > 0) {
      setGpsStatus('detected');
    } else if (status === 'searching') {
      setGpsStatus('searching');
    }
  }, [gpsTrack, status]);

  // Tự động di chuyển Camera đến vị trí người dùng khi bắt được GPS đầu tiên
  useEffect(() => {
    if (latestCoord && !hasFollowedInitialGps && cameraRef.current) {
      cameraRef.current.flyTo({
        center: latestCoord,
        zoom: 16.5,
        duration: 1000,
      });
      setHasFollowedInitialGps(true);
    }
  }, [latestCoord, hasFollowedInitialGps]);

  // Xử lý nút Định vị lại vị trí (Recenter)
  const handleRecenter = () => {
    if (onRecenter) onRecenter();

    if (latestCoord && cameraRef.current) {
      cameraRef.current.flyTo({
        center: latestCoord,
        zoom: 16.5,
        duration: 800,
      });
    }
  };

  // Xử lý đổi lớp bản đồ (Vệ tinh / Đường phố MapTiler)
  const handleToggleLayer = () => {
    if (onToggleLayer) onToggleLayer();
    setLayerType((prev) => (prev === 'standard' ? 'satellite' : 'standard'));
  };

  return (
    <View
      className="relative overflow-hidden bg-slate-100"
      style={{ height: height as any, width: '100%' }}
    >
      {/* Bản đồ Native MapLibre kết nối MapTiler Vector Styles */}
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={MAP_STYLES[layerType]}
        logo={false}
        attribution={false}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: latestCoord || DEFAULT_CENTER,
            zoom: 15.5,
          }}
          trackUserLocation="course"
        />

        {/* Hiển thị vị trí người dùng thời gian thực với độ chính xác và la bàn */}
        <UserLocation
          animated
          heading
          accuracy
        />

        {/* Lớp vẽ Polyline đường chạy thực tế theo dữ liệu GPS */}
        {routeGeoJson && (
          <GeoJSONSource id="workoutRouteSource" data={routeGeoJson}>
            {/* Lớp viền ngoài làm bóng nổi bật đường chạy */}
            <Layer
              id="workoutRouteOutline"
              type="line"
              style={{
                lineColor: '#064E3B',
                lineWidth: 7,
                lineCap: 'round',
                lineJoin: 'round',
                lineOpacity: 0.6,
              }}
            />
            {/* Lớp đường chạy xanh lá thể thao chính */}
            <Layer
              id="workoutRouteLine"
              type="line"
              style={{
                lineColor: '#10B981',
                lineWidth: 5,
                lineCap: 'round',
                lineJoin: 'round',
                lineOpacity: 1,
              }}
            />
          </GeoJSONSource>
        )}
      </Map>

      {/* Floating Status Pill: "Đã phát hiện GPS" (Top-Left) */}
      <View className="absolute top-4 left-4 z-10">
        <View className="flex-row items-center bg-white/95 px-3.5 py-1.5 rounded-full border border-slate-200/90 shadow-sm backdrop-blur-md">
          <MapPin
            color={gpsStatus === 'detected' ? '#10B981' : '#F59E0B'}
            fill={gpsStatus === 'detected' ? '#10B981' : '#F59E0B'}
            size={14}
            className="mr-1.5"
          />
          <Text className="text-slate-800 text-xs font-semibold">
            {gpsStatus === 'detected' ? t('map.gpsDetected') : t('map.gpsSearching')}
          </Text>
        </View>
      </View>

      {/* Floating Action Buttons: Recenter & Layers (Top-Right) */}
      <View className="absolute top-4 right-4 z-10 flex-col gap-2.5">
        <Pressable
          onPress={handleRecenter}
          className="w-10 h-10 rounded-full bg-white/95 border border-slate-200/90 items-center justify-center shadow-md active:bg-slate-100 active:opacity-75"
        >
          <Crosshair color="#10B981" size={20} strokeWidth={2.4} />
        </Pressable>

        <Pressable
          onPress={handleToggleLayer}
          className="w-10 h-10 rounded-full bg-white/95 border border-slate-200/90 items-center justify-center shadow-md active:bg-slate-100 active:opacity-75"
        >
          <Layers
            color={layerType === 'satellite' ? '#10B981' : '#475569'}
            size={19}
            strokeWidth={2.2}
          />
        </Pressable>
      </View>

      {/* MapTiler Attribution (Bottom-Left) */}
      <View className="absolute bottom-2 left-3 z-10 pointer-events-none bg-white/70 px-2 py-0.5 rounded-md">
        <Text className="text-[10px] text-slate-600 font-semibold tracking-wider">
          © MapTiler © OpenStreetMap
        </Text>
      </View>
    </View>
  );
};
