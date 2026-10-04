import { useCallback, useRef, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { creditsApi } from '@/services/credits.service';
import { generateCreditIdempotencyKey } from '@/constants/credits';
import { readCreditsError } from './useCreditsData';
import type { CreditOrderDetail, CreditPackage } from '@/types/credits';

/** Giữ Idempotency-Key của lần mua chưa xong để thử lại cùng mã (không tạo trùng đơn). */
const pendingIntents = new Map<string, string>();

const unwrap = <T,>(res: unknown): T => {
  const body = (res as { data?: { data?: T } })?.data;
  return (body?.data ?? body) as T;
};

export type PurchaseOutcome =
  | { kind: 'paid'; detail: CreditOrderDetail }
  | { kind: 'pending'; detail: CreditOrderDetail }
  | { kind: 'review'; detail: CreditOrderDetail }
  | { kind: 'error'; message: string };

/**
 * Mua gói lượt (giống web use-credit-purchase): MOCK trả PAID ngay; PayOS mở trang thanh toán trong
 * trình duyệt, khi người dùng quay lại app thì hỏi lại server trạng thái đơn.
 */
export function useCreditPurchase() {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFeatureDisabled, setIsFeatureDisabled] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [hasPendingRetry, setHasPendingRetry] = useState(false);
  const [successResult, setSuccessResult] = useState<CreditOrderDetail | null>(null);
  const [pendingOrder, setPendingOrder] = useState<CreditOrderDetail | null>(null);
  const inFlightRef = useRef(false);

  const selectPackage = useCallback((pkg: CreditPackage) => {
    setSuccessResult(null);
    setPendingOrder(null);
    setLastError(null);
    setIsFeatureDisabled(false);
    const saved = pendingIntents.get(pkg.id);
    setSelectedPackage(pkg);
    if (saved) {
      setIdempotencyKey(saved);
      setHasPendingRetry(true);
    } else {
      const key = generateCreditIdempotencyKey();
      pendingIntents.set(pkg.id, key);
      setIdempotencyKey(key);
      setHasPendingRetry(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsSubmitting(false);
    inFlightRef.current = false;
    setSuccessResult(null);
    setPendingOrder(null);
    setLastError(null);
    setIsFeatureDisabled(false);
  }, []);

  /** Sau khi đóng trình duyệt PayOS: hỏi lại trạng thái đơn vài lần (webhook có thể về chậm vài giây). */
  const pollOrder = useCallback(async (orderId: string, attempts = 6): Promise<CreditOrderDetail | null> => {
    for (let i = 0; i < attempts; i += 1) {
      try {
        const detail = unwrap<CreditOrderDetail>(await creditsApi.getOrder(orderId));
        if (detail?.order?.status && detail.order.status !== 'PENDING_PAYMENT') return detail;
        if (i === attempts - 1) return detail ?? null;
      } catch {
        // thử lại
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    return null;
  }, []);

  const executePurchase = useCallback(async (): Promise<PurchaseOutcome> => {
    if (!selectedPackage || !idempotencyKey) return { kind: 'error', message: 'Thiếu thông tin gói hoặc phiên đăng nhập.' };
    if (inFlightRef.current) return { kind: 'error', message: 'Giao dịch đang được xử lý.' };
    inFlightRef.current = true;
    setIsSubmitting(true);
    setLastError(null);
    try {
      const result = unwrap<CreditOrderDetail>(await creditsApi.createOrder({ packageId: String(selectedPackage.id) }, idempotencyKey));
      const { order, payment } = result;

      if (order.status === 'PAID') {
        pendingIntents.delete(selectedPackage.id);
        setHasPendingRetry(false);
        setSuccessResult(result);
        return { kind: 'paid', detail: result };
      }

      if (order.status === 'REQUIRES_REVIEW') {
        pendingIntents.delete(selectedPackage.id);
        setHasPendingRetry(false);
        setLastError('Giao dịch đã được ghi nhận và đang được hệ thống kiểm tra.');
        return { kind: 'review', detail: result };
      }

      if (payment?.provider === 'PAYOS' && order.status === 'PENDING_PAYMENT') {
        if (payment.status === 'CREATING' || !payment.checkoutUrl) {
          setHasPendingRetry(true);
          setPendingOrder(result);
          setLastError('Giao dịch đang được khởi tạo. Vui lòng kiểm tra lại sau.');
          return { kind: 'pending', detail: result };
        }
        if (!payment.checkoutUrl.startsWith('https://')) {
          setLastError('Liên kết thanh toán từ cổng thanh toán không an toàn (yêu cầu HTTPS).');
          return { kind: 'error', message: 'Liên kết thanh toán không an toàn.' };
        }
        pendingIntents.delete(selectedPackage.id);
        setHasPendingRetry(false);
        await WebBrowser.openBrowserAsync(payment.checkoutUrl);
        const latest = (await pollOrder(String(order.id))) ?? result;
        if (latest.order.status === 'PAID') {
          setSuccessResult(latest);
          return { kind: 'paid', detail: latest };
        }
        setPendingOrder(latest);
        return { kind: 'pending', detail: latest };
      }

      setPendingOrder(result);
      return { kind: 'pending', detail: result };
    } catch (err) {
      const parsed = readCreditsError(err, 'Giao dịch mua không thành công. Vui lòng thử lại.');
      let message = parsed.message;
      if (parsed.status === 503 || parsed.code === 4108) {
        setIsFeatureDisabled(true);
        message = 'Chức năng mua lượt tư vấn tạm thời chưa khả dụng.';
      } else if (parsed.code === 4103) {
        message = 'Xung đột khóa giao dịch (Idempotency). Vui lòng thử lại với cùng gói hoặc kiểm tra lại lịch sử đơn.';
      } else if (parsed.code === 4105) {
        message = 'Gói lượt tư vấn đã ngừng mở bán. Vui lòng tải lại danh sách gói.';
      } else if (parsed.code === 4020) {
        message = 'Cổng thanh toán PayOS chưa được cấu hình trên hệ thống.';
      } else if (parsed.code === 4021 || parsed.status === 502) {
        message = 'Cổng thanh toán PayOS không phản hồi hoặc từ chối thao tác. Vui lòng thử lại sau.';
        setHasPendingRetry(true);
      } else if (parsed.status == null || parsed.status >= 500) {
        message = 'Không thể kết nối tới máy chủ. Trạng thái giao dịch chưa được xác nhận; vui lòng bấm Thử lại để kiểm tra với cùng mã yêu cầu.';
        setHasPendingRetry(true);
      }
      setLastError(message);
      return { kind: 'error', message };
    } finally {
      inFlightRef.current = false;
      setIsSubmitting(false);
    }
  }, [selectedPackage, idempotencyKey, pollOrder]);

  return {
    selectedPackage,
    idempotencyKey,
    isSubmitting,
    isFeatureDisabled,
    lastError,
    hasPendingRetry,
    successResult,
    pendingOrder,
    selectPackage,
    reset,
    executePurchase,
    pollOrder,
  };
}
