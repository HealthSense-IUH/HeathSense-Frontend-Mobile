import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Clock, Download, FileText, RefreshCw } from 'lucide-react-native';
import { useHealthRecord } from '@/hooks/useHealthHistory';
import { getRecordDownloadUrlApi } from '@/services/health-records';
import { getPredictionMeta, HRV_TABLE_ROWS } from '@/constants/healthRecords';
import { formatHrvNumber, formatRecordDate } from '@/utils/formatters';
import { PredictionBadge } from '@/components/features/health/PredictionBadge';
import { MeasurementVisuals } from '@/components/features/health/MeasurementVisuals';
import type { HrvFeatures } from '@/types/health-records';

/** 4 chỉ số sinh lý chính hiện ở trên bảng HRV (giống web). labelKey = khóa i18n trong namespace health; label = chữ cố định. */
const CORE_TILES: { key: keyof HrvFeatures; label?: string; labelKey?: string; decimals: number; unit: string; range: string }[] = [
  { key: 'HR_mean', labelKey: 'recordDetail.avgHeartRate', decimals: 0, unit: 'BPM', range: '60 - 100 BPM' },
  { key: 'SDNN', label: 'SDNN', decimals: 1, unit: 'ms', range: '30 - 100 ms' },
  { key: 'RMSSD', label: 'RMSSD', decimals: 1, unit: 'ms', range: '20 - 50 ms' },
  { key: 'LF_HF_Ratio', labelKey: 'recordDetail.lfHfRatio', decimals: 2, unit: '', range: '0.5 - 2.0' },
];

const shadow = { boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)' };

