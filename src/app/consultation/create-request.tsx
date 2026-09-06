import React from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Box } from '@/components/ui/box';
import { useConsultationsLogic } from '@/hooks/useConsultationsLogic';
import { ChevronLeft } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';

export default function CreateRequestScreen() {
  const { 
    packages, 
    requestForm, 
    setRequestForm, 
    handleCreateRequest, 
    actionLoading,
    alert
  } = useConsultationsLogic();

  const onSubmit = async () => {
    const success = await handleCreateRequest();
    if (success) {
      router.back();
    }
  };

  return (
    <ScreenWrapper
      title="Đăng ký tư vấn"
      description="Gửi yêu cầu tới bác sĩ"
      headerLeft={
        <Pressable 
          onPress={() => router.back()} 
          className="h-10 w-10 items-center justify-center bg-muted rounded-full active:opacity-70"
        >
          <ChevronLeft size={24} className="text-foreground" />
        </Pressable>
      }
    >
      <View className="px-6 pb-10">
        {alert && (
          <Box className={`p-3 rounded-xl mb-4 ${alert.type === 'error' ? 'bg-red-100 border border-red-300' : 'bg-green-100 border border-green-300'}`}>
            <Text className={alert.type === 'error' ? 'text-red-800' : 'text-green-800'}>{alert.text}</Text>
          </Box>
        )}

        <Text className="font-semibold text-foreground mb-2 text-base">Chọn gói dịch vụ *</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {packages.map((pkg) => (
            <Pressable
              key={pkg.id}
              onPress={() => setRequestForm({ ...requestForm, packageId: String(pkg.id) })}
              className={`border p-4 rounded-2xl w-full ${requestForm.packageId === String(pkg.id) ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
            >
              <Text className="font-bold text-foreground text-lg">{pkg.name}</Text>
              <Text className="text-muted-foreground text-sm mt-1 mb-2">{pkg.description}</Text>
              <Text className="font-bold text-primary text-base">{pkg.priceAmount.toLocaleString('vi-VN')} ₫</Text>
            </Pressable>
          ))}
        </View>

        <Text className="font-semibold text-foreground mb-2 text-base">Lý do tư vấn *</Text>
        <TextInput
          className="border border-border rounded-2xl p-4 text-foreground bg-card mb-6 min-h-[100px]"
          multiline
          textAlignVertical="top"
          placeholder="Nhập lý do bạn cần tư vấn..."
          value={requestForm.reasonForCare}
          onChangeText={(val) => setRequestForm({ ...requestForm, reasonForCare: val })}
        />

        <Text className="font-semibold text-foreground mb-2 text-base">Tình trạng hiện tại *</Text>
        <TextInput
          className="border border-border rounded-2xl p-4 text-foreground bg-card mb-6 min-h-[100px]"
          multiline
          textAlignVertical="top"
          placeholder="Mô tả các triệu chứng hoặc vấn đề hiện tại..."
          value={requestForm.currentConcern}
          onChangeText={(val) => setRequestForm({ ...requestForm, currentConcern: val })}
        />

        <Text className="font-semibold text-foreground mb-2 text-base">Mục tiêu chăm sóc</Text>
        <TextInput
          className="border border-border rounded-2xl p-4 text-foreground bg-card mb-8 min-h-[100px]"
          multiline
          textAlignVertical="top"
          placeholder="Bạn mong muốn đạt được điều gì sau tư vấn?"
          value={requestForm.careGoal}
          onChangeText={(val) => setRequestForm({ ...requestForm, careGoal: val })}
        />

        <Pressable 
          onPress={onSubmit}
          disabled={actionLoading || !requestForm.packageId || !requestForm.reasonForCare || !requestForm.currentConcern}
          className={`rounded-2xl py-4 flex-row justify-center items-center ${
            (actionLoading || !requestForm.packageId || !requestForm.reasonForCare || !requestForm.currentConcern) 
              ? 'bg-muted' 
              : 'bg-primary'
          }`}
        >
          {actionLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Gửi yêu cầu</Text>
          )}
        </Pressable>
      </View>
    </ScreenWrapper>
  );
}
