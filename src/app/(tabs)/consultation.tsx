import React, { useState } from 'react';
import { View, Text, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { safeRouter } from '@/utils/safeNavigation';
import { PlusCircle, AlertCircle, CheckCircle, X } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { useConsultationsLogic } from '@/hooks/useConsultationsLogic';
import { ConsultationRequestsList } from '@/components/features/consultation/ConsultationRequestsList';
import { ConsultationSessionsList } from '@/components/features/consultation/ConsultationSessionsList';
import { ConsultationRecordsTab } from '@/components/features/consultation/ConsultationRecordsTab';
import { CareAgreementModal } from '@/components/features/consultation/CareAgreementModal';
import { SubmitMoreInfoModal } from '@/components/features/consultation/SubmitMoreInfoModal';
import { MemberFinalSummaryModal } from '@/components/features/consultation/MemberFinalSummaryModal';
import { RenewalModal } from '@/components/features/consultation/RenewalModal';
import type { ConsultationRequestItem, ConsultationSessionItem } from '@/types/consultation';

export default function ConsultationScreen() {
  const [activeTab, setActiveTab] = useState<'requests' | 'sessions' | 'records'>('requests');
  
  // Modal states
  const [agreementRequestId, setAgreementRequestId] = useState<string | number | null>(null);
  const [moreInfoRequest, setMoreInfoRequest] = useState<ConsultationRequestItem | null>(null);
  const [finalSummarySessionId, setFinalSummarySessionId] = useState<string | number | null>(null);
  const [renewalSession, setRenewalSession] = useState<ConsultationSessionItem | null>(null);

  const {
    alert,
    setAlert,
    requests,
    sessions,
    healthRecords,
    loading,
    loadData,
    setSelectedSession,
    handleInitiatePayment,
    handleSubmitMoreInfo,
    handleCancelRequest,
    handleRequestRenewal,
    handleAcceptRenewalAgreement,
    handleInitiateRenewalPayment,
    handleCancelRenewal,
  } = useConsultationsLogic();

  const handleSelectSession = (session: ConsultationSessionItem) => {
    setSelectedSession(session);
    safeRouter.navigate(`/consultation/chat/${session.id}`);
  };

  return (
    <ScreenWrapper
      title="Tư vấn & Chăm sóc"
      description="Theo dõi và kết nối trực tiếp với bác sĩ chuyên khoa"
      withBottomNav={true}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} colors={['#0057cd']} />}
    >
      <Box className="px-5 mt-2 flex-1">
        {/* Global Feedback Banner */}
        {alert && (
          <View
            className={`p-3.5 rounded-2xl mb-4 flex-row items-center justify-between shadow-xs ${
              alert.type === 'error'
                ? 'bg-red-500/10 border border-red-500/20'
                : 'bg-emerald-500/10 border border-emerald-500/20'
            }`}
          >
            <View className="flex-row items-center gap-2.5 flex-1 pr-2">
              {alert.type === 'error' ? (
                <AlertCircle size={18} color="#dc2626" />
              ) : (
                <CheckCircle size={18} color="#16a34a" />
              )}
              <Text
                className={`text-xs font-semibold flex-1 ${
                  alert.type === 'error' ? 'text-red-800' : 'text-emerald-800'
                }`}
              >
                {alert.text}
              </Text>
            </View>
            <Pressable onPress={() => setAlert(null)} className="p-1 active:opacity-60">
              <X size={16} color={alert.type === 'error' ? '#dc2626' : '#16a34a'} />
            </Pressable>
          </View>
        )}

        {/* Primary CTA Button: Create Request */}
        <Pressable
          onPress={() => safeRouter.navigate('/consultation/create-request')}
          className="bg-primary rounded-2xl py-3.5 px-4 mb-4 flex-row justify-center items-center gap-2 shadow-xs active:opacity-90"
        >
          <PlusCircle size={20} color="#ffffff" />
          <Text className="text-white font-bold text-sm">Đăng ký tư vấn mới</Text>
        </Pressable>

        {/* Custom Segmented Tabs */}
        <HStack className="bg-muted/70 p-1 rounded-2xl w-full justify-between mb-4">
          <Pressable
            onPress={() => setActiveTab('requests')}
            className={`flex-1 items-center justify-center py-2.5 rounded-xl ${
              activeTab === 'requests' ? 'bg-background shadow-xs' : ''
            }`}
          >
            <View className="flex-row items-center gap-1.5">
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'requests' ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                Yêu cầu
              </Text>
              {requests.length > 0 && (
                <View className="px-1.5 py-0.5 rounded-full bg-primary/10">
                  <Text className="text-[10px] font-bold text-primary">{requests.length}</Text>
                </View>
              )}
            </View>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('sessions')}
            className={`flex-1 items-center justify-center py-2.5 rounded-xl ${
              activeTab === 'sessions' ? 'bg-background shadow-xs' : ''
            }`}
          >
            <View className="flex-row items-center gap-1.5">
              <Text
                className={`text-xs font-bold ${
                  activeTab === 'sessions' ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                Phiên khám
              </Text>
              {sessions.length > 0 && (
                <View className="px-1.5 py-0.5 rounded-full bg-muted-foreground/15">
                  <Text className="text-[10px] font-bold text-foreground">{sessions.length}</Text>
                </View>
              )}
            </View>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('records')}
            className={`flex-1 items-center justify-center py-2.5 rounded-xl ${
              activeTab === 'records' ? 'bg-background shadow-xs' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === 'records' ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Hồ sơ đo
            </Text>
          </Pressable>
        </HStack>

        {/* Tab Content */}
        <Box className="flex-1 w-full">
          {activeTab === 'requests' && (
            <ConsultationRequestsList
              requests={requests}
              loading={loading}
              onRefresh={loadData}
              onReviewAgreement={(req) => setAgreementRequestId(req.id)}
              onInitiatePayment={handleInitiatePayment}
              onSubmitMoreInfo={(req) => setMoreInfoRequest(req)}
              onCancelRequest={handleCancelRequest}
            />
          )}

          {activeTab === 'sessions' && (
            <ConsultationSessionsList
              sessions={sessions}
              loading={loading}
              onRefresh={loadData}
              onSelectSession={handleSelectSession}
              onViewSummary={(id) => setFinalSummarySessionId(id)}
              onOpenRenewal={(sess) => setRenewalSession(sess)}
            />
          )}

          {activeTab === 'records' && (
            <ConsultationRecordsTab
              healthRecords={healthRecords}
              loading={loading}
              onRefresh={loadData}
            />
          )}
        </Box>
      </Box>

      {/* Modals */}
      <CareAgreementModal
        visible={!!agreementRequestId}
        requestId={agreementRequestId}
        onClose={() => setAgreementRequestId(null)}
        onAccepted={() => {
          setAgreementRequestId(null);
          void loadData();
        }}
      />

      <SubmitMoreInfoModal
        visible={!!moreInfoRequest}
        request={moreInfoRequest}
        healthRecords={healthRecords}
        onClose={() => setMoreInfoRequest(null)}
        onSubmit={handleSubmitMoreInfo}
      />

      <MemberFinalSummaryModal
        visible={!!finalSummarySessionId}
        sessionId={finalSummarySessionId}
        onClose={() => setFinalSummarySessionId(null)}
      />

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
