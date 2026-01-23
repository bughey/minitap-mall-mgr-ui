// 实时监控相关的类型定义

// 实时监控统计数据
export interface MonitoringStats {
  realTimeRevenue: number; // 实时收益（分，净收益）
  activeDevices: number;
  gameCount: number;
  gameRefund: number;
  totalDevices: number;
  recentRevenueChange: number; // 单位：分（如后端提供）
  recentGameChange: number;
}

// 场地状态监控数据
export interface VenueStatus {
  id: number;
  name: string;
  activeDevices: number;
  totalDevices: number;
  gameCount: number;
  revenue: number; // 场地收益（分，净收益）
  refundCount: number;
  status: 'normal' | 'warning' | 'error';
  lastUpdateTime: string;
}

// 实时警报数据
export interface MonitoringAlert {
  id: number;
  message: string;
  time: string;
  type: 'error' | 'warning' | 'success' | 'info';
  venue: string;
  venueId: number;
  deviceId?: number;
  deviceName?: string;
  isRead: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// API响应数据类型
export interface MonitoringStatsResponse {
  success: boolean;
  err_code: string;
  err_message: string;
  data: MonitoringStats;
}

export interface VenueStatusResponse {
  success: boolean;
  err_code: string;
  err_message: string;
  data: VenueStatus[];
}

export interface MonitoringAlertsResponse {
  success: boolean;
  err_code: string;
  err_message: string;
  data: MonitoringAlert[];
}
