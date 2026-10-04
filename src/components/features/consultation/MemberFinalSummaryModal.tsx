import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { FileText, X, CheckCircle, AlertCircle, HeartPulse } from 'lucide-react-native';
import { consultationApi } from '@/services/consultation.service';
import i18n from '@/i18n';
import { formatShortDate } from '@/utils/formatters';
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
  const { t } = useTranslation('consultation');
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
            setErrorMsg(err.response?.data?.message || i18n.t('consultation:memberFinalSummaryDialog.errors.loadFailed'));
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
                <Text className="font-bold text-foreground text-lg">{t('workspace.actions.medicalSummary')}</Text>
                <Text className="text-xs text-muted-foreground">{t('workspace.sessionTitle', { id: sessionId })}</Text>
              </View>
            </View>
            <Pressable
              onPress={handleClose}
              className="h-8 w-8 rounded-full bg-muted items-center justify-center active:opacity-70"
              accessibilityLabel={t('common:actions.close')}
            >
              <X size={18} className="text-foreground" />
            </Pressable>
          </View>

          {/* Content */}
          {loading ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator size="large" color="#0057cd" />
              <Text className="text-sm text-muted-foreground mt-3">{t('memberFinalSummaryDialog.loading')}</Text>
            </View>
          ) : errorMsg ? (
            <View className="py-12 items-center">
              <AlertCircle size={36} className="text-red-500 mb-2" />
              <Text className="text-red-600 text-center text-sm">{errorMsg}</Text>
            </View>
          ) : !summary || !isFinalized ? (
            <View className="py-16 items-center px-4">
              <HeartPulse size={48} className="text-muted-foreground/30 mb-3" />
              <Text className="font-semibold text-foreground text-base text-center">{t('memberFinalSummaryDialog.pending.title')}</Text>
              <Text className="text-xs text-muted-foreground text-center mt-2 leading-relaxed max-w-xs">
                {t('memberFinalSummaryDialog.pending.memberDescription')}
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} className="py-4">
              {/* Status banner */}
              <View className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl mb-4 flex-row items-center gap-3">
                <CheckCircle size={20} color="#10b981" />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-emerald-800">{t('memberFinalSummaryDialog.finalized.title')}</Text>
                  {summary.finalizedAt && (
                    <Text className="text-[11px] text-emerald-700 mt-0.5">
                      {t('memberFinalSummaryDialog.finalized.date', { date: formatShortDate(summary.finalizedAt) })}
                    </Text>
                  )}
                </View>
              </View>

              {/* Summary note */}
              {summary.summary && (
                <View className="bg-card border border-border p-4 rounded-2xl mb-3">
                  <Text className="text-xs font-bold text-primary mb-1">{t('memberFinalSummaryDialog.sections.summary')}</Text>
                  <Text className="text-xs text-foreground leading-relaxed">{summary.summary}</Text>
                </View>
              )}

              {/* Observations */}
              {summary.observations && (
                <View className="bg-card border border-border p-4 rounded-2xl mb-3">
                  <Text className="text-xs font-bold text-primary mb-1">{t('memberFinalSummaryDialog.sections.observations')}</Text>
                  <Text className="text-xs text-foreground leading-relaxed">{summary.observations}</Text>
                </View>
              )}

              {/* Recommendations */}
              {summary.recommendations && (
                <View className="bg-card border border-border p-4 rounded-2xl mb-3">
                  <Text className="text-xs font-bold text-primary mb-1">{t('memberFinalSummaryDialog.sections.recommendations')}</Text>
                  <Text className="text-xs text-foreground leading-relaxed">{summary.recommendations}</Text>
                </View>
              )}

              {/* Follow-up */}
              {summary.followUpRecommendation && (
                <View className="bg-card border border-border p-4 rounded-2xl mb-6">
                  <Text className="text-xs font-bold text-primary mb-1">{t('memberFinalSummaryDialog.sections.followUp')}</Text>
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
              <Text className="font-bold text-white text-sm">{t('memberFinalSummaryDialog.close')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
