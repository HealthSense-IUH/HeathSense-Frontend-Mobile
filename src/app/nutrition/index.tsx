import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Camera, ChevronLeft, ChevronRight, ClipboardList, Search, UtensilsCrossed, X } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { nutritionApi } from '@/services/nutrition.service';
import { DIET_ADVICE_STYLE, DIET_RULE_META, describeRuleThresholds, getGroupIcon } from '@/constants/nutrition';
import { DietAdviceBadge, GuidanceBadge } from '@/components/features/nutrition/NutritionBadges';
import { formatShortDate } from '@/utils/formatters';
import type { DietAdviceLevel, DietPrescriptionRule } from '@/types/nutrition';

type Tab = 'foods' | 'diet' | 'scan';
const LEGEND: DietAdviceLevel[] = ['GOOD', 'OK', 'CAUTION', 'LIMIT', 'UNKNOWN'];

function describeRule(rule: DietPrescriptionRule, sodium?: DietPrescriptionRule) {
  const text = describeRuleThresholds(
    rule.code,
    { unit: rule.unit, limit: rule.effectiveLimit, caution: rule.effectiveCaution, good: rule.effectiveGood },
    sodium && { limit: sodium.effectiveLimit, caution: sodium.effectiveCaution }
  );
  if (!text) return '';
  const custom = rule.limit != null || rule.caution != null || rule.good != null;
  return custom ? `${text} (bác sĩ đặt riêng cho bạn).` : `${text}.`;
}

