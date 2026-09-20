import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Share2, Activity, Check, X, AlertCircle } from 'lucide-react-native';
import type { HealthRecordItem } from '@/types/consultation';

interface ShareHealthRecordModalProps {
  visible: boolean;
  sessionId: string | number | null;
  healthRecords: HealthRecordItem[];
  onClose: () => void;
  onShare: (sessionId: string | number, recordId: string | number) => Promise<boolean>;
}

export function ShareHealthRecordModal({
  visible,
  sessionId,
  healthRecords,
  onClose,
  onShare,
}: ShareHealthRecordModalProps) {
  const [selectedRecordId, setSelectedRecordId] = useState<string | number | null>(null);
  const [sharing, setSharing] = useState(false);

  const handleConfirmShare = async () => {
    if (!sessionId || !selectedRecordId) return;
    setSharing(true);
    try {
      const success = await onShare(sessionId, selectedRecordId);
      if (success) {
        setSelectedRecordId(null);
        onClose();
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-background rounded-t-3xl max-h-[85%] p-6 flex flex-col shadow-2xl">
          {/* Header */}
          <View className="flex-row justify-between items-center pb-4 border-b border-border">
            <View className="flex-row items-center gap-3">
              <View className="p-2.5 rounded-full bg-primary/10">
                <Share2 size={22} className="text-primary" />
              </View>
              <View>
                <Text className="font-bold text-foreground text-lg">Chia sẻ Hồ sơ đo đạc</Text>
                <Text className="text-xs text-muted-foreground">Phiên tư vấn #{sessionId}</Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              className="h-8 w-8 rounded-full bg-muted items-center justify-center active:opacity-70"
            >
              <X size={18} className="text-foreground" />
            </Pressable>
          </View>

          <Text className="text-xs text-muted-foreground my-3">
            Chọn một bản ghi đo tín hiệu sinh trắc học để ủy quyền cho bác sĩ xem xét trong phiên khám này:
          </Text>

          {/* Records List */}
          <ScrollView showsVerticalScrollIndicator={false} className="py-2 mb-4">
            {!healthRecords || healthRecords.length === 0 ? (
              <View className="py-12 items-center">
                <AlertCircle size={32} className="text-muted-foreground mb-2" />
                <Text className="text-sm text-muted-foreground">Bạn chưa có bản ghi đo đạc nào.</Text>
              </View>
            ) : (
              <View className="space-y-2.5">
                {healthRecords.map((record) => {
                  const isSelected = selectedRecordId === record.id;
                  return (
                    <Pressable
                      key={record.id}
                      onPress={() => setSelectedRecordId(record.id)}
                      className={`p-4 rounded-2xl border flex-row items-center gap-3 active:opacity-80 ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card'
                      }`}
                    >
                      <View
                        className={`h-6 w-6 rounded-full border items-center justify-center ${
                          isSelected ? 'bg-primary border-primary' : 'border-border bg-background'
                        }`}
                      >
                        {isSelected && <Check size={14} color="#ffffff" />}
                      </View>

                      <View className="p-2 rounded-xl bg-primary/10">
                        <Activity size={20} className="text-primary" />
                      </View>

                      <View className="flex-1">
                        <Text className="text-sm font-bold text-foreground">
                          Hồ sơ #{record.id}
                          {record.predictionLabel ? ` • [${record.predictionLabel}]` : ''}
                        </Text>
                        <Text className="text-xs text-muted-foreground mt-0.5">
                          {record.createdAt
                            ? new Date(record.createdAt).toLocaleString('vi-VN')
                            : 'Đo lường nhịp tim / ECG'}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View className="pt-3 border-t border-border flex-row gap-3">
            <Pressable
              onPress={onClose}
              disabled={sharing}
              className="flex-1 py-3.5 rounded-xl bg-muted items-center justify-center active:opacity-70"
            >
              <Text className="font-semibold text-foreground text-sm">Hủy</Text>
            </Pressable>

            <Pressable
              onPress={handleConfirmShare}
              disabled={sharing || !selectedRecordId}
              className={`flex-1 py-3.5 rounded-xl items-center justify-center flex-row gap-2 ${
                sharing || !selectedRecordId ? 'bg-primary/40' : 'bg-primary active:opacity-90'
              }`}
            >
              {sharing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="font-bold text-white text-sm">Chia sẻ ngay</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
