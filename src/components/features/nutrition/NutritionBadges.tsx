import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import { DIET_ADVICE_STYLE, GUIDANCE_FALLBACK, GUIDANCE_STYLE, NUTRIENT_SHORT_LABEL, formatNutrientAmount } from '@/constants/nutrition';
import type { DietAdvice, Food, GuidanceType, NutrientCode, NutrientValue } from '@/types/nutrition';

/** Huy hiệu khuyến nghị tim mạch của một món (Nên ưu tiên / Cần lưu ý / Nên hạn chế). */
export function GuidanceBadge({ type, size = 'sm' }: { type?: GuidanceType | null; size?: 'sm' | 'md' }) {
  const style = (type && GUIDANCE_STYLE[type]) || GUIDANCE_FALLBACK;
  return (
    <View className={`flex-row items-center rounded-full border ${size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1'}`} style={{ gap: 4, backgroundColor: style.bg, borderColor: style.border }}>
      <style.Icon size={size === 'sm' ? 11 : 13} color={style.text} />
      <Text className={`font-semibold ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`} style={{ color: style.text }}>{style.label}</Text>
    </View>
  );
}

/** Nhãn màu theo đơn ăn uống bác sĩ kê (xanh / trung tính / vàng / đỏ / xám). */
export function DietAdviceBadge({ advice }: { advice?: DietAdvice | null }) {
  if (!advice) return null;
  const style = DIET_ADVICE_STYLE[advice.level] || DIET_ADVICE_STYLE.UNKNOWN;
  return (
    <View className="flex-row items-center rounded-md border px-1.5 py-0.5 self-start" style={{ gap: 3, backgroundColor: style.bg, borderColor: style.border }}>
      <style.Icon size={11} color={style.text} />
      <Text className="text-[10px] font-semibold" style={{ color: style.text }}>{style.label}</Text>
    </View>
  );
}

/** Hộp đánh giá chi tiết trên màn một món: màu, từng lý do và ghi chú khi chưa có đơn riêng. */
export function DietAdviceNote({ advice }: { advice?: DietAdvice | null }) {
  if (!advice) return null;
  const style = DIET_ADVICE_STYLE[advice.level] || DIET_ADVICE_STYLE.UNKNOWN;
  return (
    <View className="rounded-2xl border p-4" style={{ gap: 6, backgroundColor: style.bg, borderColor: style.border }}>
      <View className="flex-row items-center" style={{ gap: 6 }}>
        <style.Icon size={16} color={style.text} />
        <Text className="text-sm font-semibold text-slate-900 flex-1">{style.label} theo đơn ăn uống của bác sĩ</Text>
      </View>
      {advice.reasons.length > 0 ? (
        advice.reasons.map((r) => (
          <Text key={r.code} className="text-xs text-slate-700 leading-5">• {r.message}</Text>
        ))
      ) : (
        <Text className="text-xs text-slate-700 leading-5">
          Không có điểm nào cần lưu ý, nhưng cũng chưa có điểm nổi bật cho nhịp tim (kali cao hơn natri, hoặc giàu magie mà ít muối).
        </Text>
      )}
      {!advice.personalized ? (
        <Text className="text-[11px] text-slate-500 leading-4">
          Bác sĩ chưa kê đơn ăn uống riêng cho bạn. Khi bác sĩ kê đơn trong buổi tư vấn, đánh giá sẽ thêm các điều bác sĩ dặn.
        </Text>
      ) : null}
    </View>
  );
}

/** Lưới các chất nổi bật của món (theo highlightNutrientCodes, không có thì lấy chất chính). */
export function NutrientHighlights({ nutrients, highlightCodes }: { nutrients: NutrientValue[]; highlightCodes?: NutrientCode[] }) {
  const shown =
    highlightCodes && highlightCodes.length > 0
      ? highlightCodes.map((code) => nutrients.find((n) => n.nutrientCode === code)).filter((n): n is NutrientValue => Boolean(n))
      : nutrients.filter((n) => n.isKey).slice(0, 4);
  if (shown.length === 0) return null;
  return (
    <View className="flex-row flex-wrap" style={{ gap: 6 }}>
      {shown.map((n) => (
        <View key={n.nutrientCode} className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5" style={{ width: '48%', flexGrow: 1 }}>
          <Text className="text-[11px] text-slate-500" numberOfLines={1}>{NUTRIENT_SHORT_LABEL[n.nutrientCode] || n.name}</Text>
          <Text className="text-xs font-semibold text-slate-800 mt-0.5">
            {formatNutrientAmount(n.amount)} <Text className="text-[10px] font-normal text-slate-500">{n.unit}</Text>
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Thẻ một món có khuyến nghị (giống web FoodCard). */
export function FoodCard({ food, onPress }: { food: Food; onPress: () => void }) {
  const subtitle = food.foodName !== food.foodNameSpecific ? food.foodName : null;
  return (
    <Pressable onPress={onPress} className="rounded-2xl border border-slate-200/80 bg-white p-4 active:opacity-80" style={{ gap: 8 }}>
      <View className="flex-row items-start justify-between" style={{ gap: 8 }}>
        <Text className="font-semibold text-slate-900 text-sm flex-1 leading-5" numberOfLines={2}>{food.foodNameSpecific}</Text>
        <GuidanceBadge type={food.guidance} />
      </View>
      {subtitle ? (
        <View className="self-start bg-primary/5 px-2 py-0.5 rounded-md">
          <Text className="text-[11px] font-medium text-primary">{subtitle}</Text>
        </View>
      ) : null}
      {food.description ? (
        <Text className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-4" numberOfLines={2}>{food.description}</Text>
      ) : null}
      <View>
        <View className="flex-row items-center mb-1.5" style={{ gap: 4 }}>
          <Sparkles size={11} color="#0D6EFD" />
          <Text className="text-[11px] text-slate-500 font-medium">Thành phần dinh dưỡng nổi bật (trên 100g):</Text>
        </View>
        <NutrientHighlights nutrients={food.nutrients} highlightCodes={food.highlightNutrientCodes} />
      </View>
      <View className="pt-2 border-t border-slate-100 flex-row items-center justify-between">
        <Text className="text-[11px] text-slate-500">Chuẩn 100g</Text>
        <View className="flex-row items-center" style={{ gap: 4 }}>
          <Text className="text-xs font-medium text-primary">Xem chi tiết</Text>
          <ArrowRight size={13} color="#0D6EFD" />
        </View>
      </View>
    </Pressable>
  );
}
