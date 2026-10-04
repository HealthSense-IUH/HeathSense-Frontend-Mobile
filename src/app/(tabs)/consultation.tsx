import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle, RefreshCw, X } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useConsultationsLogic, hasActiveQueue } from '@/hooks/useConsultationsLogic';
import { MemberQueuePanel } from '@/components/features/consultation/MemberQueuePanel';
import { ConsultationSessionsList } from '@/components/features/consultation/ConsultationSessionsList';
import { MemberCreditsPanel } from '@/components/features/consultation/MemberCreditsPanel';
import { MemberFinalSummaryModal } from '@/components/features/consultation/MemberFinalSummaryModal';
import { RenewalModal } from '@/components/features/consultation/RenewalModal';
import type { ConsultationSessionItem } from '@/types/consultation';

type TabKey = 'queue' | 'sessions' | 'credits';

/** Tab Tư vấn — giống trang Tư vấn & Chăm sóc của web: Hàng đợi / Phiên tư vấn / Lượt tư vấn. */
export default function ConsultationScreen() {
  const { t } = useTranslation('consultation');
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('queue');
  const [finalSummarySessionId, setFinalSummarySessionId] = useState<string | number | null>(null);
  const [renewalSession, setRenewalSession] = useState<ConsultationSessionItem | null>(null);
  const firstFocusRef = useRef(true);

  const {
    alert,
    setAlert,
    loading,
    actionLoading,
    requests,
    sessions,
    currentQueueState,
    insufficientCredits,
    loadData,
    fetchCurrentQueueState,
    refreshWallet,
    handleConfirmQueue,
    handleCancelQueue,
    handleRequestRenewal,
    handleAcceptRenewalAgreement,
    handleInitiateRenewalPayment,
    handleCancelRenewal,
  } = useConsultationsLogic();

  // Mở đúng tab khi được điều hướng tới (vd. "Mua thêm lượt" từ màn đăng ký)
  useEffect(() => {
    const tab = params.tab;
    if (tab === 'credits' || tab === 'sessions' || tab === 'queue') queueMicrotask(() => setActiveTab(tab));
  }, [params.tab]);

  // Quay lại tab (sau khi gửi yêu cầu / chat xong) thì tải lại ngầm để không lệch trạng thái
  useFocusEffect(
    useCallback(() => {
      if (firstFocusRef.current) {
        firstFocusRef.current = false;
        return;
      }
      void loadData(true);
    }, [loadData])
  );

  const openSession = (sessionId: string | number) => router.push(`/consultation/chat/${sessionId}` as any);
  const queueActive = hasActiveQueue(currentQueueState);

  const tabs: { key: TabKey; label: string; badge?: React.ReactNode }[] = [
    {
      key: 'queue',
      label: t('page.tabs.queueShort'),
      badge: queueActive ? (
        <View className="px-1.5 py-0.5 rounded-full bg-amber-100">
          <Text className="text-[10px] font-bold text-amber-700">{t('page.tabs.waitingBadge')}</Text>
        </View>
      ) : null,
    },
    {
      key: 'sessions',
      label: t('page.tabs.sessions'),
      badge:
        sessions.length > 0 ? (
          <View className="px-1.5 py-0.5 rounded-full bg-muted-foreground/15">
            <Text className="text-[10px] font-bold text-foreground">{sessions.length}</Text>
          </View>
        ) : null,
    },
    { key: 'credits', label: t('page.tabs.credits') },
  ];

  return (
    <ScreenWrapper
      title={t('page.title')}
      description={t('page.description')}
      withBottomNav
      headerRight={
        <Pressable
          onPress={() => void loadData()}
          disabled={loading}
          className="h-10 w-10 rounded-full bg-white border border-slate-200/80 items-center justify-center active:opacity-80"
          aria-label={t('common:actions.refresh')}
        >
          {loading ? <ActivityIndicator size="small" color="#0D6EFD" /> : <RefreshCw size={18} color="#64748B" />}
        </Pressable>
      }
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void loadData()} colors={['#0057cd']} />}
    >
      <View className="px-5 mt-2 flex-1">
        {alert ? (
          <View
            className={`p-3.5 rounded-2xl mb-4 flex-row items-center justify-between shadow-xs ${
              alert.type === 'error' ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'
            }`}
          >
            <View className="flex-row items-center gap-2.5 flex-1 pr-2">
              {alert.type === 'error' ? <AlertCircle size={18} color="#dc2626" /> : <CheckCircle size={18} color="#16a34a" />}
              <Text className={`text-xs font-semibold flex-1 ${alert.type === 'error' ? 'text-red-800' : 'text-emerald-800'}`}>{alert.text}</Text>
            </View>
            <Pressable onPress={() => setAlert(null)} className="p-1 active:opacity-60" aria-label={t('page.dismissAlert')}>
              <X size={16} color={alert.type === 'error' ? '#dc2626' : '#16a34a'} />
            </Pressable>
          </View>
        ) : null}

        <View className="flex-row bg-muted/70 p-1 rounded-2xl w-full mb-4">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`flex-1 items-center justify-center py-2.5 rounded-xl ${active ? 'bg-background shadow-xs' : ''}`}
              >
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Text className={`text-xs font-bold ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{tab.label}</Text>
                  {tab.badge}
                </View>
              </Pressable>
            );
          })}
        </View>

        {activeTab === 'queue' ? (
          loading && !currentQueueState && sessions.length === 0 ? (
            <View className="py-16 items-center">
              <ActivityIndicator size="large" color="#0D6EFD" />
              <Text className="text-xs text-muted-foreground mt-3">{t('page.loadingQueue')}</Text>
            </View>
          ) : (
            <MemberQueuePanel
              queueState={currentQueueState}
              latestRequest={requests[0] ?? null}
              loading={loading}
              actionLoading={actionLoading}
              insufficientCredits={insufficientCredits}
              onConfirm={async (offerId) => {
                const session = await handleConfirmQueue(offerId);
                if (session?.id) openSession(session.id);
              }}
              onCancel={(requestId) => void handleCancelQueue(requestId)}
              onRefresh={() => void fetchCurrentQueueState()}
              onOpenSession={openSession}
              onRegisterNew={() => router.push('/consultation/create-request' as any)}
              onBuyCredits={() => setActiveTab('credits')}
            />
          )
        ) : null}

        {activeTab === 'sessions' ? (
          <ConsultationSessionsList
            sessions={sessions}
            loading={loading}
            onSelectSession={(session) => openSession(session.id)}
            onViewSummary={(id) => setFinalSummarySessionId(id)}
            onOpenRenewal={(session) => setRenewalSession(session)}
          />
        ) : null}

        {activeTab === 'credits' ? <MemberCreditsPanel onWalletChanged={() => void refreshWallet()} /> : null}
      </View>

      <MemberFinalSummaryModal visible={!!finalSummarySessionId} sessionId={finalSummarySessionId} onClose={() => setFinalSummarySessionId(null)} />

      <RenewalModal
        visible={!!renewalSession}
        session={renewalSession}
        onClose={() => setRenewalSession(null)}
        onRequestRenewal={handleRequestRenewal}
        onAcceptRenewalAgreement={handleAcceptRenewalAgreement}
        onInitiateRenewalPayment={handleInitiateRenewalPayment}
        onCancelRenewal={handleCancelRenewal}
      />
    </ScreenWrapper>
  );
}
