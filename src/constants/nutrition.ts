import {
  AlertCircle,
  AlertTriangle,
  Apple,
  Ban,
  Beef,
  Candy,
  Carrot,
  CheckCircle2,
  Circle,
  Coffee,
  CookingPot,
  CupSoda,
  Droplet,
  Droplets,
  Egg,
  Fish,
  HeartPulse,
  HelpCircle,
  Leaf,
  Milk,
  Nut,
  Package,
  Pill,
  Scale,
  Soup,
  Sprout,
  Utensils,
  Wheat,
  Wine,
  type LucideIcon,
} from 'lucide-react-native';
import i18n, { currentIntlLocale } from '@/i18n';
import type { DietAdviceLevel, DietRuleCode, EvidenceSourceType, GuidanceType, NutrientCode, ReferenceFoodSource } from '@/types/nutrition';

/**
 * Nhãn, màu, icon của module Ăn uống — cùng nội dung với web (pages/app/general/nutrition + locales nutrition.json).
 * Mọi nhãn chữ là getter dịch lúc đọc (i18n.t) để đổi theo ngôn ngữ đang chọn; màu và Icon giữ tĩnh.
 */
export interface BadgeStyle {
  label: string;
  bg: string;
  text: string;
  border: string;
  Icon: LucideIcon;
}

type BadgeColors = Pick<BadgeStyle, 'bg' | 'text' | 'border'>;

/** Huy hiệu có nhãn dịch lúc đọc; `labelKey` là khóa trong namespace nutrition. */
function badgeStyle(labelKey: string, colors: BadgeColors, Icon: LucideIcon): BadgeStyle {
  return {
    ...colors,
    Icon,
    get label() {
      return i18n.t(`nutrition:${labelKey}`);
    },
  };
}

/** Bản đồ khóa → nhãn dịch lúc đọc (dùng cho các Record nhãn thuần chữ). */
function lazyLabels<K extends string>(keys: Record<K, string>, prefix: string): Record<K, string> {
  const out = {} as Record<K, string>;
  for (const k of Object.keys(keys) as K[]) {
    Object.defineProperty(out, k, { enumerable: true, get: () => i18n.t(`nutrition:${prefix}.${keys[k]}`) });
  }
  return out;
}

