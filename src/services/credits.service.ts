import axiosClient from '@/utils/axiosClient';
import type { ApiResponse, PageResponse } from '@/types/base';
import type {
  CreateCreditOrderRequest,
  CreditLedgerEntry,
  CreditOrderDetail,
  CreditOrderStatus,
  CreditOrderSummary,
  CreditPackage,
  CreditWallet,
  MemberCreditPaymentOverview,
} from '@/types/credits';

export interface GetOrdersParams {
  page?: number;
  size?: number;
  status?: CreditOrderStatus;
  from?: string;
  to?: string;
}

/** API ví lượt tư vấn của hội viên (cùng endpoint với web src/services/credits.service.ts). */
export const creditsApi = {
  /** Gói lượt đang mở bán */
  getPackages() {
    return axiosClient.get<ApiResponse<CreditPackage[]>>('/api/credits/packages');
  },
  /** Ví lượt: balance (tổng), reserved (đang giữ), available (dùng được) */
  getWallet() {
    return axiosClient.get<ApiResponse<CreditWallet>>('/api/credits/wallet');
  },
  /** Lịch sử biến động lượt */
  getLedger(page = 1, size = 10) {
    return axiosClient.get<ApiResponse<PageResponse<CreditLedgerEntry>>>('/api/credits/ledger', {
      params: { page, size },
    });
  },
  /** Mua gói lượt — bắt buộc Idempotency-Key để không tạo trùng đơn khi thử lại */
  createOrder(payload: CreateCreditOrderRequest, idempotencyKey: string) {
    return axiosClient.post<ApiResponse<CreditOrderDetail>>('/api/credits/orders', payload, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  },
  /** Tổng quan thanh toán (tổng tiền, tổng lượt đã mua, số đơn thành công) */
  getPaymentOverview(params?: { from?: string; to?: string }) {
    const query: Record<string, string> = {};
    if (params?.from) query.from = params.from;
    if (params?.to) query.to = params.to;
    return axiosClient.get<ApiResponse<MemberCreditPaymentOverview>>('/api/credits/payments/overview', {
      params: query,
    });
  },
  /** Lịch sử đơn mua lượt */
  getOrders(params?: GetOrdersParams) {
    const query: Record<string, string | number> = { page: params?.page ?? 1, size: params?.size ?? 10 };
    if (params?.status) query.status = params.status;
    if (params?.from) query.from = params.from;
    if (params?.to) query.to = params.to;
    return axiosClient.get<ApiResponse<PageResponse<CreditOrderSummary>>>('/api/credits/orders', { params: query });
  },
  getOrder(orderId: string | number) {
    return axiosClient.get<ApiResponse<CreditOrderDetail>>(`/api/credits/orders/${orderId}`);
  },
  /** Hủy đơn đang chờ thanh toán */
  cancelOrder(orderId: string | number) {
    return axiosClient.post<ApiResponse<CreditOrderDetail>>(`/api/credits/orders/${orderId}/cancel`);
  },
};
