import React, { useState } from 'react';
import { LayoutChangeEvent, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { Activity, Droplets, Gauge, HeartPulse, ShieldAlert, ShieldCheck, Wind } from 'lucide-react-native';
import type { HrvFeatures } from '@/types/health-records';

const PRIMARY = '#0D6EFD';
const PRIMARY_DARK = '#00419E';

function asNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
}

/** Huy hiệu chất lượng tín hiệu (SQI) của phép đo. */
function SqiBadge({ features }: { features: HrvFeatures }) {
  if (typeof features.sqi_ok !== 'boolean') return null;
  const ok = features.sqi_ok;
  const ratio =
    typeof features.sqi_valid_ratio === 'number'
      ? ` • ${(features.sqi_valid_ratio * 100).toFixed(0)}% nhịp hợp lệ`
      : '';

  return (
    <View
      className="flex-row items-center self-start rounded-full border px-2.5 py-1"
      style={{
        gap: 6,
        backgroundColor: ok ? '#ECFDF5' : '#FEF2F2',
        borderColor: ok ? '#A7F3D0' : '#FECACA',
      }}
    >
      {ok ? <ShieldCheck size={13} color="#047857" /> : <ShieldAlert size={13} color="#B91C1C" />}
      <Text className="text-[11px] font-semibold" style={{ color: ok ? '#047857' : '#B91C1C' }}>
        {ok ? `Chất lượng đo: Tốt${ratio}` : 'Chất lượng đo: Kém — nên đo lại'}
      </Text>
    </View>
  );
}

interface MetricTile {
  key: string;
  Icon: typeof Activity;
  label: string;
  value: string;
  unit?: string;
  note?: string;
}

function buildExtraTiles(f: HrvFeatures): MetricTile[] {
  const tiles: MetricTile[] = [];
  if (typeof f.deviceSpO2 === 'number') {
    tiles.push({ key: 'spo2', Icon: Droplets, label: 'SpO2', value: f.deviceSpO2.toFixed(0), unit: '%', note: 'Tham khảo (đo tại thiết bị)' });
  }
  if (typeof f.respiratoryRate === 'number') {
    tiles.push({ key: 'resp', Icon: Wind, label: 'Nhịp thở', value: f.respiratoryRate.toFixed(1), unit: 'lần/phút', note: '12 - 20 lần/phút' });
  }
  if (typeof f.hrMin === 'number' && typeof f.hrMax === 'number') {
    tiles.push({ key: 'hrrange', Icon: HeartPulse, label: 'Nhịp tim min - max', value: `${f.hrMin.toFixed(0)} - ${f.hrMax.toFixed(0)}`, unit: 'BPM', note: 'Trong phiên đo' });
  }
  if (typeof f.perfusionIndex === 'number') {
    tiles.push({ key: 'pi', Icon: Activity, label: 'Chỉ số tưới máu (PI)', value: f.perfusionIndex.toFixed(2), unit: '%', note: 'Thấp → đeo lỏng / tưới máu yếu' });
  }
  // Điểm căng thẳng mất ý nghĩa khi nhịp quá bất thường (AFib) nên ẩn đi
  const irregular = typeof f.pNN50 === 'number' && f.pNN50 > 40;
  if (typeof f.stressScore === 'number' && !irregular) {
    tiles.push({ key: 'stress', Icon: Gauge, label: 'Điểm căng thẳng', value: String(f.stressScore), unit: '/100', note: 'Tham khảo (Baevsky SI)' });
  }
  return tiles;
}

