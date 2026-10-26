import { create } from "zustand";
import { getLiveVitals } from "@/utils/livePpg";
import type { KnownBleDevice } from "./bleStorage";
import type { PpgSample } from "../ppg-management/ppgRecorder";

export type BleConnectionStatus =
    | "idle"
    | "unpaired"
    | "bluetoothOff"
    | "scanning"
    | "connecting"
    | "connected"
    | "reconnecting"
    | "disconnected"
    | "error"
    | "emergency";

export type BleEmergencyType = "FALL" | "SYNCOPE" | "CARDIAC" | "EMERGENCY";

type BleState = {
    knownDevice: KnownBleDevice | null;
    connectedDeviceId: string | null;
    status: BleConnectionStatus;
    isInitialized: boolean;
    negotiatedMtu: number | null;
    currentBPM: number;
    currentSpO2: number;
    batteryLevel: number | null;
    livePpgSamples: PpgSample[];
    liveBPM: number | null;
    liveSpO2: number | null;
    lastPpgAt: number | null;
    resetLivePpgData: () => void;
    latestPpgDeviceMillis: number | null;
    latestPpgRed: number | null;
    latestPpgIR: number | null;
    ppgPacketCount: number;
    lastPacketAt: number | null;
    lastConnectedAt: number | null;
    reconnectAttempt: number;
    errorMessage: string | null;
    isRecordingPpg: boolean;
    isExportingRecording: boolean;
    isAnalyzing: boolean;
    recordingStartedAt: number | null;
    recordingSampleCount: number;
    lastRecordingFileUri: string | null;
    lastRecordingFileName: string | null;
    recordingError: string | null;
    isSpotChecking: boolean;
    aiAnalysisResult: import("@/types/response").HealthRecordResponse | null;
    emergencyActive: boolean;
    emergencyType: BleEmergencyType | null;
    emergencyCountdownSeconds: number | null;
    emergencyPayload: string | null;
    emergencyUpdatedAt: number | null;
    setIsSpotChecking: (isSpotChecking: boolean) => void;
    setKnownDevice: (device: KnownBleDevice | null) => void;
    setInitialized: (isInitialized: boolean) => void;
    setNegotiatedMtu: (mtu: number | null) => void;
    setStatus: (status: BleConnectionStatus, errorMessage?: string | null) => void;
    setConnectedDevice: (deviceId: string | null) => void;
    setBatteryLevel: (batteryLevel: number | null) => void;
    setHealthData: (payload: {
        bpm: number;
        spo2?: number;
        raw?: string;
        receivedAt?: number;
    }) => void;
    setPpgData: (payload: {
        deviceMillis: number | null;
        red: number;
        ir: number;
        samplesInPacket: number;
        samples?: PpgSample[];
        receivedAt?: number;
    }) => void;
    setRecordingState: (
        patch: Partial<
        Pick<
            BleState,
            | "isRecordingPpg"
            | "isExportingRecording"
            | "isAnalyzing"
            | "recordingStartedAt"
            | "recordingSampleCount"
            | "lastRecordingFileUri"
            | "lastRecordingFileName"
            | "recordingError"
            | "aiAnalysisResult"
        >
        >,
    ) => void;
    resetHealthData: () => void;
    bumpReconnectAttempt: () => void;
    resetReconnectAttempt: () => void;
    setEmergencyState: (payload: {
        active: boolean;
        type?: BleEmergencyType | null;
        countdownSeconds?: number | null;
        emergencyPayload?: string | null;
    }) => void;
    resetEmergencyState: () => void;
};

