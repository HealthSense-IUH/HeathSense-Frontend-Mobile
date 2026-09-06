import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, Animated, Easing } from 'react-native';
import { Settings } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StitchBleWaveIcon } from '@/components/ui/icons/StitchIcons';
import { useRouter } from 'expo-router';
import { THEME } from '@/constants/theme';

interface BleRadarStatusProps {
  isScanning: boolean;
  scanStatusMessage: string;
}

export const BleRadarStatus: React.FC<BleRadarStatusProps> = ({
  isScanning,
  scanStatusMessage,
}) => {
  const router = useRouter();

  // Standard React Native / React 19 Animated state (persistent across renders without ref access)
  const [pulse1] = useState(() => new Animated.Value(0));
  const [pulse2] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!isScanning) {
      pulse1.setValue(0);
      pulse2.setValue(0);
      return;
    }

    const anim1 = Animated.loop(
      Animated.timing(pulse1, {
        toValue: 1,
        duration: 2800,
        easing: Easing.bezier(0.215, 0.61, 0.355, 1),
        useNativeDriver: true,
      })
    );

    const anim2 = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(pulse2, {
          toValue: 1,
          duration: 2800,
          easing: Easing.bezier(0.215, 0.61, 0.355, 1),
          useNativeDriver: true,
        }),
      ])
    );

    anim1.start();
    anim2.start();

    return () => {
      anim1.stop();
      anim2.stop();
    };
  }, [isScanning, pulse1, pulse2]);

  const scale1 = pulse1.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.75, 1.2, 1.65],
  });
  const opacity1 = pulse1.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.8, 0.25, 0],
  });

  const scale2 = pulse2.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.65, 1.05, 1.45],
  });
  const opacity2 = pulse2.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.9, 0.3, 0],
  });

  return (
    <View 
      className="relative bg-white rounded-[28px] border border-slate-100 p-6 flex flex-col items-center justify-center text-center overflow-hidden min-h-[290px] mb-6"
      style={{
        shadowColor: 'rgba(13, 110, 253, 0.08)',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 36,
        elevation: 4,
      }}
    >
      {/* Top Right Settings Gear Button */}
      <Pressable 
        aria-label="Cài đặt kết nối"
        onPress={() => router.push('/(tabs)/settings' as any)}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100/80 flex items-center justify-center active:opacity-70 z-20"
      >
        <Settings color="#64748B" size={18} strokeWidth={2} />
      </Pressable>

      {/* Radar Wave Animation Container (144x144 px) */}
      <View className="relative w-36 h-36 flex items-center justify-center my-2">
        {/* Animated Pulsing Ripples (Explicit Circular Styles) */}
        {isScanning && (
          <>
            <Animated.View
              style={{
                position: 'absolute',
                width: 144,
                height: 144,
                borderRadius: 72,
                backgroundColor: 'rgba(96, 165, 250, 0.25)',
                transform: [{ scale: scale1 }],
                opacity: opacity1,
              }}
            />
            <Animated.View
              style={{
                position: 'absolute',
                width: 128,
                height: 128,
                borderRadius: 64,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                transform: [{ scale: scale2 }],
                opacity: opacity2,
              }}
            />
          </>
        )}

        {/* Outer Soft Glow Ring (96x96 px) - Explicit Circular Gradient */}
        <LinearGradient
          colors={['#DBEAFE', '#F0F9FF']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(191, 219, 254, 0.5)',
            shadowColor: 'rgba(13, 110, 253, 0.1)',
            shadowRadius: 8,
            elevation: 1,
          }}
        >
          {/* Center BLE Sensor Target Circle (64x64 px) - Explicit Circular Gradient */}
          <LinearGradient
            colors={['#2563EB', '#38BDF8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: 'rgba(13, 110, 253, 0.35)',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 1,
              shadowRadius: 16,
              elevation: 6,
            }}
          >
            {/* Exact Concentric BLE Wave Signal Icon from Stitch */}
            <StitchBleWaveIcon size={32} color="#FFFFFF" strokeWidth={2.2} />
          </LinearGradient>
        </LinearGradient>
      </View>

      {/* Scanning Status Texts */}
      <View className="mt-4 flex flex-col items-center">
        <Text className="text-base font-bold text-slate-800 tracking-tight text-center">
          {scanStatusMessage}
        </Text>
        
        {isScanning && (
          <View className="flex-row items-center space-x-2 mt-2">
            <ActivityIndicator size="small" color={THEME.colors.primary} />
            <Text className="text-xs font-semibold text-primary tracking-wide ml-1.5" style={{ color: THEME.colors.primary }}>
              Đang tự động quét BLE...
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};
