import { useCallback, useEffect, useRef, useState } from 'react';
import { consultationApi } from '@/services/consultation.service';
import { creditsApi } from '@/services/credits.service';
import { CONSULTATION_CONFIRM_ERROR_MESSAGES } from '@/constants/credits';
import i18n from '@/i18n';
import type {
  ConsultationQueueStatisticsResponse,
  ConsultationRequestItem,
  ConsultationSessionItem,
  CurrentQueueStateResponse,
  HealthRecordItem,
} from '@/types/consultation';
import type { CreditWallet } from '@/types/credits';

export type AlertState = {
  type: 'success' | 'error';
  text: string;
};

export interface RequestFormData {
  reasonForCare: string;
  currentConcern: string;
}

const EMPTY_FORM: RequestFormData = { reasonForCare: '', currentConcern: '' };

/** Server bọc kết quả trong { data }; axios bọc thêm một lớp data nữa. */
const unwrap = <T,>(res: unknown): T => {
  const body = (res as { data?: { data?: T } })?.data;
  return (body?.data ?? body) as T;
};

export function readError(error: unknown, fallback: string) {
  const err = error as { response?: { status?: number; data?: { message?: string; code?: number } | string }; message?: string };
  const data = err?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  const serverMsg = typeof data === 'object' && data ? data.message : undefined;
  if (serverMsg === 'Uncategorized error') {
    return i18n.t('common:error.server');
  }
  return serverMsg || err?.message || fallback;
}

function errorCode(error: unknown): number | null {
  const data = (error as { response?: { data?: { code?: number | string; errorCode?: number | string } } })?.response?.data;
  const raw = data?.code ?? data?.errorCode;
  return raw == null ? null : Number(raw);
}

function sortSessions(list: ConsultationSessionItem[]) {
  return [...list].sort((a, b) => {
    const aActive = a.status === 'ACTIVE' ? 1 : 0;
    const bActive = b.status === 'ACTIVE' ? 1 : 0;
    if (aActive !== bActive) return bActive - aActive;
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA !== timeB) return timeB - timeA;
    return String(b.id).localeCompare(String(a.id), undefined, { numeric: true });
  });
}

/** Hội viên đang có yêu cầu dở dang (trong hàng đợi / chờ xác nhận / phiên đang mở) thì không tạo thêm. */
export function hasActiveQueue(state: CurrentQueueStateResponse | null): boolean {
  if (!state) return false;
  return (
    state.queueStatus === 'WAITING' ||
    state.queueStatus === 'OFFERING_DOCTOR' ||
    state.queueStatus === 'WAITING_MEMBER_CONFIRMATION' ||
    state.phase === 'QUEUE' ||
    state.phase === 'WAITING_CONFIRMATION' ||
    state.phase === 'ACTIVE_SESSION'
  );
}

/**
 * Luồng tư vấn của hội viên (giống web use-consultations-logic, phần member):
 * gửi yêu cầu → hàng đợi → bác sĩ nhận → xác nhận → phiên 15 phút; trả bằng lượt tư vấn.
 */
