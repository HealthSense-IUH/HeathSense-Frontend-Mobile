import { useRouter } from "expo-router";
import { AlertCircle, ChevronRight, Radio, RefreshCw, Watch } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";
import BleManager from "react-native-ble-manager";
import {
  HUY_WATCH_DEVICE_NAME,
  HUY_WATCH_SERVICE_UUID,
} from "@/services/ble-management/bleConstants";
import { useBLE } from "@/context/BLEContext";
import { requestBluetoothPermissions } from "@/utils/blePermissions";

type BlePeripheral = {
  id: string;
  name?: string | null;
  advertising?: {
    localName?: string | null;
    isConnectable?: boolean;
    rssi?: number;
    serviceUUIDs?: string[];
  };
  rssi?: number;
};

export default function BleScanScreen() {
  const router = useRouter();
  const { isConnecting, connectToDevice, isPaired } = useBLE();
  const targetDeviceName = HUY_WATCH_DEVICE_NAME;
  const staleDeviceMs = 10000;
  const cleanupIntervalMs = 3000;

  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<BlePeripheral[]>([]);
  const [scanStatusMessage, setScanStatusMessage] = useState("Đang khởi tạo Bluetooth...");
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null);

  const discoverListenerRef = useRef<{ remove: () => void } | null>(null);
  const stopScanListenerRef = useRef<{ remove: () => void } | null>(null);
  const stateListenerRef = useRef<{ remove: () => void } | null>(null);
  const lastSeenRef = useRef<Map<string, number>>(new Map());

  // Bắt đầu quét tự động
  const startAutoScan = async () => {
    setIsScanning(true);
    setScanStatusMessage("Đang kiểm tra quyền Bluetooth...");

    const permResult = await requestBluetoothPermissions();
    if (!permResult.ok) {
      setIsScanning(false);
      setScanStatusMessage("Vui lòng cấp quyền Bluetooth để tiếp tục.");
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
  };

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
              HUY_WATCH_SERVICE_UUID.replace(/-/g, "").toLowerCase(),
          );

        if (!isTarget) {
          return;
        }

        lastSeenRef.current.set(peripheral.id, Date.now());

        setDevices((currentDevices) => {
          const alreadyExists = currentDevices.some(
            (item) => item.id === peripheral.id,
          );

          if (alreadyExists) {
            return currentDevices.map((item) =>
              item.id === peripheral.id ? { ...item, ...peripheral } : item,
            );
          }

          return [peripheral, ...currentDevices];
        });
      },
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
        }),
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
  }, []);

  const handleConnectDevice = async (device: BlePeripheral): Promise<void> => {
    const displayName =
      device.name || device.advertising?.localName || "Thiết bị HealthSense";

    try {
      setConnectingDeviceId(device.id);
      setScanStatusMessage(`Đang kết nối tới ${displayName}...`);
      await BleManager.stopScan();
      await connectToDevice(device.id, displayName);
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Lỗi khi kết nối thiết bị:", error);
      setConnectingDeviceId(null);
      setScanStatusMessage("Kết nối thất bại. Thử lại...");
      Alert.alert("Kết nối thất bại", "Vui lòng đảm bảo thiết bị đang ở gần và chưa kết nối với điện thoại khác.");
      void startAutoScan();
    }
  };

  useEffect(() => {
    if (isPaired) {
      router.replace("/(tabs)");
    }
  }, [isPaired]);

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
              <RefreshCw color={isScanning ? "#0F67FE" : "#64748B"} size={18} className={isScanning ? "animate-spin" : ""} />
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
        <View className="mt-8 bg-card rounded-3xl p-6 border border-border shadow-sm items-center justify-center">
          <View className="relative items-center justify-center my-4">
            <View className={`h-24 w-24 rounded-full bg-primary/10 items-center justify-center ${isScanning ? "animate-ping opacity-75" : ""}`} />
            <View className="absolute h-16 w-16 rounded-full bg-primary/20 items-center justify-center">
              <Radio color="#0F67FE" size={32} />
            </View>
          </View>

          <Text className="text-base font-bold text-foreground mt-2 text-center">
            {scanStatusMessage}
          </Text>
          
          {isScanning && (
            <View className="flex-row items-center gap-2 mt-2">
              <ActivityIndicator size="small" color="#0F67FE" />
              <Text className="text-xs font-semibold text-primary">Đang tự động quét BLE...</Text>
            </View>
          )}
        </View>
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
          <ScrollView className="max-h-[260px]" showsVerticalScrollIndicator={false}>
            {devices.map((device) => {
              const displayName =
                device.name ||
                device.advertising?.localName ||
                "HuyWatch Device";
              const isConnectingThis = connectingDeviceId === device.id || isConnecting;

              return (
                <View 
                  key={device.id} 
                  className="bg-card rounded-2xl p-4 border border-border mb-3 flex-row items-center justify-between shadow-sm"
                >
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="h-12 w-12 rounded-2xl bg-zoi-10 border border-zoi-20 items-center justify-center">
                      <Watch color="#55A316" size={24} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-foreground" numberOfLines={1}>
                        {displayName}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
                        {device.id}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    className={`ml-3 px-5 py-3 rounded-xl bg-primary flex-row items-center gap-1 active:opacity-80 ${
                      isConnectingThis ? "opacity-70" : ""
                    }`}
                    onPress={() => void handleConnectDevice(device)}
                    disabled={isConnectingThis}
                  >
                    {isConnectingThis ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <Text className="text-white font-bold text-sm">Kết nối</Text>
                        <ChevronRight color="#ffffff" size={16} />
                      </>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
