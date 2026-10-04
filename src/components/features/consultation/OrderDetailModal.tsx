import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { Coins, ShoppingBag, X } from 'lucide-react-native';
import { creditsApi } from '@/services/credits.service';
import { readCreditsError } from '@/hooks/useCreditsData';
import {
  formatCreditQuantity,
  getCreditOrderStatusConfig,
  getCreditPaymentProviderLabel,
  getCreditPaymentStatusConfig,
} from '@/constants/credits';
import i18n from '@/i18n';
import { formatDateTime, formatVND } from '@/utils/formatters';
import type { CreditOrderDetail, CreditWallet } from '@/types/credits';

interface OrderDetailModalProps {
  orderId: string | null;
  onClose: () => void;
  onWalletUpdated?: (wallet: CreditWallet) => void;
}

const unwrap = <T,>(res: unknown): T => {
  const body = (res as { data?: { data?: T } })?.data;
  return (body?.data ?? body) as T;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between" style={{ gap: 10 }}>
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="text-xs font-semibold text-foreground text-right flex-1">{value}</Text>
    </View>
  );
}

function StatusPill({ label, bg, text, border }: { label: string; bg: string; text: string; border: string }) {
  return (
    <View className="px-2 py-0.5 rounded-full border" style={{ backgroundColor: bg, borderColor: border }}>
      <Text className="text-[11px] font-bold" style={{ color: text }}>{label}</Text>
    </View>
  );
}

