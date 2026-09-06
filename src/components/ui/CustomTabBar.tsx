import { Dimensions, Platform, Alert } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Svg, { Path } from 'react-native-svg';
import { Plus } from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { THEME } from '@/constants/theme';

const { width } = Dimensions.get('window');

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const tabHeight = THEME.layout.dockHeight;
  
  // Cutout shape calculations
  const center = width / 2;
  const cw = 38; // half width of the cutout
  const cd = 32; // depth of the cutout
  
  const path = `
    M 0 0
    L ${center - cw - 25} 0
    C ${center - cw} 0, ${center - cw} ${cd}, ${center} ${cd}
    C ${center + cw} ${cd}, ${center + cw} 0, ${center + cw + 25} 0
    L ${width} 0
    L ${width} ${tabHeight}
    L 0 ${tabHeight}
    Z
  `;

  return (
    <HStack className="absolute bottom-0 w-full" style={{ height: tabHeight, paddingBottom: Platform.OS === 'ios' ? 20 : 0 }}>
      {/* Background SVG - Explicitly setting fill to White (#FFFFFF) with ambient shadow */}
      <Box className="absolute top-0 left-0 right-0 bottom-0 shadow-sm" style={{ boxShadow: '0 -2px 10px rgba(15, 23, 42, 0.05)' }}>
        <Svg width={width} height={tabHeight} viewBox={`0 0 ${width} ${tabHeight}`}>
          <Path d={path} fill={THEME.colors.card} />
        </Svg>
      </Box>

      {/* FAB - Centered and elevated: 56x56px circular as specified in DESIGN.md */}
      <Box className="absolute w-full items-center justify-center pointer-events-none" style={{ top: -28, zIndex: 10 }}>
        <Pressable 
          className="items-center justify-center pointer-events-auto active:opacity-80"
          style={{ 
            width: THEME.layout.fabSize, 
            height: THEME.layout.fabSize, 
            borderRadius: 28,
            backgroundColor: THEME.colors.primary,
            ...THEME.shadows.fab,
          }}
          onPress={() => Alert.alert('HealthSense', 'Chọn thao tác nhanh hoặc đo lâm sàng')}
        >
          <Plus color="#FFFFFF" size={28} />
        </Pressable>
      </Box>

      {/* Tabs Layout */}
      <HStack className="flex-1 items-center justify-between px-6 z-0">
        {state.routes.slice(0, 2).map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const color = isFocused ? THEME.colors.primary : THEME.colors.textMuted;

          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              className="items-center justify-center p-2 active:opacity-70"
            >
              {options.tabBarIcon ? options.tabBarIcon({ color, size: 24, focused: isFocused }) : null}
            </Pressable>
          );
        })}

        {/* Spacer for FAB */}
        <Box style={{ width: THEME.layout.fabSize }} />

        {state.routes.slice(2, 4).map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const realIndex = index + 2;
          const isFocused = state.index === realIndex;
          const color = isFocused ? THEME.colors.primary : THEME.colors.textMuted;

          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              className="items-center justify-center p-2 active:opacity-70"
            >
              {options.tabBarIcon ? options.tabBarIcon({ color, size: 24, focused: isFocused }) : null}
            </Pressable>
          );
        })}
      </HStack>
    </HStack>
  );
}
