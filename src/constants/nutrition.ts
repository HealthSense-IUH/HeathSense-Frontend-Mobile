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
import type { DietAdviceLevel, DietRuleCode, EvidenceSourceType, GuidanceType, NutrientCode, ReferenceFoodSource } from '@/types/nutrition';

/**
 * Nhãn, màu, icon của module Ăn uống — cùng nội dung với web (pages/app/general/nutrition + locales nutrition.json).
 */
export interface BadgeStyle {
  label: string;
  bg: string;
  text: string;
  border: string;
  Icon: LucideIcon;
}

export const GUIDANCE_STYLE: Record<GuidanceType, BadgeStyle> = {
  PRIORITIZE: { label: 'Nên ưu tiên', bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', Icon: CheckCircle2 },
  CAUTION: { label: 'Cần lưu ý', bg: '#FFFBEB', text: '#B45309', border: '#FDE68A', Icon: AlertCircle },
  LIMIT: { label: 'Nên hạn chế', bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA', Icon: AlertTriangle },
};

export const GUIDANCE_FALLBACK: BadgeStyle = { label: 'Tham khảo', bg: '#F1F5F9', text: '#475569', border: '#E2E8F0', Icon: Circle };

export const DIET_ADVICE_STYLE: Record<DietAdviceLevel, BadgeStyle & { legend: string }> = {
  GOOD: { label: 'Tốt cho nhịp tim', bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', Icon: HeartPulse, legend: 'Không có điểm xấu và có điểm tốt cho nhịp tim.' },
  OK: { label: 'Không có lưu ý', bg: '#F8FAFC', text: '#475569', border: '#E2E8F0', Icon: Circle, legend: 'Không vướng quy tắc nào, cũng chưa có điểm tốt nổi bật.' },
  CAUTION: { label: 'Cần lưu ý', bg: '#FFFBEB', text: '#B45309', border: '#FDE68A', Icon: AlertTriangle, legend: 'Ăn được, chú ý lượng.' },
  LIMIT: { label: 'Nên hạn chế', bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA', Icon: Ban, legend: 'Nên hạn chế hoặc tránh.' },
  UNKNOWN: { label: 'Chưa đủ số liệu', bg: '#F1F5F9', text: '#475569', border: '#E2E8F0', Icon: HelpCircle, legend: 'Nguồn dữ liệu thiếu số liệu để đánh giá.' },
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

/** Tên ngắn của chất dinh dưỡng trên thẻ món (giống web NutrientHighlightCard). */
export const NUTRIENT_SHORT_LABEL: Partial<Record<NutrientCode, string>> = {
  energy: 'Năng lượng',
  protein: 'Đạm (Protein)',
  carbohydrate: 'Carbs',
  fiber: 'Chất xơ',
  fiber_crude: 'Xơ thô',
  sugars: 'Đường',
  fat_total: 'Tổng chất béo',
  fat_saturated: 'Béo bão hòa',
  fat_monounsaturated: 'Béo không bão hòa đơn',
  fat_polyunsaturated: 'Béo không bão hòa đa',
  cholesterol: 'Cholesterol',
  sodium: 'Natri (Sodium)',
  potassium: 'Kali (Potassium)',
  magnesium: 'Magie',
  caffeine: 'Caffeine',
  alcohol: 'Cồn',
  vitamin_k: 'Vitamin K',
  epa: 'Omega-3 EPA',
  dha: 'Omega-3 DHA',
};

/** 8 chất chính hiện ở màn chi tiết món có khuyến nghị (giống web GuidanceFoodDialog). */
export const KEY_NUTRIENT_CODES: NutrientCode[] = ['energy', 'protein', 'carbohydrate', 'fat_total', 'fat_saturated', 'sodium', 'potassium', 'magnesium'];

export const EVIDENCE_TYPE_LABEL: Record<EvidenceSourceType, string> = {
  GUIDELINE: 'Hướng dẫn lâm sàng (Guideline)',
  SYSTEMATIC_REVIEW: 'Tổng quan hệ thống (Systematic Review)',
  META_ANALYSIS: 'Phân tích gộp (Meta-analysis)',
  RCT: 'Thử nghiệm đối chứng ngẫu nhiên (RCT)',
  OTHER: 'Khuyến cáo chuyên khoa (Clinical Review)',
};

export const REFERENCE_SOURCES: Record<ReferenceFoodSource, { short: string; label: string; citation: string }> = {
  VN_FCT: {
    short: 'Việt Nam',
    label: 'Bảng thành phần thực phẩm Việt Nam 2007',
    citation: 'Viện Dinh dưỡng - Bộ Y tế (2007). Bảng thành phần thực phẩm Việt Nam. Nhà xuất bản Y học, Hà Nội.',
  },
  USDA_FNDDS: {
    short: 'USDA',
    label: 'USDA FNDDS 2021-2023',
    citation: 'U.S. Department of Agriculture, Agricultural Research Service. FoodData Central: FNDDS 2021-2023.',
  },
};

/** Icon và giải thích ngắn của từng quy tắc ăn uống (giống web diet-rules.ts). */
export const DIET_RULE_META: Record<DietRuleCode, { Icon: LucideIcon; summary: string }> = {
  ALCOHOL: { Icon: Wine, summary: 'Cồn là yếu tố kích phát cơn rung nhĩ rõ nhất: món có cồn là đỏ.' },
  CAFFEINE: { Icon: Coffee, summary: 'Caffeine liều cao làm tim đập nhanh: vượt ngưỡng là vàng.' },
  SUGARS: { Icon: Candy, summary: 'Tính trên đường tổng (chưa có số liệu đường bổ sung); không áp cho trái cây và sữa.' },
  NA_K_RATIO: { Icon: Scale, summary: 'Kali bằng hoặc hơn natri giúp ổn định nhịp tim; natri gấp nhiều lần kali mà món lại mặn là đỏ.' },
  SODIUM: { Icon: Droplets, summary: 'Muối nhiều gây giữ nước, tăng áp lực lên tim.' },
  SATURATED_FAT: { Icon: Beef, summary: 'Chất béo bão hòa nhiều làm tăng nguy cơ tim mạch.' },
  MAGNESIUM: { Icon: Leaf, summary: 'Giàu magie mà ít muối (hạt, đậu, ngũ cốc nguyên cám) là điểm tốt cho tim.' },
  VITAMIN_K: { Icon: Pill, summary: 'Đang dùng warfarin: không cần kiêng, nhưng nên ăn lượng vitamin K đều mỗi ngày.' },
};

const amount = (v: number) => v.toLocaleString('vi-VN');
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
          ? `đỏ khi Na/K trên ${amount(rule.limit)} và natri trên ${amount(sodium.limit)} mg`
          : `đỏ khi Na/K trên ${amount(rule.limit)}`
        : null,
      rule.good != null ? `tốt khi Na/K từ ${amount(rule.good)} trở xuống` : null,
    ].filter(Boolean);
    return capitalize(parts.join('; '));
  }
  if (code === 'MAGNESIUM') {
    if (rule.good == null) return '';
    return sodium?.caution != null
      ? `Tốt khi từ ${amount(rule.good)} ${rule.unit} trên 100 g và natri không quá ${amount(sodium.caution)} mg`
      : `Tốt khi từ ${amount(rule.good)} ${rule.unit} trên 100 g`;
  }
  const parts = [
    rule.limit != null ? `đỏ khi trên ${amount(rule.limit)} ${rule.unit}` : null,
    rule.caution != null ? `vàng khi trên ${amount(rule.caution)} ${rule.unit}` : null,
  ].filter(Boolean);
  return parts.length ? `${capitalize(parts.join(', '))} (trên 100 g)` : '';
}

/** Làm tròn giá trị dinh dưỡng: >= 100 lấy số nguyên, >= 1 lấy 1 chữ số thập phân, còn lại 2 chữ số. */
export function formatNutrientAmount(value: number | null | undefined): string {
  if (value == null) return '—';
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : abs >= 1 ? 1 : 2;
  const factor = 10 ** digits;
  return String(Math.round(value * factor) / factor);
}
