import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Activity, CheckCircle2, AlertCircle, HeartPulse, ShieldAlert, Heart } from 'lucide-react-native';
import { useBleStore } from '@/services/ble-management/bleStore';
import { useBLE } from '@/context/BLEContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AFibMeasureScreen() {
  const router = useRouter();
  const { sendCommand, stopExportAndUploadPpgRecording } = useBLE();
  const store = useBleStore();
  const insets = useSafeAreaInsets();
  
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [localUploadMsg, setLocalUploadMsg] = useState<string | null>(null);

  // Sync with global state
  const isRecording = store.isRecordingPpg;
  const isAnalyzing = store.isAnalyzing;
  const result = store.aiAnalysisResult;
  const error = store.recordingError;
  const startedAt = store.recordingStartedAt;
  const isConnected = Boolean(store.connectedDeviceId);

  // Timer logic for measuring
  useEffect(() => {
    if (isRecording && startedAt) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const remaining = Math.max(0, 60 - elapsed);
        setTimeLeft(remaining);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(60);
    }
  }, [isRecording, startedAt]);

  const startCountdown = () => {
    if (!isConnected) return;
    setLocalUploadMsg(null);
    store.setRecordingState({ aiAnalysisResult: null, recordingError: null });
    setCountdown(3);
    
    let counter = 3;
    const interval = setInterval(() => {
      counter -= 1;
      if (counter > 0) {
        setCountdown(counter);
      } else {
        clearInterval(interval);
        setCountdown(null);
        startMeasurement();
      }
    }, 1000);
  };

  const startMeasurement = async () => {
    try {
      await sendCommand("CMD:START_SCREENING");
    } catch (err) {
      console.warn("Lỗi gửi lệnh đo:", err);
    }
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
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* 1. HEADER */}
      <View className="px-5 py-4 flex-row items-center">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="p-2 -ml-2 rounded-full"
        >
          <ArrowLeft color="#1F2937" size={24} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground ml-3">Tầm soát Rung nhĩ</Text>
      </View>

      {/* 2. MAIN CONTENT (Centered Circle) */}
      <View className="flex-1 items-center justify-center">
        {/* Decorative background rings */}
        <View className="absolute w-[320px] h-[320px] rounded-full border border-primary/5" />
        <View className="absolute w-[260px] h-[260px] rounded-full border border-primary/10" />

        <View className={`w-[220px] h-[220px] rounded-full items-center justify-center shadow-sm ${
          countdown !== null ? 'bg-primary/10' :
          isRecording ? 'bg-accent/10' :
          isAnalyzing ? 'bg-blue-50' :
          result?.predictionLabel === 'NORMAL' ? 'bg-emerald-50' :
          result?.predictionLabel === 'AFIB' ? 'bg-rose-50' :
          result?.predictionLabel === 'AFIB_SUSPECTED' ? 'bg-amber-50' :
          error ? 'bg-rose-50' : 'bg-primary/5'
        }`}>
          
          {/* STATE: COUNTDOWN */}
          {countdown !== null && (
            <>
              <Text className="text-8xl font-light text-primary">{countdown}</Text>
            </>
          )}

          {/* STATE: RECORDING */}
          {countdown === null && isRecording && (
            <>
              <Activity color="#55A316" size={32} className="mb-2 animate-pulse opacity-80" />
              <Text className="text-7xl font-light text-accent tracking-tighter">{timeLeft}</Text>
              <Text className="text-sm font-medium text-accent/80 uppercase tracking-widest mt-1">Giây</Text>
            </>
          )}

          {/* STATE: ANALYZING */}
          {countdown === null && isAnalyzing && (
            <>
              <ActivityIndicator size="large" color="#0F67FE" className="mb-4" />
              <Text className="text-base font-semibold text-primary">Đang phân tích</Text>
            </>
          )}

          {/* STATE: RESULT */}
          {countdown === null && result && !isAnalyzing && (
            <>
              {result.predictionLabel === 'NORMAL' ? (
                <Heart color="#10B981" size={48} className="mb-3" />
              ) : result.predictionLabel === 'AFIB' ? (
                <ShieldAlert color="#E11D48" size={48} className="mb-3" />
              ) : (
                <AlertCircle color="#D97706" size={48} className="mb-3" />
              )}
              <Text className={`text-xl font-bold text-center px-4 ${
                result.predictionLabel === 'NORMAL' ? 'text-emerald-600' : 
                result.predictionLabel === 'AFIB' ? 'text-rose-600' : 'text-amber-600'
              }`}>
                {result.predictionLabel === 'NORMAL' ? 'Bình thường' : 
                 result.predictionLabel === 'AFIB' ? 'Phát hiện AFib' : 'Nghi ngờ AFib'}
              </Text>
            </>
          )}

          {/* STATE: ERROR */}
          {countdown === null && error && (
            <>
              <AlertCircle color="#E11D48" size={48} className="mb-3" />
              <Text className="text-lg font-bold text-rose-600">Lỗi đo lường</Text>
            </>
          )}

          {/* STATE: IDLE (Ready) */}
          {countdown === null && !isRecording && !isAnalyzing && !result && !error && (
            <>
              <HeartPulse color="#0F67FE" size={56} className="mb-3 opacity-90" />
              <Text className="text-base font-semibold text-primary">Sẵn sàng</Text>
            </>
          )}
        </View>
      </View>

      {/* 3. BOTTOM ACTIONS (Anchored to bottom) */}
      <View className="px-6 pb-8 pt-4">
        {/* Status Text / Instructions */}
        <View className="min-h-[60px] justify-center mb-6">
          {!isConnected && (
            <Text className="text-center text-sm font-medium text-rose-500">
              Chưa kết nối đồng hồ. Vui lòng quay lại màn hình chính để kết nối.
            </Text>
          )}
          
          {isConnected && countdown !== null && (
            <Text className="text-center text-base text-muted-foreground">
              Chuẩn bị tư thế tĩnh tâm...
            </Text>
          )}

          {isConnected && isRecording && (
            <Text className="text-center text-base text-muted-foreground px-4 leading-6">
              Vui lòng ngồi im, hít thở đều và <Text className="font-bold text-foreground">không cử động tay</Text>.
            </Text>
          )}

          {isConnected && result && (
            <Text className="text-center text-base text-muted-foreground px-4">
              Độ tin cậy của mô hình AI: <Text className="font-bold text-foreground">{Math.round((result.confidence ?? 0) * 100)}%</Text>
            </Text>
          )}

          {isConnected && error && (
            <Text className="text-center text-sm text-rose-500 px-4">
              {error}
            </Text>
          )}

          {isConnected && !isRecording && !isAnalyzing && !result && !error && countdown === null && (
            <Text className="text-center text-base text-muted-foreground px-4 leading-6">
              Đảm bảo đeo đồng hồ chặt vừa phải. Quá trình đo sẽ diễn ra trong <Text className="font-bold text-foreground">60 giây</Text>.
            </Text>
          )}
        </View>

        {/* Action Button */}
        {isRecording ? (
          <TouchableOpacity
            onPress={handleManualUpload}
            className="w-full bg-secondary py-4 rounded-2xl items-center border border-border"
          >
            <Text className="text-foreground font-semibold text-base">Hủy / Kết thúc sớm</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={startCountdown}
            disabled={!isConnected || isAnalyzing}
            className={`w-full py-4 rounded-2xl items-center shadow-sm ${
              isConnected && !isAnalyzing ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <Text className={`font-bold text-base ${isConnected && !isAnalyzing ? 'text-white' : 'text-muted-foreground'}`}>
              {result || error ? 'ĐO LẠI LẦN NỮA' : 'BẮT ĐẦU ĐO'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Extra upload message (if any) */}
        {localUploadMsg && (
          <Text className="text-center text-xs text-muted-foreground mt-4">{localUploadMsg}</Text>
        )}
      </View>
    </View>
  );
}
