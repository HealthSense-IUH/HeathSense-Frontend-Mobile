import React, { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { HeartPulse, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useBLE } from '@/context/BLEContext';
import { useBleStore } from '@/services/ble-management/bleStore';

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

  const handleStartManualScreening = () => {
    // Navigate to the dedicated AFib measure screen
    router.push("/afib-measure" as any);
  };

  return (
    <View className="bg-card rounded-3xl p-5 shadow-sm border border-border mb-6">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className="h-10 w-10 rounded-full bg-destructive/10 items-center justify-center mr-3">
            <HeartPulse color="#DA1E2E" size={20} />
          </View>
          <View>
            <Text className="text-lg font-bold text-foreground">Tầm soát Rung nhĩ (AFib)</Text>
            <Text className="text-xs text-muted-foreground">Phân tích mô hình PPG lâm sàng</Text>
          </View>
        </View>
      </View>

      <Text className="text-sm text-muted-foreground mb-4 leading-5">
        Hệ thống tự động thu thập tín hiệu PPG ở Pha 1, xuất file CSV chuẩn và tải trực tiếp lên AWS S3 để AI xử lý.
      </Text>

      {/* Recording & Upload Status Banners */}
      {isRecordingPpg && (
        <View className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <View className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse mr-2" />
              <Text className="text-sm font-bold text-primary">
                Đang đo Rung nhĩ (Pha 1)
              </Text>
            </View>
          </View>
          <Text className="text-xs text-muted-foreground mb-3">
            Hệ thống đang thu thập tín hiệu. Quá trình đo kéo dài khoảng 60s.
          </Text>

          <TouchableOpacity
            onPress={handleManualUpload}
            disabled={isUploading || isExportingRecording || isAnalyzing}
            className="bg-primary py-2.5 px-4 rounded-xl flex-row items-center justify-center active:opacity-80"
          >
            {isUploading || isExportingRecording || isAnalyzing ? (
              <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />
            ) : (
              <UploadCloud color="#FFFFFF" size={16} className="mr-2" />
            )}
            <Text className="text-xs font-bold text-white">
              {isUploading || isExportingRecording || isAnalyzing ? "Đang xử lý..." : "Xuất CSV & Gửi S3 Ngay"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Analyzing Status Message */}
      {isAnalyzing && (
        <View className="bg-[#E6F4FE] border border-[#208AEF]/30 rounded-2xl p-4 mb-4 flex-row items-center">
          <ActivityIndicator size="small" color="#208AEF" className="mr-3" />
          <View className="flex-1">
            <Text className="text-sm font-bold text-[#00349C] mb-1">
              AI đang phân tích dữ liệu...
            </Text>
            <Text className="text-xs text-[#00349C]/80">
              Mô hình học máy đang xử lý tín hiệu PPG để phát hiện Rung nhĩ. Vui lòng đợi trong giây lát.
            </Text>
          </View>
        </View>
      )}

      {/* AI Analysis Result */}
      {aiAnalysisResult && !isAnalyzing && (
        <View className={`rounded-2xl p-4 mb-4 border flex-row items-center ${
          aiAnalysisResult.predictionLabel === 'NORMAL' 
            ? 'bg-status-normal/10 border-status-normal/30' 
            : aiAnalysisResult.predictionLabel === 'AFIB'
            ? 'bg-status-afib/10 border-status-afib/30'
            : aiAnalysisResult.predictionLabel === 'AFIB_SUSPECTED'
            ? 'bg-status-afib-suspected/10 border-status-afib-suspected/30'
            : 'bg-status-uncertain/10 border-status-uncertain/30'
        }`}>
          <CheckCircle2 
            color={
              aiAnalysisResult.predictionLabel === 'NORMAL' 
                ? '#6EC522' 
                : aiAnalysisResult.predictionLabel === 'AFIB'
                ? '#DA1E2E'
                : aiAnalysisResult.predictionLabel === 'AFIB_SUSPECTED'
                ? '#D97706'
                : '#9EA7B8'
            } 
            size={24} 
            className="mr-3" 
          />
          <View className="flex-1">
            <Text className={`text-sm font-bold mb-1 ${
              aiAnalysisResult.predictionLabel === 'NORMAL' 
                ? 'text-status-normal' 
                : aiAnalysisResult.predictionLabel === 'AFIB'
                ? 'text-status-afib'
                : aiAnalysisResult.predictionLabel === 'AFIB_SUSPECTED'
                ? 'text-status-afib-suspected'
                : 'text-status-uncertain'
            }`}>
              Phân tích hoàn tất: {
                aiAnalysisResult.predictionLabel === 'NORMAL' ? 'Bình thường' : 
                aiAnalysisResult.predictionLabel === 'AFIB' ? 'Rung nhĩ (AFib)' : 
                aiAnalysisResult.predictionLabel === 'AFIB_SUSPECTED' ? 'Nghi ngờ Rung nhĩ' : 
                'Không rõ ràng'
              }
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              Độ tin cậy: {Math.round((aiAnalysisResult.confidence ?? 0) * 100)}%
            </Text>
          </View>
        </View>
      )}

      {/* Upload Status Message */}
      {uploadStatusMsg && !isAnalyzing && !aiAnalysisResult && (
        <View className="bg-secondary/40 border border-secondary/60 rounded-2xl p-3.5 mb-4 flex-row items-center">
          <CheckCircle2 color="#00349C" size={18} className="mr-2" />
          <Text className="text-xs font-semibold text-foreground flex-1">
            {uploadStatusMsg}
          </Text>
        </View>
      )}

      {/* Recording Error */}
      {recordingError && (
        <View className="bg-destructive/10 border border-destructive/20 rounded-2xl p-3.5 mb-4">
          <View className="flex-row items-center mb-2">
            <AlertCircle color="#DA1E2E" size={18} className="mr-2" />
            <Text className="text-xs font-semibold text-destructive flex-1">
              {recordingError}
            </Text>
          </View>
          {currentBPM > 0 && currentSpO2 > 0 && (
            <Text className="text-xs text-destructive/80 font-medium ml-6">
              Đã vớt vát nhịp tim: {currentBPM} BPM | SpO2: {currentSpO2}%
            </Text>
          )}
          <TouchableOpacity
            onPress={handleStartManualScreening}
            className="mt-3 bg-destructive py-2 rounded-xl items-center"
          >
            <Text className="text-xs font-bold text-white">Đo lại ngay</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Action Area (Always visible when not recording/analyzing/error) */}
      {!isRecordingPpg && !isAnalyzing && !isUploading && !recordingError && (
        <View className="bg-accent/10 border border-accent/20 rounded-2xl p-4">
          <View className="flex-row items-center mb-3">
            <View className="h-2.5 w-2.5 rounded-full bg-accent mr-2.5" />
            <Text className="text-xs font-semibold text-foreground">
              Thiết bị đang đo Rung nhĩ tự động ngầm mỗi 10 phút.
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleStartManualScreening}
            className="bg-accent py-3 rounded-xl items-center shadow-sm"
          >
            <Text className="text-sm font-bold text-primary-foreground">Đo Rung nhĩ Chủ động</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
