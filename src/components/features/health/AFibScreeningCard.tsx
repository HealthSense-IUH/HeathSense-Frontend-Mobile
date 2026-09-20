import { Text, Pressable, View } from 'react-native';
import { HeartPulse, CheckCircle2, AlertCircle, Play, ArrowRight } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useBleStore } from '@/services/ble-management/bleStore';
import { LinearGradient } from 'expo-linear-gradient';

export function AFibScreeningCard() {
  const router = useRouter();
  const aiAnalysisResult = useBleStore(state => state.aiAnalysisResult);

  const handlePress = () => {
    setTimeout(() => {
      router.push("/afib-measure" as any);
    }, 50);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="mb-6"
      style={({ pressed }) => [
        {
          borderRadius: 24,
          shadowColor: 'rgba(217, 44, 68, 0.28)',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 1,
          shadowRadius: 20,
          elevation: 5,
        },
        pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] }
      ]}
    >
      <LinearGradient
        colors={['#FF5757', '#F24452', '#D92C44']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.25)' }}
        className="p-5 relative overflow-hidden"
      >
        {/* Background ECG Waveform Accent Decoration (Stitch Specs) */}
        <Svg
          style={{ position: 'absolute', right: -18, bottom: -18, opacity: 0.12 }}
          width={175}
          height={175}
          viewBox="0 0 100 100"
        >
          <Path
            d="M0 50 L20 50 L30 10 L45 90 L60 40 L70 60 L80 50 L100 50"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={8}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>

        {/* Top Section: Title, Clinical Tag & Pulse Icon Badge */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 pr-3">
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.22)',
                paddingHorizontal: 8,
                paddingVertical: 2.5,
                borderRadius: 9999,
                alignSelf: 'flex-start',
                marginBottom: 6,
              }}
            >
              <Text className="text-[10px] font-bold text-white uppercase tracking-wider">
                Chẩn đoán lâm sàng 60s
              </Text>
            </View>
            <Text className="text-xl font-extrabold text-white tracking-tight leading-snug">
              Đo Rung nhĩ Chủ động
            </Text>
          </View>

          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.35)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HeartPulse color="#FFFFFF" size={26} strokeWidth={2.2} />
          </View>
        </View>

        {/* Middle Section: Last result summary or descriptive prompt */}
        {aiAnalysisResult ? (
          <View className="bg-white/20 rounded-2xl p-3.5 mb-4 backdrop-blur-sm border border-white/20">
            <View className="flex-row items-center mb-1">
              {aiAnalysisResult.predictionLabel === 'NORMAL' ? (
                <CheckCircle2 color="#FFFFFF" size={17} className="mr-2" />
              ) : (
                <AlertCircle color="#FFFFFF" size={17} className="mr-2" />
              )}
              <Text className="text-sm font-bold text-white flex-1">
                Lần đo gần nhất: {
                  aiAnalysisResult.predictionLabel === 'NORMAL' ? 'Nhịp xoang bình thường' :
                    aiAnalysisResult.predictionLabel === 'AFIB' ? 'Cảnh báo: Rung nhĩ (AFib)' :
                      aiAnalysisResult.predictionLabel === 'AFIB_SUSPECTED' ? 'Nghi ngờ Rung nhĩ' :
                        'Không xác định'
                }
              </Text>
            </View>
            <Text className="text-xs text-white/85 pl-6">
              Độ tin cậy: {Math.round((aiAnalysisResult.confidence ?? 0) * 100)}% • Chạm để đo lại
            </Text>
          </View>
        ) : (
          <Text className="text-white/90 text-xs sm:text-[13px] leading-relaxed font-normal mb-4 pr-1">
            Chủ động ghi nhận tín hiệu quang học PPG 100Hz và phân tích AI để phát hiện sớm các dấu hiệu rung nhĩ và bất thường nhịp tim.
          </Text>
        )}

        {/* Bottom Section: Prominent Active CTA Button */}
        <View className="flex-row items-center justify-between pt-1">
          <View className="flex-row items-center justify-center px-4 py-2.5 rounded-xl bg-white shadow-md">
            <Play color="#D92C44" size={13} fill="#D92C44" className="mr-2" />
            <Text className="text-[#D92C44] font-bold text-xs tracking-wide">
              {aiAnalysisResult ? "Thực hiện đo lại" : "Bắt đầu đo ngay"}
            </Text>
          </View>

          <View className="flex-row items-center pr-1 opacity-90">
            <Text className="text-white/90 text-[11px] font-semibold mr-1">Quy trình 60s</Text>
            <ArrowRight color="#FFFFFF" size={14} strokeWidth={2.4} />
          </View>
        </View>

      </LinearGradient>
    </Pressable>
  );
}