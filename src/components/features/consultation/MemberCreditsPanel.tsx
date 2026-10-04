import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';
import { AlertCircle, ChevronLeft, ChevronRight, Coins, History, Package, RefreshCw, ShoppingBag, ShoppingCart } from 'lucide-react-native';
import { useCreditsData, PAYMENT_DATE_PRESETS } from '@/hooks/useCreditsData';
import { useCreditPurchase } from '@/hooks/useCreditPurchase';
import {
  CREDIT_ORDER_STATUS_CONFIG,
  formatCreditQuantity,
  getCreditOperationConfig,
  getCreditOrderStatusConfig,
  getCreditSourceTypeLabel,
} from '@/constants/credits';
import { currentIntlLocale } from '@/i18n';
import { formatDateTime, formatVND } from '@/utils/formatters';
import { PurchaseCreditsModal } from './PurchaseCreditsModal';
import { OrderDetailModal } from './OrderDetailModal';
import type { CreditOrderStatus, CreditPackage, CreditWallet } from '@/types/credits';

type SubTab = 'packages' | 'orders' | 'ledger';

interface MemberCreditsPanelProps {
  onWalletChanged?: (wallet: CreditWallet) => void;
}

function Pill({ label, bg, text, border }: { label: string; bg: string; text: string; border: string }) {
  return (
    <View className="px-2 py-0.5 rounded-full border self-start" style={{ backgroundColor: bg, borderColor: border }}>
      <Text className="text-[11px] font-bold" style={{ color: text }}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <View>
      <Text className="text-base font-bold text-foreground">{title}</Text>
      <Text className="text-xs text-muted-foreground">{description}</Text>
    </View>
  );
}

