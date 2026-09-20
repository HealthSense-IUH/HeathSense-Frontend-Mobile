import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConsultationsLogic } from '@/hooks/useConsultationsLogic';
import {
  ChevronLeft,
  Send,
  User,
  Share2,
  FileText,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react-native';
import { ShareHealthRecordModal } from '@/components/features/consultation/ShareHealthRecordModal';
import { MemberFinalSummaryModal } from '@/components/features/consultation/MemberFinalSummaryModal';
import { RenewalModal } from '@/components/features/consultation/RenewalModal';
import { getStoredUser } from '@/services/authentication';

export default function ChatScreen() {
  const { sessionId } = useLocalSearchParams();
  const rawSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId;
  const activeSessionId = rawSessionId && rawSessionId !== 'undefined' ? String(rawSessionId) : undefined;
  const insets = useSafeAreaInsets();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [hasAgreedExtension, setHasAgreedExtension] = useState(false);
  const [isExtensionDismissed, setIsExtensionDismissed] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    getStoredUser().then((user) => {
      if (user) setCurrentUser(user);
    });
  }, []);

  const {
    sessions,
    selectedSession,
    setSelectedSession,
    messages,
    messageDraft,
    setMessageDraft,
    socketStatus,
    handleSendMessage,
    handleShareHealthRecord,
    handleRequestRenewal,
    handleAcceptRenewalAgreement,
    handleInitiateRenewalPayment,
    handleCancelRenewal,
    healthRecords,
    actionLoading,
    loading,
  } = useConsultationsLogic(activeSessionId);

  useEffect(() => {
    if (!activeSessionId) return;
    if (!selectedSession && sessions.length > 0) {
      const found = sessions.find((s) => String(s.id) === String(activeSessionId));
      if (found) {
        setSelectedSession(found);
      }
    }
  }, [activeSessionId, sessions, selectedSession, setSelectedSession]);

  const currentSession =
    selectedSession || sessions.find((s) => String(s.id) === String(activeSessionId));
  const isSessionLoading = !currentSession && loading;
  const doctorName =
    currentSession?.doctorDisplayName ||
    (currentSession?.doctorId ? `Bác sĩ chuyên khoa #${currentSession.doctorId}` : 'Bác sĩ chuyên khoa');

  const endsAtMs = currentSession?.endsAt ? new Date(currentSession.endsAt).getTime() : null;
  const isExpired = endsAtMs ? endsAtMs <= currentTime : false;
  const isActive = Boolean(currentSession?.status === 'ACTIVE' && !isExpired);
  const canChat = (isActive || hasAgreedExtension) && !isSessionLoading;

  // Extension/Continuation calculations (5 minutes grace period after 15 mins session end)
  const elapsedSinceEnd = endsAtMs && isExpired ? Math.floor((currentTime - endsAtMs) / 1000) : 0;
  const remainingGraceSeconds = Math.max(0, 300 - elapsedSinceEnd);
  const showContinuationBanner =
    !isExtensionDismissed &&
    currentSession &&
    currentSession.status === 'ACTIVE' &&
    (isExpired || hasAgreedExtension);

  const formatCountdown = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMine =
      (currentUser?.userId && String(item.senderId) === String(currentUser.userId)) ||
      String(item.senderRole).toUpperCase() === 'MEMBER';
    const isSystem = String(item.senderRole).toUpperCase() === 'SYSTEM';

    if (isSystem) {
      return (
        <View className="items-center my-3 px-4">
          <View className="bg-muted/70 px-3.5 py-1.5 rounded-full">
            <Text className="text-[11px] text-muted-foreground text-center font-medium">
              {item.content}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View className={`mb-3 flex-row ${isMine ? 'justify-end' : 'justify-start'}`}>
        {!isMine && (
          <View className="h-7 w-7 rounded-full bg-primary/10 items-center justify-center mr-2 self-end mb-1">
            <User size={14} className="text-primary" />
          </View>
        )}

        <View
          className={`max-w-[80%] p-3.5 rounded-2xl shadow-2xs ${
            isMine
              ? 'bg-primary rounded-br-xs'
              : 'bg-card border border-border rounded-bl-xs'
          }`}
        >
          {!isMine && (
            <Text className="text-[11px] font-bold text-primary mb-1">
              {item.senderName || doctorName}
            </Text>
          )}

          <Text
            className={`text-sm leading-relaxed ${
              isMine ? 'text-white' : 'text-foreground'
            }`}
          >
            {item.content}
          </Text>

          {item.attachmentUrl && (
            <View className="mt-2 pt-2 border-t border-white/20">
              <Text
                className={`text-xs underline ${
                  isMine ? 'text-white/90' : 'text-primary'
                }`}
              >
                {item.attachmentName || 'Tệp đính kèm y khoa'}
              </Text>
            </View>
          )}

          <Text
            className={`text-[10px] mt-1 text-right ${
              isMine ? 'text-white/70' : 'text-muted-foreground'
            }`}
          >
            {item.createdAt
              ? new Date(item.createdAt).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : ''}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Telehealth Room Header */}
      <View
        className="bg-card border-b border-border px-4 pb-3 flex-row items-center justify-between shadow-xs z-10"
        style={{ paddingTop: insets.top + 6 }}
      >
        <View className="flex-row items-center gap-2 flex-1 pr-2">
          <Pressable
            onPress={() => router.back()}
            className="h-9 w-9 rounded-full bg-muted items-center justify-center active:opacity-70"
          >
            <ChevronLeft size={22} className="text-foreground" />
          </Pressable>

          <View className="h-9 w-9 rounded-full bg-primary/10 items-center justify-center">
            <User size={18} className="text-primary" />
          </View>

          <View className="flex-1">
            <Text className="font-bold text-foreground text-sm" numberOfLines={1}>
              {doctorName}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <View
                className={`h-1.5 w-1.5 rounded-full ${
                  isSessionLoading || socketStatus === 'connecting'
                    ? 'bg-amber-400'
                    : socketStatus === 'error'
                    ? 'bg-rose-500'
                    : isActive
                    ? 'bg-emerald-500'
                    : 'bg-muted-foreground'
                }`}
              />
              <Text className="text-[10px] text-muted-foreground font-medium">
                {isSessionLoading
                  ? 'Đang tải...'
                  : socketStatus === 'connecting'
                  ? 'Đang kết nối...'
                  : socketStatus === 'error'
                  ? 'Mất kết nối realtime'
                  : isActive
                  ? 'Đang trực tuyến'
                  : 'Đã kết thúc'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Action Icons */}
        <View className="flex-row items-center gap-1">
          {isActive && (
            <Pressable
              onPress={() => setIsShareModalOpen(true)}
              className="p-2 rounded-xl bg-muted active:opacity-70"
              accessibilityLabel="Chia sẻ hồ sơ đo"
            >
              <Share2 size={18} className="text-primary" />
            </Pressable>
          )}

          <Pressable
            onPress={() => setIsSummaryModalOpen(true)}
            className="p-2 rounded-xl bg-muted active:opacity-70"
            accessibilityLabel="Tổng kết y khoa"
          >
            <FileText size={18} className="text-foreground" />
          </Pressable>

          {isActive && (
            <Pressable
              onPress={() => setIsRenewalModalOpen(true)}
              className="p-2 rounded-xl bg-muted active:opacity-70"
              accessibilityLabel="Gia hạn phiên"
            >
              <RefreshCw size={18} className="text-foreground" />
            </Pressable>
          )}
        </View>
      </View>

      {/* 15-Minute Session Continuation / Extension Banner */}
      {showContinuationBanner && (
        <View className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 px-4 py-3">
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-row items-start gap-2.5 flex-1 pr-1">
              <View className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/70 items-center justify-center mt-0.5">
                <AlertCircle size={15} color="#d97706" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-amber-950 dark:text-amber-100">
                  Phiên tư vấn hiện tại đã kết thúc (15 phút).
                </Text>
                <Text className="text-[11px] text-amber-800 dark:text-amber-200/80 mt-0.5 leading-tight">
                  Bạn có muốn tiếp tục thêm 15 phút không? Cả hai bên cần đồng ý để tiếp tục phiên.
                </Text>
              </View>
            </View>

            {/* Countdown Badge */}
            <View className="flex-row items-center gap-1 bg-amber-100/90 dark:bg-amber-900/60 px-2.5 py-1 rounded-full border border-amber-300/60">
              <Clock size={12} color="#b45309" />
              <Text className="text-[11px] font-bold text-amber-900 dark:text-amber-100 font-mono">
                {formatCountdown(remainingGraceSeconds)}
              </Text>
            </View>
          </View>

          {/* User Confirmation Status */}
          {hasAgreedExtension ? (
            <View className="flex-row items-center gap-2 mt-2.5 pt-2.5 border-t border-amber-200/70 dark:border-amber-800/40">
              <CheckCircle2 size={16} color="#059669" />
              <Text className="text-xs font-medium text-emerald-800 dark:text-emerald-300 flex-1">
                Bạn đã chọn tiếp tục. Đang chờ người còn lại xác nhận...
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center justify-end gap-2 mt-2.5 pt-2.5 border-t border-amber-200/70 dark:border-amber-800/40">
              <Pressable
                onPress={() => setIsExtensionDismissed(true)}
                className="px-3 py-1.5 rounded-lg border border-border bg-card active:opacity-70"
              >
                <Text className="text-xs font-medium text-muted-foreground">Kết thúc</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  setHasAgreedExtension(true);
                  if (currentSession?.id) {
                    try {
                      await handleRequestRenewal(currentSession.id);
                    } catch (err) {
                      console.warn('Continuation request error:', err);
                    }
                  }
                }}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 active:opacity-90 flex-row items-center gap-1"
              >
                <CheckCircle2 size={13} color="#ffffff" />
                <Text className="text-xs font-bold text-white">Đồng ý tiếp tục</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Messages List */}
      <FlatList
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={{ padding: 16, flexGrow: 1, justifyContent: 'flex-end' }}
        ListEmptyComponent={
          isSessionLoading ? (
            <View className="flex-1 items-center justify-center pt-20">
              <ActivityIndicator size="large" color="#0057cd" />
              <Text className="text-muted-foreground text-xs mt-3">
                Đang tải tin nhắn phòng tư vấn...
              </Text>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center pt-20">
              <User size={40} className="text-muted-foreground/30 mb-2" />
              <Text className="text-foreground font-semibold text-sm">
                Phòng tư vấn trực tiếp 1-1
              </Text>
              <Text className="text-muted-foreground text-xs text-center mt-1 max-w-xs">
                Mọi thông tin tư vấn sức khỏe đều được bảo mật. Bắt đầu trao đổi triệu chứng với bác sĩ của bạn.
              </Text>
            </View>
          )
        }
      />

      {/* Inactive Session Notice Banner (When continuation banner is not active and session expired) */}
      {!isSessionLoading && !canChat && currentSession && !showContinuationBanner && (
        <View className="px-4 py-2.5 bg-amber-500/10 border-t border-amber-500/20 flex-row items-center justify-between">
          <Text className="text-xs text-amber-700 dark:text-amber-300 flex-1 font-medium">
            {isExpired
              ? 'Phiên tư vấn đã hết hạn hỗ trợ. Bạn chỉ có thể xem lại lịch sử.'
              : currentSession?.status === 'COMPLETED'
              ? 'Phiên tư vấn đã hoàn tất. Bạn chỉ có thể xem lại lịch sử.'
              : 'Phiên tư vấn hiện không hoạt động.'}
          </Text>
          <Pressable
            onPress={() => setIsRenewalModalOpen(true)}
            className="ml-2 px-3 py-1.5 rounded-xl bg-amber-600 active:opacity-80"
          >
            <Text className="text-xs font-bold text-white">Gia hạn</Text>
          </Pressable>
        </View>
      )}

      {/* Message Input Composer */}
      <View
        className="flex-row items-center px-4 py-3 border-t border-border bg-card"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <TextInput
          className="flex-1 bg-muted rounded-2xl px-4 py-3 text-foreground mr-2.5 max-h-28 text-sm"
          placeholder={
            isSessionLoading
              ? "Đang tải phòng chat..."
              : canChat
              ? "Nhập tin nhắn với bác sĩ..."
              : isExpired
              ? "Phiên tư vấn đã hết hạn hỗ trợ"
              : "Phiên tư vấn đã kết thúc"
          }
          placeholderTextColor="#94a3b8"
          editable={canChat}
          value={messageDraft}
          onChangeText={setMessageDraft}
          multiline
        />

        <Pressable
          onPress={handleSendMessage}
          disabled={!messageDraft.trim() || actionLoading || !canChat}
          className={`h-11 w-11 rounded-2xl items-center justify-center shadow-2xs ${
            !messageDraft.trim() || actionLoading || !canChat
              ? 'bg-muted'
              : 'bg-primary active:opacity-90'
          }`}
        >
          {actionLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Send size={18} color="#ffffff" />
          )}
        </Pressable>
      </View>

      {/* Embedded Modals */}
      <ShareHealthRecordModal
        visible={isShareModalOpen}
        sessionId={activeSessionId || (selectedSession?.id ? String(selectedSession.id) : null)}
        healthRecords={healthRecords}
        onClose={() => setIsShareModalOpen(false)}
        onShare={handleShareHealthRecord}
      />

      <MemberFinalSummaryModal
        visible={isSummaryModalOpen}
        sessionId={activeSessionId || (selectedSession?.id ? String(selectedSession.id) : null)}
        onClose={() => setIsSummaryModalOpen(false)}
      />

      <RenewalModal
        visible={isRenewalModalOpen}
        session={currentSession || null}
        onClose={() => setIsRenewalModalOpen(false)}
        onRequestRenewal={handleRequestRenewal}
        onAcceptRenewalAgreement={handleAcceptRenewalAgreement}
        onInitiateRenewalPayment={handleInitiateRenewalPayment}
        onCancelRenewal={handleCancelRenewal}
      />
    </KeyboardAvoidingView>
  );
}
