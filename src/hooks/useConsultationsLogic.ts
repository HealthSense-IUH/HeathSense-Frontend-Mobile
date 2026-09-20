import { useCallback, useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { useConsultationSocket } from './useConsultationSocket';
import { consultationApi } from '../../services/consultation.service';
import type {
  ConsultationMessageItem,
  ConsultationRequestItem,
  ConsultationSessionItem,
  CareServicePackage,
  HealthRecordItem,
} from '@/types/consultation';

export type AlertState = {
  type: 'success' | 'error';
  text: string;
};

export interface RequestFormData {
  packageId: string;
  reasonForCare: string;
  currentConcern: string;
  careGoal: string;
  memberNote: string;
  selectedHealthRecordIds?: string[];
}

const DEFAULT_CHAT_SIZE = 30;

function readError(error: unknown, fallback: string) {
  const err = error as { response?: { status?: number; data?: { message?: string; code?: number } }; message?: string };
  const serverMsg = err.response?.data?.message;
  if (serverMsg === 'Uncategorized error') {
    return 'Hệ thống đang gặp sự cố xử lý dữ liệu từ máy chủ (Uncategorized error). Vui lòng thử lại sau.';
  }
  return serverMsg || err.message || fallback;
}

export function useConsultationsLogic(activeSessionId?: string | number) {
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [packages, setPackages] = useState<CareServicePackage[]>([]);
  const [requests, setRequests] = useState<ConsultationRequestItem[]>([]);
  const [sessions, setSessions] = useState<ConsultationSessionItem[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecordItem[]>([]);
  
  const [selectedSession, setSelectedSession] = useState<ConsultationSessionItem | null>(null);
  const [messages, setMessages] = useState<ConsultationMessageItem[]>([]);
  const [messageDraft, setMessageDraft] = useState('');
  
  const [requestForm, setRequestForm] = useState<RequestFormData>({
    packageId: '',
    reasonForCare: '',
    currentConcern: '',
    careGoal: '',
    memberNote: '',
    selectedHealthRecordIds: [],
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pkgResult, reqResult, sessResult, recResult] = await Promise.allSettled([
        consultationApi.listCareServicePackages({ page: 1, size: 50 }),
        consultationApi.listMyRequests({ page: 1, size: 50 }),
        consultationApi.listMySessions({ page: 1, size: 50 }),
        consultationApi.listMyHealthRecords({ page: 1, size: 50 }),
      ]);

      if (pkgResult.status === 'fulfilled') {
        const data = (pkgResult.value as any).data?.data?.content || (pkgResult.value as any).data?.data;
        if (Array.isArray(data)) setPackages(data);
      } else {
        console.warn('[Consultation] Failed to load packages:', pkgResult.reason);
      }

      if (reqResult.status === 'fulfilled') {
        const data = (reqResult.value as any).data?.data?.content || (reqResult.value as any).data?.data;
        if (Array.isArray(data)) setRequests(data);
      } else {
        console.warn('[Consultation] Failed to load requests:', reqResult.reason);
      }

      if (sessResult.status === 'fulfilled') {
        const data = (sessResult.value as any).data?.data?.content || (sessResult.value as any).data?.data;
        if (Array.isArray(data)) setSessions(data);
      } else {
        console.warn('[Consultation] Failed to load sessions:', sessResult.reason);
      }

      if (recResult.status === 'fulfilled') {
        const data = (recResult.value as any).data?.data?.content || (recResult.value as any).data?.data;
        if (Array.isArray(data)) setHealthRecords(data);
      } else {
        console.warn('[Consultation] Failed to load health records:', recResult.reason);
      }

      // Chỉ thông báo lỗi nếu tất cả phân hệ chính đều thất bại
      if (
        pkgResult.status === 'rejected' &&
        reqResult.status === 'rejected' &&
        sessResult.status === 'rejected'
      ) {
        const primaryError = reqResult.reason || pkgResult.reason || sessResult.reason;
        setAlert({ type: 'error', text: readError(primaryError, 'Lỗi khi tải dữ liệu tư vấn') });
      }
    } catch (err) {
      console.error('[Consultation loadData error]', err);
      setAlert({ type: 'error', text: readError(err, 'Lỗi khi tải dữ liệu tư vấn') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      if (active) await loadData();
    };
    void fetchData();
    return () => { active = false; };
  }, [loadData]);

  const handleCreateRequest = async () => {
    if (!requestForm.packageId) {
      setAlert({ type: 'error', text: 'Vui lòng chọn gói dịch vụ' });
      return false;
    }
    if (!requestForm.reasonForCare.trim()) {
      setAlert({ type: 'error', text: 'Vui lòng nhập lý do tư vấn' });
      return false;
    }
    if (!requestForm.currentConcern.trim()) {
      setAlert({ type: 'error', text: 'Vui lòng mô tả tình trạng hiện tại' });
      return false;
    }

    setActionLoading(true);
    try {
      await consultationApi.createRequest({
        packageId: Number(requestForm.packageId),
        reasonForCare: requestForm.reasonForCare.trim(),
        currentConcern: requestForm.currentConcern.trim(),
        careGoal: requestForm.careGoal?.trim(),
        memberNote: requestForm.memberNote?.trim(),
        selectedHealthRecordIds: requestForm.selectedHealthRecordIds?.map(Number),
      });
      setAlert({ type: 'success', text: 'Gửi yêu cầu tư vấn thành công' });
      setRequestForm({
        packageId: '',
        reasonForCare: '',
        currentConcern: '',
        careGoal: '',
        memberNote: '',
        selectedHealthRecordIds: [],
      });
      await loadData();
      return true;
    } catch (err) {
      setAlert({ type: 'error', text: readError(err, 'Lỗi khi tạo yêu cầu') });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: string | number) => {
    setActionLoading(true);
    try {
      await consultationApi.cancelRequest(requestId);
      setAlert({ type: 'success', text: 'Đã hủy yêu cầu tư vấn' });
      await loadData();
      return true;
    } catch (err) {
      setAlert({ type: 'error', text: readError(err, 'Lỗi khi hủy yêu cầu') });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptAgreement = async (requestId: string | number, agreementId: string | number) => {
    setActionLoading(true);
    try {
      await consultationApi.acceptAgreement(requestId, {
        agreementId: Number(agreementId),
        accepted: true,
      });
      setAlert({ type: 'success', text: 'Xác nhận thỏa thuận dịch vụ thành công! Vui lòng thanh toán để mở phiên.' });
      await loadData();
      return true;
    } catch (err) {
      setAlert({ type: 'error', text: readError(err, 'Lỗi khi xác nhận thỏa thuận') });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleInitiatePayment = async (requestId: string | number) => {
    setActionLoading(true);
    try {
      const res = await consultationApi.createConsultationPayment(requestId);
      const paymentData = (res as any).data?.data || (res as any).data;
      
      if (paymentData?.checkoutUrl) {
        // Open payment link via Expo WebBrowser
        await WebBrowser.openBrowserAsync(paymentData.checkoutUrl);
        // Refresh data when user returns to app
        await loadData();
        return true;
      } else if (paymentData?.status === 'PAID') {
        setAlert({ type: 'success', text: 'Thanh toán thành công. Phiên tư vấn đã được kích hoạt.' });
        await loadData();
        return true;
      } else {
        setAlert({ type: 'error', text: `Trạng thái thanh toán: ${paymentData?.status || 'Chưa hoàn tất'}` });
        return false;
      }
    } catch (err) {
      setAlert({ type: 'error', text: readError(err, 'Lỗi khi khởi tạo cổng thanh toán') });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitMoreInfo = async (
    requestId: string | number,
    memberNote: string,
    selectedHealthRecordIds?: (string | number)[]
  ) => {
    setActionLoading(true);
    try {
      await consultationApi.submitMoreInfo(requestId, {
        additionalNote: memberNote,
        responseNote: memberNote,
        selectedHealthRecordIds: selectedHealthRecordIds?.map(Number),
      });
      setAlert({ type: 'success', text: 'Đã gửi bổ sung thông tin thành công' });
      await loadData();
      return true;
    } catch (err) {
      setAlert({ type: 'error', text: readError(err, 'Lỗi khi gửi thông tin bổ sung') });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleShareHealthRecord = async (sessionId: string | number, recordId: string | number) => {
    setActionLoading(true);
    try {
      await consultationApi.shareHealthRecord(sessionId, recordId);
      setAlert({ type: 'success', text: `Đã chia sẻ hồ sơ đo #${recordId} với bác sĩ` });
      return true;
    } catch (err) {
      setAlert({ type: 'error', text: readError(err, 'Lỗi khi chia sẻ hồ sơ') });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRenewal = async (sessionId: string | number, note?: string) => {
    setActionLoading(true);
    try {
      await consultationApi.requestRenewal(sessionId, {});
      setAlert({ type: 'success', text: 'Đã gửi yêu cầu gia hạn chăm sóc' });
      await loadData();
      return true;
    } catch (err) {
      setAlert({ type: 'error', text: readError(err, 'Lỗi khi gửi yêu cầu gia hạn') });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRenewalAgreement = async (renewalId: string | number, agreementId: string | number) => {
    setActionLoading(true);
    try {
      await consultationApi.acceptRenewalAgreement(renewalId, {
        agreementId: Number(agreementId),
        accepted: true,
      });
      setAlert({ type: 'success', text: 'Đã xác nhận thỏa thuận gia hạn' });
      await loadData();
      return true;
    } catch (err) {
      setAlert({ type: 'error', text: readError(err, 'Lỗi khi xác nhận thỏa thuận gia hạn') });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleInitiateRenewalPayment = async (renewalId: string | number) => {
    setActionLoading(true);
    try {
      const res = await consultationApi.createRenewalPayment(renewalId);
      const paymentData = (res as any).data?.data || (res as any).data;
      if (paymentData?.checkoutUrl) {
        await WebBrowser.openBrowserAsync(paymentData.checkoutUrl);
        await loadData();
        return true;
      }
      return false;
    } catch (err) {
      setAlert({ type: 'error', text: readError(err, 'Lỗi khi thanh toán gia hạn') });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRenewal = async (renewalId: string | number) => {
    setActionLoading(true);
    try {
      await consultationApi.cancelRenewal(renewalId);
      setAlert({ type: 'success', text: 'Đã hủy yêu cầu gia hạn' });
      await loadData();
      return true;
    } catch (err) {
      setAlert({ type: 'error', text: readError(err, 'Lỗi khi hủy gia hạn') });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const loadSingleSession = useCallback(async (id: string | number) => {
    if (!id || id === 'undefined') return null;
    try {
      const res = await consultationApi.getSession(id);
      const sessionData = (res as any).data?.data || (res as any).data;
      if (sessionData && sessionData.id) {
        setSelectedSession(sessionData);
        return sessionData as ConsultationSessionItem;
      }
    } catch (err) {
      console.warn('[Consultation] Failed to load session by ID:', err);
    }
    return null;
  }, []);

  const loadMessages = useCallback(async (sessionId: string | number) => {
    if (!sessionId || sessionId === 'undefined') return;
    try {
      const res = await consultationApi.listMessages(sessionId, { page: 1, size: DEFAULT_CHAT_SIZE });
      if ((res as any).data?.data?.content) {
        setMessages((res as any).data.data.content); // Newest to oldest (for inverted FlatList)
      } else if (Array.isArray((res as any).data?.data)) {
        setMessages((res as any).data.data);
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setMessages([]);
      } else {
        console.warn('Failed to load messages', err);
      }
    }
  }, []);

  // When activeSessionId is specified, immediately fetch session details and messages
  useEffect(() => {
    if (!activeSessionId || activeSessionId === 'undefined') return;
    let active = true;

    const initActiveChat = async () => {
      await Promise.allSettled([
        loadSingleSession(activeSessionId),
        loadMessages(activeSessionId),
      ]);
      try {
        await consultationApi.markRead(activeSessionId, '');
      } catch {}
    };

    void initActiveChat();
    return () => {
      active = false;
    };
  }, [activeSessionId, loadSingleSession, loadMessages]);

  // When selectedSession changes without activeSessionId (e.g. from general list tab)
  useEffect(() => {
    if (activeSessionId) return;
    let active = true;
    const fetchMessages = async () => {
      if (selectedSession?.id && active) {
        await loadMessages(selectedSession.id);
        // Mark read
        try {
          await consultationApi.markRead(selectedSession.id, '');
        } catch {}
      } else if (active) {
        setMessages([]);
      }
    };
    void fetchMessages();
    return () => { active = false; };
  }, [selectedSession?.id, activeSessionId, loadMessages]);

  const currentSessionId = selectedSession?.id || activeSessionId || null;

  const handleIncomingMessage = useCallback((msg: ConsultationMessageItem) => {
    if (!msg || !msg.id) return;
    console.log('[useConsultationsLogic] Incoming message:', msg.id, msg.content);
    setMessages((prev) => {
      // Prevent duplicates
      if (prev.some((m) => String(m.id) === String(msg.id))) return prev;
      return [msg, ...prev]; // Add to beginning (for inverted FlatList)
    });
  }, []);

  const { status: socketStatus } = useConsultationSocket(currentSessionId, handleIncomingMessage);

  const handleSendMessage = async () => {
    const targetSessionId = selectedSession?.id || activeSessionId;
    if (!targetSessionId || !messageDraft.trim()) return;
    
    const content = messageDraft.trim();
    setMessageDraft('');
    setActionLoading(true);
    try {
      const res = await consultationApi.sendMessage(targetSessionId, {
        type: 'TEXT',
        content: content,
      });
      const sentMsg = (res as any).data?.data || (res as any).data;
      if (sentMsg && sentMsg.id) {
        handleIncomingMessage(sentMsg);
      }
    } catch (err: any) {
      const errStr = String(err?.response?.data?.message || err?.message || '');
      if (errStr.toLowerCase().includes('support hours') || errStr.toLowerCase().includes('support_hours')) {
        setAlert({ type: 'error', text: 'Bạn chỉ có thể gửi tin nhắn trong khung giờ hỗ trợ của phiên tư vấn.' });
      } else {
        setAlert({ type: 'error', text: readError(err, 'Gửi tin nhắn thất bại') });
      }
      setMessageDraft(content); // Restore draft
    } finally {
      setActionLoading(false);
    }
  };

  return {
    alert,
    setAlert,
    loading,
    actionLoading,
    packages,
    requests,
    sessions,
    healthRecords,
    selectedSession,
    setSelectedSession,
    messages,
    messageDraft,
    setMessageDraft,
    socketStatus,
    requestForm,
    setRequestForm,
    handleCreateRequest,
    handleCancelRequest,
    handleAcceptAgreement,
    handleInitiatePayment,
    handleSubmitMoreInfo,
    handleShareHealthRecord,
    handleRequestRenewal,
    handleAcceptRenewalAgreement,
    handleInitiateRenewalPayment,
    handleCancelRenewal,
    handleSendMessage,
    loadData,
    loadMessages,
    loadSingleSession,
  };
}

