import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Shield, Clock, User, Check, X, AlertCircle } from 'lucide-react-native';
import { consultationApi } from '../../../../services/consultation.service';
import type { CareServiceAgreementResponse } from '@/types/consultation';

interface CareAgreementModalProps {
  visible: boolean;
  requestId: string | number | null;
  onClose: () => void;
  onAccepted: () => void;
}

export function CareAgreementModal({
  visible,
  requestId,
  onClose,
  onAccepted,
}: CareAgreementModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agreement, setAgreement] = useState<CareServiceAgreementResponse | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClose = () => {
    setAgreement(null);
    setAcceptedTerms(false);
    setErrorMsg(null);
    onClose();
  };

  useEffect(() => {
    if (!visible || !requestId) return;

    let isCancelled = false;
    consultationApi
      .getAgreement(requestId)
      .then((res) => {
        if (!isCancelled) {
          const data = (res as any).data?.data || (res as any).data;
          setAgreement(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          const msg = err.response?.data?.message || 'Không thể tải thỏa thuận dịch vụ lúc này.';
          setErrorMsg(msg);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [visible, requestId]);

  const handleConfirmAccept = async () => {
    if (!requestId || !agreement || !acceptedTerms) return;
    const agreementId = (agreement as any).id || (agreement as any).agreementId;
    if (!agreementId) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await consultationApi.acceptAgreement(requestId, {
        agreementId: Number(agreementId),
        accepted: true,
      });
      onAccepted();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Không thể xác nhận thỏa thuận lúc này.');
    } finally {
      setSubmitting(false);
    }
  };

  const pkgName =
    agreement?.packageName ||
    (agreement as any)?.packageSnapshot?.name ||
    'Gói chăm sóc sức khỏe';
  const priceAmount =
    agreement?.priceAmount ??
    (agreement as any)?.packageSnapshot?.priceAmount ??
    0;
  const durationDays =
    agreement?.durationDays ??
    (agreement as any)?.packageSnapshot?.durationDays ??
    30;
  const doctorName =
    agreement?.doctorSnapshot?.displayName ||
    'Bác sĩ chuyên khoa phụ trách';
  const doctorSpecialty = agreement?.doctorSnapshot?.specialty || 'Tim mạch & Nội tổng quát';
  const termsPolicy =
    agreement?.termsPolicyReference ||
    (agreement as any)?.packageSnapshot?.termsPolicyReference ||
    agreement?.limitations ||
    (agreement as any)?.packageSnapshot?.limitations ||
    'Dịch vụ tư vấn từ xa nhằm mục đích theo dõi và hướng dẫn chăm sóc sức khỏe ban đầu, không thay thế cho cấp cứu y tế khẩn cấp.';

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
                <Shield size={22} className="text-primary" />
              </View>
              <View>
                <Text className="font-bold text-foreground text-lg">Thỏa thuận Dịch vụ</Text>
                <Text className="text-xs text-muted-foreground">Yêu cầu tư vấn #{requestId}</Text>
              </View>
            </View>
            <Pressable
              onPress={handleClose}
              className="h-8 w-8 rounded-full bg-muted items-center justify-center active:opacity-70"
            >
              <X size={18} className="text-foreground" />
            </Pressable>
          </View>

          {/* Content */}
          {loading ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator size="large" color="#0057cd" />
              <Text className="text-sm text-muted-foreground mt-3">Đang tải thỏa thuận...</Text>
            </View>
          ) : errorMsg && !agreement ? (
            <View className="py-12 items-center">
              <AlertCircle size={36} className="text-red-500 mb-2" />
              <Text className="text-red-600 text-center text-sm">{errorMsg}</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} className="py-4">
              {errorMsg && (
                <View className="bg-red-50 border border-red-200 p-3 rounded-xl mb-4">
                  <Text className="text-red-700 text-xs">{errorMsg}</Text>
                </View>
              )}

              {/* Package & Doctor info card */}
              <View className="bg-card border border-border rounded-2xl p-4 mb-4">
                <Text className="font-bold text-foreground text-base mb-1">{pkgName}</Text>
                <View className="flex-row items-center gap-2 mb-3">
                  <Text className="text-primary font-extrabold text-lg">
                    {Number(priceAmount).toLocaleString('vi-VN')} ₫
                  </Text>
                  <Text className="text-xs text-muted-foreground">• Thời hạn {durationDays} ngày</Text>
                </View>

                <View className="pt-3 border-t border-border flex-row items-center gap-3">
                  <View className="h-10 w-10 rounded-full bg-primary/10 items-center justify-center">
                    <User size={20} className="text-primary" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-muted-foreground">Bác sĩ phụ trách</Text>
                    <Text className="font-semibold text-foreground text-sm">{doctorName}</Text>
                    <Text className="text-xs text-primary">{doctorSpecialty}</Text>
                  </View>
                </View>
              </View>

              {/* Policy & Terms */}
              <Text className="font-semibold text-foreground text-sm mb-2">Điều khoản dịch vụ y tế</Text>
              <View className="bg-muted/40 border border-border rounded-2xl p-4 mb-6">
                <Text className="text-foreground text-xs leading-relaxed">{termsPolicy}</Text>
                <View className="mt-3 pt-3 border-t border-border/60 flex-row items-center gap-2">
                  <Clock size={14} className="text-muted-foreground" />
                  <Text className="text-[11px] text-muted-foreground">
                    Hỗ trợ phản hồi theo lịch trực chuyên khoa của Bác sĩ.
                  </Text>
                </View>
              </View>

              {/* Terms Checkbox */}
              <Pressable
                onPress={() => setAcceptedTerms(!acceptedTerms)}
                className="flex-row items-center gap-3 p-3 rounded-xl bg-card border border-border mb-6 active:opacity-80"
              >
                <View
                  className={`h-6 w-6 rounded-md border items-center justify-center ${
                    acceptedTerms ? 'bg-primary border-primary' : 'border-border bg-background'
                  }`}
                >
                  {acceptedTerms && <Check size={16} color="#ffffff" />}
                </View>
                <Text className="flex-1 text-xs text-foreground font-medium">
                  Tôi đã đọc, hiểu rõ và đồng ý với các điều khoản của Thỏa thuận dịch vụ chăm sóc sức khỏe này.
                </Text>
              </Pressable>
            </ScrollView>
          )}

          {/* Footer Actions */}
          <View className="pt-3 border-t border-border flex-row gap-3">
            <Pressable
              onPress={handleClose}
              disabled={submitting}
              className="flex-1 py-3.5 rounded-xl bg-muted items-center justify-center active:opacity-70"
            >
              <Text className="font-semibold text-foreground text-sm">Để sau</Text>
            </Pressable>

            <Pressable
              onPress={handleConfirmAccept}
              disabled={submitting || !acceptedTerms || loading || !agreement}
              className={`flex-1 py-3.5 rounded-xl items-center justify-center flex-row gap-2 ${
                submitting || !acceptedTerms || loading || !agreement
                  ? 'bg-primary/40'
                  : 'bg-primary active:opacity-90'
              }`}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="font-bold text-white text-sm">Xác nhận & Đồng ý</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
