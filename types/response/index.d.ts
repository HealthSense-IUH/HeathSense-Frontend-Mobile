import { PredictionLabel, RecordStatus } from '../ppg';

export interface PresignedUrlResponse {
    recordId: string | number;
    uploadUrl: string;
    s3Key: string;
}

export interface HealthRecordResponse {
    id: string | number;
    userId: string | number;
    fileName: string;
    fileSize: number;
    status: RecordStatus;
    predictionLabel?: PredictionLabel | null;
    confidence?: number | null;
    hrvFeaturesJson?: string | null;
    createdAt: string;
    updatedAt: string;
}