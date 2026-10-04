import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';
import {
  AlertCircle,
  ArrowRight,
  Clock,
  Coins,
  Info,
  RefreshCw,
  Stethoscope,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react-native';
import type { ConsultationRequestItem, CurrentQueueStateResponse } from '@/types/consultation';
import { getCreditDisplay, getCreditReservationStatusConfig } from '@/constants/credits';
import { currentIntlLocale } from '@/i18n';
import { formatShortDate } from '@/utils/formatters';

export interface MemberQueuePanelProps {
  queueState: CurrentQueueStateResponse | null;
  latestRequest: ConsultationRequestItem | null;
  loading: boolean;
  actionLoading: boolean;
  insufficientCredits?: boolean;
  onConfirm: (offerId: string) => void;
  onCancel: (requestId: string | number) => void;
  onRefresh: () => void;
  onOpenSession: (sessionId: string | number) => void;
  onRegisterNew: () => void;
  onBuyCredits: () => void;
}

/** Đếm ngược tới mốc hạn do server trả (không tự bịa thời lượng); hết giờ thì gọi onExpire. */
function useDeadlineCountdown(deadlineIso?: string | null, onExpire?: () => void) {
  const [timeLeftMs, setTimeLeftMs] = useState(() => (deadlineIso ? Math.max(0, new Date(deadlineIso).getTime() - Date.now()) : 0));
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    expiredRef.current = false;
    if (!deadlineIso) return;
    const calc = () => {
      const remaining = Math.max(0, new Date(deadlineIso).getTime() - Date.now());
      setTimeLeftMs(remaining);
      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
      }
    };
    const first = setTimeout(calc, 0);
    const timer = setInterval(calc, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [deadlineIso]);

  const totalSeconds = Math.floor(timeLeftMs / 1000);
  const formatted = `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
  return { formatted, isExpired: !deadlineIso || timeLeftMs <= 0 };
}

const formatTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString(currentIntlLocale(), { hour: '2-digit', minute: '2-digit' }) : '--';

function Pill({ label, bg, text, border }: { label: string; bg: string; text: string; border: string }) {
  return (
    <View className="px-2.5 py-1 rounded-full border self-start" style={{ backgroundColor: bg, borderColor: border }}>
      <Text className="text-[11px] font-bold" style={{ color: text }}>{label}</Text>
    </View>
  );
}

function PrimaryButton({ label, onPress, disabled, icon }: { label: string; onPress: () => void; disabled?: boolean; icon?: React.ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="h-12 rounded-xl bg-primary flex-row items-center justify-center active:opacity-90"
      style={{ gap: 8, opacity: disabled ? 0.5 : 1 }}
    >
      <Text className="text-white font-bold text-sm">{label}</Text>
      {icon}
    </Pressable>
  );
}

function OutlineButton({ label, onPress, disabled, danger }: { label: string; onPress: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="h-11 rounded-xl border bg-white flex-row items-center justify-center active:opacity-80"
      style={{ gap: 6, borderColor: danger ? '#FECACA' : '#E2E8F0', opacity: disabled ? 0.5 : 1 }}
    >
      <XCircle size={15} color={danger ? '#DC2626' : '#64748B'} />
      <Text className="text-xs font-semibold" style={{ color: danger ? '#DC2626' : '#475569' }}>{label}</Text>
    </Pressable>
  );
}

/** Thẻ hàng đợi tư vấn — 5 trạng thái giống web MemberQueuePanel. */
export function MemberQueuePanel({
  queueState,
  latestRequest,
  loading,
  actionLoading,
  insufficientCredits,
  onConfirm,
  onCancel,
  onRefresh,
  onOpenSession,
  onRegisterNew,
  onBuyCredits,
}: MemberQueuePanelProps) {
  const { t } = useTranslation('consultation');
  const creditPolicy = queueState?.creditPolicy || latestRequest?.creditPolicy;
  const reservationStatus = queueState?.creditReservationStatus || latestRequest?.creditReservationStatus;
  const reservationConfig = reservationStatus ? getCreditReservationStatusConfig(reservationStatus) : null;
  const creditDisplay = getCreditDisplay({ creditPolicy, creditReservationStatus: reservationStatus });

  const confirmationDeadline = queueState?.phase === 'WAITING_CONFIRMATION' ? queueState.memberConfirmExpiresAt : null;
  const { formatted: confirmTimer, isExpired: isConfirmExpired } = useDeadlineCountdown(confirmationDeadline, onRefresh);

  // 1. Phiên đang diễn ra
  if (queueState?.phase === 'ACTIVE_SESSION' && queueState.sessionId) {
    return (
      <View className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <View className="p-5 flex-row items-center bg-emerald-500/10 border-b border-emerald-500/20" style={{ gap: 14 }}>
          <View className="h-12 w-12 rounded-xl bg-emerald-500/20 items-center justify-center">
            <Stethoscope size={24} color="#059669" />
          </View>
          <View className="flex-1">
            <Pill label={t('queuePanel.activeSession.badge')} bg="#10B981" text="#FFFFFF" border="#10B981" />
            <Text className="text-base font-bold text-foreground mt-1.5">{t('queuePanel.activeSession.title')}</Text>
            <Text className="text-xs text-muted-foreground mt-0.5">{t('queuePanel.activeSession.activated', { id: queueState.sessionId })}</Text>
          </View>
        </View>
        <View className="p-5" style={{ gap: 14 }}>
          <View className="bg-muted/30 border border-border rounded-xl p-4" style={{ gap: 8 }}>
            <Row label={t('queuePanel.activeSession.sessionCode')} value={`#${queueState.sessionId}`} />
            {queueState.sessionStartedAt ? <Row label={t('queuePanel.activeSession.startTime')} value={formatTime(queueState.sessionStartedAt)} /> : null}
            {queueState.sessionEndsAt ? <Row label={t('queuePanel.activeSession.blockEndTime')} value={formatTime(queueState.sessionEndsAt)} /> : null}
            {reservationStatus && reservationConfig ? (
              <View className="flex-row items-center justify-between pt-2 border-t border-border">
                <Text className="text-xs text-muted-foreground">{t('queuePanel.activeSession.reservationStatus')}</Text>
                <Pill {...reservationConfig} />
              </View>
            ) : null}
          </View>
          <PrimaryButton
            label={t('queuePanel.activeSession.enterRoom')}
            onPress={() => onOpenSession(queueState.sessionId as string | number)}
            icon={<ArrowRight size={16} color="#FFFFFF" />}
          />
        </View>
      </View>
    );
  }

  // 2. Bác sĩ đã nhận lượt, chờ hội viên xác nhận
  if (queueState?.phase === 'WAITING_CONFIRMATION') {
    const canConfirm = Boolean(queueState.offerId) && queueState.doctorReady && !isConfirmExpired && !actionLoading;
    return (
      <View className="bg-card border border-primary/30 rounded-2xl overflow-hidden shadow-sm">
        <View className="p-5 bg-primary/10 border-b border-primary/20 flex-row items-start justify-between" style={{ gap: 12 }}>
          <View className="flex-row items-center flex-1" style={{ gap: 12 }}>
            <View className="h-12 w-12 rounded-xl bg-primary/20 items-center justify-center">
              <UserCheck size={24} color="#0D6EFD" />
            </View>
            <View className="flex-1">
              <Pill label={t('queuePanel.confirmation.badge')} bg="#0D6EFD" text="#FFFFFF" border="#0D6EFD" />
              <Text className="text-base font-bold text-foreground mt-1.5">{t('queuePanel.confirmation.title')}</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">{t('queuePanel.confirmation.subtitle')}</Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-[11px] text-muted-foreground">{t('queuePanel.confirmation.timeLeft')}</Text>
            <View className="flex-row items-center" style={{ gap: 4 }}>
              <Clock size={14} color="#0D6EFD" />
              <Text className="text-lg font-bold text-primary">{confirmTimer}</Text>
            </View>
          </View>
        </View>

        <View className="p-5" style={{ gap: 12 }}>
          <View className="bg-muted/20 border border-border rounded-xl p-4" style={{ gap: 10 }}>
            <Row label={t('queuePanel.confirmation.yourNumber')} value={`#${String(queueState.queueNumber).padStart(3, '0')}`} valueColor="#0D6EFD" />
            <Row label={t('queuePanel.confirmation.status')} value={t('queuePanel.confirmation.doctorAccepted')} valueColor="#059669" />
            {creditDisplay ? (
              <View className="pt-2 border-t border-border">
                <Text className="text-xs text-muted-foreground mb-1">{t('queuePanel.confirmation.creditInfo')}</Text>
                <Pill label={creditDisplay} bg="#EFF6FF" text="#1D4ED8" border="#BFDBFE" />
              </View>
            ) : null}
          </View>

          {insufficientCredits ? (
            <View className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl" style={{ gap: 10 }}>
              <View className="flex-row items-start" style={{ gap: 10 }}>
                <AlertCircle size={20} color="#D97706" />
                <View className="flex-1">
                  <Text className="font-semibold text-sm text-foreground">{t('queuePanel.confirmation.insufficientTitle')}</Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">{t('queuePanel.confirmation.insufficientDescription')}</Text>
                </View>
              </View>
              <Pressable onPress={onBuyCredits} className="h-9 rounded-xl bg-primary flex-row items-center justify-center self-start px-4 active:opacity-90" style={{ gap: 6 }}>
                <Coins size={14} color="#FFFFFF" />
                <Text className="text-white text-xs font-semibold">{t('queuePanel.confirmation.buyCredits')}</Text>
              </Pressable>
            </View>
          ) : null}

          {isConfirmExpired ? (
            <Notice color="danger" text={t('queuePanel.confirmation.expired')} />
          ) : (
            <Notice
              color="primary"
              text={creditPolicy === 'PER_SESSION_CONFIRM_V2' ? t('queuePanel.confirmation.hintPerSession') : t('queuePanel.confirmation.hintDefault')}
            />
          )}

          <PrimaryButton
            label={actionLoading ? t('queuePanel.confirmation.creatingSession') : t('queuePanel.confirmation.join')}
            disabled={!canConfirm}
            onPress={() => queueState.offerId && onConfirm(queueState.offerId)}
            icon={actionLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : undefined}
          />
          <OutlineButton
            label={t('queuePanel.confirmation.cancel')}
            danger
            disabled={actionLoading}
            onPress={() =>
              Alert.alert(t('queuePanel.confirmation.cancelTitle'), t('queuePanel.confirmation.cancelConfirm'), [
                { text: t('common:actions.no'), style: 'cancel' },
                { text: t('queuePanel.confirmation.cancel'), style: 'destructive', onPress: () => onCancel(queueState.requestId) },
              ])
            }
          />
        </View>
      </View>
    );
  }

  // 3. Đang trong hàng đợi
  if (queueState?.phase === 'QUEUE') {
    const isOfferingDoctor = queueState.queueStatus === 'OFFERING_DOCTOR';
    const hasZeroDoctors = queueState.availableDoctors === 0;
    return (
      <View className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <View className="p-4 border-b border-border bg-muted/10 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1" style={{ gap: 12 }}>
            <View className="h-10 w-10 rounded-xl bg-primary/10 items-center justify-center">
              <Users size={20} color="#0D6EFD" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">{t('queuePanel.queue.title')}</Text>
              <Text className="text-xs text-muted-foreground">
                {isOfferingDoctor ? t('queuePanel.queue.connecting') : t('queuePanel.queue.inQueue')}
              </Text>
            </View>
          </View>
          <Pressable onPress={onRefresh} disabled={loading} className="h-8 px-2.5 rounded-lg flex-row items-center active:opacity-70" style={{ gap: 4 }}>
            {loading ? <ActivityIndicator size="small" color="#64748B" /> : <RefreshCw size={14} color="#64748B" />}
            <Text className="text-xs text-muted-foreground">{t('queuePanel.queue.refresh')}</Text>
          </Pressable>
        </View>

        <View className="p-5" style={{ gap: 16 }}>
          <View className="p-5 rounded-2xl bg-primary/5 border border-primary/20 items-center" style={{ gap: 10 }}>
            <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('queuePanel.queue.yourNumber')}</Text>
            <Text className="text-4xl font-extrabold text-primary tracking-tight">#{String(queueState.queueNumber).padStart(3, '0')}</Text>
            <Text className="text-xs text-muted-foreground">{t('queuePanel.queue.queueDate', { date: formatShortDate(queueState.queueDate) })}</Text>
            <View className="flex-row flex-wrap justify-center" style={{ gap: 6 }}>
              <Pill label={isOfferingDoctor ? t('queuePanel.queue.connectingDoctor') : t('queuePanel.queue.waitingTurn')} bg="#FFFFFF" text="#0F172A" border="#E2E8F0" />
              {creditDisplay ? <Pill label={creditDisplay} bg="#EFF6FF" text="#1D4ED8" border="#BFDBFE" /> : null}
            </View>
            <Text className="text-sm font-medium text-foreground">
              <Trans
                t={t}
                i18nKey="queuePanel.queue.peopleAhead"
                count={queueState.peopleAhead}
                components={{ strong: <Text className="text-primary font-bold text-base" /> }}
              />
            </Text>
          </View>

          {isOfferingDoctor ? (
            <View className="flex-row items-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/20" style={{ gap: 10 }}>
              <View className="h-3 w-3 rounded-full bg-amber-500" />
              <Text className="text-xs font-medium text-amber-900 flex-1">{t('queuePanel.queue.connectingNotice')}</Text>
            </View>
          ) : null}

          {!isOfferingDoctor && hasZeroDoctors ? (
            <View className="flex-row items-start p-4 rounded-xl bg-muted/40 border border-border" style={{ gap: 10 }}>
              <Info size={16} color="#0D6EFD" />
              <View className="flex-1">
                <Text className="text-xs font-semibold text-foreground">{t('queuePanel.queue.noDoctorsTitle')}</Text>
                <Text className="text-xs text-muted-foreground mt-0.5">{t('queuePanel.queue.noDoctorsDescription')}</Text>
              </View>
            </View>
          ) : null}

          <View className="border border-border rounded-xl p-4 bg-muted/10">
            <Text className="text-xs font-semibold text-foreground mb-2">{t('queuePanel.queue.doctorStats')}</Text>
            <View className="flex-row" style={{ gap: 10 }}>
              <Stat label={t('queuePanel.queue.onDuty')} value={queueState.doctorsOnDuty} color="#0F172A" />
              <Stat label={t('queuePanel.queue.available')} value={queueState.availableDoctors} color="#059669" />
              <Stat label={t('queuePanel.queue.busy')} value={queueState.busyDoctors} color="#D97706" />
            </View>
          </View>
        </View>

        <View className="border-t border-border bg-muted/5 p-4 flex-row items-center justify-between" style={{ gap: 10 }}>
          <Text className="text-xs text-muted-foreground flex-1">{t('queuePanel.queue.cancelHint')}</Text>
          <Pressable
            onPress={() =>
              Alert.alert(t('queuePanel.queue.leaveTitle'), t('queuePanel.queue.leaveConfirm'), [
                { text: t('queuePanel.queue.stay'), style: 'cancel' },
                { text: t('queuePanel.queue.leave'), style: 'destructive', onPress: () => onCancel(queueState.requestId) },
              ])
            }
            disabled={actionLoading}
            className="h-9 px-3 rounded-xl border border-border bg-white flex-row items-center active:opacity-80"
            style={{ gap: 4, opacity: actionLoading ? 0.5 : 1 }}
          >
            <XCircle size={14} color="#64748B" />
            <Text className="text-xs font-semibold text-muted-foreground">{t('queuePanel.queue.leave')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // 4. Trạng thái kết thúc của yêu cầu gần nhất
  if (latestRequest?.status === 'TIMED_OUT' || latestRequest?.status === 'CANCELLED') {
    const timedOut = latestRequest.status === 'TIMED_OUT';
    return (
      <View className={`rounded-2xl p-6 items-center border ${timedOut ? 'border-amber-200 bg-amber-50/60' : 'border-border bg-card'}`} style={{ gap: 12 }}>
        <View className={`h-12 w-12 rounded-full items-center justify-center ${timedOut ? 'bg-amber-100' : 'bg-muted'}`}>
          {timedOut ? <Clock size={24} color="#D97706" /> : <XCircle size={24} color="#64748B" />}
        </View>
        <Text className="text-base font-bold text-foreground text-center">{timedOut ? t('queuePanel.timedOut.title') : t('queuePanel.cancelled.title')}</Text>
        <Text className="text-xs text-muted-foreground text-center leading-5">
          {timedOut ? t('queuePanel.timedOut.description') : t('queuePanel.cancelled.description')}
        </Text>
        {reservationStatus && reservationConfig ? <Pill {...reservationConfig} /> : null}
        <Pressable onPress={onRegisterNew} className="h-11 px-5 rounded-xl bg-primary items-center justify-center active:opacity-90 mt-1">
          <Text className="text-white font-bold text-sm">{t('queuePanel.registerNew')}</Text>
        </Pressable>
      </View>
    );
  }

  // 5. Chưa có yêu cầu nào
  return (
    <View className="rounded-2xl border border-dashed border-border bg-card p-6 items-center" style={{ gap: 12 }}>
      <View className="h-14 w-14 rounded-2xl bg-primary/10 items-center justify-center">
        <Stethoscope size={28} color="#0D6EFD" />
      </View>
      <Text className="text-base font-bold text-foreground text-center">{t('queuePanel.empty.title')}</Text>
      <Text className="text-xs text-muted-foreground text-center leading-5">{t('queuePanel.empty.description')}</Text>
      <Pressable onPress={onRegisterNew} className="h-12 px-6 rounded-xl bg-primary items-center justify-center active:opacity-90 mt-1">
        <Text className="text-white font-bold text-sm">{t('queuePanel.empty.register')}</Text>
      </Pressable>
    </View>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="text-xs font-bold text-foreground" style={valueColor ? { color: valueColor } : undefined}>{value}</Text>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View className="flex-1 p-2.5 rounded-lg bg-background border border-border items-center">
      <Text className="text-[11px] text-muted-foreground">{label}</Text>
      <Text className="text-base font-bold" style={{ color }}>{value}</Text>
    </View>
  );
}

function Notice({ color, text }: { color: 'danger' | 'primary'; text: string }) {
  const danger = color === 'danger';
  return (
    <View
      className="flex-row items-start p-3 rounded-xl border"
      style={{ gap: 8, backgroundColor: danger ? '#FEF2F2' : '#EFF6FF', borderColor: danger ? '#FECACA' : '#BFDBFE' }}
    >
      {danger ? <AlertCircle size={16} color="#DC2626" /> : <Info size={16} color="#2563EB" />}
      <Text className="text-xs flex-1 leading-5" style={{ color: danger ? '#991B1B' : '#1E3A8A' }}>{text}</Text>
    </View>
  );
}
