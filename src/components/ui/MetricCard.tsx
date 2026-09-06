import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  colors: readonly [string, string, ...string[]];
  unitTextColorClass?: string;
  unitBgColorClass?: string;
  titleColorClass?: string;
}

export const MetricCard = ({
  title,
  value,
  unit,
  icon,
  colors,
  unitTextColorClass = 'text-white',
  unitBgColorClass = 'bg-black/20',
  titleColorClass = 'text-white/80',
}: MetricCardProps) => {
  return (
    <View 
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{
        shadowColor: 'rgba(15, 23, 42, 0.07)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 24,
        elevation: 3,
      }}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-4"
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            {icon}
          </View>
          <View className={`px-2 py-0.5 rounded-md ${unitBgColorClass}`}>
            <Text className={`text-[11px] font-bold uppercase tracking-wider ${unitTextColorClass}`}>
              {unit}
            </Text>
          </View>
        </View>
        
        <View className="mb-1">
          <Text className="text-3xl font-extrabold tracking-tight text-white">
            {value}
          </Text>
        </View>
        
        <Text className={`text-xs font-medium ${titleColorClass}`}>
          {title}
        </Text>
      </LinearGradient>
    </View>
  );
};
