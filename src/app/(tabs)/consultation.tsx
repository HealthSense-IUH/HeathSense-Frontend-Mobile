import React, { useState } from 'react';
import { View, Text, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { useConsultationsLogic } from '@/hooks/useConsultationsLogic';
import { ConsultationRequestsList } from '@/components/features/consultation/ConsultationRequestsList';
import { ConsultationSessionsList } from '@/components/features/consultation/ConsultationSessionsList';

export default function ConsultationScreen() {
  const [activeTab, setActiveTab] = useState<'requests' | 'sessions' | 'records'>('requests');
  const { requests, sessions, loading, loadData, setSelectedSession } = useConsultationsLogic();

  const handleSelectSession = (session: any) => {
    setSelectedSession(session);
    router.push(`/consultation/chat/${session.id}`);
  };

  return (
    <ScreenWrapper 
      title="Tư vấn" 
      description="Kết nối trực tiếp với bác sĩ"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
    >
      <Box className="px-5 mt-4 flex-1">
        {/* Custom Segmented Tabs */}
        <HStack className="bg-muted p-1 rounded-xl w-full justify-between mb-4">
          <Pressable 
            onPress={() => setActiveTab('requests')}
            className={activeTab === 'requests' 
              ? "flex-1 items-center justify-center py-2 rounded-lg bg-background shadow-sm"
              : "flex-1 items-center justify-center py-2 rounded-lg"}
          >
            <Text className={activeTab === 'requests' ? 'font-semibold text-foreground' : 'font-semibold text-muted-foreground'}>
              Yêu cầu
            </Text>
          </Pressable>
          <Pressable 
            onPress={() => setActiveTab('sessions')}
            className={activeTab === 'sessions' 
              ? "flex-1 items-center justify-center py-2 rounded-lg bg-background shadow-sm"
              : "flex-1 items-center justify-center py-2 rounded-lg"}
          >
            <Text className={activeTab === 'sessions' ? 'font-semibold text-foreground' : 'font-semibold text-muted-foreground'}>
              Phiên
            </Text>
          </Pressable>
          <Pressable 
            onPress={() => setActiveTab('records')}
            className={activeTab === 'records' 
              ? "flex-1 items-center justify-center py-2 rounded-lg bg-background shadow-sm"
              : "flex-1 items-center justify-center py-2 rounded-lg"}
          >
            <Text className={activeTab === 'records' ? 'font-semibold text-foreground' : 'font-semibold text-muted-foreground'}>
              Hồ sơ
            </Text>
          </Pressable>
        </HStack>

        <Pressable 
          onPress={() => router.push('/consultation/create-request')}
          className="bg-primary rounded-xl py-3 px-4 mb-4 flex-row justify-center items-center"
        >
          <Text className="text-primary-foreground font-bold text-base">Đăng ký tư vấn mới</Text>
        </Pressable>

        {/* Tab Content */}
        <Box className="flex-1 w-full mt-2">
          {activeTab === 'requests' && (
            <ConsultationRequestsList requests={requests} loading={loading} onRefresh={loadData} />
          )}
          {activeTab === 'sessions' && (
            <ConsultationSessionsList sessions={sessions} loading={loading} onRefresh={loadData} onSelectSession={handleSelectSession} />
          )}
          {activeTab === 'records' && (
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted-foreground">Hồ sơ đo đạc (Đang phát triển...)</Text>
            </View>
          )}
        </Box>
      </Box>
    </ScreenWrapper>
  );
}
