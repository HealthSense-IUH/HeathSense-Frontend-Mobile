const { AndroidConfig, withAndroidManifest, withProjectBuildGradle } = require("expo/config-plugins");

const NOTIFEE_FOREGROUND_SERVICE = "app.notifee.core.ForegroundService";
const NOTIFEE_MAVEN_REPO = 'maven { url "$rootDir/../node_modules/@notifee/react-native/android/libs" }';

/**
 * Notifee khai báo ForegroundService với foregroundServiceType="shortService" trong AAR của nó, nhưng app bật service
 * này với loại connectedDevice để giữ kết nối BLE với HuyWatch chạy nền. Từ Android 14, loại truyền vào startForeground
 * phải nằm trong loại khai báo ở manifest, nếu không hệ điều hành ném IllegalArgumentException và app văng ngay sau khi
 * kết nối. Plugin này ghi đè khai báo thành connectedDevice (tools:replace khi gộp manifest).
 */
const withConnectedDeviceServiceType = (config) =>
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

/**
 * app.notifee:core không có trên Maven Central mà nằm sẵn trong node_modules. Notifee tự thêm kho này bằng
 * rootProject.allprojects lúc cấu hình module của nó, nhưng `expo run:android` chạy Gradle với --configure-on-demand nên
 * :app có thể tìm thư viện trước khi đoạn đó chạy ("Could not find any matches for app.notifee:core:+").
 * Khai báo luôn kho này trong allprojects của android/build.gradle để build cách nào cũng tìm thấy.
 */
const withNotifeeMavenRepo = (config) =>
  withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") return config;
    const contents = config.modResults.contents;
    if (contents.includes("@notifee/react-native/android/libs")) return config;

    const anchor = /allprojects\s*\{\s*repositories\s*\{/;
    if (!anchor.test(contents)) {
      throw new Error("withNotifeeConnectedDeviceService: không tìm thấy allprojects.repositories trong android/build.gradle");
    }
    config.modResults.contents = contents.replace(anchor, (match) => `${match}\n    ${NOTIFEE_MAVEN_REPO}`);
    return config;
  });

const withNotifeeConnectedDeviceService = (config) => withNotifeeMavenRepo(withConnectedDeviceServiceType(config));

module.exports = withNotifeeConnectedDeviceService;
