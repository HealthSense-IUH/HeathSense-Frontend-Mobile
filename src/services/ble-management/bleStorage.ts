import { createMMKV } from "react-native-mmkv";

export type KnownBleDevice = {
    id: string;
    name?: string | null;
    connectedAt: number;
}

const storage = createMMKV({
    id: "huywatch-ble-storage",
});

const KNOWN_DEVICE_KEY = "knowBleDevice";

export const bleStorage = {
    getKnownDevice(): KnownBleDevice | null {
        const raw = storage.getString(KNOWN_DEVICE_KEY);

        if(!raw){
            return null;
        }

        try{
            return JSON.parse(raw) as KnownBleDevice;
        }catch(err){
            storage.remove(KNOWN_DEVICE_KEY);
            return null;
        }
    },

    setKnownDevice(device: KnownBleDevice){
        storage.set(KNOWN_DEVICE_KEY, JSON.stringify(device));
    },

    clearKnownDevice (){
        storage.remove(KNOWN_DEVICE_KEY);
    },
};