export interface HealthStatItemResponse {
  label: string;
  normalCount: number;
  afibRiskCount: number;
  uncertainCount: number;
}

export interface HealthStatisticsResponse {
  chartData: HealthStatItemResponse[];
  totalNormal: number;
  totalAfibRisk: number;
  totalUncertain: number;
}
