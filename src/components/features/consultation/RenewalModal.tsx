import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowRight, CheckCircle2, Clock, CreditCard, History, RefreshCw, Shield, X } from 'lucide-react-native';
import { consultationApi } from '@/services/consultation.service';
import type { ConsultationRenewalResponse, ConsultationSessionItem, SessionExtensionResponse } from '@/types/consultation';
import { formatDateTime, formatVND } from '@/utils/formatters';

interface RenewalModalProps {
  visible: boolean;
  session: ConsultationSessionItem | null;
  onClose: () => void;
  onRequestRenewal: (sessionId: string | number) => Promise<boolean>;
  onAcceptRenewalAgreement: (renewalId: string | number, agreementId: string | number) => Promise<boolean>;
  onInitiateRenewalPayment: (renewalId: string | number) => Promise<boolean>;
  onCancelRenewal: (renewalId: string | number) => Promise<boolean>;
}

/** Nhãn trạng thái gia hạn — giống web renewal-dialog getRenewalStatusBadge. */
const RENEWAL_STATUS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  REQUESTED: { label: 'Chờ tiếp nhận', bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  UNDER_REVIEW: { label: 'Đang xem xét', bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  PENDING_ACCEPTANCE: { label: 'Chờ xác nhận thỏa thuận', bg: '#0D6EFD', text: '#FFFFFF', border: '#0D6EFD' },
  WAITING_PAYMENT: { label: 'Chờ thanh toán', bg: '#F59E0B', text: '#FFFFFF', border: '#F59E0B' },
  PAID: { label: 'Đã gia hạn thành công', bg: '#059669', text: '#FFFFFF', border: '#059669' },
  REJECTED: { label: 'Bị từ chối', bg: '#DC2626', text: '#FFFFFF', border: '#DC2626' },
  CANCELLED: { label: 'Đã hủy', bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' },
  EXPIRED: { label: 'Đã hết hạn', bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' },
  REQUIRES_REVIEW: { label: 'Cần kiểm tra thủ công', bg: '#F59E0B', text: '#0F172A', border: '#F59E0B' },
};

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Text className="text-xs text-muted-foreground">
      {label} <Text className="font-bold" style={{ color: color || '#0F172A' }}>{value}</Text>
    </Text>
  );
}

const UNRESOLVED = ['REQUESTED', 'UNDER_REVIEW', 'PENDING_ACCEPTANCE', 'WAITING_PAYMENT', 'REQUIRES_REVIEW'];

const unwrap = <T,>(res: unknown): T => {
  const body = (res as { data?: { data?: T } })?.data;
  return (body?.data ?? body) as T;
};

function RenewalPill({ status }: { status: string }) {
  const cfg = RENEWAL_STATUS[status] || { label: status, bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };
  return (
    <View className="px-2 py-0.5 rounded-full border" style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}>
      <Text className="text-[11px] font-bold" style={{ color: cfg.text }}>{cfg.label}</Text>
    </View>
  );
}

