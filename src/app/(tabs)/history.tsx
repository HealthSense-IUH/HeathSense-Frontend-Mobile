import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, Eye, HeartPulse, RefreshCw, Search } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { THEME } from '@/constants/theme';
import { useMyRecords } from '@/hooks/useHealthHistory';
import {
  getPredictionMeta,
  matchesRecordStatusFilter,
  PREDICTION_LEGEND,
  RECORD_STATUS_FILTERS,
  RecordStatusFilter,
} from '@/constants/healthRecords';
import { formatRecordDate } from '@/utils/formatters';
import { PredictionBadge } from '@/components/features/health/PredictionBadge';
import type { HealthRecordResponse } from '@/types/health-records';

const PAGE_SIZE = 10;

const shadow = { boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)' };

/** Thẻ một bản ghi đo (dạng thẻ của web: thanh màu trên đầu, ngày, huy hiệu, nhịp tim, xác suất). */
function RecordCard({ record, onPress }: { record: HealthRecordResponse; onPress: () => void }) {
  const { t } = useTranslation('health');
  const meta = getPredictionMeta(record.predictionLabel, record.status);
  const hr = record.hrvFeatures?.HR_mean ? Math.round(Number(record.hrvFeatures.HR_mean)) : null;
  const pct = record.confidence !== null && record.confidence !== undefined ? (record.confidence * 100).toFixed(1) : null;
  const bpm = t('common:units.bpm');

  return (
    <Pressable onPress={onPress} className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden mb-3 active:opacity-80" style={shadow}>
      <View style={{ height: 6, backgroundColor: meta.dot }} />
      <View className="px-4 pt-3.5 pb-4">
        <View className="flex-row items-start justify-between" style={{ gap: 8 }}>
          <Text className="text-sm font-bold text-slate-900 flex-1">{formatRecordDate(record.createdAt)}</Text>
          <PredictionBadge meta={meta} size="sm" />
        </View>
        <View className="flex-row items-center mt-1.5" style={{ gap: 6 }}>
          <HeartPulse size={14} color="#EF4444" />
          <Text className="text-xs text-slate-500 flex-1" numberOfLines={1}>
            {t('afibHistory.card.heartRate', { value: hr ? `${hr} ${bpm}` : `-- ${bpm}` })} • {record.fileName}
          </Text>
        </View>
        <View className="mt-3 rounded-2xl bg-slate-50 border border-slate-200 p-3.5 flex-row items-center justify-between" style={{ gap: 10 }}>
          <View className="flex-1">
            <Text className="text-sm font-semibold" style={{ color: meta.text }}>{meta.label}</Text>
            <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
              {pct !== null ? t('afibHistory.card.afibProbability', { value: pct }) : t('afibHistory.card.file', { name: record.fileName })}
            </Text>
          </View>
          <Eye size={16} color="#94A3B8" />
        </View>
      </View>
    </Pressable>
  );
}

function HeaderButton({ onPress, label, children }: { onPress: () => void; label: string; children: React.ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 items-center justify-center active:opacity-80"
      style={shadow}
      aria-label={label}
    >
      {children}
    </Pressable>
  );
}