/** Tab Tra cứu thực phẩm: ô tìm món + lưới nhóm thực phẩm (giống web FoodsTab). */
function FoodsTab() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword.trim()), 250);
    return () => clearTimeout(t);
  }, [keyword]);

  const groups = useQuery({ queryKey: ['nutrition', 'groups'], queryFn: nutritionApi.getGroups });
  const search = useQuery({
    queryKey: ['nutrition', 'search', debounced],
    queryFn: () => nutritionApi.searchFoods(debounced),
    enabled: debounced.length >= 2,
  });

  return (
    <View style={{ gap: 16 }}>
      <View>
        <View className="flex-row items-center bg-white rounded-xl border border-slate-200/70 px-3 h-12" style={{ gap: 8 }}>
          <Search size={16} color="#0D6EFD" />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            placeholder="Tìm thực phẩm (ví dụ: cà phê, sữa ít béo, cá hồi, chuối, bia)..."
            placeholderTextColor="#94A3B8"
            className="flex-1 text-xs font-medium text-slate-900 h-full p-0"
            autoCorrect={false}
          />
          {keyword ? (
            <Pressable onPress={() => setKeyword('')} hitSlop={8} aria-label="Xóa từ khóa tìm kiếm">
              <X size={16} color="#94A3B8" />
            </Pressable>
          ) : null}
        </View>
        {debounced.length >= 2 ? (
          <View className="mt-2 bg-white rounded-2xl border border-slate-200/70 overflow-hidden">
            <View className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
              <Text className="text-xs font-semibold text-slate-700">{search.isLoading ? 'Đang tìm...' : `Kết quả thực phẩm (${search.data?.length ?? 0})`}</Text>
            </View>
            {search.isLoading ? (
              <View className="py-6 items-center"><ActivityIndicator color="#0D6EFD" /></View>
            ) : (search.data?.length ?? 0) === 0 ? (
              <Text className="px-4 py-5 text-xs text-slate-500">Không tìm thấy món ăn nào phù hợp với “{debounced}”. Thử tìm theo từ khóa như: sữa, cá hồi, cà phê, chuối...</Text>
            ) : (
              search.data!.map((food, idx) => (
                <Pressable
                  key={food.id}
                  onPress={() => router.push(`/nutrition/food/${food.id}` as any)}
                  className={`px-4 py-3 active:bg-slate-50 ${idx < search.data!.length - 1 ? 'border-b border-slate-100' : ''}`}
                  style={{ gap: 4 }}
                >
                  <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
                    <Text className="text-sm font-semibold text-slate-900 flex-1" numberOfLines={1}>{food.foodNameSpecific}</Text>
                    <GuidanceBadge type={food.guidance} />
                  </View>
                  <Text className="text-[11px] text-primary">{food.foodName} • {food.groupName}</Text>
                  {food.description ? <Text className="text-xs text-slate-500" numberOfLines={2}>{food.description}</Text> : null}
                </Pressable>
              ))
            )}
          </View>
        ) : null}
      </View>

      <View>
        <Text className="text-base font-bold text-slate-900">Khám phá theo nhóm thực phẩm</Text>
        <Text className="text-xs text-slate-500">Chọn một nhóm để xem khuyến nghị.</Text>
      </View>
      {groups.isLoading ? (
        <View className="py-10 items-center"><ActivityIndicator color="#0D6EFD" /></View>
      ) : groups.error ? (
        <View className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 items-center" style={{ gap: 8 }}>
          <Text className="text-xs text-rose-700">Không tải được danh sách nhóm thực phẩm.</Text>
          <Pressable onPress={() => groups.refetch()} className="h-9 px-3 rounded-xl border border-border bg-white items-center justify-center">
            <Text className="text-xs font-semibold text-foreground">Thử lại</Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-row flex-wrap" style={{ gap: 10 }}>
          {(groups.data ?? []).map((g) => {
            const { Icon, color } = getGroupIcon(g.icon);
            return (
              <Pressable
                key={g.id}
                onPress={() => router.push(`/nutrition/group/${g.slug || g.id}` as any)}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 active:opacity-80"
                style={{ width: '48%', flexGrow: 1, gap: 8 }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="h-10 w-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${color}1A` }}>
                    <Icon size={20} color={color} />
                  </View>
                  <Text className="text-[10px] text-slate-500">{g.foodCount.toLocaleString('vi-VN')} thực phẩm</Text>
                </View>
                <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>{g.name}</Text>
                <Text className="text-[11px] text-slate-500 leading-4" numberOfLines={2}>
                  {g.description || (g.guidanceFoodCount > 0 ? `${g.guidanceFoodCount} món có khuyến nghị cho tim mạch.` : 'Tra cứu số liệu dinh dưỡng của nhóm.')}
                </Text>
                <View className="flex-row items-center pt-1" style={{ gap: 2 }}>
                  <Text className="text-[11px] font-semibold text-primary">{g.guidanceFoodCount > 0 ? `Khám phá các loại · ${g.guidanceFoodCount} có khuyến nghị` : 'Khám phá các loại'}</Text>
                  <ChevronRight size={12} color="#0D6EFD" />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

/** Tab Đơn ăn uống: quy tắc bác sĩ kê, lời dặn thêm, cách đọc màu (giống web DietPrescriptionTab). */
function DietTab({ onSearchFoods }: { onSearchFoods: () => void }) {
  const { data: prescription, isLoading, error, refetch } = useQuery({ queryKey: ['nutrition', 'diet-prescription'], queryFn: nutritionApi.getMyDietPrescription });
  if (isLoading) return <View className="py-10 items-center"><ActivityIndicator color="#0D6EFD" /></View>;
  if (error || !prescription) {
    return (
      <View className="rounded-2xl border border-dashed border-slate-200 p-6 items-center" style={{ gap: 8 }}>
        <Text className="text-sm text-slate-500">Không tải được đơn ăn uống.</Text>
        <Pressable onPress={() => refetch()}><Text className="text-sm font-medium text-primary">Thử lại</Text></Pressable>
      </View>
    );
  }
  const rules = prescription.rules ?? [];
  const sodium = rules.find((r) => r.code === 'SODIUM');
  const active = rules.filter((r) => r.enabled);
  return (
    <View style={{ gap: 16 }}>
      <View className="rounded-2xl border border-border bg-card p-5" style={{ gap: 14 }}>
        <View className="flex-row items-start" style={{ gap: 10 }}>
          <View className="p-2.5 rounded-xl bg-primary/10">
            <ClipboardList size={20} color="#0D6EFD" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-foreground">Đơn ăn uống của bạn</Text>
            <Text className="text-xs text-muted-foreground leading-4 mt-0.5">
              {active.length > 0
                ? prescription.updatedAt
                  ? `Bác sĩ kê trong buổi tư vấn (cập nhật ${formatShortDate(prescription.updatedAt)}). Các món được chấm màu theo những quy tắc dưới đây.`
                  : 'Bác sĩ kê trong buổi tư vấn. Các món được chấm màu theo những quy tắc dưới đây.'
                : 'Bác sĩ chưa kê quy tắc ăn uống nào cho bạn nên các món chưa được chấm màu, chỉ hiện số liệu dinh dưỡng.'}
            </Text>
          </View>
        </View>
        <Pressable onPress={onSearchFoods} className="self-start h-9 px-3 rounded-xl border border-border bg-white flex-row items-center active:opacity-80" style={{ gap: 6 }}>
          <Search size={13} color="#0F172A" />
          <Text className="text-xs font-semibold text-foreground">Tra cứu món</Text>
        </Pressable>
        {active.map((rule) => {
          const meta = DIET_RULE_META[rule.code];
          return (
            <View key={rule.code} className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 flex-row items-start" style={{ gap: 10 }}>
              {meta ? <meta.Icon size={18} color="#0D6EFD" /> : null}
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">{rule.name}</Text>
                <Text className="text-xs text-muted-foreground leading-4 mt-0.5">{[describeRule(rule, sodium), meta?.summary].filter(Boolean).join(' ')}</Text>
              </View>
            </View>
          );
        })}
        {prescription.note ? (
          <View className="rounded-xl bg-slate-50 border border-slate-200/70 p-4">
            <Text className="text-xs font-semibold text-slate-600 mb-1">Bác sĩ dặn thêm</Text>
            <Text className="text-sm text-slate-800">{prescription.note}</Text>
          </View>
        ) : null}
      </View>

      <View className="rounded-2xl border border-border bg-card p-5" style={{ gap: 10 }}>
        <Text className="text-base font-bold text-foreground">Cách đọc màu của món</Text>
        {LEGEND.map((level) => (
          <View key={level} className="flex-row items-center" style={{ gap: 8 }}>
            <DietAdviceBadge advice={{ level, reasons: [], personalized: true }} />
            <Text className="text-xs text-muted-foreground flex-1">{DIET_ADVICE_STYLE[level].legend}</Text>
          </View>
        ))}
        <Text className="text-xs text-muted-foreground leading-4">
          Có điểm đỏ thì món là đỏ, không có đỏ mà có vàng thì là vàng. Mở từng món để xem lý do. Đánh giá chỉ so số liệu trên 100 g với các ngưỡng, không thay thế lời khuyên trực tiếp của bác sĩ.
        </Text>
      </View>
    </View>
  );
}

/** Ăn uống & Dinh dưỡng — tương ứng trang Ăn uống của web. */
export default function NutritionScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('foods');
  const tabs: { key: Tab; label: string }[] = [
    { key: 'foods', label: 'Tra cứu thực phẩm' },
    { key: 'diet', label: 'Đơn ăn uống' },
    { key: 'scan', label: 'Ước tính calo' },
  ];

  return (
    <ScreenWrapper
      title="Ăn uống & Dinh dưỡng"
      description="Gợi ý thực phẩm tốt cho tim mạch và người có rung nhĩ."
      headerLeft={
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as any))} className="h-10 w-10 items-center justify-center bg-muted rounded-full active:opacity-70" aria-label="Quay lại">
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
      }
    >
      <View className="px-5 pb-10 mt-2" style={{ gap: 16 }}>
        <View className="flex-row bg-muted/70 p-1 rounded-2xl">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <Pressable key={t.key} onPress={() => setTab(t.key)} className={`flex-1 items-center justify-center py-2.5 rounded-xl ${active ? 'bg-background shadow-xs' : ''}`}>
                <Text className={`text-[11px] font-bold ${active ? 'text-foreground' : 'text-muted-foreground'}`} numberOfLines={1}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {tab === 'foods' ? <FoodsTab /> : null}
        {tab === 'diet' ? <DietTab onSearchFoods={() => setTab('foods')} /> : null}
        {tab === 'scan' ? (
          <View className="rounded-2xl border border-dashed border-border bg-card p-6 items-center" style={{ gap: 10 }}>
            <View className="h-14 w-14 rounded-2xl bg-primary/10 items-center justify-center">
              <Camera size={28} color="#0D6EFD" />
            </View>
            <View className="px-2.5 py-1 rounded-full bg-amber-100">
              <Text className="text-[11px] font-bold text-amber-700">Sắp ra mắt</Text>
            </View>
            <Text className="text-base font-bold text-foreground text-center">Chụp ảnh món ăn, ước tính calo</Text>
            <Text className="text-xs text-muted-foreground text-center leading-5">
              Chụp ảnh bữa ăn và trả lời vài câu hỏi về khẩu phần, HealthSense sẽ ước tính năng lượng và các chất dinh dưỡng chính.
            </Text>
            {['Nhận diện món ăn từ ảnh', 'Hỏi thêm khẩu phần và cách chế biến để ước tính sát hơn', 'Tính calo, đạm, tinh bột và chất béo từ cơ sở dữ liệu dinh dưỡng'].map((h) => (
              <View key={h} className="flex-row items-center self-stretch" style={{ gap: 8 }}>
                <UtensilsCrossed size={14} color="#0D6EFD" />
                <Text className="text-xs text-foreground flex-1">{h}</Text>
              </View>
            ))}
            <Text className="text-[11px] text-muted-foreground text-center">Kết quả chỉ là ước tính, không thay thế việc cân đo thực phẩm hay tư vấn dinh dưỡng.</Text>
          </View>
        ) : null}

        <Text className="text-[11px] text-slate-500 leading-4 mt-2">
          <Text className="font-bold">Lưu ý y khoa:</Text> Các khuyến cáo dinh dưỡng trên HealthSense được tham khảo từ hướng dẫn lâm sàng của Hội Tim mạch Hoa Kỳ (ACC/AHA) và các tổng quan hệ thống y khoa. Không có thực phẩm nào tự chữa khỏi hoặc hoàn toàn ngăn ngừa rung nhĩ. Mọi thay đổi lớn về chế độ ăn hoặc sử dụng chất bổ sung cần có sự tư vấn của bác sĩ điều trị.
        </Text>
      </View>
    </ScreenWrapper>
  );
}
