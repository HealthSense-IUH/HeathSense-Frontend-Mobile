import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, HeartPulse, Search } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { nutritionApi } from '@/services/nutrition.service';
import { GUIDANCE_STYLE, REFERENCE_SOURCES, formatNutrientAmount, getGroupIcon } from '@/constants/nutrition';
import { DietAdviceBadge, FoodCard } from '@/components/features/nutrition/NutritionBadges';
import type { GuidanceType, ReferenceFoodSource } from '@/types/nutrition';

const PAGE_SIZE = 20;

/** Toàn bộ thực phẩm tham chiếu (Việt Nam + USDA) của nhóm, có tìm theo tên và phân trang (giống web ReferenceFoodBrowser). */
function ReferenceFoodBrowser({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<ReferenceFoodSource | undefined>(undefined);
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['nutrition', 'reference', groupId, query, source, page],
    queryFn: () => nutritionApi.searchReferenceFoods({ q: query || undefined, group: groupId, source, page, size: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
  const items = data?.content ?? [];
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  const sources: { key?: ReferenceFoodSource; label: string }[] = [
    { key: undefined, label: 'Tất cả' },
    { key: 'VN_FCT', label: 'Việt Nam' },
    { key: 'USDA_FNDDS', label: 'USDA' },
  ];

  return (
    <View style={{ gap: 10 }}>
      <View className="flex-row items-center bg-white rounded-xl border border-slate-200/70 px-3 h-11" style={{ gap: 8 }}>
        <Search size={15} color="#0D6EFD" />
        <TextInput
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={() => {
            setPage(1);
            setQuery(keyword.trim());
          }}
          returnKeyType="search"
          placeholder="Tên tiếng Việt hoặc tiếng Anh, ví dụ: rau muống, giò lụa, salmon..."
          placeholderTextColor="#94A3B8"
          className="flex-1 text-xs font-medium text-slate-900 h-full p-0"
          autoCorrect={false}
        />
        <Pressable
          onPress={() => {
            setPage(1);
            setQuery(keyword.trim());
          }}
          className="px-2.5 h-8 rounded-lg bg-primary items-center justify-center active:opacity-90"
        >
          <Text className="text-[11px] font-semibold text-white">Tìm</Text>
        </Pressable>
      </View>
      <View className="flex-row" style={{ gap: 8 }}>
        {sources.map((s) => {
          const active = source === s.key;
          return (
            <Pressable
              key={s.label}
              onPress={() => {
                setSource(s.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full border ${active ? 'bg-slate-800 border-slate-800' : 'bg-white border-slate-200'}`}
            >
              <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-slate-600'}`}>{s.label}</Text>
            </Pressable>
          );
        })}
        {query || source ? (
          <Pressable
            onPress={() => {
              setKeyword('');
              setQuery('');
              setSource(undefined);
              setPage(1);
            }}
            className="px-3 py-1.5"
          >
            <Text className="text-xs font-semibold text-primary">Xóa bộ lọc</Text>
          </Pressable>
        ) : null}
      </View>
      <Text className="text-[11px] text-slate-500">
        {isFetching ? 'Đang tải...' : `${(data?.totalElements ?? 0).toLocaleString('vi-VN')} kết quả${query ? ` cho “${query}”` : ''}`}
      </Text>

      {isLoading ? (
        <View className="py-10 items-center"><ActivityIndicator color="#0D6EFD" /></View>
      ) : error ? (
        <Text className="text-xs text-rose-700">Không tải được dữ liệu dinh dưỡng.</Text>
      ) : items.length === 0 ? (
        <View className="rounded-2xl border border-dashed border-slate-200 p-6 items-center" style={{ gap: 4 }}>
          <Text className="text-sm font-semibold text-slate-700">Không tìm thấy thực phẩm phù hợp.</Text>
          <Text className="text-xs text-slate-500 text-center">Thử tên tiếng Việt (có hoặc không dấu) hoặc tiếng Anh, ví dụ: rau muong, gio lua, chicken, rice.</Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {items.map((item) => (
            <Pressable key={item.id} onPress={() => router.push(`/nutrition/reference/${item.id}` as any)} className="rounded-2xl border border-slate-200/80 bg-white p-3.5 active:opacity-80" style={{ gap: 6 }}>
              <View className="flex-row items-start justify-between" style={{ gap: 8 }}>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-slate-900" numberOfLines={2}>{item.displayName}</Text>
                  {item.localName && item.localName !== item.displayName ? <Text className="text-[11px] text-slate-500" numberOfLines={1}>{item.localName}</Text> : null}
                </View>
                <View className="items-end" style={{ gap: 4 }}>
                  <View className="px-1.5 py-0.5 rounded-md bg-slate-100">
                    <Text className="text-[10px] font-semibold text-slate-600">{REFERENCE_SOURCES[item.source]?.short ?? item.source}</Text>
                  </View>
                  <DietAdviceBadge advice={item.advice} />
                </View>
              </View>
              <View className="flex-row" style={{ gap: 6 }}>
                {[
                  { label: 'Năng lượng', value: item.energyKcal, unit: 'kcal' },
                  { label: 'Đạm', value: item.proteinG, unit: 'g' },
                  { label: 'Tinh bột', value: item.carbohydrateG, unit: 'g' },
                  { label: 'Chất béo', value: item.fatTotalG, unit: 'g' },
                ].map((c) => (
                  <View key={c.label} className="flex-1 rounded-lg bg-slate-50 px-2 py-1.5">
                    <Text className="text-[10px] text-slate-500">{c.label}</Text>
                    <Text className="text-xs font-semibold text-slate-800">{formatNutrientAmount(c.value)} <Text className="text-[9px] font-normal text-slate-500">{c.unit}</Text></Text>
                  </View>
                ))}
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {totalPages > 1 ? (
        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-xs text-slate-500">Trang {page} / {totalPages}</Text>
          <View className="flex-row" style={{ gap: 8 }}>
            <Pressable onPress={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="h-9 w-9 rounded-xl border border-slate-200 bg-white items-center justify-center" style={{ opacity: page <= 1 ? 0.4 : 1 }}>
              <ChevronLeft size={16} color="#334155" />
            </Pressable>
            <Pressable onPress={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="h-9 w-9 rounded-xl border border-slate-200 bg-white items-center justify-center" style={{ opacity: page >= totalPages ? 0.4 : 1 }}>
              <ChevronRight size={16} color="#334155" />
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

/** Một nhóm thực phẩm (giống web CategoryView): các loại có khuyến nghị → biến thể; và toàn bộ thực phẩm tham chiếu của nhóm. */
export default function NutritionGroupScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | GuidanceType>('ALL');

  const group = useQuery({ queryKey: ['nutrition', 'group', slug], queryFn: () => nutritionApi.getGroup(slug), enabled: !!slug });
  const foods = useQuery({ queryKey: ['nutrition', 'group-foods', slug], queryFn: () => nutritionApi.getGroupFoods(slug), enabled: !!slug });
  const list = foods.data ?? [];
  const foodNames = useMemo(() => Array.from(new Set(list.map((f) => f.foodName))), [list]);
  const variants = useMemo(() => (selectedType ? list.filter((f) => f.foodName === selectedType) : []), [list, selectedType]);
  const shown = filter === 'ALL' ? variants : variants.filter((v) => v.guidance === filter);
  const counts = {
    PRIORITIZE: variants.filter((v) => v.guidance === 'PRIORITIZE').length,
    CAUTION: variants.filter((v) => v.guidance === 'CAUTION').length,
    LIMIT: variants.filter((v) => v.guidance === 'LIMIT').length,
  };
  const g = group.data;
  const { Icon, color } = getGroupIcon(g?.icon);

  return (
    <ScreenWrapper
      title={selectedType ?? g?.name ?? 'Nhóm thực phẩm'}
      description={selectedType ? `Các biến thể của ${selectedType} trong nhóm ${g?.name?.toLowerCase() ?? ''}` : g?.description || 'Khuyến nghị tim mạch và số liệu dinh dưỡng'}
      headerLeft={
        <Pressable
          onPress={() => (selectedType ? setSelectedType(null) : router.canGoBack() ? router.back() : router.replace('/nutrition' as any))}
          className="h-10 w-10 items-center justify-center bg-muted rounded-full active:opacity-70"
          aria-label="Quay lại"
        >
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
      }
      headerRight={
        <View className="h-10 w-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${color}1A` }}>
          <Icon size={20} color={color} />
        </View>
      }
    >
      <View className="px-5 pb-10 mt-2" style={{ gap: 16 }}>
        {group.isLoading ? (
          <View className="py-16 items-center"><ActivityIndicator size="large" color="#0D6EFD" /></View>
        ) : !g ? (
          <View className="items-center py-10" style={{ gap: 10 }}>
            <Text className="text-sm text-slate-500">Không tìm thấy nhóm thực phẩm.</Text>
            <Pressable onPress={() => router.replace('/nutrition' as any)} className="h-10 px-4 rounded-xl bg-primary items-center justify-center">
              <Text className="text-white text-xs font-bold">Tất cả nhóm thực phẩm</Text>
            </Pressable>
          </View>
        ) : selectedType ? (
          <>
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-slate-900 flex-1">Các lựa chọn của {selectedType}</Text>
              <Pressable onPress={() => setSelectedType(null)} className="flex-row items-center h-8 px-2.5 rounded-lg border border-slate-200 bg-white active:opacity-80" style={{ gap: 4 }}>
                <ArrowLeft size={12} color="#334155" />
                <Text className="text-[11px] font-medium text-slate-700">Loại khác</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Pressable onPress={() => setFilter('ALL')} className={`px-3 py-1.5 rounded-xl border ${filter === 'ALL' ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'}`}>
                <Text className={`text-xs font-medium ${filter === 'ALL' ? 'text-white' : 'text-slate-600'}`}>Tất cả ({variants.length})</Text>
              </Pressable>
              {(['PRIORITIZE', 'CAUTION', 'LIMIT'] as GuidanceType[])
                .filter((k) => counts[k] > 0)
                .map((k) => {
                  const st = GUIDANCE_STYLE[k];
                  const active = filter === k;
                  return (
                    <Pressable key={k} onPress={() => setFilter(k)} className="px-3 py-1.5 rounded-xl border flex-row items-center" style={{ gap: 4, backgroundColor: active ? st.text : st.bg, borderColor: active ? st.text : st.border }}>
                      <st.Icon size={12} color={active ? '#FFFFFF' : st.text} />
                      <Text className="text-xs font-medium" style={{ color: active ? '#FFFFFF' : st.text }}>{st.label} ({counts[k]})</Text>
                    </Pressable>
                  );
                })}
            </ScrollView>
            {shown.length === 0 ? (
              <Text className="text-sm text-slate-500 text-center py-6">Không có món nào thuộc nhóm khuyến nghị này.</Text>
            ) : (
              shown.map((food) => <FoodCard key={food.id} food={food} onPress={() => router.push(`/nutrition/food/${food.id}` as any)} />)
            )}
          </>
        ) : (
          <>
            <View>
              <Text className="text-base font-bold text-slate-900">Tất cả thực phẩm trong nhóm ({(g.foodCount ?? 0).toLocaleString('vi-VN')})</Text>
              <Text className="text-xs text-slate-500">Số liệu trên 100 g, từ bảng thành phần thực phẩm Việt Nam và USDA.</Text>
            </View>

            {(foods.isLoading || foodNames.length > 0) && (
              <View className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4" style={{ gap: 12 }}>
                <View className="flex-row items-start" style={{ gap: 10 }}>
                  <View className="p-2 rounded-xl bg-emerald-100">
                    <HeartPulse size={18} color="#047857" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-emerald-900">Có khuyến nghị cho tim mạch ({foodNames.length})</Text>
                    <Text className="text-xs text-emerald-800/80">Chọn một loại để xem chi tiết.</Text>
                  </View>
                </View>
                {foods.isLoading ? (
                  <ActivityIndicator color="#047857" />
                ) : (
                  foodNames.map((fn) => {
                    const vs = list.filter((f) => f.foodName === fn);
                    const sample = vs.map((v) => v.foodNameSpecific).slice(0, 3).join(', ');
                    return (
                      <Pressable key={fn} onPress={() => { setSelectedType(fn); setFilter('ALL'); }} className="rounded-2xl border border-emerald-200 bg-white p-4 active:opacity-80" style={{ gap: 6 }}>
                        <View className="flex-row items-start justify-between" style={{ gap: 8 }}>
                          <Text className="font-semibold text-slate-900 text-sm flex-1">{fn}</Text>
                          <View className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                            <Text className="text-[11px] font-medium text-emerald-700">{vs.length} món</Text>
                          </View>
                        </View>
                        {sample ? <Text className="text-xs text-slate-500 leading-4" numberOfLines={2}>Gồm có: {sample}{vs.length > 3 ? '...' : ''}</Text> : null}
                        <View className="pt-2 border-t border-emerald-100 flex-row items-center justify-between">
                          <Text className="text-xs text-emerald-700 font-medium">Xem các lựa chọn</Text>
                          <ArrowRight size={13} color="#047857" />
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </View>
            )}

            <ReferenceFoodBrowser groupId={g.id} />

            <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/nutrition' as any))} className="self-center h-10 px-4 rounded-xl border border-slate-200 bg-white flex-row items-center active:opacity-80" style={{ gap: 6 }}>
              <ArrowLeft size={14} color="#334155" />
              <Text className="text-xs font-semibold text-slate-700">Khám phá nhóm thực phẩm khác</Text>
            </Pressable>
          </>
        )}
      </View>
    </ScreenWrapper>
  );
}
