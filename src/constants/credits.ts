import type {
  ConsultationCreditPolicy,
  CreditOperation,
  CreditOrderStatus,
  CreditPaymentProvider,
  CreditPaymentStatus,
  CreditReservationStatus,
  CreditSourceType,
} from '@/types/credits';
import i18n, { currentIntlLocale } from '@/i18n';

/**
 * Nhãn + màu cho ví lượt tư vấn — cùng nội dung với web (constants/credits.ts + locales credits.json)
 * để hội viên đọc trên app và trên web như nhau.
 * Nhãn đọc từ i18n lúc truy cập (getter), không lúc nạp module, để đổi ngôn ngữ là nhãn đổi theo.
 */
export interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
}

type StatusColors = Omit<StatusConfig, 'label'>;

const SUCCESS: StatusColors = { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' };
const WARNING: StatusColors = { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' };
const DANGER: StatusColors = { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' };
const PRIMARY: StatusColors = { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
const SLATE: StatusColors = { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };

const status = (key: string, colors: StatusColors): StatusConfig => ({
  get label() {
    return i18n.t(`credits:${key}`);
  },
  ...colors,
});

export const CREDIT_ORDER_STATUS_CONFIG: Record<CreditOrderStatus, StatusConfig> = {
  PAID: status('orderStatus.paid', SUCCESS),
  PENDING_PAYMENT: status('orderStatus.pendingPayment', WARNING),
  CANCELLED: status('orderStatus.cancelled', SLATE),
  EXPIRED: status('orderStatus.expired', DANGER),
  REQUIRES_REVIEW: status('orderStatus.requiresReview', WARNING),
};

export const CREDIT_PAYMENT_STATUS_CONFIG: Record<CreditPaymentStatus, StatusConfig> = {
  CREATING: status('paymentStatus.creating', PRIMARY),
  PENDING: status('paymentStatus.pending', WARNING),
  PAID: status('paymentStatus.paid', SUCCESS),
  CANCELLED: status('paymentStatus.cancelled', SLATE),
  EXPIRED: status('paymentStatus.expired', DANGER),
  REQUIRES_REVIEW: status('paymentStatus.requiresReview', WARNING),
};

export const CREDIT_RESERVATION_STATUS_CONFIG: Record<CreditReservationStatus, StatusConfig> = {
  HELD: status('reservationStatus.held', PRIMARY),
  CAPTURED: status('reservationStatus.captured', DANGER),
  RELEASED: status('reservationStatus.released', PRIMARY),
};

export const CREDIT_PAYMENT_PROVIDER_LABEL: Record<CreditPaymentProvider, string> = {
  get MOCK() {
    return i18n.t('credits:paymentProvider.mock.label');
  },
  get PAYOS() {
    return i18n.t('credits:paymentProvider.payos.label');
  },
};

const operation = (key: string, colors: StatusColors): StatusConfig & { description: string } => ({
  get label() {
    return i18n.t(`credits:operation.${key}.label`);
  },
  get description() {
    return i18n.t(`credits:operation.${key}.description`);
  },
  ...colors,
});

export const CREDIT_OPERATION_CONFIG: Record<CreditOperation, StatusConfig & { description: string }> = {
  PURCHASE: operation('purchase', PRIMARY),
  RESERVE: operation('reserve', PRIMARY),
  CAPTURE: operation('capture', DANGER),
  RELEASE: operation('release', PRIMARY),
  SESSION_CHARGE: operation('sessionCharge', DANGER),
  ADJUSTMENT: operation('adjustment', WARNING),
  SESSION_REFUND: operation('sessionRefund', SUCCESS),
};

export const CREDIT_SOURCE_TYPE_LABEL: Record<CreditSourceType, string> = {
  get PURCHASE_ORDER() {
    return i18n.t('credits:sourceType.purchaseOrder');
  },
  get CONSULTATION_REQUEST() {
    return i18n.t('credits:sourceType.consultationRequest');
  },
  get CONSULTATION_SESSION() {
    return i18n.t('credits:sourceType.consultationSession');
  },
  get ADMIN_ADJUSTMENT() {
    return i18n.t('credits:sourceType.adminAdjustment');
  },
};

export const CREDIT_ERROR_CODE_MESSAGES: Record<number, string> = {
  get 1003() {
    return i18n.t('credits:errorCode.c1003');
  },
  get 1201() {
    return i18n.t('credits:errorCode.c1201');
  },
  get 1203() {
    return i18n.t('credits:errorCode.c1203');
  },
  get 3001() {
    return i18n.t('credits:errorCode.c3001');
  },
  get 4008() {
    return i18n.t('credits:errorCode.c4008');
  },
  get 4100() {
    return i18n.t('credits:errorCode.c4100');
  },
  get 4103() {
    return i18n.t('credits:errorCode.c4103');
  },
  get 4104() {
    return i18n.t('credits:errorCode.c4104');
  },
  get 4105() {
    return i18n.t('credits:errorCode.c4105');
  },
  get 4106() {
    return i18n.t('credits:errorCode.c4106');
  },
  get 4108() {
    return i18n.t('credits:errorCode.c4108');
  },
  get 4109() {
    return i18n.t('credits:errorCode.c4109');
  },
  get 4110() {
    return i18n.t('credits:errorCode.c4110');
  },
  get 4111() {
    return i18n.t('credits:errorCode.c4111');
  },
  get 9999() {
    return i18n.t('credits:errorCode.c9999');
  },
};

/** Mã lỗi khi hội viên xác nhận bắt đầu phiên (giống web) */
export const CONSULTATION_CONFIRM_ERROR_MESSAGES: Record<number, string> = {
  get 4100() {
    return i18n.t('credits:confirmError.c4100');
  },
  get 4026() {
    return i18n.t('credits:confirmError.c4026');
  },
  get 4027() {
    return i18n.t('credits:confirmError.c4027');
  },
  get 4028() {
    return i18n.t('credits:confirmError.c4028');
  },
  get 4009() {
    return i18n.t('credits:confirmError.c4009');
  },
  get 4014() {
    return i18n.t('credits:confirmError.c4014');
  },
  get 4002() {
    return i18n.t('credits:confirmError.c4002');
  },
  get 4004() {
    return i18n.t('credits:confirmError.c4004');
  },
};

export function getCreditOrderStatusConfig(status?: string | null): StatusConfig {
  return (
    (status && (CREDIT_ORDER_STATUS_CONFIG as Record<string, StatusConfig>)[status]) || {
      label: status || i18n.t('credits:display.unknown'),
      ...SLATE,
    }
  );
}

export function getCreditPaymentStatusConfig(status?: string | null): StatusConfig {
  return (
    (status && (CREDIT_PAYMENT_STATUS_CONFIG as Record<string, StatusConfig>)[status]) || {
      label: status || i18n.t('credits:display.unknown'),
      ...SLATE,
    }
  );
}

export function getCreditReservationStatusConfig(status?: string | null): StatusConfig {
  return (
    (status && (CREDIT_RESERVATION_STATUS_CONFIG as Record<string, StatusConfig>)[status]) || {
      label: status || i18n.t('credits:reservationStatus.none'),
      ...SLATE,
    }
  );
}

export function getCreditOperationConfig(op?: string | null) {
  return (
    (op && (CREDIT_OPERATION_CONFIG as Record<string, StatusConfig & { description: string }>)[op]) || {
      label: op || i18n.t('credits:operation.fallbackLabel'),
      description: i18n.t('credits:operation.fallbackDescription'),
      ...SLATE,
    }
  );
}

export function getCreditSourceTypeLabel(sourceType?: string | null): string {
  return (
    (sourceType && (CREDIT_SOURCE_TYPE_LABEL as Record<string, string>)[sourceType]) ||
    sourceType ||
    i18n.t('credits:sourceType.fallback')
  );
}

export function getCreditPaymentProviderLabel(provider?: string | null): string {
  return (
    (provider && (CREDIT_PAYMENT_PROVIDER_LABEL as Record<string, string>)[provider]) ||
    provider ||
    i18n.t('credits:paymentProvider.fallbackDescription')
  );
}

/** "3 lượt" / "3 credits" */
export function formatCreditQuantity(qty?: number | null): string {
  const n = typeof qty === 'number' && !Number.isNaN(qty) ? qty : 0;
  return i18n.t('credits:quantity.credits', { count: n, value: n.toLocaleString(currentIntlLocale()) });
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
      ? i18n.t('credits:display.creditUsed')
      : i18n.t('credits:display.chargedOnConfirm');
  }
  if (snapshot.creditPolicy === 'PER_SESSION_V1') {
    if (snapshot.creditReservationStatus === 'HELD') return i18n.t('credits:display.held');
    if (snapshot.creditReservationStatus === 'CAPTURED') return i18n.t('credits:display.creditUsed');
    if (snapshot.creditReservationStatus === 'RELEASED') return i18n.t('credits:display.released');
  }
  return null;
}
