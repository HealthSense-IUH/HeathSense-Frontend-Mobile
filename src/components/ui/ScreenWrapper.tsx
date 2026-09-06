import React, { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ScreenWrapperProps {
  children: ReactNode;
  className?: string;
  withKeyboardHandling?: boolean;
  withBottomNav?: boolean;
}

export const ScreenWrapper = ({
  children,
  className = '',
  withKeyboardHandling = false,
  withBottomNav = false,
}: ScreenWrapperProps) => {
  const content = (
    <View className={`flex-1 ${className}`}>
      {/* Background Gradient matching the new Medical Design System */}
      <LinearGradient
        colors={['#F0F6FF', '#F8FAFC', '#F1F5F9']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <SafeAreaView className="flex-1">
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        {children}
        {/* Padding for bottom nav if needed */}
        {withBottomNav && <View className="h-[90px]" />}
      </SafeAreaView>
    </View>
  );

  if (withKeyboardHandling) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return content;
};
