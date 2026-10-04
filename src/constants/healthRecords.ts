import type { PredictionLabel, RecordStatus } from '@/types/health-records';

/**
 * Nhãn, màu và lời khuyên cho kết luận AI — một nguồn duy nhất, giống web
 * (src/constants/health-records.ts + lib/health-records.ts) để hai nền tảng đọc như nhau.
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

export const PREDICTION_LABEL_CONFIG: Record<PredictionLabel, PredictionMeta> = {
  NORMAL: {
    key: 'NORMAL',
    label: 'Bình thường',
    bg: '#ECFDF5',
    text: '#065F46',
    border: '#6EE7B7',
    dot: '#10B981',
    advice: 'Tín hiệu nhịp tim ổn định và nằm trong dải sinh lý bình thường. Hãy duy trì theo dõi sức khỏe định kỳ.',
    isRisk: false,
    rangeText: '< 30%',
  },
  UNCERTAIN: {
    key: 'UNCERTAIN',
    label: 'Chưa rõ',
    bg: '#EFF6FF',
    text: '#1E3A8A',
    border: '#93C5FD',
    dot: '#3B82F6',
    advice: 'Dữ liệu có một số đoạn nhiễu nhẹ. Kết quả mang tính tham khảo, nên đo lại khi ngồi yên tĩnh.',
    isRisk: false,
    rangeText: '30% - 50%',
  },
  AFIB_SUSPECTED: {
    key: 'AFIB_SUSPECTED',
    label: 'Nghi ngờ AFib',
    bg: '#FFFBEB',
    text: '#78350F',
    border: '#FCD34D',
    dot: '#F59E0B',
    advice: 'Có dấu hiệu loạn nhịp hoặc biến thiên khoảng cách R-R bất thường nhẹ. Khuyến khích đo lại khi nghỉ ngơi.',
    isRisk: true,
    rangeText: '50% - 70%',
  },
  AFIB: {
    key: 'AFIB',
    label: 'Cảnh báo AFib',
    bg: '#FEF2F2',
    text: '#7F1D1D',
    border: '#FCA5A5',
    dot: '#EF4444',
    advice: 'AI phát hiện biến thiên nhịp tim có tính chất rung nhĩ. Khuyến nghị liên hệ bác sĩ chuyên khoa tim mạch để được chẩn đoán.',
    isRisk: true,
    rangeText: '≥ 70%',
  },
};

const PROCESSING_META: PredictionMeta = {
  key: 'PROCESSING',
  label: 'Đang phân tích',
  bg: '#EFF6FF',
  text: '#1E3A8A',
  border: '#93C5FD',
  dot: '#3B82F6',
  advice: 'Dữ liệu đang được phân tích qua mô hình AI. Vui lòng đợi trong giây lát...',
  isRisk: false,
  rangeText: 'Đang xử lý',
};

const FAILED_META: PredictionMeta = {
  key: 'FAILED',
  label: 'Lỗi phân tích',
  bg: '#F1F5F9',
  text: '#0F172A',
  border: '#CBD5E1',
  dot: '#94A3B8',
  advice: 'Tín hiệu đo quá ngắn hoặc chứa nhiều nhiễu động. Khuyến nghị thực hiện đo lại trong trạng thái nghỉ ngơi.',
  isRisk: false,
  rangeText: 'N/A',
};

const UNKNOWN_META: PredictionMeta = {
  key: 'UNKNOWN',
  label: 'Chưa có kết luận',
  bg: '#F1F5F9',
  text: '#0F172A',
  border: '#CBD5E1',
  dot: '#94A3B8',
  advice: 'Bản ghi đang chờ đồng bộ hóa dữ liệu.',
  isRisk: false,
  rangeText: 'N/A',
};

export function getPredictionMeta(label?: string | null, status?: string | null): PredictionMeta {
  if (status === 'PROCESSING' || status === 'PENDING_ANALYSIS' || status === 'PENDING_UPLOAD') return PROCESSING_META;
  if (status === 'FAILED') return FAILED_META;
  if (label && (PREDICTION_LABEL_CONFIG as Record<string, PredictionMeta>)[label]) {
    return PREDICTION_LABEL_CONFIG[label as PredictionLabel];
  }
  return label ? { ...UNKNOWN_META, label } : UNKNOWN_META;
}

export const PREDICTION_LEGEND: PredictionMeta[] = [
  PREDICTION_LABEL_CONFIG.NORMAL,
  PREDICTION_LABEL_CONFIG.UNCERTAIN,
  PREDICTION_LABEL_CONFIG.AFIB_SUSPECTED,
  PREDICTION_LABEL_CONFIG.AFIB,
];

/** Bảng chỉ số HRV ở màn chi tiết: tên, số lẻ, đơn vị, dải tham chiếu, ý nghĩa (giống web). */
export const HRV_TABLE_ROWS: {
  key: string;
  label: string;
  decimals: number;
  unit: string;
  range: string;
  meaning: string;
}[] = [
  { key: 'Mean_NN', label: 'Mean_NN', decimals: 1, unit: 'ms', range: '600 - 1200 ms', meaning: 'Khoảng thời gian trung bình giữa 2 nhịp liên tiếp' },
  { key: 'SDNN', label: 'SDNN', decimals: 1, unit: 'ms', range: '30 - 100 ms', meaning: 'Độ biến thiên tổng thể của hệ thần kinh tự chủ' },
  { key: 'RMSSD', label: 'RMSSD', decimals: 1, unit: 'ms', range: '20 - 50 ms', meaning: 'Mức độ hoạt động thần kinh phó giao cảm (Vagal tone)' },
  { key: 'pNN50', label: 'pNN50', decimals: 1, unit: '%', range: '3% - 30%', meaning: 'Tỷ lệ các cặp nhịp tim liên tiếp chênh lệch > 50ms' },
  { key: 'CV', label: 'CV', decimals: 4, unit: '', range: '0.05 - 0.15', meaning: 'Hệ số biến thiên tương đối của nhịp tim' },
  { key: 'LF', label: 'LF', decimals: 3, unit: '', range: '0.04 - 0.15 Hz', meaning: 'Năng lượng dải tần thấp (giao cảm và huyết áp)' },
  { key: 'HF', label: 'HF', decimals: 3, unit: '', range: '0.15 - 0.40 Hz', meaning: 'Năng lượng dải tần cao (hô hấp và phó giao cảm)' },
  { key: 'LF_HF_Ratio', label: 'Tỷ lệ LF/HF', decimals: 2, unit: '', range: '0.5 - 2.0', meaning: 'Tỷ lệ cân bằng thần kinh giao cảm / phó giao cảm' },
];

export type RecordStatusFilter = 'all' | 'normal' | 'warning' | 'processing';

export const RECORD_STATUS_FILTERS: { key: RecordStatusFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả trạng thái' },
  { key: 'normal', label: 'Bình thường (An toàn)' },
  { key: 'warning', label: 'Cảnh báo (Rung nhĩ)' },
  { key: 'processing', label: 'Đang phân tích' },
];

export function matchesRecordStatusFilter(
  filter: RecordStatusFilter,
  record: { predictionLabel?: string | null; status?: RecordStatus | string | null }
): boolean {
  if (filter === 'normal') return record.predictionLabel === 'NORMAL';
  if (filter === 'warning') return record.predictionLabel === 'AFIB' || record.predictionLabel === 'AFIB_SUSPECTED';
  if (filter === 'processing') return record.status === 'PROCESSING' || record.status === 'PENDING_ANALYSIS';
  return true;
}
