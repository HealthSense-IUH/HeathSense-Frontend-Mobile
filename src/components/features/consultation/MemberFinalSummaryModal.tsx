import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { FileText, X, CheckCircle, AlertCircle, HeartPulse } from 'lucide-react-native';
import { consultationApi } from '../../../../services/consultation.service';
import type { ConsultationFinalSummaryResponse } from '@/types/consultation';

interface MemberFinalSummaryModalProps {
  visible: boolean;
  sessionId: string | number | null;
  onClose: () => void;
}

export function MemberFinalSummaryModal({
  visible,
  sessionId,
  onClose,
}: MemberFinalSummaryModalProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ConsultationFinalSummaryResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClose = () => {
    setSummary(null);
    setErrorMsg(null);
    onClose();
  };

  useEffect(() => {
    if (!visible || !sessionId) return;

    let isCancelled = false;
    consultationApi
      .getMemberFinalSummary(sessionId)
      .then((res) => {
        if (!isCancelled) {
          const data = (res as any).data?.data || (res as any).data;
          setSummary(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          const status = err?.response?.status;
          const code = err?.response?.data?.code;
          if (status === 404 || code === 3000 || code === '3000' || code === 'ENTITY_NOT_FOUND') {
            setSummary(null); // Not finalized yet
          } else {
            setErrorMsg(err.response?.data?.message || 'Không thể tải tổng kết chăm sóc lúc này.');
          }
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [visible, sessionId]);

  const isFinalized = summary?.status === 'FINALIZED';

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
                <FileText size={22} className="text-primary" />
              </View>
              <View>
                <Text className="font-bold text-foreground text-lg">Tổng kết Y khoa</Text>
                <Text className="text-xs text-muted-foreground">Phiên tư vấn #{sessionId}</Text>
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
              <Text className="text-sm text-muted-foreground mt-3">Đang tải bản tổng kết...</Text>
            </View>
          ) : errorMsg ? (
            <View className="py-12 items-center">
              <AlertCircle size={36} className="text-red-500 mb-2" />
              <Text className="text-red-600 text-center text-sm">{errorMsg}</Text>
            </View>
          ) : !summary || !isFinalized ? (
            <View className="py-16 items-center px-4">
              <HeartPulse size={48} className="text-muted-foreground/30 mb-3" />
              <Text className="font-semibold text-foreground text-base text-center">
                Bác sĩ chưa hoàn tất tổng kết
              </Text>
              <Text className="text-xs text-muted-foreground text-center mt-2 leading-relaxed max-w-xs">
                Bản tóm tắt lâm sàng và khuyến nghị chăm sóc sẽ hiển thị tại đây sau khi Bác sĩ phụ trách kết thúc đợt tư vấn.
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} className="py-4">
              {/* Status banner */}
              <View className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl mb-4 flex-row items-center gap-3">
                <CheckCircle size={20} color="#10b981" />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-emerald-800">
                    Bác sĩ đã hoàn tất tổng kết chuyên môn
                  </Text>
                  {summary.finalizedAt && (
                    <Text className="text-[11px] text-emerald-700 mt-0.5">
                      Ngày hoàn tất: {new Date(summary.finalizedAt).toLocaleDateString('vi-VN')}
                    </Text>
                  )}
                </View>
              </View>

              {/* Summary note */}
              {summary.summary && (
                <View className="bg-card border border-border p-4 rounded-2xl mb-3">
                  <Text className="text-xs font-bold text-primary mb-1">Tóm tắt quá trình theo dõi</Text>
                  <Text className="text-xs text-foreground leading-relaxed">{summary.summary}</Text>
                </View>
              )}

              {/* Observations */}
              {summary.observations && (
                <View className="bg-card border border-border p-4 rounded-2xl mb-3">
                  <Text className="text-xs font-bold text-primary mb-1">Đánh giá & Quan sát lâm sàng</Text>
                  <Text className="text-xs text-foreground leading-relaxed">{summary.observations}</Text>
                </View>
              )}

              {/* Recommendations */}
              {summary.recommendations && (
                <View className="bg-card border border-border p-4 rounded-2xl mb-3">
                  <Text className="text-xs font-bold text-primary mb-1">Khuyến nghị điều trị & lối sống</Text>
                  <Text className="text-xs text-foreground leading-relaxed">{summary.recommendations}</Text>
                </View>
              )}

              {/* Follow-up */}
              {summary.followUpRecommendation && (
                <View className="bg-card border border-border p-4 rounded-2xl mb-6">
                  <Text className="text-xs font-bold text-primary mb-1">Lời dặn & Hẹn tái khám</Text>
                  <Text className="text-xs text-foreground leading-relaxed">{summary.followUpRecommendation}</Text>
                </View>
              )}
            </ScrollView>
          )}

          {/* Close Action */}
          <View className="pt-3 border-t border-border">
            <Pressable
              onPress={handleClose}
              className="py-3.5 rounded-xl bg-primary items-center justify-center active:opacity-90"
            >
              <Text className="font-bold text-white text-sm">Đóng</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