/** Sóng mạch PPG: 300 điểm đã chuẩn hóa 0-100, vẽ thành vùng tô gradient. */
function PpgWave({ wave, width }: { wave: number[]; width: number }) {
  const H = 130;
  if (width <= 0) return <View style={{ height: H }} />;
  const n = wave.length;
  const pts = wave.map((v, i) => {
    const x = (i / Math.max(1, n - 1)) * width;
    const y = H - (Math.min(100, Math.max(0, v)) / 100) * (H - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = `M${pts.join(' L')}`;
  const area = `${line} L${width},${H} L0,${H} Z`;
  return (
    <Svg width={width} height={H}>
      <Defs>
        <LinearGradient id="ppgFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={PRIMARY} stopOpacity={0.35} />
          <Stop offset="1" stopColor={PRIMARY} stopOpacity={0.02} />
        </LinearGradient>
      </Defs>
      <Path d={area} fill="url(#ppgFill)" />
      <Path d={line} stroke={PRIMARY} strokeWidth={1.6} fill="none" />
    </Svg>
  );
}

/** Đồ thị Poincaré: mỗi chấm là cặp (NN[i], NN[i+1]) tính bằng ms. */
function PoincarePlot({ nn, width }: { nn: number[]; width: number }) {
  const H = 230;
  const M = { left: 40, right: 10, top: 8, bottom: 28 };
  if (width <= 0) return <View style={{ height: H }} />;
  const plotW = width - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const nnMin = Math.min(...nn);
  const nnMax = Math.max(...nn);
  const pad = Math.max(30, (nnMax - nnMin) * 0.1);
  const lo = Math.max(0, nnMin - pad);
  const hi = nnMax + pad;
  const sx = (v: number) => M.left + ((v - lo) / (hi - lo)) * plotW;
  const sy = (v: number) => M.top + plotH - ((v - lo) / (hi - lo)) * plotH;
  const ticks = [0, 1, 2, 3, 4].map((i) => Math.round(lo + ((hi - lo) * i) / 4));

  return (
    <Svg width={width} height={H}>
      {ticks.map((t) => (
        <React.Fragment key={t}>
          <Line x1={sx(t)} y1={M.top} x2={sx(t)} y2={M.top + plotH} stroke="#CBD5E1" strokeOpacity={0.5} strokeWidth={1} />
          <Line x1={M.left} y1={sy(t)} x2={M.left + plotW} y2={sy(t)} stroke="#CBD5E1" strokeOpacity={0.5} strokeWidth={1} />
          <SvgText x={sx(t)} y={H - 14} fontSize={9} fill="#64748B" textAnchor="middle">
            {t}
          </SvgText>
          <SvgText x={M.left - 4} y={sy(t) + 3} fontSize={9} fill="#64748B" textAnchor="end">
            {t}
          </SvgText>
        </React.Fragment>
      ))}
      <Line x1={sx(lo)} y1={sy(lo)} x2={sx(hi)} y2={sy(hi)} stroke="#94A3B8" strokeDasharray="4 4" strokeWidth={1} />
      {nn.slice(0, -1).map((x, i) => (
        <Circle key={i} cx={sx(x)} cy={sy(nn[i + 1])} r={2.5} fill={PRIMARY_DARK} fillOpacity={0.65} />
      ))}
      <SvgText x={M.left + plotW / 2} y={H - 2} fontSize={9} fill="#64748B" textAnchor="middle">
        NN(n) — ms
      </SvgText>
    </Svg>
  );
}

function CardTitle({ children, Icon }: { children: string; Icon?: typeof Activity }) {
  return (
    <View className="flex-row items-center" style={{ gap: 6 }}>
      {Icon ? <Icon size={14} color={PRIMARY} /> : null}
      <Text className="text-xs font-semibold text-slate-800 uppercase tracking-wider">{children}</Text>
    </View>
  );
}

/**
 * Khối trực quan của một phép đo (giống web MeasurementVisuals): sóng mạch PPG, huy hiệu SQI,
 * các chỉ số bổ sung và đồ thị Poincaré. Tự ẩn phần nào không có dữ liệu.
 */
export function MeasurementVisuals({ features }: { features: HrvFeatures }) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.floor(e.nativeEvent.layout.width));

  const wave = asNumberArray(features.chartData);
  const nn = asNumberArray(features.nnIntervals);
  const extraTiles = buildExtraTiles(features);
  const hasWave = wave.length >= 10;
  const hasPoincare = nn.length >= 10;
  const hasSqi = typeof features.sqi_ok === 'boolean';

  if (!hasWave && !hasPoincare && !hasSqi && extraTiles.length === 0) return null;

  return (
    <View style={{ gap: 12 }}>
      {hasWave && (
        <View className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5">
          <View className="flex-row items-center justify-between flex-wrap mb-2" style={{ gap: 8 }}>
            <CardTitle Icon={Activity}>Sóng mạch (PPG) trong phiên đo</CardTitle>
            <SqiBadge features={features} />
          </View>
          <View onLayout={onLayout}>
            <PpgWave wave={wave} width={width} />
          </View>
          <Text className="text-[11px] text-slate-500 mt-1 leading-4">
            Mỗi đỉnh sóng là một nhịp tim. Sóng đều đặn → nhịp ổn định; sóng lộn xộn, biên độ thất thường → nhịp bất thường.
          </Text>
        </View>
      )}

      {extraTiles.length > 0 && (
        <View className="flex-row flex-wrap" style={{ gap: 10 }}>
          {extraTiles.map((tile) => (
            <View key={tile.key} className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5" style={{ width: '48%', flexGrow: 1 }}>
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <tile.Icon size={13} color={PRIMARY} />
                <Text className="text-xs text-slate-500 font-medium">{tile.label}</Text>
              </View>
              <Text className="text-lg font-bold text-slate-900 mt-1">
                {tile.value}
                {tile.unit ? <Text className="text-xs font-normal text-slate-500"> {tile.unit}</Text> : null}
              </Text>
              {tile.note ? <Text className="text-[10px] text-slate-500 mt-0.5">{tile.note}</Text> : null}
            </View>
          ))}
        </View>
      )}

      {hasPoincare && (
        <View style={{ gap: 12 }}>
          <View className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5">
            <View className="mb-1.5">
              <CardTitle>Đồ thị Poincaré</CardTitle>
            </View>
            <View onLayout={hasWave ? undefined : onLayout}>
              <PoincarePlot nn={nn} width={width} />
            </View>
          </View>
          <View className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5" style={{ gap: 6 }}>
            <CardTitle>Cách đọc đồ thị</CardTitle>
            <Text className="text-xs text-slate-500 leading-5">
              Mỗi chấm là <Text className="font-bold text-slate-700">một cặp nhịp tim liên tiếp</Text>: vị trí ngang là khoảng cách nhịp trước, vị trí dọc là khoảng cách nhịp sau.
            </Text>
            <Text className="text-xs text-slate-500 leading-5">
              • Đám chấm <Text className="font-bold text-slate-700">gọn, bám sát đường chéo</Text> → nhịp tim đều đặn.
            </Text>
            <Text className="text-xs text-slate-500 leading-5">
              • Đám chấm <Text className="font-bold text-slate-700">tản rộng như đám mây</Text> → nhịp biến thiên bất thường, đặc trưng thường gặp của rung nhĩ.
            </Text>
            <Text className="text-[11px] text-slate-500">Dựa trên {nn.length} khoảng nhịp ghi nhận trong phiên đo.</Text>
          </View>
        </View>
      )}

      {!hasWave && !hasPoincare && hasSqi && <SqiBadge features={features} />}
    </View>
  );
}
