import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { ChevronRight, Watch } from 'lucide-react-native';

export type BlePeripheral = {
  id: string;
  name?: string | null;
  advertising?: {
    localName?: string | null;
    isConnectable?: boolean;
    rssi?: number;
    serviceUUIDs?: string[];
  };
  rssi?: number;
};

interface DiscoveredDeviceCardProps {
  device: BlePeripheral;
  isConnecting: boolean;
  onConnect: (device: BlePeripheral) => void;
}

export const DiscoveredDeviceCard: React.FC<DiscoveredDeviceCardProps> = ({
  device,
  isConnecting,
  onConnect,
}) => {
  const displayName =
    device.name || device.advertising?.localName || 'HuyWatch Device';

  return (
    <View className="bg-card rounded-2xl p-4 border border-border mb-3 flex-row items-center justify-between shadow-sm">
      <View className="flex-row items-center gap-3 flex-1">
        <View className="h-12 w-12 rounded-2xl bg-accent/10 border border-accent/20 items-center justify-center">
          <Watch color="#55A316" size={24} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground" numberOfLines={1}>
            {displayName}
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
            {device.id}
          </Text>
        </View>
      </View>

      <Pressable
        className={`ml-3 px-5 py-3 rounded-xl bg-primary flex-row items-center gap-1 active:opacity-80 ${
          isConnecting ? 'opacity-70' : ''
        }`}
        onPress={() => onConnect(device)}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <>
            <Text className="text-white font-bold text-sm">Kết nối</Text>
            <ChevronRight color="#ffffff" size={16} />
          </>
        )}
      </Pressable>
    </View>
  );
};
