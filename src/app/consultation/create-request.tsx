import React from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Box } from '@/components/ui/box';
import { useConsultationsLogic } from '@/hooks/useConsultationsLogic';
import { ChevronLeft, Activity, Check, Shield, Clock } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';

export default function CreateRequestScreen() {
  const {
    packages,
    healthRecords,
    requestForm,
    setRequestForm,
    handleCreateRequest,
    actionLoading,
    alert,
  } = useConsultationsLogic();

  const toggleSelectRecord = (recordId: string | number) => {
    const idStr = String(recordId);
    const current = requestForm.selectedHealthRecordIds || [];
    const updated = current.includes(idStr)
      ? current.filter((id) => id !== idStr)
      : [...current, idStr];
    setRequestForm({ ...requestForm, selectedHealthRecordIds: updated });
  };

  const onSubmit = async () => {
    const success = await handleCreateRequest();
    if (success) {
      router.back();
    }
  };

  return (
    <ScreenWrapper
      title="Đăng ký tư vấn"
      description="Gửi hồ sơ và yêu cầu tới bác sĩ chuyên khoa"
      headerLeft={
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center bg-muted rounded-full active:opacity-70"
        >
          <ChevronLeft size={24} className="text-foreground" />
        </Pressable>
      }
    >
      <View className="px-5 pb-12">
        {alert && (
          <Box
            className={`p-3.5 rounded-2xl mb-4 ${
              alert.type === 'error'
                ? 'bg-red-500/10 border border-red-500/20'
                : 'bg-emerald-500/10 border border-emerald-500/20'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                alert.type === 'error' ? 'text-red-800' : 'text-emerald-800'
              }`}
            >
              {alert.text}
            </Text>
          </Box>
        )}

        {/* Package Selection */}
        <Text className="font-bold text-foreground mb-2 text-sm">1. Chọn gói dịch vụ chăm sóc *</Text>
        <View className="space-y-3 mb-6">
          {packages.map((pkg) => {
            const isSelected = requestForm.packageId === String(pkg.id);
            return (
              <Pressable
                key={pkg.id}
                onPress={() => setRequestForm({ ...requestForm, packageId: String(pkg.id) })}
                className={`border p-4 rounded-2xl active:opacity-85 ${
                  isSelected ? 'border-primary bg-primary/5 shadow-xs' : 'border-border bg-card'
                }`}
              >
                <View className="flex-row justify-between items-start mb-1">
                  <Text className="font-bold text-foreground text-base flex-1 pr-2">{pkg.name}</Text>
                  <Text className="font-extrabold text-primary text-base">
                    {Number(pkg.priceAmount).toLocaleString('vi-VN')} ₫
                  </Text>
                </View>

                <Text className="text-muted-foreground text-xs leading-relaxed mb-3">
                  {pkg.description || 'Gói tư vấn sức khỏe từ xa cùng bác sĩ chuyên khoa.'}
                </Text>

                <View className="flex-row items-center gap-3 pt-2 border-t border-border/60">
                  <View className="flex-row items-center gap-1">
                    <Clock size={12} className="text-muted-foreground" />
                    <Text className="text-[11px] text-muted-foreground">
                      Thời hạn: {pkg.durationDays || 30} ngày
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Shield size={12} className="text-muted-foreground" />
                    <Text className="text-[11px] text-muted-foreground">Bác sĩ chuyên khoa</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Clinical Inputs */}
        <Text className="font-bold text-foreground mb-2 text-sm">2. Lý do tư vấn *</Text>
        <TextInput
          className="border border-border rounded-2xl p-4 text-foreground bg-card mb-4 min-h-[90px] text-sm leading-relaxed"
          multiline
          textAlignVertical="top"
          placeholder="Ví dụ: Cảm thấy hồi hộp, tim đập nhanh không đều khi nghỉ ngơi..."
          placeholderTextColor="#94a3b8"
          value={requestForm.reasonForCare}
          onChangeText={(val) => setRequestForm({ ...requestForm, reasonForCare: val })}
        />

        <Text className="font-bold text-foreground mb-2 text-sm">3. Tình trạng & Triệu chứng hiện tại *</Text>
        <TextInput
          className="border border-border rounded-2xl p-4 text-foreground bg-card mb-4 min-h-[90px] text-sm leading-relaxed"
          multiline
          textAlignVertical="top"
          placeholder="Mô tả tần suất xuất hiện, khó thở, tức ngực, chóng mặt..."
          placeholderTextColor="#94a3b8"
          value={requestForm.currentConcern}
          onChangeText={(val) => setRequestForm({ ...requestForm, currentConcern: val })}
        />

        <Text className="font-bold text-foreground mb-2 text-sm">4. Mục tiêu chăm sóc mong muốn</Text>
        <TextInput
          className="border border-border rounded-2xl p-4 text-foreground bg-card mb-6 min-h-[70px] text-sm leading-relaxed"
          multiline
          textAlignVertical="top"
          placeholder="Ví dụ: Đánh giá nguy cơ rung nhĩ, điều chỉnh lối sống..."
          placeholderTextColor="#94a3b8"
          value={requestForm.careGoal}
          onChangeText={(val) => setRequestForm({ ...requestForm, careGoal: val })}
        />

        {/* Health Records Attachment */}
        {healthRecords && healthRecords.length > 0 && (
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="font-bold text-foreground text-sm">
                5. Đính kèm hồ sơ đo đạc (Tùy chọn)
              </Text>
              <Text className="text-xs text-primary font-bold">
                Đã chọn: {requestForm.selectedHealthRecordIds?.length || 0}
              </Text>
            </View>
            <Text className="text-xs text-muted-foreground mb-3">
              Gửi kèm các bản ghi nhịp tim / AFib đo gần nhất để bác sĩ có dữ liệu phân tích:
            </Text>

            <View className="border border-border rounded-2xl bg-card overflow-hidden divide-y divide-border">
              {healthRecords.slice(0, 8).map((record) => {
                const isSelected = requestForm.selectedHealthRecordIds?.includes(String(record.id));
                return (
                  <Pressable
                    key={record.id}
                    onPress={() => toggleSelectRecord(record.id)}
                    className={`p-3.5 flex-row items-center gap-3 active:opacity-75 ${
                      isSelected ? 'bg-primary/5' : ''
                    }`}
                  >
                    <View
                      className={`h-5 w-5 rounded border items-center justify-center ${
                        isSelected ? 'bg-primary border-primary' : 'border-border bg-background'
                      }`}
                    >
                      {isSelected && <Check size={14} color="#ffffff" />}
                    </View>
                    <Activity size={18} className="text-primary" />
                    <View className="flex-1">
                      <Text className="text-xs font-semibold text-foreground">
                        Hồ sơ #{record.id}
                        {record.predictionLabel ? ` • [${record.predictionLabel}]` : ''}
                      </Text>
                      <Text className="text-[11px] text-muted-foreground mt-0.5">
                        {record.createdAt
                          ? new Date(record.createdAt).toLocaleString('vi-VN')
                          : 'Bản ghi sinh trắc học'}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Submit Button */}
        <Pressable
          onPress={onSubmit}
          disabled={
            actionLoading ||
            !requestForm.packageId ||
            !requestForm.reasonForCare.trim() ||
            !requestForm.currentConcern.trim()
          }
          className={`rounded-2xl py-4 flex-row justify-center items-center shadow-xs ${
            actionLoading ||
            !requestForm.packageId ||
            !requestForm.reasonForCare.trim() ||
            !requestForm.currentConcern.trim()
              ? 'bg-muted'
              : 'bg-primary active:opacity-90'
          }`}
        >
          {actionLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-bold text-base">Gửi yêu cầu tư vấn</Text>
          )}
        </Pressable>
      </View>
    </ScreenWrapper>
  );
}
