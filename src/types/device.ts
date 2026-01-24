// 设备状态枚举
export enum DeviceStatus {
  NORMAL = 0,      // 正常
  MAINTENANCE = 1  // 维护
}

// 设备在线状态枚举
export enum DeviceOnlineStatus {
  OFFLINE = 0,     // 离线
  ONLINE = 1       // 在线
}

// 设备业务状态（用于筛选）
export type DeviceBusinessStatus = 'active' | 'idle' | 'maintenance';

// 设备接口
export interface Device {
  id: number;
  device_no: string;               // 设备号
  name: string;                    // 设备名称
  device_type: number;             // 设备类型ID
  device_type_name: string;        // 设备类型名称
  status: DeviceStatus;            // 设备状态：0-正常 1-维护
  status_name: string;             // 设备状态名称
  online: DeviceOnlineStatus;      // 在线状态：0-离线 1-在线
  online_name: string;             // 在线状态名称
  place_id: number | null;         // 场地ID（可能为空）
  place_name: string | null;       // 场地名称（可能为空）
  group_id: number | null;         // 分组ID（可能为空）
  group_name: string | null;       // 分组名称（可能为空）
  active_time_today: number;       // 今日活跃时长（分钟）
  today_revenue: number;           // 今日收益（分，净收益）
  last_update: string;             // 最后更新时间
  created_at: string;              // 创建时间
  updated_at: string;              // 更新时间
}

// 设备详情接口（包含更多配置信息）
export interface DeviceDetail extends Device {
  point_coin?: number;             // 积分每币
  tail_play?: number;              // 尾数是否可玩：0-否 1-是
  coin_count?: number;             // 投币档位数
  coin_levels?: number[];          // 档位数组
}

// 设备列表响应接口
export interface DeviceListResponse {
  devices: Device[];
  total: number;                   // 总记录数
  page: number;                    // 页码（从1开始）
  page_size: number;               // 每页大小
  total_pages: number;             // 总页数
}

// 筛选选项接口
export interface FilterOption {
  id: number;
  name: string;
}

// 筛选选项响应接口
export interface FilterOptionsResponse {
  options: FilterOption[];
}

// 设备查询参数接口
export interface DeviceQueryParams {
  place_id?: number;               // 场地筛选
  group_id?: number;               // 分组筛选
  status?: DeviceBusinessStatus;   // 状态筛选：active/idle/maintenance
  device_type?: number;            // 设备类型筛选
  search?: string;                 // 按设备号搜索
  page?: number;                   // 页码，从1开始
  page_size?: number;              // 每页大小，默认10，最大100
}

// 设备更新数据接口
export interface DeviceUpdateData {
  name?: string;                   // 设备名称
  device_type?: number;            // 设备类型
  status?: DeviceStatus;           // 设备状态：0-正常 1-维护
  point_coin?: number;             // 积分每币
  tail_play?: number;              // 尾数是否可玩：0-否 1-是
  coin_count?: number;             // 投币档位数
  coin_levels?: number[];          // 档位数组
}

// 设备类型接口
export interface DeviceType {
  id: number;
  name: string;
}

// UI状态工具函数
export const getDeviceBusinessStatus = (device: Device): DeviceBusinessStatus => {
  // 如果设备状态为维护，返回维护中
  if (device.status === DeviceStatus.MAINTENANCE) {
    return 'maintenance';
  }
  
  // 根据今日收益判断是否活跃（简化逻辑，实际应该根据订单数量判断）
  return device.today_revenue > 0 ? 'active' : 'idle';
};

// 获取状态显示文本
export const getStatusDisplayText = (status: DeviceBusinessStatus): string => {
  switch (status) {
    case 'active':
      return '活跃';
    case 'idle':
      return '待玩';
    case 'maintenance':
      return '维护中';
    default:
      return '未知';
  }
};

// 获取状态颜色类名
export const getStatusColorClass = (status: DeviceBusinessStatus): string => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'idle':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    case 'maintenance':
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// 格式化活跃时长（分钟转为小时分钟）
export const formatActiveTime = (minutes: number): string => {
  if (minutes === 0) return '0分钟';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes}分钟`;
  } else if (remainingMinutes === 0) {
    return `${hours}小时`;
  } else {
    return `${hours}小时${remainingMinutes}分钟`;
  }
};

// 格式化收益金额
export const formatRevenue = (amount: number): string => {
  const amountYuan = amount / 100;
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amountYuan);
};

// 格式化相对时间
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return '刚刚';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}分钟前`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}小时前`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}天前`;
  }
};
