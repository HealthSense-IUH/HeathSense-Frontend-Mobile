import { File } from 'expo-file-system';
import { ApiResponse } from '@/types/authentication';
import { PresignedUrlRequest } from '@/types/request';
import axiosClient from '@/utils/axiosClient';
import { HealthRecordResponse, PresignedUrlResponse } from '@/types/response';
import { PpgRecordingResult } from './ppgRecorder';

/**
 * Lấy Presigned URL từ Backend (POST /api/health-records/presigned-url)
 */
export const getPresignedUrl = async (file: PresignedUrlRequest): Promise<PresignedUrlResponse> => {
    try {
        const presignedResponse = await axiosClient.post<ApiResponse<PresignedUrlResponse>>(
            '/api/health-records/presigned-url',
            file
        );
        return presignedResponse.data?.data || presignedResponse.data?.result || (presignedResponse.data as any);
    } catch (err) {
        console.error('Không thể lấy Presigned URL từ Backend:', err);
        throw err;
    }
};

/**
 * Tải trực tiếp nội dung file CSV lên AWS S3 sử dụng Presigned URL (HTTP PUT)
 * Lưu ý: Dùng fetch thuần để không bị tự động gắn Header Authorization Bearer của Backend vào S3
 */
export const uploadFileToS3 = async (uploadUrl: string, fileUri: string): Promise<void> => {
    try {
        const file = new File(fileUri);
        const csvContent = await file.text();

        const response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'text/csv',
            },
            body: csvContent,
        });

        if (!response.ok) {
            throw new Error(`Upload file lên S3 thất bại với mã HTTP: ${response.status}`);
        }
    } catch (err) {
        console.error('Lỗi khi upload file CSV lên S3:', err);
        throw err;
    }
};

/**
 * Xác nhận hoàn tất upload với Backend để kích hoạt xử lý AI (POST /api/health-records/{id}/confirm)
 */
export const confirmUpload = async (id: string | number): Promise<HealthRecordResponse> => {
    try {
        const response = await axiosClient.post<ApiResponse<HealthRecordResponse>>(
            `/api/health-records/${id}/confirm`
        );
        return response.data?.data || response.data?.result || (response.data as any);
    } catch (err) {
        console.error('Không thể xác nhận tải lên (confirm) với Backend:', err);
        throw err;
    }
};

/**
 * Lấy thông tin chi tiết một bản ghi sức khỏe (GET /api/health-records/{id})
 */
export const getHealthRecord = async (id: string | number): Promise<HealthRecordResponse> => {
    try {
        const response = await axiosClient.get<ApiResponse<HealthRecordResponse>>(
            `/api/health-records/${id}`
        );
        return response.data?.data || response.data?.result || (response.data as any);
    } catch (err) {
        console.error('Không thể lấy thông tin bản ghi từ Backend:', err);
        throw err;
    }
};

/**
 * Luồng xử lý trọn gói: Tự động lấy file CSV ghi nhận được -> xin Presigned URL -> Upload S3 -> Confirm Backend -> Polling chờ AI
 */
export const uploadPpgRecord = async (
    recordingResult: PpgRecordingResult
): Promise<HealthRecordResponse> => {
    try {
        // 1. Kiểm tra file và lấy dung lượng
        const file = new File(recordingResult.uri);
        let fileSize = file.size || 0;

        if (fileSize <= 0) {
            const content = await file.text();
            fileSize = content.length;
        }

        if (fileSize <= 0) {
            throw new Error('File CSV dữ liệu PPG rỗng, không thể gửi.');
        }

        // 2. Gọi API lấy presigned URL từ Backend
        const presigned = await getPresignedUrl({
            fileName: recordingResult.fileName,
            fileSize: fileSize,
        });

        if (!presigned || !presigned.uploadUrl || !presigned.recordId) {
            throw new Error('Presigned URL trả về không hợp lệ.');
        }

        // 3. Tải file CSV lên S3
        await uploadFileToS3(presigned.uploadUrl, recordingResult.uri);

        // 4. Xác nhận hoàn tất upload với Backend
        let recordResponse = await confirmUpload(String(presigned.recordId));

        // 5. Polling chờ AI phân tích xong (trạng thái chuyển sang COMPLETED hoặc FAILED)
        const maxAttempts = 30; // 30 lần * 2 giây = 60 giây timeout
        let attempts = 0;
        
        while (recordResponse.status === 'PROCESSING' || recordResponse.status === 'PENDING_UPLOAD') {
            if (attempts >= maxAttempts) {
                throw new Error('Quá thời gian chờ AI phân tích (Timeout).');
            }
            // Đợi 2 giây
            await new Promise(resolve => setTimeout(resolve, 2000));
            recordResponse = await getHealthRecord(String(presigned.recordId));
            attempts++;
        }

        if (recordResponse.status === 'FAILED') {
            throw new Error('Backend báo lỗi phân tích AI thất bại.');
        }

        return recordResponse;
    } catch (err) {
        console.error('Lỗi trong quy trình upload và confirm hồ sơ PPG:', err);
        throw err;
    }
};