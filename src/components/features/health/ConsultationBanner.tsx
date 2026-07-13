import { View, Text, TouchableOpacity } from 'react-native';
import { Stethoscope, ChevronRight } from 'lucide-react-native';

export function ConsultationBanner() {
  return (
    <TouchableOpacity className="bg-primary rounded-2xl p-5 flex-row items-center justify-between shadow-sm mb-10">
      <View className="flex-row items-center">
        <View className="h-10 w-10 rounded-full bg-therapeia-40 items-center justify-center mr-4">
          <Stethoscope color="#FFFFFF" size={20} />
        </View>
        <View>
          <Text className="text-base font-bold text-primary-foreground">Tư vấn chuyên gia</Text>
          <Text className="text-xs text-therapeia-20 mt-1">Kết nối bác sĩ từ xa ngay bây giờ</Text>
        </View>
      </View>
      <ChevronRight color="#FFFFFF" size={20} />
    </TouchableOpacity>
  );
}
