import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Activity, AlertCircle, HeartPulse, ShieldAlert, Heart } from 'lucide-react-native';
import { useBleStore } from '@/services/ble-management/bleStore';
import { useBLE } from '@/context/BLEContext';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';

export default function AFibMeasureScreen() {
  const router = useRouter();
  const { sendCommand, stopExportAndUploadPpgRecording } = useBLE();
  const store = useBleStore();
  
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [localUploadMsg, setLocalUploadMsg] = useState<string | null>(null);

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync with global state
  const isRecording = store.isRecordingPpg;
  const isAnalyzing = store.isAnalyzing;
  const result = store.aiAnalysisResult;
  const error = store.recordingError;
  const startedAt = store.recordingStartedAt;
  const isConnected = Boolean(store.connectedDeviceId);

  // Timer logic for measuring
  useEffect(() => {
    if (!isRecording || !startedAt) {
      return;
    }
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording, startedAt]);

  // Clean up countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const startMeasurement = async () => {
    try {
      await sendCommand("CMD:START_SCREENING");
    } catch (err) {
      console.warn("Lỗi gửi lệnh đo:", err);
    }
  };

  const startCountdown = () => {
    if (!isConnected) return;
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setLocalUploadMsg(null);
    setTimeLeft(60);
    store.setRecordingState({ aiAnalysisResult: null, recordingError: null });
    setCountdown(3);
    
    let counter = 3;
    countdownIntervalRef.current = setInterval(() => {
      counter -= 1;
      if (counter > 0) {
        setCountdown(counter);
      } else {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdown(null);
        void startMeasurement();
      }
    }, 1000);
  };

  const handleManualUpload = async () => {
    if (!isRecording) return;
    setLocalUploadMsg("Đang xử lý dữ liệu...");
    try {
      await stopExportAndUploadPpgRecording();
    } catch (err: any) {
      setLocalUploadMsg(err?.message || "Lỗi khi upload.");
    }
  };

  return (
    <ScreenWrapper
      title="Tầm soát Rung nhĩ"
      headerLeft={
        <Pressable 
          onPress={() => router.back()} 
          className="h-10 w-10 rounded-full bg-primary/10 items-center justify-center active:opacity-75"
        >
          <ArrowLeft color="#0F67FE" size={24} />
        </Pressable>
      }
    >
      <View className="px-6 flex-1 justify-between pb-8">
        {/* Top Info & Guide */}
        <View className="items-center mt-4">
          <Text className="text-sm font-semibold text-muted-foreground text-center px-4">
            Đảm bảo giữ yên cánh tay và dây đeo vừa vặn với cổ tay trong suốt 60 giây đo.
          </Text>

          {/* Large Visual Pulse Indicator */}
          <View className="my-10 items-center justify-center">
            {countdown !== null ? (
              <View className="h-44 w-44 rounded-full bg-primary/20 items-center justify-center border-4 border-primary animate-pulse">
                <Text className="text-6xl font-extrabold text-primary">{countdown}</Text>
              </View>
            ) : isRecording ? (
              <View className="relative items-center justify-center">
                <View className="h-48 w-48 rounded-full bg-destructive/10 items-center justify-center animate-ping" />
                <View className="absolute h-40 w-40 rounded-full bg-destructive/20 items-center justify-center border-4 border-destructive">
                  <HeartPulse color="#DA1E2E" size={64} />
                  <Text className="text-2xl font-extrabold text-destructive mt-2">{timeLeft}s</Text>
                </View>
              </View>
            ) : isAnalyzing ? (
              <View className="h-44 w-44 rounded-full bg-[#E6F4FE] items-center justify-center border-4 border-[#208AEF]">
                <ActivityIndicator size="large" color="#208AEF" />
                <Text className="text-sm font-bold text-[#00349C] mt-3">Đang phân tích...</Text>
              </View>
            ) : result ? (
              <View className={`h-44 w-44 rounded-full items-center justify-center border-4 ${
                result.predictionLabel === 'NORMAL' 
                  ? 'bg-green-500/10 border-green-500' 
                  : result.predictionLabel === 'AFIB'
                  ? 'bg-destructive/10 border-destructive'
                  : 'bg-orange-500/10 border-orange-500'
              }`}>
                {result.predictionLabel === 'NORMAL' ? (
                  <Heart color="#22c55e" size={56} />
                ) : (
                  <ShieldAlert color="#ef4444" size={56} />
                )}
                <Text className={`text-base font-bold mt-2 ${
                  result.predictionLabel === 'NORMAL' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {result.predictionLabel === 'NORMAL' ? 'Bình thường' : 'Rung nhĩ (AFib)'}
                </Text>
              </View>
            ) : (
              <View className="h-44 w-44 rounded-full bg-card border-4 border-dashed border-border items-center justify-center">
                <HeartPulse color="#94A3B8" size={56} />
                <Text className="text-xs font-semibold text-muted-foreground mt-2">Sẵn sàng đo</Text>
              </View>
            )}
          </View>

          {/* Status Message */}
          {error ? (
            <View className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex-row items-center mb-4">
              <AlertCircle color="#DA1E2E" size={20} className="mr-2" />
              <Text className="text-xs font-semibold text-destructive flex-1">{error}</Text>
            </View>
          ) : localUploadMsg ? (
            <Text className="text-xs text-muted-foreground text-center mb-4">{localUploadMsg}</Text>
          ) : isRecording ? (
            <Text className="text-sm font-bold text-destructive text-center mb-4">
              Đang thu thập dữ liệu PPG Pha 1... Vui lòng không di chuyển!
            </Text>
          ) : null}
        </View>

        {/* Action Buttons */}
        <View className="w-full">
          {isRecording ? (
            <Pressable
              onPress={handleManualUpload}
              className="w-full bg-destructive py-4 rounded-2xl items-center justify-center shadow-md active:opacity-90 mb-3"
            >
              <Text className="text-base font-bold text-white">Dừng & Phân tích ngay</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={startCountdown}
              disabled={!isConnected || countdown !== null || isAnalyzing}
              className={`w-full bg-primary py-4 rounded-2xl items-center justify-center shadow-md active:opacity-90 mb-3 ${
                !isConnected || countdown !== null || isAnalyzing ? 'opacity-50' : ''
              }`}
            >
              <View className="flex-row items-center">
                <Activity color="#FFFFFF" size={20} className="mr-2" />
                <Text className="text-base font-bold text-white">
                  {isAnalyzing ? "Đang xử lý kết quả..." : "Bắt đầu đo 60 giây"}
                </Text>
              </View>
            </Pressable>
          )}

          {!isConnected && (
            <Text className="text-xs text-center text-destructive font-semibold">
              Vui lòng kết nối đồng hồ BLE trong mục Cài đặt trước khi đo.
            </Text>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}
