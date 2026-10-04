import type {
  ConsultationCreditPolicy,
  CreditOperation,
  CreditOrderStatus,
  CreditPaymentProvider,
  CreditPaymentStatus,
  CreditReservationStatus,
  CreditSourceType,
} from '@/types/credits';

/**
 * Nhãn + màu cho ví lượt tư vấn — cùng nội dung với web (constants/credits.ts + locales credits.json)
 * để hội viên đọc trên app và trên web như nhau.
 */
export interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
}

const SUCCESS: Omit<StatusConfig, 'label'> = { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' };
const WARNING: Omit<StatusConfig, 'label'> = { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' };
const DANGER: Omit<StatusConfig, 'label'> = { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' };
const PRIMARY: Omit<StatusConfig, 'label'> = { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
const SLATE: Omit<StatusConfig, 'label'> = { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };

export const CREDIT_ORDER_STATUS_CONFIG: Record<CreditOrderStatus, StatusConfig> = {
  PAID: { label: 'Đã thanh toán', ...SUCCESS },
  PENDING_PAYMENT: { label: 'Chờ thanh toán', ...WARNING },
  CANCELLED: { label: 'Đã hủy', ...SLATE },
  EXPIRED: { label: 'Hết hạn', ...DANGER },
  REQUIRES_REVIEW: { label: 'Đang kiểm tra', ...WARNING },
};

export const CREDIT_PAYMENT_STATUS_CONFIG: Record<CreditPaymentStatus, StatusConfig> = {
  CREATING: { label: 'Đang khởi tạo', ...PRIMARY },
  PENDING: { label: 'Chờ thanh toán', ...WARNING },
  PAID: { label: 'Đã thanh toán', ...SUCCESS },
  CANCELLED: { label: 'Đã hủy', ...SLATE },
  EXPIRED: { label: 'Đã hết hạn', ...DANGER },
  REQUIRES_REVIEW: { label: 'Đang kiểm tra', ...WARNING },
};

export const CREDIT_RESERVATION_STATUS_CONFIG: Record<CreditReservationStatus, StatusConfig> = {
  HELD: { label: 'Lượt đang được tạm giữ', ...PRIMARY },
  CAPTURED: { label: 'Lượt đã được sử dụng', ...DANGER },
  RELEASED: { label: 'Lượt đã được trả lại', ...PRIMARY },
};

export const CREDIT_PAYMENT_PROVIDER_LABEL: Record<CreditPaymentProvider, string> = {
  MOCK: 'Thanh toán giả lập',
  PAYOS: 'Cổng thanh toán PayOS',
};

export const CREDIT_OPERATION_CONFIG: Record<CreditOperation, StatusConfig & { description: string }> = {
  PURCHASE: { label: 'Mua lượt', description: 'Cộng lượt khi thanh toán đơn mua', ...PRIMARY },
  RESERVE: { label: 'Giữ lượt tư vấn', description: 'Tạm giữ lượt khi tham gia phiên tư vấn', ...PRIMARY },
  CAPTURE: { label: 'Sử dụng lượt', description: 'Tiêu thụ lượt tư vấn đã giữ', ...DANGER },
  RELEASE: { label: 'Trả lượt giữ', description: 'Hoàn trả lượt đang giữ về lại khả dụng', ...PRIMARY },
  SESSION_CHARGE: { label: 'Đã dùng lượt khi bắt đầu phiên', description: 'Tiêu thụ lượt tư vấn khi bạn xác nhận bắt đầu phiên', ...DANGER },
  ADJUSTMENT: { label: 'Điều chỉnh', description: 'Quản trị viên điều chỉnh lượt', ...WARNING },
  SESSION_REFUND: { label: 'Bồi hoàn lượt', description: 'Bồi hoàn lượt tư vấn của phiên', ...SUCCESS },
};

export const CREDIT_SOURCE_TYPE_LABEL: Record<CreditSourceType, string> = {
  PURCHASE_ORDER: 'Đơn mua',
  CONSULTATION_REQUEST: 'Yêu cầu tư vấn',
  CONSULTATION_SESSION: 'Phiên tư vấn',
  ADMIN_ADJUSTMENT: 'Điều chỉnh quản trị',
};

export const CREDIT_ERROR_CODE_MESSAGES: Record<number, string> = {
  1003: 'Tài khoản của bạn hiện không hoạt động. Vui lòng liên hệ quản trị viên.',
  1201: 'Thông tin yêu cầu không hợp lệ.',
  1203: 'Dữ liệu gửi lên máy chủ không đúng định dạng.',
  3001: 'Ràng buộc dữ liệu bị vi phạm.',
  4008: 'Không tìm thấy thông tin hội viên.',
  4100: 'Số dư lượt tư vấn không đủ để thực hiện thao tác này.',
  4103: 'Xung đột mã yêu cầu (Idempotency Key). Vui lòng thử lại với yêu cầu mới.',
  4104: 'Số dư ví lượt đã đạt giới hạn tối đa cho phép. Vui lòng liên hệ hỗ trợ.',
  4105: 'Gói lượt tư vấn hiện không khả dụng hoặc đã ngừng bán.',
  4106: 'Không tìm thấy thông tin đơn mua lượt hoặc đơn không thuộc về bạn.',
  4108: 'Chức năng mua lượt tư vấn tạm thời chưa khả dụng trong hệ thống.',
  9999: 'Hệ thống đang bảo trì hoặc gặp sự cố xử lý. Vui lòng thử lại sau.',
};

/** Mã lỗi khi hội viên xác nhận bắt đầu phiên (giống web) */
export const CONSULTATION_CONFIRM_ERROR_MESSAGES: Record<number, string> = {
  4100: 'Không còn đủ lượt tại thời điểm bắt đầu phiên. Vui lòng nạp thêm lượt.',
  4026: 'Không tìm thấy lời mời tư vấn hoặc đã bị thu hồi.',
  4027: 'Lời mời tư vấn cũ hoặc không còn hiệu lực.',
  4028: 'Lời mời tư vấn đã hết thời gian xác nhận.',
  4009: 'Yêu cầu tư vấn không còn ở trạng thái cho phép xác nhận.',
  4014: 'Bác sĩ không còn đủ điều kiện nhận phiên. Đang điều phối lại...',
  4002: 'Yêu cầu tư vấn không thuộc về tài khoản của bạn.',
  4004: 'Bạn đã có phiên tư vấn khác đang hoạt động.',
};

export function getCreditOrderStatusConfig(status?: string | null): StatusConfig {
  return (status && (CREDIT_ORDER_STATUS_CONFIG as Record<string, StatusConfig>)[status]) || { label: status || 'Không xác định', ...SLATE };
}

export function getCreditPaymentStatusConfig(status?: string | null): StatusConfig {
  return (status && (CREDIT_PAYMENT_STATUS_CONFIG as Record<string, StatusConfig>)[status]) || { label: status || 'Không xác định', ...SLATE };
}

export function getCreditReservationStatusConfig(status?: string | null): StatusConfig {
  return (status && (CREDIT_RESERVATION_STATUS_CONFIG as Record<string, StatusConfig>)[status]) || { label: status || 'Không có tạm giữ', ...SLATE };
}

export function getCreditOperationConfig(op?: string | null) {
  return (op && (CREDIT_OPERATION_CONFIG as Record<string, StatusConfig & { description: string }>)[op]) || { label: op || 'Khác', description: 'Biến động lượt', ...SLATE };
}

export function getCreditSourceTypeLabel(sourceType?: string | null): string {
  return (sourceType && (CREDIT_SOURCE_TYPE_LABEL as Record<string, string>)[sourceType]) || sourceType || 'Khác';
}

export function getCreditPaymentProviderLabel(provider?: string | null): string {
  return (provider && (CREDIT_PAYMENT_PROVIDER_LABEL as Record<string, string>)[provider]) || provider || 'Phương thức thanh toán';
}

/** "3 lượt" */
export function formatCreditQuantity(qty?: number | null): string {
  const n = typeof qty === 'number' && !Number.isNaN(qty) ? qty : 0;
  return `${n.toLocaleString('vi-VN')} lượt`;
}

/** Idempotency-Key cho thao tác mua lượt (giống web generateCreditIdempotencyKey) */
export function generateCreditIdempotencyKey(prefix = 'hs-credit'): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 10);
  return `${prefix}-${ts}-${rand}`;
}

/** Dòng mô tả lượt theo chính sách trừ lượt (quy tắc V20, giống web getCreditDisplay) */
export function getCreditDisplay(snapshot?: {
  creditPolicy?: ConsultationCreditPolicy | null;
  creditReservationStatus?: CreditReservationStatus | null;
} | null): string | null {
  if (!snapshot?.creditPolicy) return null;
  if (snapshot.creditPolicy === 'PER_SESSION_CONFIRM_V2') {
    return snapshot.creditReservationStatus === 'CAPTURED'
      ? 'Đã sử dụng lượt tư vấn'
      : 'Lượt sẽ được trừ khi bạn xác nhận bắt đầu phiên';
  }
  if (snapshot.creditPolicy === 'PER_SESSION_V1') {
    if (snapshot.creditReservationStatus === 'HELD') return 'Lượt đang được tạm giữ';
    if (snapshot.creditReservationStatus === 'CAPTURED') return 'Đã sử dụng lượt tư vấn';
    if (snapshot.creditReservationStatus === 'RELEASED') return 'Lượt đã được trả lại';
  }
  return null;
}
