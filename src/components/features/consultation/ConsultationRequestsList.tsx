import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Clock, CheckCircle, XCircle, AlertTriangle, Shield, CreditCard, Calendar } from 'lucide-react-native';
import type { ConsultationRequestItem } from '@/types/consultation';

interface Props {
  requests: ConsultationRequestItem[];
  loading: boolean;
  onRefresh: () => void;
  onReviewAgreement?: (request: ConsultationRequestItem) => void;
  onInitiatePayment?: (requestId: string | number) => void;
  onSubmitMoreInfo?: (request: ConsultationRequestItem) => void;
  onCancelRequest?: (requestId: string | number) => void;
}

export function ConsultationRequestsList({
  requests,
  loading,
  onRefresh,
  onReviewAgreement,
  onInitiatePayment,
  onSubmitMoreInfo,
  onCancelRequest,
}: Props) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'PENDING_REVIEW':
        return (
          <View className="px-2.5 py-1 rounded-full bg-amber-500/10 flex-row items-center gap-1">
            <Clock size={12} color="#d97706" />
            <Text className="text-[11px] font-bold text-amber-700">Chờ duyệt</Text>
          </View>
        );
      case 'NEED_MORE_INFO':
        return (
          <View className="px-2.5 py-1 rounded-full bg-orange-500/10 flex-row items-center gap-1">
            <AlertTriangle size={12} color="#ea580c" />
            <Text className="text-[11px] font-bold text-orange-700">Cần bổ sung TT</Text>
          </View>
        );
      case 'WAITING_ACCEPTANCE':
        return (
          <View className="px-2.5 py-1 rounded-full bg-indigo-500/10 flex-row items-center gap-1">
            <Shield size={12} color="#4f46e5" />
            <Text className="text-[11px] font-bold text-indigo-700">Chờ ký thỏa thuận</Text>
          </View>
        );
      case 'WAITING_PAYMENT':
        return (
          <View className="px-2.5 py-1 rounded-full bg-blue-500/10 flex-row items-center gap-1">
            <CreditCard size={12} color="#2563eb" />
            <Text className="text-[11px] font-bold text-blue-700">Chờ thanh toán</Text>
          </View>
        );
      case 'FULFILLED':
      case 'PAID':
      case 'APPROVED':
        return (
          <View className="px-2.5 py-1 rounded-full bg-emerald-500/10 flex-row items-center gap-1">
            <CheckCircle size={12} color="#16a34a" />
            <Text className="text-[11px] font-bold text-emerald-700">Đã kích hoạt</Text>
          </View>
        );
      case 'REJECTED':
        return (
          <View className="px-2.5 py-1 rounded-full bg-red-500/10 flex-row items-center gap-1">
            <XCircle size={12} color="#dc2626" />
            <Text className="text-[11px] font-bold text-red-700">Bị từ chối</Text>
          </View>
        );
      case 'CANCELLED':
        return (
          <View className="px-2.5 py-1 rounded-full bg-muted flex-row items-center gap-1">
            <Text className="text-[11px] font-bold text-muted-foreground">Đã hủy</Text>
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

  const handleConfirmCancel = (requestId: string | number) => {
    Alert.alert(
      'Xác nhận hủy yêu cầu',
      `Bạn có chắc chắn muốn hủy yêu cầu tư vấn #${requestId} này không?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy yêu cầu',
          style: 'destructive',
          onPress: () => onCancelRequest?.(requestId),
        },
      ]
    );
  };

  const renderItem = (item: ConsultationRequestItem) => {
    const isCancellable = [
      'PENDING',
      'PENDING_REVIEW',
      'NEED_MORE_INFO',
      'WAITING_ACCEPTANCE',
      'WAITING_PAYMENT',
    ].includes(item.status);

    return (
      <View
        key={String(item.id)}
        className="bg-card border border-border rounded-2xl p-4 mb-3.5 shadow-xs"
      >
        {/* Top Header */}
        <View className="flex-row justify-between items-center mb-2.5">
          <Text className="font-bold text-foreground text-base">Yêu cầu #{item.id}</Text>
          {getStatusBadge(item.status)}
        </View>

        {/* Reason & Content */}
        <Text className="text-foreground text-xs font-semibold mb-1" numberOfLines={2}>
          Lý do: {item.reasonForCare || item.reason || 'Tư vấn sức khỏe 1-1'}
        </Text>

        {item.currentConcern && (
          <Text className="text-muted-foreground text-xs mb-2" numberOfLines={2}>
            Tình trạng: {item.currentConcern}
          </Text>
        )}

        {/* Date */}
        <View className="flex-row items-center gap-1.5 mb-3">
          <Calendar size={12} className="text-muted-foreground" />
          <Text className="text-muted-foreground text-[11px]">
            Ngày tạo: {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '---'}
          </Text>
        </View>

        {/* Status specific alerts */}
        {item.status === 'NEED_MORE_INFO' && item.moreInfoReason && (
          <View className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl mb-3">
            <Text className="text-orange-800 text-xs font-semibold mb-0.5">Yêu cầu bổ sung:</Text>
            <Text className="text-orange-900 text-xs">{item.moreInfoReason}</Text>
          </View>
        )}

        {item.status === 'WAITING_ACCEPTANCE' && (
          <View className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl mb-3">
            <Text className="text-indigo-800 text-xs font-medium">
              Bác sĩ chuyên khoa đã được giữ chỗ. Vui lòng xem & xác nhận Thỏa thuận dịch vụ để tiến hành thanh toán.
            </Text>
            {item.paymentDeadline && (
              <Text className="text-indigo-900 font-bold text-[11px] mt-1">
                Hạn xác nhận: {new Date(item.paymentDeadline).toLocaleString('vi-VN')}
              </Text>
            )}
          </View>
        )}

        {item.status === 'WAITING_PAYMENT' && (
          <View className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl mb-3">
            <Text className="text-blue-800 text-xs font-medium">
              Đã ký thỏa thuận. Vui lòng hoàn tất thanh toán để hệ thống mở phiên tư vấn trực tiếp với bác sĩ.
            </Text>
            {item.paymentDeadline && (
              <Text className="text-blue-900 font-bold text-[11px] mt-1">
                Hạn thanh toán: {new Date(item.paymentDeadline).toLocaleString('vi-VN')}
              </Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row gap-2 pt-2 border-t border-border/70 justify-end flex-wrap">
          {item.status === 'NEED_MORE_INFO' && onSubmitMoreInfo && (
            <Pressable
              onPress={() => onSubmitMoreInfo(item)}
              className="px-3.5 py-2 rounded-xl bg-orange-600 active:opacity-80 flex-row items-center gap-1.5"
            >
              <AlertTriangle size={14} color="#ffffff" />
              <Text className="text-white text-xs font-bold">Bổ sung thông tin</Text>
            </Pressable>
          )}

          {item.status === 'WAITING_ACCEPTANCE' && onReviewAgreement && (
            <Pressable
              onPress={() => onReviewAgreement(item)}
              className="px-3.5 py-2 rounded-xl bg-amber-600 active:opacity-80 flex-row items-center gap-1.5"
            >
              <Shield size={14} color="#ffffff" />
              <Text className="text-white text-xs font-bold">Xem & Ký thỏa thuận</Text>
            </Pressable>
          )}

          {item.status === 'WAITING_PAYMENT' && onInitiatePayment && (
            <Pressable
              onPress={() => onInitiatePayment(item.id)}
              className="px-4 py-2 rounded-xl bg-primary active:opacity-80 flex-row items-center gap-1.5"
            >
              <CreditCard size={14} color="#ffffff" />
              <Text className="text-white text-xs font-bold">Thanh toán ngay</Text>
            </Pressable>
          )}

          {isCancellable && onCancelRequest && (
            <Pressable
              onPress={() => handleConfirmCancel(item.id)}
              className="px-3 py-2 rounded-xl bg-muted active:opacity-70"
            >
              <Text className="text-muted-foreground text-xs font-semibold">Hủy</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <View className="pb-5">
      {requests.length === 0 ? (
        <View className="flex-1 items-center justify-center pt-12">
          <Clock size={36} className="text-muted-foreground/40 mb-2" />
          <Text className="text-muted-foreground text-sm">Bạn chưa có yêu cầu tư vấn nào.</Text>
        </View>
      ) : (
        requests.map((item) => renderItem(item))
      )}
    </View>
  );
}
