import notifee from "@notifee/react-native";
import type { Permission } from "react-native";
import { PermissionsAndroid, Platform } from "react-native";

const ensureConnectedDevicePermission = async (): Promise<boolean> => {
  if (Platform.OS !== "android") return true;

  const sdk =
    typeof Platform.Version === "string"
      ? parseInt(Platform.Version, 10)
      : (Platform.Version as number);

  if (sdk < 34) return true;

  try {
    const result = await PermissionsAndroid.request(
      "android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE" as Permission,
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn("Failed to request FOREGROUND_SERVICE_CONNECTED_DEVICE:", err);
    return false;
  }
};

/**
 * Register notifee foreground service only after required permission is granted
 * to avoid SecurityException when targetSdk >= 36 and using connectedDevice FGS.
 */
(async () => {
  const ok = await ensureConnectedDevicePermission();

  if (!ok) {
    console.warn(
      "FOREGROUND_SERVICE_CONNECTED_DEVICE permission not granted; skipping notifee foreground service registration.",
    );
    return;
  }

  notifee.registerForegroundService(() => {
    return new Promise<void>(() => {
      // Keep the Android foreground service alive until stopForegroundService is called.
    });
  });
})();
