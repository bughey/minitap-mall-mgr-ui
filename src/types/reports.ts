// 报表相关类型定义

// 报表筛选参数
export interface ReportFilters {
  time_range?: 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'custom';
  start_date?: string; // YYYY-MM-DD格式
  end_date?: string;   // YYYY-MM-DD格式
  venue_id?: number;
  device_type_id?: number;
}

// 场地收益详情
export interface VenueDetail {
  venue_name: string;
  today: number;                   // 今日收益
  yesterday: number;               // 昨日收益
  week: number;                    // 本周收益
  month: number;                   // 本月收益
  gamePointsToday: number;         // 今日游戏退分
  gamePointsYesterday: number;     // 昨日游戏退分
  gamePointsWeek: number;          // 本周游戏退分
  gamePointsMonth: number;         // 本月游戏退分
  growth_rate: number;             // 增长率(%)
}

// 收益报表汇总数据
export interface RevenueReportSummary {
  total_revenue: number;           // 总收益(元)
  today_revenue: number;           // 今日收益(元)
  growth_rate: number;             // 环比增长率(%)
  avg_device_revenue: number;      // 设备平均收益(元)
  total_game_points: number;       // 游戏退分总数
}

// 收益报表完整数据结构
export interface RevenueReportData {
  summary: RevenueReportSummary;
  venue_details: VenueDetail[];
}

// 设备类型详情
export interface DeviceTypeDetail {
  type: string;                    // 设备类型名称
  total: number;                   // 总设备数
  active: number;                  // 活跃设备数
  usage: number;                   // 使用率(%)
  faults: number;                  // 故障设备数
}

// 设备运行报表汇总数据
export interface DeviceReportSummary {
  total_devices: number;           // 总设备数
  active_devices: number;          // 活跃设备数
  avg_usage_rate: number;          // 平均使用率(%)
  fault_devices: number;           // 故障设备数
}

// 设备运行报表完整数据结构
export interface DeviceReportData {
  summary: DeviceReportSummary;
  device_type_details: DeviceTypeDetail[];
}

// 报表导出参数
export interface ExportReportParams {
  report_type: 'revenue' | 'devices';
  format: 'excel';
  filters: ReportFilters;
}

// 场地选项
export interface VenueOption {
  id: number;
  name: string;
}

// 设备类型选项
export interface DeviceTypeOption {
  id: number;
  name: string;
}

// 报表类型配置
export interface ReportTypeConfig {
  id: 'revenue' | 'device' | 'fault' | 'usage';
  name: string;
  description: string;
  apiSupported: boolean; // 是否支持API调用
}

// 时间范围配置
export interface TimeRangeConfig {
  id: 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'custom';
  name: string;
}