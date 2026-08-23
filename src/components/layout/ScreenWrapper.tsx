import React, { useState } from 'react';
import { View, Text, Animated, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

interface ScreenWrapperProps {
  title: string;
  description?: string; // Text below the title
  children: React.ReactNode;
  stickyHeader?: React.ReactNode;
  headerLeft?: React.ReactNode; // Custom component for the top-left corner
  headerRight?: React.ReactNode; // Custom component for the top-right corner
  contentContainerStyle?: StyleProp<ViewStyle>;
  stickyHeaderHeight?: number; // Pre-calculated height for scroll offset
  
  // Customization props for Background & Status Bar
  statusBarStyle?: 'light' | 'dark' | 'auto';
  backgroundComponent?: React.ReactNode;
}

export function ScreenWrapper({
  title,
  description,
  children,
  stickyHeader,
  headerLeft,
  headerRight,
  contentContainerStyle,
  stickyHeaderHeight = 110,
  statusBarStyle = 'dark',
  backgroundComponent,
}: ScreenWrapperProps) {
  const [fadeAnim] = useState(() => new Animated.Value(1));
  const [scrollY] = useState(() => new Animated.Value(0));
  const insets = useSafeAreaInsets();

  // Dynamic heights based on device safe area
  const TITLE_PT = insets.top + 12; // 12px padding below status bar
  const TITLE_PB = 16;
  const HEADER_BASE_HEIGHT = TITLE_PT + 40 + TITLE_PB; // ~40px for text height
  const CLAMP_Y = Math.max(0, HEADER_BASE_HEIGHT - insets.top);

  // Translate the Tabs UP as the user scrolls
  const tabsTranslateY = scrollY.interpolate({
    inputRange: [0, CLAMP_Y],
    outputRange: [0, -CLAMP_Y],
    extrapolate: 'clamp'
  });

  // Fade out the Title as the user scrolls (Samsung Health effect)
  const titleOpacity = scrollY.interpolate({
    inputRange: [0, CLAMP_Y * 0.8],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  const handleScrollBeginDrag = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handleScrollEnd = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <StatusBar style={statusBarStyle} animated translucent backgroundColor="transparent" />
      
      {/* Dynamic Background Layer (Rendered below everything) */}
      {backgroundComponent && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}>
          {backgroundComponent}
        </View>
      )}

      {/* Floating Header Left Action */}
      {headerLeft && (
        <Animated.View
          style={{ opacity: fadeAnim, zIndex: 100, top: TITLE_PT }}
          className="absolute left-6"
        >
          {headerLeft}
        </Animated.View>
      )}

      {/* Floating Header Right Action */}
      {headerRight && (
        <Animated.View
          style={{ opacity: fadeAnim, zIndex: 100, top: TITLE_PT }}
          className="absolute right-6"
        >
          {headerRight}
        </Animated.View>
      )}

      {/* Title is ALWAYS FIXED, and FADES OUT (opacity) without moving */}
      <Animated.View className="absolute left-0 right-0 z-40" style={{ top: 0, opacity: titleOpacity }}>
        <View className="px-6 flex-row justify-between items-center" style={{ paddingTop: TITLE_PT, paddingBottom: TITLE_PB }}>
          <View className="flex-row items-center">
            {/* If headerLeft exists, it is absolute. We need a spacer so the Title doesn't overlap it */}
            {headerLeft && <View className="w-14" />}
            <View>
              <Text className="text-[26px] font-extrabold text-foreground tracking-tight">{title}</Text>
              {description && <Text className="text-xs text-muted-foreground mt-1">{description}</Text>}
            </View>
          </View>
          {/* Spacer for headerRight */}
          <View className="h-10 w-10" />
        </View>
      </Animated.View>

      {/* Sticky Tabs (if provided) slide UP into the space left by the fading Title */}
      {stickyHeader && (
        <Animated.View
          className="absolute left-0 right-0 z-50"
          style={{
            top: HEADER_BASE_HEIGHT,
            transform: [{ translateY: tabsTranslateY }],
          }}
        >
          <View className="pb-2">
            {stickyHeader}
          </View>
        </Animated.View>
      )}

      {/* Main Scrollable Content clipped EXACTLY below the notch */}
      <View style={{ flex: 1, marginTop: insets.top, overflow: 'hidden' }}>
        <Animated.ScrollView
          contentContainerStyle={[
            { flexGrow: 1, paddingBottom: 120 },
            { paddingTop: stickyHeader ? (HEADER_BASE_HEIGHT + stickyHeaderHeight - insets.top) : (HEADER_BASE_HEIGHT - insets.top) },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEnd}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
        >
          {children}
        </Animated.ScrollView>
      </View>
    </View>
  );
}
