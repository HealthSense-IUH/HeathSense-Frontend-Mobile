import { Text, View } from 'react-native';

export default function Index() {
  return (
    <View className="flex-1 bg-background px-6 py-16">
      <View className="rounded-3xl bg-card p-6 shadow-sm">
        <Text className="text-sm font-semibold text-primary">HeathSence</Text>
        <Text className="mt-3 text-3xl font-bold text-foreground">
          Chao mung tro lai
        </Text>
        <Text className="mt-2 text-base text-muted-foreground">
          Theo doi suc khoe, lich hen va chi so moi ngay trong mot trai nghiem sach gon.
        </Text>

        <View className="mt-6 rounded-2xl bg-secondary p-4">
          <Text className="text-sm text-muted-foreground">Muc tieu hom nay</Text>
          <Text className="mt-1 text-2xl font-bold text-secondary-foreground">
            7,200 buoc
          </Text>
        </View>

        <View className="mt-4 rounded-2xl bg-accent p-4">
          <Text className="text-sm font-semibold text-accent-foreground">
            Nhip tim on dinh
          </Text>
        </View>
      </View>
    </View>
  );
}
