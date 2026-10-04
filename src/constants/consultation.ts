/**
 * Nhãn + màu trạng thái yêu cầu / phiên tư vấn — cùng nội dung với web
 * (consultations/components/shared.tsx statusBadge + locales consultation.json "status").
 */
export interface ConsultationStatusConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
}

const SUCCESS = { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' };
const WARNING = { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' };
const DANGER = { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' };
const PRIMARY = { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
const PRIMARY_SOLID = { bg: '#0D6EFD', text: '#FFFFFF', border: '#0D6EFD' };
const SLATE = { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };

export const CONSULTATION_STATUS_CONFIG: Record<string, ConsultationStatusConfig> = {
  PENDING_REVIEW: { label: 'Chờ xem xét', ...SLATE },
  NEED_MORE_INFO: { label: 'Cần bổ sung TT', ...WARNING },
  WAITING_ACCEPTANCE: { label: 'Chờ xác nhận thỏa thuận', ...WARNING },
  WAITING_PAYMENT: { label: 'Chờ thanh toán', ...PRIMARY },
  QUEUED: { label: 'Đang trong hàng đợi', ...PRIMARY },
  WAITING: { label: 'Đang chờ bác sĩ', ...PRIMARY },
  OFFERING_DOCTOR: { label: 'Đang kết nối bác sĩ', ...WARNING },
  WAITING_MEMBER_CONFIRMATION: { label: 'Chờ bạn xác nhận', ...SUCCESS },
  TIMED_OUT: { label: 'Hết thời gian xác nhận', ...SLATE },
  FULFILLED: { label: 'Đã kích hoạt tư vấn', ...SUCCESS },
  SCHEDULED: { label: 'Đã lên lịch', ...PRIMARY },
  COMPLETED: { label: 'Đã hoàn thành', ...SLATE },
  REJECTED: { label: 'Đã từ chối', ...DANGER },
  CANCELLED: { label: 'Đã hủy', ...DANGER },
  EXPIRED: { label: 'Đã hết hạn', ...DANGER },
  ACTIVE: { label: 'Đang hoạt động', ...PRIMARY_SOLID },
  APPROVED: { label: 'Đã duyệt', ...PRIMARY_SOLID },
  PENDING: { label: 'Đang chờ', ...SLATE },
  PROCESSING: { label: 'Đang xử lý', ...SLATE },
  IN_PROGRESS: { label: 'Đang xử lý', ...SLATE },
  FAILED: { label: 'Thất bại', ...DANGER },
  CLOSED: { label: 'Đã đóng', ...DANGER },
};

export function getConsultationStatusConfig(status?: string | null): ConsultationStatusConfig {
  return (status && CONSULTATION_STATUS_CONFIG[status]) || { label: status || '', ...SLATE };
}

/** Phiên theo luồng hàng đợi (15 phút/khối, trả bằng lượt) hay luồng gói cũ. */
export function isQueueFlow(flowType?: string | null): boolean {
  return flowType === 'QUEUE_DISPATCH_V1';
}
