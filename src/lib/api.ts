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

  // 场地详情查询
  getDetail: (id: number) => apiRequest(`/place/${id}`),

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
  }
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
