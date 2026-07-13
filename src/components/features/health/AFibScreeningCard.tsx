import { View, Text, TouchableOpacity } from 'react-native';
import { HeartPulse, ChevronRight } from 'lucide-react-native';

export function AFibScreeningCard() {
  return (
    <View className="bg-card rounded-3xl p-5 shadow-sm border border-asklepios-20 mb-6">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className="h-10 w-10 rounded-full bg-hygieia-10 items-center justify-center mr-3">
            <HeartPulse color="#DA1E2E" size={20} />
          </View>
          <Text className="text-lg font-bold text-foreground">Tầm soát Rung nhĩ</Text>
        </View>
        <TouchableOpacity>
          <ChevronRight color="#9EA7B8" size={24} />
        </TouchableOpacity>
      </View>
      
      <Text className="text-sm text-muted-foreground mb-4 leading-5">
        Dựa trên mô hình Random Forest phân tích dữ liệu PPG lâm sàng, nhịp tim của bạn hiện tại đang ở mức bình thường.
      </Text>
      
      <View className="bg-zoi-10 rounded-2xl p-4 flex-row items-center">
        <View className="h-2 w-2 rounded-full bg-zoi-50 mr-2" />
        <Text className="text-zoi-80 font-medium">Không phát hiện dấu hiệu bất thường</Text>
      </View>
    </View>
  );
}