function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation('common');
  return (
    <View className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 items-center" style={{ gap: 8 }}>
      <AlertCircle size={32} color="#DC2626" />
      <Text className="text-xs text-rose-700 text-center">{message}</Text>
      <Pressable onPress={onRetry} className="flex-row items-center h-9 px-3 rounded-xl border border-border bg-white active:opacity-80" style={{ gap: 6 }}>
        <RefreshCw size={14} color="#334155" />
        <Text className="text-xs font-semibold text-foreground">{t('actions.retry')}</Text>
      </Pressable>
    </View>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  i18nKey,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  i18nKey: 'ordersTable.pagination' | 'ledgerTable.pagination';
  onChange: (p: number) => void;
}) {
  const { t } = useTranslation('credits');
  if (total === 0) return null;
  return (
    <View className="flex-row items-center justify-between mt-2">
      <Text className="text-xs text-muted-foreground">
        <Trans t={t} i18nKey={i18nKey} values={{ page, totalPages, total }} components={{ strong: <Text className="font-bold text-foreground" /> }} />
      </Text>
      <View className="flex-row" style={{ gap: 8 }}>
        <Pressable
          onPress={() => onChange(page - 1)}
          disabled={page <= 1}
          className="h-9 w-9 rounded-xl border border-border bg-white items-center justify-center"
          style={{ opacity: page <= 1 ? 0.4 : 1 }}
          accessibilityLabel={t('common:actions.prev')}
        >
          <ChevronLeft size={16} color="#334155" />
        </Pressable>
        <Pressable
          onPress={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="h-9 w-9 rounded-xl border border-border bg-white items-center justify-center"
          style={{ opacity: page >= totalPages ? 0.4 : 1 }}
          accessibilityLabel={t('common:actions.next')}
        >
          <ChevronRight size={16} color="#334155" />
        </Pressable>
      </View>
    </View>
  );
}

/** Ví lượt tư vấn của hội viên (giống web MemberCreditsPanel): ví, gói lượt, lịch sử đơn mua, biến động lượt. */
export function MemberCreditsPanel({ onWalletChanged }: MemberCreditsPanelProps) {
  const { t } = useTranslation('credits');
  const data = useCreditsData();
  const purchase = useCreditPurchase();
  const [subTab, setSubTab] = useState<SubTab>('packages');
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);

  const anyLoading = data.loadingWallet || data.loadingPackages || data.loadingOrders || data.loadingLedger || data.loadingOverview;

  const handleWalletUpdated = (wallet: CreditWallet) => {
    data.setWallet(wallet);
    onWalletChanged?.(wallet);
  };

  const handleSelectPackage = (pkg: CreditPackage) => {
    purchase.selectPackage(pkg);
    setPurchaseOpen(true);
  };

  const handlePurchased = () => {
    if (purchase.successResult?.wallet) handleWalletUpdated(purchase.successResult.wallet);
    void data.refreshAll();
  };

  const available = data.wallet?.available ?? 0;
  const reserved = data.wallet?.reserved ?? 0;

  const renderWallet = () => {
    if (data.loadingWallet && !data.wallet) {
      return (
        <View className="rounded-2xl border border-border bg-card p-5 items-center">
          <ActivityIndicator color="#0D6EFD" />
        </View>
      );
    }
    if (data.walletError && !data.wallet) {
      return <ErrorBox message={`${t('wallet.loadError')}. ${data.walletError}`} onRetry={() => void data.loadWallet()} />;
    }
    return (
      <View className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-5 overflow-hidden">
        <View className="absolute right-4 top-4 opacity-10">
          <Coins size={96} color="#059669" />
        </View>
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <View className="p-1.5 rounded-md bg-emerald-100">
            <Coins size={16} color="#047857" />
          </View>
          <Text className="text-sm font-semibold text-emerald-900">{t('wallet.availableTitle')}</Text>
        </View>
        <View className="flex-row items-end mt-2" style={{ gap: 6 }}>
          <Text className="text-4xl font-extrabold text-emerald-700 tracking-tight">{available.toLocaleString(currentIntlLocale())}</Text>
          <Text className="text-base font-semibold text-emerald-600 mb-1.5">{t('wallet.unit', { count: available })}</Text>
        </View>
        <Text className="text-xs text-muted-foreground mt-1">{t('wallet.readyHint')}</Text>
        {reserved > 0 ? (
          <View className="self-start mt-2 rounded-full bg-amber-100 px-2 py-0.5">
            <Text className="text-[11px] font-medium text-amber-800">{t('wallet.reservedHint', { count: reserved })}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderPackages = () => {
    if (data.loadingPackages) {
      return (
        <View className="py-10 items-center">
          <ActivityIndicator color="#0D6EFD" />
        </View>
      );
    }
    if (data.isFeatureDisabled) {
      return (
        <View className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 items-center" style={{ gap: 8 }}>
          <AlertCircle size={36} color="#D97706" />
          <Text className="text-sm font-semibold text-amber-800 text-center">{t('packagesGrid.disabledTitle')}</Text>
          <Text className="text-xs text-amber-700 text-center leading-5">{t('packagesGrid.disabledDescription')}</Text>
          <Pressable onPress={() => void data.loadPackages()} className="flex-row items-center h-9 px-3 rounded-xl border border-border bg-white active:opacity-80" style={{ gap: 6 }}>
            <RefreshCw size={14} color="#334155" />
            <Text className="text-xs font-semibold text-foreground">{t('packagesGrid.checkAgain')}</Text>
          </Pressable>
        </View>
      );
    }
    if (data.packagesError) return <ErrorBox message={`${t('packagesGrid.loadError')}. ${data.packagesError}`} onRetry={() => void data.loadPackages()} />;
    if (data.packages.length === 0) {
      return (
        <View className="rounded-2xl border border-dashed border-border p-8 items-center" style={{ gap: 8 }}>
          <Package size={40} color="#94A3B8" />
          <Text className="text-sm font-semibold text-foreground">{t('packagesGrid.emptyTitle')}</Text>
          <Text className="text-xs text-muted-foreground text-center">{t('packagesGrid.emptyDescription')}</Text>
        </View>
      );
    }
    return (
      <View style={{ gap: 12 }}>
        {data.packages.map((pkg) => (
          <View key={pkg.id} className="rounded-2xl border border-border bg-card p-5" style={{ gap: 12 }}>
            <View className="flex-row items-start justify-between">
              <Pill label={pkg.code || t('packagesGrid.defaultCode')} bg="#EFF6FF" text="#1D4ED8" border="#BFDBFE" />
              <Text className="text-[11px] text-muted-foreground">#{pkg.id}</Text>
            </View>
            <View>
              <Text className="text-lg font-bold text-foreground" numberOfLines={1}>{pkg.name}</Text>
              <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={2}>
                {pkg.description || t('packagesGrid.defaultDescription')}
              </Text>
            </View>
            <View className="pt-2 border-t border-border/60" style={{ gap: 6 }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-muted-foreground">{t('packagesGrid.creditsReceived')}</Text>
                <Text className="text-base font-extrabold text-emerald-700">{formatCreditQuantity(pkg.creditQuantity)}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-muted-foreground">{t('packagesGrid.price')}</Text>
                <Text className="text-xl font-black text-foreground">{formatVND(pkg.priceVnd)}</Text>
              </View>
            </View>
            <Pressable onPress={() => handleSelectPackage(pkg)} className="h-11 rounded-xl bg-primary flex-row items-center justify-center active:opacity-90" style={{ gap: 8 }}>
              <ShoppingCart size={16} color="#FFFFFF" />
              <Text className="text-white font-bold text-sm">{t('packagesGrid.buy')}</Text>
            </Pressable>
          </View>
        ))}
      </View>
    );
  };

  const renderOrders = () => {
    const overview = data.overview;
    const statusKeys = Object.keys(CREDIT_ORDER_STATUS_CONFIG) as CreditOrderStatus[];
    const orders = data.orders?.content ?? [];
    const successfulOrders = overview?.successfulOrderCount ?? 0;
    return (
      <View style={{ gap: 14 }}>
        {/* KPI */}
        <View className="flex-row flex-wrap" style={{ gap: 10 }}>
          {[
            { label: t('memberKpi.totalPaid'), value: formatVND(overview?.totalPaidVnd ?? 0), hint: t('memberKpi.totalPaidHint') },
            { label: t('memberKpi.totalPurchasedCredits'), value: formatCreditQuantity(overview?.totalPurchasedCredits ?? 0), hint: t('memberKpi.totalPurchasedHint') },
            {
              label: t('memberKpi.successfulOrders'),
              value: `${successfulOrders} ${t('memberKpi.orderUnit', { count: successfulOrders })}`,
              hint: t('memberKpi.successfulOrdersHint'),
            },
            {
              label: t('memberKpi.availableCreditsNow'),
              value: formatCreditQuantity(available),
              hint: `${t('memberKpi.balance', { value: data.wallet?.balance ?? 0 })} • ${t('memberKpi.reserved', { value: reserved })}`,
            },
          ].map((kpi) => (
            <View key={kpi.label} className="rounded-2xl border border-border bg-card p-3.5" style={{ width: '48%', flexGrow: 1 }}>
              <Text className="text-[11px] text-muted-foreground">{kpi.label}</Text>
              <Text className="text-base font-bold text-foreground mt-1">{data.loadingOverview && !overview ? '...' : kpi.value}</Text>
              <Text className="text-[10px] text-muted-foreground mt-0.5">{kpi.hint}</Text>
            </View>
          ))}
        </View>
        {overview?.firstPaidAt || overview?.lastPaidAt ? (
          <Text className="text-[11px] text-muted-foreground">
            {t('memberKpi.firstPaidAt')} {formatDateTime(overview.firstPaidAt)} • {t('memberKpi.lastPaidAt')} {formatDateTime(overview.lastPaidAt)}
          </Text>
        ) : null}

        {/* Bộ lọc */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {PAYMENT_DATE_PRESETS.map((p) => {
            const active = data.datePreset === p.key;
            return (
              <Pressable key={p.key} onPress={() => data.changeDatePreset(p.key)} className={`px-3 py-1.5 rounded-full border ${active ? 'bg-primary border-primary' : 'bg-white border-border'}`}>
                <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-muted-foreground'}`}>{p.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Pressable onPress={() => data.changeOrderStatus(undefined)} className={`px-3 py-1.5 rounded-full border ${!data.orderStatus ? 'bg-slate-800 border-slate-800' : 'bg-white border-border'}`}>
            <Text className={`text-xs font-semibold ${!data.orderStatus ? 'text-white' : 'text-muted-foreground'}`}>{t('filters.allStatuses')}</Text>
          </Pressable>
          {statusKeys.map((key) => {
            const cfg = CREDIT_ORDER_STATUS_CONFIG[key];
            const active = data.orderStatus === key;
            return (
              <Pressable key={key} onPress={() => data.changeOrderStatus(key)} className="px-3 py-1.5 rounded-full border" style={{ backgroundColor: active ? cfg.text : '#FFFFFF', borderColor: active ? cfg.text : '#E2E8F0' }}>
                <Text className="text-xs font-semibold" style={{ color: active ? '#FFFFFF' : '#64748B' }}>{cfg.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {data.loadingOrders && !data.orders ? (
          <View className="py-10 items-center"><ActivityIndicator color="#0D6EFD" /></View>
        ) : data.ordersError ? (
          <ErrorBox message={data.ordersError} onRetry={() => data.changeOrdersPage(data.ordersPage)} />
        ) : orders.length === 0 ? (
          <View className="rounded-2xl border border-dashed border-border p-8 items-center" style={{ gap: 6 }}>
            <ShoppingBag size={36} color="#94A3B8" />
            <Text className="text-sm font-semibold text-foreground">
              {data.datePreset !== 'all' || data.orderStatus ? t('ordersTable.filteredEmptyTitle') : t('ordersTable.emptyTitle')}
            </Text>
            <Text className="text-xs text-muted-foreground text-center">
              {data.datePreset !== 'all' || data.orderStatus ? t('ordersTable.filteredEmptyDescription') : t('ordersTable.emptyDescription')}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {orders.map((order) => {
              const cfg = getCreditOrderStatusConfig(order.status);
              return (
                <Pressable key={order.id} onPress={() => setDetailOrderId(String(order.id))} className="rounded-2xl border border-border bg-card p-4 active:opacity-80" style={{ gap: 6 }}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-bold text-foreground">{t('ordersTable.orderNumber', { id: order.id })}</Text>
                    <Pill {...cfg} />
                  </View>
                  <Text className="text-sm font-semibold text-foreground">{order.packageName}</Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-muted-foreground">{formatCreditQuantity(order.creditQuantity)} • {formatVND(order.amountVnd)}</Text>
                    <Text className="text-[11px] text-muted-foreground">{formatDateTime(order.createdAt)}</Text>
                  </View>
                  {order.status === 'PENDING_PAYMENT' ? <Text className="text-xs font-semibold text-primary">{t('ordersTable.resumePayment')} →</Text> : null}
                </Pressable>
              );
            })}
          </View>
        )}
        <Pagination page={data.ordersPage} totalPages={data.orders?.totalPages ?? 1} total={data.orders?.totalElements ?? 0} i18nKey="ordersTable.pagination" onChange={data.changeOrdersPage} />
      </View>
    );
  };

  const renderLedger = () => {
    const entries = data.ledger?.content ?? [];
    if (data.loadingLedger && !data.ledger) return <View className="py-10 items-center"><ActivityIndicator color="#0D6EFD" /></View>;
    if (data.ledgerError) return <ErrorBox message={data.ledgerError} onRetry={() => void data.loadLedger(data.ledgerPage)} />;
    if (entries.length === 0) {
      return (
        <View className="rounded-2xl border border-dashed border-border p-8 items-center" style={{ gap: 6 }}>
          <History size={36} color="#94A3B8" />
          <Text className="text-sm font-semibold text-foreground">{t('ledgerTable.emptyTitle')}</Text>
          <Text className="text-xs text-muted-foreground text-center">{t('ledgerTable.emptyDescription')}</Text>
        </View>
      );
    }
    const signed = (n: number) => `${n > 0 ? '+' : ''}${n}`;
    const deltaLabel = (n: number) => t('ledgerTable.deltaCredits', { value: signed(n), count: Math.abs(n) });
    return (
      <View style={{ gap: 10 }}>
        {entries.map((entry) => {
          const op = getCreditOperationConfig(entry.operation);
          const availableDelta = entry.deltaBalance - entry.deltaReserved;
          const isOrder = entry.sourceType === 'PURCHASE_ORDER';
          return (
            <View key={entry.id} className="rounded-2xl border border-border bg-card p-4" style={{ gap: 8 }}>
              <View className="flex-row items-center justify-between">
                <Pill {...op} />
                <Text className="text-[11px] text-muted-foreground">{formatDateTime(entry.createdAt)}</Text>
              </View>
              <Text className="text-xs text-muted-foreground">{op.description}</Text>
              <View className="flex-row" style={{ gap: 10 }}>
                <View className="flex-1 rounded-xl bg-muted/40 p-2.5">
                  <Text className="text-[10px] text-muted-foreground">{t('ledgerTable.columns.available')}</Text>
                  <Text className="text-sm font-bold" style={{ color: availableDelta >= 0 ? '#047857' : '#B91C1C' }}>{deltaLabel(availableDelta)}</Text>
                </View>
                <View className="flex-1 rounded-xl bg-muted/40 p-2.5">
                  <Text className="text-[10px] text-muted-foreground">{t('ledgerTable.columns.total')}</Text>
                  <Text className="text-sm font-bold text-foreground">{deltaLabel(entry.deltaBalance)}</Text>
                </View>
                <View className="flex-1 rounded-xl bg-muted/40 p-2.5">
                  <Text className="text-[10px] text-muted-foreground">{t('ledgerTable.columns.balanceAfter')}</Text>
                  <Text className="text-sm font-bold text-foreground">{entry.balanceAfter}</Text>
                  <Text className="text-[10px] text-muted-foreground">{t('ledgerTable.availableAfter', { value: entry.balanceAfter - entry.reservedAfter })}</Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-[11px] text-muted-foreground">
                  {t('ledgerTable.columns.source')}: {getCreditSourceTypeLabel(entry.sourceType)} #{entry.sourceId}
                </Text>
                {isOrder ? (
                  <Pressable onPress={() => setDetailOrderId(String(entry.sourceId))} hitSlop={6}>
                    <Text className="text-[11px] font-semibold text-primary">{t('ledgerTable.viewOrder')}</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        })}
        <Pagination page={data.ledgerPage} totalPages={data.ledger?.totalPages ?? 1} total={data.ledger?.totalElements ?? 0} i18nKey="ledgerTable.pagination" onChange={(p) => void data.loadLedger(p)} />
      </View>
    );
  };

  const tabs: { key: SubTab; label: string; Icon: typeof Package }[] = [
    { key: 'packages', label: t('page.tabsShort.packages'), Icon: Package },
    { key: 'orders', label: t('page.tabsShort.orders'), Icon: ShoppingBag },
    { key: 'ledger', label: t('page.tabsShort.ledger'), Icon: History },
  ];

  return (
    <View style={{ gap: 16 }} className="pb-6">
      <View className="flex-row items-start justify-between pb-2 border-b border-border" style={{ gap: 10 }}>
        <View className="flex-1">
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <Coins size={18} color="#0D6EFD" />
            <Text className="text-base font-semibold text-foreground">{t('page.title')}</Text>
          </View>
          <Text className="text-xs text-muted-foreground mt-0.5">{t('page.description')}</Text>
        </View>
        <Pressable
          onPress={() => void data.refreshAll()}
          disabled={anyLoading}
          className="h-9 w-9 rounded-xl border border-border bg-white items-center justify-center active:opacity-80"
          accessibilityLabel={t('page.refresh')}
        >
          {anyLoading ? <ActivityIndicator size="small" color="#0D6EFD" /> : <RefreshCw size={16} color="#334155" />}
        </Pressable>
      </View>

      {renderWallet()}

      <View className="flex-row bg-muted/60 p-1 rounded-xl">
        {tabs.map((tab) => {
          const active = subTab === tab.key;
          return (
            <Pressable key={tab.key} onPress={() => setSubTab(tab.key)} className={`flex-1 py-2 rounded-lg flex-row items-center justify-center ${active ? 'bg-background shadow-xs' : ''}`} style={{ gap: 6 }}>
              <tab.Icon size={14} color={active ? '#0D6EFD' : '#64748B'} />
              <Text className={`text-xs font-bold ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {subTab === 'packages' ? (
        <View style={{ gap: 12 }}>
          <SectionTitle title={t('page.packagesTitle')} description={t('page.packagesDescription')} />
          {renderPackages()}
        </View>
      ) : subTab === 'orders' ? (
        <View style={{ gap: 12 }}>
          <SectionTitle title={t('page.ordersTitle')} description={t('page.ordersSummaryDescription')} />
          {renderOrders()}
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <SectionTitle title={t('page.ledgerTitle')} description={t('page.ledgerDescription')} />
          {renderLedger()}
        </View>
      )}

      <PurchaseCreditsModal
        visible={purchaseOpen}
        purchase={purchase}
        onClose={() => setPurchaseOpen(false)}
        onPurchased={handlePurchased}
        onViewOrder={(id) => setDetailOrderId(id)}
      />
      <OrderDetailModal orderId={detailOrderId} onClose={() => setDetailOrderId(null)} onWalletUpdated={handleWalletUpdated} />
    </View>
  );
}
