import { useWorkoutEngineStore } from './workoutEngineStore';

let LocationModule: typeof import('expo-location') | null = null;
try {
  LocationModule = require('expo-location');
} catch (e) {
  console.warn('ExpoLocation native module not available in this client binary, falling back to simulated motion.');
}

let locationSubscription: any = null;
let simulationIntervalTimer: ReturnType<typeof setInterval> | null = null;
let lastKnownCoord: { latitude: number; longitude: number; timestamp: number } | null = null;

// Starting simulated coordinates (Ho Chi Minh City / IUH area)
let simLat = 10.8225;
let simLng = 106.6881;

/**
 * Service to manage GPS location tracking for outdoor workouts.
 * Safely guards against missing native binary modules in older Dev Client builds.
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
   * Start listening for GPS location updates or fall back to smooth simulation.
   */
  startTracking: async (): Promise<boolean> => {
    // 1. If native ExpoLocation module is available, use real hardware GPS
    if (LocationModule && LocationModule.watchPositionAsync) {
      try {
        const hasPermission = await locationTrackingService.requestPermissions();
        if (hasPermission) {
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
            lastKnownCoord = {
              latitude: initialPos.coords.latitude,
              longitude: initialPos.coords.longitude,
              timestamp: Date.now(),
            };
          }

          locationSubscription = await LocationModule.watchPositionAsync(
            {
              accuracy: LocationModule.Accuracy.BestForNavigation,
              timeInterval: 1000,
              distanceInterval: 2,
            },
            (loc: any) => {
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
        }
      } catch (err) {
        console.warn('Real GPS failed, falling back to simulated GPS motion:', err);
      }
    }

    // 2. Fallback: Smooth Simulated GPS Motion (for older Dev Clients without rebuilding)
    await locationTrackingService.stopTracking();

    // Initial position
    useWorkoutEngineStore.getState().updateGpsLocation({
      latitude: simLat,
      longitude: simLng,
      speed: 2.5, // ~9 km/h running pace
    });

    simulationIntervalTimer = setInterval(() => {
      // Simulate forward movement (~2.5 meters per second)
      simLat += 0.00002;
      simLng += 0.000015;

      useWorkoutEngineStore.getState().updateGpsLocation({
        latitude: simLat,
        longitude: simLng,
        speed: 2.5,
      });

      // Also add 2 running steps per second (~150-160 spm cadence)
      useWorkoutEngineStore.getState().addSteps(2);
    }, 1000);

    return true;
  },

  /**
   * Stop watching GPS updates and release subscriptions/timers.
   */
  stopTracking: async (): Promise<void> => {
    if (locationSubscription && locationSubscription.remove) {
      locationSubscription.remove();
      locationSubscription = null;
    }
    if (simulationIntervalTimer) {
      clearInterval(simulationIntervalTimer);
      simulationIntervalTimer = null;
    }
    lastKnownCoord = null;
  },

  /**
   * Check if location tracking is currently active.
   */
  isTracking: (): boolean => {
    return locationSubscription !== null || simulationIntervalTimer !== null;
  },
};
