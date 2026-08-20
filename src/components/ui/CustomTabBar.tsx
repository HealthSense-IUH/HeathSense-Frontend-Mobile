import { Dimensions, Platform, Alert } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Svg, { Path } from 'react-native-svg';
import { Plus } from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';

const { width } = Dimensions.get('window');

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const tabHeight = 70;
  
  // Cutout shape calculations
  const center = width / 2;
  const cw = 40; // half width of the cutout
  const cd = 35; // depth of the cutout
  
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
      {/* Background SVG - Explicitly setting fill to White (#FFFFFF) to prevent black default rendering */}
      <Box className="absolute top-0 left-0 right-0 bottom-0 shadow-sm" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 3 }}>
        <Svg width={width} height={tabHeight} viewBox={`0 0 ${width} ${tabHeight}`}>
          <Path d={path} fill="#FFFFFF" />
        </Svg>
      </Box>

      {/* FAB - Centered and pushed up */}
      <Box className="absolute w-full items-center justify-center pointer-events-none" style={{ top: -30, zIndex: 10 }}>
        <Pressable 
          className="bg-primary items-center justify-center shadow-md shadow-primary/30 pointer-events-auto active:opacity-80"
          style={{ width: 60, height: 60, borderRadius: 20 }} // Squircle shape
          onPress={() => Alert.alert('Tính năng mới', 'Hiển thị menu thêm mới')}
        >
          <Plus color="#FFFFFF" size={32} />
        </Pressable>
      </Box>

      {/* Tabs Layout */}
      <HStack className="flex-1 items-center justify-between px-6 z-0">
        {state.routes.slice(0, 2).map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const color = isFocused ? '#0F67FE' : '#9EA7B8';

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
        <Box style={{ width: 60 }} />

        {state.routes.slice(2, 4).map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          // Notice: state.index needs to map against the real index (index + 2)
          const realIndex = index + 2;
          const isFocused = state.index === realIndex;
          const color = isFocused ? '#0F67FE' : '#9EA7B8';

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
