import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ChevronLeft, FileText, RefreshCw, Send, Share2, User, X } from 'lucide-react-native';
import { useConsultationChat } from '@/hooks/useConsultationChat';
import { useConsultationsLogic } from '@/hooks/useConsultationsLogic';
import { ShareHealthRecordModal } from '@/components/features/consultation/ShareHealthRecordModal';
import { MemberFinalSummaryModal } from '@/components/features/consultation/MemberFinalSummaryModal';
import { RenewalModal } from '@/components/features/consultation/RenewalModal';
import { SessionContinuationBanner } from '@/components/features/consultation/SessionContinuationBanner';
import { StatusPill } from '@/components/features/consultation/ConsultationSessionsList';
import { isQueueFlow } from '@/constants/consultation';
import { getStoredUser } from '@/services/authentication';
import { currentIntlLocale } from '@/i18n';
import { formatDateTime } from '@/utils/formatters';
import type { ConsultationMessageItem } from '@/types/consultation';

/** Phòng chat phiên tư vấn (giống web workspace: khối 15 phút, chia sẻ hồ sơ, tổng kết y khoa). */
export default function ChatScreen() {
  const { t } = useTranslation('consultation');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const activeSessionId = sessionId && sessionId !== 'undefined' ? String(sessionId) : undefined;

  const [draft, setDraft] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [renewalOpen, setRenewalOpen] = useState(false);

  useEffect(() => {
    void getStoredUser().then((user) => user?.userId && setCurrentUserId(String(user.userId)));
  }, []);

  const chat = useConsultationChat(activeSessionId);
  const { session, messages, loadingSession, hasMore, loadingMore, sending, socketStatus, outsideSupportHours } = chat;
  // Hồ sơ đo + thao tác gia hạn (phiên luồng gói cũ) dùng chung logic với tab Tư vấn
  const logic = useConsultationsLogic();

  const isActive = session?.status === 'ACTIVE';
  const queueFlow = isQueueFlow(session?.flowType);
  const doctorName =
    session?.doctorDisplayName || (session?.doctorId ? t('workspace.doctorFallback', { id: session.doctorId }) : t('workspace.doctorInCharge'));

  const readOnlyReason = !session
    ? null
    : session.status === 'COMPLETED'
      ? t('workspace.readOnly.completed')
      : session.status === 'CANCELLED'
        ? t('workspace.readOnly.cancelled')
        : session.status === 'SCHEDULED'
          ? t('workspace.readOnly.notStarted')
          : !isActive
            ? t('chat.composer.sessionInactive')
            : outsideSupportHours
              ? t('workspace.readOnly.outsideHours')
              : null;
  const canChat = Boolean(session) && isActive && !outsideSupportHours;

  const connectionLabel = loadingSession
    ? t('common:state.loading')
    : socketStatus === 'connecting'
      ? t('chat.header.connecting')
      : socketStatus === 'error'
        ? t('chat.header.realtimeLost')
        : isActive
          ? t('chat.header.online')
          : t('chat.header.ended');

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    const ok = await chat.sendMessage(text);
    if (!ok) setDraft(text);
  };

  const renderMessage = ({ item }: { item: ConsultationMessageItem }) => {
    const role = String(item.senderRole ?? '').toUpperCase();
    const isSystem = role === 'SYSTEM';
    const isMine = (currentUserId && String(item.senderId) === currentUserId) || role === 'MEMBER';
    if (isSystem) {
      return (
        <View className="items-center my-3 px-4">
          <View className="bg-muted/70 px-3.5 py-1.5 rounded-full">
            <Text className="text-[11px] text-muted-foreground text-center font-medium">{item.content}</Text>
          </View>
        </View>
      );
    }
    return (
      <View className={`mb-3 flex-row ${isMine ? 'justify-end' : 'justify-start'}`}>
        {!isMine ? (
          <View className="h-7 w-7 rounded-full bg-primary/10 items-center justify-center mr-2 self-end mb-1">
            <User size={14} color="#0D6EFD" />
          </View>
        ) : null}
        <View className={`max-w-[80%] p-3.5 rounded-2xl ${isMine ? 'bg-primary rounded-br-xs' : 'bg-card border border-border rounded-bl-xs'}`}>
          {!isMine ? <Text className="text-[11px] font-bold text-primary mb-1">{doctorName}</Text> : null}
          {item.content ? <Text className={`text-sm leading-relaxed ${isMine ? 'text-white' : 'text-foreground'}`}>{item.content}</Text> : null}
          {item.attachmentUrl ? (
            <Pressable onPress={() => void Linking.openURL(item.attachmentUrl as string)} className="mt-2 pt-2 border-t border-white/20 active:opacity-70">
              <Text className={`text-xs underline ${isMine ? 'text-white/90' : 'text-primary'}`}>{item.attachmentName || t('chat.bubble.viewAttachment')}</Text>
            </Pressable>
          ) : null}
          <Text className={`text-[10px] mt-1 text-right ${isMine ? 'text-white/70' : 'text-muted-foreground'}`}>
            {item.createdAt ? new Date(item.createdAt).toLocaleTimeString(currentIntlLocale(), { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Đầu phòng */}
      <View className="bg-card border-b border-border px-4 pb-3 flex-row items-center justify-between z-10" style={{ paddingTop: insets.top + 6 }}>
        <View className="flex-row items-center flex-1 pr-2" style={{ gap: 8 }}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/consultation' as any))}
            className="h-9 w-9 rounded-full bg-muted items-center justify-center active:opacity-70"
            aria-label={t('common:actions.back')}
          >
            <ChevronLeft size={22} color="#0F172A" />
          </Pressable>
          <View className="h-9 w-9 rounded-full bg-primary/10 items-center justify-center">
            <User size={18} color="#0D6EFD" />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-foreground text-sm" numberOfLines={1}>{doctorName}</Text>
            <View className="flex-row items-center mt-0.5" style={{ gap: 6 }}>
              <View
                className={`h-1.5 w-1.5 rounded-full ${
                  loadingSession || socketStatus === 'connecting' ? 'bg-amber-400' : socketStatus === 'error' ? 'bg-rose-500' : isActive ? 'bg-emerald-500' : 'bg-muted-foreground'
                }`}
              />
              <Text className="text-[10px] text-muted-foreground font-medium">
                {connectionLabel}
                {session ? ` • ${t('chat.header.sessionNumber', { id: session.id })}` : ''}
              </Text>
            </View>
          </View>
        </View>
        <View className="flex-row items-center" style={{ gap: 4 }}>
          {isActive ? (
            <Pressable onPress={() => setShareOpen(true)} className="p-2 rounded-xl bg-muted active:opacity-70" accessibilityLabel={t('workspace.actions.shareRecord')}>
              <Share2 size={18} color="#0D6EFD" />
            </Pressable>
          ) : null}
          {session && session.status !== 'SCHEDULED' ? (
            <Pressable onPress={() => setSummaryOpen(true)} className="p-2 rounded-xl bg-muted active:opacity-70" accessibilityLabel={t('workspace.actions.medicalSummary')}>
              <FileText size={18} color="#0F172A" />
            </Pressable>
          ) : null}
          {isActive && !queueFlow ? (
            <Pressable onPress={() => setRenewalOpen(true)} className="p-2 rounded-xl bg-muted active:opacity-70" accessibilityLabel={t('workspace.actions.renew')}>
              <RefreshCw size={18} color="#0F172A" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {session ? (
        <View className="px-4 py-2 bg-card border-b border-border flex-row items-center justify-between">
          <StatusPill status={session.status} />
          <Text className="text-[11px] text-muted-foreground">{t('workspace.endsAt', { date: formatDateTime(session.endsAt) })}</Text>
        </View>
      ) : null}

      {session ? <SessionContinuationBanner session={session} onSessionRefreshed={() => void chat.refreshSession()} /> : null}

      {chat.alert ? (
        <View className={`mx-4 mt-2 p-3 rounded-xl flex-row items-center ${chat.alert.type === 'error' ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`} style={{ gap: 8 }}>
          <AlertCircle size={16} color={chat.alert.type === 'error' ? '#dc2626' : '#16a34a'} />
          <Text className={`text-xs font-semibold flex-1 ${chat.alert.type === 'error' ? 'text-red-800' : 'text-emerald-800'}`}>{chat.alert.text}</Text>
          <Pressable onPress={() => chat.setAlert(null)} hitSlop={6} accessibilityLabel={t('page.dismissAlert')}>
            <X size={14} color="#64748B" />
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={{ padding: 16, flexGrow: 1, justifyContent: 'flex-end' }}
        ListFooterComponent={
          hasMore ? (
            <Pressable onPress={() => void chat.loadMore()} disabled={loadingMore} className="self-center my-2 px-3 py-1.5 rounded-full bg-muted active:opacity-70">
              {loadingMore ? <ActivityIndicator size="small" color="#0D6EFD" /> : <Text className="text-[11px] font-semibold text-muted-foreground">{t('chat.messageList.loadOlder')}</Text>}
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          loadingSession ? (
            <View className="flex-1 items-center justify-center pt-20">
              <ActivityIndicator size="large" color="#0057cd" />
              <Text className="text-muted-foreground text-xs mt-3">{t('workspace.loading')}</Text>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center pt-20 px-6">
              <User size={40} color="#CBD5E1" />
              <Text className="text-foreground font-semibold text-sm mt-2">{t('chat.messageList.empty')}</Text>
              <Text className="text-muted-foreground text-xs text-center mt-1">{t('chat.messageList.emptyHint')}</Text>
            </View>
          )
        }
      />

      {readOnlyReason ? (
        <View className="px-4 py-2.5 bg-amber-500/10 border-t border-amber-500/20 flex-row items-center justify-between" style={{ gap: 8 }}>
          <Text className="text-xs text-amber-800 flex-1 font-medium">{readOnlyReason}</Text>
          {session && !queueFlow && (session.status === 'ACTIVE' || session.status === 'COMPLETED') ? (
            <Pressable onPress={() => setRenewalOpen(true)} className="px-3 py-1.5 rounded-xl bg-amber-600 active:opacity-80">
              <Text className="text-xs font-bold text-white">{t('workspace.actions.renew')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View className="flex-row items-center px-4 py-3 border-t border-border bg-card" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <TextInput
          className="flex-1 bg-muted rounded-2xl px-4 py-3 text-foreground mr-2.5 max-h-28 text-sm"
          placeholder={loadingSession ? t('chat.composer.loading') : canChat ? t('chat.composer.placeholder') : t('chat.composer.readOnlyDefault')}
          placeholderTextColor="#94a3b8"
          editable={canChat}
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <Pressable
          onPress={handleSend}
          disabled={!draft.trim() || sending || !canChat}
          className={`h-11 w-11 rounded-2xl items-center justify-center ${!draft.trim() || sending || !canChat ? 'bg-muted' : 'bg-primary active:opacity-90'}`}
          accessibilityLabel={t('chat.composer.send')}
        >
          {sending ? <ActivityIndicator color="#ffffff" size="small" /> : <Send size={18} color="#ffffff" />}
        </Pressable>
      </View>

      <ShareHealthRecordModal
        visible={shareOpen}
        sessionId={activeSessionId ?? null}
        healthRecords={logic.healthRecords}
        onClose={() => setShareOpen(false)}
        onShare={logic.handleShareHealthRecord}
      />
      <MemberFinalSummaryModal visible={summaryOpen} sessionId={activeSessionId ?? null} onClose={() => setSummaryOpen(false)} />
      <RenewalModal
        visible={renewalOpen}
        session={session}
        onClose={() => setRenewalOpen(false)}
        onRequestRenewal={logic.handleRequestRenewal}
        onAcceptRenewalAgreement={logic.handleAcceptRenewalAgreement}
        onInitiateRenewalPayment={logic.handleInitiateRenewalPayment}
        onCancelRenewal={logic.handleCancelRenewal}
      />
    </KeyboardAvoidingView>
  );
}
