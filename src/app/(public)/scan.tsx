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
    <View className="flex-1 bg-background px-6 pt-16 pb-8 justify-between">
      {/* Top Section */}
      <View>
        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-row items-center gap-2">
            <View className="h-10 w-10 rounded-2xl bg-primary/10 items-center justify-center">
              <Watch color="#0F67FE" size={22} />
            </View>
            <Text className="text-xl font-bold text-foreground">HealthSense</Text>
          </View>

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => void startAutoScan()}
              disabled={isScanning}
              className="h-10 w-10 rounded-full bg-card border border-border items-center justify-center active:opacity-70"
            >
              <RefreshCw
                color={isScanning ? "#0F67FE" : "#64748B"}
                size={18}
              />
            </Pressable>

            <Pressable
              onPress={() => router.replace("/(tabs)" as any)}
              className="px-3.5 py-2 rounded-xl bg-card border border-border flex-row items-center active:opacity-70"
            >
              <Text className="text-xs font-bold text-foreground">Vào App</Text>
            </Pressable>
          </View>
        </View>

        <Text className="text-3xl font-extrabold text-foreground tracking-tight">
          Thiết bị đeo
        </Text>
        <Text className="text-sm text-muted-foreground mt-2 leading-relaxed">
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
          <Text className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Thiết bị khả dụng ({devices.length})
          </Text>
        </View>

        {devices.length === 0 ? (
          <View className="bg-card/50 rounded-2xl p-5 border border-dashed border-border items-center justify-center">
            <AlertCircle color="#94A3B8" size={24} />
            <Text className="text-sm font-medium text-muted-foreground mt-2 text-center">
              Chưa tìm thấy thiết bị đeo nào ở gần.
            </Text>
            <Text className="text-xs text-muted-foreground/70 mt-1 text-center">
              Hãy đảm bảo đồng hồ đã được bật nguồn và bật Bluetooth.
            </Text>
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
    </View>
  );
}
