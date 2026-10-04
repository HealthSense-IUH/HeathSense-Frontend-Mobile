import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
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
  iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--';

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
            <Pill label="Phiên tư vấn đang diễn ra" bg="#10B981" text="#FFFFFF" border="#10B981" />
            <Text className="text-base font-bold text-foreground mt-1.5">Bác sĩ đang đợi bạn trong phòng tư vấn</Text>
            <Text className="text-xs text-muted-foreground mt-0.5">Phiên tư vấn #{queueState.sessionId} đã được kích hoạt thành công.</Text>
          </View>
        </View>
        <View className="p-5" style={{ gap: 14 }}>
          <View className="bg-muted/30 border border-border rounded-xl p-4" style={{ gap: 8 }}>
            <Row label="Mã phiên tư vấn:" value={`#${queueState.sessionId}`} />
            {queueState.sessionStartedAt ? <Row label="Thời gian bắt đầu:" value={formatTime(queueState.sessionStartedAt)} /> : null}
            {queueState.sessionEndsAt ? <Row label="Thời gian kết thúc block 15 phút:" value={formatTime(queueState.sessionEndsAt)} /> : null}
            {reservationStatus && reservationConfig ? (
              <View className="flex-row items-center justify-between pt-2 border-t border-border">
                <Text className="text-xs text-muted-foreground">Trạng thái lượt:</Text>
                <Pill {...reservationConfig} />
              </View>
            ) : null}
          </View>
          <PrimaryButton label="Vào phòng tư vấn ngay (Mở Chat)" onPress={() => onOpenSession(queueState.sessionId as string | number)} icon={<ArrowRight size={16} color="#FFFFFF" />} />
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
              <Pill label="Bác sĩ đã sẵn sàng" bg="#0D6EFD" text="#FFFFFF" border="#0D6EFD" />
              <Text className="text-base font-bold text-foreground mt-1.5">Bác sĩ đã nhận lượt tư vấn của bạn!</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">Vui lòng xác nhận để bắt đầu phiên tư vấn trực tiếp.</Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-[11px] text-muted-foreground">Thời gian còn lại</Text>
            <View className="flex-row items-center" style={{ gap: 4 }}>
              <Clock size={14} color="#0D6EFD" />
              <Text className="text-lg font-bold text-primary">{confirmTimer}</Text>
            </View>
          </View>
        </View>

        <View className="p-5" style={{ gap: 12 }}>
          <View className="bg-muted/20 border border-border rounded-xl p-4" style={{ gap: 10 }}>
            <Row label="Số thứ tự của bạn:" value={`#${String(queueState.queueNumber).padStart(3, '0')}`} valueColor="#0D6EFD" />
            <Row label="Trạng thái:" value="Bác sĩ đã chấp nhận kết nối" valueColor="#059669" />
            {creditDisplay ? (
              <View className="pt-2 border-t border-border">
                <Text className="text-xs text-muted-foreground mb-1">Thông tin lượt:</Text>
                <Pill label={creditDisplay} bg="#EFF6FF" text="#1D4ED8" border="#BFDBFE" />
              </View>
            ) : null}
          </View>

          {insufficientCredits ? (
            <View className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl" style={{ gap: 10 }}>
              <View className="flex-row items-start" style={{ gap: 10 }}>
                <AlertCircle size={20} color="#D97706" />
                <View className="flex-1">
                  <Text className="font-semibold text-sm text-foreground">Không còn đủ lượt tại thời điểm bắt đầu phiên</Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">Màn hình xác nhận vẫn được giữ. Vui lòng nạp thêm lượt tư vấn để tiếp tục.</Text>
                </View>
              </View>
              <Pressable onPress={onBuyCredits} className="h-9 rounded-xl bg-primary flex-row items-center justify-center self-start px-4 active:opacity-90" style={{ gap: 6 }}>
                <Coins size={14} color="#FFFFFF" />
                <Text className="text-white text-xs font-semibold">Mua thêm lượt tư vấn</Text>
              </Pressable>
            </View>
          ) : null}

          {isConfirmExpired ? (
            <Notice color="danger" text="Đã hết thời gian xác nhận. Hệ thống đang làm mới trạng thái hàng đợi..." />
          ) : (
            <Notice
              color="primary"
              text={
                creditPolicy === 'PER_SESSION_CONFIRM_V2'
                  ? 'Bạn có tối đa 15 phút để xác nhận. Sau khi bạn xác nhận, 1 lượt tư vấn sẽ được trừ và phiên tư vấn sẽ được bắt đầu ngay lập tức.'
                  : 'Bạn có tối đa 15 phút để xác nhận. Sau khi bạn xác nhận, phiên tư vấn và khung chat trực tiếp sẽ được mở ngay lập tức.'
              }
            />
          )}

          <PrimaryButton
            label={actionLoading ? 'Đang tạo phiên tư vấn...' : 'Tham gia tư vấn'}
            disabled={!canConfirm}
            onPress={() => queueState.offerId && onConfirm(queueState.offerId)}
            icon={actionLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : undefined}
          />
          <OutlineButton
            label="Hủy lượt"
            danger
            disabled={actionLoading}
            onPress={() =>
              Alert.alert('Hủy lượt tư vấn', 'Bạn có chắc chắn muốn hủy lượt tư vấn này?', [
                { text: 'Không', style: 'cancel' },
                { text: 'Hủy lượt', style: 'destructive', onPress: () => onCancel(queueState.requestId) },
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
              <Text className="text-base font-bold text-foreground">Hàng đợi Tư vấn Sức khỏe</Text>
              <Text className="text-xs text-muted-foreground">
                {isOfferingDoctor ? 'Hệ thống đang kết nối bạn với bác sĩ...' : 'Bạn đang trong hàng đợi trực tuyến (FIFO)'}
              </Text>
            </View>
          </View>
          <Pressable onPress={onRefresh} disabled={loading} className="h-8 px-2.5 rounded-lg flex-row items-center active:opacity-70" style={{ gap: 4 }}>
            {loading ? <ActivityIndicator size="small" color="#64748B" /> : <RefreshCw size={14} color="#64748B" />}
            <Text className="text-xs text-muted-foreground">Làm mới</Text>
          </Pressable>
        </View>

        <View className="p-5" style={{ gap: 16 }}>
          <View className="p-5 rounded-2xl bg-primary/5 border border-primary/20 items-center" style={{ gap: 10 }}>
            <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Số thứ tự của bạn</Text>
            <Text className="text-4xl font-extrabold text-primary tracking-tight">#{String(queueState.queueNumber).padStart(3, '0')}</Text>
            <Text className="text-xs text-muted-foreground">Ngày tiếp nhận: {formatShortDate(queueState.queueDate)}</Text>
            <View className="flex-row flex-wrap justify-center" style={{ gap: 6 }}>
              <Pill label={isOfferingDoctor ? 'Đang kết nối bác sĩ' : 'Đang chờ đến lượt'} bg="#FFFFFF" text="#0F172A" border="#E2E8F0" />
              {creditDisplay ? <Pill label={creditDisplay} bg="#EFF6FF" text="#1D4ED8" border="#BFDBFE" /> : null}
            </View>
            <Text className="text-sm font-medium text-foreground">
              Còn <Text className="text-primary font-bold text-base">{queueState.peopleAhead}</Text> người trước bạn
            </Text>
          </View>

          {isOfferingDoctor ? (
            <View className="flex-row items-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/20" style={{ gap: 10 }}>
              <View className="h-3 w-3 rounded-full bg-amber-500" />
              <Text className="text-xs font-medium text-amber-900 flex-1">
                Hệ thống đang kết nối bạn với bác sĩ... Vui lòng giữ màn hình này và chờ phản hồi từ bác sĩ.
              </Text>
            </View>
          ) : null}

          {!isOfferingDoctor && hasZeroDoctors ? (
            <View className="flex-row items-start p-4 rounded-xl bg-muted/40 border border-border" style={{ gap: 10 }}>
              <Info size={16} color="#0D6EFD" />
              <View className="flex-1">
                <Text className="text-xs font-semibold text-foreground">Hiện chưa có bác sĩ sẵn sàng.</Text>
                <Text className="text-xs text-muted-foreground mt-0.5">Yêu cầu của bạn đã được xếp hàng và sẽ được xử lý khi có bác sĩ trực. Bạn không cần gửi lại yêu cầu.</Text>
              </View>
            </View>
          ) : null}

          <View className="border border-border rounded-xl p-4 bg-muted/10">
            <Text className="text-xs font-semibold text-foreground mb-2">Thống kê đội ngũ bác sĩ:</Text>
            <View className="flex-row" style={{ gap: 10 }}>
              <Stat label="Đang trực" value={queueState.doctorsOnDuty} color="#0F172A" />
              <Stat label="Sẵn sàng" value={queueState.availableDoctors} color="#059669" />
              <Stat label="Đang bận" value={queueState.busyDoctors} color="#D97706" />
            </View>
          </View>
        </View>

        <View className="border-t border-border bg-muted/5 p-4 flex-row items-center justify-between" style={{ gap: 10 }}>
          <Text className="text-xs text-muted-foreground flex-1">Bạn có thể hủy lượt bất cứ lúc nào trước khi phiên bắt đầu.</Text>
          <Pressable
            onPress={() =>
              Alert.alert('Rời hàng đợi', 'Bạn có chắc chắn muốn rời khỏi hàng đợi tư vấn?', [
                { text: 'Ở lại', style: 'cancel' },
                { text: 'Hủy lượt chờ', style: 'destructive', onPress: () => onCancel(queueState.requestId) },
              ])
            }
            disabled={actionLoading}
            className="h-9 px-3 rounded-xl border border-border bg-white flex-row items-center active:opacity-80"
            style={{ gap: 4, opacity: actionLoading ? 0.5 : 1 }}
          >
            <XCircle size={14} color="#64748B" />
            <Text className="text-xs font-semibold text-muted-foreground">Hủy lượt chờ</Text>
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
        <Text className="text-base font-bold text-foreground text-center">{timedOut ? 'Bạn đã bỏ lỡ lượt tư vấn' : 'Yêu cầu tư vấn đã được hủy'}</Text>
        <Text className="text-xs text-muted-foreground text-center leading-5">
          {timedOut
            ? 'Thời hạn xác nhận lượt tư vấn trước đó đã hết. Nếu bạn vẫn muốn được bác sĩ tư vấn, vui lòng đăng ký lại để nhận số thứ tự mới.'
            : 'Lượt xếp hàng trước đó của bạn đã kết thúc. Bạn có thể tạo yêu cầu tư vấn mới bất cứ lúc nào.'}
        </Text>
        {reservationStatus && reservationConfig ? <Pill {...reservationConfig} /> : null}
        <Pressable onPress={onRegisterNew} className="h-11 px-5 rounded-xl bg-primary items-center justify-center active:opacity-90 mt-1">
          <Text className="text-white font-bold text-sm">Đăng ký tư vấn mới</Text>
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
      <Text className="text-base font-bold text-foreground text-center">Bạn chưa có yêu cầu tư vấn đang hoạt động</Text>
      <Text className="text-xs text-muted-foreground text-center leading-5">
        Đăng ký để được xếp vào hàng đợi tư vấn trực tiếp 1-1 với bác sĩ chuyên khoa.
      </Text>
      <Pressable onPress={onRegisterNew} className="h-12 px-6 rounded-xl bg-primary items-center justify-center active:opacity-90 mt-1">
        <Text className="text-white font-bold text-sm">Đăng ký tư vấn ngay</Text>
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
