const { AndroidConfig, withAndroidManifest } = require("expo/config-plugins");

const NOTIFEE_FOREGROUND_SERVICE = "app.notifee.core.ForegroundService";

/**
 * Notifee khai báo ForegroundService với foregroundServiceType="shortService" trong AAR của nó, nhưng app bật service
 * này với loại connectedDevice để giữ kết nối BLE với HuyWatch chạy nền. Từ Android 14, loại truyền vào startForeground
 * phải nằm trong loại khai báo ở manifest, nếu không hệ điều hành ném IllegalArgumentException và app văng ngay sau khi
 * kết nối. Plugin này ghi đè khai báo thành connectedDevice (tools:replace khi gộp manifest).
 */
const withNotifeeConnectedDeviceService = (config) =>
  withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest.$ = { ...manifest.$, "xmlns:tools": "http://schemas.android.com/tools" };

    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    application.service = (application.service ?? []).filter(
      (service) => service.$?.["android:name"] !== NOTIFEE_FOREGROUND_SERVICE,
    );
    application.service.push({
      $: {
        "android:name": NOTIFEE_FOREGROUND_SERVICE,
        "android:exported": "false",
        "android:foregroundServiceType": "connectedDevice",
        "tools:replace": "android:foregroundServiceType",
      },
    });

    return config;
  });

module.exports = withNotifeeConnectedDeviceService;
