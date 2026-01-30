// 动态获取API基础URL
const getApiBaseUrl = (): string => {
  // 如果有环境变量，优先使用
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // 在浏览器环境中动态获取当前域名
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}/api/v1`;
  }

  // 服务端渲染时的默认值
  return '';
};

const API_BASE_URL = getApiBaseUrl();

// 提取“基准域名”的辅助函数
// - 兼容传统域名: device.minitap.org -> minitap.org
// - 兼容新开发域名: device.m.minitap.org -> m.minitap.org
// - localhost / IP 等特殊情况保持原样
const KNOWN_SUBSYSTEM_PREFIXES = new Set(['op', 'device', 'mall', 'agent', 'settings', 'tenant']);

const getRootDomain = (hostname: string): string => {
  if (hostname === 'localhost' || hostname.includes(':') || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return hostname;
  }

  const parts = hostname.split('.');
  if (parts.length <= 2) {
    return hostname;
  }

  if (KNOWN_SUBSYSTEM_PREFIXES.has(parts[0])) {
    return parts.slice(1).join('.');
  }

  return parts.slice(-2).join('.');
};

// 后台系统域名后缀规则：m.(tenant.domain)
// - 若当前已是 m.* 则保持不变
const toAdminBaseDomain = (domain: string): string => {
  const domainWithoutPort = domain.split(':')[0];
  if (domainWithoutPort === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(domainWithoutPort)) {
    return domainWithoutPort;
  }

  return domainWithoutPort.startsWith('m.') ? domainWithoutPort : `m.${domainWithoutPort}`;
};

// 动态获取登录地址
export const getLoginUrl = (): string => {
  // 在浏览器环境中动态获取
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    const tenantDomain = getRootDomain(hostname);
    const adminBaseDomain = toAdminBaseDomain(tenantDomain);
    return `${protocol}//op.${adminBaseDomain}/login/`;
  }
  
  // 服务端渲染时返回空字符串
  return '';
};

interface ApiResponse<T = unknown> {
  success: boolean;
  err_code: string;
  err_message: string;
  data?: T;
}

export interface PageResponse<T = unknown> {
  success: boolean;
  err_code: string;
  err_message: string;
  data: T[];
  total: number;
  page_size: number;
  has_more: boolean;
  current_page: number;
  total_pages: number;
}

export async function apiRequest<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers);
  const isFormDataBody = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormDataBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers,
  };

  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<T> = await response.json();
    
    // 检查401错误并重定向到登录页
    if (result.err_code === "401") {
      const loginUrl = getLoginUrl();
      if (loginUrl && typeof window !== 'undefined') {
        window.location.href = loginUrl;
      }
    }

    return result;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

export async function apiPageRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<PageResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers);
  const isFormDataBody =
    typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormDataBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers,
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result: PageResponse<T> | ApiResponse = await response.json();

  if ('err_code' in result && result.err_code === '401') {
    const loginUrl = getLoginUrl();
    if (loginUrl && typeof window !== 'undefined') {
      window.location.href = loginUrl;
    }
  }

  if (!('data' in result) || !Array.isArray(result.data)) {
    const message =
      'err_message' in result ? result.err_message : '未知错误';
    throw new Error(message || '接口返回格式错误');
  }

  return result as PageResponse<T>;
}

// 系统相关接口
export const sysApi = {
  logout: () =>
    apiRequest<void>('/sys/user/logout', {
      method: 'POST',
    }),
};

// 上传接口
export const uploadApi = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const resp = await apiRequest<{ url: string }>('/upload/image', {
      method: 'POST',
      body: formData
    });
    if (!resp.success || !resp.data) {
      throw new Error(resp.err_message || '图片上传失败');
    }
    return resp.data.url;
  }
};

// ===== Mall Mgr: Content (Banner/Activity) =====

export interface MallBannerDto {
  id: number;
  title: string;
  image_url: string;
  jump_url: string | null;
  sort_order: number;
  status: number;
  position: number;
  start_time: string | null;
  end_time: string | null;
  click_count: number;
  created_at: string;
}