/** Chi tiết đơn mua lượt (giống web OrderDetailDialog): thông tin đơn, thanh toán, mở PayOS, hủy đơn. */
export function OrderDetailModal({ orderId, onClose, onWalletUpdated }: OrderDetailModalProps) {
  const { t } = useTranslation('credits');
  const [detail, setDetail] = useState<CreditOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  // Mốc thời gian lúc tải đơn, để biết link thanh toán đã hết hạn chưa (không gọi Date.now() khi render)
  const [loadedAt, setLoadedAt] = useState(0);

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const data = unwrap<CreditOrderDetail>(await creditsApi.getOrder(orderId));
      setDetail(data);
      setLoadedAt(Date.now());
      if (data?.wallet) onWalletUpdated?.(data.wallet);
    } catch (err) {
      setError(readCreditsError(err, i18n.t('credits:orderDetail.loadError')).message);
    } finally {
      setLoading(false);
    }
  }, [orderId, onWalletUpdated]);

  useEffect(() => {
    if (!orderId) return;
    queueMicrotask(() => {
      setDetail(null);
      void load();
    });
  }, [orderId, load]);

  const handleCancel = () => {
    if (!orderId) return;
    Alert.alert(t('orderDetail.cancelOrder'), t('orderDetail.cancelConfirm'), [
      { text: t('common:actions.no'), style: 'cancel' },
      {
        text: t('orderDetail.cancelOrder'),
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            const data = unwrap<CreditOrderDetail>(await creditsApi.cancelOrder(orderId));
            setDetail(data);
            if (data?.wallet) onWalletUpdated?.(data.wallet);
            Alert.alert(t('orderDetail.toast.cancelledTitle'), t('orderDetail.toast.cancelledDescription'));
          } catch (err) {
            Alert.alert(t('orderDetail.toast.cancelFailedTitle'), readCreditsError(err, t('orderDetail.toast.tryLater')).message);
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const order = detail?.order;
  const payment = detail?.payment;
  const orderStatus = order ? getCreditOrderStatusConfig(order.status) : null;
  const paymentStatus = payment ? getCreditPaymentStatusConfig(payment.status) : null;
  const linkExpired = payment?.expiresAt ? new Date(payment.expiresAt).getTime() < loadedAt : false;
  const canPay = order?.status === 'PENDING_PAYMENT' && payment?.status === 'PENDING' && !!payment.checkoutUrl?.startsWith('https://') && !linkExpired;

  return (
    <Modal visible={!!orderId} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-background rounded-t-3xl max-h-[90%] px-5 pt-4 pb-6">
          <View className="flex-row items-center justify-between pb-3 border-b border-border">
            <View className="flex-row items-center" style={{ gap: 10 }}>
              <View className="h-10 w-10 rounded-full bg-primary/10 items-center justify-center">
                <ShoppingBag size={20} color="#0D6EFD" />
              </View>
              <View>
                <Text className="text-xs text-muted-foreground">{t('orderDetail.badge')}</Text>
                <Text className="font-bold text-foreground text-base">{order ? t('orderDetail.titleWithId', { id: order.id }) : t('orderDetail.title')}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} className="h-8 w-8 rounded-full bg-muted items-center justify-center active:opacity-70" accessibilityLabel={t('common:actions.close')}>
              <X size={18} color="#0F172A" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 16, gap: 14 }}>
            {loading && !detail ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#0D6EFD" />
              </View>
            ) : error && !detail ? (
              <View className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                <Text className="text-rose-700 text-xs font-semibold">{error}</Text>
              </View>
            ) : order ? (
              <>
                <View className="rounded-xl border border-border bg-card p-4" style={{ gap: 8 }}>
                  <Text className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">{t('orderDetail.orderInfo')}</Text>
                  <Row label={t('orderDetail.packageName')} value={order.packageName} />
                  <Row label={t('orderDetail.packageCode')} value={order.packageCode || '--'} />
                  <Row label={t('orderDetail.creditsGranted')} value={formatCreditQuantity(order.creditQuantity)} />
                  <Row label={t('orderDetail.totalAmount')} value={formatVND(order.amountVnd)} />
                  <Row label={t('orderDetail.createdAt')} value={formatDateTime(order.createdAt)} />
                  {order.paidAt ? <Row label={t('orderDetail.paidAt')} value={formatDateTime(order.paidAt)} /> : null}
                  <View className="flex-row items-center justify-between pt-2 border-t border-border/60">
                    <Text className="text-xs text-muted-foreground">{t('purchaseDialog.status')}</Text>
                    {orderStatus ? <StatusPill {...orderStatus} /> : null}
                  </View>
                </View>

                {payment ? (
                  <View className="rounded-xl border border-border bg-card p-4" style={{ gap: 8 }}>
                    <Text className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">{t('orderDetail.payment')}</Text>
                    <Row label={t('orderDetail.gateway')} value={getCreditPaymentProviderLabel(payment.provider)} />
                    {payment.orderCode ? <Row label={t('orderDetail.payosOrderCode')} value={String(payment.orderCode)} /> : null}
                    {payment.expiresAt ? <Row label={t('orderDetail.expiresAt')} value={formatDateTime(payment.expiresAt)} /> : null}
                    <Row label={t('orderDetail.attemptId')} value={String(payment.attemptId)} />
                    <View className="flex-row items-center justify-between pt-2 border-t border-border/60">
                      <Text className="text-xs text-muted-foreground">{t('paymentResult.paymentStatus')}</Text>
                      {paymentStatus ? <StatusPill {...paymentStatus} /> : null}
                    </View>
                    {linkExpired && order.status === 'PENDING_PAYMENT' ? (
                      <Text className="text-[11px] text-rose-600 font-medium">{t('orderDetail.linkExpired')}</Text>
                    ) : null}
                  </View>
                ) : null}

                {detail?.wallet ? (
                  <View className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1" style={{ gap: 10 }}>
                      <Coins size={20} color="#059669" />
                      <View className="flex-1">
                        <Text className="text-xs font-medium text-emerald-900">{t('orderDetail.currentBalance')}</Text>
                        <Text className="text-[11px] text-emerald-700">
                          {t('orderDetail.walletBreakdown', { balance: detail.wallet.balance, reserved: detail.wallet.reserved })}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-lg font-black text-emerald-700">{formatCreditQuantity(detail.wallet.available)}</Text>
                  </View>
                ) : null}

                {canPay ? (
                  <Pressable
                    onPress={async () => {
                      await WebBrowser.openBrowserAsync(payment!.checkoutUrl as string);
                      void load();
                    }}
                    className="h-11 rounded-xl bg-primary items-center justify-center active:opacity-90"
                  >
                    <Text className="text-xs font-bold text-white">{t('paymentResult.openPayos')}</Text>
                  </Pressable>
                ) : null}

                <View className="flex-row" style={{ gap: 10 }}>
                  {order.status === 'PENDING_PAYMENT' ? (
                    <Pressable
                      onPress={handleCancel}
                      disabled={cancelling}
                      className="flex-1 h-11 rounded-xl border border-rose-200 bg-white items-center justify-center active:opacity-80"
                      style={{ opacity: cancelling ? 0.6 : 1 }}
                    >
                      <Text className="text-xs font-semibold text-rose-600">{cancelling ? t('orderDetail.cancelling') : t('orderDetail.cancelOrder')}</Text>
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => void load()} className="flex-1 h-11 rounded-xl border border-border bg-white items-center justify-center active:opacity-80">
                    <Text className="text-xs font-semibold text-foreground">{t('common:actions.refresh')}</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
