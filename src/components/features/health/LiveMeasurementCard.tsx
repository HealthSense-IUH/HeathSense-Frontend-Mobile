import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { Droplets, HeartPulse } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useBleStore } from '@/services/ble-management/bleStore';
import { buildPpgPath } from '@/utils/livePpg';

export function LiveMeasurementCard() {
  const { t } = useTranslation('health');
  const { samples, bpm, spo2, receivedAt, connected } = useBleStore(useShallow(state => ({
    samples: state.livePpgSamples,
    bpm: state.liveBPM,
    spo2: state.liveSpO2,
    receivedAt: state.lastPpgAt,
    connected: state.status === 'connected',
  })));
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const fresh = connected && receivedAt !== null && Math.max(0, now - receivedAt) < 2000;
  const path = useMemo(() => buildPpgPath(samples.map(sample => sample.ir)), [samples]);
  const status = !connected
    ? t('measure.live.disconnected')
    : receivedAt === null
      ? t('measure.live.waiting')
      : fresh ? t('measure.live.receiving') : t('measure.live.paused');

  return (
    <View className="rounded-3xl bg-white border border-blue-100 p-4 mb-4">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-sm font-bold text-slate-800">{t('measure.live.title')}</Text>
        <Text className="text-[10px] font-semibold text-slate-500">{status}</Text>
      </View>
      <View className="flex-row gap-3 mb-3">
        <View className="flex-1 rounded-2xl bg-rose-50 px-3 py-2.5">
          <View className="flex-row items-center gap-1.5">
            <HeartPulse size={14} color="#E11D48" />
            <Text className="text-xs font-medium text-rose-700">{t('measure.live.heartRate')}</Text>
          </View>
          <Text accessibilityLiveRegion="polite" className="text-2xl font-bold text-rose-600 mt-1">
            {fresh && bpm !== null ? bpm : '--'}
            <Text className="text-xs font-medium"> {t('common:units.bpm')}</Text>
          </Text>
        </View>
        <View className="flex-1 rounded-2xl bg-cyan-50 px-3 py-2.5">
          <View className="flex-row items-center gap-1.5">
            <Droplets size={14} color="#0891B2" />
            <Text className="text-xs font-medium text-cyan-700">SpO2</Text>
          </View>
          <Text accessibilityLiveRegion="polite" className="text-2xl font-bold text-cyan-600 mt-1">
            {fresh && spo2 !== null ? spo2 : '--'}
            <Text className="text-xs font-medium"> %</Text>
          </Text>
        </View>
      </View>
      <View className="rounded-xl bg-slate-50 overflow-hidden" accessibilityLabel={t('measure.live.waveform')}>
        <Svg width="100%" height={88} viewBox="0 0 300 88" preserveAspectRatio="none">
          {[22, 44, 66].map(y => <Line key={y} x1={0} y1={y} x2={300} y2={y} stroke="#E2E8F0" strokeWidth={0.5} />)}
          {fresh && path ? <Path d={path} fill="none" stroke="#0D6EFD" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" /> : null}
        </Svg>
        {!fresh || !path ? (
          <View className="absolute inset-0 items-center justify-center">
            <Text className="text-xs text-slate-400">{status}</Text>
          </View>
        ) : null}
      </View>
      <Text className="text-[10px] leading-4 text-slate-400 mt-2">{t('measure.live.note')}</Text>
    </View>
  );
}
