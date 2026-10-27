import React, { createContext, useContext, useEffect, useMemo, useCallback } from "react";
import { bleService } from "@/services/ble-management/bleService";
import type { KnownBleDevice } from "@/services/ble-management/bleStorage";
import { BleConnectionStatus, useBleStore } from "@/services/ble-management/bleStore";
import { ppgRecorder, PpgRecordingResult } from "@/services/ppg-management/ppgRecorder";
import type { HealthRecordResponse } from "@/types/response";

interface BLEContextType {
  knownDevice: KnownBleDevice | null;
  connectedDevice: string | null;
  currentBPM: number;
  currentSpO2: number;
  batteryLevel: number | null;
  latestPpgDeviceMillis: number | null;
  latestPpgRed: number | null;
  latestPpgIR: number | null;
  negotiatedMtu: number | null;
  status: BleConnectionStatus;
  isInitialized: boolean;
  isConnecting: boolean;
  isPaired: boolean;
  reconnectAttempt: number;
  errorMessage: string | null;
  isRecordingPpg: boolean;
  isExportingRecording: boolean;
  recordingStartedAt: number | null;
  recordingSampleCount: number;
  lastRecordingFileUri: string | null;
  lastRecordingFileName: string | null;
  recordingError: string | null;
  isSpotChecking: boolean;
  isAnalyzing: boolean;
  aiAnalysisResult: HealthRecordResponse | null;
  emergencyActive: boolean;
  emergencyType: string | null;
  emergencyCountdownSeconds: number | null;
  emergencyPayload: string | null;
  connectToDevice: (id: string, name?: string | null) => Promise<void>;
  disconnectDevice: () => Promise<void>;
  forgetDevice: () => Promise<void>;
  refreshBatteryLevel: () => Promise<number | null>;
  startPpgRecording: () => void;
  stopPpgRecording: () => Promise<PpgRecordingResult>;
  stopExportAndUploadPpgRecording: () => Promise<{ recording?: PpgRecordingResult; record?: HealthRecordResponse }>;
  startSpotCheck: () => Promise<void>;
  stopSpotCheck: () => Promise<void>;
  sendCommand: (cmd: string) => Promise<void>;
  cancelEmergency: () => Promise<void>;
  sendTestSos: () => Promise<void>;
}

const BLEContext = createContext<BLEContextType | undefined>(undefined);

