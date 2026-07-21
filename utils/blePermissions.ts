import * as RN from "react-native";

/**
 * Yêu cầu cấp quyền Bluetooth runtime cho hệ điều hành Android.
 * @returns {Promise<boolean>} Trả về true nếu tất cả quyền được cấp (hoặc hệ điều hành là iOS), ngược lại trả về false.
 */

export const requestBluetoothPermissions = async (): Promise<{
    ok: boolean;
    results?: Record<string, string>;
}> => {
    if(RN.Platform.OS != "android"){
        return {ok: true};
    }

    const sdk=
        typeof RN.Platform.Version === "string"
            ? parseInt(RN.Platform.Version, 10)
            : (RN.Platform.Version as number);
    console.log(
        "[blePermissions] Android SDK version: ",
        RN.Platform.Version,
        "normalized sdk:",
        sdk,
    );

    const permissions: string[] = [];
    if(sdk >= 23 && sdk <= 28){
        permissions.push(RN.PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);
    }
    if (sdk >= 29 && sdk <= 30){
        permissions.push(RN.PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    }
    if (sdk >= 31){
        permissions.push(
            RN.PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            RN.PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        );
    }

    if(sdk >= 34){
        permissions.push(
            "android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE"
        );
    }

    if(permissions.length === 0){
        console.log(
            "[blePermissions] No runtime permissions required for this SDK level"
        );
        return {ok: true};
    }

    const toRequest: string[] = [];
    for(const p of permissions){
        try{
            const already = await (RN.PermissionsAndroid as any).check?.(p);
            if(!already) toRequest.push(p);
        }catch(err){
            toRequest.push(p);
        }
    }

    console.log(
        "[blePermissions] permissions to request:",
        toRequest,
        "all:",
        permissions
    );

    if (toRequest.length === 0){
        console.log("[blePermissions] All permissions already granted");
        return {ok: true};
    }

    const granted = await RN.PermissionsAndroid.requestMultiple(toRequest as any);
    console.log("[blePermissions] requestMultiple result:", granted);

    const results: Record<string, string> = {};
    let allGranted = true;
    for (const p of toRequest){
        const value = (granted as any)[p] as string;
        results[p] = value;
        if(value !== RN.PermissionsAndroid.RESULTS.GRANTED){
            allGranted = false;
            console.warn(`[blePermissions] Permission denied: ${p} -> ${value}`);
        }
    }

    return {ok: allGranted, results};
}