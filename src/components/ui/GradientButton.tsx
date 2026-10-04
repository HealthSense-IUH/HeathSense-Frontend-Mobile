import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const GradientButton = ({ 
  title, 
  onPress, 
  icon, 
  className = '', 
  disabled = false 
}: GradientButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`w-full overflow-hidden rounded-2xl active:opacity-80 ${className}`}
      style={{
        shadowColor: 'rgba(13, 110, 253, 0.35)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 8,
      }}
    >
      <LinearGradient
        colors={disabled ? ['#94A3B8', '#64748B'] : ['#0D6EFD', '#2563EB']} // medical-500 to blue-600
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="w-full py-[14px] px-4 flex-row items-center justify-center"
      >
        <Text className="text-white font-bold text-sm tracking-wide">
          {title}
        </Text>
        {icon && <View className="ml-2">{icon}</View>}
      </LinearGradient>
    </Pressable>
  );
};
