import { Platform, PermissionsAndroid, Permission } from "react-native";

let hasGrantedPermissionsCache = false;

/**
 * Yêu cầu cấp quyền Bluetooth runtime cho hệ điều hành Android.
 * @returns {Promise<boolean>} Trả về true nếu tất cả quyền được cấp (hoặc hệ điều hành là iOS), ngược lại trả về false.
 */
export const requestBluetoothPermissions = async (): Promise<{
    ok: boolean;
    results?: Record<string, string>;
}> => {
    if (hasGrantedPermissionsCache) {
        return { ok: true };
    }

    if (Platform.OS !== "android") {
        return { ok: true };
    }

    const sdk =
        typeof Platform.Version === "string"
            ? parseInt(Platform.Version, 10)
            : (Platform.Version as number);
    console.log(
        "[blePermissions] Android SDK version: ",
        Platform.Version,
        "normalized sdk:",
        sdk,
    );

    const permissions: Permission[] = [];
    if (sdk >= 23 && sdk <= 28) {
        permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);
    }
    if (sdk >= 29 && sdk <= 30) {
        permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    }
    if (sdk >= 31) {
        permissions.push(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
    }

    if (permissions.length === 0) {
        console.log(
            "[blePermissions] No runtime permissions required for this SDK level"
        );
        return { ok: true };
    }

    const checkResults = await Promise.all(
        permissions.map(async (p) => {
            try {
                const already = await PermissionsAndroid.check(p);
                return already ? null : p;
            } catch {
                return p;
            }
        })
    );

    const toRequest = checkResults.flatMap((p) => (p ? [p] : []));

    console.log(
        "[blePermissions] permissions to request:",
        toRequest,
        "all:",
        permissions
    );

    if (toRequest.length === 0) {
        console.log("[blePermissions] All permissions already granted");
        hasGrantedPermissionsCache = true;
        return { ok: true };
    }

    const granted = await PermissionsAndroid.requestMultiple(toRequest);
    console.log("[blePermissions] requestMultiple result:", granted);

    const results: Record<string, string> = {};
    let allGranted = true;
    for (const p of toRequest) {
        const value = granted[p];
        results[p] = value;
        if (value !== PermissionsAndroid.RESULTS.GRANTED) {
            allGranted = false;
            console.warn(`[blePermissions] Permission denied: ${p} -> ${value}`);
        }
    }

    if (allGranted) {
        hasGrantedPermissionsCache = true;
    }

    return { ok: allGranted, results };
};