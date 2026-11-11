/**
 * Thời lượng một lần đo tầm soát AFib (giây).
 *
 * AI Service bỏ 2 giây đầu (nhiễu khởi động cảm biến), rồi chia 70 giây còn lại thành
 * 5 cửa sổ 30 giây với bước 10 giây (0–30, 10–40, 20–50, 30–60, 40–70 s). Mỗi cửa sổ qua cổng
 * SQI và mô hình riêng; quy tắc temporal persistence chạy trên chuỗi 5 cửa sổ này.
 */
export const AFIB_MEASUREMENT_SECONDS = 72;
