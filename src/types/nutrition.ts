// Kiểu dữ liệu dinh dưỡng — cùng cấu trúc với web src/types/nutrition.ts (phần hội viên dùng)

export type GuidanceType = 'PRIORITIZE' | 'LIMIT' | 'CAUTION';

export type EvidenceSourceType = 'GUIDELINE' | 'SYSTEMATIC_REVIEW' | 'META_ANALYSIS' | 'RCT' | 'OTHER';

export interface EvidenceSource {
  id: string;
  title: string;
  sourceType: EvidenceSourceType;
  authors?: string;
  journal?: string;
  year?: number;
  url?: string;
  summary?: string;
}

export type NutrientCode =
  | 'energy'
  | 'protein'
  | 'carbohydrate'
  | 'fiber'
  | 'fiber_crude'
  | 'sugars'
  | 'fat_total'
  | 'fat_saturated'
  | 'fat_monounsaturated'
  | 'fat_polyunsaturated'
  | 'cholesterol'
  | 'sodium'
  | 'potassium'
  | 'magnesium'
  | 'caffeine'
  | 'alcohol'
  | 'vitamin_k'
  | 'epa'
  | 'dha';

export interface NutrientValue {
  nutrientCode: NutrientCode;
  name: string;
  amount: number;
  unit: string;
  isKey?: boolean;
}

export type FoodGroupId =
  | 'CEREAL'
  | 'TUBER'
  | 'LEGUMES_NUTS'
  | 'VEGETABLE'
  | 'FRUIT'
  | 'MEAT'
  | 'FISH'
  | 'EGG'
  | 'DAIRY'
  | 'FAT_OIL'
  | 'SWEET'
  | 'CONDIMENT'
  | 'BEVERAGE'
  | 'MIXED_DISH'
  | 'OTHER';

/** Món có khuyến nghị tim mạch: nhóm → tên chung (Cá hồi) → biến thể cụ thể (Cá hồi nướng) + khuyến nghị. */
export interface Food {
  id: string;
  group: FoodGroupId;
  groupName: string;
  foodName: string;
  foodNameSpecific: string;
  description: string;
  guidance: GuidanceType;
  guidanceTitle: string;
  guidanceReason: string;
  cardiovascularContext?: string;
  afContext?: string;
  medicationContext?: string;
  sourceFoodCode: string;
  sourceDescription: string;
  servingReference: { amount: number; unit: string };
  nutrients: NutrientValue[];
  highlightNutrientCodes: NutrientCode[];
  evidenceSources: EvidenceSource[];
  imageUrl?: string;
}

export type ReferenceFoodSource = 'VN_FCT' | 'USDA_FNDDS';

export interface FoodGroup {
  id: FoodGroupId;
  name: string;
  slug: string;
  description?: string;
  /** Tên icon lucide */
  icon?: string;
  imageUrl?: string;
  foodCount: number;
  sourceCounts: Partial<Record<ReferenceFoodSource, number>>;
  guidanceFoodCount: number;
}

export interface ReferenceFoodSummary {
  id: string;
  source: ReferenceFoodSource;
  sourceFoodCode: string;
  displayName: string;
  localName?: string;
  group: FoodGroupId;
  groupName: string;
  energyKcal?: number;
  proteinG?: number;
  carbohydrateG?: number;
  fatTotalG?: number;
  advice?: DietAdvice;
}

export interface ReferenceFoodPortion {
  description: string;
  gramWeight: number;
  isDefault: boolean;
}

export interface ReferenceFood {
  id: string;
  sourceFoodCode: string;
  displayName: string;
  localName?: string;
  group: FoodGroupId;
  groupName: string;
  sourceCategory?: string;
  source: ReferenceFoodSource;
  sourceVersion: string;
  wastePct?: number;
  nutrients: NutrientValue[];
  portions: ReferenceFoodPortion[];
  advice?: DietAdvice;
}

export interface ReferenceFoodSearchParams {
  q?: string;
  group?: string;
  source?: ReferenceFoodSource;
  page?: number;
  size?: number;
}

export type DietAdviceLevel = 'GOOD' | 'OK' | 'CAUTION' | 'LIMIT' | 'UNKNOWN';

export interface DietAdviceReason {
  code: string;
  level: DietAdviceLevel;
  message: string;
}

export interface DietAdvice {
  level: DietAdviceLevel;
  reasons: DietAdviceReason[];
  personalized: boolean;
}

export type DietRuleCode = 'ALCOHOL' | 'CAFFEINE' | 'SUGARS' | 'NA_K_RATIO' | 'SODIUM' | 'SATURATED_FAT' | 'MAGNESIUM' | 'VITAMIN_K';

export interface DietPrescriptionRule {
  code: DietRuleCode;
  name: string;
  unit: string;
  enabled: boolean;
  prescribed: boolean;
  overridable: boolean;
  defaultGood?: number;
  good?: number;
  effectiveGood?: number;
  defaultLimit?: number;
  defaultCaution?: number;
  limit?: number;
  caution?: number;
  effectiveLimit?: number;
  effectiveCaution?: number;
}

export interface DietPrescription {
  memberId: number;
  personalized: boolean;
  note?: string;
  prescribedBy?: number;
  consultationSessionId?: number;
  updatedAt?: string;
  rules: DietPrescriptionRule[];
  limitSodium: boolean;
  onWarfarin: boolean;
  avoidAlcohol: boolean;
  limitCaffeine: boolean;
  limitSugars: boolean;
  watchSodiumPotassium: boolean;
  limitSaturatedFat: boolean;
  encourageMagnesium: boolean;
}
