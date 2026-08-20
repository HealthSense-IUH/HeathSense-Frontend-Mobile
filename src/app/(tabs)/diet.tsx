import React from 'react';
import { View, Text } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';

export default function DietScreen() {
  return (
    <ScreenWrapper title="Dinh dưỡng" description="Đang phát triển...">
      <View className="flex-1 items-center justify-center mt-20">
        <Text className="text-muted-foreground">Tính năng sắp ra mắt</Text>
      </View>
    </ScreenWrapper>
  );
}
