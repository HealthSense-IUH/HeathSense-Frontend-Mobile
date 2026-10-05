/** Draw the actual IR samples, normalized only for display; never generate a mock pulse. */
export function buildPpgPath(samples: readonly number[], width = 300, height = 88): string {
  if (samples.length < 2 || samples.some(value => !Number.isFinite(value))) return '';
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const range = max - min;
  const padding = 8;
  return samples.map((value, index) => {
    const x = index * width / (samples.length - 1);
    const y = range === 0 ? height / 2 : height - padding - (value - min) / range * (height - 2 * padding);
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

/** Firmware uses zero until a vital is available; do not display it as a measurement. */
export function getLiveVitals(sample?: { bpm?: number | null; spo2?: number | null }) {
  const bpm = sample?.bpm;
  const spo2 = sample?.spo2;
  return {
    liveBPM: typeof bpm === 'number' && Number.isFinite(bpm) && bpm > 0 && bpm <= 255 ? bpm : null,
    liveSpO2: typeof spo2 === 'number' && Number.isFinite(spo2) && spo2 > 0 && spo2 <= 100 ? spo2 : null,
  };
}
