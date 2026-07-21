import * as RN from "react-native";

/**
 * Yêu cầu cấp quyền Bluetooth runtime cho hệ điều hành Android.
 * @returns {Promise<boolean>} Trả về true nếu tất cả quyền được cấp (hoặc hệ điều hành là iOS), ngược lại trả về false.
 */

//Lệnh yêu cầu quyền truy cập Bluetooth runtime cho Android, trả về kết quả đã cấp hay chưa
export const requestBluetoothPermissions = async (): Promise<{
  ok: boolean;
  results?: Record<string, string>;
}> => {
  // Trên iOS, các quyền Bluetooth được khai báo trong Info.plist và được cấp khi cài đặt ứng dụng, không cần yêu cầu runtime
  if (RN.Platform.OS !== "android") {
    return { ok: true };
  }

  //Chuẩn hóa Platform.Version (có thể là chuỗi hoặc số) thành giá trị SDK số
  const sdk =
    typeof RN.Platform.Version === "string"
      ? parseInt(RN.Platform.Version, 10)
      : (RN.Platform.Version as number);
  console.log(
    "[blePermissions] Android SDK version:",
    RN.Platform.Version,
    "normalized sdk:",
    sdk,
  );

  //Xây dựng danh sách các quyền runtime cần thiết cho Android tùy theo phiên bản SDK
  // Vì các yêu cầu quyền Bluetooth thay đổi qua các phiên bản Android
  const permissions: string[] = [];
  if (sdk >= 23 && sdk <= 28) {
    permissions.push(RN.PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);
  }
  if (sdk >= 29 && sdk <= 30) {
    permissions.push(RN.PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
  }
  if (sdk >= 31) {
    permissions.push(
      RN.PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      RN.PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      RN.PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
  }
  // Android 14+ may require explicit foreground service connected-device permission
  if (sdk >= 34) {
    permissions.push("android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE");
  }

  if (permissions.length === 0) {
    console.log(
      "[blePermissions] No runtime permissions required for this SDK level.",
    );
    return { ok: true };
  }

  //Tiền kiểm tra những quyền nào đã được cấp để chỉ yêu cầu những quyền chưa được cấp, tránh yêu cầu lại những quyền đã có
  const toRequest: string[] = [];
  for (const p of permissions) {
    try {
      // Some RN versions support PermissionsAndroid.check
      // @ts-ignore
      const already = await (RN.PermissionsAndroid as any).check?.(p);
      if (!already) toRequest.push(p);
    } catch (err) {
      toRequest.push(p);
    }
  }

  console.log(
    "[blePermissions] permissions to request:",
    toRequest,
    "all:",
    permissions,
  );

  if (toRequest.length === 0) {
    console.log("[blePermissions] All permissions already granted");
    return { ok: true };
  }

  const granted = await RN.PermissionsAndroid.requestMultiple(toRequest as any);
  console.log("[blePermissions] requestMultiple result:", granted);

  //Chuẩn hóa kết quả trả về thành một đối tượng map với tên quyền và trạng thái đã cấp hay chưa
  // đồng thời kiểm tra nếu có bất kỳ quyền nào bị từ chối
  const results: Record<string, string> = {};
  let allGranted = true;
  for (const p of toRequest) {
    const value = (granted as any)[p] as string;
    results[p] = value;
    if (value !== RN.PermissionsAndroid.RESULTS.GRANTED) {
      allGranted = false;
      console.warn(`[blePermissions] Permission denied: ${p} -> ${value}`);
    }
  }

  return { ok: allGranted, results };
};
