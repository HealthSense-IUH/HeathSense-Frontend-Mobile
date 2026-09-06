import React, { useState } from 'react';
import {
  View,
  Text,
  Animated,
  StyleProp,
  ViewStyle,
  RefreshControlProps,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { THEME } from '@/constants/theme';

export interface ScreenWrapperProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  stickyHeader?: React.ReactNode;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  stickyHeaderHeight?: number;
  statusBarStyle?: 'light' | 'dark' | 'auto';
  backgroundComponent?: React.ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  className?: string;
  withKeyboardHandling?: boolean;
  withBottomNav?: boolean;
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
  refreshControl,
  className = '',
  withKeyboardHandling = false,
  withBottomNav = false,
}: ScreenWrapperProps) {
  const [fadeAnim] = useState(() => new Animated.Value(1));
  const [scrollY] = useState(() => new Animated.Value(0));
  const insets = useSafeAreaInsets();

  // If no title provided (e.g. Auth, Simple Screen), render clean safe-area container
  if (!title) {
    const staticContent = (
      <View style={{ flex: 1, backgroundColor: THEME.colors.canvas }} className={className}>
        <StatusBar style={statusBarStyle} animated />
        {backgroundComponent && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}>
            {backgroundComponent}
          </View>
        )}
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
          {children}
          {withBottomNav && <View style={{ height: THEME.layout.dockHeight }} />}
        </SafeAreaView>
      </View>
    );

    if (withKeyboardHandling) {
      return (
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: THEME.colors.canvas }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {staticContent}
        </KeyboardAvoidingView>
      );
    }

    return staticContent;
  }

  // Dynamic heights based on device safe area for Header Title screen
  const TITLE_PT = insets.top + 12;
  const TITLE_PB = 16;
  const HEADER_BASE_HEIGHT = TITLE_PT + 40 + TITLE_PB;
  const CLAMP_Y = Math.max(0, HEADER_BASE_HEIGHT - insets.top);

  const tabsTranslateY = scrollY.interpolate({
    inputRange: [0, CLAMP_Y],
    outputRange: [0, -CLAMP_Y],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, CLAMP_Y * 0.8],
    outputRange: [1, 0],
    extrapolate: 'clamp',
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

  const scrollableContent = (
    <View style={{ flex: 1, backgroundColor: THEME.colors.canvas }} className={className}>
      <StatusBar style={statusBarStyle} animated />

      {/* Dynamic Background Layer */}
      {backgroundComponent && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}>
          {backgroundComponent}
        </View>
      )}

      {/* Floating Header Left Action */}
      {headerLeft && (
        <Animated.View
          style={{ opacity: fadeAnim, zIndex: 100, top: TITLE_PT }}
          className="absolute left-5"
        >
          {headerLeft}
        </Animated.View>
      )}

      {/* Floating Header Right Action */}
      {headerRight && (
        <Animated.View
          style={{ opacity: fadeAnim, zIndex: 100, top: TITLE_PT }}
          className="absolute right-5"
        >
          {headerRight}
        </Animated.View>
      )}

      {/* Fixed Title with Fade-out animation */}
      <Animated.View className="absolute left-0 right-0 z-40" style={{ top: 0, opacity: titleOpacity }}>
        <View className="px-5 flex-row justify-between items-center" style={{ paddingTop: TITLE_PT, paddingBottom: TITLE_PB }}>
          <View className="flex-row items-center">
            {headerLeft && <View className="w-12" />}
            <View>
              <Text className="text-[26px] font-extrabold text-foreground tracking-tight">{title}</Text>
              {description && <Text className="text-xs text-muted-foreground mt-0.5">{description}</Text>}
            </View>
          </View>
          <View className="h-10 w-10" />
        </View>
      </Animated.View>

      {/* Sticky Header / Tabs */}
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

      {/* Main Scrollable Content */}
      <View style={{ flex: 1, marginTop: insets.top, overflow: 'hidden' }}>
        <Animated.ScrollView
          contentContainerStyle={[
            { flexGrow: 1, paddingBottom: withBottomNav ? 120 : 60 },
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
          refreshControl={refreshControl}
        >
          {children}
        </Animated.ScrollView>
      </View>
    </View>
  );

  if (withKeyboardHandling) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: THEME.colors.canvas }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {scrollableContent}
      </KeyboardAvoidingView>
    );
  }

  return scrollableContent;
}
