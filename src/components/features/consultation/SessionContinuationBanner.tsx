import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2, Clock, RefreshCw, XCircle } from 'lucide-react-native';
import { consultationApi } from '@/services/consultation.service';
import { isQueueFlow } from '@/constants/consultation';
import { readError } from '@/hooks/useConsultationsLogic';
import type { ConsultationSessionItem, ContinuationDecisionResponse } from '@/types/consultation';

interface Props {
  session: ConsultationSessionItem;
  onSessionRefreshed: () => void;
}

const unwrap = <T,>(res: unknown): T => {
  const body = (res as { data?: { data?: T } })?.data;
  return (body?.data ?? body) as T;
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00';
  const total = Math.floor(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Mã lỗi nghiệp vụ khi gửi quyết định tiếp tục → khóa i18n (giống web). */
const DECISION_ERROR_KEYS: Record<number, string> = {
  4031: 'chat.continuation.errors.blockNotEnded',
  4032: 'chat.continuation.errors.graceExpired',
  4033: 'chat.continuation.errors.decisionLocked',
  4034: 'chat.continuation.errors.stateChanged',
};

/**
 * Khối 15 phút của phiên hàng đợi (giống web SessionContinuationBanner): đếm ngược khối hiện tại;
 * hết khối thì hỏi hai bên có tiếp tục 15 phút nữa không (5 phút để quyết định).
 */
export function SessionContinuationBanner({ session, onSessionRefreshed }: Props) {
  const { t } = useTranslation('consultation');
  const queueV1 = isQueueFlow(session.flowType);
  const isActive = session.status === 'ACTIVE';
  const [now, setNow] = useState(() => Date.now());
  const [continuation, setContinuation] = useState<ContinuationDecisionResponse | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const refreshRef = useRef(onSessionRefreshed);
  useEffect(() => {
    refreshRef.current = onSessionRefreshed;
  }, [onSessionRefreshed]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const endsAtMs = session.endsAt ? new Date(session.endsAt).getTime() : 0;
  const isBlockEnded = endsAtMs > 0 && now >= endsAtMs;
  const graceExpiresAtMs = continuation?.graceExpiresAt ? new Date(continuation.graceExpiresAt).getTime() : 0;
  const isGraceExpired = graceExpiresAtMs > 0 && now >= graceExpiresAtMs;

  const fetchContinuation = useCallback(async () => {
    if (!queueV1 || !isActive) return;
    try {
      const data = unwrap<ContinuationDecisionResponse | null>(await consultationApi.getCurrentContinuation(session.id));
      if (data) {
        setContinuation(data);
        if (data.sessionStatus && data.sessionStatus !== 'ACTIVE') refreshRef.current();
        if (typeof data.round === 'number' && data.round > (session.continuationRound || 0)) refreshRef.current();
      } else {
        setContinuation(null);
      }
    } catch {
      // lỗi tạm thời, lần poll sau thử lại
    }
  }, [queueV1, isActive, session.id, session.continuationRound]);

  // Hết khối mà phiên vẫn ACTIVE → hỏi trạng thái tiếp tục mỗi 4 giây
  useEffect(() => {
    if (!queueV1 || !isActive || !isBlockEnded) return;
    const first = setTimeout(() => void fetchContinuation(), 0);
    const interval = setInterval(() => void fetchContinuation(), 4000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [queueV1, isActive, isBlockEnded, fetchContinuation]);

  const graceRefreshed = useRef(false);
  useEffect(() => {
    if (isGraceExpired && !graceRefreshed.current) {
      graceRefreshed.current = true;
      refreshRef.current();
    } else if (!isGraceExpired) {
      graceRefreshed.current = false;
    }
  }, [isGraceExpired]);

  if (!queueV1) return null;

  const handleDecision = async (decision: 'CONTINUE' | 'STOP') => {
    if (!continuation || actionLoading) return;
    setActionLoading(true);
    try {
      const data = unwrap<ContinuationDecisionResponse>(await consultationApi.submitContinuationDecision(session.id, continuation.round, { decision }));
      setContinuation(data);
      refreshRef.current();
    } catch (err) {
      const code = (err as { response?: { data?: { code?: number } } })?.response?.data?.code;
      const key = code ? DECISION_ERROR_KEYS[code] : undefined;
      Alert.alert(t('chat.continuation.errors.submitFailedTitle'), key ? t(key) : readError(err, t('chat.continuation.errors.submitFailed')));
      refreshRef.current();
    } finally {
      setActionLoading(false);
    }
  };

  const myDecision = continuation?.memberDecision;

  // 1. Đang trong khối 15 phút
  if (isActive && !isBlockEnded) {
    return (
      <View className="flex-row items-center justify-between px-4 py-2 bg-muted/40 border-b border-border/60">
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <Clock size={14} color="#0D6EFD" />
          <Text className="text-xs text-muted-foreground">{t('chat.continuation.blockTime', { round: session.continuationRound || 0 })}</Text>
          <Text className="text-xs font-semibold text-foreground">{formatCountdown(Math.max(0, endsAtMs - now))}</Text>
        </View>
        <View className="px-2 py-0.5 rounded-full bg-primary/5 border border-primary/20">
          <Text className="text-[10px] font-semibold text-primary">{t('chat.continuation.blockBadge')}</Text>
        </View>
      </View>
    );
  }

  // 2. Hết khối, đang mở cửa sổ 5 phút để quyết định
  if (isActive && isBlockEnded && continuation) {
    const graceRemaining = Math.max(0, graceExpiresAtMs - now);
    const disabled = isGraceExpired || actionLoading || myDecision === 'CONTINUE' || myDecision === 'STOP';
    return (
      <View className="p-4 bg-amber-50 border-b border-amber-200" style={{ gap: 10 }}>
        <View className="flex-row items-start justify-between" style={{ gap: 10 }}>
          <View className="flex-row items-start flex-1" style={{ gap: 8 }}>
            <AlertCircle size={18} color="#D97706" />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-amber-950">{t('chat.continuation.endedTitle')}</Text>
              <Text className="text-xs text-amber-800 mt-0.5 leading-4">{t('chat.continuation.endedDescription')}</Text>
            </View>
          </View>
          <View className="flex-row items-center px-2.5 py-1 rounded-full bg-amber-200/60" style={{ gap: 4 }}>
            <Clock size={13} color="#78350F" />
            <Text className="text-xs font-medium text-amber-900">{formatCountdown(graceRemaining)}</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between pt-2 border-t border-amber-200/60" style={{ gap: 8 }}>
          <View className="flex-1">
            {myDecision === 'CONTINUE' ? (
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <CheckCircle2 size={16} color="#047857" />
                <Text className="text-xs font-medium text-emerald-700 flex-1">{t('chat.continuation.waitingOther')}</Text>
              </View>
            ) : myDecision === 'STOP' ? (
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <XCircle size={16} color="#475569" />
                <Text className="text-xs font-medium text-slate-600 flex-1">{t('chat.continuation.stopping')}</Text>
              </View>
            ) : isGraceExpired ? (
              <Text className="text-xs font-medium text-rose-600">{t('chat.continuation.graceExpiredUpdating')}</Text>
            ) : (
              <Text className="text-[11px] text-muted-foreground">{t('chat.continuation.confirmBeforeExpiry')}</Text>
            )}
          </View>
          {myDecision === 'PENDING' && !isGraceExpired ? (
            <View className="flex-row" style={{ gap: 8 }}>
              <Pressable onPress={() => void handleDecision('STOP')} disabled={disabled} className="h-8 px-3 rounded-lg border border-amber-300 bg-white items-center justify-center active:opacity-80" style={{ opacity: disabled ? 0.5 : 1 }}>
                <Text className="text-xs font-medium text-amber-900">{t('chat.continuation.stop')}</Text>
              </Pressable>
              <Pressable onPress={() => void handleDecision('CONTINUE')} disabled={disabled} className="h-8 px-3 rounded-lg bg-emerald-600 flex-row items-center justify-center active:opacity-90" style={{ gap: 4, opacity: disabled ? 0.5 : 1 }}>
                {actionLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
                <Text className="text-xs font-bold text-white">{t('chat.continuation.continue')}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  // 3. Hết khối, chưa nhận được trạng thái tiếp tục
  if (isActive && isBlockEnded && !continuation) {
    return (
      <View className="flex-row items-center justify-between px-4 py-2.5 bg-amber-50/70 border-b border-amber-200/50">
        <View className="flex-row items-center flex-1" style={{ gap: 6 }}>
          <RefreshCw size={13} color="#D97706" />
          <Text className="text-xs text-amber-900 flex-1">{t('chat.continuation.checking')}</Text>
        </View>
        <Pressable
          onPress={() => {
            void fetchContinuation();
            refreshRef.current();
          }}
          hitSlop={6}
        >
          <Text className="text-[11px] font-semibold text-amber-800">{t('chat.continuation.refresh')}</Text>
        </Pressable>
      </View>
    );
  }

  return null;
}
