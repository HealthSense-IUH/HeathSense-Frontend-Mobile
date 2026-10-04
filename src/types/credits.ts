export type CreditOrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "CANCELLED"
  | "EXPIRED"
  | "REQUIRES_REVIEW"


export type CreditPaymentStatus =
  | "CREATING"
  | "PENDING"
  | "PAID"
  | "CANCELLED"
  | "EXPIRED"
  | "REQUIRES_REVIEW"

export type CreditPaymentProvider = "MOCK" | "PAYOS"

export type CreditOperation =
  | "PURCHASE"
  | "RESERVE"
  | "CAPTURE"
  | "RELEASE"
  | "SESSION_CHARGE"
  | "ADJUSTMENT"
  | "SESSION_REFUND"

export type CreditSourceType =
  | "PURCHASE_ORDER"
  | "CONSULTATION_REQUEST"
  | "CONSULTATION_SESSION"
  | "ADMIN_ADJUSTMENT"

export type ConsultationCreditPolicy =
  | "FREE_EXISTING"
  | "FREE_DISABLED"
  | "PER_SESSION_V1"
  | "PER_SESSION_CONFIRM_V2"

export type CreditReservationStatus = "HELD" | "CAPTURED" | "RELEASED"


export interface CreditWallet {
  id?: string
  memberId?: string
  // balance: tổng lượt còn lại, gồm lượt đang giữ
  balance: number
  // reserved: lượt đang được giữ
  reserved: number
  available: number // balance - reserved
  version?: number
  updatedAt?: string
}

export interface CreditPackage {
  id: string
  code: string
  name: string
  description?: string | null
  creditQuantity: number
  priceVnd: number
}

export interface CreditLedgerEntry {
  id: string
  operation: CreditOperation
  quantity: number
  deltaBalance: number
  deltaReserved: number
  balanceAfter: number
  reservedAfter: number
  sourceType: CreditSourceType
  sourceId: string
  createdAt: string
}

export interface CreateCreditOrderRequest {
  packageId: string
}

export interface CreditOrderSummary {
  id: string
  packageId: string
  packageCode: string
  packageName: string
  creditQuantity: number
  amountVnd: number
  currency: "VND"
  status: CreditOrderStatus
  createdAt: string
  paidAt?: string | null
}

export interface CreditPaymentSummary {
  attemptId: string
  provider: CreditPaymentProvider
  status: CreditPaymentStatus
  orderCode?: string | null
  paymentLinkId?: string | null
  checkoutUrl?: string | null
  expiresAt?: string | null
}

export interface CreditOrderDetail {
  order: CreditOrderSummary
  payment: CreditPaymentSummary
  wallet: CreditWallet
}

export interface MemberCreditPaymentOverview {
  totalPaidVnd: number
  totalPurchasedCredits: number
  successfulOrderCount: number
  firstPaidAt: string | null
  lastPaidAt: string | null
  wallet: CreditWallet
}
