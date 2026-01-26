export interface GiftTemplate {
  id: number;
  title: string;
  subtitle?: string | null;
  image?: string | null;
  description?: string | null;
  default_cost: number;
  default_point: number;
  status: number;
  created_at: number;
  updated_at: number;
}

export interface GiftTemplateListResponse {
  data: GiftTemplate[];
  total: number;
  page_size: number;
  has_more: boolean;
  current_page: number;
  total_pages: number;
}

