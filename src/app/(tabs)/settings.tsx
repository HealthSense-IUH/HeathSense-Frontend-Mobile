import { View, Text } from 'react-native';

export default function SettingsScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-xl font-bold text-foreground">Cài đặt</Text>
      <Text className="text-sm text-muted-foreground mt-2">Màn hình đang phát triển...</Text>
    </View>
  );
}
