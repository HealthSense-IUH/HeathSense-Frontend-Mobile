import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { AlertCircle, CheckCircle2, Clock, Coins, CreditCard, RefreshCw, ShieldCheck, X } from 'lucide-react-native';
import { formatCreditQuantity, getCreditOrderStatusConfig, getCreditPaymentProviderLabel } from '@/constants/credits';
import { formatVND } from '@/utils/formatters';
import type { useCreditPurchase } from '@/hooks/useCreditPurchase';

type PurchaseState = ReturnType<typeof useCreditPurchase>;

interface PurchaseCreditsModalProps {
  visible: boolean;
  purchase: PurchaseState;
  onClose: () => void;
  onPurchased: () => void;
  onViewOrder: (orderId: string) => void;
}

function Row({ label, value, valueClass = 'text-foreground', bold }: { label: string; value: string; valueClass?: string; bold?: boolean }) {
  return (
    <View className="flex-row items-center justify-between" style={{ gap: 10 }}>
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className={`text-xs ${bold ? 'font-bold' : 'font-semibold'} ${valueClass} text-right flex-1`}>{value}</Text>
    </View>
  );
}

function Notice({ icon, title, text, tone }: { icon: React.ReactNode; title: string; text: string; tone: 'primary' | 'warning' | 'danger' }) {
  const colors = {
    primary: { bg: '#EFF6FF', border: '#BFDBFE', title: '#1E3A8A', text: '#1D4ED8' },
    warning: { bg: '#FFFBEB', border: '#FDE68A', title: '#78350F', text: '#92400E' },
    danger: { bg: '#FEF2F2', border: '#FECACA', title: '#7F1D1D', text: '#991B1B' },
  }[tone];
  return (
    <View className="flex-row items-start rounded-xl border p-3" style={{ gap: 8, backgroundColor: colors.bg, borderColor: colors.border }}>
      {icon}
      <View className="flex-1">
        <Text className="text-xs font-semibold" style={{ color: colors.title }}>{title}</Text>
        <Text className="text-[11px] leading-4 mt-0.5" style={{ color: colors.text }}>{text}</Text>
      </View>
    </View>
  );
}

