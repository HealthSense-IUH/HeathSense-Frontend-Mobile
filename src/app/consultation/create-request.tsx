import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Activity, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Clock, Send, Stethoscope } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useConsultationsLogic, hasActiveQueue } from '@/hooks/useConsultationsLogic';
import { getPredictionMeta } from '@/constants/healthRecords';
import { PredictionBadge } from '@/components/features/health/PredictionBadge';
import { formatDateTime } from '@/utils/formatters';

function WarningBox({ icon, title, text, actionLabel, onAction }: { icon: React.ReactNode; title: string; text: string; actionLabel: string; onAction: () => void }) {
  return (
    <View className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl" style={{ gap: 10 }}>
      <View className="flex-row items-start" style={{ gap: 10 }}>
        {icon}
        <View className="flex-1">
          <Text className="font-semibold text-sm text-foreground">{title}</Text>
          <Text className="text-xs text-muted-foreground mt-0.5 leading-5">{text}</Text>
        </View>
      </View>
      <Pressable onPress={onAction} className="self-start h-9 px-4 rounded-xl bg-primary flex-row items-center active:opacity-90" style={{ gap: 6 }}>
        <Text className="text-white text-xs font-semibold">{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

/** Đăng ký tư vấn (luồng hàng đợi, giống web CreateRequestPanel): lý do + triệu chứng, tự đính kèm bản ghi đo mới nhất. */
export default function CreateRequestScreen() {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const {
    alert,
    actionLoading,
    loading,
    healthRecords,
    wallet,
    currentQueueState,
    queueStatistics,
    insufficientCredits,
    requestForm,
    setRequestForm,
    handleCreateRequest,
  } = useConsultationsLogic();

  const latestRecord = healthRecords[0] ?? null;
  const hasNoRecords = !loading && healthRecords.length === 0;
  const availableCredits = wallet?.available;
  const hasInsufficientCredits = insufficientCredits || (availableCredits !== undefined && availableCredits <= 0);
  const queueActive = hasActiveQueue(currentQueueState);
  const isValid = !!requestForm.reasonForCare.trim() && !!requestForm.currentConcern.trim() && !hasNoRecords && !hasInsufficientCredits && !queueActive;

  const goToQueue = () => router.replace({ pathname: '/(tabs)/consultation', params: { tab: 'queue' } } as any);
  const goToCredits = () => router.replace({ pathname: '/(tabs)/consultation', params: { tab: 'credits' } } as any);

  const showPendingConflict = () =>
    Alert.alert(
      'Bạn đang có yêu cầu tư vấn chưa hoàn thành',
      `Mỗi tài khoản hội viên chỉ được tham gia một phiên tư vấn tại một thời điểm.${
        currentQueueState?.queueNumber ? ` Bạn đang có yêu cầu trong hàng đợi (Số thứ tự #${String(currentQueueState.queueNumber).padStart(3, '0')}).` : ''
      } Vui lòng theo dõi hàng đợi hiện tại hoặc hủy yêu cầu cũ trước khi tạo yêu cầu mới.`,
      [
        { text: 'Đóng', style: 'cancel' },
        { text: 'Xem hàng đợi hiện tại', onPress: goToQueue },
      ]
    );

  const submit = async () => {
    setConfirmOpen(false);
    const result = await handleCreateRequest();
    if (result === 'ok') goToQueue();
    else if (result === 'conflict') showPendingConflict();
  };

  const policyText =
    queueStatistics?.creditPolicy === 'PER_SESSION_CONFIRM_V2'
      ? `Phiên tư vấn cần ${queueStatistics.creditCost ?? 1} lượt. Lượt chỉ được trừ khi bạn xác nhận bắt đầu phiên.`
      : queueStatistics?.creditPolicy === 'PER_SESSION_V1'
        ? `Mỗi phiên tư vấn sử dụng ${queueStatistics.creditCost ?? 1} lượt. Lượt sẽ được tạm giữ khi vào hàng đợi và chỉ trừ khi bắt đầu phiên khám.`
        : queueStatistics?.creditPolicy === 'FREE_EXISTING' || queueStatistics?.creditPolicy === 'FREE_DISABLED'
          ? 'Phiên tư vấn miễn phí, không trừ lượt.'
          : 'Yêu cầu của bạn sẽ nhận số thứ tự cố định và được xếp vào hàng đợi trực tiếp (FIFO).';

  return (
    <ScreenWrapper
      title="Đăng ký tư vấn"
      description="Xếp vào hàng đợi, ghép tự động với bác sĩ đang trực"
      withKeyboardHandling
      headerLeft={
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center bg-muted rounded-full active:opacity-70" aria-label="Quay lại">
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
      }
    >
      <View className="px-5 pb-12" style={{ gap: 16 }}>
        <View className="flex-row items-center" style={{ gap: 10 }}>
          <View className="p-2.5 rounded-xl bg-primary/10">
            <Stethoscope size={20} color="#0D6EFD" />
          </View>
          <Text className="text-xs text-muted-foreground flex-1 leading-5">
            Yêu cầu của bạn sẽ được xếp vào hàng đợi trực tiếp (FIFO) và ghép nối tự động với bác sĩ đang trực.
          </Text>
        </View>

        {alert && alert.type === 'error' ? (
          <View className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20">
            <Text className="text-xs font-semibold text-red-800">{alert.text}</Text>
          </View>
        ) : null}

        {queueActive ? (
          <WarningBox
            icon={<Clock size={20} color="#D97706" />}
            title="Bạn đang có yêu cầu tư vấn trong hàng đợi"
            text="Hệ thống ghi nhận bạn đã có yêu cầu tư vấn đang chờ xử lý. Mỗi hội viên chỉ có thể tham gia 1 yêu cầu tư vấn tại một thời điểm."
            actionLabel="Xem hàng đợi hiện tại"
            onAction={goToQueue}
          />
        ) : null}

        {hasInsufficientCredits ? (
          <WarningBox
            icon={<AlertCircle size={20} color="#D97706" />}
            title="Bạn không đủ lượt tư vấn để vào hàng đợi"
            text={`Số dư khả dụng hiện tại: ${availableCredits ?? 0} lượt. Vui lòng mua thêm gói lượt để tiếp tục.`}
            actionLabel="Mua thêm lượt tư vấn"
            onAction={goToCredits}
          />
        ) : null}

        {/* Hồ sơ đo đính kèm */}
        <View className="pt-4 border-t border-border" style={{ gap: 10 }}>
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <Activity size={16} color="#0D6EFD" />
            <Text className="text-sm font-semibold text-foreground">Hồ sơ đo đạc tim mạch đính kèm</Text>
          </View>
          {loading && healthRecords.length === 0 ? (
            <ActivityIndicator color="#0D6EFD" />
          ) : hasNoRecords ? (
            <View className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl" style={{ gap: 10 }}>
              <View className="flex-row items-start" style={{ gap: 10 }}>
                <AlertCircle size={20} color="#DC2626" />
                <View className="flex-1">
                  <Text className="font-semibold text-sm text-foreground">Chưa có dữ liệu đo điện tim (ECG)</Text>
                  <Text className="text-xs text-muted-foreground mt-1 leading-5">
                    Để bác sĩ có cơ sở chẩn đoán tình trạng tim mạch của bạn, bạn cần thực hiện ít nhất một lần đo bằng thiết bị trước khi đăng ký tư vấn.
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => router.push('/afib-measure' as any)} className="self-start h-9 px-3 rounded-xl border border-rose-300 bg-white flex-row items-center active:opacity-80" style={{ gap: 4 }}>
                <Text className="text-xs font-medium text-foreground">Đo điện tim ngay</Text>
                <ChevronRight size={14} color="#0F172A" />
              </Pressable>
            </View>
          ) : latestRecord ? (
            <View className="p-3.5 rounded-xl border border-primary/20 bg-primary/5" style={{ gap: 8 }}>
              <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
                <View className="flex-row items-center flex-1 flex-wrap" style={{ gap: 6 }}>
                  <Text className="font-semibold text-sm text-foreground">#{latestRecord.id}</Text>
                  <PredictionBadge meta={getPredictionMeta(latestRecord.predictionLabel, latestRecord.status)} size="sm" />
                </View>
                <View className="flex-row items-center rounded-full bg-emerald-600/15 px-2 py-0.5" style={{ gap: 4 }}>
                  <CheckCircle2 size={12} color="#047857" />
                  <Text className="text-[11px] font-semibold text-emerald-700">Tự động đính kèm mới nhất</Text>
                </View>
              </View>
              <View className="pt-2 border-t border-primary/10">
                <Text className="text-xs text-muted-foreground">Thời gian đo: {formatDateTime(latestRecord.createdAt)}</Text>
                <Text className="text-xs text-muted-foreground italic mt-0.5">Dữ liệu dạng sóng này sẽ được chia sẻ cho bác sĩ</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Thông tin lâm sàng */}
        <View className="pt-4 border-t border-border" style={{ gap: 14 }}>
          <View style={{ gap: 6 }}>
            <Text className="text-sm font-semibold text-foreground">
              Lý do đăng ký chăm sóc / tư vấn <Text className="text-rose-500">*</Text>
            </Text>
            <TextInput
              className="border border-border rounded-xl px-4 h-12 text-foreground bg-card text-sm"
              placeholder="VD: Nhịp tim không đều sau khi tập thể dục, cần tư vấn chuyên khoa tim mạch..."
              placeholderTextColor="#94a3b8"
              value={requestForm.reasonForCare}
              onChangeText={(v) => setRequestForm({ ...requestForm, reasonForCare: v })}
              maxLength={1000}
            />
          </View>
          <View style={{ gap: 6 }}>
            <Text className="text-sm font-semibold text-foreground">
              Triệu chứng & Vấn đề lo ngại hiện tại <Text className="text-rose-500">*</Text>
            </Text>
            <TextInput
              className="border border-border rounded-xl p-4 text-foreground bg-card min-h-[96px] text-sm leading-relaxed"
              multiline
              textAlignVertical="top"
              placeholder="Mô tả cụ thể triệu chứng: thời điểm xuất hiện, tần suất, cảm giác hồi hộp, khó thở, chóng mặt..."
              placeholderTextColor="#94a3b8"
              value={requestForm.currentConcern}
              onChangeText={(v) => setRequestForm({ ...requestForm, currentConcern: v })}
              maxLength={2000}
            />
          </View>
        </View>

        <View className="flex-row items-start p-3.5 bg-primary/5 border border-primary/20 rounded-xl" style={{ gap: 8 }}>
          <AlertCircle size={16} color="#0D6EFD" />
          <Text className="text-xs text-muted-foreground flex-1 leading-5">{policyText}</Text>
        </View>

        <Pressable
          onPress={() => (queueActive ? showPendingConflict() : isValid ? setConfirmOpen(true) : undefined)}
          disabled={actionLoading || (!isValid && !queueActive)}
          className={`h-12 rounded-xl flex-row items-center justify-center ${actionLoading || (!isValid && !queueActive) ? 'bg-muted' : 'bg-primary active:opacity-90'}`}
          style={{ gap: 8 }}
        >
          {actionLoading ? <ActivityIndicator color="#ffffff" /> : <Send size={16} color={isValid || queueActive ? '#FFFFFF' : '#94A3B8'} />}
          <Text className={`font-bold text-sm ${isValid || queueActive ? 'text-white' : 'text-muted-foreground'}`}>
            {actionLoading ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu & Vào hàng đợi'}
          </Text>
        </Pressable>
      </View>

      {/* Xác nhận trước khi vào hàng đợi */}
      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <View className="flex-1 justify-center bg-black/60 px-5">
          <View className="bg-background rounded-3xl p-5" style={{ gap: 14 }}>
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <Stethoscope size={20} color="#0D6EFD" />
              <Text className="text-base font-bold text-foreground flex-1">Xác nhận vào hàng đợi tư vấn</Text>
            </View>
            <Text className="text-xs text-muted-foreground">Vui lòng kiểm tra lại thông tin trước khi hệ thống xếp bạn vào hàng đợi gặp bác sĩ.</Text>
            <View className="rounded-xl border border-border bg-muted/20 p-3.5" style={{ gap: 8 }}>
              <View className="flex-row items-start justify-between" style={{ gap: 8 }}>
                <Text className="text-xs text-muted-foreground">Lý do tư vấn:</Text>
                <Text className="text-xs font-semibold text-foreground text-right flex-1" numberOfLines={2}>{requestForm.reasonForCare}</Text>
              </View>
              {latestRecord ? (
                <View className="flex-row items-center justify-between pt-2 border-t border-border/50" style={{ gap: 8 }}>
                  <Text className="text-xs text-muted-foreground">Bản ghi đính kèm:</Text>
                  <Text className="text-xs font-medium text-foreground">#{latestRecord.id} {latestRecord.predictionLabel ? `[${getPredictionMeta(latestRecord.predictionLabel, latestRecord.status).label}]` : ''}</Text>
                </View>
              ) : null}
              <View className="flex-row items-center justify-between pt-2 border-t border-border/50">
                <Text className="text-xs text-muted-foreground">Lượt tư vấn khả dụng:</Text>
                <Text className="text-xs font-bold text-emerald-600">{availableCredits ?? 1} lượt</Text>
              </View>
            </View>
            <View className="flex-row items-start p-3.5 bg-primary/10 border border-primary/20 rounded-xl" style={{ gap: 8 }}>
              <AlertCircle size={16} color="#2563EB" />
              <Text className="text-xs text-slate-800 flex-1 leading-5">
                Để tham gia hàng đợi, bạn cần có tối thiểu <Text className="font-bold">1 lượt tư vấn</Text>.{'\n'}
                <Text className="font-medium">Quy định trừ lượt:</Text> Lượt của bạn chỉ được trừ khi bác sĩ tiếp nhận và bạn bấm{' '}
                <Text className="font-bold">Xác nhận bắt đầu phiên tư vấn</Text>.
              </Text>
            </View>
            <View className="flex-row" style={{ gap: 10 }}>
              <Pressable onPress={() => setConfirmOpen(false)} disabled={actionLoading} className="flex-1 h-11 rounded-xl border border-border bg-white items-center justify-center active:opacity-80">
                <Text className="text-xs font-semibold text-foreground">Kiểm tra lại</Text>
              </Pressable>
              <Pressable onPress={submit} disabled={actionLoading} className="flex-1 h-11 rounded-xl bg-primary flex-row items-center justify-center active:opacity-90" style={{ gap: 6 }}>
                <Send size={14} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">{actionLoading ? 'Đang gửi...' : 'Xác nhận & Vào hàng đợi'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

