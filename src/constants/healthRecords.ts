import i18n from '@/i18n';
import type { PredictionLabel, RecordStatus } from '@/types/health-records';

/**
 * Nhãn, màu và lời khuyên cho kết luận AI — một nguồn duy nhất, giống web
 * (src/constants/health-records.ts + lib/health-records.ts) để hai nền tảng đọc như nhau.
 * Chuỗi hiển thị lấy qua i18n tại thời điểm truy cập (getter) để đổi ngôn ngữ là cập nhật ngay.
 */
export interface PredictionMeta {
  key: PredictionLabel | 'PROCESSING' | 'FAILED' | 'UNKNOWN';
  label: string;
  /** Màu nền / chữ / viền của huy hiệu */
  bg: string;
  text: string;
  border: string;
  /** Màu chấm, thanh màu trên đầu thẻ */
  dot: string;
  advice: string;
  isRisk: boolean;
  /** Dải xác suất tương ứng (hiện ở chú thích) */
  rangeText: string;
}

interface MetaSpec {
  key: PredictionMeta['key'];
  /** Khóa i18n trong health:predictionLabel.* */
  i18nKey: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  isRisk: boolean;
  /** Chuỗi cố định (vd. "< 30%") hoặc khóa i18n (rangeTextKey) */
  rangeText?: string;
  rangeTextKey?: string;
}

function defineMeta(spec: MetaSpec): PredictionMeta {
  const { key, i18nKey, bg, text, border, dot, isRisk, rangeText, rangeTextKey } = spec;
  return {
    key,
    bg,
    text,
    border,
    dot,
    isRisk,
    get label() {
      return i18n.t(`health:predictionLabel.${i18nKey}.label`);
    },
    get advice() {
      return i18n.t(`health:predictionLabel.${i18nKey}.advice`);
    },
    get rangeText() {
      return rangeTextKey ? i18n.t(rangeTextKey) : rangeText ?? 'N/A';
    },
  };
}

export const PREDICTION_LABEL_CONFIG: Record<PredictionLabel, PredictionMeta> = {
  NORMAL: defineMeta({
    key: 'NORMAL',
    i18nKey: 'normal',
    bg: '#ECFDF5',
    text: '#065F46',
    border: '#6EE7B7',
    dot: '#10B981',
    isRisk: false,
    rangeText: '< 30%',
  }),
  UNCERTAIN: defineMeta({
    key: 'UNCERTAIN',
    i18nKey: 'uncertain',
    bg: '#EFF6FF',
    text: '#1E3A8A',
    border: '#93C5FD',
    dot: '#3B82F6',
    isRisk: false,
    rangeText: '30% - 50%',
  }),
  AFIB_SUSPECTED: defineMeta({
    key: 'AFIB_SUSPECTED',
    i18nKey: 'afibSuspected',
    bg: '#FFFBEB',
    text: '#78350F',
    border: '#FCD34D',
    dot: '#F59E0B',
    isRisk: true,
    rangeText: '50% - 70%',
  }),
  AFIB: defineMeta({
    key: 'AFIB',
    i18nKey: 'afib',
    bg: '#FEF2F2',
    text: '#7F1D1D',
    border: '#FCA5A5',
    dot: '#EF4444',
    isRisk: true,
    rangeText: '≥ 70%',
  }),
};

const PROCESSING_META: PredictionMeta = defineMeta({
  key: 'PROCESSING',
  i18nKey: 'processing',
  bg: '#EFF6FF',
  text: '#1E3A8A',
  border: '#93C5FD',
  dot: '#3B82F6',
  isRisk: false,
  rangeTextKey: 'health:predictionLabel.processing.short',
});

const FAILED_META: PredictionMeta = defineMeta({
  key: 'FAILED',
  i18nKey: 'failed',
  bg: '#F1F5F9',
  text: '#0F172A',
  border: '#CBD5E1',
  dot: '#94A3B8',
  isRisk: false,
  rangeText: 'N/A',
});

const UNKNOWN_META: PredictionMeta = defineMeta({
  key: 'UNKNOWN',
  i18nKey: 'unknown',
  bg: '#F1F5F9',
  text: '#0F172A',
  border: '#CBD5E1',
  dot: '#94A3B8',
  isRisk: false,
  rangeText: 'N/A',
});

