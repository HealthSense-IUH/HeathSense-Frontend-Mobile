import axiosClient from '@/utils/axiosClient';
import type { ApiResponse, PageResponse } from '@/types/base';
import type { DietPrescription, Food, FoodGroup, ReferenceFood, ReferenceFoodSearchParams, ReferenceFoodSummary } from '@/types/nutrition';

const unwrap = <T>(res: { data: ApiResponse<T> | T }): T => {
  const body = res.data as any;
  return body?.data ?? body?.result ?? body;
};

/** API dinh dưỡng của hội viên — cùng endpoint với web services/nutrition.service.ts */
export const nutritionApi = {
  /** Nhóm thực phẩm, kèm số món và số món có khuyến nghị */
  async getGroups(): Promise<FoodGroup[]> {
    return unwrap<FoodGroup[]>(await axiosClient.get<ApiResponse<FoodGroup[]>>('/api/nutrition/groups'));
  },
  async getGroup(idOrSlug: string): Promise<FoodGroup> {
    return unwrap<FoodGroup>(await axiosClient.get<ApiResponse<FoodGroup>>(`/api/nutrition/groups/${encodeURIComponent(idOrSlug)}`));
  },
  /** Các món có khuyến nghị trong một nhóm */
  async getGroupFoods(idOrSlug: string): Promise<Food[]> {
    return unwrap<Food[]>(await axiosClient.get<ApiResponse<Food[]>>(`/api/nutrition/groups/${encodeURIComponent(idOrSlug)}/foods`));
  },
  async getFood(id: string): Promise<Food> {
    return unwrap<Food>(await axiosClient.get<ApiResponse<Food>>(`/api/nutrition/foods/${encodeURIComponent(id)}`));
  },
  /** Tìm món có khuyến nghị (không phân biệt dấu, tối đa 20) */
  async searchFoods(q: string): Promise<Food[]> {
    return unwrap<Food[]>(await axiosClient.get<ApiResponse<Food[]>>('/api/nutrition/foods/search', { params: { q } }));
  },
  /** Tra cứu toàn bộ dữ liệu tham chiếu (Việt Nam + USDA) */
  async searchReferenceFoods(params: ReferenceFoodSearchParams): Promise<PageResponse<ReferenceFoodSummary>> {
    return unwrap<PageResponse<ReferenceFoodSummary>>(
      await axiosClient.get<ApiResponse<PageResponse<ReferenceFoodSummary>>>('/api/nutrition/reference/foods', { params })
    );
  },
  async getReferenceFood(id: string): Promise<ReferenceFood> {
    return unwrap<ReferenceFood>(await axiosClient.get<ApiResponse<ReferenceFood>>(`/api/nutrition/reference/foods/${encodeURIComponent(id)}`));
  },
  /** Đơn ăn uống bác sĩ kê cho hội viên đang đăng nhập */
  async getMyDietPrescription(): Promise<DietPrescription> {
    return unwrap<DietPrescription>(await axiosClient.get<ApiResponse<DietPrescription>>('/api/nutrition/diet-prescription/me'));
  },
};