export const bannerApi = {
  page: (params?: { page?: number; page_size?: number; status?: number; position?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.page_size) queryParams.append('page_size', String(params.page_size));
    if (params?.status !== undefined) queryParams.append('status', String(params.status));
    if (params?.position !== undefined) queryParams.append('position', String(params.position));
    const qs = queryParams.toString();
    return apiPageRequest<MallBannerDto>(`/banner/page${qs ? `?${qs}` : ''}`);
  },

  create: (data: {
    title: string;
    image_url: string;
    jump_url?: string;
    sort_order?: number;
    status?: number;
    position?: number;
    start_time?: string;
    end_time?: string;
  }) =>
    apiRequest<MallBannerDto>('/banner', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (
    id: number,
    data: Partial<{
      title: string;
      image_url: string;
      jump_url: string;
      sort_order: number;
      status: number;
      position: number;
      start_time: string;
      end_time: string;
    }>
  ) =>
    apiRequest<MallBannerDto>(`/banner/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  setStatus: (id: number, status: number) =>
    apiRequest(`/banner/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  delete: (id: number) =>
    apiRequest(`/banner/${id}`, {
      method: 'DELETE',
    }),
};

export interface MallActivityDto {
  activity_id: string;
  title: string;
  description: string | null;
  banner: string | null;
  status: number;
  start_time: string | null;
  end_time: string | null;
  participant_count: number;
  sort_order: number;
  created_at: string;
}

export const activityApi = {
  page: (params?: { page?: number; page_size?: number; status?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.page_size) queryParams.append('page_size', String(params.page_size));
    if (params?.status !== undefined) queryParams.append('status', String(params.status));
    const qs = queryParams.toString();
    return apiPageRequest<MallActivityDto>(`/activity/page${qs ? `?${qs}` : ''}`);
  },

  create: (data: {
    activity_id: string;
    title: string;
    description?: string;
    banner?: string;
    status?: number;
    start_time?: string;
    end_time?: string;
    sort_order?: number;
  }) =>
    apiRequest<MallActivityDto>('/activity', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (
    activityId: string,
    data: Partial<{
      title: string;
      description: string;
      banner: string;
      status: number;
      start_time: string;
      end_time: string;
      sort_order: number;
    }>
  ) =>
    apiRequest<MallActivityDto>(`/activity/${encodeURIComponent(activityId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  setStatus: (activityId: string, status: number) =>
    apiRequest(`/activity/${encodeURIComponent(activityId)}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  delete: (activityId: string) =>
    apiRequest(`/activity/${encodeURIComponent(activityId)}`, {
      method: 'DELETE',
    }),
};

// ===== Mall Mgr: Catalog (Category/Product/SKU/Spec) =====

export interface ProductCategoryNode {
  id: number;
  parent_id: number;
  name: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  level: number;
  path: string;
  is_visible: boolean;
  sort_order: number;
  children: ProductCategoryNode[];
}

export const categoryApi = {
  tree: () => apiRequest<ProductCategoryNode[]>('/category/tree'),

  create: (data: {
    parent_id?: number;
    name: string;
    description?: string;
    icon?: string;
    image?: string;
    is_visible?: boolean;
    sort_order?: number;
  }) =>
    apiRequest<ProductCategoryNode>('/category', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (
    id: number,
    data: Partial<{
      name: string;
      description: string;
      icon: string;
      image: string;
      is_visible: boolean;
      sort_order: number;
    }>
  ) =>
    apiRequest<ProductCategoryNode>(`/category/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  setVisible: (id: number, is_visible: boolean) =>
    apiRequest(`/category/${id}/visible`, {
      method: 'PUT',
      body: JSON.stringify({ is_visible }),
    }),

  delete: (id: number) =>
    apiRequest(`/category/${id}`, {
      method: 'DELETE',
    }),
};

export interface ProductListItem {
  id: number;
  spu_id: string;
  name: string;
  title: string;
  primary_image: string;
  min_price: number;
  max_price: number;
  category_id: number;
  brand: string | null;
  status: number;
  sort_order: number;
  view_count: number;
  sales_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductDetail {
  id: number;
  spu_id: string;
  saas_id: string;
  store_id: string;
  name: string;
  title: string;
  description: string | null;
  primary_image: string;
  images: string[] | null;
  video: string | null;
  min_price: number;
  max_price: number;
  category_id: number;
  brand: string | null;
  tags: string[] | null;
  status: number;
  sort_order: number;
  view_count: number;
  sales_count: number;
  created_at: string;
  updated_at: string;
}

export const productApi = {
  page: (params?: {
    page?: number;
    page_size?: number;
    category_id?: number;
    keyword?: string;
    status?: number;
    sort?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.page_size) queryParams.append('page_size', String(params.page_size));
    if (params?.category_id) queryParams.append('category_id', String(params.category_id));
    if (params?.keyword?.trim()) queryParams.append('keyword', params.keyword.trim());
    if (params?.status !== undefined) queryParams.append('status', String(params.status));
    if (params?.sort !== undefined) queryParams.append('sort', String(params.sort));
    const qs = queryParams.toString();
    return apiPageRequest<ProductListItem>(`/product/page${qs ? `?${qs}` : ''}`);
  },

  detail: (id: number) => apiRequest<ProductDetail>(`/product/${id}`),

  create: (data: {
    name: string;
    title: string;
    description?: string;
    primary_image: string;
    images?: string[];
    video?: string;
    min_price: number;
    max_price: number;
    category_id: number;
    brand?: string;
    tags?: string[];
    status?: number;
    sort_order?: number;
    saas_id?: string;
    store_id?: string;
  }) =>
    apiRequest<ProductDetail>('/product', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (
    id: number,
    data: Partial<{
      name: string;
      title: string;
      description: string;
      primary_image: string;
      images: string[];
      video: string;
      min_price: number;
      max_price: number;
      category_id: number;
      brand: string;
      tags: string[];
      status: number;
      sort_order: number;
    }>
  ) =>
    apiRequest<ProductDetail>(`/product/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  setStatus: (id: number, status: number) =>
    apiRequest(`/product/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  delete: (id: number) =>
    apiRequest(`/product/${id}`, {
      method: 'DELETE',
    }),
};

export interface SkuItem {
  id: number;
  sku_id: string;
  product_id: number;
  spu_id: string;
  name: string;
  specs: Record<string, unknown>;
  image: string | null;
  price: number;
  original_price: number | null;
  stock: number;
  sold_count: number;
  sku_code: string | null;
  barcode: string | null;
  weight: number | null;
  volume: number | null;
  status: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const skuApi = {
  list: (product_id: number) =>
    apiRequest<SkuItem[]>(`/sku/list?product_id=${product_id}`),

  detail: (id: number) => apiRequest<SkuItem>(`/sku/${id}`),

  create: (data: {
    product_id: number;
    sku_id?: string;
    name: string;
    specs: Record<string, unknown>;
    image?: string;
    price: number;
    original_price?: number;
    stock: number;
    sku_code?: string;
    barcode?: string;
    weight?: number;
    volume?: number;
    status?: number;
    sort_order?: number;
  }) =>
    apiRequest<SkuItem>('/sku', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (
    id: number,
    data: Partial<{
      sku_id: string;
      name: string;
      specs: Record<string, unknown>;
      image: string;
      price: number;
      original_price: number;
      stock: number;
      sku_code: string;
      barcode: string;
      weight: number;
      volume: number;
      status: number;
      sort_order: number;
    }>
  ) =>
    apiRequest<SkuItem>(`/sku/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  setStatus: (id: number, status: number) =>
    apiRequest(`/sku/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  adjustStock: (id: number, delta: number) =>
    apiRequest<SkuItem>(`/sku/${id}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ delta }),
    }),

  delete: (id: number) =>
    apiRequest(`/sku/${id}`, {
      method: 'DELETE',
    }),
};

export interface SpecItem {
  id: number;
  product_id: number;
  spec_name: string;
  spec_values: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const specApi = {
  list: (product_id: number) =>
    apiRequest<SpecItem[]>(`/spec/list?product_id=${product_id}`),

  detail: (id: number) => apiRequest<SpecItem>(`/spec/${id}`),

  create: (data: { product_id: number; spec_name: string; spec_values: string[]; sort_order?: number }) =>
    apiRequest<SpecItem>('/spec', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (
    id: number,
    data: Partial<{ spec_name: string; spec_values: string[]; sort_order: number }>
  ) =>
    apiRequest<SpecItem>(`/spec/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest(`/spec/${id}`, {
      method: 'DELETE',
    }),
};

// ===== Mall Mgr: Marketing (Coupon) =====

export interface MallCouponDto {
  id: number;
  name: string;
  description: string | null;
  coupon_type: number;
  face_value: number;
  threshold_amount: number;
  scope_type: number;
  scope_values: unknown | null;
  total_count: number;
  issued_count: number;
  used_count: number;
  per_limit: number;
  validity_type: number;
  start_time: string | null;
  end_time: string | null;
  validity_days: number | null;
  status: number;
  created_at: string;
  updated_at: string;
}

export const couponApi = {
  page: (params?: { page?: number; page_size?: number; status?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.page_size) queryParams.append('page_size', String(params.page_size));
    if (params?.status !== undefined) queryParams.append('status', String(params.status));
    const qs = queryParams.toString();
    return apiPageRequest<MallCouponDto>(`/coupon/page${qs ? `?${qs}` : ''}`);
  },

  detail: (id: number) => apiRequest<MallCouponDto>(`/coupon/${id}`),

  create: (data: {
    name: string;
    description?: string;
    coupon_type: number;
    face_value: number;
    threshold_amount?: number;
    scope_type: number;
    scope_values?: number[];
    total_count: number;
    per_limit: number;
    validity_type: number;
    start_time?: string;
    end_time?: string;
    validity_days?: number;
    status?: number;
  }) =>
    apiRequest<MallCouponDto>('/coupon', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (
    id: number,
    data: Partial<{
      name: string;
      description: string;
      coupon_type: number;
      face_value: number;
      threshold_amount: number;
      scope_type: number;
      scope_values: number[];
      total_count: number;
      per_limit: number;
      validity_type: number;
      start_time: string;
      end_time: string;
      validity_days: number;
    }>
  ) =>
    apiRequest<MallCouponDto>(`/coupon/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  setStatus: (id: number, status: number) =>
    apiRequest<MallCouponDto>(`/coupon/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  delete: (id: number) =>
    apiRequest(`/coupon/${id}`, {
      method: 'DELETE',
    }),
};

// ===== Mall Mgr: Orders =====

export interface MallOrderListItemDto {
  order_no: string;
  user_id: number;
  status: number;
  product_amount: number;
  freight_amount: number;
  discount_amount: number;
  pay_amount: number;
  receiver_name: string;
  receiver_phone: string;
  express_company: string | null;
  express_no: string | null;
  created_at: string;
}

export interface MallOrderItemDto {
  id: number;
  product_id: number;
  sku_id: number;
  spu_id: string;
  product_name: string;
  sku_name: string;
  sku_specs: unknown;
  product_image: string;
  price: number;
  quantity: number;
  amount: number;
  discount_amount: number;
  pay_amount: number;
  refund_status: number;
  refund_amount: number | null;
  comment_status: number;
}

export interface MallOrderDetailDto {
  id: number;
  order_no: string;
  user_id: number;
  order_type: number;
  status: number;
  product_amount: number;
  freight_amount: number;
  discount_amount: number;
  pay_amount: number;
  pay_type: number | null;
  pay_time: string | null;
  transaction_id: string | null;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  express_company: string | null;
  express_no: string | null;
  delivery_time: string | null;
  receive_time: string | null;
  remark: string | null;
  created_at: string;
  items: MallOrderItemDto[];
}

export const orderApi = {
  page: (params?: {
    page?: number;
    page_size?: number;
    status?: number;
    order_no?: string;
    user_id?: number;
    start_time?: string;
    end_time?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.page_size) queryParams.append('page_size', String(params.page_size));
    if (params?.status !== undefined) queryParams.append('status', String(params.status));
    if (params?.order_no?.trim()) queryParams.append('order_no', params.order_no.trim());
    if (params?.user_id !== undefined) queryParams.append('user_id', String(params.user_id));
    if (params?.start_time) queryParams.append('start_time', params.start_time);
    if (params?.end_time) queryParams.append('end_time', params.end_time);
    const qs = queryParams.toString();
    return apiPageRequest<MallOrderListItemDto>(`/order/page${qs ? `?${qs}` : ''}`);
  },

  detail: (order_no: string) =>
    apiRequest<MallOrderDetailDto>(`/order/${encodeURIComponent(order_no)}`),

  ship: (order_no: string, data: { express_company: string; express_no: string }) =>
    apiRequest<MallOrderDetailDto>(`/order/${encodeURIComponent(order_no)}/ship`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ===== Mall Mgr: After-sales (Refund) =====

export interface MallRefundListItemDto {
  refund_no: string;
  order_no: string;
  user_id: number;
  refund_type: number;
  refund_amount: number;
  refund_quantity: number | null;
  status: number;
  created_at: string;
}

export interface MallRefundDetailDto {
  id: number;
  refund_no: string;
  order_id: number;
  order_no: string;
  order_item_id: number | null;
  sku_id: string | null;
  user_id: number;
  refund_type: number;
  refund_reason_id: number | null;
  reason: string;
  description: string | null;
  images: unknown | null;
  refund_amount: number;
  refund_quantity: number | null;
  status: number;
  audit_remark: string | null;
  audit_time: string | null;
  express_company: string | null;
  express_no: string | null;
  refund_transaction_id: string | null;
  refund_time: string | null;
  created_at: string;
  updated_at: string;
}

export const refundApi = {
  page: (params?: {
    page?: number;
    page_size?: number;
    status?: number;
    refund_type?: number;
    refund_no?: string;
    order_no?: string;
    user_id?: number;
    start_time?: string;
    end_time?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.page_size) queryParams.append('page_size', String(params.page_size));
    if (params?.status !== undefined) queryParams.append('status', String(params.status));
    if (params?.refund_type !== undefined)
      queryParams.append('refund_type', String(params.refund_type));
    if (params?.refund_no?.trim()) queryParams.append('refund_no', params.refund_no.trim());
    if (params?.order_no?.trim()) queryParams.append('order_no', params.order_no.trim());
    if (params?.user_id !== undefined) queryParams.append('user_id', String(params.user_id));
    if (params?.start_time) queryParams.append('start_time', params.start_time);
    if (params?.end_time) queryParams.append('end_time', params.end_time);
    const qs = queryParams.toString();
    return apiPageRequest<MallRefundListItemDto>(`/refund/page${qs ? `?${qs}` : ''}`);
  },

  detail: (refund_no: string) =>
    apiRequest<MallRefundDetailDto>(`/refund/${encodeURIComponent(refund_no)}`),

  audit: (refund_no: string, data: { approved: boolean; remark?: string }) =>
    apiRequest<MallRefundDetailDto>(`/refund/${encodeURIComponent(refund_no)}/audit`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// 系统总览页面接口
export const dashboardApi = {
  // 获取系统总览统计
  getStats: () => apiRequest('/dashboard/stats'),

  // 获取场地设备分布
  getPlaceDistribution: () => apiRequest('/dashboard/place-distribution'),

  // 获取实时告警
  getAlerts: () => apiRequest('/dashboard/alerts')
};

// 场地管理页面接口
export const placeApi = {
  // 场地列表查询
  getList: () => apiRequest('/place/list'),

  getStats: () => apiRequest('/place/stats'),

  page: (params?: { page?: number; page_size?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.page_size) queryParams.append('page_size', String(params.page_size));
    if (params?.search?.trim()) queryParams.append('search', params.search.trim());

    const qs = queryParams.toString();
    return apiRequest(`/place/page?${qs}`);
  },

  // 场地详情查询
  getDetail: (id: number) => apiRequest(`/place/${id}`),

  // 场地当前负责代理
  getAgent: (id: number) => apiRequest(`/place/${id}/agent`),

  // 设置/更换场地负责代理
  setAgent: (id: number, data: { agent_id: number }) =>
    apiRequest(`/place/${id}/agent`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // 取消场地负责代理绑定
  unsetAgent: (id: number) =>
    apiRequest(`/place/${id}/agent`, {
      method: 'DELETE'
    }),

  // 创建场地
  create: (data: { name: string; address: string; remark?: string }) =>
    apiRequest('/place', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // 更新场地
  update: (id: number, data: { name?: string; address?: string; status?: number; remark?: string }) =>
    apiRequest(`/place/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // 删除场地
  delete: (id: number) =>
    apiRequest(`/place/${id}`, {
      method: 'DELETE'
    })
};

// 代理选择接口（用于场地负责代理绑定）
export const agentApi = {
  list: (params?: { status?: number; keyword?: string; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.status !== undefined) queryParams.append('status', String(params.status));
    if (params?.keyword?.trim()) queryParams.append('keyword', params.keyword.trim());
    if (params?.limit !== undefined) queryParams.append('limit', String(params.limit));
    const qs = queryParams.toString();
    return apiRequest(`/agent/list${qs ? `?${qs}` : ''}`);
  },
};

// 分组管理接口
export const groupApi = {
  // 创建分组
  create: (data: { place_id: number; name: string }) =>
    apiRequest('/groups', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // 查询分组列表
  getList: (placeId?: number) => {
    const params = placeId ? `?place_id=${placeId}` : '';
    return apiRequest(`/groups${params}`);
  },

  // 查询分组详情
  getDetail: (id: number) => apiRequest(`/groups/${id}`),

  // 更新分组
  update: (id: number, data: { name?: string }) =>
    apiRequest(`/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // 删除分组
  delete: (id: number) =>
    apiRequest(`/groups/${id}`, {
      method: 'DELETE'
    })
};

// 礼品库（gift_template）接口
export const giftTemplateApi = {
  page: (params?: { page?: number; page_size?: number; title?: string; status?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.page_size) queryParams.append('page_size', String(params.page_size));
    if (params?.title?.trim()) queryParams.append('title', params.title.trim());
    if (params?.status !== undefined) queryParams.append('status', String(params.status));
    const qs = queryParams.toString();
    return apiRequest(`/gift/template/page${qs ? `?${qs}` : ''}`);
  },

  create: (data: {
    title: string;
    subtitle?: string;
    image?: string;
    description?: string;
    default_cost: number;
    default_point: number;
    status?: number;
  }) =>
    apiRequest('/gift/template/create', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  update: (data: {
    id: number;
    title?: string;
    subtitle?: string;
    image?: string;
    description?: string;
    default_cost?: number;
    default_point?: number;
    status?: number;
  }) =>
    apiRequest('/gift/template/update', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  delete: (id: number) =>
    apiRequest('/gift/template/delete', {
      method: 'POST',
      body: JSON.stringify({ id })
    })
};

// 场地库存（place_gift）接口
export const placeGiftApi = {
  page: (params: { place_id: number; page?: number; page_size?: number; title?: string }) => {
    const queryParams = new URLSearchParams();
    queryParams.append('place_id', String(params.place_id));
    if (params.page) queryParams.append('page', String(params.page));
    if (params.page_size) queryParams.append('page_size', String(params.page_size));
    if (params.title?.trim()) queryParams.append('title', params.title.trim());
    return apiRequest(`/place/gift/page?${queryParams.toString()}`);
  },

  create: (data: {
    place_id: number;
    title: string;
    subtitle?: string;
    image?: string;
    description?: string;
    cost: number;
    point: number;
    count: number;
    remark?: string;
  }) =>
    apiRequest('/place/gift/create', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  update: (data: {
    id: number;
    title?: string;
    subtitle?: string;
    image?: string;
    description?: string;
    cost?: number;
    point?: number;
    remark?: string;
  }) =>
    apiRequest('/place/gift/update', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  adjust: (data: { id: number; delta: number; remark?: string }) =>
    apiRequest('/place/gift/adjust', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  logs: (params: {
    place_id?: number;
    place_gift_id?: number;
    op_type?: number;
    page?: number;
    page_size?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.place_id) queryParams.append('place_id', String(params.place_id));
    if (params.place_gift_id) queryParams.append('place_gift_id', String(params.place_gift_id));
    if (params.op_type !== undefined) queryParams.append('op_type', String(params.op_type));
    if (params.page) queryParams.append('page', String(params.page));
    if (params.page_size) queryParams.append('page_size', String(params.page_size));
    const qs = queryParams.toString();
    return apiRequest(`/place/gift/logs${qs ? `?${qs}` : ''}`);
  }
};

// 设备管理接口
export const deviceApi = {
  // 设备列表查询
  getList: (params?: {
    place_id?: number;
    group_id?: number;
    status?: string;
    device_type?: number;
    search?: string;
    page?: number;
    page_size?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return apiRequest(`/devices${queryString ? `?${queryString}` : ''}`);
  },

  // 设备详情查询
  getDetail: (id: number) => apiRequest(`/devices/${id}`),

  // 更新设备信息
  update: (
    id: number,
    data: {
      name?: string;
      device_type?: number;
      status?: number;
      point_coin?: number;
      tail_play?: number;
      coin_count?: number;
      coin_levels?: number[];
    }
  ) =>
    apiRequest(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // 获取场地筛选选项
  getPlaceOptions: () => apiRequest('/devices/filter-options/places'),

  // 获取分组筛选选项
  getGroupOptions: (placeId?: number) => {
    const params = placeId ? `?place_id=${placeId}` : '';
    return apiRequest(`/devices/filter-options/groups${params}`);
  },

  // 批量重新分组（支持跨场地迁移）
  reassignGroup: (data: { device_ids: number[]; target_group_id: number }) =>
    apiRequest('/devices/reassign-group', {
      method: 'POST',
      body: JSON.stringify(data)
    })
};

// 设备注册接口
export const deviceRegisterApi = {
  // 获取当前注册状态
  getCurrent: () => apiRequest('/device-register/current'),

  // 获取最近注册日志
  getRecentLogs: () => apiRequest('/device-register/logs/recent'),

  // 开始设备注册
  start: (data: {
    place_id: number;
    group_id: number;
    total: number;
    point_coin?: number;
    tail_play?: number;
    coin_count?: number;
    coin_levels?: number[];
    coin_limit?: number;
    box_count?: number;
  }) =>
    apiRequest('/device-register/start', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // 停止设备注册
  stop: () =>
    apiRequest('/device-register/stop', {
      method: 'POST'
    }),

  // 获取注册批次列表
  getBatches: (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    place_id?: number;
    group_id?: number;
    status?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return apiRequest(`/device-register/batches${queryString ? `?${queryString}` : ''}`);
  },

  // 获取批次注册日志
  getBatchLogs: (batchId: number) => apiRequest(`/device-register/logs/${batchId}`),

  // 获取场地列表
  getPlaces: () => apiRequest('/device-register/places'),

  // 获取场地分组列表
  getGroups: (placeId: number) => apiRequest(`/device-register/groups/${placeId}`),

  // 获取设备类型列表
  getDeviceTypes: () => apiRequest('/device-register/device-types')
};

// 实时监控接口
export const monitoringApi = {
  // 获取实时监控统计
  getStats: () => apiRequest('/monitoring/stats'),

  // 获取场地状态监控
  getVenues: () => apiRequest('/monitoring/venues'),

  // 获取实时警报
  getAlerts: () => apiRequest('/monitoring/alerts')
};

// 报表统计接口
export const reportsApi = {
  // 获取收益报表
  getRevenue: (params?: {
    time_range?: string;
    start_date?: string;
    end_date?: string;
    venue_id?: number;
    device_type_id?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return apiRequest(`/reports/revenue${queryString ? `?${queryString}` : ''}`);
  },

  // 获取设备运行报表
  getDevices: (params?: { time_range?: string; start_date?: string; end_date?: string; venue_id?: number }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return apiRequest(`/reports/devices${queryString ? `?${queryString}` : ''}`);
  },

  // 导出报表
  export: async (data: {
    report_type: 'revenue' | 'devices';
    format: 'excel';
    filters: {
      time_range?: string;
      start_date?: string;
      end_date?: string;
      venue_id?: number;
      device_type_id?: number;
    };
  }) => {
    const response = await fetch(`${API_BASE_URL}/reports/export`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const filename = response.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] || 'report.xlsx';

    return { blob, filename };
  }
};