export function getPredictionMeta(label?: string | null, status?: string | null): PredictionMeta {
  if (status === 'PROCESSING' || status === 'PENDING_ANALYSIS' || status === 'PENDING_UPLOAD') return PROCESSING_META;
  if (status === 'FAILED') return FAILED_META;
  if (label && (PREDICTION_LABEL_CONFIG as Record<string, PredictionMeta>)[label]) {
    return PREDICTION_LABEL_CONFIG[label as PredictionLabel];
  }
  // Nhãn lạ từ server: hiện nguyên nhãn đó, các trường còn lại lấy từ UNKNOWN (spread sẽ đọc getter tại thời điểm gọi)
  return label ? { ...UNKNOWN_META, label } : UNKNOWN_META;
}

export const PREDICTION_LEGEND: PredictionMeta[] = [
  PREDICTION_LABEL_CONFIG.NORMAL,
  PREDICTION_LABEL_CONFIG.UNCERTAIN,
  PREDICTION_LABEL_CONFIG.AFIB_SUSPECTED,
  PREDICTION_LABEL_CONFIG.AFIB,
];

/** Bảng chỉ số HRV ở màn chi tiết: tên, số lẻ, đơn vị, dải tham chiếu, ý nghĩa (giống web). */
export interface HrvTableRow {
  key: string;
  label: string;
  decimals: number;
  unit: string;
  range: string;
  meaning: string;
}

function hrvRow(spec: { key: string; label?: string; labelKey?: string; decimals: number; unit: string; range: string; meaningKey: string }): HrvTableRow {
  const { key, label, labelKey, decimals, unit, range, meaningKey } = spec;
  return {
    key,
    decimals,
    unit,
    range,
    get label() {
      return labelKey ? i18n.t(labelKey) : label ?? key;
    },
    get meaning() {
      return i18n.t(`health:recordDetail.meaning.${meaningKey}`);
    },
  };
}

export const HRV_TABLE_ROWS: HrvTableRow[] = [
  hrvRow({ key: 'Mean_NN', label: 'Mean_NN', decimals: 1, unit: 'ms', range: '600 - 1200 ms', meaningKey: 'meanNn' }),
  hrvRow({ key: 'SDNN', label: 'SDNN', decimals: 1, unit: 'ms', range: '30 - 100 ms', meaningKey: 'sdnn' }),
  hrvRow({ key: 'RMSSD', label: 'RMSSD', decimals: 1, unit: 'ms', range: '20 - 50 ms', meaningKey: 'rmssd' }),
  hrvRow({ key: 'pNN50', label: 'pNN50', decimals: 1, unit: '%', range: '3% - 30%', meaningKey: 'pnn50' }),
  hrvRow({ key: 'CV', label: 'CV', decimals: 4, unit: '', range: '0.05 - 0.15', meaningKey: 'cv' }),
  hrvRow({ key: 'LF', label: 'LF', decimals: 3, unit: '', range: '0.04 - 0.15 Hz', meaningKey: 'lf' }),
  hrvRow({ key: 'HF', label: 'HF', decimals: 3, unit: '', range: '0.15 - 0.40 Hz', meaningKey: 'hf' }),
  hrvRow({ key: 'LF_HF_Ratio', labelKey: 'health:recordDetail.lfHfRatio', decimals: 2, unit: '', range: '0.5 - 2.0', meaningKey: 'lfHf' }),
];

export type RecordStatusFilter = 'all' | 'normal' | 'warning' | 'processing';

export const RECORD_STATUS_FILTERS: { key: RecordStatusFilter; label: string }[] = (
  ['all', 'normal', 'warning', 'processing'] as RecordStatusFilter[]
).map((key) => ({
  key,
  get label() {
    return i18n.t(`health:afibHistory.filter.${key}`);
  },
}));

export function matchesRecordStatusFilter(
  filter: RecordStatusFilter,
  record: { predictionLabel?: string | null; status?: RecordStatus | string | null }
): boolean {
  if (filter === 'normal') return record.predictionLabel === 'NORMAL';
  if (filter === 'warning') return record.predictionLabel === 'AFIB' || record.predictionLabel === 'AFIB_SUSPECTED';
  if (filter === 'processing') return record.status === 'PROCESSING' || record.status === 'PENDING_ANALYSIS';
  return true;
}