export const GUIDANCE_STYLE: Record<GuidanceType, BadgeStyle> = {
  PRIORITIZE: badgeStyle('guidance.PRIORITIZE', { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' }, CheckCircle2),
  CAUTION: badgeStyle('guidance.CAUTION', { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' }, AlertCircle),
  LIMIT: badgeStyle('guidance.LIMIT', { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' }, AlertTriangle),
};

export const GUIDANCE_FALLBACK: BadgeStyle = badgeStyle('guidance.reference', { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' }, Circle);

/** Không spread badgeStyle() vì spread sẽ chạy getter một lần và đóng băng nhãn. */
function dietAdviceStyle(level: DietAdviceLevel, colors: BadgeColors, Icon: LucideIcon): BadgeStyle & { legend: string } {
  return {
    ...colors,
    Icon,
    get label() {
      return i18n.t(`nutrition:dietAdvice.level.${level}`);
    },
    get legend() {
      return i18n.t(`nutrition:dietPrescription.legend.${level}`);
    },
  };
}

export const DIET_ADVICE_STYLE: Record<DietAdviceLevel, BadgeStyle & { legend: string }> = {
  GOOD: dietAdviceStyle('GOOD', { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' }, HeartPulse),
  OK: dietAdviceStyle('OK', { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' }, Circle),
  CAUTION: dietAdviceStyle('CAUTION', { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' }, AlertTriangle),
  LIMIT: dietAdviceStyle('LIMIT', { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' }, Ban),
  UNKNOWN: dietAdviceStyle('UNKNOWN', { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' }, HelpCircle),
};

/** Icon nhóm thực phẩm: backend trả tên icon lucide (cột nutrition_food_groups.icon). */
export const GROUP_ICONS: Record<string, { Icon: LucideIcon; color: string }> = {
  Wheat: { Icon: Wheat, color: '#D97706' },
  Sprout: { Icon: Sprout, color: '#059669' },
  Nut: { Icon: Nut, color: '#B45309' },
  Carrot: { Icon: Carrot, color: '#059669' },
  Apple: { Icon: Apple, color: '#EF4444' },
  Beef: { Icon: Beef, color: '#DC2626' },
  Fish: { Icon: Fish, color: '#2563EB' },
  Egg: { Icon: Egg, color: '#D97706' },
  Milk: { Icon: Milk, color: '#3B82F6' },
  Droplet: { Icon: Droplet, color: '#F59E0B' },
  Candy: { Icon: Candy, color: '#EF4444' },
  Soup: { Icon: Soup, color: '#D97706' },
  CupSoda: { Icon: CupSoda, color: '#3B82F6' },
  CookingPot: { Icon: CookingPot, color: '#475569' },
  Package: { Icon: Package, color: '#64748B' },
};

export function getGroupIcon(icon?: string): { Icon: LucideIcon; color: string } {
  return (icon && GROUP_ICONS[icon]) || { Icon: Utensils, color: '#0D6EFD' };
}

/** Tên ngắn của chất dinh dưỡng trên thẻ món (giống web NutrientHighlightCard); mã chất → khóa nutrientShort.* */
export const NUTRIENT_SHORT_LABEL: Partial<Record<NutrientCode, string>> = lazyLabels<NutrientCode>(
  {
    energy: 'energy',
    protein: 'protein',
    carbohydrate: 'carbohydrate',
    fiber: 'fiber',
    fiber_crude: 'fiberCrude',
    sugars: 'sugars',
    fat_total: 'fatTotal',
    fat_saturated: 'fatSaturated',
    fat_monounsaturated: 'fatMonounsaturated',
    fat_polyunsaturated: 'fatPolyunsaturated',
    cholesterol: 'cholesterol',
    sodium: 'sodium',
    potassium: 'potassium',
    magnesium: 'magnesium',
    caffeine: 'caffeine',
    alcohol: 'alcohol',
    vitamin_k: 'vitaminK',
    epa: 'epa',
    dha: 'dha',
  } as Record<NutrientCode, string>,
  'nutrientShort'
);

/** 8 chất chính hiện ở màn chi tiết món có khuyến nghị (giống web GuidanceFoodDialog). */
export const KEY_NUTRIENT_CODES: NutrientCode[] = ['energy', 'protein', 'carbohydrate', 'fat_total', 'fat_saturated', 'sodium', 'potassium', 'magnesium'];

export const EVIDENCE_TYPE_LABEL: Record<EvidenceSourceType, string> = lazyLabels<EvidenceSourceType>(
  { GUIDELINE: 'GUIDELINE', SYSTEMATIC_REVIEW: 'SYSTEMATIC_REVIEW', META_ANALYSIS: 'META_ANALYSIS', RCT: 'RCT', OTHER: 'OTHER' },
  'foodDetail.evidenceType'
);

/** Nguồn dữ liệu tham chiếu: short / label / citation dịch lúc đọc từ sources.<key>.* */
function referenceSource(key: 'vnFct' | 'usdaFndds'): { short: string; label: string; citation: string } {
  return {
    get short() {
      return i18n.t(`nutrition:sources.${key}.short`);
    },
    get label() {
      return i18n.t(`nutrition:sources.${key}.label`);
    },
    get citation() {
      return i18n.t(`nutrition:sources.${key}.citation`);
    },
  };
}

export const REFERENCE_SOURCES: Record<ReferenceFoodSource, { short: string; label: string; citation: string }> = {
  VN_FCT: referenceSource('vnFct'),
  USDA_FNDDS: referenceSource('usdaFndds'),
};

/** Icon và giải thích ngắn (dịch lúc đọc) của một quy tắc */
function ruleMeta(Icon: LucideIcon, code: DietRuleCode): { Icon: LucideIcon; summary: string } {
  return {
    Icon,
    get summary() {
      return i18n.t(`nutrition:dietRules.summary.${code}`);
    },
  };
}

/** Icon và giải thích ngắn của từng quy tắc ăn uống (giống web diet-rules.ts). */
export const DIET_RULE_META: Record<DietRuleCode, { Icon: LucideIcon; summary: string }> = {
  ALCOHOL: ruleMeta(Wine, 'ALCOHOL'),
  CAFFEINE: ruleMeta(Coffee, 'CAFFEINE'),
  SUGARS: ruleMeta(Candy, 'SUGARS'),
  NA_K_RATIO: ruleMeta(Scale, 'NA_K_RATIO'),
  SODIUM: ruleMeta(Droplets, 'SODIUM'),
  SATURATED_FAT: ruleMeta(Beef, 'SATURATED_FAT'),
  MAGNESIUM: ruleMeta(Leaf, 'MAGNESIUM'),
  VITAMIN_K: ruleMeta(Pill, 'VITAMIN_K'),
};

const amount = (v: number) => v.toLocaleString(currentIntlLocale());
const capitalize = (t: string) => (t ? `${t.charAt(0).toUpperCase()}${t.slice(1)}` : t);

/** Diễn đạt ngưỡng của một quy tắc, ví dụ "Đỏ khi trên 400 mg, vàng khi trên 140 mg (trên 100 g)" — giống web. */
export function describeRuleThresholds(
  code: DietRuleCode,
  rule: { unit: string; limit?: number | null; caution?: number | null; good?: number | null },
  sodium?: { limit?: number | null; caution?: number | null }
): string {
  if (code === 'NA_K_RATIO') {
    const parts = [
      rule.limit != null
        ? sodium?.limit != null
          ? i18n.t('nutrition:dietRules.describe.naKLimitWithSodium', { value: amount(rule.limit), sodium: amount(sodium.limit) })
          : i18n.t('nutrition:dietRules.describe.naKLimit', { value: amount(rule.limit) })
        : null,
      rule.good != null ? i18n.t('nutrition:dietRules.describe.naKGood', { value: amount(rule.good) }) : null,
    ].filter(Boolean);
    return capitalize(parts.join('; '));
  }
  if (code === 'MAGNESIUM') {
    if (rule.good == null) return '';
    return sodium?.caution != null
      ? i18n.t('nutrition:dietRules.describe.magnesiumGoodWithSodium', { value: amount(rule.good), unit: rule.unit, sodium: amount(sodium.caution) })
      : i18n.t('nutrition:dietRules.describe.magnesiumGood', { value: amount(rule.good), unit: rule.unit });
  }
  const parts = [
    rule.limit != null ? i18n.t('nutrition:dietRules.describe.limit', { value: amount(rule.limit), unit: rule.unit }) : null,
    rule.caution != null ? i18n.t('nutrition:dietRules.describe.caution', { value: amount(rule.caution), unit: rule.unit }) : null,
  ].filter(Boolean);
  return parts.length ? i18n.t('nutrition:dietRules.describe.per100g', { text: capitalize(parts.join(', ')) }) : '';
}

/** Làm tròn giá trị dinh dưỡng: >= 100 lấy số nguyên, >= 1 lấy 1 chữ số thập phân, còn lại 2 chữ số. */
export function formatNutrientAmount(value: number | null | undefined): string {
  if (value == null) return '—';
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : abs >= 1 ? 1 : 2;
  const factor = 10 ** digits;
  return String(Math.round(value * factor) / factor);
}
