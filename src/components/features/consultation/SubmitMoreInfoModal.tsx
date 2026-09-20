import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { AlertTriangle, Check, X, Activity } from 'lucide-react-native';
import type { ConsultationRequestItem, HealthRecordItem } from '@/types/consultation';

interface SubmitMoreInfoModalProps {
  visible: boolean;
  request: ConsultationRequestItem | null;
  healthRecords: HealthRecordItem[];
  onClose: () => void;
  onSubmit: (
    requestId: string | number,
    note: string,
    selectedRecordIds?: (string | number)[]
  ) => Promise<boolean>;
}

export function SubmitMoreInfoModal({
  visible,
  request,
  healthRecords,
  onClose,
  onSubmit,
}: SubmitMoreInfoModalProps) {
  const [note, setNote] = useState('');
  const [selectedRecordIds, setSelectedRecordIds] = useState<(string | number)[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setNote('');
    setSelectedRecordIds([]);
    onClose();
  };

  const toggleSelectRecord = (id: string | number) => {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!request || !note.trim()) return;
    setSubmitting(true);
    try {
      const success = await onSubmit(request.id, note.trim(), selectedRecordIds);
      if (success) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!request) return null;

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
              <View className="p-2.5 rounded-full bg-amber-500/10">
                <AlertTriangle size={22} color="#f59e0b" />
              </View>
              <View>
                <Text className="font-bold text-foreground text-lg">Bổ sung thông tin</Text>
                <Text className="text-xs text-muted-foreground">Yêu cầu tư vấn #{request.id}</Text>
              </View>
            </View>
            <Pressable
              onPress={handleClose}
              className="h-8 w-8 rounded-full bg-muted items-center justify-center active:opacity-70"
            >
              <X size={18} className="text-foreground" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="py-4">
            {/* Reason from Admin */}
            {request.moreInfoReason ? (
              <View className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl mb-4">
                <Text className="text-xs font-bold text-amber-700 mb-1">
                  Yêu cầu từ điều phối viên:
                </Text>
                <Text className="text-xs text-amber-900 leading-relaxed">
                  {request.moreInfoReason}
                </Text>
              </View>
            ) : null}

            {/* Note Input */}
            <Text className="font-semibold text-foreground text-sm mb-2">
              Nội dung giải trình / Thông tin bổ sung *
            </Text>
            <TextInput
              className="border border-border rounded-2xl p-4 text-foreground bg-card text-sm min-h-[110px] mb-4"
              multiline
              textAlignVertical="top"
              placeholder="Nhập thông tin triệu chứng hoặc giải trình chi tiết..."
              placeholderTextColor="#94a3b8"
              value={note}
              onChangeText={setNote}
            />

            {/* Attach health records */}
            {healthRecords && healthRecords.length > 0 && (
              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="font-semibold text-foreground text-sm">
                    Đính kèm thêm hồ sơ đo đạc (Tùy chọn)
                  </Text>
                  <Text className="text-xs text-primary font-bold">
                    Đã chọn: {selectedRecordIds.length}
                  </Text>
                </View>

                <View className="border border-border rounded-2xl bg-card overflow-hidden divide-y divide-border">
                  {healthRecords.slice(0, 10).map((record) => {
                    const isSelected = selectedRecordIds.includes(record.id);
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
                              : 'Bản ghi sức khỏe'}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View className="pt-3 border-t border-border flex-row gap-3">
            <Pressable
              onPress={handleClose}
              disabled={submitting}
              className="flex-1 py-3.5 rounded-xl bg-muted items-center justify-center active:opacity-70"
            >
              <Text className="font-semibold text-foreground text-sm">Hủy</Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              disabled={submitting || !note.trim()}
              className={`flex-1 py-3.5 rounded-xl items-center justify-center flex-row gap-2 ${
                submitting || !note.trim() ? 'bg-primary/40' : 'bg-primary active:opacity-90'
              }`}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="font-bold text-white text-sm">Gửi thông tin</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