/** Hộp xác nhận mua gói lượt (giống web PurchaseDialog): xác nhận → kết quả (thành công / chờ PayOS). */
export function PurchaseCreditsModal({ visible, purchase, onClose, onPurchased, onViewOrder }: PurchaseCreditsModalProps) {
  const { selectedPackage, idempotencyKey, isSubmitting, isFeatureDisabled, lastError, hasPendingRetry, successResult, pendingOrder } = purchase;
  if (!selectedPackage) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    purchase.reset();
    onClose();
  };

  const handleExecute = async () => {
    const outcome = await purchase.executePurchase();
    if (outcome.kind === 'paid') onPurchased();
  };

  const renderSuccess = () => {
    if (!successResult) return null;
    const status = getCreditOrderStatusConfig(successResult.order.status);
    return (
      <View style={{ gap: 16 }}>
        <View className="items-center" style={{ gap: 6 }}>
          <View className="h-14 w-14 rounded-full bg-emerald-100 items-center justify-center">
            <CheckCircle2 size={32} color="#059669" />
          </View>
          <Text className="text-lg font-bold text-foreground text-center">Mua lượt tư vấn thành công!</Text>
          <Text className="text-xs text-muted-foreground text-center">Lượt tư vấn đã được cộng vào ví của bạn.</Text>
        </View>
        <View className="rounded-xl border border-border bg-muted/30 p-4" style={{ gap: 8 }}>
          <Row label="Mã đơn hàng:" value={`#${successResult.order.id}`} />
          <Row label="Gói đã mua:" value={successResult.order.packageName} />
          <Row label="Số lượt nhận:" value={`+${formatCreditQuantity(successResult.order.creditQuantity)}`} valueClass="text-emerald-600" bold />
          <Row label="Tổng thanh toán:" value={formatVND(successResult.order.amountVnd)} bold />
          <Row label="Phương thức:" value={getCreditPaymentProviderLabel(successResult.payment?.provider)} />
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-muted-foreground">Trạng thái:</Text>
            <View className="px-2 py-0.5 rounded-full border" style={{ backgroundColor: status.bg, borderColor: status.border }}>
              <Text className="text-[11px] font-bold" style={{ color: status.text }}>{status.label}</Text>
            </View>
          </View>
        </View>
        <View className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1" style={{ gap: 10 }}>
            <Coins size={20} color="#059669" />
            <View className="flex-1">
              <Text className="text-xs font-medium text-emerald-900">Số dư khả dụng hiện tại</Text>
              <Text className="text-[11px] text-emerald-700">
                Tổng: {successResult.wallet.balance} | Tạm giữ: {successResult.wallet.reserved}
              </Text>
            </View>
          </View>
          <Text className="text-lg font-black text-emerald-700">{formatCreditQuantity(successResult.wallet.available)}</Text>
        </View>
        <View className="flex-row" style={{ gap: 10 }}>
          <Pressable
            onPress={() => {
              const id = String(successResult.order.id);
              handleClose();
              onViewOrder(id);
            }}
            className="flex-1 h-11 rounded-xl border border-border bg-white items-center justify-center active:opacity-80"
          >
            <Text className="text-xs font-semibold text-foreground">Xem chi tiết đơn</Text>
          </Pressable>
          <Pressable onPress={handleClose} className="flex-1 h-11 rounded-xl bg-primary items-center justify-center active:opacity-90">
            <Text className="text-xs font-bold text-white">Hoàn tất</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderPending = () => {
    if (!pendingOrder) return null;
    const status = getCreditOrderStatusConfig(pendingOrder.order.status);
    const checkoutUrl = pendingOrder.payment?.checkoutUrl;
    return (
      <View style={{ gap: 16 }}>
        <View className="items-center" style={{ gap: 6 }}>
          <View className="h-14 w-14 rounded-full bg-amber-100 items-center justify-center">
            <Clock size={30} color="#D97706" />
          </View>
          <Text className="text-lg font-bold text-foreground text-center">Đang chờ thanh toán</Text>
          <Text className="text-xs text-muted-foreground text-center leading-5">
            Hệ thống đang tự động đồng bộ khi nhận được giao dịch từ PayOS. Nếu bạn đã thanh toán, bấm “Kiểm tra lại”.
          </Text>
        </View>
        <View className="rounded-xl border border-border bg-muted/30 p-4" style={{ gap: 8 }}>
          <Row label="Mã đơn hàng:" value={`#${pendingOrder.order.id}`} />
          <Row label="Tên gói lượt:" value={pendingOrder.order.packageName} />
          <Row label="Tổng tiền:" value={formatVND(pendingOrder.order.amountVnd)} bold />
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-muted-foreground">Trạng thái đơn:</Text>
            <View className="px-2 py-0.5 rounded-full border" style={{ backgroundColor: status.bg, borderColor: status.border }}>
              <Text className="text-[11px] font-bold" style={{ color: status.text }}>{status.label}</Text>
            </View>
          </View>
        </View>
        {checkoutUrl?.startsWith('https://') ? (
          <Pressable onPress={() => void WebBrowser.openBrowserAsync(checkoutUrl)} className="h-11 rounded-xl bg-primary items-center justify-center active:opacity-90">
            <Text className="text-xs font-bold text-white">Mở trang thanh toán PayOS</Text>
          </Pressable>
        ) : null}
        <View className="flex-row" style={{ gap: 10 }}>
          <Pressable onPress={handleClose} className="flex-1 h-11 rounded-xl border border-border bg-white items-center justify-center active:opacity-80">
            <Text className="text-xs font-semibold text-foreground">Đóng</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              const latest = await purchase.pollOrder(String(pendingOrder.order.id), 1);
              if (latest?.order.status === 'PAID') {
                purchase.reset();
                onPurchased();
                onClose();
                onViewOrder(String(latest.order.id));
              }
            }}
            className="flex-1 h-11 rounded-xl border border-primary/40 bg-primary/5 items-center justify-center active:opacity-80"
          >
            <Text className="text-xs font-semibold text-primary">Kiểm tra lại</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderConfirm = () => (
    <View style={{ gap: 14 }}>
      <View>
        <View className="flex-row items-center self-start px-2.5 py-1 rounded-full bg-primary/10 mb-2" style={{ gap: 6 }}>
          <CreditCard size={13} color="#0D6EFD" />
          <Text className="text-xs font-semibold text-primary">Xác nhận mua lượt tư vấn</Text>
        </View>
        <Text className="text-lg font-bold text-foreground">{selectedPackage.name}</Text>
        <Text className="text-xs text-muted-foreground mt-0.5">Vui lòng kiểm tra lại thông tin gói trước khi tiến hành thanh toán.</Text>
      </View>

      <Notice
        tone="primary"
        icon={<ShieldCheck size={16} color="#2563EB" />}
        title="Giao dịch được bảo vệ"
        text="Hệ thống tự động bảo toàn mã giao dịch duy nhất (Idempotency-Key) nhằm đảm bảo an toàn tuyệt đối, không phát sinh trùng lặp."
      />

      <View className="rounded-xl border border-border bg-card p-4" style={{ gap: 8 }}>
        <Row label="Mã gói tham chiếu:" value={selectedPackage.code || `#${selectedPackage.id}`} />
        <Row label="Số lượt tư vấn nhận:" value={`+${formatCreditQuantity(selectedPackage.creditQuantity)}`} valueClass="text-emerald-600" bold />
        <View className="flex-row items-center justify-between pt-2 border-t border-border/60">
          <Text className="text-xs font-medium text-muted-foreground">Giá gói (VND):</Text>
          <Text className="text-lg font-black text-foreground">{formatVND(selectedPackage.priceVnd)}</Text>
        </View>
      </View>

      {hasPendingRetry && !isFeatureDisabled ? (
        <Notice
          tone="warning"
          icon={<RefreshCw size={16} color="#D97706" />}
          title="Tiếp tục yêu cầu trước đó"
          text="Lần kết nối trước bị gián đoạn mạng hoặc chưa nhận được kết quả. Hệ thống sẽ tiếp tục kiểm tra lại với cùng mã giao dịch an toàn."
        />
      ) : null}

      {lastError ? (
        <Notice tone="danger" icon={<AlertCircle size={16} color="#DC2626" />} title={isFeatureDisabled ? 'Chức năng chưa mở' : 'Không thể hoàn tất giao dịch'} text={lastError} />
      ) : null}

      <View className="flex-row items-center justify-between px-1">
        <Text className="text-[10px] text-muted-foreground">Idempotency-Key:</Text>
        <Text className="text-[10px] text-muted-foreground" numberOfLines={1}>{idempotencyKey ? `${idempotencyKey.slice(0, 18)}...` : '--'}</Text>
      </View>

      <View className="flex-row" style={{ gap: 10 }}>
        <Pressable onPress={handleClose} disabled={isSubmitting} className="flex-1 h-11 rounded-xl border border-border bg-white items-center justify-center active:opacity-80">
          <Text className="text-xs font-semibold text-foreground">Đóng</Text>
        </Pressable>
        <Pressable
          onPress={handleExecute}
          disabled={isSubmitting || isFeatureDisabled}
          className="flex-1 h-11 rounded-xl bg-primary flex-row items-center justify-center active:opacity-90"
          style={{ gap: 6, opacity: isSubmitting || isFeatureDisabled ? 0.6 : 1 }}
        >
          {isSubmitting ? <ActivityIndicator size="small" color="#FFFFFF" /> : hasPendingRetry ? <RefreshCw size={15} color="#FFFFFF" /> : <ShieldCheck size={15} color="#FFFFFF" />}
          <Text className="text-xs font-bold text-white">{isSubmitting ? 'Đang xử lý mua...' : hasPendingRetry ? 'Thử lại giao dịch' : 'Xác nhận mua lượt'}</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-background rounded-t-3xl max-h-[90%] px-5 pt-4 pb-6">
          <View className="flex-row justify-end mb-1">
            <Pressable onPress={handleClose} disabled={isSubmitting} className="h-8 w-8 rounded-full bg-muted items-center justify-center active:opacity-70">
              <X size={18} color="#0F172A" />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {successResult ? renderSuccess() : pendingOrder ? renderPending() : renderConfirm()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
