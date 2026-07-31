export enum RecordStatus{
    PENDING_UPLOAD = 'PENDING_UPLOAD',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export enum PredictionLabel{
    NORMAL = 'NORMAL',
    AFIB = 'AFIB',
    UNCERTAIN = 'UNCERTAIN',
}