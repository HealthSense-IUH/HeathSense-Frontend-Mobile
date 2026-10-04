import i18n from '@/i18n';

/**
 * Nhãn + màu trạng thái yêu cầu / phiên tư vấn — cùng nội dung với web
 * (consultations/components/shared.tsx statusBadge + locales consultation.json "status").
 * Nhãn đọc từ i18n lúc truy cập (getter) để đổi ngôn ngữ là nhãn đổi theo.
 */
export interface ConsultationStatusConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
}

type StatusColors = Omit<ConsultationStatusConfig, 'label'>;

const SUCCESS: StatusColors = { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' };
const WARNING: StatusColors = { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' };
const DANGER: StatusColors = { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' };
const PRIMARY: StatusColors = { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
const PRIMARY_SOLID: StatusColors = { bg: '#0D6EFD', text: '#FFFFFF', border: '#0D6EFD' };
const SLATE: StatusColors = { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };

const status = (key: string, colors: StatusColors): ConsultationStatusConfig => ({
  get label() {
    return i18n.t(`consultation:status.${key}`);
  },
  ...colors,
});

export const CONSULTATION_STATUS_CONFIG: Record<string, ConsultationStatusConfig> = {
  PENDING_REVIEW: status('pendingReview', SLATE),
  NEED_MORE_INFO: status('needMoreInfo', WARNING),
  WAITING_ACCEPTANCE: status('waitingAcceptance', WARNING),
  WAITING_PAYMENT: status('waitingPayment', PRIMARY),
  QUEUED: status('queued', PRIMARY),
  WAITING: status('waiting', PRIMARY),
  OFFERING_DOCTOR: status('offeringDoctor', WARNING),
  WAITING_MEMBER_CONFIRMATION: status('waitingMemberConfirmation', SUCCESS),
  TIMED_OUT: status('timedOut', SLATE),
  FULFILLED: status('fulfilled', SUCCESS),
  SCHEDULED: status('scheduled', PRIMARY),
  COMPLETED: status('completed', SLATE),
  REJECTED: status('rejected', DANGER),
  CANCELLED: status('cancelled', DANGER),
  EXPIRED: status('expired', DANGER),
  ACTIVE: status('active', PRIMARY_SOLID),
  APPROVED: status('approved', PRIMARY_SOLID),
  PENDING: status('pending', SLATE),
  PROCESSING: status('processing', SLATE),
  IN_PROGRESS: status('processing', SLATE),
  FAILED: status('failed', DANGER),
  CLOSED: status('closed', DANGER),
};

export function getConsultationStatusConfig(status?: string | null): ConsultationStatusConfig {
  return (status && CONSULTATION_STATUS_CONFIG[status]) || { label: status || '', ...SLATE };
}

/** Phiên theo luồng hàng đợi (15 phút/khối, trả bằng lượt) hay luồng gói cũ. */
export function isQueueFlow(flowType?: string | null): boolean {
  return flowType === 'QUEUE_DISPATCH_V1';
}
