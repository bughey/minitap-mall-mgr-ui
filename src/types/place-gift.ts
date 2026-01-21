export interface PlaceOption {
  id: number;
  name: string;
}

export interface PlaceGift {
  id: number;
  place_id: number;
  title: string;
  subtitle?: string | null;
  image?: string | null;
  description?: string | null;
  cost: number;
  point: number;
  count: number;
  created_at: number;
  updated_at: number;
}

export interface PlaceGiftListResponse {
  data: PlaceGift[];
  total: number;
  page_size: number;
  has_more: boolean;
  current_page: number;
  total_pages: number;
}

export type PlaceGiftLogOpType = 0 | 1 | 2;

export interface PlaceGiftLog {
  id: number;
  place_id: number;
  place_gift_id: number;
  op_type: PlaceGiftLogOpType;
  delta: number;
  before_count: number;
  after_count: number;
  operator_uid?: number | null;
  remark?: string | null;
  created_at: number;
}

export interface PlaceGiftLogListResponse {
  data: PlaceGiftLog[];
  total: number;
  page_size: number;
  has_more: boolean;
  current_page: number;
  total_pages: number;
}

export const getOpTypeText = (opType: PlaceGiftLogOpType): string => {
  switch (opType) {
    case 0:
      return '新增';
    case 1:
      return '调整';
    case 2:
      return '修改信息';
    default:
      return '未知';
  }
};

