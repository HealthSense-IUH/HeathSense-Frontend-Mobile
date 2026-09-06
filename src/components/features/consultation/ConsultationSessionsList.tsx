import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Box } from '@/components/ui/box';
import { ConsultationSessionItem } from '@/types/consultation';
import { MessageCircle, Calendar } from 'lucide-react-native';

interface Props {
  sessions: ConsultationSessionItem[];
  loading: boolean;
  onRefresh: () => void;
  onSelectSession: (session: ConsultationSessionItem) => void;
}

export function ConsultationSessionsList({ sessions, loading, onRefresh, onSelectSession }: Props) {
  const renderItem = ({ item }: { item: ConsultationSessionItem }) => (
    <Pressable onPress={() => onSelectSession(item)}>
      <Box className="bg-background border border-border rounded-xl p-4 mb-3 shadow-sm flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="font-semibold text-foreground text-lg mb-1">Phiên #{item.id}</Text>
          <Text className="text-muted-foreground text-sm">
            Trạng thái: {item.status}
          </Text>
          <Text className="text-muted-foreground text-xs mt-1">
            Ngày bắt đầu: {item.startedAt ? new Date(item.startedAt).toLocaleDateString('vi-VN') : '---'}
          </Text>
        </View>
        <View className="bg-primary/10 p-3 rounded-full">
          <MessageCircle size={24} className="text-primary" />
        </View>
      </Box>
    </Pressable>
  );

  return (
    <View className="pb-5">
      {sessions.length === 0 ? (
        <View className="flex-1 items-center justify-center pt-10">
          <Text className="text-muted-foreground">Bạn chưa có phiên tư vấn nào.</Text>
        </View>
      ) : (
        sessions.map((item) => <React.Fragment key={String(item.id)}>{renderItem({ item })}</React.Fragment>)
      )}
    </View>
  );
}