/** Gia hạn phiên chăm sóc theo gói (luồng cũ) — giống web RenewalDialog: quản lý gia hạn + lịch sử thời hạn. */
export function RenewalModal({ visible, session, onClose, onRequestRenewal, onAcceptRenewalAgreement, onInitiateRenewalPayment, onCancelRenewal }: RenewalModalProps) {
  const [tab, setTab] = useState<'manage' | 'history'>('manage');
  const [loading, setLoading] = useState(false);
  const [renewals, setRenewals] = useState<ConsultationRenewalResponse[]>([]);
  const [extensions, setExtensions] = useState<SessionExtensionResponse[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const sessionId = session?.id;
  const fetchData = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    const [renRes, extRes] = await Promise.allSettled([consultationApi.listSessionRenewals(sessionId), consultationApi.getSessionExtensions(sessionId)]);
    if (renRes.status === 'fulfilled') {
      const data = unwrap<ConsultationRenewalResponse[]>(renRes.value);
      setRenewals(Array.isArray(data) ? data : []);
    }
    if (extRes.status === 'fulfilled') {
      const data = unwrap<SessionExtensionResponse[]>(extRes.value);
      setExtensions(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    if (!visible || !sessionId) return;
    queueMicrotask(() => {
      setTab('manage');
      void fetchData();
    });
  }, [visible, sessionId, fetchData]);

  if (!session) return null;
  const isSessionActive = session.status === 'ACTIVE';
  const unresolved = renewals.find((r) => UNRESOLVED.includes(r.status));

  const run = async (fn: () => Promise<boolean>) => {
    setActionLoading(true);
    try {
      if (await fn()) await fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptAgreement = (renewal: ConsultationRenewalResponse) =>
    run(async () => {
      const agreement = unwrap<{ id?: string | number; agreementId?: string | number; packageName?: string; priceAmount?: number; durationDays?: number; validUntil?: string }>(
        await consultationApi.getRenewalAgreement(renewal.id)
      );
      const agreementId = agreement?.id || agreement?.agreementId;
      if (!agreementId) return false;
      return new Promise<boolean>((resolve) => {
        Alert.alert(
          'Thỏa thuận Gia hạn Dịch vụ Chăm sóc',
          `Gói: ${agreement.packageName || renewal.packageNameSnapshot || 'Gói gia hạn chăm sóc'}\nPhí: ${formatVND(agreement.priceAmount ?? renewal.priceAmount ?? renewal.packagePriceSnapshot ?? 0)} / +${agreement.durationDays ?? renewal.durationDays ?? 0} ngày đồng hành${
            agreement.validUntil ? `\nHiệu lực chấp nhận & thanh toán đến: ${formatDateTime(agreement.validUntil)}` : ''
          }\n\nTôi đã đọc, hiểu rõ và đồng ý với các điều khoản gia hạn, mức phí và cam kết tiếp tục đồng hành chăm sóc cùng bác sĩ phụ trách.`,
          [
            { text: 'Đóng', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Xác nhận & Tiến hành thanh toán', onPress: () => onAcceptRenewalAgreement(renewal.id, agreementId).then(resolve) },
          ]
        );
      });
    });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-background rounded-t-3xl max-h-[88%] p-5">
          <View className="flex-row justify-between items-center pb-3 border-b border-border">
            <View className="flex-row items-center flex-1" style={{ gap: 10 }}>
              <View className="p-2.5 rounded-full bg-primary/10">
                <RefreshCw size={20} color="#0D6EFD" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-foreground text-base">Gia hạn Phiên Chăm sóc</Text>
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>Phiên #{session.id} • {session.doctorDisplayName || `Bác sĩ #${session.doctorId}`}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} className="h-8 w-8 rounded-full bg-muted items-center justify-center active:opacity-70">
              <X size={18} color="#0F172A" />
            </Pressable>
          </View>

          <View className="flex-row bg-muted/60 p-1 rounded-xl my-3">
            {(['manage', 'history'] as const).map((key) => (
              <Pressable key={key} onPress={() => setTab(key)} className={`flex-1 py-2 rounded-lg items-center ${tab === key ? 'bg-background shadow-xs' : ''}`}>
                <Text className={`text-xs font-bold ${tab === key ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {key === 'manage' ? 'Quản lý Gia hạn' : `Lịch sử Thời hạn (${extensions.length})`}
                </Text>
              </Pressable>
            ))}
          </View>

          {loading ? (
            <View className="py-16 items-center">
              <ActivityIndicator size="large" color="#0057cd" />
              <Text className="text-sm text-muted-foreground mt-3">Đang tải lịch sử...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 12 }}>
              {tab === 'manage' ? (
                <>
                  <View className="p-4 rounded-xl border border-border bg-card" style={{ gap: 8 }}>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-semibold text-foreground">Thông tin thời hạn hiện tại:</Text>
                      <Text className="text-xs text-muted-foreground">Bắt đầu: {formatDateTime(session.startedAt)}</Text>
                    </View>
                    <View className="flex-row items-center p-2.5 rounded-lg bg-muted/30" style={{ gap: 8 }}>
                      <Clock size={16} color="#0D6EFD" />
                      <Text className="text-xs text-foreground">
                        Thời hạn hiệu lực hiện tại: <Text className="font-bold text-primary">{formatDateTime(session.endsAt, 'Không xác định')}</Text>
                      </Text>
                    </View>
                  </View>

                  {unresolved ? (
                    <View className="p-4 rounded-xl border border-amber-200 bg-amber-50/60" style={{ gap: 8 }}>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1" style={{ gap: 6 }}>
                          <Shield size={18} color="#D97706" />
                          <Text className="font-semibold text-sm text-amber-950 flex-1">Yêu cầu gia hạn #{unresolved.id} đang xử lý</Text>
                        </View>
                        <RenewalPill status={unresolved.status} />
                      </View>
                      {unresolved.proposedNewEndsAt || unresolved.proposedEndsAt ? <Row label="Thời hạn sau khi gia hạn:" value={formatDateTime(unresolved.proposedNewEndsAt || unresolved.proposedEndsAt)} /> : null}
                      {unresolved.packageNameSnapshot || unresolved.durationDays ? (
                        <Row
                          label="Gói dịch vụ gia hạn:"
                          value={`${unresolved.packageNameSnapshot || `Gói +${unresolved.durationDays} ngày`}${(unresolved.packagePriceSnapshot || unresolved.priceAmount) ? ` (${formatVND(unresolved.packagePriceSnapshot || unresolved.priceAmount)})` : ''}`}
                        />
                      ) : null}
                      {unresolved.paymentDeadline ? <Row label="Hạn chót thanh toán:" value={formatDateTime(unresolved.paymentDeadline)} color="#DC2626" /> : null}
                      {unresolved.rejectionReason ? <Row label="Lý do từ chối:" value={unresolved.rejectionReason} color="#B91C1C" /> : null}

                      <View className="flex-row flex-wrap pt-1" style={{ gap: 8 }}>
                        {unresolved.status === 'PENDING_ACCEPTANCE' ? (
                          <Pressable onPress={() => void handleAcceptAgreement(unresolved)} disabled={actionLoading} className="h-9 px-3 rounded-xl bg-primary flex-row items-center active:opacity-90" style={{ gap: 6 }}>
                            <Shield size={14} color="#FFFFFF" />
                            <Text className="text-white text-xs font-bold">Xem & Chấp nhận thỏa thuận</Text>
                          </Pressable>
                        ) : null}
                        {unresolved.status === 'WAITING_PAYMENT' ? (
                          <Pressable onPress={() => void run(() => onInitiateRenewalPayment(unresolved.id))} disabled={actionLoading} className="h-9 px-3 rounded-xl bg-emerald-600 flex-row items-center active:opacity-90" style={{ gap: 6 }}>
                            <CreditCard size={14} color="#FFFFFF" />
                            <Text className="text-white text-xs font-bold">Tiến hành thanh toán</Text>
                          </Pressable>
                        ) : null}
                        {['REQUESTED', 'UNDER_REVIEW', 'PENDING_ACCEPTANCE', 'WAITING_PAYMENT'].includes(unresolved.status) ? (
                          <Pressable
                            onPress={() =>
                              Alert.alert('Hủy yêu cầu gia hạn', 'Thời hạn phiên chăm sóc hiện tại sẽ giữ nguyên.', [
                                { text: 'Không', style: 'cancel' },
                                { text: 'Hủy yêu cầu', style: 'destructive', onPress: () => void run(() => onCancelRenewal(unresolved.id)) },
                              ])
                            }
                            disabled={actionLoading}
                            className="h-9 px-3 rounded-xl border border-rose-200 bg-white flex-row items-center active:opacity-80"
                          >
                            <Text className="text-rose-600 text-xs font-semibold">Hủy yêu cầu</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  ) : isSessionActive ? (
                    <View className="p-4 rounded-xl border border-dashed border-border bg-muted/10" style={{ gap: 10 }}>
                      <View className="flex-row items-center" style={{ gap: 6 }}>
                        <CheckCircle2 size={18} color="#0D6EFD" />
                        <Text className="font-semibold text-sm text-foreground">Gia hạn thêm thời gian chăm sóc</Text>
                      </View>
                      <Text className="text-xs text-muted-foreground leading-5">
                        Gia hạn chăm sóc giúp bạn tiếp tục đồng hành cùng <Text className="font-bold text-foreground">{session.doctorDisplayName || `Bác sĩ #${session.doctorId}`}</Text> trong cùng phiên tư vấn này mà không bị gián đoạn dữ liệu và lịch sử trò chuyện.
                      </Text>
                      <Pressable onPress={() => void run(() => onRequestRenewal(session.id))} disabled={actionLoading} className="h-11 rounded-xl bg-primary flex-row items-center justify-center active:opacity-90" style={{ gap: 8 }}>
                        {actionLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <RefreshCw size={16} color="#FFFFFF" />}
                        <Text className="text-white font-bold text-sm">{actionLoading ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu Gia hạn Chăm sóc'}</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View className="p-4 rounded-xl border border-border bg-muted/20">
                      <Text className="text-xs text-muted-foreground">Phiên chăm sóc đã kết thúc hoặc không còn hoạt động, không thể yêu cầu gia hạn.</Text>
                    </View>
                  )}

                  <View className="pt-3 border-t border-border" style={{ gap: 8 }}>
                    <Text className="text-xs font-semibold text-foreground">Lịch sử các yêu cầu gia hạn</Text>
                    {renewals.length === 0 ? (
                      <Text className="text-xs text-muted-foreground italic">Chưa có yêu cầu gia hạn nào cho phiên này.</Text>
                    ) : (
                      renewals.map((r) => (
                        <View key={String(r.id)} className="p-3 rounded-lg border border-border bg-card flex-row items-center justify-between" style={{ gap: 8 }}>
                          <View className="flex-1">
                            <Text className="text-xs font-medium text-foreground">Yêu cầu #{r.id} <Text className="text-muted-foreground">({formatDateTime(r.requestedAt || r.createdAt)})</Text></Text>
                            {r.proposedNewEndsAt || r.proposedEndsAt ? <Text className="text-xs text-muted-foreground">Hạn đề xuất: <Text className="font-bold text-foreground">{formatDateTime(r.proposedNewEndsAt || r.proposedEndsAt)}</Text></Text> : null}
                          </View>
                          <RenewalPill status={r.status} />
                        </View>
                      ))
                    )}
                  </View>
                </>
              ) : (
                <>
                  <Text className="text-xs text-muted-foreground">Dưới đây là các mốc gia hạn thời gian chăm sóc đã được áp dụng thành công vào phiên tư vấn này:</Text>
                  {extensions.length === 0 ? (
                    <View className="py-10 items-center border border-dashed border-border rounded-xl p-4">
                      <History size={32} color="#CBD5E1" />
                      <Text className="font-medium text-xs text-foreground mt-2">Chưa có mốc gia hạn nào được ghi nhận</Text>
                      <Text className="text-[11px] text-muted-foreground mt-0.5 text-center">Thời hạn phiên hiện tại là thời hạn ban đầu khi kích hoạt gói dịch vụ.</Text>
                    </View>
                  ) : (
                    extensions.map((ext, idx) => (
                      <View key={String(ext.id ?? `ext-${idx}`)} className="p-3.5 rounded-xl border border-border bg-card" style={{ gap: 6 }}>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs font-semibold text-foreground">Gia hạn lần #{idx + 1}</Text>
                          <View className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                            <Text className="text-[10px] font-semibold text-emerald-700">Đã áp dụng: {formatDateTime(ext.appliedAt)}</Text>
                          </View>
                        </View>
                        <View className="flex-row items-center" style={{ gap: 6 }}>
                          <Text className="text-xs text-muted-foreground">{formatDateTime(ext.previousEndsAt)}</Text>
                          <ArrowRight size={14} color="#0D6EFD" />
                          <Text className="text-xs font-bold text-foreground">{formatDateTime(ext.newEndsAt)}</Text>
                        </View>
                        {ext.packageNameSnapshot ? (
                          <Text className="text-[11px] text-muted-foreground">
                            Gói: <Text className="font-bold text-foreground">{ext.packageNameSnapshot}</Text>{ext.packagePriceSnapshot ? ` • ${formatVND(ext.packagePriceSnapshot)}` : ''}
                          </Text>
                        ) : null}
                      </View>
                    ))
                  )}
                </>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