export const BLEProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const knownDevice = useBleStore((state) => state.knownDevice);
  const connectedDevice = useBleStore((state) => state.connectedDeviceId);
  const currentBPM = useBleStore((state) => state.currentBPM);
  const currentSpO2 = useBleStore((state) => state.currentSpO2);
  const batteryLevel = useBleStore((state) => state.batteryLevel);
  // Read latest raw PPG properties on demand without causing full React context re-renders 4x per second
  const latestPpgDeviceMillis = useBleStore.getState().latestPpgDeviceMillis;
  const latestPpgRed = useBleStore.getState().latestPpgRed;
  const latestPpgIR = useBleStore.getState().latestPpgIR;
  const negotiatedMtu = useBleStore((state) => state.negotiatedMtu);
  const status = useBleStore((state) => state.status);
  const isInitialized = useBleStore((state) => state.isInitialized);
  const reconnectAttempt = useBleStore((state) => state.reconnectAttempt);
  const errorMessage = useBleStore((state) => state.errorMessage);
  const isRecordingPpg = useBleStore((state) => state.isRecordingPpg);
  const isExportingRecording = useBleStore(
    (state) => state.isExportingRecording,
  );
  const recordingStartedAt = useBleStore((state) => state.recordingStartedAt);
  const recordingSampleCount = useBleStore(
    (state) => state.recordingSampleCount,
  );
  const lastRecordingFileUri = useBleStore(
    (state) => state.lastRecordingFileUri,
  );
  const lastRecordingFileName = useBleStore(
    (state) => state.lastRecordingFileName,
  );
  const recordingError = useBleStore((state) => state.recordingError);
  const isSpotChecking = useBleStore((state) => state.isSpotChecking);
  const isAnalyzing = useBleStore((state) => state.isAnalyzing);
  const aiAnalysisResult = useBleStore((state) => state.aiAnalysisResult);
  const emergencyActive = useBleStore((state) => state.emergencyActive);
  const emergencyType = useBleStore((state) => state.emergencyType);
  const emergencyCountdownSeconds = useBleStore((state) => state.emergencyCountdownSeconds);
  const emergencyPayload = useBleStore((state) => state.emergencyPayload);

  useEffect(() => {
    void bleService.bootstrap();
  }, []);

  const connectToDevice = useCallback(
    (id: string, name?: string | null) =>
      bleService.connectToDevice(id, { deviceName: name }),
    [],
  );
  const disconnectDevice = useCallback(() => bleService.disconnectDevice(), []);
  const forgetDevice = useCallback(() => bleService.forgetDevice(), []);
  const refreshBatteryLevel = useCallback(
    () => bleService.readBatteryLevel(),
    [],
  );
  const startPpgRecording = useCallback(() => ppgRecorder.start(), []);
  const stopPpgRecording = useCallback(() => ppgRecorder.stopAndExport(), []);
  const stopExportAndUploadPpgRecording = useCallback(
    () => ppgRecorder.stopExportAndUpload(),
    [],
  );
  const startSpotCheck = useCallback(() => bleService.startSpotCheck(), []);
  const stopSpotCheck = useCallback(() => bleService.stopSpotCheck(), []);
  const sendCommand = useCallback(
    (cmd: string) => bleService.sendCommand(cmd),
    [],
  );
  const cancelEmergency = useCallback(() => bleService.cancelEmergency(), []);
  const sendTestSos = useCallback(() => bleService.sendTestSos(), []);

  const value = useMemo<BLEContextType>(
    () => ({
      knownDevice,
      connectedDevice,
      currentBPM,
      currentSpO2,
      batteryLevel,
      latestPpgDeviceMillis,
      latestPpgRed,
      latestPpgIR,
      negotiatedMtu,
      status,
      isInitialized,
      isConnecting:
        status === "connecting" ||
        status === "reconnecting" ||
        status === "scanning",
      isPaired: Boolean(knownDevice),
      reconnectAttempt,
      errorMessage,
      isRecordingPpg,
      isExportingRecording,
      isSpotChecking,
      recordingStartedAt,
      recordingSampleCount,
      lastRecordingFileUri,
      lastRecordingFileName,
      recordingError,
      isAnalyzing,
      aiAnalysisResult,
      emergencyActive,
      emergencyType,
      emergencyCountdownSeconds,
      emergencyPayload,
      connectToDevice,
      disconnectDevice,
      forgetDevice,
      refreshBatteryLevel,
      startPpgRecording,
      stopPpgRecording,
      stopExportAndUploadPpgRecording,
      startSpotCheck,
      stopSpotCheck,
      sendCommand,
      cancelEmergency,
      sendTestSos,
    }),
    [
      knownDevice,
      connectedDevice,
      currentBPM,
      currentSpO2,
      batteryLevel,
      latestPpgDeviceMillis,
      latestPpgRed,
      latestPpgIR,
      negotiatedMtu,
      status,
      isInitialized,
      reconnectAttempt,
      errorMessage,
      isRecordingPpg,
      isExportingRecording,
      isSpotChecking,
      recordingStartedAt,
      recordingSampleCount,
      lastRecordingFileUri,
      lastRecordingFileName,
      recordingError,
      isAnalyzing,
      aiAnalysisResult,
      emergencyActive,
      emergencyType,
      emergencyCountdownSeconds,
      emergencyPayload,
      connectToDevice,
      disconnectDevice,
      forgetDevice,
      refreshBatteryLevel,
      startPpgRecording,
      stopPpgRecording,
      stopExportAndUploadPpgRecording,
      startSpotCheck,
      stopSpotCheck,
      sendCommand,
      cancelEmergency,
      sendTestSos,
    ],
  );

  return <BLEContext.Provider value={value}>{children}</BLEContext.Provider>;
};

export const useBLE = () => {
  const context = useContext(BLEContext);
  if (!context) throw new Error("useBLE phải được đặt trong BLEProvider");
  return context;
};
