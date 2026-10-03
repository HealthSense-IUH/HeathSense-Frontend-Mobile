import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Activity, ShieldCheck, HeartPulse, Calendar } from 'lucide-react-native';
import { consultationApi } from '../../../../services/consultation.service';
import type { HealthRecordItem, CareHistoryEpisodeResponse } from '@/types/consultation';

interface Props {
  healthRecords: HealthRecordItem[];
  loading: boolean;
  onRefresh: () => void;
  onSelectRecord?: (record: HealthRecordItem) => void;
}

export function ConsultationRecordsTab({
  healthRecords,
  loading,
  onRefresh,
  onSelectRecord,
}: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'records' | 'history'>('records');
  const [careHistory, setCareHistory] = useState<CareHistoryEpisodeResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

  const fetchCareHistory = (silent = false) => {
    if (!silent) setHistoryLoading(true);
    consultationApi
      .getCareHistory({ page: 1, size: 20 })
      .then((res) => {
        const data = (res as any).data?.data?.content || (res as any).data?.data || (res as any).data?.content;
        setCareHistory(Array.isArray(data) ? data : []);
        setHasLoadedHistory(true);
      })
      .catch((err) => {
        console.warn('Could not load care history', err);
      })
      .finally(() => {
        if (!silent) setHistoryLoading(false);
      });
  };

  const handleSwitchTab = (tab: 'records' | 'history') => {
    if (tab === activeSubTab) return;
    React.startTransition(() => {
      setActiveSubTab(tab);
    });
    if (tab === 'history') {
      if (!hasLoadedHistory) {
        fetchCareHistory(false);
      } else {
        // Đã có data: fetch ngầm ở background, không xoay spinner gây khựng giật UI
        fetchCareHistory(true);
      }
    }
  };

  return (
    <View className="flex-1 pb-6">
      {/* Sub tabs */}
      <View className="py-2.5 mb-3">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => handleSwitchTab('records')}
            className={`px-4 py-2 rounded-full items-center justify-center ${
              activeSubTab === 'records' ? 'bg-[#E5E7EB]' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-sm ${
                activeSubTab === 'records'
                  ? 'font-bold text-slate-900'
                  : 'font-medium text-slate-500'
              }`}
            >
              Hồ sơ đo gần đây ({healthRecords.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleSwitchTab('history')}
            className={`px-4 py-2 rounded-full items-center justify-center ${
              activeSubTab === 'history' ? 'bg-[#E5E7EB]' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-sm ${
                activeSubTab === 'history'
                  ? 'font-bold text-slate-900'
                  : 'font-medium text-slate-500'
              }`}
            >
              Lịch sử chăm sóc
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Sub tab 1: Hồ sơ gần đây */}
      <View style={{ display: activeSubTab === 'records' ? 'flex' : 'none' }}>
        {loading ? (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator color="#0057cd" size="small" />
            <Text className="text-xs text-muted-foreground mt-2">Đang tải hồ sơ đo đạc...</Text>
          </View>
        ) : healthRecords.length === 0 ? (
          <View className="py-12 items-center">
            <Activity size={36} className="text-muted-foreground/40 mb-2" />
            <Text className="text-sm text-muted-foreground">Chưa có hồ sơ đo sức khỏe nào.</Text>
          </View>
        ) : (
          <View className="space-y-3">
            {healthRecords.map((record) => (
              <Pressable
                key={record.id}
                onPress={() => onSelectRecord?.(record)}
                className="p-4 rounded-2xl border border-border bg-card shadow-xs flex-row items-center gap-3.5 active:opacity-80"
              >
                <View className="h-11 w-11 rounded-2xl bg-primary/10 items-center justify-center">
                  <HeartPulse size={22} className="text-primary" />
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-bold text-foreground text-sm">
                      Hồ sơ #{record.id}
                    </Text>
                    {record.predictionLabel && (
                      <View className="px-2 py-0.5 rounded-full bg-primary/10">
                        <Text className="text-[10px] font-extrabold text-primary uppercase">
                          {record.predictionLabel}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
                    {record.originalFileName || 'Dữ liệu nhịp tim sinh trắc học'}
                  </Text>

                  <View className="flex-row items-center gap-2 mt-1.5">
                    <Calendar size={12} className="text-muted-foreground" />
                    <Text className="text-[11px] text-muted-foreground">
                      {record.createdAt
                        ? new Date(record.createdAt).toLocaleString('vi-VN')
                        : '---'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Sub tab 2: Lịch sử chăm sóc */}
      <View style={{ display: activeSubTab === 'history' ? 'flex' : 'none' }}>
        {historyLoading && !hasLoadedHistory ? (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator color="#0057cd" size="small" />
            <Text className="text-xs text-muted-foreground mt-2">Đang tải lịch sử chăm sóc...</Text>
          </View>
        ) : careHistory.length === 0 ? (
          <View className="py-12 items-center">
            <ShieldCheck size={36} className="text-muted-foreground/40 mb-2" />
            <Text className="text-sm text-muted-foreground">Chưa có đợt chăm sóc y khoa hoàn tất nào.</Text>
          </View>
        ) : (
          <View className="space-y-3">
            {careHistory.map((episode) => (
              <View
                key={episode.sessionId}
                className="p-4 rounded-2xl border border-border bg-card shadow-xs"
              >
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="font-bold text-foreground text-sm">
                    Đợt chăm sóc #{episode.sessionId}
                  </Text>
                  <View className="px-2.5 py-0.5 rounded-full bg-emerald-500/10">
                    <Text className="text-[11px] font-bold text-emerald-700">HOÀN TẤT</Text>
                  </View>
                </View>

                <Text className="text-xs text-muted-foreground mb-1">
                  Bác sĩ: {episode.doctorName || `#${episode.doctorId}`}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Thời gian: {episode.startedAt ? new Date(episode.startedAt).toLocaleDateString('vi-VN') : '---'} - {episode.completedAt ? new Date(episode.completedAt).toLocaleDateString('vi-VN') : '---'}
                </Text>

                {episode.finalSummary?.summary && (
                  <View className="mt-2.5 pt-2.5 border-t border-border bg-muted/20 p-2.5 rounded-xl">
                    <Text className="text-[11px] text-foreground leading-relaxed">
                      {episode.finalSummary.summary}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
