import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { ChevronRight, Wifi } from 'lucide-react-native';
import { StitchSmartwatchIcon } from '@/components/ui/icons/StitchIcons';
import { THEME } from '@/constants/theme';

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
    device.name || device.advertising?.localName || `Thiết bị BLE (${device.id.slice(-5)})`;

  return (
    <View 
      className="bg-white rounded-2xl p-4 border border-slate-100 mb-3 flex-row items-center justify-between"
      style={{ ...THEME.shadows.card }}
    >
      <View className="flex-row items-center gap-3 flex-1 mr-2">
        <View 
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            backgroundColor: '#EFF6FF',
            borderWidth: 1,
            borderColor: 'rgba(219, 234, 254, 0.8)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <StitchSmartwatchIcon size={22} color={THEME.colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-bold text-slate-900" numberOfLines={1}>
            {displayName}
          </Text>
          <View className="flex-row items-center mt-0.5 space-x-2">
            <Text className="text-xs text-slate-400 font-medium" numberOfLines={1}>
              {device.id}
            </Text>
            {device.rssi ? (
              <View className="flex-row items-center bg-slate-100 px-1.5 py-0.5 rounded-md ml-2">
                <Wifi size={10} color={THEME.colors.primary} className="mr-1" />
                <Text className="text-[10px] font-semibold text-slate-600">
                  {device.rssi} dBm
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <Pressable
        className={`px-4 py-2.5 rounded-xl flex-row items-center justify-center active:opacity-80 ${
          isConnecting ? 'opacity-70' : ''
        }`}
        style={{ backgroundColor: THEME.colors.primary }}
        onPress={() => onConnect(device)}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <>
            <Text className="text-white font-bold text-xs mr-1">Kết nối</Text>
            <ChevronRight color="#ffffff" size={14} strokeWidth={2.5} />
          </>
        )}
      </Pressable>
    </View>
  );
};
