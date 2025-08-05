// 设备注册相关类型定义

// 场地信息
export interface Place {
  id: number;
  name: string;
  address: string;
  device_count: number;
  status: number;
}

// 分组信息
export interface Group {
  id: number;
  place_id: number;
  name: string;
  device_count: number;
}

// 设备类型
export interface DeviceType {
  id: number;
  name: string;
}

// 注册批次
export interface DeviceRegisterBatch {
  id: number;
  place_id: number;
  place_name: string;
  group_id: number;
  group_name: string;
  total: number;                    // 最大注册数
  count: number;                    // 注册成功数
  point_coin: number;               // 积分每币
  tail_play: number;                // 尾数是否可玩 0:否 1:是
  coin_count: number;               // 投币档位数
  coin_levels: number[];            // 档位数组
  status: number;                   // 状态 0:未开始 1:进行中 2:已结束 3:已取消
  created_at: string;
  end_time: string | null;          // 结束时间，进行中为null
}

// 注册日志
export interface DeviceRegisterLog {
  id: number;
  device_register_id: number;
  device_no: string;
  place_name: string;
  group_name: string;
  device_type_name: string;
  result: number;                   // 结果 0:未开始 1:成功 2:失败
  result_msg: string;
  created_at: string;
}

// 注册统计
export interface RegistrationStats {
  waiting: number;
  success: number;
  failed: number;
}

// 高级设置
export interface AdvancedSettings {
  point_coin: number;
  tail_play: boolean;
  coin_count: number;
  coin_levels: number[];
}

// API响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  err_code: string;
  err_message: string;
  data?: T;
}

// 分页响应类型
export interface PageResponse<T = unknown> extends ApiResponse<T[]> {
  total: number;
  page_size: number;
  has_more: boolean;
  current_page: number;
  total_pages: number;
}