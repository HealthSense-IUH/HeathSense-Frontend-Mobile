import React, { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { HeartPulse, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useBLE } from '@/context/BLEContext';
import { useBleStore } from '@/services/ble-management/bleStore';
import { LinearGradient } from 'expo-linear-gradient';

export function AFibScreeningCard() {
  const { stopExportAndUploadPpgRecording, sendCommand } = useBLE();
  const isRecordingPpg = useBleStore(state => state.isRecordingPpg);
  const recordingSampleCount = useBleStore(state => state.recordingSampleCount);
  const isExportingRecording = useBleStore(state => state.isExportingRecording);
  const recordingError = useBleStore(state => state.recordingError);
  const isAnalyzing = useBleStore(state => state.isAnalyzing);
  const aiAnalysisResult = useBleStore(state => state.aiAnalysisResult);
  const currentBPM = useBleStore(state => state.currentBPM);
  const currentSpO2 = useBleStore(state => state.currentSpO2);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);

  const handleManualUpload = async () => {
    if (!isRecordingPpg || isUploading || isExportingRecording || isAnalyzing) return;
    setIsUploading(true);
    setUploadStatusMsg("Đang đóng gói file CSV, tải lên S3 & gửi Backend...");

    try {
      const res = await stopExportAndUploadPpgRecording();
      if (res.record) {
        setUploadStatusMsg(`Tải lên S3 & confirm thành công! Record ID: ${res.record.id}`);
      } else {
        setUploadStatusMsg(`Đã xuất file CSV (${res.recording.fileName}), chờ xử lý.`);
      }
    } catch (err: any) {
      setUploadStatusMsg(err?.message || "Lỗi khi upload PPG.");
    } finally {
      setIsUploading(false);
    }
  };

  const router = useRouter();

  const handlePress = () => {
    // Luôn cho phép bấm vào card để mở màn hình chi tiết đo
    setTimeout(() => {
      router.push("/afib-measure" as any);
    }, 50);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      className="mb-6 shadow-sm"
      style={{ borderRadius: 24 }}
    >
      <LinearGradient
        colors={['#FF7E7E', '#D92D2D']} // Màu đỏ/hồng tươi cho Tầm soát AFib
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24 }}
        className="p-4 overflow-hidden"
      >
        {/* Top Section: Title & Icon */}
        <View className="flex-row justify-between items-start mb-6">
          <Text className="text-white font-bold text-lg">Đo Rung nhĩ Chủ động</Text>
          <View className="bg-white/20 p-3 rounded-full">
            <HeartPulse color="#FFFFFF" size={32} />
          </View>
        </View>

        {/* 1. Idle State (No active background tasks) */}
        {!isRecordingPpg && !isAnalyzing && !recordingError && !aiAnalysisResult && !uploadStatusMsg && (
          <>
            <Text className="text-white/95 text-sm leading-5 font-medium mb-3">
              Hệ thống tự động thu thập tín hiệu PPG ngầm mỗi 10 phút. Bấm vào đây để tiến hành đo lâm sàng ngay lập tức.
            </Text>
            <View className="bg-white/20 self-start px-4 py-2 rounded-full">
              <Text className="text-white font-bold text-xs">Bắt đầu đo</Text>
            </View>
          </>
        )}

        {/* 2. Recording Status */}
        {isRecordingPpg && (
          <View className="bg-white/20 rounded-2xl p-4">
            <View className="flex-row items-center mb-2">
              <View className="h-2.5 w-2.5 rounded-full bg-white animate-pulse mr-2" />
              <Text className="text-sm font-bold text-white">Đang thu thập tín hiệu...</Text>
            </View>
            <Text className="text-xs text-white/80 mb-3">
              Quá trình đo kéo dài khoảng 60s. Vui lòng giữ yên tay.
            </Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation(); // Ngăn chặn trigger handlePress của Card
                handleManualUpload();
              }}
              disabled={isUploading || isExportingRecording || isAnalyzing}
              className="bg-white py-2 px-4 rounded-xl flex-row items-center justify-center active:opacity-80"
            >
              {isUploading || isExportingRecording || isAnalyzing ? (
                <ActivityIndicator size="small" color="#D92D2D" className="mr-2" />
              ) : (
                <UploadCloud color="#D92D2D" size={16} className="mr-2" />
              )}
              <Text className="text-xs font-bold text-[#D92D2D]">
                {isUploading || isExportingRecording || isAnalyzing ? "Đang xử lý..." : "Xuất CSV & Gửi S3"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 3. Analyzing Status */}
        {isAnalyzing && (
          <View className="bg-white/20 rounded-2xl p-4 flex-row items-center">
            <ActivityIndicator size="small" color="#FFFFFF" className="mr-3" />
            <View className="flex-1">
              <Text className="text-sm font-bold text-white mb-1">AI đang phân tích...</Text>
              <Text className="text-xs text-white/80">Mô hình học máy đang xử lý tín hiệu PPG để phát hiện Rung nhĩ.</Text>
            </View>
          </View>
        )}

        {/* 4. AI Result */}
        {aiAnalysisResult && !isAnalyzing && (
          <View className="bg-white/20 rounded-2xl p-4 flex-row items-center">
            <CheckCircle2 color="#FFFFFF" size={24} className="mr-3" />
            <View className="flex-1">
              <Text className="text-sm font-bold text-white mb-1">
                Kết quả: {
                  aiAnalysisResult.predictionLabel === 'NORMAL' ? 'Bình thường' :
                    aiAnalysisResult.predictionLabel === 'AFIB' ? 'Rung nhĩ (AFib)' :
                      aiAnalysisResult.predictionLabel === 'AFIB_SUSPECTED' ? 'Nghi ngờ Rung nhĩ' :
                        'Không rõ ràng'
                }
              </Text>
              <Text className="text-xs text-white/80">
                Độ tin cậy: {Math.round((aiAnalysisResult.confidence ?? 0) * 100)}%
              </Text>
            </View>
          </View>
        )}

        {/* 5. Upload Message (If no AI Result) */}
        {uploadStatusMsg && !isAnalyzing && !aiAnalysisResult && (
          <View className="bg-white/20 rounded-2xl p-3.5 mt-2 flex-row items-center">
            <CheckCircle2 color="#FFFFFF" size={18} className="mr-2" />
            <Text className="text-xs font-medium text-white flex-1">{uploadStatusMsg}</Text>
          </View>
        )}

        {/* 6. Error State */}
        {recordingError && (
          <View className="bg-white/20 rounded-2xl p-3.5 mt-2">
            <View className="flex-row items-center mb-1">
              <AlertCircle color="#FFFFFF" size={18} className="mr-2" />
              <Text className="text-xs font-bold text-white flex-1">{recordingError}</Text>
            </View>
            {currentBPM > 0 && currentSpO2 > 0 && (
              <Text className="text-xs text-white/80 font-medium ml-6">
                Nhịp tim: {currentBPM} BPM | SpO2: {currentSpO2}%
              </Text>
            )}
          </View>
        )}

      </LinearGradient>
    </TouchableOpacity>
  );
}
