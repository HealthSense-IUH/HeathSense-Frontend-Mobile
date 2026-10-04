import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { AlertCircle, HelpCircle, RefreshCw } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
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
import { StitchSmartwatchIcon } from "@/components/ui/icons/StitchIcons";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { THEME } from "@/constants/theme";

/** Khóa i18n (namespace auth) của dòng trạng thái quét; dịch lúc render để đổi ngôn ngữ vẫn đúng. */
type ScanStatusKey =
  | "scan.status.searching"
  | "scan.status.checkingPermission"
  | "scan.status.permissionRequired"
  | "scan.status.activateFailed"
  | "scan.status.bluetoothNotEnabled"
  | "scan.status.bluetoothOff"
  | "scan.status.stopped";

export default function BleScanScreen() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isConnecting, connectToDevice, isPaired } = useBLE();
  const targetDeviceName = HUY_WATCH_DEVICE_NAME;
  const staleDeviceMs = 10000;
  const cleanupIntervalMs = 3000;

  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<BlePeripheral[]>([]);
  const [scanStatusKey, setScanStatusKey] = useState<ScanStatusKey>(
    "scan.status.searching"
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
    setScanStatusKey("scan.status.checkingPermission");

    const permResult = await requestBluetoothPermissions();
    if (!permResult.ok) {
      setIsScanning(false);
      setScanStatusKey("scan.status.permissionRequired");
      Alert.alert(
        t("scan.permissionAlert.title"),
        t("scan.permissionAlert.message"),
        [
          { text: t("common:actions.cancel"), style: "cancel" },
          { text: t("scan.permissionAlert.openSettings"), onPress: () => void Linking.openSettings() },
        ]
      );
      return;
    }

    try {
      setDevices([]);
      lastSeenRef.current.clear();
      setScanStatusKey("scan.status.searching");
      await BleManager.scan({
        serviceUUIDs: [],
        seconds: 0,
        allowDuplicates: true,
        scanMode: 2,
      });
    } catch (error) {
      console.error("Lỗi khi quét BLE:", error);
      setIsScanning(false);
      setScanStatusKey("scan.status.activateFailed");
    }
  }, [t]);

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
          setScanStatusKey("scan.status.bluetoothNotEnabled");
        }
      }
    };

    void initAndStartScan();

    stateListenerRef.current = BleManager.onDidUpdateState?.((args: any) => {
      const state = args?.state;
      if (state === "on") {
        void startAutoScan();
      } else if (state === "off") {
        setIsScanning(false);
        setScanStatusKey("scan.status.bluetoothOff");
      }
    });

    discoverListenerRef.current = BleManager.onDiscoverPeripheral?.(
      (peripheral: BlePeripheral) => {
        const localName = peripheral.advertising?.localName || "";
        const peripheralName = peripheral.name || "";
        const serviceUUIDs = peripheral.advertising?.serviceUUIDs || [];

        const isTargetByName =
          localName.toLowerCase().includes(targetDeviceName.toLowerCase()) ||
          peripheralName.toLowerCase().includes(targetDeviceName.toLowerCase()) ||
          localName.toLowerCase().includes("healthsense") ||
          peripheralName.toLowerCase().includes("healthsense");

        const isTargetByUUID = serviceUUIDs.some(
          (uuid) => uuid.toLowerCase() === HUY_WATCH_SERVICE_UUID.toLowerCase()
        );

        // Chỉ hiển thị thiết bị đồng hồ sức khỏe thực tế, không quét các thiết bị lạ khác
        if (!isTargetByName && !isTargetByUUID) {
          return;
        }

        const now = Date.now();
        lastSeenRef.current.set(peripheral.id, now);

        setDevices((prev) => {
          const index = prev.findIndex((item) => item.id === peripheral.id);
          if (index !== -1) {
            const next = [...prev];
            next[index] = { ...next[index], ...peripheral };
            return next;
          }
          return [peripheral, ...prev];
        });
      }
    );

    stopScanListenerRef.current = BleManager.onStopScan?.(() => {
      setIsScanning(false);
      setScanStatusKey("scan.status.stopped");
    });

    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setDevices((prev) => {
        let changed = false;
        const filtered = prev.filter((device) => {
          const lastSeen = lastSeenRef.current.get(device.id) || 0;
          const isFresh = now - lastSeen <= staleDeviceMs;
          if (!isFresh) {
            changed = true;
            lastSeenRef.current.delete(device.id);
          }
          return isFresh;
        });
        return changed ? filtered : prev;
      });
    }, cleanupIntervalMs);

    return () => {
      isMounted = false;
      clearInterval(cleanupInterval);
      discoverListenerRef.current?.remove?.();
      stopScanListenerRef.current?.remove?.();
      stateListenerRef.current?.remove?.();
      void BleManager.stopScan().catch(() => {});
    };
  }, [startAutoScan, targetDeviceName]);

  const handleConnectDevice = useCallback(
    async (device: BlePeripheral) => {
      setConnectingDeviceId(device.id);
      try {
        await BleManager.stopScan();
        setIsScanning(false);
        await connectToDevice(device.id);
        router.replace("/(tabs)" as any);
      } catch (error) {
        console.error("Lỗi khi kết nối thiết bị:", error);
        Alert.alert(
          t("scan.connectFailed.title"),
          t("scan.connectFailed.message")
        );
        void startAutoScan();
      } finally {
        setConnectingDeviceId(null);
      }
    },
    [connectToDevice, router, startAutoScan, t]
  );

  useEffect(() => {
    if (isPaired) {
      router.replace("/(tabs)" as any);
    }
  }, [isPaired, router]);

  const handleShowTroubleshooting = () => {
    Alert.alert(
      t("scan.troubleshooting.title"),
      t("scan.troubleshooting.steps"),
      [{ text: t("scan.troubleshooting.ok"), style: "default" }]
    );
  };

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
    <ScreenWrapper className="flex-1">
      {/* Ambient Medical Gradient Glow Background (Stitch specs) */}
      <View
        className="absolute -top-32 -left-20 w-80 h-80 rounded-full bg-blue-200/40 pointer-events-none"
        style={{ opacity: 0.6 }}
      />
      <View
        className="absolute top-1/3 -right-24 w-72 h-72 rounded-full bg-sky-200/30 pointer-events-none"
        style={{ opacity: 0.5 }}
      />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "space-between",
          paddingHorizontal: 20, // 1.25rem (px-5)
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 24),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          {/* BEGIN: NavigationHeader (100% Stitch match) */}
          <View className="flex-row items-center justify-between mb-6">
            {/* Left: Brand Logo & Title */}
            <View className="flex-row items-center space-x-2.5">
              <LinearGradient
                colors={[THEME.colors.primary, "#38BDF8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "rgba(13, 110, 253, 0.25)",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 1,
                  shadowRadius: 10,
                  elevation: 4,
                  marginRight: 10,
                }}
              >
                <StitchSmartwatchIcon size={20} color="#FFFFFF" strokeWidth={2.2} />
              </LinearGradient>
              <Text className="text-xl font-extrabold tracking-tight text-slate-900">
                HealthSense
              </Text>
            </View>

            {/* Right: Action Buttons */}
            <View className="flex-row items-center space-x-2">
              {/* Refresh / Rescan Button */}
              <Pressable
                onPress={() => void startAutoScan()}
                disabled={isScanning}
                aria-label={t("scan.refresh")}
                className="w-9 h-9 rounded-full bg-white border border-slate-200/80 items-center justify-center shadow-sm active:opacity-80 mr-2"
                style={{
                  shadowColor: "rgba(13, 110, 253, 0.08)",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 1,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                <RefreshCw
                  color={THEME.colors.primary}
                  size={16}
                  strokeWidth={2.3}
                  className={isScanning ? "animate-spin" : ""}
                />
              </Pressable>

              {/* Skip / Enter App Pill Button */}
              <Pressable
                onPress={() => router.replace("/(tabs)" as any)}
                className="px-4 py-1.5 rounded-full bg-white border border-slate-300/80 shadow-sm active:opacity-80"
                style={{
                  shadowColor: "rgba(13, 110, 253, 0.06)",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 1,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                <Text className="text-xs font-bold text-slate-800">{t("scan.enterApp")}</Text>
              </Pressable>
            </View>
          </View>
          {/* END: NavigationHeader */}

          {/* BEGIN: TitleSection */}
          <View className="mb-5">
            <Text className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight leading-snug">
              {t("scan.title")}
            </Text>
            <Text className="text-slate-500 text-[13.5px] leading-relaxed mt-1 font-medium">
              {t("scan.subtitle")}
            </Text>
          </View>
          {/* END: TitleSection */}

          {/* BEGIN: BleRadarScanningCard */}
          <BleRadarStatus
            isScanning={isScanning}
            scanStatusMessage={t(scanStatusKey)}
          />
          {/* END: BleRadarScanningCard */}
        </View>

        {/* BEGIN: AvailableDevicesSection */}
        <View className="flex-1 mt-2 justify-end">
          {/* Section Header */}
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-[12px] font-bold text-slate-500 tracking-wider uppercase">
              {t("scan.availableDevices", { count: devices.length })}
            </Text>
            <View className="flex-row items-center">
              <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-ping" />
              <Text className="text-[11px] font-medium text-slate-400">
                {t("scan.readyToPair")}
              </Text>
            </View>
          </View>

          {/* Devices List or Empty State */}
          {devices.length === 0 ? (
            <View className="min-h-[140px] rounded-[24px] border-2 border-dashed border-blue-200/90 bg-blue-50/40 p-6 flex flex-col items-center justify-center text-center">
              <View className="w-10 h-10 rounded-full bg-white border border-blue-200 flex items-center justify-center mb-3 shadow-sm">
                <AlertCircle color="#94A3B8" size={20} strokeWidth={2} />
              </View>
              <Text className="text-[13.5px] font-bold text-slate-700">
                {t("scan.empty.title")}
              </Text>
              <Text className="text-[12px] text-slate-500 font-medium mt-1 max-w-[280px] leading-relaxed text-center">
                {t("scan.empty.hint")}
              </Text>

              <Pressable
                onPress={handleShowTroubleshooting}
                className="mt-4 pt-3 border-t border-blue-100/80 w-full flex-row items-center justify-center gap-1.5 active:opacity-75"
              >
                <HelpCircle color={THEME.colors.primary} size={14} strokeWidth={2} />
                <Text className="text-[11.5px] text-primary font-semibold" style={{ color: THEME.colors.primary }}>
                  {t("scan.empty.help")}
                </Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={devices}
              keyExtractor={(item) => item.id}
              renderItem={renderDeviceItem}
              scrollEnabled={false}
            />
          )}
        </View>
        {/* END: AvailableDevicesSection */}
      </ScrollView>
    </ScreenWrapper>
  );
}
