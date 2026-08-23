import notifee, {
  AndroidForegroundServiceType,
  AndroidImportance,
} from "@notifee/react-native";
import type { EventSubscription, Permission } from "react-native";
import { PermissionsAndroid, Platform } from "react-native";
import BleManager, {
  BleDisconnectPeripheralEvent,
  BleDiscoverPeripheralEvent,
  BleManagerDidUpdateValueForCharacteristicEvent,
} from "react-native-ble-manager";
import { requestBluetoothPermissions } from "@/utils/blePermissions";
import { ppgRecorder, PpgSample } from "@/services/ppg-management/ppgRecorder";
import {
  BATTERY_SERVICE_UUID,
  BATTERY_LEVEL_CHARACTERISTIC_UUID,
  BATTERY_READ_INTERVAL_MS,
  DIRECT_CONNECT_TIMEOUT_MS,
  DIRECT_RECONNECT_DELAY_MS,
  HUY_WATCH_CHANNEL_ID,
  HUY_WATCH_CHARACTERISTIC_UUID,
  HUY_WATCH_REPORT_CHARACTERISTIC_UUID,
  HUY_WATCH_DEVICE_NAME,
  HUY_WATCH_NOTIFICATION_ID,
  HUY_WATCH_SERVICE_UUID,
  NOTIFICATION_UPDATE_INTERVAL_MS,
  RECONNECT_SCAN_INTERVAL_MS,
  RECONNECT_SCAN_WINDOW_SECONDS,
  REQUESTED_BLE_MTU,
  STORE_HEALTH_UPDATE_INTERVAL_MS,
} from "./bleConstants";
import { bleStorage, KnownBleDevice } from "./bleStorage";
import { useBleStore } from "./bleStore";

type TimerHandle = ReturnType<typeof setTimeout>;

type ConnectOptions = {
  persistDevice?: boolean;
  deviceName?: string | null;
  reconnecting?: boolean;
};

const normalize = (value?: string | null) => (value ?? "").toLowerCase();

const matchesUuid = (a?: string | null, b?: string | null) =>
  normalize(a).replace(/-/g, "") === normalize(b).replace(/-/g, "");

const getPeripheralName = (peripheral: BleDiscoverPeripheralEvent) =>
  peripheral.name || peripheral.advertising?.localName || null;

const isTargetPeripheral = (
  peripheral: BleDiscoverPeripheralEvent,
  knownDevice: KnownBleDevice | null,
) => {
  const deviceName = getPeripheralName(peripheral);
  const serviceUUIDs = peripheral.advertising?.serviceUUIDs ?? [];

  return (
    normalize(peripheral.id) === normalize(knownDevice?.id) ||
    normalize(deviceName) === normalize(knownDevice?.name) ||
    normalize(deviceName).startsWith(normalize(HUY_WATCH_DEVICE_NAME)) ||
    serviceUUIDs.some((uuid) => matchesUuid(uuid, HUY_WATCH_SERVICE_UUID))
  );
};

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> => {
  let timeout: TimerHandle | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
};

class HuyWatchBleService {
  private started = false;
  private isConnecting = false;
  private manualDisconnect = false;
  private reconnectTimer: TimerHandle | null = null;
  private scanningForReconnect = false;
  private notificationUpdateAt = 0;
  private storeUpdateAt = 0;
  private ppgLineBuffer = "";
  private listeners: EventSubscription[] = [];
  private batteryTimer: TimerHandle | null = null;

  async bootstrap() {
    if (this.started) {
      return;
    }

    this.started = true;
    this.registerListeners();

    const knownDevice = bleStorage.getKnownDevice();
    const store = useBleStore.getState();
    store.setKnownDevice(knownDevice);
    store.setInitialized(true);

    try {
      await BleManager.start({ showAlert: false });
      const state = await BleManager.checkState();

      if (state !== "on") {
        store.setStatus("bluetoothOff", `Bluetooth: ${state}`);
        return;
      }
    } catch (error) {
      store.setStatus("error", "Không thể khởi tạo BLE manager.");
      return;
    }

    if (knownDevice) {
      this.manualDisconnect = false;
      store.setStatus("reconnecting");
      void this.displayForegroundNotification(
        knownDevice.id,
        "Đang khôi phục kết nối HuyWatch",
      );
      this.scheduleReconnect(DIRECT_RECONNECT_DELAY_MS);
    } else {
      store.setStatus("unpaired");
    }
  }