export default function HealthRecordDetailScreen() {
  const { t } = useTranslation('health');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: record, isLoading, error, refetch, isFetching } = useHealthRecord(id);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!record) return;
    setDownloading(true);
    try {
      const url = await getRecordDownloadUrlApi(record.id);
      if (!url) {
        Alert.alert(t('common:error.title'), t('recordDetail.downloadUrlNotFound'));
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('common:error.title'), t('recordDetail.downloadUrlFailed'));
    } finally {
      setDownloading(false);
    }
  };

  const renderBody = () => {
    if (isLoading && !record) {
      return (
        <View className="py-20 items-center justify-center">
          <ActivityIndicator size="large" color="#0D6EFD" />
          <Text className="mt-4 text-slate-500 font-medium text-sm">{t('recordDetail.loading')}</Text>
        </View>
      );
    }
    if (!record) {
      return (
        <View className="py-20 items-center px-6">
          <View className="bg-rose-50 border border-rose-200 rounded-2xl p-4 w-full">
            <Text className="text-rose-700 font-semibold text-sm text-center">
              {error ? t('common:state.loadError') : t('recordDetail.notFound')}
            </Text>
          </View>
          <Pressable onPress={() => refetch()} className="mt-4 px-4 py-2.5 rounded-xl bg-white border border-slate-200 active:opacity-80">
            <Text className="text-sm font-semibold text-slate-700">{t('common:actions.retry')}</Text>
          </Pressable>
        </View>
      );
    }

    const meta = getPredictionMeta(record.predictionLabel, record.status);
    const features: HrvFeatures = record.hrvFeatures || {};
    const hasConfidence = record.confidence !== undefined && record.confidence !== null;
    const sizeKb = record.fileSize ? formatHrvNumber(record.fileSize / 1024, 1) : null;

    return (
      <View style={{ gap: 14 }}>
        {/* Tiêu đề + thời gian đo */}
        <View>
          <Text className="text-lg font-bold text-slate-900 tracking-tight">{t('recordDetail.title')}</Text>
          <View className="flex-row items-center mt-1.5" style={{ gap: 6 }}>
            <Clock size={13} color="#64748B" />
            <Text className="text-xs text-slate-500">{t('recordDetail.measuredAt', { date: formatRecordDate(record.createdAt) })}</Text>
          </View>
          <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>{t('recordDetail.file', { name: record.fileName })}</Text>
        </View>

        {/* Kết luận AI */}
        <View className="rounded-2xl bg-white border border-slate-200 p-4" style={shadow}>
          <View className="flex-row items-center flex-wrap" style={{ gap: 8 }}>
            <Text className="text-xs text-slate-500 font-medium">{t('recordDetail.aiConclusion')}</Text>
            <PredictionBadge meta={meta} />
          </View>
          <Text className="text-xs text-slate-500 leading-5 mt-2">{meta.advice}</Text>
          {record.errorMessage ? (
            <View className="mt-3 bg-rose-50 border border-rose-100 rounded-xl p-3">
              <Text className="text-rose-600 text-xs font-medium">{record.errorMessage}</Text>
            </View>
          ) : null}
          {hasConfidence ? (
            <View className="mt-3 pt-3 border-t border-slate-100 flex-row items-center justify-between">
              <Text className="text-xs text-slate-500">{t('recordDetail.afibProbability')}</Text>
              <Text className="text-lg font-bold text-slate-900">{((record.confidence as number) * 100).toFixed(1)}%</Text>
            </View>
          ) : null}
        </View>

        {/* Sóng mạch, SQI, Poincaré */}
        <MeasurementVisuals features={features} />

        {/* 4 chỉ số chính */}
        <View className="flex-row flex-wrap" style={{ gap: 10 }}>
          {CORE_TILES.map((tile) => {
            const value = features[tile.key];
            return (
              <View key={String(tile.key)} className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5" style={{ width: '48%', flexGrow: 1 }}>
                <Text className="text-xs text-slate-500 font-medium">{tile.labelKey ? t(tile.labelKey) : tile.label}</Text>
                <Text className="text-xl font-bold text-slate-900 mt-1">
                  {typeof value === 'number' ? formatHrvNumber(value, tile.decimals) : '--'}
                  {tile.unit ? <Text className="text-xs font-normal text-slate-500"> {tile.unit}</Text> : null}
                </Text>
                <Text className="text-[11px] text-slate-500 mt-0.5">{tile.range}</Text>
              </View>
            );
          })}
        </View>

        {/* Bảng HRV */}
        <View style={{ gap: 8 }}>
          <Text className="text-xs font-semibold text-slate-800 uppercase tracking-wider">{t('recordDetail.hrvTitle')}</Text>
          <View className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <View className="flex-row bg-slate-50 border-b border-slate-200 px-4 py-2.5">
              <Text className="flex-1 text-xs font-semibold text-slate-500">{t('recordDetail.table.metric')}</Text>
              <Text className="text-xs font-semibold text-slate-500">{t('recordDetail.table.value')} / {t('recordDetail.table.referenceRange')}</Text>
            </View>
            {HRV_TABLE_ROWS.map((row, idx) => {
              const value = features[row.key];
              return (
                <View
                  key={row.key}
                  className={`flex-row items-center px-4 py-2.5 ${idx < HRV_TABLE_ROWS.length - 1 ? 'border-b border-slate-100' : ''}`}
                  style={{ gap: 12 }}
                >
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-slate-900">{row.label}</Text>
                    <Text className="text-[11px] text-slate-500 mt-0.5 leading-4">{row.meaning}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs font-semibold text-slate-900">
                      {typeof value === 'number' ? formatHrvNumber(value, row.decimals) : '--'}
                      {row.unit ? ` ${row.unit}` : ''}
                    </Text>
                    <Text className="text-[11px] text-slate-500 mt-0.5">{row.range}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Chân trang: kích thước + tải CSV */}
        <View className="flex-row items-center justify-between pt-3 border-t border-slate-200">
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <FileText size={13} color="#64748B" />
            <Text className="text-xs text-slate-500">{t('recordDetail.fileSize', { size: sizeKb ?? '--' })}</Text>
          </View>
          <Pressable
            onPress={handleDownload}
            disabled={downloading}
            className="flex-row items-center px-3 h-9 rounded-xl bg-white border border-slate-200 active:opacity-80"
            style={{ gap: 6, opacity: downloading ? 0.6 : 1 }}
          >
            {downloading ? <ActivityIndicator size="small" color="#0D6EFD" /> : <Download size={14} color="#334155" />}
            <Text className="text-xs font-semibold text-slate-700">{downloading ? t('recordDetail.downloading') : t('recordDetail.downloadCsv')}</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#F2F5FA]">
      <StatusBar style="dark" animated />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <View className="px-5 pt-3 pb-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-4 flex-1">
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/history' as any))}
              className="w-10 h-10 rounded-full bg-white border border-slate-100 items-center justify-center active:opacity-80"
              style={shadow}
              aria-label={t('common:actions.back')}
            >
              <ArrowLeft color="#0B1329" size={20} strokeWidth={2.4} />
            </Pressable>
            <Text className="text-[22px] font-extrabold text-[#0B1329] tracking-tight">{t('recordDetail.screenTitle')}</Text>
          </View>
          <Pressable
            onPress={() => refetch()}
            className="w-10 h-10 rounded-full bg-white border border-slate-100 items-center justify-center active:opacity-80"
            style={shadow}
            aria-label={t('common:actions.refresh')}
          >
            {isFetching ? <ActivityIndicator size="small" color="#0D6EFD" /> : <RefreshCw color="#64748B" size={17} strokeWidth={2} />}
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 8 }}
          showsVerticalScrollIndicator={false}
        >
          {renderBody()}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
