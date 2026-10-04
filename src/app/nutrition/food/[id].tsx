import React, { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronLeft, ChevronUp, ExternalLink, FileText, Heart, Pill, Scale, Sparkles, Zap } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { nutritionApi } from '@/services/nutrition.service';
import { EVIDENCE_TYPE_LABEL, KEY_NUTRIENT_CODES, formatNutrientAmount } from '@/constants/nutrition';
import { GuidanceBadge } from '@/components/features/nutrition/NutritionBadges';

function ContextCard({ Icon, color, title, text }: { Icon: typeof Heart; color: string; title: string; text: string }) {
  return (
    <View className="rounded-2xl border p-4" style={{ gap: 6, borderColor: `${color}33`, backgroundColor: `${color}0D` }}>
      <View className="flex-row items-center" style={{ gap: 6 }}>
        <Icon size={15} color={color} />
        <Text className="text-sm font-semibold text-slate-900">{title}</Text>
      </View>
      <Text className="text-xs text-slate-600 leading-5">{text}</Text>
    </View>
  );
}

/** Chi tiết món có khuyến nghị tim mạch (giống web GuidanceFoodDialog). */
export default function GuidanceFoodScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showAll, setShowAll] = useState(false);
  const { data: food, isLoading } = useQuery({ queryKey: ['nutrition', 'food', id], queryFn: () => nutritionApi.getFood(id), enabled: !!id });

  const keyNutrients = food?.nutrients.filter((n) => KEY_NUTRIENT_CODES.includes(n.nutrientCode)) ?? [];
  const otherNutrients = food?.nutrients.filter((n) => !KEY_NUTRIENT_CODES.includes(n.nutrientCode)) ?? [];

  return (
    <ScreenWrapper
      title={food?.foodNameSpecific ?? 'Chi tiết món'}
      description={food?.sourceDescription ? `Nguồn tham chiếu FNDDS: ${food.sourceDescription}` : undefined}
      headerLeft={
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/nutrition' as any))} className="h-10 w-10 items-center justify-center bg-muted rounded-full active:opacity-70" aria-label="Quay lại">
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
      }
    >
      <View className="px-5 pb-10 mt-2" style={{ gap: 14 }}>
        {isLoading ? (
          <View className="py-16 items-center"><ActivityIndicator size="large" color="#0D6EFD" /></View>
        ) : !food ? (
          <View className="items-center py-10" style={{ gap: 6 }}>
            <Text className="text-sm font-semibold text-slate-700">Không tìm thấy món ăn</Text>
            <Text className="text-xs text-slate-500 text-center">Món ăn bạn đang tìm kiếm không tồn tại hoặc đã được cập nhật.</Text>
          </View>
        ) : (
          <>
            <View className="flex-row flex-wrap items-center" style={{ gap: 6 }}>
              <Pressable onPress={() => router.push(`/nutrition/group/${food.group}` as any)} className="px-2.5 py-0.5 rounded-md bg-primary/10">
                <Text className="text-xs font-semibold text-primary">{food.groupName}</Text>
              </Pressable>
              {food.foodName !== food.foodNameSpecific ? (
                <View className="px-2.5 py-0.5 rounded-md bg-slate-100">
                  <Text className="text-xs font-medium text-slate-600">Loại: {food.foodName}</Text>
                </View>
              ) : null}
              <GuidanceBadge type={food.guidance} size="md" />
              <View className="flex-row items-center px-2.5 py-0.5 rounded-md bg-slate-100" style={{ gap: 4 }}>
                <Scale size={11} color="#0D6EFD" />
                <Text className="text-xs font-medium text-slate-600">Định lượng chuẩn: 100 g</Text>
              </View>
            </View>

            {food.description || food.guidanceTitle || food.guidanceReason ? (
              <View className="rounded-2xl border border-slate-200/80 bg-white p-4" style={{ gap: 12 }}>
                {food.description ? <Text className="text-sm text-slate-600 leading-5">{food.description}</Text> : null}
                {food.guidanceTitle || food.guidanceReason ? (
                  <View className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4" style={{ gap: 4 }}>
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <Sparkles size={15} color="#0D6EFD" />
                      <Text className="text-sm font-semibold text-slate-900 flex-1">{food.guidanceTitle}</Text>
                    </View>
                    <Text className="text-xs text-slate-600 leading-5">{food.guidanceReason}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
              <View className="bg-slate-50/60 border-b border-slate-100 p-4 flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-bold text-slate-900">Thành phần dinh dưỡng</Text>
                  <Text className="text-[11px] text-slate-500">Tính trên mỗi 100g thực phẩm (USDA FNDDS 2021-2023)</Text>
                </View>
              </View>
              <View className="p-4" style={{ gap: 10 }}>
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {keyNutrients.map((n) => (
                    <View key={n.nutrientCode} className="rounded-2xl bg-slate-50 border border-slate-100 p-3" style={{ width: '48%', flexGrow: 1 }}>
                      <Text className="text-[11px] text-slate-500" numberOfLines={1}>{n.name}</Text>
                      <Text className="text-lg font-bold text-slate-900 mt-0.5">
                        {formatNutrientAmount(n.amount)} <Text className="text-xs font-medium text-slate-500">{n.unit}</Text>
                      </Text>
                    </View>
                  ))}
                </View>
                {otherNutrients.length > 0 ? (
                  <View className="pt-2 border-t border-slate-100">
                    <Pressable onPress={() => setShowAll((v) => !v)} className="flex-row items-center justify-center h-9 active:opacity-70" style={{ gap: 6 }}>
                      <Text className="text-xs font-medium text-primary">{showAll ? 'Thu gọn thành phần vi lượng' : `Xem thêm ${otherNutrients.length} thành phần dinh dưỡng chi tiết`}</Text>
                      {showAll ? <ChevronUp size={15} color="#0D6EFD" /> : <ChevronDown size={15} color="#0D6EFD" />}
                    </Pressable>
                    {showAll ? (
                      <View style={{ gap: 6 }}>
                        {otherNutrients.map((n) => (
                          <View key={n.nutrientCode} className="rounded-xl bg-slate-50/70 border border-slate-100 px-3 py-2 flex-row items-center justify-between">
                            <Text className="text-xs text-slate-500 flex-1">{n.name}</Text>
                            <Text className="text-xs font-semibold text-slate-800">{formatNutrientAmount(n.amount)} {n.unit}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>

            {food.cardiovascularContext || food.afContext || food.medicationContext ? (
              <View style={{ gap: 10 }}>
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Heart size={18} color="#EF4444" fill="#EF4444" />
                  <Text className="text-base font-bold text-slate-900">Ý nghĩa đối với sức khỏe của bạn</Text>
                </View>
                {food.cardiovascularContext ? <ContextCard Icon={Heart} color="#DC2626" title="Sức khỏe tim mạch & Huyết áp" text={food.cardiovascularContext} /> : null}
                {food.afContext ? <ContextCard Icon={Zap} color="#D97706" title="Rung tâm nhĩ & Nhịp tim" text={food.afContext} /> : null}
                {food.medicationContext ? <ContextCard Icon={Pill} color="#2563EB" title="Lưu ý khi sử dụng thuốc điều trị" text={food.medicationContext} /> : null}
              </View>
            ) : null}

            {food.evidenceSources?.length ? (
              <View className="rounded-2xl border border-slate-200/80 bg-white p-4" style={{ gap: 10 }}>
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <FileText size={16} color="#0D6EFD" />
                  <Text className="text-sm font-bold text-slate-900">Cơ sở tham khảo & Bằng chứng y học</Text>
                </View>
                <Text className="text-[11px] text-slate-500">Các khuyến nghị dinh dưỡng trên được đối chiếu từ tài liệu hướng dẫn lâm sàng và thử nghiệm y khoa chính thống.</Text>
                {food.evidenceSources.map((ev) => (
                  <View key={ev.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3" style={{ gap: 4 }}>
                    <View className="self-start px-2 py-0.5 rounded-md bg-primary/10">
                      <Text className="text-[10px] font-semibold text-primary">{EVIDENCE_TYPE_LABEL[ev.sourceType] || ev.sourceType}</Text>
                    </View>
                    <Text className="text-xs font-semibold text-slate-900">{ev.title}</Text>
                    <Text className="text-[11px] text-slate-500">{[ev.authors, ev.journal, ev.year ? `Năm ${ev.year}` : null].filter(Boolean).join(' • ')}</Text>
                    {ev.summary ? <Text className="text-xs text-slate-600 leading-4">{ev.summary}</Text> : null}
                    {ev.url ? (
                      <Pressable onPress={() => void Linking.openURL(ev.url as string)} className="flex-row items-center self-start active:opacity-70" style={{ gap: 4 }}>
                        <ExternalLink size={12} color="#0D6EFD" />
                        <Text className="text-[11px] font-medium text-primary">Xem tài liệu gốc</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}

            <Text className="text-[11px] text-slate-500 leading-4">
              Dữ liệu dinh dưỡng được trích xuất từ cơ sở dữ liệu USDA FNDDS 2021-2023. Các thông tin về rung nhĩ và tim mạch chỉ mang tính giáo dục sức khỏe, không thay thế chẩn đoán hoặc phác đồ từ bác sĩ chuyên khoa tim mạch.
            </Text>
          </>
        )}
      </View>
    </ScreenWrapper>
  );
}