/** Tab "Lịch sử đo" — tương ứng trang Lịch sử đo của web: danh sách bản ghi, lọc, chú thích, phân trang. */
export default function HistoryTab() {
  const { t } = useTranslation('health');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState<RecordStatusFilter>('all');
  const { data, isLoading, isFetching, error, refetch } = useMyRecords(page, PAGE_SIZE);

  const records = data?.content ?? [];
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const totalElements = data?.totalElements ?? 0;

  // Lọc trên trang hiện tại (giống web): theo tên file / ngày và theo nhóm kết luận
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return records.filter((r) => {
      if (kw) {
        const matchFile = r.fileName?.toLowerCase().includes(kw);
        const matchDate = formatRecordDate(r.createdAt).toLowerCase().includes(kw) || r.createdAt?.toLowerCase().includes(kw);
        if (!matchFile && !matchDate) return false;
      }
      return matchesRecordStatusFilter(filter, r);
    });
  }, [records, keyword, filter]);

  const header = (
    <View style={{ gap: 12 }} className="mb-3">
      <View className="flex-row items-center bg-white rounded-xl border border-slate-200/70 px-3 h-11" style={{ gap: 8 }}>
        <Search size={16} color="#0D6EFD" />
        <TextInput
          value={keyword}
          onChangeText={setKeyword}
          placeholder={t('afibHistory.searchPlaceholder')}
          placeholderTextColor="#94A3B8"
          className="flex-1 text-xs font-medium text-slate-900 h-full p-0"
          autoCorrect={false}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {RECORD_STATUS_FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              className={`px-3.5 py-2 rounded-full border ${active ? 'bg-[#0D6EFD] border-[#0D6EFD]' : 'bg-white border-slate-200'}`}
            >
              <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-slate-600'}`}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View className="bg-white rounded-2xl border border-slate-200/70 px-4 py-3" style={shadow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
          <Text className="text-xs font-semibold text-slate-800 mr-1">{t('afibHistory.legend')}</Text>
          {PREDICTION_LEGEND.map((m) => (
            <PredictionBadge key={m.key} meta={m} withRange size="sm" />
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View className="py-16 items-center">
          <ActivityIndicator size="large" color="#0D6EFD" />
          <Text className="mt-4 text-slate-500 font-medium text-sm">{t('afibHistory.loading')}</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View className="py-12 items-center">
          <View className="bg-rose-50 border border-rose-200 rounded-2xl p-4 w-full">
            <Text className="text-rose-700 font-semibold text-sm text-center">{t('common:state.loadError')}</Text>
          </View>
        </View>
      );
    }
    return (
      <View className="bg-white rounded-2xl py-12 px-6 items-center" style={{ gap: 8, ...shadow }}>
        <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center">
          <HeartPulse size={30} color="#64748B" />
        </View>
        <Text className="text-base font-bold text-slate-900 mt-1">{t('afibHistory.empty.title')}</Text>
        <Text className="text-xs text-slate-500 text-center leading-5">
          {t('afibHistory.empty.description')}
        </Text>
        <Pressable onPress={() => router.push('/afib-measure' as any)} className="mt-2 px-4 h-9 rounded-xl bg-[#0D6EFD] items-center justify-center active:opacity-90">
          <Text className="text-white text-xs font-semibold">{t('afibHistory.empty.measureNow')}</Text>
        </Pressable>
      </View>
    );
  };

  const footer =
    totalElements > 0 ? (
      <View className="flex-row items-center justify-between mt-1 mb-2">
        <Text className="text-xs text-slate-500">
          {t('common:pagination.pageOfWithCount', { page, total: totalPages, count: totalElements, unit: t('common:pagination.records') })}
        </Text>
        <View className="flex-row" style={{ gap: 8 }}>
          <Pressable
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isFetching}
            className="flex-row items-center px-3 h-9 rounded-xl bg-white border border-slate-200 active:opacity-80"
            style={{ opacity: page <= 1 ? 0.5 : 1, gap: 4 }}
          >
            <ChevronLeft size={14} color="#334155" />
            <Text className="text-xs font-semibold text-slate-700">{t('common:actions.prev')}</Text>
          </Pressable>
          <Pressable
            onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isFetching}
            className="flex-row items-center px-3 h-9 rounded-xl bg-white border border-slate-200 active:opacity-80"
            style={{ opacity: page >= totalPages ? 0.5 : 1, gap: 4 }}
          >
            <Text className="text-xs font-semibold text-slate-700">{t('common:actions.next')}</Text>
            <ChevronRight size={14} color="#334155" />
          </Pressable>
        </View>
      </View>
    ) : null;

  return (
    <ScreenWrapper
      title={t('afibHistory.title')}
      description={t('afibHistory.description')}
      withBottomNav
      scrollable={false}
      headerRight={
        <View className="flex-row" style={{ gap: 8 }}>
          <HeaderButton onPress={() => router.push('/reports' as any)} label={t('reports.title')}>
            <BarChart3 color="#0D6EFD" size={17} strokeWidth={2} />
          </HeaderButton>
          <HeaderButton onPress={() => router.push('/history-dates' as any)} label={t('afibHistory.viewByDay')}>
            <CalendarDays color="#64748B" size={17} strokeWidth={2} />
          </HeaderButton>
          <HeaderButton onPress={() => refetch()} label={t('common:actions.refresh')}>
            {isFetching && !isLoading ? <ActivityIndicator size="small" color="#0D6EFD" /> : <RefreshCw color="#64748B" size={16} strokeWidth={2} />}
          </HeaderButton>
        </View>
      }
    >
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <RecordCard record={item} onPress={() => router.push(`/health-record/${item.id}` as any)} />}
        ListHeaderComponent={header}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={footer}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: THEME.layout.dockHeight + insets.bottom + 48 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => refetch()} tintColor="#0D6EFD" />}
      />
    </ScreenWrapper>
  );
}
