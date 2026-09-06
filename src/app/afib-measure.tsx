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
      <View className="px-6 flex-1 justify-between pb-8 pt-4">
        {/* Instructional Guidance */}
        <View className="items-center mt-2">
          <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100/70 border border-blue-200/70 mb-3">
            <View className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
            <Text className="text-brand-700 text-xs font-semibold">Quy trình chuẩn y khoa AFib 60s</Text>
          </View>
          <Text className="text-[14px] leading-relaxed text-slate-600 font-medium max-w-[310px] text-center">
            Đảm bảo giữ yên cánh tay và dây đeo vừa vặn với cổ tay trong suốt <Text className="font-bold text-slate-800">60 giây đo</Text>.
          </Text>
        </View>

        {/* Pulse Radar Sensor */}
        <View className="flex-1 items-center justify-center my-6">
          {countdown !== null ? (
            <View className="h-44 w-44 rounded-full bg-medical-100 items-center justify-center border-[6px] border-medical-500 shadow-xl shadow-medical-500/20 animate-pulse">
              <Text className="text-6xl font-extrabold text-medical-600">{countdown}</Text>
            </View>
          ) : isRecording ? (
            <View className="relative items-center justify-center w-64 h-64">
              <View className="absolute inset-0 rounded-full border border-blue-300/40 animate-ping" style={{ animationDuration: '3s' }} />
              <View className="absolute inset-4 rounded-full border border-blue-400/20 animate-pulse" />
              <View className="relative z-10 w-48 h-48 rounded-full bg-white shadow-xl shadow-blue-500/10 border border-blue-50 flex items-center justify-center">
                <HeartPulse color="#DA1E2E" size={64} className="mb-2" />
                <Text className="text-3xl font-extrabold text-rose-600">{timeLeft}s</Text>
                <Text className="text-[11px] font-bold text-rose-500 uppercase tracking-wider mt-1">Đang thu thập</Text>
              </View>
            </View>
          ) : isAnalyzing ? (
            <View className="h-44 w-44 rounded-full bg-[#E6F4FE] items-center justify-center border-4 border-[#208AEF]">
              <ActivityIndicator size="large" color="#208AEF" />
              <Text className="text-sm font-bold text-[#00349C] mt-3">Đang phân tích...</Text>
            </View>
          ) : result ? (
            <View className={`h-48 w-48 rounded-full items-center justify-center border-4 shadow-xl ${
              result.predictionLabel === 'NORMAL' 
                ? 'bg-emerald-50 border-emerald-500 shadow-emerald-500/20' 
                : result.predictionLabel === 'AFIB'
                ? 'bg-rose-50 border-rose-500 shadow-rose-500/20'
                : 'bg-amber-50 border-amber-500 shadow-amber-500/20'
            }`}>
              {result.predictionLabel === 'NORMAL' ? (
                <Heart color="#10B981" size={64} />
              ) : (
                <ShieldAlert color="#E11D48" size={64} />
              )}
              <Text className={`text-lg font-bold mt-3 ${
                result.predictionLabel === 'NORMAL' ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {result.predictionLabel === 'NORMAL' ? 'Bình thường' : 'Rung nhĩ (AFib)'}
              </Text>
            </View>
          ) : (
            <View className="relative items-center justify-center w-64 h-64">
              <View className="absolute inset-4 rounded-full border-2 border-blue-100/80 bg-white/50 shadow-sm" />
              <View className="relative z-10 w-44 h-44 rounded-full bg-white shadow-xl shadow-blue-500/10 border border-blue-50 flex items-center justify-center p-4">
                <View className="w-16 h-16 rounded-full bg-blue-50/50 flex items-center justify-center mb-2">
                  <HeartPulse color="#0D6EFD" size={40} />
                </View>
                <Text className="text-[14px] font-bold text-[#1E3A8A] tracking-tight">Sẵn sàng đo</Text>
                <Text className="text-[11px] font-medium text-slate-400 mt-0.5">Cảm biến PPG sạch</Text>
              </View>
            </View>
          )}

          {/* Error & Upload Status */}
          <View className="mt-6 w-full px-4">
            {error ? (
              <View className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex-row items-center">
                <AlertCircle color="#E11D48" size={20} className="mr-2" />
                <Text className="text-xs font-semibold text-rose-700 flex-1">{error}</Text>
              </View>
            ) : localUploadMsg ? (
              <Text className="text-xs text-slate-500 font-medium text-center">{localUploadMsg}</Text>
            ) : null}
          </View>
        </View>

        {/* Clinical Guidelines / Bottom Action Section */}
        <View className="w-full">
          {/* Clinical Guidelines Card */}
          {!isRecording && countdown === null && !isAnalyzing && !result && (
            <View className="bg-white/80 rounded-2xl p-3.5 border border-white shadow-sm flex-row items-center justify-between mb-4">
              <View className="flex-row items-center space-x-2">
                <View className="w-7 h-7 rounded-xl bg-blue-100/90 items-center justify-center">
                  <Text className="text-brand-700 text-xs font-bold">1</Text>
                </View>
                <Text className="text-xs font-semibold text-slate-700">Ngồi yên tĩnh</Text>
              </View>
              <View className="w-px h-6 bg-slate-200" />
              <View className="flex-row items-center space-x-2">
                <View className="w-7 h-7 rounded-xl bg-blue-100/90 items-center justify-center">
                  <Text className="text-brand-700 text-xs font-bold">2</Text>
                </View>
                <Text className="text-xs font-semibold text-slate-700">Tay ngang tim</Text>
              </View>
              <View className="w-px h-6 bg-slate-200" />
              <View className="flex-row items-center space-x-2">
                <View className="w-7 h-7 rounded-xl bg-blue-100/90 items-center justify-center">
                  <Text className="text-brand-700 text-xs font-bold">3</Text>
                </View>
                <Text className="text-xs font-semibold text-slate-700">Không nói</Text>
              </View>
            </View>
          )}

        {/* Action Buttons */}
        <View className="w-full">
          {isRecording ? (
            <Pressable
              onPress={handleManualUpload}
              className="w-full bg-rose-500 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-rose-500/30 active:opacity-80 mb-3"
            >
              <Text className="text-base font-bold text-white">Dừng & Phân tích ngay</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={startCountdown}
              disabled={!isConnected || countdown !== null || isAnalyzing}
              className={`w-full bg-medical-500 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-medical-500/30 active:opacity-80 mb-3 ${
                !isConnected || countdown !== null || isAnalyzing ? 'opacity-60' : ''
              }`}
            >
              <Activity color="#FFFFFF" size={20} className="mr-2" />
              <Text className="text-base font-bold text-white tracking-wide">
                {isAnalyzing ? "Đang xử lý kết quả..." : "Bắt đầu đo 60 giây"}
              </Text>
            </Pressable>
          )}

          {!isConnected && (
            <View className="flex-row items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50/90 border border-rose-200/80 shadow-sm mt-1">
              <AlertCircle color="#E11D48" size={16} />
              <Text className="text-xs font-semibold text-rose-600 tracking-tight text-center">
                Vui lòng kết nối đồng hồ BLE trong <Text className="underline">Cài đặt</Text> trước khi đo.
              </Text>
            </View>
          )}
        </View>
        </View>
      </View>
    </ScreenWrapper>
  );
}
