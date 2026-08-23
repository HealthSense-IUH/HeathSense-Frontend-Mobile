import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Radio } from 'lucide-react-native';

interface BleRadarStatusProps {
  isScanning: boolean;
  scanStatusMessage: string;
}

export const BleRadarStatus: React.FC<BleRadarStatusProps> = ({
  isScanning,
  scanStatusMessage,
}) => {
  return (
    <View className="mt-8 bg-card rounded-3xl p-6 border border-border shadow-sm items-center justify-center">
      <View className="relative items-center justify-center my-4">
        <View
          className={`h-24 w-24 rounded-full bg-primary/10 items-center justify-center ${
            isScanning ? 'opacity-80' : 'opacity-30'
          }`}
        />
        <View className="absolute h-16 w-16 rounded-full bg-primary/20 items-center justify-center">
          <Radio color="#0F67FE" size={32} />
        </View>
      </View>

      <Text className="text-base font-bold text-foreground mt-2 text-center">
        {scanStatusMessage}
      </Text>

      {isScanning && (
        <View className="flex-row items-center gap-2 mt-2">
          <ActivityIndicator size="small" color="#0F67FE" />
          <Text className="text-xs font-semibold text-primary">
            Đang tự động quét BLE...
          </Text>
        </View>
      )}
    </View>
  );
};
