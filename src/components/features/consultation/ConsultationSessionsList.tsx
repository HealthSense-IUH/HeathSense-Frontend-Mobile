import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Calendar, FileText, MessageCircle, MessagesSquare, RefreshCw, User } from 'lucide-react-native';
import type { ConsultationSessionItem } from '@/types/consultation';
import { getConsultationStatusConfig, isQueueFlow } from '@/constants/consultation';
import { formatDateTime } from '@/utils/formatters';

interface Props {
  sessions: ConsultationSessionItem[];
  loading: boolean;
  onSelectSession: (session: ConsultationSessionItem) => void;
  onViewSummary?: (sessionId: string | number) => void;
  onOpenRenewal?: (session: ConsultationSessionItem) => void;
}

export function StatusPill({ status }: { status?: string | null }) {
  const { i18n } = useTranslation('consultation');
  void i18n.language; // đọc để re-render khi đổi ngôn ngữ (nhãn là getter i18n)
  const cfg = getConsultationStatusConfig(status);
  return (
    <View className="px-2.5 py-1 rounded-full border" style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}>
      <Text className="text-[11px] font-bold" style={{ color: cfg.text }}>{cfg.label}</Text>
    </View>
  );
}

/** Danh sách phiên tư vấn của tôi (giống web SessionsPanel cho hội viên). */
export function ConsultationSessionsList({ sessions, loading, onSelectSession, onViewSummary, onOpenRenewal }: Props) {
  const { t } = useTranslation('consultation');
  const activeSession = sessions.find((s) => s.status === 'ACTIVE');

  if (loading && sessions.length === 0) {
    return (
      <View className="py-12 items-center">
        <ActivityIndicator color="#0D6EFD" />
        <Text className="text-xs text-muted-foreground mt-2">{t('sessionsPanel.loading')}</Text>
      </View>
    );
  }

  return (
    <View className="pb-5" style={{ gap: 12 }}>
      <View>
        <Text className="text-base font-bold text-foreground">{t('sessionsPanel.titleMember')}</Text>
        <Text className="text-xs text-muted-foreground">{t('sessionsPanel.descriptionMember')}</Text>
      </View>

      {activeSession ? (
        <View className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10" style={{ gap: 10 }}>
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <View className="h-3 w-3 rounded-full bg-emerald-500" />
            <Text className="font-semibold text-emerald-950 text-sm flex-1">{t('sessionsPanel.activeBanner.title')}</Text>
          </View>
          <Text className="text-xs text-muted-foreground">
            {t('sessionsPanel.activeBanner.doctor')} <Text className="font-medium text-foreground">{activeSession.doctorDisplayName || `#${activeSession.doctorId}`}</Text> •{' '}
            {t('sessionsPanel.activeBanner.sessionId', { id: activeSession.id })}
            {activeSession.lastMessagePreview ? (
              <Text className="italic"> • {t('sessionsPanel.activeBanner.latestMessage', { message: activeSession.lastMessagePreview })}</Text>
            ) : null}
          </Text>
          <Pressable onPress={() => onSelectSession(activeSession)} className="self-start h-9 px-4 rounded-xl bg-emerald-600 flex-row items-center active:opacity-90" style={{ gap: 6 }}>
            <MessagesSquare size={14} color="#FFFFFF" />
            <Text className="text-white text-xs font-bold">{t('sessionsPanel.activeBanner.enterNow')}</Text>
          </Pressable>
        </View>
      ) : null}

      {sessions.length === 0 ? (
        <View className="items-center justify-center pt-10">
          <MessageCircle size={36} color="#CBD5E1" />
          <Text className="text-muted-foreground text-sm mt-2">{t('sessionsPanel.empty')}</Text>
        </View>
      ) : (
        sessions.map((item) => {
          const doctorName = item.doctorDisplayName || t('workspace.doctorFallback', { id: item.doctorId });
          const isActive = item.status === 'ACTIVE';
          const canRenew = !isQueueFlow(item.flowType) && (item.status === 'ACTIVE' || item.status === 'COMPLETED');
          const canSummary = item.status === 'COMPLETED' || item.status === 'CANCELLED';
          return (
            <View key={String(item.id)} className="bg-card border border-border rounded-2xl p-4 shadow-xs" style={{ gap: 10 }}>
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center flex-1" style={{ gap: 10 }}>
                  <View className="h-9 w-9 rounded-full bg-primary/10 items-center justify-center">
                    <User size={18} color="#0D6EFD" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-foreground text-sm" numberOfLines={1}>{doctorName}</Text>
                    <Text className="text-[11px] text-muted-foreground">{t('workspace.sessionTitle', { id: item.id })}</Text>
                  </View>
                </View>
                <StatusPill status={item.status} />
              </View>

              <View style={{ gap: 4 }}>
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Calendar size={12} color="#64748B" />
                  <Text className="text-muted-foreground text-[11px]">
                    {t('sessionsPanel.table.createdAt')}: {formatDateTime(item.createdAt)} • {t('workspace.endsAt', { date: formatDateTime(item.endsAt) })}
                  </Text>
                </View>
                <View className="bg-muted/30 p-2.5 rounded-xl">
                  <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                    {t('sessionsPanel.table.lastMessage')}: {item.lastMessagePreview || t('sessionsPanel.noMessages')}
                  </Text>
                </View>
              </View>

              <View className="flex-row flex-wrap justify-end pt-2 border-t border-border/70" style={{ gap: 8 }}>
                {canSummary && onViewSummary ? (
                  <Pressable onPress={() => onViewSummary(item.id)} className="px-3 py-2 rounded-xl bg-muted active:opacity-75 flex-row items-center" style={{ gap: 6 }}>
                    <FileText size={14} color="#0F172A" />
                    <Text className="text-foreground text-xs font-semibold">{t('sessionsPanel.actions.viewSummary')}</Text>
                  </Pressable>
                ) : null}
                {canRenew && onOpenRenewal ? (
                  <Pressable onPress={() => onOpenRenewal(item)} className="px-3 py-2 rounded-xl border border-primary/30 bg-primary/5 active:opacity-75 flex-row items-center" style={{ gap: 6 }}>
                    <RefreshCw size={14} color="#0D6EFD" />
                    <Text className="text-primary text-xs font-bold">{t('sessionsPanel.actions.renew')}</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => onSelectSession(item)}
                  className={`px-4 py-2 rounded-xl flex-row items-center active:opacity-90 ${isActive ? 'bg-primary' : 'bg-muted'}`}
                  style={{ gap: 6 }}
                >
                  <MessageCircle size={14} color={isActive ? '#ffffff' : '#64748b'} />
                  <Text className={`text-xs font-bold ${isActive ? 'text-white' : 'text-muted-foreground'}`}>
                    {isActive ? t('sessionsPanel.actions.enterRoom') : t('sessionsPanel.actions.viewMessages')}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}
