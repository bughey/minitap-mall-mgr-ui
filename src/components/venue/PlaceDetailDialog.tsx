'use client';

import { useEffect, useState } from 'react';
import { Eye, Loader2, Building, MapPin, Computer, DollarSign, ChevronDown, ChevronRight, Activity, Clock, Coins } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { placeApi, groupApi, deviceApi } from '@/lib/api';
import { Place, Group } from '@/types/venue';
import { Device, DeviceListResponse, getDeviceBusinessStatus, getStatusDisplayText, getStatusColorClass, formatActiveTime, formatRevenue } from '@/types/device';

interface PlaceDetailWithData extends Place {
  groups_detail: Array<Group & { devices: Device[] }>;
}

interface PlaceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeId?: number;
  place?: Place | null; // 传入基础场地信息以显示加载前的数据
}

export default function PlaceDetailDialog({
  open,
  onOpenChange,
  placeId,
  place
}: PlaceDetailDialogProps) {
  const [placeDetail, setPlaceDetail] = useState<PlaceDetailWithData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

  // 当对话框打开且有场地ID时获取详情
  useEffect(() => {
    if (open && placeId) {
      fetchPlaceDetail();
    } else if (!open) {
      // 对话框关闭时清理状态
      setPlaceDetail(null);
      setError(null);
      setExpandedGroups(new Set());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, placeId]);

  const fetchPlaceDetail = async () => {
    if (!placeId) return;

    try {
      setLoading(true);
      setError(null);

      // 并行获取场地详情和分组列表
      const [placeResponse, groupsResponse] = await Promise.all([
        placeApi.getDetail(placeId),
        groupApi.getList(placeId)
      ]);

      if (!placeResponse.success) {
        throw new Error(placeResponse.err_message || '获取场地详情失败');
      }

      if (!groupsResponse.success) {
        throw new Error(groupsResponse.err_message || '获取分组列表失败');
      }

      const placeData = placeResponse.data as Place;
      const groupsData = groupsResponse.data as { groups: Group[] };

      // 获取场地所有设备
      const devicesResponse = await deviceApi.getList({
        place_id: placeId,
        page_size: 100 // 后端上限为100
      });

      if (!devicesResponse.success) {
        throw new Error(devicesResponse.err_message || '获取设备列表失败');
      }

      const devicesData = devicesResponse.data as DeviceListResponse;
      const devices = devicesData?.devices || [];

      // 按分组分类设备
      const devicesByGroup = new Map<number, Device[]>();
      devices.forEach((device: Device) => {
        if (device.group_id == null) return;
        if (!devicesByGroup.has(device.group_id)) {
          devicesByGroup.set(device.group_id, []);
        }
        devicesByGroup.get(device.group_id)!.push(device);
      });

      // 构建完整的场地数据
      const groupsWithDevices = groupsData.groups.map(group => ({
        ...group,
        devices: devicesByGroup.get(group.id) || []
      }));

      setPlaceDetail({
        ...placeData,
        groups_detail: groupsWithDevices
      });

    } catch (err) {
      console.error('Place detail fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : '获取场地详情失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 切换分组展开状态
  const toggleGroupExpanded = (groupId: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  // 格式化数字
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('zh-CN').format(num);
  };

  // 格式化货币
  const formatCurrency = (num: number) => {
    const amountYuan = num / 100;
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amountYuan);
  };

  // 获取设备状态徽章
  const getDeviceStatusBadge = (device: Device) => {
    const businessStatus = getDeviceBusinessStatus(device);
    const statusText = getStatusDisplayText(businessStatus);
    const colorClass = getStatusColorClass(businessStatus);
    
    return (
      <Badge variant="outline" className={colorClass}>
        {statusText}
      </Badge>
    );
  };

  // 使用场地详情或传入的基础场地信息
  const displayPlace = placeDetail || place;
  const remarkText =
    displayPlace && typeof displayPlace.remark === 'string' ? displayPlace.remark.trim() : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>场地详情</span>
          </DialogTitle>
          <DialogDescription>
            查看场地的详细信息、分组和设备
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button 
              variant="link" 
              onClick={fetchPlaceDetail} 
              className="mt-2 p-0 h-auto text-destructive"
            >
              重试
            </Button>
          </div>
        )}

        {loading && !displayPlace ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-muted-foreground">加载中...</span>
          </div>
        ) : displayPlace ? (
          <div className="space-y-6">
            {/* 基本信息 */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{displayPlace.name}</h3>
                      <p className="text-muted-foreground flex items-center mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        {displayPlace.address}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">备注</div>
                    <div
                      className={`text-sm whitespace-pre-wrap break-words ${
                        remarkText ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {remarkText || '暂无'}
                    </div>
                  </div>

                  {/* 统计数据 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Computer className="w-5 h-5 text-blue-500" />
                      </div>
                      <p className="text-2xl font-bold">{formatNumber(displayPlace.total_devices)}</p>
                      <p className="text-sm text-muted-foreground">设备总数</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Activity className="w-5 h-5 text-green-500" />
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {formatNumber(displayPlace.active_devices)}
                      </p>
                      <p className="text-sm text-muted-foreground">活跃设备</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <div className="w-5 h-5 bg-yellow-500 rounded-full"></div>
                      </div>
                      <p className="text-2xl font-bold text-yellow-600">
                        {formatNumber(displayPlace.maintenance_devices)}
                      </p>
                      <p className="text-sm text-muted-foreground">维护设备</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <DollarSign className="w-5 h-5 text-blue-500" />
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(displayPlace.today_revenue)}
                      </p>
                      <p className="text-sm text-muted-foreground">今日收益</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* 设备分组 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">设备分组</h3>
              
              {loading && !placeDetail ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                          <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : placeDetail && placeDetail.groups_detail.length > 0 ? (
                <div className="space-y-3">
                  {placeDetail.groups_detail.map((group) => {
                    const isExpanded = expandedGroups.has(group.id);
                    const deviceCount = group.devices.length;
                    const activeDeviceCount = group.devices.filter(d => getDeviceBusinessStatus(d) === 'active').length;
                    const maintenanceDeviceCount = group.devices.filter(d => getDeviceBusinessStatus(d) === 'maintenance').length;
                    const groupRevenue = group.devices.reduce((sum, d) => sum + d.today_revenue, 0);

                    return (
                      <Card key={group.id}>
                        <CardHeader className="pb-3">
                          <div 
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleGroupExpanded(group.id)}
                          >
                            <div className="flex items-center space-x-2">
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5" />
                              ) : (
                                <ChevronRight className="w-5 h-5" />
                              )}
                              <div>
                                <h4 className="font-medium">{group.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {deviceCount} 台设备 • 活跃 {activeDeviceCount} • 维护 {maintenanceDeviceCount}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-blue-600">{formatCurrency(groupRevenue)}</p>
                              <p className="text-sm text-muted-foreground">今日收益</p>
                            </div>
                          </div>
                        </CardHeader>

                        {isExpanded && (
                          <CardContent>
                            {deviceCount === 0 ? (
                              <p className="text-center py-4 text-muted-foreground">暂无设备</p>
                            ) : (
                              <div className="space-y-2">
                                {group.devices.slice(0, 10).map((device) => (
                                  <div key={device.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                      <div className="text-sm">
                                        <p className="font-medium">{device.device_no}</p>
                                        <p className="text-muted-foreground">{device.name}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <div className="text-right text-sm">
                                        <p className="flex items-center">
                                          <Clock className="w-3 h-3 mr-1" />
                                          {formatActiveTime(device.active_time_today)}
                                        </p>
                                        <p className="flex items-center text-green-600">
                                          <Coins className="w-3 h-3 mr-1" />
                                          {formatRevenue(device.today_revenue)}
                                        </p>
                                      </div>
                                      {getDeviceStatusBadge(device)}
                                    </div>
                                  </div>
                                ))}
                                {deviceCount > 10 && (
                                  <div className="text-center pt-2">
                                    <Button variant="ghost" size="sm">
                                      查看更多 ({deviceCount - 10} 台设备)
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  暂无分组数据
                </div>
              )}
            </div>

            <Separator />

            {/* 时间信息 */}
            {(displayPlace.created_at || displayPlace.updated_at) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                {displayPlace.created_at && (
                  <div>
                    <span className="font-medium">创建时间：</span>
                    <span className="ml-2">{new Date(displayPlace.created_at).toLocaleString()}</span>
                  </div>
                )}
                {displayPlace.updated_at && (
                  <div>
                    <span className="font-medium">更新时间：</span>
                    <span className="ml-2">{new Date(displayPlace.updated_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            没有可显示的场地信息
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
