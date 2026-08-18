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
