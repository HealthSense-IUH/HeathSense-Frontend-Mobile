import { useCallback, useEffect, useState } from 'react';
import { creditsApi } from '@/services/credits.service';
import { CREDIT_ERROR_CODE_MESSAGES } from '@/constants/credits';
import type { PageResponse } from '@/types/base';
import type {
  CreditLedgerEntry,
  CreditOrderStatus,
  CreditOrderSummary,
  CreditPackage,
  CreditWallet,
  MemberCreditPaymentOverview,
} from '@/types/credits';

export type PaymentDatePreset = 'all' | 'today' | 'last7days' | 'thisMonth';

export const PAYMENT_DATE_PRESETS: { key: PaymentDatePreset; label: string }[] = [
  { key: 'all', label: 'Toàn thời gian' },
  { key: 'today', label: 'Hôm nay' },
  { key: 'last7days', label: '7 ngày qua' },
  { key: 'thisMonth', label: 'Tháng này' },
];

const unwrap = <T,>(res: unknown): T => {
  const body = (res as { data?: { data?: T } })?.data;
  return (body?.data ?? body) as T;
};

/** Thông điệp lỗi: ưu tiên mã lỗi nghiệp vụ của ví lượt, rồi tới message server. */
export function readCreditsError(error: unknown, fallback: string): { message: string; code: number | null; status: number | null } {
  const err = error as { response?: { status?: number; data?: { code?: number | string; message?: string } }; message?: string };
  const status = err?.response?.status ?? null;
  const rawCode = err?.response?.data?.code;
  const code = rawCode == null ? null : Number(rawCode);
  const mapped = code != null ? CREDIT_ERROR_CODE_MESSAGES[code] : undefined;
  return { message: mapped || err?.response?.data?.message || err?.message || fallback, code, status };
}

/** Khoảng thời gian [from, to) theo giờ máy cho bộ lọc đơn mua. */
export function getPaymentDateRange(preset: PaymentDatePreset): { from?: string; to?: string } {
  if (preset === 'all') return {};
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const tomorrow = new Date(startOfDay(now).getTime() + 24 * 60 * 60 * 1000);
  if (preset === 'today') return { from: startOfDay(now).toISOString(), to: tomorrow.toISOString() };
  if (preset === 'last7days') {
    const past = new Date(startOfDay(now).getTime() - 6 * 24 * 60 * 60 * 1000);
    return { from: past.toISOString(), to: tomorrow.toISOString() };
  }
  return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), to: tomorrow.toISOString() };
}

/** Dữ liệu ví lượt tư vấn: ví, gói, tổng quan thanh toán, đơn mua, biến động (giống web use-credits-data). */
export function useCreditsData() {
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);

  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const [isFeatureDisabled, setIsFeatureDisabled] = useState(false);

  const [overview, setOverview] = useState<MemberCreditPaymentOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  const [datePreset, setDatePreset] = useState<PaymentDatePreset>('all');
  const [orderStatus, setOrderStatus] = useState<CreditOrderStatus | undefined>(undefined);
  const [ordersPage, setOrdersPage] = useState(1);
  const [orders, setOrders] = useState<PageResponse<CreditOrderSummary> | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledger, setLedger] = useState<PageResponse<CreditLedgerEntry> | null>(null);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [ledgerError, setLedgerError] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    setLoadingWallet(true);
    setWalletError(null);
    try {
      setWallet(unwrap<CreditWallet>(await creditsApi.getWallet()));
    } catch (err) {
      setWalletError(readCreditsError(err, 'Không thể tải thông tin ví.').message);
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  const loadPackages = useCallback(async () => {
    setLoadingPackages(true);
    setPackagesError(null);
    setIsFeatureDisabled(false);
    try {
      setPackages(unwrap<CreditPackage[]>(await creditsApi.getPackages()) || []);
    } catch (err) {
      const parsed = readCreditsError(err, 'Không thể tải danh sách gói lượt.');
      if (parsed.status === 503 || parsed.code === 4108) {
        setIsFeatureDisabled(true);
        setPackagesError('Chức năng mua lượt tư vấn tạm thời chưa khả dụng.');
      } else {
        setPackagesError(parsed.message);
      }
    } finally {
      setLoadingPackages(false);
    }
  }, []);

  const loadOverview = useCallback(async (preset: PaymentDatePreset) => {
    setLoadingOverview(true);
    try {
      const data = unwrap<MemberCreditPaymentOverview>(await creditsApi.getPaymentOverview(getPaymentDateRange(preset)));
      setOverview(data);
      if (data?.wallet) setWallet((prev) => (prev ? { ...prev, ...data.wallet } : data.wallet));
    } catch {
      setOverview(null);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const loadOrders = useCallback(async (page: number, preset: PaymentDatePreset, status?: CreditOrderStatus) => {
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      setOrders(unwrap<PageResponse<CreditOrderSummary>>(await creditsApi.getOrders({ page, size: 10, status, ...getPaymentDateRange(preset) })));
      setOrdersPage(page);
    } catch (err) {
      setOrdersError(readCreditsError(err, 'Không thể tải lịch sử đơn mua.').message);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const loadLedger = useCallback(async (page = 1) => {
    setLoadingLedger(true);
    setLedgerError(null);
    try {
      setLedger(unwrap<PageResponse<CreditLedgerEntry>>(await creditsApi.getLedger(page, 10)));
      setLedgerPage(page);
    } catch (err) {
      setLedgerError(readCreditsError(err, 'Không thể tải lịch sử biến động lượt.').message);
    } finally {
      setLoadingLedger(false);
    }
  }, []);

  const changeDatePreset = useCallback(
    (preset: PaymentDatePreset) => {
      setDatePreset(preset);
      void loadOverview(preset);
      void loadOrders(1, preset, orderStatus);
    },
    [loadOverview, loadOrders, orderStatus]
  );

  const changeOrderStatus = useCallback(
    (status?: CreditOrderStatus) => {
      setOrderStatus(status);
      void loadOrders(1, datePreset, status);
    },
    [loadOrders, datePreset]
  );

  const changeOrdersPage = useCallback((page: number) => void loadOrders(page, datePreset, orderStatus), [loadOrders, datePreset, orderStatus]);

  const refreshAll = useCallback(async () => {
    await Promise.allSettled([loadWallet(), loadPackages(), loadOverview(datePreset), loadOrders(ordersPage, datePreset, orderStatus), loadLedger(1)]);
  }, [loadWallet, loadPackages, loadOverview, loadOrders, loadLedger, datePreset, ordersPage, orderStatus]);

  useEffect(() => {
    queueMicrotask(() => void Promise.allSettled([loadWallet(), loadPackages(), loadOverview('all'), loadOrders(1, 'all'), loadLedger(1)]));
  }, [loadWallet, loadPackages, loadOverview, loadOrders, loadLedger]);

  return {
    wallet,
    loadingWallet,
    walletError,
    loadWallet,
    setWallet,
    packages,
    loadingPackages,
    packagesError,
    isFeatureDisabled,
    loadPackages,
    overview,
    loadingOverview,
    datePreset,
    changeDatePreset,
    orderStatus,
    changeOrderStatus,
    orders,
    ordersPage,
    loadingOrders,
    ordersError,
    changeOrdersPage,
    ledger,
    ledgerPage,
    loadingLedger,
    ledgerError,
    loadLedger,
    refreshAll,
  };
}
