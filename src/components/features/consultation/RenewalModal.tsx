import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { RefreshCw, Clock, X, Shield, CreditCard } from 'lucide-react-native';
import { consultationApi } from '../../../../services/consultation.service';
import type {
  ConsultationSessionItem,
  ConsultationRenewalResponse,
  SessionExtensionResponse,
} from '@/types/consultation';

interface RenewalModalProps {
  visible: boolean;
  session: ConsultationSessionItem | null;
  onClose: () => void;
  onRequestRenewal: (sessionId: string | number, note?: string) => Promise<boolean>;
  onAcceptRenewalAgreement: (renewalId: string | number, agreementId: string | number) => Promise<boolean>;
  onInitiateRenewalPayment: (renewalId: string | number) => Promise<boolean>;
  onCancelRenewal: (renewalId: string | number) => Promise<boolean>;
}

export function RenewalModal({
  visible,
  session,
  onClose,
  onRequestRenewal,
  onAcceptRenewalAgreement,
  onInitiateRenewalPayment,
  onCancelRenewal,
}: RenewalModalProps) {
  const [loading, setLoading] = useState(false);
  const [renewals, setRenewals] = useState<ConsultationRenewalResponse[]>([]);
  const [extensions, setExtensions] = useState<SessionExtensionResponse[]>([]);
  const [isRequestingNew, setIsRequestingNew] = useState(false);
  const [note, setNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleClose = () => {
    setIsRequestingNew(false);
    setNote('');
    onClose();
  };

  const fetchRenewalData = useCallback(() => {
    if (!session?.id) return;
    setLoading(true);
    Promise.allSettled([
      consultationApi.listSessionRenewals(session.id),
      consultationApi.getSessionExtensions(session.id),
    ])
      .then(([renRes, extRes]) => {
        if (renRes.status === 'fulfilled') {
          const data = (renRes.value as any).data?.data || (renRes.value as any).data;
          setRenewals(Array.isArray(data) ? data : []);
        }
        if (extRes.status === 'fulfilled') {
          const data = (extRes.value as any).data?.data || (extRes.value as any).data;
          setExtensions(Array.isArray(data) ? data : []);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [session?.id]);

  useEffect(() => {
    if (!visible || !session?.id) return;

    let isCancelled = false;
    Promise.allSettled([
      consultationApi.listSessionRenewals(session.id),
      consultationApi.getSessionExtensions(session.id),
    ])
      .then(([renRes, extRes]) => {
        if (isCancelled) return;
        if (renRes.status === 'fulfilled') {
          const data = (renRes.value as any).data?.data || (renRes.value as any).data;
          setRenewals(Array.isArray(data) ? data : []);
        }
        if (extRes.status === 'fulfilled') {
          const data = (extRes.value as any).data?.data || (extRes.value as any).data;
          setExtensions(Array.isArray(data) ? data : []);
        }
        setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [visible, session?.id]);

  const handleSendNewRequest = async () => {
    if (!session?.id) return;
    setActionLoading(true);
    try {
      const success = await onRequestRenewal(session.id, note.trim());
      if (success) {
        setIsRequestingNew(false);
        setNote('');
        fetchRenewalData();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptAgreement = async (renewal: ConsultationRenewalResponse) => {
    setActionLoading(true);
    try {
      // Get agreement ID
      const agreementRes = await consultationApi.getRenewalAgreement(renewal.id);
      const agreementData = (agreementRes as any).data?.data || (agreementRes as any).data;
      const agreementId = agreementData?.id || agreementData?.agreementId;
      if (agreementId) {
        await onAcceptRenewalAgreement(renewal.id, agreementId);
        fetchRenewalData();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = async (renewalId: string | number) => {
    setActionLoading(true);
    try {
      await onInitiateRenewalPayment(renewalId);
      fetchRenewalData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (renewalId: string | number) => {
    setActionLoading(true);
    try {
      await onCancelRenewal(renewalId);
      fetchRenewalData();
    } finally {
      setActionLoading(false);
    }
  };

  if (!session) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-background rounded-t-3xl max-h-[88%] p-6 flex flex-col shadow-2xl">
          {/* Header */}
          <View className="flex-row justify-between items-center pb-4 border-b border-border">
            <View className="flex-row items-center gap-3">
              <View className="p-2.5 rounded-full bg-primary/10">
                <RefreshCw size={22} className="text-primary" />
              </View>
              <View>
                <Text className="font-bold text-foreground text-lg">Gia hạn Chăm sóc</Text>
                <Text className="text-xs text-muted-foreground">Phiên tư vấn #{session.id}</Text>
              </View>
            </View>
            <Pressable
              onPress={handleClose}
              className="h-8 w-8 rounded-full bg-muted items-center justify-center active:opacity-70"
            >
              <X size={18} className="text-foreground" />
            </Pressable>
          </View>

          {/* Body */}
          {loading ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator size="large" color="#0057cd" />
              <Text className="text-sm text-muted-foreground mt-3">Đang tải lịch sử gia hạn...</Text>
            </View>
          ) : isRequestingNew ? (
            /* New Renewal Request Form */
            <View className="py-4">
              <Text className="font-bold text-foreground text-base mb-1">
                Đăng ký gia hạn thêm thời gian
              </Text>
              <Text className="text-xs text-muted-foreground mb-4">
                Gửi yêu cầu gia hạn phiên khám với Bác sĩ phụ trách hiện tại.
              </Text>

              <Text className="font-semibold text-foreground text-xs mb-2">
                Ghi chú cho Bác sĩ (Tùy chọn)
              </Text>
              <TextInput
                className="border border-border rounded-2xl p-4 text-foreground bg-card text-sm min-h-[100px] mb-6"
                multiline
                textAlignVertical="top"
                placeholder="Ví dụ: Cần theo dõi thêm kết quả điều chỉnh liều thuốc..."
                placeholderTextColor="#94a3b8"
                value={note}
                onChangeText={setNote}
              />

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setIsRequestingNew(false)}
                  disabled={actionLoading}
                  className="flex-1 py-3.5 rounded-xl bg-muted items-center justify-center active:opacity-70"
                >
                  <Text className="font-semibold text-foreground text-sm">Quay lại</Text>
                </Pressable>

                <Pressable
                  onPress={handleSendNewRequest}
                  disabled={actionLoading}
                  className="flex-1 py-3.5 rounded-xl bg-primary items-center justify-center flex-row gap-2 active:opacity-90"
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text className="font-bold text-white text-sm">Gửi yêu cầu</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            /* Renewal list */
            <ScrollView showsVerticalScrollIndicator={false} className="py-4">
              {/* Extensions summary if any */}
              {extensions.length > 0 && (
                <View className="bg-primary/5 border border-primary/20 p-3.5 rounded-2xl mb-4">
                  <Text className="text-xs font-bold text-primary mb-1">
                    Thời gian đã được gia hạn (+{extensions.length} lần)
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Hạn kết thúc hiện tại: {session.endsAt ? new Date(session.endsAt).toLocaleDateString('vi-VN') : '---'}
                  </Text>
                </View>
              )}

              {/* Renewal requests */}
              <View className="flex-row justify-between items-center mb-3">
                <Text className="font-bold text-foreground text-sm">Danh sách yêu cầu gia hạn</Text>
                <Pressable
                  onPress={() => setIsRequestingNew(true)}
                  className="px-3 py-1.5 rounded-lg bg-primary active:opacity-80"
                >
                  <Text className="text-white text-xs font-bold">+ Yêu cầu mới</Text>
                </Pressable>
              </View>

              {renewals.length === 0 ? (
                <View className="py-10 items-center">
                  <Clock size={32} className="text-muted-foreground/40 mb-2" />
                  <Text className="text-xs text-muted-foreground">Chưa có yêu cầu gia hạn nào cho phiên này.</Text>
                </View>
              ) : (
                <View className="space-y-3 mb-6">
                  {renewals.map((item) => (
                    <View
                      key={item.id}
                      className="p-4 rounded-2xl border border-border bg-card shadow-sm"
                    >
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="font-bold text-foreground text-sm">Gia hạn #{item.id}</Text>
                        <Text className="text-xs font-bold text-primary">{item.status}</Text>
                      </View>

                      <Text className="text-xs text-muted-foreground mb-3">
                        Ngày tạo: {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '---'}
                      </Text>

                      {/* Action buttons per renewal status */}
                      <View className="flex-row gap-2 justify-end">
                        {item.status === 'PENDING_ACCEPTANCE' && (
                          <Pressable
                            onPress={() => handleAcceptAgreement(item)}
                            disabled={actionLoading}
                            className="px-3.5 py-2 rounded-xl bg-amber-600 flex-row items-center gap-1.5 active:opacity-80"
                          >
                            <Shield size={14} color="#ffffff" />
                            <Text className="text-white text-xs font-bold">Ký phụ lục</Text>
                          </Pressable>
                        )}

                        {item.status === 'WAITING_PAYMENT' && (
                          <Pressable
                            onPress={() => handlePay(item.id)}
                            disabled={actionLoading}
                            className="px-3.5 py-2 rounded-xl bg-primary flex-row items-center gap-1.5 active:opacity-80"
                          >
                            <CreditCard size={14} color="#ffffff" />
                            <Text className="text-white text-xs font-bold">Thanh toán</Text>
                          </Pressable>
                        )}

                        {['REQUESTED', 'UNDER_REVIEW', 'PENDING_ACCEPTANCE', 'WAITING_PAYMENT'].includes(item.status) && (
                          <Pressable
                            onPress={() => handleCancel(item.id)}
                            disabled={actionLoading}
                            className="px-3 py-2 rounded-xl bg-muted active:opacity-80"
                          >
                            <Text className="text-muted-foreground text-xs font-semibold">Hủy</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
