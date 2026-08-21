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

export interface HealthRecordResponse {
  id: number;
  userId: number;
  fileName: string;
  s3FileKey: string;
  fileSize: number;
  status: string;
  predictionLabel: string;
  confidence: number;
  hrvFeaturesJson?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}
