export interface HealthStatItemResponse {
  label: string;
  normalCount: number;
  afibRiskCount: number;
  uncertainCount: number;
  afibSuspectedCount: number;
}

export interface HealthStatisticsResponse {
  chartData: HealthStatItemResponse[];
  totalNormal: number;
  totalAfibRisk: number;
  totalUncertain: number;
  totalAfibSuspected: number;
}

export type PredictionLabel = 'NORMAL' | 'AFIB' | 'AFIB_SUSPECTED' | 'UNCERTAIN';

export type RecordStatus = 'PENDING_UPLOAD' | 'PROCESSING' | 'PENDING_ANALYSIS' | 'COMPLETED' | 'FAILED';

/** Đặc trưng HRV do AI Service tính và lưu kèm bản ghi (cùng cấu trúc với web). */
export interface HrvFeatures {
  HR_mean?: number;
  Mean_NN?: number;
  SDNN?: number;
  RMSSD?: number;
  pNN50?: number;
  NN50?: number;
  CV?: number;
  LF?: number;
  HF?: number;
  LF_HF_Ratio?: number;
  LF_norm?: number;
  HF_norm?: number;
  Total_Power?: number;
  SD1?: number;
  SD2?: number;
  SampEn?: number;
  /** 300 điểm sóng mạch đã chuẩn hóa 0-100 */
  chartData?: number[];
  /** Chuỗi khoảng NN (ms) giữa các nhịp liên tiếp — để vẽ Poincaré */
  nnIntervals?: number[];
  /** Chất lượng tín hiệu của phép đo */
  sqi_ok?: boolean;
  sqi_valid_ratio?: number;
  sqi_spectral_conc?: number;
  sqi_n_valid_beats?: number;
  hrMin?: number;
  hrMax?: number;
  stressScore?: number;
  respiratoryRate?: number;
  perfusionIndex?: number;
  /** SpO2/BPM do firmware tính (mức tham khảo) */
  deviceSpO2?: number;
  deviceBpm?: number;
  [key: string]: unknown;
}

export interface HealthRecordResponse {
  id: number | string;
  userId?: number | string;
  fileName: string;
  fileSize?: number | null;
  status: RecordStatus;
  predictionLabel?: PredictionLabel | null;
  confidence?: number | null;
  hrvFeatures?: HrvFeatures | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface HealthRecordPageResponse {
  content: HealthRecordResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PresignedUrlResponse {
  recordId: number | string;
  uploadUrl: string;
  s3Key: string;
}
