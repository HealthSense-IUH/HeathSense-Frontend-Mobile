import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '@/constants/theme';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  colors?: readonly [string, string, ...string[]];
  accentColor?: string;
  unitTextColorClass?: string;
  unitBgColorClass?: string;
  titleColorClass?: string;
  unitBgColor?: string;
  subtitleColor?: string;
}

export const MetricCard = ({
  title,
  value,
  unit,
  icon,
  colors,
  accentColor = THEME.colors.primary,
  unitTextColorClass,
  unitBgColorClass,
  titleColorClass = 'text-slate-500',
  unitBgColor,
  subtitleColor,
}: MetricCardProps) => {
  // If gradient colors array is provided, render Stitch Gradient Card
  if (colors && colors.length >= 2) {
    return (
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          padding: 16,
          minHeight: 146,
          justifyContent: 'space-between',
          overflow: 'hidden',
          shadowColor: colors[0],
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.18,
          shadowRadius: 16,
          elevation: 4,
        }}
      >
        {/* Top Header: 36x36 rounded-xl bg-white/20 + Unit pill */}
        <View className="flex-row items-center justify-between mb-2">
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.22)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {React.isValidElement(icon)
              ? React.cloneElement(icon as React.ReactElement<any>, {
                  color: '#FFFFFF',
                  size: (icon as any).props.size || 18,
                  strokeWidth: (icon as any).props.strokeWidth || 2.2,
                })
              : icon}
          </View>

          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 6,
              backgroundColor: unitBgColor || 'rgba(0, 0, 0, 0.16)',
            }}
          >
            <Text
              style={{ color: '#FFFFFF' }}
              className="text-[11px] font-bold uppercase tracking-wider"
            >
              {unit}
            </Text>
          </View>
        </View>

        {/* Metric Numeral */}
        <View className="my-0.5">
          <Text
            className="text-[30px] font-extrabold tracking-tight text-white"
            style={{ fontVariant: ['tabular-nums'] }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {value}
          </Text>
        </View>

        {/* Metric Category Title */}
        <Text
          style={{ color: subtitleColor || 'rgba(255, 255, 255, 0.92)' }}
          className="text-xs font-medium"
          numberOfLines={1}
        >
          {title}
        </Text>
      </LinearGradient>
    );
  }

  // Fallback Surface Card
  const primaryAccent = colors?.[0] || accentColor;

  return (
    <View 
      className="bg-white rounded-2xl p-4 border border-slate-100/90 justify-between"
      style={{
        ...THEME.shadows.card,
        minHeight: 142,
      }}
    >
      {/* Top Header: 36x36 circular icon badge with 12% opacity + Unit pill */}
      <View className="flex-row items-center justify-between mb-2.5">
        <View 
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: `${primaryAccent}1F` }}
        >
          {React.isValidElement(icon)
            ? React.cloneElement(icon as React.ReactElement<any>, {
                color: (icon as any).props.color === '#FFFFFF' ? primaryAccent : (icon as any).props.color,
                size: (icon as any).props.size || 18,
              })
            : icon}
        </View>

        <View 
          className={`px-2.5 py-0.5 rounded-full ${unitBgColorClass || ''}`}
          style={!unitBgColorClass ? { backgroundColor: `${primaryAccent}14` } : undefined}
        >
          <Text 
            className={`text-[11px] font-bold uppercase tracking-wider ${unitTextColorClass || ''}`}
            style={!unitTextColorClass ? { color: primaryAccent } : undefined}
          >
            {unit}
          </Text>
        </View>
      </View>
      
      {/* Metric Numeral */}
      <View className="my-1">
        <Text 
          className="text-[28px] font-extrabold tracking-tight text-slate-900"
          style={{ fontVariant: ['tabular-nums'] }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>
      </View>
      
      {/* Metric Category Title */}
      <Text className={`text-xs font-semibold ${titleColorClass}`} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
};