  dispose() {
    this.clearReconnectTimer();
    this.listeners.forEach((listener) => listener.remove());
    this.listeners = [];
    this.started = false;
  }

  async connectToDevice(id: string, options: ConnectOptions = {}) {
    if (this.isConnecting) {
      return;
    }

    const store = useBleStore.getState();
    this.clearReconnectTimer();
    this.isConnecting = true;
    this.manualDisconnect = false;
    store.setStatus(options.reconnecting ? "reconnecting" : "connecting");

    try {
      const permission = await requestBluetoothPermissions();
      if (!permission.ok) {
        throw new Error("Thiếu quyền Bluetooth.");
      }

      const alreadyConnected = await BleManager.isPeripheralConnected(id).catch(
        () => false,
      );

      if (!alreadyConnected) {
        await withTimeout(
          BleManager.connect(id),
          DIRECT_CONNECT_TIMEOUT_MS,
          "Kết nối BLE quá thời gian chờ.",
        );
      }

      if (Platform.OS === "android") {
        const negotiatedMtu = await BleManager.requestMTU(
          id,
          REQUESTED_BLE_MTU,
        ).catch((error) => {
          console.warn("Không thể request BLE MTU 512:", error);
          return null;
        });

        store.setNegotiatedMtu(negotiatedMtu);
      }

      await BleManager.retrieveServices(id);
      await BleManager.startNotification(
        id,
        HUY_WATCH_SERVICE_UUID,
        HUY_WATCH_CHARACTERISTIC_UUID,
      );
      await BleManager.startNotification(
        id,
        HUY_WATCH_SERVICE_UUID,
        HUY_WATCH_REPORT_CHARACTERISTIC_UUID,
      ).catch((err) => {
        console.warn("Không thể đăng ký notify report characteristic:", err);
      });

      const knownDevice: KnownBleDevice = {
        id,
        name: options.deviceName ?? HUY_WATCH_DEVICE_NAME,
        connectedAt: Date.now(),
      };

      if (options.persistDevice !== false) {
        bleStorage.setKnownDevice(knownDevice);
        store.setKnownDevice(knownDevice);
      }

      store.setConnectedDevice(id);
      store.setStatus("connected");
      store.resetReconnectAttempt();

      // Đọc thời lượng pin ngay khi vừa kết nối và bắt đầu đếm giờ 5 phút đọc lại 1 lần
      void this.readBatteryLevel();
      this.startBatteryPeriodicRead();

      await this.displayForegroundNotification(id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể kết nối BLE.";
      store.setConnectedDevice(null);
      store.setStatus("error", message);

      if (options.reconnecting && !this.manualDisconnect) {
        this.scheduleReconnect(RECONNECT_SCAN_INTERVAL_MS);
      }

      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  async readBatteryLevel(): Promise<number | null> {
    const store = useBleStore.getState();
    const deviceId = store.connectedDeviceId;
    if (!deviceId) return null;

    try {
      const bytes = await BleManager.read(
        deviceId,
        BATTERY_SERVICE_UUID,
        BATTERY_LEVEL_CHARACTERISTIC_UUID
      );
      if (bytes && bytes.length > 0) {
        const level = Math.min(100, Math.max(0, bytes[0]));
        store.setBatteryLevel(level);
        console.log(`[BLE] Dung lượng pin thiết bị: ${level}%`);
        return level;
      }
    } catch (error) {
      console.warn("Không thể đọc dung lượng pin qua BLE (0x180F):", error);
    }
    return null;
  }

  async sendCommand(command: string) {
    const store = useBleStore.getState();
    const deviceId = store.connectedDeviceId;
    if (!deviceId) throw new Error("Chưa kết nối thiết bị");

    try {
      // Characteristic WRITE: beb5483e-36e1-4688-b7f5-ea07361b26a9
      const RX_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a9";
      
      const buffer = [];
      for (let i = 0; i < command.length; i++) {
        buffer.push(command.charCodeAt(i));
      }
      buffer.push(10); // Thêm ký tự newline (\n)

      await BleManager.write(
        deviceId,
        HUY_WATCH_SERVICE_UUID,
        RX_UUID,
        buffer,
        32 // max byte size per write is usually 20, but react-native-ble-manager handles chunks or we can set it higher
      );
      console.log(`[BLE-TX] Đã gửi lệnh: ${command}`);
    } catch (error) {
      console.warn("Lỗi khi gửi lệnh BLE:", error);
      throw error;
    }
  }

  private startBatteryPeriodicRead() {
    this.stopBatteryPeriodicRead();
    this.batteryTimer = setInterval(() => {
      void this.readBatteryLevel();
    }, BATTERY_READ_INTERVAL_MS);
  }

  private stopBatteryPeriodicRead() {
    if (this.batteryTimer) {
      clearInterval(this.batteryTimer);
      this.batteryTimer = null;
    }
  }

  async disconnectDevice() {
    const store = useBleStore.getState();
    const deviceId = store.connectedDeviceId ?? store.knownDevice?.id;

    this.manualDisconnect = true;
    this.clearReconnectTimer();
    this.stopBatteryPeriodicRead();

    if (deviceId) {
      try {
        await BleManager.disconnect(deviceId);
      } catch (error) {
        console.warn("Không thể ngắt BLE hoặc thiết bị đã ngắt:", error);
      }
    }

    store.setConnectedDevice(null);
    store.setStatus(store.knownDevice ? "disconnected" : "unpaired");
    store.resetHealthData();
    await this.stopForegroundService();
  }

  async forgetDevice() {
    const store = useBleStore.getState();
    const deviceId = store.connectedDeviceId ?? store.knownDevice?.id;

    await this.disconnectDevice();
    
    // Clear OS-level Bluetooth pairing/bonding cache (Very important after Firmware update)
    if (deviceId) {
      if (Platform.OS === "android") {
        // Fire and forget, don't await to prevent hanging if Android BLE stack is unresponsive
        BleManager.removeBond(deviceId)
          .then(() => console.log("[BLE] Đã xóa lịch sử ghép đôi (Bond) trên Android."))
          .catch((e) => console.log("[BLE] Không thể xóa Bond hoặc thiết bị chưa được Bond:", e));
      }
      
      BleManager.removePeripheral(deviceId)
        .then(() => console.log("[BLE] Đã xóa peripheral cache."))
        .catch((e) => console.log("[BLE] Lỗi removePeripheral:", e));
    }

    bleStorage.clearKnownDevice();

    store.setKnownDevice(null);
    store.setStatus("unpaired");
    store.resetReconnectAttempt();
  }

  private registerListeners() {
    this.listeners.push(
      BleManager.onDidUpdateValueForCharacteristic((event) => {
        this.handleCharacteristicUpdate(event);
      }),
      BleManager.onDisconnectPeripheral((event) => {
        this.handleDisconnect(event);
      }),
      BleManager.onDiscoverPeripheral((peripheral) => {
        void this.handleReconnectDiscovery(peripheral);
      }),
      BleManager.onDidUpdateState(({ state }) => {
        const store = useBleStore.getState();

        if (state === "on") {
          if (store.knownDevice && !store.connectedDeviceId) {
            store.setStatus("reconnecting");
            this.scheduleReconnect(DIRECT_RECONNECT_DELAY_MS);
          }
          return;
        }

        this.clearReconnectTimer();
        store.setConnectedDevice(null);
        store.setStatus("bluetoothOff", `Bluetooth: ${state}`);
      }),
    );
  }

  private handleCharacteristicUpdate(
    event: BleManagerDidUpdateValueForCharacteristicEvent,
  ) {
    const store = useBleStore.getState();

    if (
      normalize(event.peripheral) !== normalize(store.connectedDeviceId) ||
      !matchesUuid(event.service, HUY_WATCH_SERVICE_UUID)
    ) {
      return;
    }

    const isRawPpgChar = matchesUuid(event.characteristic, HUY_WATCH_CHARACTERISTIC_UUID);
    const isReportChar = matchesUuid(event.characteristic, HUY_WATCH_REPORT_CHARACTERISTIC_UUID);

    if (!isRawPpgChar && !isReportChar) {
      return;
    }

    const raw = String.fromCharCode(...event.value);
    const now = Date.now();

    // 1. XỬ LÝ CHARACTERISTIC 2 (BÁO CÁO TRUNG BÌNH & WORKOUT)
    if (isReportChar) {
      const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (line.startsWith("R1:") || line.startsWith("R:")) {
          // Báo cáo hoàn tất Pha 1 (1 phút đo PPG)
          const parts = line.slice(line.indexOf(":") + 1).split(",");
          if (parts.length >= 2) {
            const bpm = parseInt(parts[0], 10);
            const spo2 = parseInt(parts[1], 10);
            if (Number.isFinite(bpm) && Number.isFinite(spo2)) {
              store.setHealthData({ bpm, spo2, receivedAt: now });
            }
          }

          // Hoàn tất Pha 1: Tự động dừng ghi, xuất file CSV, tải lên S3 và xác nhận với Backend
          if (store.isRecordingPpg) {
            if (store.recordingSampleCount >= 4500) {
              void ppgRecorder.stopExportAndUpload().catch((err) => {
                console.warn("Lỗi tự động xuất CSV & upload PPG khi hoàn tất Pha 1:", err);
              });
            } else {
              // Ít hơn 4500 mẫu -> Hủy âm thầm không gây cảnh báo lỗi
              ppgRecorder.cancelRecording("Số lượng mẫu không đủ 1 phút Pha 1. Hủy phiên ghi.");
            }
          }
        } else if (line.startsWith("R2:")) {
          // Báo cáo hoàn tất Pha 2 (30 giây đo trung bình - CHỈ cập nhật BPM/SpO2, KHÔNG xuất/upload file PPG)
          const parts = line.slice(3).split(",");
          if (parts.length >= 2) {
            const bpm = parseInt(parts[0], 10);
            const spo2 = parseInt(parts[1], 10);
            if (Number.isFinite(bpm) && Number.isFinite(spo2) && bpm > 0) {
              store.setHealthData({ bpm, spo2, receivedAt: now });
            }
          }
          console.log("[BLE-Report] Đã nhận báo cáo Pha 2 (Chỉ cập nhật chỉ số, không lưu file PPG).");
        } else if (line.startsWith("W:")) {
          // Định dạng Workout vitals: W:millis,bpm,spo2
          const parts = line.slice(2).split(",");
          if (parts.length >= 3) {
            const bpm = parseInt(parts[1], 10);
            const spo2 = parseInt(parts[2], 10);
            if (Number.isFinite(bpm) && Number.isFinite(spo2) && bpm > 0) {
              store.setHealthData({ bpm, spo2, receivedAt: now });
            }
          }
        }
      }
      return; // Kết thúc xử lý Report
    }

    // 2. XỬ LÝ CHARACTERISTIC 1 (RAW PPG)
    // Chỉ lấy dữ liệu PPG ở Pha 1 để vẽ biểu đồ và ghi file
    const lines = this.extractLines(raw);
    if (lines.length === 0) return;

    const ppgSamples: PpgSample[] = [];

    for (const line of lines) {
      if (line.startsWith("CMD:")) {
        console.log("[BLE-CMD]", line);
        if (line.includes("MOTION") || line.includes("NOT_WEARING")) {
          // Phát hiện chuyển động hoặc tháo thiết bị trong khi đo Pha 1 -> HỦY ngay phiên ghi PPG
          if (store.isRecordingPpg) {
            const reason = line.includes("MOTION") 
              ? "Quá trình đo Rung nhĩ bị gián đoạn do cử động tay." 
              : "Quá trình đo bị gián đoạn do tháo thiết bị.";
            ppgRecorder.cancelRecording(reason);
          }
        }
      } else {
        const sample = this.parsePpgLine(line);
        if (sample) ppgSamples.push(sample);
      }
    }

    if (ppgSamples.length > 0) {
      // Tự động khởi tạo phiên ghi PPG cho Pha 1 nếu chưa kích hoạt
      if (!store.isRecordingPpg) {
        ppgRecorder.start();
      }

      ppgRecorder.appendSamples(ppgSamples);

      if (now - this.storeUpdateAt >= STORE_HEALTH_UPDATE_INTERVAL_MS) {
        this.storeUpdateAt = now;
        const latest = ppgSamples[ppgSamples.length - 1];

        store.setPpgData({
          deviceMillis: latest.deviceMillis,
          red: latest.red,
          ir: latest.ir,
          samplesInPacket: ppgSamples.length,
          receivedAt: now,
        });
      }
    }

    if (now - this.notificationUpdateAt >= NOTIFICATION_UPDATE_INTERVAL_MS) {
      this.notificationUpdateAt = now;
      const s = useBleStore.getState();
      const bpm = s.currentBPM > 0 ? s.currentBPM : undefined;
      const spo2 = s.currentSpO2 > 0 ? s.currentSpO2 : undefined;
      void this.displayForegroundNotification(
        event.peripheral,
        s.isRecordingPpg
          ? `Đang ghi dữ liệu PPG: ${s.recordingSampleCount} mẫu`
          : undefined,
        bpm,
        spo2,
      );
    }
  }

  // Tách raw bytes thành các dòng hoàn chỉnh, buffer dòng chưa kết thúc
  private extractLines(raw: string): string[] {
    const text = this.ppgLineBuffer + raw;
    const lines = text.split(/\r?\n/);
    this.ppgLineBuffer =
      text.endsWith("\n") || text.endsWith("\r\n") ? "" : (lines.pop() ?? "");
    return lines.flatMap((l) => {
      const trimmed = l.trim();
      return trimmed ? [trimmed] : [];
    });
  }

  // Parse 1 dòng PPG: 5 cột (millis,red,ir,bpm,spo2) hoặc 3 cột legacy (millis,red,ir)
  private parsePpgLine(line: string): PpgSample | null {
    const cols = line.split(",");
    if (cols.length < 3) return null;

    const deviceMillis = parseInt(cols[0], 10);
    const red = parseInt(cols[1], 10);
    const ir = parseInt(cols[2], 10);

    if (!Number.isFinite(red) || !Number.isFinite(ir)) return null;

    const bpm = cols.length >= 5 ? parseInt(cols[3], 10) : null;
    const spo2 = cols.length >= 5 ? parseInt(cols[4], 10) : null;

    return {
      deviceMillis: Number.isFinite(deviceMillis) ? deviceMillis : null,
      red,
      ir,
      bpm: bpm !== null && Number.isFinite(bpm) ? bpm : null,
      spo2: spo2 !== null && Number.isFinite(spo2) ? spo2 : null,
    };
  }

  private handleDisconnect(event: BleDisconnectPeripheralEvent) {
    const store = useBleStore.getState();
    const knownDevice = store.knownDevice;
    const isKnownDevice =
      normalize(event.peripheral) === normalize(store.connectedDeviceId) ||
      normalize(event.peripheral) === normalize(knownDevice?.id);

    if (!isKnownDevice) {
      return;
    }

    store.setConnectedDevice(null);
    store.resetHealthData();
    store.setNegotiatedMtu(null);
    this.ppgLineBuffer = "";

    if (this.manualDisconnect || !knownDevice) {
      store.setStatus(knownDevice ? "disconnected" : "unpaired");
      return;
    }

    store.setStatus("reconnecting");
    void this.displayForegroundNotification(
      knownDevice.id,
      "Mất kết nối, đang tự kết nối lại",
    );
    this.scheduleReconnect(DIRECT_RECONNECT_DELAY_MS);
  }

  private scheduleReconnect(delayMs: number) {
    const store = useBleStore.getState();

    if (this.manualDisconnect || !store.knownDevice) {
      return;
    }

    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      void this.reconnectCycle();
    }, delayMs);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private async reconnectCycle() {
    const store = useBleStore.getState();
    const knownDevice = store.knownDevice;

    if (this.manualDisconnect || !knownDevice || store.connectedDeviceId) {
      return;
    }

    store.bumpReconnectAttempt();
    store.setStatus("reconnecting");

    try {
      await this.connectToDevice(knownDevice.id, {
        deviceName: knownDevice.name,
        reconnecting: true,
      });
      return;
    } catch (error) {
      console.log("Direct reconnect thất bại, chuyển sang scan 30 giây.");
    }

    await this.scanForReconnect();
  }

  private async scanForReconnect() {
    const store = useBleStore.getState();
    const knownDevice = store.knownDevice;

    if (this.manualDisconnect || !knownDevice || this.scanningForReconnect) {
      return;
    }

    this.scanningForReconnect = true;
    store.setStatus("scanning");

    try {
      await BleManager.scan({
        serviceUUIDs: [],
        seconds: RECONNECT_SCAN_WINDOW_SECONDS,
        allowDuplicates: true,
        scanMode: 2,
      });
    } catch (error) {
      store.setStatus("error", "Không thể scan để reconnect.");
      this.scanningForReconnect = false;
      this.scheduleReconnect(RECONNECT_SCAN_INTERVAL_MS);
      return;
    }

    setTimeout(
      () => {
        this.scanningForReconnect = false;
        const current = useBleStore.getState();

        if (
          !this.manualDisconnect &&
          current.knownDevice &&
          !current.connectedDeviceId
        ) {
          current.setStatus("reconnecting");
          this.scheduleReconnect(RECONNECT_SCAN_INTERVAL_MS);
        }
      },
      RECONNECT_SCAN_WINDOW_SECONDS * 1000 + 500,
    );
  }

  private async handleReconnectDiscovery(
    peripheral: BleDiscoverPeripheralEvent,
  ) {
    const store = useBleStore.getState();
    const knownDevice = store.knownDevice;

    if (
      !this.scanningForReconnect ||
      this.manualDisconnect ||
      !knownDevice ||
      store.connectedDeviceId ||
      !isTargetPeripheral(peripheral, knownDevice)
    ) {
      return;
    }

    this.scanningForReconnect = false;

    try {
      await BleManager.stopScan();
    } catch (error) {
      console.warn("Không thể dừng scan reconnect:", error);
    }

    await this.connectToDevice(peripheral.id, {
      deviceName: getPeripheralName(peripheral) ?? knownDevice.name,
      reconnecting: true,
    }).catch(() => {
      this.scheduleReconnect(RECONNECT_SCAN_INTERVAL_MS);
    });
  }

  private async createForegroundChannel() {
    return notifee.createChannel({
      id: HUY_WATCH_CHANNEL_ID,
      name: "HuyWatch Theo Dõi Sức Khỏe Ngầm",
      importance: AndroidImportance.HIGH,
    });
  }

  private async displayForegroundNotification(
    deviceId: string,
    message?: string,
    bpm?: number,
    spo2?: number,
  ) {
    if (Platform.OS !== "android") {
      return;
    }
    await notifee.requestPermission();

    // Ensure Bluetooth + connected-device permission before starting a connectedDevice FGS
    const btPerm = await requestBluetoothPermissions();

    let foregroundServiceTypes: Array<AndroidForegroundServiceType> | undefined;
    try {
      const sdk =
        typeof Platform.Version === "string"
          ? parseInt(Platform.Version, 10)
          : (Platform.Version as number);

      if (btPerm.ok) {
        if (sdk >= 34) {
          const hasConnected = await PermissionsAndroid.check(
            "android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE" as Permission,
          );
          if (hasConnected) {
            foregroundServiceTypes = [
              AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE,
            ];
          }
        }
      }
    } catch (err) {
      console.warn("Error checking connected device permission:", err);
    }

    const channelId = await this.createForegroundChannel();
    const hasHealthData =
      typeof bpm === "number" &&
      bpm > 0 &&
      typeof spo2 === "number" &&
      spo2 > 0;

    await notifee.displayNotification({
      id: HUY_WATCH_NOTIFICATION_ID,
      title: hasHealthData
        ? `HuyWatch: ${bpm} BPM | SpO2 ${spo2}%`
        : "HuyWatch đang chạy ngầm",
      body:
        message ??
        (hasHealthData
          ? `Đang nhận dữ liệu từ thiết bị ${deviceId}`
          : `Đang theo dõi dữ liệu từ thiết bị ${deviceId}`),
      android: {
        channelId,
        asForegroundService: true,
        ...(foregroundServiceTypes ? { foregroundServiceTypes } : {}),
        color: "#7ee0d4",
        ongoing: true,
        onlyAlertOnce: true,
        pressAction: {
          id: "default",
          launchActivity: "default",
        },
      },
    });
  }

  private async stopForegroundService() {
    if (Platform.OS !== "android") {
      return;
    }

    await notifee.stopForegroundService();
  }
}

export const bleService = new HuyWatchBleService();
