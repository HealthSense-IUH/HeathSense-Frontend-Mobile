import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MessageCircle, FileText, RefreshCw, Calendar, User, Clock } from 'lucide-react-native';
import type { ConsultationSessionItem } from '@/types/consultation';

interface Props {
  sessions: ConsultationSessionItem[];
  loading: boolean;
  onRefresh: () => void;
  onSelectSession: (session: ConsultationSessionItem) => void;
  onViewSummary?: (sessionId: string | number) => void;
  onOpenRenewal?: (session: ConsultationSessionItem) => void;
}

export function ConsultationSessionsList({
  sessions,
  loading,
  onRefresh,
  onSelectSession,
  onViewSummary,
  onOpenRenewal,
}: Props) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <View className="px-2.5 py-1 rounded-full bg-emerald-500/10 flex-row items-center gap-1">
            <View className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <Text className="text-[11px] font-bold text-emerald-700">Đang diễn ra</Text>
          </View>
        );
      case 'SCHEDULED':
        return (
          <View className="px-2.5 py-1 rounded-full bg-blue-500/10 flex-row items-center gap-1">
            <Clock size={12} color="#2563eb" />
            <Text className="text-[11px] font-bold text-blue-700">Chờ bắt đầu</Text>
          </View>
        );
      case 'COMPLETED':
        return (
          <View className="px-2.5 py-1 rounded-full bg-muted flex-row items-center gap-1">
            <Text className="text-[11px] font-bold text-muted-foreground">Đã hoàn tất</Text>
          </View>
        );
      case 'CLOSED':
      case 'EXPIRED':
        return (
          <View className="px-2.5 py-1 rounded-full bg-red-500/10 flex-row items-center gap-1">
            <Text className="text-[11px] font-bold text-red-700">Đã kết thúc</Text>
          </View>
        );
      default:
        return (
          <View className="px-2.5 py-1 rounded-full bg-muted">
            <Text className="text-[11px] font-semibold text-muted-foreground">{status}</Text>
          </View>
        );
    }
  };

  const renderItem = (item: ConsultationSessionItem) => {
    const doctorName = item.doctorDisplayName || `Bác sĩ #${item.doctorId}`;
    const isActive = item.status === 'ACTIVE';

    return (
      <View
        key={String(item.id)}
        className="bg-card border border-border rounded-2xl p-4 mb-3.5 shadow-xs"
      >
        {/* Top Header */}
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center gap-2.5">
            <View className="h-9 w-9 rounded-full bg-primary/10 items-center justify-center">
              <User size={18} className="text-primary" />
            </View>
            <View>
              <Text className="font-bold text-foreground text-sm">{doctorName}</Text>
              <Text className="text-[11px] text-muted-foreground">Phiên tư vấn #{item.id}</Text>
            </View>
          </View>
          {getStatusBadge(item.status)}
        </View>

        {/* Expiration date */}
        <View className="flex-row items-center gap-1.5 mb-2">
          <Calendar size={12} className="text-muted-foreground" />
          <Text className="text-muted-foreground text-[11px]">
            Hạn kết thúc: {item.endsAt ? new Date(item.endsAt).toLocaleDateString('vi-VN') : '---'}
          </Text>
        </View>

        {/* Last message preview */}
        {item.lastMessagePreview && (
          <View className="bg-muted/30 p-2.5 rounded-xl mb-3">
            <Text className="text-muted-foreground text-xs" numberOfLines={1}>
              Tin mới nhất: {item.lastMessagePreview}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row gap-2 pt-2 border-t border-border/70 justify-end flex-wrap">
          {/* Summary button */}
          {(item.status === 'COMPLETED' || item.status === 'CLOSED') && onViewSummary && (
            <Pressable
              onPress={() => onViewSummary(item.id)}
              className="px-3 py-2 rounded-xl bg-muted active:opacity-75 flex-row items-center gap-1.5"
            >
              <FileText size={14} className="text-foreground" />
              <Text className="text-foreground text-xs font-semibold">Xem tổng kết</Text>
            </Pressable>
          )}

          {/* Renewal button */}
          {(item.status === 'ACTIVE' || item.status === 'COMPLETED') && onOpenRenewal && (
            <Pressable
              onPress={() => onOpenRenewal(item)}
              className="px-3 py-2 rounded-xl border border-primary/30 bg-primary/5 active:opacity-75 flex-row items-center gap-1.5"
            >
              <RefreshCw size={14} className="text-primary" />
              <Text className="text-primary text-xs font-bold">Gia hạn</Text>
            </Pressable>
          )}

          {/* Main Chat Action */}
          <Pressable
            onPress={() => onSelectSession(item)}
            className={`px-4 py-2 rounded-xl flex-row items-center gap-1.5 active:opacity-90 ${
              isActive ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <MessageCircle size={14} color={isActive ? '#ffffff' : '#64748b'} />
            <Text
              className={`text-xs font-bold ${
                isActive ? 'text-white' : 'text-muted-foreground'
              }`}
            >
              {isActive ? 'Vào phòng chat' : 'Xem tin nhắn'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View className="pb-5">
      {sessions.length === 0 ? (
        <View className="flex-1 items-center justify-center pt-12">
          <MessageCircle size={36} className="text-muted-foreground/40 mb-2" />
          <Text className="text-muted-foreground text-sm">Bạn chưa có phiên tư vấn nào.</Text>
        </View>
      ) : (
        sessions.map((item) => renderItem(item))
      )}
    </View>
  );
}
