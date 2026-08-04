import React, { createContext, useContext, useEffect, useMemo } from "react";
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
  connectToDevice: (id: string, name?: string | null) => Promise<void>;
  disconnectDevice: () => Promise<void>;
  forgetDevice: () => Promise<void>;
  refreshBatteryLevel: () => Promise<number | null>;
  startPpgRecording: () => void;
  stopPpgRecording: () => Promise<PpgRecordingResult>;
  stopExportAndUploadPpgRecording: () => Promise<{ recording: PpgRecordingResult; record?: HealthRecordResponse }>;
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
  const latestPpgDeviceMillis = useBleStore(
    (state) => state.latestPpgDeviceMillis,
  );
  const latestPpgRed = useBleStore((state) => state.latestPpgRed);
  const latestPpgIR = useBleStore((state) => state.latestPpgIR);
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

  useEffect(() => {
    void bleService.bootstrap();
  }, []);

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
      recordingStartedAt,
      recordingSampleCount,
      lastRecordingFileUri,
      lastRecordingFileName,
      recordingError,
      connectToDevice: (id, name) =>
        bleService.connectToDevice(id, { deviceName: name }),
      disconnectDevice: () => bleService.disconnectDevice(),
      forgetDevice: () => bleService.forgetDevice(),
      refreshBatteryLevel: () => bleService.readBatteryLevel(),
      startPpgRecording: () => ppgRecorder.start(),
      stopPpgRecording: () => ppgRecorder.stopAndExport(),
      stopExportAndUploadPpgRecording: () => ppgRecorder.stopExportAndUpload(),
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
      recordingStartedAt,
      recordingSampleCount,
      lastRecordingFileUri,
      lastRecordingFileName,
      recordingError,
    ],
  );

  return <BLEContext.Provider value={value}>{children}</BLEContext.Provider>;
};

export const useBLE = () => {
  const context = useContext(BLEContext);
  if (!context) throw new Error("useBLE phải được đặt trong BLEProvider");
  return context;
};
