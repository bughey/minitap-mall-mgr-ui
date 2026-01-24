// 场地状态接口
export interface PlaceStatus {
  is_active: boolean;        // 是否有今日活跃设备
  has_maintenance: boolean;  // 是否有维护设备
  primary_status: 'online' | 'offline'; // 主要状态：online(活跃)/offline(待玩)
}

// 设备分组接口
export interface Group {
  id: number;
  place_id: number;
  name: string;
  device_count: number;
  active_device_count?: number;      // 今日活跃设备数
  maintenance_device_count?: number; // 维护设备数
  today_revenue?: number;            // 今日收益（分，净收益）
  created_at: string;
  updated_at: string;
}

// 场地接口（列表项）
export interface Place {
  id: number;
  name: string;
  address: string;
  status: PlaceStatus;
  total_devices: number;       // 设备总数
  active_devices: number;      // 今日活跃设备数
  maintenance_devices: number; // 维护中的设备数
  today_revenue: number;       // 今日收益（分，净收益）
  groups: Array<{             // 设备分组（简化版）
    name: string;
    devices: number;
  }>;
  remark?: string | null;     // 备注信息
  created_at?: string;        // 创建时间（详情时有）
  updated_at?: string;        // 更新时间（详情时有）
}

export interface PlacePageItem {
  id: number;
  name: string;
  address: string;
  remark?: string | null;
  status: PlaceStatus;
  total_devices: number;
  active_devices: number;
  maintenance_devices: number;
  today_revenue: number; // 今日收益（分，净收益）
  group_count: number;
}

export interface PlacePageResponse {
  data: PlacePageItem[];
  total: number;
  page_size: number;
  has_more: boolean;
  current_page: number;
  total_pages: number;
}

// 场地详情接口
export interface PlaceDetail extends Place {
  remark: string;
  created_at: string;
  updated_at: string;
}

// 场地汇总统计接口
export interface PlaceSummary {
  total_places: number;        // 总场地数
  total_devices: number;       // 总设备数
  active_devices: number;      // 活跃设备数
  today_total_revenue: number; // 今日总收益（分，净收益）
}

// 场地列表响应接口
export interface PlaceListResponse {
  places: Place[];
  summary: PlaceSummary;
}

// 分组列表响应接口
export interface GroupListResponse {
  groups: Group[];
}

// 场地表单数据接口
export interface PlaceFormData {
  name: string;
  address: string;
  remark?: string;
}

// 场地更新数据接口
export interface PlaceUpdateData extends PlaceFormData {
  status?: number;
}

// 分组表单数据接口
export interface GroupFormData {
  place_id: number;
  name: string;
}

// 分组更新数据接口  
export interface GroupUpdateData {
  name?: string;
}

// UI状态枚举
export enum UIStatus {
  ONLINE = 'online',
  OFFLINE = 'offline', 
  MAINTENANCE = 'maintenance'
}

// 将API状态转换为UI状态的工具函数
export const getUIStatus = (status: PlaceStatus): UIStatus => {
  if (status.has_maintenance) {
    return UIStatus.MAINTENANCE;
  }
  return status.is_active ? UIStatus.ONLINE : UIStatus.OFFLINE;
};

// 获取状态显示文本
export const getStatusText = (status: UIStatus): string => {
  switch (status) {
    case UIStatus.ONLINE:
      return '活跃';
    case UIStatus.OFFLINE:
      return '待玩';
    case UIStatus.MAINTENANCE:
      return '维护';
    default:
      return '未知';
  }
};

// 获取状态颜色类名
export const getStatusColor = (status: UIStatus): string => {
  switch (status) {
    case UIStatus.ONLINE:
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case UIStatus.OFFLINE:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    case UIStatus.MAINTENANCE:
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
