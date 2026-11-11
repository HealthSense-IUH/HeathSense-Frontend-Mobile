import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AnalysisWindow, WindowAnalysis } from '@/types/health-records';

const shadow = { boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)' };

/** Ngưỡng thấp nhất của quy tắc (nhánh 5 cửa sổ); cửa sổ đạt ngưỡng được tô đỏ nhạt. */
const HIGH_PROBABILITY = 0.8;

function windowStyle(window: AnalysisWindow): string {
  if (!window.accepted || typeof window.pMeta !== 'number') return 'bg-slate-50 border-slate-200';
  return window.pMeta >= HIGH_PROBABILITY ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200';
}

interface TemporalRuleCardProps {
  analysis?: WindowAnalysis | null;
}

/**
 * Kết quả theo cửa sổ 30 giây (bước 10 giây) và quyết định của quy tắc temporal persistence:
 * cảnh báo khi 5 cửa sổ liên tiếp có P_meta ≥ 0.80, hoặc 2 cửa sổ liên tiếp có P_meta ≥ 0.90,
 * và các base learner đồng thuận (sigma_dis ≤ 0.05). Bản ghi cũ không có trường này thì ẩn thẻ.
 */
export function TemporalRuleCard({ analysis }: TemporalRuleCardProps) {
  const { t } = useTranslation('health');
  if (!analysis || !Array.isArray(analysis.windows) || analysis.windows.length === 0) return null;

  const time = typeof analysis.alertTimeS === 'number' ? Math.round(analysis.alertTimeS) : '--';
  let status: string;
  if (!analysis.temporalRuleAvailable) status = t('recordDetail.temporal.unavailable');
  else if (analysis.alert && analysis.alertBranch === 'two_window_high_confidence')
    status = t('recordDetail.temporal.alertTwo', { time });
  else if (analysis.alert) status = t('recordDetail.temporal.alertFive', { time });
  else status = t('recordDetail.temporal.noAlert');

  return (
    <View className="rounded-2xl bg-white border border-slate-200 p-4" style={shadow}>
      <Text className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
        {t('recordDetail.temporal.title')}
      </Text>
      <Text className={`text-sm font-semibold mt-2 leading-5 ${analysis.alert ? 'text-rose-600' : 'text-slate-900'}`}>
        {status}
      </Text>
      <Text className="text-xs text-slate-500 mt-1">
        {t('recordDetail.temporal.accepted', {
          accepted: analysis.acceptedWindows,
          total: analysis.windows.length,
        })}
      </Text>
      <View className="flex-row flex-wrap mt-3" style={{ gap: 6 }}>
        {analysis.windows.map((window) => (
          <View key={window.index} className={`rounded-xl border px-2.5 py-1.5 ${windowStyle(window)}`}>
            <Text className="text-[11px] text-slate-500">
              {t('recordDetail.temporal.window', {
                start: Math.round(window.startS),
                end: Math.round(window.endS),
              })}
            </Text>
            <Text className="text-xs font-semibold text-slate-900 mt-0.5">
              {window.accepted && typeof window.pMeta === 'number'
                ? `${(window.pMeta * 100).toFixed(0)}%`
                : t('recordDetail.temporal.rejected')}
            </Text>
          </View>
        ))}
      </View>
      <Text className="text-[11px] text-slate-500 mt-3 leading-4">{t('recordDetail.temporal.note')}</Text>
    </View>
  );
}
