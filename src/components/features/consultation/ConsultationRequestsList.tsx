import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Box } from '@/components/ui/box';
import { ConsultationRequestItem } from '@/types/consultation';
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react-native';

interface Props {
  requests: ConsultationRequestItem[];
  loading: boolean;
  onRefresh: () => void;
}

export function ConsultationRequestsList({ requests, loading, onRefresh }: Props) {
  const renderItem = ({ item }: { item: ConsultationRequestItem }) => (
    <Box className="bg-background border border-border rounded-xl p-4 mb-3 shadow-sm">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="font-semibold text-foreground text-lg">Yêu cầu #{item.id}</Text>
        {item.status === 'PENDING' && <Clock size={20} color="#eab308" />}
        {item.status === 'APPROVED' && <CheckCircle size={20} color="#22c55e" />}
        {(item.status === 'REJECTED' || item.status === 'CANCELLED') && <XCircle size={20} color="#ef4444" />}
      </View>
      <Text className="text-muted-foreground text-sm mb-1" numberOfLines={2}>
        Lý do: {item.reasonForCare}
      </Text>
      <Text className="text-muted-foreground text-xs">
        Ngày tạo: {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '---'}
      </Text>
    </Box>
  );

  return (
    <View className="pb-5">
      {requests.length === 0 ? (
        <View className="flex-1 items-center justify-center pt-10">
          <Text className="text-muted-foreground">Bạn chưa có yêu cầu tư vấn nào.</Text>
        </View>
      ) : (
        requests.map((item) => <React.Fragment key={String(item.id)}>{renderItem({ item })}</React.Fragment>)
      )}
    </View>
  );
}
