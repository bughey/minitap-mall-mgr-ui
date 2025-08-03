const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://device.minitap.org:3002/api/v1';

interface ApiResponse<T = any> {
  success: boolean;
  err_code: string;
  err_message: string;
  data?: T;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

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
  update: (id: number, data: {
    name?: string;
    device_type?: number;
    status?: number;
    point_coin?: number;
    tail_play?: number;
    coin_count?: number;
    coin_levels?: number[];
  }) =>
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
  getDevices: (params?: {
    time_range?: string;
    start_date?: string;
    end_date?: string;
    venue_id?: number;
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