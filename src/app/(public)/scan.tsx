import { useRouter } from "expo-router";
import { AlertCircle, RefreshCw, Watch } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Pressable,
  Text,
  View,
} from "react-native";
import BleManager from "react-native-ble-manager";
import {
  HUY_WATCH_DEVICE_NAME,
  HUY_WATCH_SERVICE_UUID,
} from "@/services/ble-management/bleConstants";
import { useBLE } from "@/context/BLEContext";
import { requestBluetoothPermissions } from "@/utils/blePermissions";
import {
  BlePeripheral,
  DiscoveredDeviceCard,
} from "@/components/features/ble/DiscoveredDeviceCard";
import { BleRadarStatus } from "@/components/features/ble/BleRadarStatus";
import { ScreenWrapper } from "@/components/ui/ScreenWrapper";

export default function BleScanScreen() {
  const router = useRouter();
  const { isConnecting, connectToDevice, isPaired } = useBLE();
  const targetDeviceName = HUY_WATCH_DEVICE_NAME;
  const staleDeviceMs = 10000;
  const cleanupIntervalMs = 3000;

  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<BlePeripheral[]>([]);
  const [scanStatusMessage, setScanStatusMessage] = useState(
    "Đang khởi tạo Bluetooth..."
  );
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(
    null
  );

  const discoverListenerRef = useRef<{ remove: () => void } | null>(null);
  const stopScanListenerRef = useRef<{ remove: () => void } | null>(null);
  const stateListenerRef = useRef<{ remove: () => void } | null>(null);
  const lastSeenRef = useRef<Map<string, number>>(new Map());

  // Bắt đầu quét tự động
  const startAutoScan = useCallback(async () => {
    setIsScanning(true);
    setScanStatusMessage("Đang kiểm tra quyền Bluetooth...");

    const permResult = await requestBluetoothPermissions();
    if (!permResult.ok) {
      setIsScanning(false);
      setScanStatusMessage("Vui lòng cấp quyền Bluetooth để tiếp tục.");
      Alert.alert(
        "Cần cấp quyền Bluetooth & Vị trí",
        "Ứng dụng cần quyền Bluetooth để tìm và kết nối với đồng hồ. Vui lòng cho phép quyền Bluetooth trong Cài đặt ứng dụng.",
        [
          { text: "Hủy", style: "cancel" },
          { text: "Mở Cài đặt", onPress: () => void Linking.openSettings() },
        ]
      );
      return;
    }

    try {
      setDevices([]);
      lastSeenRef.current.clear();
      setScanStatusMessage("Đang dò tìm thiết bị đeo ở gần...");
      await BleManager.scan({
        serviceUUIDs: [],
        seconds: 0,
        allowDuplicates: true,
        scanMode: 2,
      });
    } catch (error) {
      console.error("Lỗi khi quét BLE:", error);
      setIsScanning(false);
      setScanStatusMessage("Không thể kích hoạt Bluetooth. Thử quét lại.");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initAndStartScan = async () => {
      try {
        await BleManager.checkState();
        if (isMounted) {
          void startAutoScan();
        }
      } catch (error) {
        if (isMounted) {
          console.error("Không thể khởi tạo BleManager:", error);
          setScanStatusMessage("Chưa bật Bluetooth trên điện thoại.");
        }
      }
    };

    discoverListenerRef.current = BleManager.onDiscoverPeripheral(
      (peripheral) => {
        const normalizedName = (
          peripheral.name ||
          peripheral.advertising?.localName ||
          ""
        ).toLowerCase();
        const normalizedTargetName = targetDeviceName.toLowerCase();
        const serviceUUIDs = peripheral.advertising?.serviceUUIDs ?? [];

        const isTarget =
          (normalizedName.length > 0 &&
            normalizedName.startsWith(normalizedTargetName)) ||
          serviceUUIDs.some(
            (uuid) =>
              uuid.replace(/-/g, "").toLowerCase() ===
              HUY_WATCH_SERVICE_UUID.replace(/-/g, "").toLowerCase()
          );

        if (!isTarget) {
          return;
        }

        lastSeenRef.current.set(peripheral.id, Date.now());

        setDevices((currentDevices) => {
          const alreadyExists = currentDevices.some(
            (item) => item.id === peripheral.id
          );

          if (alreadyExists) {
            return currentDevices.map((item) =>
              item.id === peripheral.id ? { ...item, ...peripheral } : item
            );
          }

          return [peripheral, ...currentDevices];
        });
      }
    );

    stopScanListenerRef.current = BleManager.onStopScan(() => {
      setIsScanning(false);
      setScanStatusMessage("Đã dừng tìm kiếm.");
    });

    stateListenerRef.current = BleManager.onDidUpdateState(({ state }) => {
      if (state === "on") {
        setScanStatusMessage("Bluetooth đã bật. Đang dò tìm...");
        void startAutoScan();
        return;
      }

      setIsScanning(false);
      setScanStatusMessage(`Bluetooth đang tắt (${state})`);
    });

    void initAndStartScan();

    const cleanupTimer = setInterval(() => {
      const now = Date.now();
      setDevices((currentDevices) =>
        currentDevices.filter((device) => {
          const lastSeen = lastSeenRef.current.get(device.id);
          return lastSeen !== undefined && now - lastSeen <= staleDeviceMs;
        })
      );
    }, cleanupIntervalMs);

    return () => {
      clearInterval(cleanupTimer);
      isMounted = false;
      discoverListenerRef.current?.remove();
      discoverListenerRef.current = null;
      stopScanListenerRef.current?.remove();
      stopScanListenerRef.current = null;
      stateListenerRef.current?.remove();
      stateListenerRef.current = null;
      void BleManager.stopScan();
    };
  }, [startAutoScan, targetDeviceName]);

  const handleConnectDevice = useCallback(
    async (device: BlePeripheral): Promise<void> => {
      const displayName =
        device.name || device.advertising?.localName || "Thiết bị HealthSense";

      try {
        setConnectingDeviceId(device.id);
        setScanStatusMessage(`Đang kết nối tới ${displayName}...`);
        await BleManager.stopScan();
        await connectToDevice(device.id, displayName);
        router.replace("/(tabs)" as any);
      } catch (error) {
        console.error("Lỗi khi kết nối thiết bị:", error);
        setConnectingDeviceId(null);
        setScanStatusMessage("Kết nối thất bại. Thử lại...");
        Alert.alert(
          "Kết nối thất bại",
          "Vui lòng đảm bảo thiết bị đang ở gần và chưa kết nối với điện thoại khác."
        );
        void startAutoScan();
      }
    },
    [connectToDevice, router, startAutoScan]
  );

  useEffect(() => {
    if (isPaired) {
      router.replace("/(tabs)" as any);
    }
  }, [isPaired, router]);

  const renderDeviceItem = useCallback(
    ({ item: device }: { item: BlePeripheral }) => (
      <DiscoveredDeviceCard
        device={device}
        isConnecting={connectingDeviceId === device.id || isConnecting}
        onConnect={handleConnectDevice}
      />
    ),
    [connectingDeviceId, isConnecting, handleConnectDevice]
  );

  return (
    <ScreenWrapper className="px-6 pt-12 pb-8 justify-between">
      {/* Top Section */}
      <View>
        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-row items-center gap-2">
            <View className="h-10 w-10 rounded-2xl bg-gradient-to-br from-medical-500 to-sky-400 items-center justify-center shadow-sm">
              <Watch color="#FFFFFF" size={22} />
            </View>
            <Text className="text-xl font-extrabold tracking-tight text-slate-800">HealthSense</Text>
          </View>

          <View className="flex-row items-center gap-2.5">
            <Pressable
              onPress={() => void startAutoScan()}
              disabled={isScanning}
              className="w-9 h-9 rounded-full bg-white border border-slate-200/80 items-center justify-center active:opacity-80"
              style={{
                shadowColor: 'rgba(13, 110, 253, 0.06)',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <RefreshCw
                color={isScanning ? "#0D6EFD" : "#64748B"}
                size={16}
                strokeWidth={2.3}
              />
            </Pressable>

            <Pressable
              onPress={() => router.replace("/(tabs)" as any)}
              className="px-4 py-1.5 rounded-full bg-white border border-slate-300/80 active:opacity-80"
              style={{
                shadowColor: 'rgba(13, 110, 253, 0.06)',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text className="text-xs font-bold text-slate-800">Vào App</Text>
            </Pressable>
          </View>
        </View>

        <Text className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight leading-snug">
          Thiết bị đeo
        </Text>
        <Text className="text-slate-500 text-[13.5px] leading-relaxed mt-1 font-medium">
          Đưa thiết bị đồng hồ sức khỏe lại gần điện thoại để tự động kết nối và đồng bộ dữ liệu.
        </Text>

        {/* Status Radar Box */}
        <BleRadarStatus
          isScanning={isScanning}
          scanStatusMessage={scanStatusMessage}
        />
      </View>

      {/* Discovered Devices List Section */}
      <View className="flex-1 mt-6 justify-end">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-[12px] font-bold text-slate-500 tracking-wider uppercase">
            THIẾT BỊ KHẢ DỤNG ({devices.length})
          </Text>
          <View className="flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-ping" />
            <Text className="text-[11px] font-medium text-slate-400">
              Sẵn sàng ghép đôi
            </Text>
          </View>
        </View>

        {devices.length === 0 ? (
          <View className="flex-1 min-h-[140px] rounded-[24px] border-2 border-dashed border-blue-200/90 bg-blue-50/40 p-6 flex flex-col items-center justify-center text-center">
            <View className="w-10 h-10 rounded-full bg-white border border-blue-200 flex items-center justify-center mb-3 shadow-sm">
              <AlertCircle color="#94A3B8" size={20} strokeWidth={2} />
            </View>
            <Text className="text-[13.5px] font-bold text-slate-700">
              Chưa tìm thấy thiết bị đeo nào ở gần.
            </Text>
            <Text className="text-[12px] text-slate-500 font-medium mt-1 max-w-[280px] leading-relaxed text-center">
              Hãy đảm bảo đồng hồ đã được bật nguồn và bật Bluetooth.
            </Text>

            <View className="mt-4 pt-3 border-t border-blue-100/80 w-full flex-row items-center justify-center gap-1.5">
              <AlertCircle color="#0D6EFD" size={14} strokeWidth={2} />
              <Text className="text-[11.5px] text-medical-500 font-semibold">
                Cách khắc phục nếu không tìm thấy
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={renderDeviceItem}
            style={{ maxHeight: 260 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}
