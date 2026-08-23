import React, { useState } from 'react';
import { ActivityIndicator, Text, Pressable, View } from 'react-native';
import { HeartPulse, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useBLE } from '@/context/BLEContext';

export function AFibScreeningCard() {
  const {
    isRecordingPpg,
    recordingSampleCount,
    isExportingRecording,
    stopExportAndUploadPpgRecording,
    recordingError,
    isAnalyzing,
    aiAnalysisResult,
  } = useBLE();

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
                Đang đo Pha 1: {recordingSampleCount} mẫu PPG
              </Text>
            </View>
          </View>
          <Text className="text-xs text-muted-foreground mb-3">
            Hệ thống sẽ tự động xuất file CSV & upload S3 khi kết thúc Pha 1 (60s).
          </Text>

          <Pressable
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
          </Pressable>
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
            ? 'bg-green-500/10 border-green-500/30' 
            : aiAnalysisResult.predictionLabel === 'AFIB'
            ? 'bg-destructive/10 border-destructive/30'
            : 'bg-orange-500/10 border-orange-500/30'
        }`}>
          <CheckCircle2 
            color={
              aiAnalysisResult.predictionLabel === 'NORMAL' 
                ? '#22c55e' 
                : aiAnalysisResult.predictionLabel === 'AFIB'
                ? '#ef4444'
                : '#f97316'
            } 
            size={24} 
            className="mr-3" 
          />
          <View className="flex-1">
            <Text className={`text-sm font-bold mb-1 ${
              aiAnalysisResult.predictionLabel === 'NORMAL' 
                ? 'text-green-600' 
                : aiAnalysisResult.predictionLabel === 'AFIB'
                ? 'text-red-600'
                : 'text-orange-600'
            }`}>
              Phân tích hoàn tất: {aiAnalysisResult.predictionLabel === 'NORMAL' ? 'Bình thường' : aiAnalysisResult.predictionLabel === 'AFIB' ? 'Rung nhĩ (AFib)' : 'Không xác định'}
            </Text>
            <Text className="text-xs text-muted-foreground">
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
        <View className="bg-destructive/10 border border-destructive/20 rounded-2xl p-3.5 mb-4 flex-row items-center">
          <AlertCircle color="#DA1E2E" size={18} className="mr-2" />
          <Text className="text-xs font-semibold text-destructive flex-1">
            {recordingError}
          </Text>
        </View>
      )}

      {/* Normal Status Badge */}
      {!isRecordingPpg && !uploadStatusMsg && !isAnalyzing && !aiAnalysisResult && !recordingError && (
        <View className="bg-accent/10 border border-accent/20 rounded-2xl p-4 flex-row items-center">
          <View className="h-2.5 w-2.5 rounded-full bg-accent mr-2.5" />
          <Text className="text-xs font-semibold text-foreground">
            Sẵn sàng nhận tín hiệu PPG Pha 1 từ thiết bị BLE
          </Text>
        </View>
      )}
    </View>
  );
}
