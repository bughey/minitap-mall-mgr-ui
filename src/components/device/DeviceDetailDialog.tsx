'use client';

import { useEffect, useState } from 'react';
import { Eye, Loader2, Clock, MapPin, Coins, Settings, Activity } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { deviceApi } from '@/lib/api';
import {
  Device,
  DeviceDetail,
  DeviceBusinessStatus,
  getDeviceBusinessStatus,
  getStatusDisplayText,
  getStatusColorClass,
  formatActiveTime,
  formatRevenue,
  formatRelativeTime,
} from '@/types/device';

function getStatusBadge(status: DeviceBusinessStatus) {
  const text = getStatusDisplayText(status);
  const colorClass = getStatusColorClass(status);
  
  return (
    <Badge variant="outline" className={colorClass}>
      {text}
    </Badge>
  );
}

interface DeviceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceId?: number;
  device?: Device; // 可以传入基础设备信息以显示加载前的数据
}

export default function DeviceDetailDialog({
  open,
  onOpenChange,
  deviceId,
  device
}: DeviceDetailDialogProps) {
  const [deviceDetail, setDeviceDetail] = useState<DeviceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 当对话框打开且有设备ID时获取详情
  useEffect(() => {
    if (open && deviceId) {
      fetchDeviceDetail();
    } else if (!open) {
      // 对话框关闭时清理状态
      setDeviceDetail(null);
      setError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, deviceId]);

  const fetchDeviceDetail = async () => {
    if (!deviceId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await deviceApi.getDetail(deviceId);
      
      if (response.success && response.data) {
        setDeviceDetail(response.data as DeviceDetail);
      } else {
        throw new Error(response.err_message || '获取设备详情失败');
      }
    } catch (err) {
      console.error('Device detail fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : '获取设备详情失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 使用设备详情或传入的基础设备信息
  const displayDevice = deviceDetail || device;
  const businessStatus = displayDevice ? getDeviceBusinessStatus(displayDevice) : 'idle';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>设备详情</span>
          </DialogTitle>
          <DialogDescription>
            查看设备的详细信息和配置
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-muted-foreground">加载中...</span>
          </div>
        ) : displayDevice ? (
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  基本信息
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">设备编号：</span>
                    <span className="font-mono">{displayDevice.device_no}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">设备名称：</span>
                    <span>{displayDevice.name}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">设备类型：</span>
                    <span>{displayDevice.device_type_name}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">设备状态：</span>
                    {getStatusBadge(businessStatus)}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  位置信息
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">所属场地：</span>
                    <span>{displayDevice.place_name ?? '-'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">设备分组：</span>
                    <span>{displayDevice.group_name ?? '-'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">在线状态：</span>
                    <Badge variant={displayDevice.online === 1 ? "default" : "secondary"}>
                      {displayDevice.online_name}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* 运营数据 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5" />
                运营数据
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">今日活跃时长</span>
                  </div>
                  <p className="text-xl font-bold">
                    {formatActiveTime(displayDevice.active_time_today)}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">今日收益</span>
                  </div>
                  <p className="text-xl font-bold text-green-600">
                    {formatRevenue(displayDevice.today_revenue)}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">最后更新</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatRelativeTime(displayDevice.last_update)}
                  </p>
                </div>
              </div>
            </div>

            {/* 设备配置（如果有详细信息） */}
            {deviceDetail && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    设备配置
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {deviceDetail.point_coin !== undefined && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">积分每币：</span>
                        <span className="ml-2">{deviceDetail.point_coin} 积分</span>
                      </div>
                    )}
                    {deviceDetail.tail_play !== undefined && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">尾数可玩：</span>
                        <Badge variant={deviceDetail.tail_play === 1 ? "default" : "secondary"} className="ml-2">
                          {deviceDetail.tail_play === 1 ? '是' : '否'}
                        </Badge>
                      </div>
                    )}
                    {deviceDetail.coin_count !== undefined && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">投币档位数：</span>
                        <span className="ml-2">{deviceDetail.coin_count} 档</span>
                      </div>
                    )}
                    {deviceDetail.coin_levels && deviceDetail.coin_levels.length > 0 && (
                      <div className="md:col-span-2">
                        <span className="text-sm font-medium text-muted-foreground">档位设置：</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {deviceDetail.coin_levels.map((level, index) => (
                            <Badge key={index} variant="outline">
                              {level} 币
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* 时间信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">创建时间：</span>
                <span className="ml-2">{new Date(displayDevice.created_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="font-medium">更新时间：</span>
                <span className="ml-2">{new Date(displayDevice.updated_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            没有可显示的设备信息
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
