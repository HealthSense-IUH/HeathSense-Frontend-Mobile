import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';
import { ChevronLeft, Database, Scale } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { nutritionApi } from '@/services/nutrition.service';
import { REFERENCE_SOURCES, formatNutrientAmount } from '@/constants/nutrition';
import { DietAdviceNote } from '@/components/features/nutrition/NutritionBadges';
import type { ReferenceFoodPortion } from '@/types/nutrition';

const PER_100 = -1;

/** Chi tiết một thực phẩm tham chiếu (giống web ReferenceFoodDialog): số liệu tính lại theo khẩu phần chọn. */
export default function ReferenceFoodScreen() {
  const { t } = useTranslation('nutrition');
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [portionIndex, setPortionIndex] = useState(PER_100);
  const { data: food, isLoading } = useQuery({ queryKey: ['nutrition', 'reference-food', id], queryFn: () => nutritionApi.getReferenceFood(id), enabled: !!id });

  const portionLabel = (p: ReferenceFoodPortion) => (p.isDefault ? t('databaseFood.defaultPortion') : p.description);
  const portion = food && portionIndex >= 0 ? food.portions[portionIndex] : undefined;
  const grams = portion ? portion.gramWeight : 100;
  const factor = grams / 100;
  const sourceInfo = food ? REFERENCE_SOURCES[food.source] : null;
  const keyNutrients = food?.nutrients.filter((n) => n.isKey) ?? [];
  const otherNutrients = food?.nutrients.filter((n) => !n.isKey) ?? [];

  return (
    <ScreenWrapper
      title={food?.displayName ?? t('databaseFood.title')}
      description={food?.localName && food.localName !== food.displayName ? food.localName : undefined}
      headerLeft={
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/nutrition' as any))} className="h-10 w-10 items-center justify-center bg-muted rounded-full active:opacity-70" aria-label={t('common:actions.back')}>
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
      }
    >
      <View className="px-5 pb-10 mt-2" style={{ gap: 14 }}>
        {isLoading ? (
          <View className="py-16 items-center"><ActivityIndicator size="large" color="#0D6EFD" /></View>
        ) : !food || !sourceInfo ? (
          <View className="items-center py-10" style={{ gap: 6 }}>
            <Text className="text-sm font-semibold text-slate-700">{t('databaseFood.notFoundTitle')}</Text>
            <Text className="text-xs text-slate-500 text-center">{t('databaseFood.notFoundDescription')}</Text>
          </View>
        ) : (
          <>
            <View className="flex-row flex-wrap items-center" style={{ gap: 6 }}>
              <Pressable onPress={() => router.push(`/nutrition/group/${food.group}` as any)} className="px-2.5 py-0.5 rounded-md bg-primary/10">
                <Text className="text-xs font-semibold text-primary">{food.groupName}</Text>
              </Pressable>
              <View className="flex-row items-center px-2.5 py-0.5 rounded-md bg-slate-100" style={{ gap: 4 }}>
                <Database size={11} color="#475569" />
                <Text className="text-xs font-medium text-slate-600">{t('databaseFood.sourceCode', { source: sourceInfo.label, code: food.sourceFoodCode })}</Text>
              </View>
            </View>
            {food.sourceCategory ? <Text className="text-xs text-slate-500">{t('databaseFood.sourceCategory', { category: food.sourceCategory })}</Text> : null}

            <DietAdviceNote advice={food.advice} />

            {food.wastePct != null && food.wastePct > 0 ? (
              <Text className="text-xs text-slate-600">
                <Trans t={t} i18nKey="databaseFood.wastePct" values={{ value: formatNutrientAmount(food.wastePct) }} components={{ strong: <Text className="font-semibold" /> }} />
              </Text>
            ) : null}

            <View className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
              <View className="bg-slate-50/60 border-b border-slate-100 p-4" style={{ gap: 10 }}>
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Scale size={15} color="#0D6EFD" />
                  <Text className="text-base font-bold text-slate-900">{t('databaseFood.nutritionTitle')}</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {[{ idx: PER_100, label: '100 g' }, ...food.portions.map((p, i) => ({ idx: i, label: `${portionLabel(p)} (${formatNutrientAmount(p.gramWeight)} g)` }))].map((opt) => {
                    const active = portionIndex === opt.idx;
                    return (
                      <Pressable key={opt.idx} onPress={() => setPortionIndex(opt.idx)} className={`px-3 py-1.5 rounded-xl border ${active ? 'bg-primary border-primary' : 'bg-white border-slate-200'}`}>
                        <Text className={`text-xs font-medium ${active ? 'text-white' : 'text-slate-600'}`}>{opt.label}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Text className="text-xs text-slate-600">
                  {portion ? (
                    <Trans
                      t={t}
                      i18nKey="databaseFood.calculatingForPortion"
                      values={{ grams: formatNutrientAmount(grams), portion: portionLabel(portion) }}
                      components={{ strong: <Text className="font-semibold" /> }}
                    />
                  ) : (
                    <Trans t={t} i18nKey="databaseFood.calculatingFor" values={{ grams: formatNutrientAmount(grams) }} components={{ strong: <Text className="font-semibold" /> }} />
                  )}
                </Text>
              </View>
              <View className="p-4" style={{ gap: 10 }}>
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {keyNutrients.map((n) => (
                    <View key={n.nutrientCode} className="rounded-2xl bg-slate-50 border border-slate-100 p-3" style={{ width: '48%', flexGrow: 1 }}>
                      <Text className="text-[11px] text-slate-500" numberOfLines={1}>{n.name}</Text>
                      <Text className="text-lg font-bold text-slate-900 mt-0.5">
                        {formatNutrientAmount(n.amount * factor)} <Text className="text-xs font-medium text-slate-500">{n.unit}</Text>
                      </Text>
                    </View>
                  ))}
                </View>
                {otherNutrients.length > 0 ? (
                  <View className="pt-2 border-t border-slate-100" style={{ gap: 6 }}>
                    {otherNutrients.map((n) => (
                      <View key={n.nutrientCode} className="rounded-xl bg-slate-50/70 border border-slate-100 px-3 py-2 flex-row items-center justify-between">
                        <Text className="text-xs text-slate-500 flex-1">{n.name}</Text>
                        <Text className="text-xs font-semibold text-slate-800">{formatNutrientAmount(n.amount * factor)} {n.unit}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>

            <Text className="text-[11px] text-slate-500 leading-4">
              {`${food.source === 'VN_FCT' ? t('databaseFood.footer.vnFct') : t('databaseFood.footer.usda')} ${t('databaseFood.footer.disclaimer')}`}
              {'\n'}
              <Text className="italic">{t('databaseFood.citation', { citation: sourceInfo.citation })}</Text>
            </Text>
          </>
        )}
      </View>
    </ScreenWrapper>
  );
}
