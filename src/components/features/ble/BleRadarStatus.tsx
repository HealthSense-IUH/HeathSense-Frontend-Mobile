import React from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { Radio, Settings } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface BleRadarStatusProps {
  isScanning: boolean;
  scanStatusMessage: string;
}

export const BleRadarStatus: React.FC<BleRadarStatusProps> = ({
  isScanning,
  scanStatusMessage,
}) => {
  return (
    <View 
      className="relative mt-8 bg-white rounded-[28px] border border-slate-100 p-6 flex flex-col items-center justify-center min-h-[290px] mb-7 overflow-hidden"
      style={{
        shadowColor: 'rgba(13, 110, 253, 0.08)',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 36,
        elevation: 4,
      }}
    >
      <Pressable className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100/80 flex items-center justify-center active:opacity-70">
        <Settings color="#64748B" size={18} strokeWidth={2} />
      </Pressable>

      <View className="relative w-36 h-36 flex items-center justify-center my-2">
        {/* Animated Rings */}
        {isScanning && (
          <>
            <View className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping" />
            <View className="absolute inset-2 rounded-full bg-blue-500/15 animate-pulse" />
          </>
        )}
        {/* Outer Glow Ring */}
        <LinearGradient
          colors={['#DBEAFE', '#F0F9FF']}
          className="w-24 h-24 rounded-full flex items-center justify-center border border-blue-200/50"
        >
          {/* Inner Target Circle */}
          <LinearGradient
            colors={['#2563EB', '#38BDF8']}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              shadowColor: 'rgba(59, 130, 246, 0.35)',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <Radio color="#FFFFFF" size={30} strokeWidth={2.2} />
          </LinearGradient>
        </LinearGradient>
      </View>

      <View className="mt-4 flex flex-col items-center">
        <Text className="text-base font-bold text-slate-800 tracking-tight text-center">
          {scanStatusMessage}
        </Text>
        
        {isScanning && (
          <View className="flex-row items-center space-x-2 mt-2">
            <ActivityIndicator size="small" color="#0D6EFD" />
            <Text className="text-xs font-semibold text-medical-500 tracking-wide ml-2">
              Đang tự động quét BLE...
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