export function useConsultationsLogic() {
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [healthRecords, setHealthRecords] = useState<HealthRecordItem[]>([]);
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [requests, setRequests] = useState<ConsultationRequestItem[]>([]);
  const [sessions, setSessions] = useState<ConsultationSessionItem[]>([]);
  const [currentQueueState, setCurrentQueueState] = useState<CurrentQueueStateResponse | null>(null);
  const [queueStatistics, setQueueStatistics] = useState<ConsultationQueueStatisticsResponse | null>(null);
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [requestForm, setRequestForm] = useState<RequestFormData>(EMPTY_FORM);
  const confirmLockRef = useRef(false);

  const fetchCurrentQueueState = useCallback(async () => {
    try {
      const data = unwrap<CurrentQueueStateResponse | null>(await consultationApi.getCurrentQueueState());
      setCurrentQueueState(data ?? null);
      // Phiên vừa kích hoạt mà danh sách chưa có thì nạp riêng phiên đó
      if (data?.phase === 'ACTIVE_SESSION' && data.sessionId) {
        const sid = String(data.sessionId);
        setSessions((prev) => {
          if (prev.some((s) => String(s.id) === sid)) return prev;
          void consultationApi
            .getSession(sid)
            .then((res) => {
              const session = unwrap<ConsultationSessionItem>(res);
              if (session?.id) {
                setSessions((cur) => (cur.some((c) => String(c.id) === sid) ? cur : sortSessions([session, ...cur])));
              }
            })
            .catch(() => {});
          return prev;
        });
      }
      return data ?? null;
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404 || errorCode(err) === 4001) setCurrentQueueState(null);
      return null;
    }
  }, []);

  const refreshWallet = useCallback(async () => {
    try {
      const data = unwrap<CreditWallet>(await creditsApi.getWallet());
      if (data) setWallet(data);
    } catch {
      // giữ ví cũ
    }
  }, []);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [reqRes, sessRes, recRes, queueRes, statsRes, walletRes] = await Promise.allSettled([
        consultationApi.listMyRequests({ page: 1, size: 10 }),
        consultationApi.listMySessions({ page: 1, size: 50 }),
        consultationApi.listMyHealthRecords({ page: 1, size: 10 }),
        consultationApi.getCurrentQueueState(),
        consultationApi.getQueueStatistics(),
        creditsApi.getWallet(),
      ]);

      const queueState = queueRes.status === 'fulfilled' ? unwrap<CurrentQueueStateResponse | null>(queueRes.value) ?? null : null;
      setCurrentQueueState(queueState);
      if (statsRes.status === 'fulfilled') setQueueStatistics(unwrap<ConsultationQueueStatisticsResponse>(statsRes.value) ?? null);
      if (walletRes.status === 'fulfilled') setWallet(unwrap<CreditWallet>(walletRes.value) ?? null);

      const loadedSessions: ConsultationSessionItem[] =
        sessRes.status === 'fulfilled' ? [...(unwrap<{ content?: ConsultationSessionItem[] }>(sessRes.value)?.content ?? [])] : [];
      if (queueState?.sessionId && !loadedSessions.some((s) => String(s.id) === String(queueState.sessionId))) {
        try {
          const single = unwrap<ConsultationSessionItem>(await consultationApi.getSession(queueState.sessionId));
          if (single?.id) loadedSessions.unshift(single);
        } catch {
          // lỗi tạm thời, bỏ qua
        }
      }
      setSessions(sortSessions(loadedSessions));

      const loadedRequests: ConsultationRequestItem[] =
        reqRes.status === 'fulfilled' ? [...(unwrap<{ content?: ConsultationRequestItem[] }>(reqRes.value)?.content ?? [])] : [];
      loadedRequests.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        return String(b.id).localeCompare(String(a.id), undefined, { numeric: true });
      });
      setRequests(loadedRequests);

      if (recRes.status === 'fulfilled') {
        setHealthRecords(unwrap<{ content?: HealthRecordItem[] }>(recRes.value)?.content ?? []);
      }

      if (reqRes.status === 'rejected' && sessRes.status === 'rejected') {
        setAlert({ type: 'error', text: readError(reqRes.reason, i18n.t('consultation:logic.alerts.loadDataFailed')) });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadData());
  }, [loadData]);

  // Đang trong hàng đợi / chờ xác nhận thì hỏi lại server mỗi 4 giây (giống web)
  useEffect(() => {
    const phase = currentQueueState?.phase;
    if (phase !== 'QUEUE' && phase !== 'WAITING_CONFIRMATION') return;
    const interval = setInterval(() => {
      void fetchCurrentQueueState();
    }, 4000);
    return () => clearInterval(interval);
  }, [currentQueueState?.phase, fetchCurrentQueueState]);

  /** Gửi yêu cầu & vào hàng đợi. Trả về 'ok' | 'conflict' (đang có yêu cầu) | 'error'. */
  const handleCreateRequest = async (): Promise<'ok' | 'conflict' | 'error'> => {
    setAlert(null);
    setInsufficientCredits(false);
    if (!requestForm.reasonForCare.trim()) {
      setAlert({ type: 'error', text: i18n.t('consultation:logic.alerts.reasonForCareRequired') });
      return 'error';
    }
    if (!requestForm.currentConcern.trim()) {
      setAlert({ type: 'error', text: i18n.t('consultation:logic.alerts.currentConcernRequired') });
      return 'error';
    }
    if (healthRecords.length === 0) {
      setAlert({ type: 'error', text: i18n.t('consultation:logic.alerts.ecgRequired') });
      return 'error';
    }
    if (wallet && wallet.available <= 0) {
      setInsufficientCredits(true);
      setAlert({ type: 'error', text: i18n.t('consultation:logic.alerts.noCreditsForQueue') });
      return 'error';
    }
    if (hasActiveQueue(currentQueueState)) return 'conflict';

    setActionLoading(true);
    try {
      const res = await consultationApi.createQueueRequest({
        reasonForCare: requestForm.reasonForCare.trim(),
        currentConcern: requestForm.currentConcern.trim(),
        selectedHealthRecordIds: [String(healthRecords[0].id)],
      });
      const created = unwrap<ConsultationRequestItem>(res);
      setRequestForm(EMPTY_FORM);
      const queueNumber = created?.queueNumber ? ` #${String(created.queueNumber).padStart(3, '0')}` : '';
      setAlert({ type: 'success', text: i18n.t('consultation:logic.alerts.queueJoined', { queueNumber }) });
      await fetchCurrentQueueState();
      await loadData(true);
      return 'ok';
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const code = errorCode(err);
      const msg = readError(err, '').toLowerCase();
      const isConflict =
        status === 409 &&
        (code === 4004 || code === 4005 || msg.includes('pending consultation request') || msg.includes('active consultation') || msg.includes('already has a pending'));
      if (isConflict) {
        void fetchCurrentQueueState();
        return 'conflict';
      }
      const isInsufficient = status === 409 && (code === 4100 || msg.includes('lượt') || msg.includes('credit'));
      if (isInsufficient) {
        setInsufficientCredits(true);
        setAlert({ type: 'error', text: i18n.t('consultation:logic.alerts.insufficientCreditsForQueue') });
      } else {
        setAlert({ type: 'error', text: readError(err, i18n.t('consultation:logic.alerts.createRequestFailed')) });
      }
      return 'error';
    } finally {
      setActionLoading(false);
    }
  };

  /** Bác sĩ đã nhận lượt → hội viên xác nhận để mở phiên (trừ 1 lượt). Trả về phiên nếu thành công. */
  const handleConfirmQueue = async (offerId: string): Promise<ConsultationSessionItem | null> => {
    if (!currentQueueState || confirmLockRef.current) return null;
    confirmLockRef.current = true;
    setActionLoading(true);
    setAlert(null);
    try {
      const session = unwrap<ConsultationSessionItem>(await consultationApi.confirmQueueRequest(currentQueueState.requestId, { offerId }));
      setAlert({ type: 'success', text: i18n.t('consultation:logic.alerts.queueConfirmed') });
      await fetchCurrentQueueState();
      await loadData(true);
      return session ?? null;
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const code = errorCode(err);
      const msg = readError(err, '').toLowerCase();
      if (code === 4100 || (status === 409 && msg.includes('lượt'))) {
        setInsufficientCredits(true);
        setAlert({ type: 'error', text: CONSULTATION_CONFIRM_ERROR_MESSAGES[4100] });
        await refreshWallet();
      } else if (code && CONSULTATION_CONFIRM_ERROR_MESSAGES[code]) {
        setAlert({ type: 'error', text: CONSULTATION_CONFIRM_ERROR_MESSAGES[code] });
        if (code === 4004) await loadData(true);
      } else {
        setAlert({ type: 'error', text: readError(err, i18n.t('consultation:logic.alerts.confirmQueueFailed')) });
      }
      await fetchCurrentQueueState();
      return null;
    } finally {
      confirmLockRef.current = false;
      setActionLoading(false);
    }
  };

  /** Rời hàng đợi / hủy lượt chờ. */
  const handleCancelQueue = async (requestId: string | number) => {
    setActionLoading(true);
    setAlert(null);
    try {
      await consultationApi.cancelRequest(requestId);
      setAlert({ type: 'success', text: i18n.t('consultation:logic.alerts.leftQueue') });
      setCurrentQueueState(null);
      await loadData(true);
      return true;
    } catch (err) {
      setAlert({ type: 'error', text: readError(err, i18n.t('consultation:logic.alerts.cancelQueueFailed')) });
      await fetchCurrentQueueState();
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleShareHealthRecord = async (sessionId: string | number, recordId: string | number) => {
    setActionLoading(true);
    try {
      await consultationApi.shareHealthRecord(sessionId, recordId);
      setAlert({ type: 'success', text: i18n.t('consultation:shareHealthRecordDialog.toast.successDescription', { id: recordId }) });
      return true;
    } catch (err) {
      setAlert({ type: 'error', text: readError(err, i18n.t('consultation:shareHealthRecordDialog.toast.shareErrorDescription')) });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // ---- Gia hạn (chỉ cho phiên luồng gói cũ, giống web RenewalDialog) ----
  const handleRequestRenewal = async (sessionId: string | number) => {
    setActionLoading(true);
    try {
      await consultationApi.requestRenewal(sessionId, {});
      setAlert({ type: 'success', text: i18n.t('consultation:renewalDialog.toast.requestSuccessDescription') });
      await loadData(true);
      return true;
    } catch (err) {
      setAlert({ type: 'error', text: readError(err, i18n.t('consultation:renewalDialog.toast.requestErrorDescription')) });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRenewalAgreement = async (renewalId: string | number, agreementId: string | number) => {
    setActionLoading(true);
    try {
      await consultationApi.acceptRenewalAgreement(renewalId, { agreementId: Number(agreementId), accepted: true });
      setAlert({ type: 'success', text: i18n.t('consultation:renewalAgreementDialog.toast.acceptSuccessDescription') });
      await loadData(true);
      return true;
    } catch (err) {
      setAlert({ type: 'error', text: readError(err, i18n.t('consultation:renewalAgreementDialog.toast.acceptErrorDescription')) });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleInitiateRenewalPayment = async (renewalId: string | number) => {
    setActionLoading(true);
    try {
      const paymentData = unwrap<{ checkoutUrl?: string }>(await consultationApi.createRenewalPayment(renewalId));
      if (paymentData?.checkoutUrl) {
        const WebBrowser = await import('expo-web-browser');
        await WebBrowser.openBrowserAsync(paymentData.checkoutUrl);
        await loadData(true);
        return true;
      }
      setAlert({ type: 'error', text: i18n.t('consultation:renewalDialog.toast.paymentLinkErrorDescription') });
      return false;
    } catch (err) {
      setAlert({ type: 'error', text: readError(err, i18n.t('consultation:renewalDialog.toast.paymentInitErrorDescription')) });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRenewal = async (renewalId: string | number) => {
    setActionLoading(true);
    try {
      await consultationApi.cancelRenewal(renewalId);
      setAlert({ type: 'success', text: i18n.t('consultation:renewalDialog.toast.cancelSuccessDescription') });
      await loadData(true);
      return true;
    } catch (err) {
      setAlert({ type: 'error', text: readError(err, i18n.t('consultation:renewalDialog.toast.cancelErrorDescription')) });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    alert,
    setAlert,
    loading,
    actionLoading,
    healthRecords,
    wallet,
    requests,
    sessions,
    currentQueueState,
    queueStatistics,
    insufficientCredits,
    setInsufficientCredits,
    requestForm,
    setRequestForm,
    loadData,
    fetchCurrentQueueState,
    refreshWallet,
    handleCreateRequest,
    handleConfirmQueue,
    handleCancelQueue,
    handleShareHealthRecord,
    handleRequestRenewal,
    handleAcceptRenewalAgreement,
    handleInitiateRenewalPayment,
    handleCancelRenewal,
  };
}
