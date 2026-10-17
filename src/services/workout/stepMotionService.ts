import { Accelerometer, Pedometer } from 'expo-sensors';
import {
  useWorkoutEngineStore,
  getDynamicStrideLengthMeters,
} from './workoutEngineStore';

let accelerometerSubscription: { remove: () => void } | null = null;
let pedometerSubscription: { remove: () => void } | null = null;

let filteredMag = 1.0;
let lastStepTime = 0;
let detectorState: 'WAIT_FOR_PEAK' | 'WAIT_FOR_TROUGH' = 'WAIT_FOR_PEAK';
let cadenceBuffer: number[] = [];
let lastPedometerSteps: number | null = null;

export const stepMotionService = {
  /**
   * Start listening to device motion sensors.
   * Uses Accelerometer as primary (100% universal across all iOS/Android devices without permissions)
   * and Hardware Pedometer as supplementary if permitted.
   */
  start: async () => {
    stepMotionService.stop();

    filteredMag = 1.0;
    lastStepTime = 0;
    detectorState = 'WAIT_FOR_PEAK';
    cadenceBuffer = [];
    lastPedometerSteps = null;

    // 1. Accelerometer Step & Motion Detection
    try {
      const isAccAvailable = await Accelerometer.isAvailableAsync().catch(() => true);
      if (isAccAvailable) {
        Accelerometer.setUpdateInterval(40); // 25 Hz
        accelerometerSubscription = Accelerometer.addListener((data) => {
          const rawMag = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
          // Low-pass filter to smooth out high-frequency jitter
          filteredMag = filteredMag * 0.65 + rawMag * 0.35;

          const now = Date.now();

          if (detectorState === 'WAIT_FOR_PEAK') {
            // Foot strike creates a distinct peak above 1.13g
            if (filteredMag > 1.13) {
              const dtMs = now - lastStepTime;
              // Refractory limit: min 270ms between steps (~max 222 steps/min)
              if (lastStepTime === 0 || dtMs >= 270) {
                detectorState = 'WAIT_FOR_TROUGH';

                let instantCadence = 105;
                if (lastStepTime > 0 && dtMs < 2500) {
                  instantCadence = Math.round(60000 / dtMs);
                  cadenceBuffer.push(instantCadence);
                  if (cadenceBuffer.length > 4) cadenceBuffer.shift();
                }
                lastStepTime = now;

                const smoothCadence =
                  cadenceBuffer.length > 0
                    ? Math.round(
                        cadenceBuffer.reduce((sum, c) => sum + c, 0) / cadenceBuffer.length
                      )
                    : instantCadence;

                const store = useWorkoutEngineStore.getState();
                const strideM = getDynamicStrideLengthMeters(
                  store.userHeightCm,
                  store.userGender,
                  smoothCadence
                );
                const strideKm = strideM / 1000;

                // Derive speed from cadence & dynamic stride
                const dtSec = Math.max(dtMs / 1000, 0.3);
                const instantSpeedMs =
                  dtMs < 2500 ? strideM / dtSec : strideM * (smoothCadence / 60);
                const instantSpeedKmh =
                  Math.round(Math.min(22, Math.max(1.2, instantSpeedMs * 3.6)) * 10) / 10;

                store.addSteps(1, instantSpeedKmh, smoothCadence, strideKm);
              }
            }
          } else if (detectorState === 'WAIT_FOR_TROUGH') {
            // After peak, vertical deceleration and leg swing drops below 0.98g
            if (filteredMag < 0.98 || now - lastStepTime > 1200) {
              detectorState = 'WAIT_FOR_PEAK';
            }
          }
        });
      }
    } catch (err) {
      console.warn('Failed to start Accelerometer step tracking:', err);
    }

    // 2. Hardware Pedometer as supplementary listener if supported & permitted
    try {
      const isPedometerAvailable = await Pedometer.isAvailableAsync().catch(() => false);
      if (isPedometerAvailable) {
        if (typeof Pedometer.requestPermissionsAsync === 'function') {
          const { status } = await Pedometer.requestPermissionsAsync().catch(() => ({
            status: 'undetermined',
          }));
          if (status !== 'granted') return;
        }

        pedometerSubscription = Pedometer.watchStepCount((result) => {
          if (typeof result.steps !== 'number' || result.steps < 0) return;
          if (lastPedometerSteps === null) {
            lastPedometerSteps = result.steps;
            return;
          }
          const delta = result.steps - lastPedometerSteps;
          lastPedometerSteps = result.steps;
          if (delta > 0) {
            const store = useWorkoutEngineStore.getState();
            store.addSteps(delta);
          }
        });
      }
    } catch {
      // Pedometer not available or denied; accelerometer is already running
    }
  },

  /**
   * Stop watching motion sensors.
   */
  stop: () => {
    if (accelerometerSubscription) {
      accelerometerSubscription.remove();
      accelerometerSubscription = null;
    }
    if (pedometerSubscription) {
      pedometerSubscription.remove();
      pedometerSubscription = null;
    }
  },
};
