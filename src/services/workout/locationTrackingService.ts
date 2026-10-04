import { useWorkoutEngineStore } from './workoutEngineStore';

let LocationModule: typeof import('expo-location') | null = null;
try {
  LocationModule = require('expo-location');
} catch {
  console.warn('ExpoLocation native module not available in this client binary; GPS tracking is disabled.');
}

let locationSubscription: { remove: () => void } | null = null;

/**
 * Theo dõi GPS cho buổi tập ngoài trời. Chỉ dùng GPS thật: không có module, bị từ chối quyền hoặc lỗi
 * thì không theo dõi (trả về false) — không bao giờ tự sinh quãng đường / số bước giả vào buổi tập.
 */
export const locationTrackingService = {
  /**
   * Request foreground location permissions.
   */
  requestPermissions: async (): Promise<boolean> => {
    if (!LocationModule || !LocationModule.requestForegroundPermissionsAsync) {
      return false;
    }
    try {
      const { status } = await LocationModule.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (err) {
      console.warn('Failed to request location permissions:', err);
      return false;
    }
  },

  /**
   * Start listening for GPS location updates. Returns false when GPS is unavailable or not permitted.
   */
  startTracking: async (): Promise<boolean> => {
    if (!LocationModule || !LocationModule.watchPositionAsync) return false;

    try {
      const hasPermission = await locationTrackingService.requestPermissions();
      if (!hasPermission) return false;

      await locationTrackingService.stopTracking();

      const initialPos = await LocationModule.getCurrentPositionAsync({
        accuracy: LocationModule.Accuracy.High,
      }).catch(() => null);

      if (initialPos) {
        useWorkoutEngineStore.getState().updateGpsLocation({
          latitude: initialPos.coords.latitude,
          longitude: initialPos.coords.longitude,
          altitude: initialPos.coords.altitude ?? undefined,
          speed: initialPos.coords.speed ?? undefined,
        });
      }

      locationSubscription = await LocationModule.watchPositionAsync(
        {
          accuracy: LocationModule.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 2,
        },
        (loc) => {
          const { coords } = loc;
          if (coords.accuracy && coords.accuracy > 25) return;

          useWorkoutEngineStore.getState().updateGpsLocation({
            latitude: coords.latitude,
            longitude: coords.longitude,
            altitude: coords.altitude ?? undefined,
            speed: coords.speed ?? undefined,
          });
        }
      );

      return true;
    } catch (err) {
      console.warn('GPS tracking failed to start:', err);
      return false;
    }
  },

  /**
   * Stop watching GPS updates and release subscriptions.
   */
  stopTracking: async (): Promise<void> => {
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }
  },

  /**
   * Check if location tracking is currently active.
   */
  isTracking: (): boolean => locationSubscription !== null,
};