export const useBleStore = create<BleState>((set) => ({
    knownDevice: null,
    connectedDeviceId: null,
    status: "idle",
    isInitialized: false,
    negotiatedMtu: null,
    currentBPM: 0,
    currentSpO2: 0,
    batteryLevel: null,
    livePpgSamples: [],
    liveBPM: null,
    liveSpO2: null,
    lastPpgAt: null,
    latestPpgDeviceMillis: null,
    latestPpgRed: null,
    latestPpgIR: null,
    ppgPacketCount: 0,
    lastPacketAt: null,
    lastConnectedAt: null,
    reconnectAttempt: 0,
    errorMessage: null,
    isRecordingPpg: false,
    isExportingRecording: false,
    isAnalyzing: false,
    recordingStartedAt: null,
    recordingSampleCount: 0,
    lastRecordingFileUri: null,
    lastRecordingFileName: null,
    recordingError: null,
    isSpotChecking: false,
    aiAnalysisResult: null,
    emergencyActive: false,
    emergencyType: null,
    emergencyCountdownSeconds: null,
    emergencyPayload: null,
    emergencyUpdatedAt: null,

    setIsSpotChecking: (isSpotChecking) => set({ isSpotChecking }),
    setKnownDevice: (knownDevice) => set({ knownDevice }),
    setInitialized: (isInitialized) => set({ isInitialized }),
    setNegotiatedMtu: (negotiatedMtu) => set({ negotiatedMtu }),
    setStatus: (status, errorMessage = null) => set({ status, errorMessage }),
    setConnectedDevice: (connectedDeviceId) =>
        set({
        connectedDeviceId,
        lastConnectedAt: connectedDeviceId ? Date.now() : null,
        }),
    setBatteryLevel: (batteryLevel) => set({ batteryLevel }),
    setHealthData: ({ bpm, spo2, receivedAt = Date.now() }) =>
        set((state) => ({
        currentBPM: bpm,
        currentSpO2: spo2 !== undefined ? spo2 : state.currentSpO2,
        lastPacketAt: receivedAt,
        })),
    setPpgData: ({
        deviceMillis,
        red,
        ir,
        samplesInPacket,
        samples,
        receivedAt = Date.now(),
    }) =>
        set((state) => ({
        ...(samples ? {
            livePpgSamples: samples.slice(-500),
            ...getLiveVitals(samples.at(-1)),
        } : {}),
        lastPpgAt: receivedAt,
        latestPpgDeviceMillis: deviceMillis,
        latestPpgRed: red,
        latestPpgIR: ir,
        ppgPacketCount: state.ppgPacketCount + samplesInPacket,
        lastPacketAt: receivedAt,
        })),
    resetLivePpgData: () => set({
        livePpgSamples: [], liveBPM: null, liveSpO2: null, lastPpgAt: null,
    }),
    setRecordingState: (patch) => set(patch),
    setEmergencyState: ({
        active,
        type,
        countdownSeconds,
        emergencyPayload,
    }) =>
        set((state) => ({
            emergencyActive: active,
            emergencyType: type !== undefined ? type : state.emergencyType,
            emergencyCountdownSeconds: countdownSeconds !== undefined ? countdownSeconds : state.emergencyCountdownSeconds,
            emergencyPayload: emergencyPayload !== undefined ? emergencyPayload : state.emergencyPayload,
            emergencyUpdatedAt: Date.now(),
        })),
    resetEmergencyState: () =>
        set({
            emergencyActive: false,
            emergencyType: null,
            emergencyCountdownSeconds: null,
            emergencyPayload: null,
            emergencyUpdatedAt: null,
        }),
    resetHealthData: () =>
        set({
        livePpgSamples: [], liveBPM: null, liveSpO2: null, lastPpgAt: null,
        currentBPM: 0,
        currentSpO2: 0,
        batteryLevel: null,
        latestPpgDeviceMillis: null,
        latestPpgRed: null,
        latestPpgIR: null,
        ppgPacketCount: 0,
        lastPacketAt: null,
        }),
    bumpReconnectAttempt: () =>
        set((state) => ({ reconnectAttempt: state.reconnectAttempt + 1 })),
    resetReconnectAttempt: () => set({ reconnectAttempt: 0 }),
}));
