import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { consultationApi } from '@/services/consultation.service';
import { useConsultationSocket } from './useConsultationSocket';
import { readError, type AlertState } from './useConsultationsLogic';
import i18n from '@/i18n';
import type { ConsultationMessageItem, ConsultationSessionItem } from '@/types/consultation';

const CHAT_PAGE_SIZE = 30;

const unwrap = <T,>(res: unknown): T => {
  const body = (res as { data?: { data?: T } })?.data;
  return (body?.data ?? body) as T;
};

const makeClientMessageId = () => `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const byNewest = (a: ConsultationMessageItem, b: ConsultationMessageItem) =>
  new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();

/** Ngoài khung giờ hỗ trợ của bác sĩ (theo supportScheduleSnapshotJson) thì không gửi được tin — giống web. */
export function isOutsideSupportHours(session: ConsultationSessionItem | null): boolean {
  if (!session || session.status !== 'ACTIVE' || !session.supportScheduleSnapshotJson) return false;
  try {
    const schedule = JSON.parse(session.supportScheduleSnapshotJson) as { weekly?: { dayOfWeek: string; start: string; end: string }[] };
    if (!schedule.weekly || schedule.weekly.length === 0) return false;
    const now = new Date();
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const today = days[now.getDay()];
    const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const slots = schedule.weekly.filter((s) => s.dayOfWeek === today);
    if (slots.length === 0) return true;
    return !slots.some((s) => nowStr >= s.start && nowStr <= s.end);
  } catch {
    return false;
  }
}

/**
 * Phòng chat một phiên tư vấn: nạp phiên + tin nhắn, tải tin cũ hơn, gửi tin, đánh dấu đã đọc,
 * nhận tin realtime qua WebSocket. Tin nhắn giữ thứ tự MỚI NHẤT TRƯỚC (cho FlatList inverted).
 */
export function useConsultationChat(sessionId?: string) {
  const [session, setSession] = useState<ConsultationSessionItem | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [messages, setMessages] = useState<ConsultationMessageItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const lastMarkedRef = useRef<string | number | null>(null);

  const refreshSession = useCallback(async () => {
    if (!sessionId) return null;
    try {
      const data = unwrap<ConsultationSessionItem>(await consultationApi.getSession(sessionId));
      if (data?.id) {
        setSession((prev) =>
          prev &&
          String(prev.id) === String(data.id) &&
          prev.status === data.status &&
          prev.continuationRound === data.continuationRound &&
          prev.endsAt === data.endsAt &&
          prev.summaryClosureStatus === data.summaryClosureStatus
            ? prev
            : data
        );
        return data;
      }
    } catch (err) {
      setAlert({ type: 'error', text: readError(err, i18n.t('consultation:workspace.toasts.loadSessionFailed')) });
    } finally {
      setLoadingSession(false);
    }
    return null;
  }, [sessionId]);

  const loadMessages = useCallback(async () => {
    if (!sessionId) return;
    try {
      const page = unwrap<{ content?: ConsultationMessageItem[] }>(await consultationApi.listMessages(sessionId, { page: 1, size: CHAT_PAGE_SIZE }));
      const content = page?.content ?? [];
      setMessages([...content].sort(byNewest));
      setHasMore(content.length === CHAT_PAGE_SIZE);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setMessages([]);
      } else if (status === 409) {
        setAlert({ type: 'error', text: i18n.t('consultation:logic.alerts.sessionCancelledOrInactive') });
      } else {
        setAlert({ type: 'error', text: readError(err, i18n.t('consultation:logic.alerts.loadMessagesFailed')) });
      }
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    queueMicrotask(() => {
      setLoadingSession(true);
      void Promise.allSettled([refreshSession(), loadMessages()]);
    });
  }, [sessionId, refreshSession, loadMessages]);

  const handleIncomingMessage = useCallback((msg: ConsultationMessageItem) => {
    if (!msg?.id) return;
    setMessages((prev) => (prev.some((m) => String(m.id) === String(msg.id)) ? prev : [msg, ...prev].sort(byNewest)));
  }, []);

  const { status: socketStatus } = useConsultationSocket(sessionId ?? null, handleIncomingMessage);

  // Đánh dấu đã đọc tới tin mới nhất (chỉ khi phiên đang hoạt động)
  const newestId = messages[0]?.id;
  useEffect(() => {
    if (!sessionId || !newestId || session?.status !== 'ACTIVE') return;
    if (lastMarkedRef.current === newestId) return;
    lastMarkedRef.current = newestId;
    void consultationApi.markRead(sessionId, String(newestId)).catch(() => undefined);
  }, [sessionId, newestId, session?.status]);

  const loadMore = useCallback(async () => {
    if (!sessionId || loadingMore || !hasMore || messages.length === 0) return;
    const oldest = messages[messages.length - 1];
    setLoadingMore(true);
    try {
      const page = unwrap<{ content?: ConsultationMessageItem[] }>(
        await consultationApi.listMessagesBefore(sessionId, String(oldest.id), { page: 1, size: CHAT_PAGE_SIZE })
      );
      const content = page?.content ?? [];
      setMessages((prev) => {
        const fresh = content.filter((m) => !prev.some((p) => String(p.id) === String(m.id)));
        return [...prev, ...fresh].sort(byNewest);
      });
      setHasMore(content.length === CHAT_PAGE_SIZE);
    } catch (err) {
      setAlert({ type: 'error', text: readError(err, i18n.t('consultation:logic.alerts.loadOlderMessagesFailed')) });
    } finally {
      setLoadingMore(false);
    }
  }, [sessionId, loadingMore, hasMore, messages]);

  /** Gửi tin dạng chữ. Trả về false nếu gửi thất bại (để giữ lại nội dung đã gõ). */
  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      const text = content.trim();
      if (!sessionId || !text || session?.status !== 'ACTIVE') return false;
      setSending(true);
      setAlert(null);
      try {
        const sent = unwrap<ConsultationMessageItem>(
          await consultationApi.sendMessage(sessionId, { type: 'TEXT', content: text, clientMessageId: makeClientMessageId() })
        );
        if (sent?.id) handleIncomingMessage(sent);
        return true;
      } catch (err) {
        const status = (err as { response?: { status?: number; data?: { code?: number } } })?.response?.status;
        const code = (err as { response?: { data?: { code?: number } } })?.response?.data?.code;
        const msg = readError(err, '').toLowerCase();
        if (status === 409 || code === 4003) {
          setAlert({ type: 'error', text: i18n.t('consultation:logic.alerts.sessionInactive') });
          void refreshSession();
        } else if (msg.includes('support hours') || msg.includes('support_hours')) {
          setAlert({ type: 'error', text: i18n.t('consultation:logic.alerts.outsideSupportHoursSend') });
        } else {
          setAlert({ type: 'error', text: readError(err, i18n.t('consultation:logic.alerts.sendMessageFailed')) });
        }
        return false;
      } finally {
        setSending(false);
      }
    },
    [sessionId, session?.status, handleIncomingMessage, refreshSession]
  );

  const outsideSupportHours = useMemo(() => isOutsideSupportHours(session), [session]);

  return {
    session,
    loadingSession,
    messages,
    hasMore,
    loadingMore,
    sending,
    alert,
    setAlert,
    socketStatus,
    outsideSupportHours,
    refreshSession,
    loadMessages,
    loadMore,
    sendMessage,
  };
}
