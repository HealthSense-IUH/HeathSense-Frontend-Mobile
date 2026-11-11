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

/** Một cửa sổ 30 giây do AI Service phân tích (thời gian tính từ sau 2 giây đầu bị bỏ). */
export interface AnalysisWindow {
  index: number;
  startS: number;
  endS: number;
  /** false nếu cửa sổ bị cổng SQI loại */
  accepted: boolean;
  /** Xác suất AF thô của meta-learner (P_meta) */
  pMeta?: number;
  /** Độ bất đồng giữa 3 base learner (độ lệch chuẩn quần thể) */
  sigmaDis?: number | null;
  baseProbabilities?: Record<string, number>;
  /** Lý do bị loại (khi accepted = false) */
  reason?: string;
}

/** Kết quả theo cửa sổ 30 s / bước 10 s và quyết định của quy tắc temporal persistence. */
export interface WindowAnalysis {
  windowSeconds: number;
  stepSeconds: number;
  windows: AnalysisWindow[];
  acceptedWindows: number;
  rejectedWindows: number;
  /** Trung bình P_meta của các cửa sổ đạt SQI = xác suất của cả bản ghi */
  meanProbability: number;
  temporalRuleAvailable: boolean;
  alert: boolean;
  alertBranch: 'five_window_persistence' | 'two_window_high_confidence' | null;
  alertTimeS: number | null;
}

/** Đặc trưng HRV do AI Service tính và lưu kèm bản ghi (cùng cấu trúc với web). */
export interface HrvFeatures {
  /** Phân tích theo cửa sổ (AI Service, mô hình V6 stacking) */
  windowAnalysis?: WindowAnalysis;
  /** true nếu quy tắc temporal persistence phát cảnh báo */
  afAlert?: boolean;
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
