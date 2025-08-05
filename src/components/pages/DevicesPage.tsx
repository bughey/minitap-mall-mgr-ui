'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Eye, Edit, RefreshCw, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { deviceApi } from '@/lib/api';
import {
  Device,
  DeviceListResponse,
  DeviceQueryParams,
  FilterOption,
  FilterOptionsResponse,
  DeviceBusinessStatus,
  getDeviceBusinessStatus,
  getStatusDisplayText,
  getStatusColorClass,
  formatActiveTime,
  formatRevenue,
  formatRelativeTime,
} from '@/types/device';
import DeviceDetailDialog from '@/components/device/DeviceDetailDialog';
import DeviceEditDialog from '@/components/device/DeviceEditDialog';

// 状态选项
const statusOptions: { value: DeviceBusinessStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'active', label: '活跃' },
  { value: 'idle', label: '待玩' },
  { value: 'maintenance', label: '维护中' },
];

function getStatusBadge(status: DeviceBusinessStatus) {
  const text = getStatusDisplayText(status);
  const colorClass = getStatusColorClass(status);
  
  return (
    <Badge variant="outline" className={colorClass}>
      {text}
    </Badge>
  );
}

export default function DevicesPage() {
  // 数据状态
  const [devices, setDevices] = useState<Device[]>([]);
  const [totalDevices, setTotalDevices] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 筛选选项
  const [placeOptions, setPlaceOptions] = useState<FilterOption[]>([]);
  const [groupOptions, setGroupOptions] = useState<FilterOption[]>([]);
  
  // 筛选状态
  const [selectedPlace, setSelectedPlace] = useState<number | 'all'>('all');
  const [selectedGroup, setSelectedGroup] = useState<number | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<DeviceBusinessStatus | 'all'>('all');
  const [selectedType, setSelectedType] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // 对话框状态
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  
  // Toast 提示
  const { toasts, removeToast, error: errorToast, success } = useToast();

  // 初始化数据
  useEffect(() => {
    fetchFilterOptions();
    fetchDevices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 当筛选条件或分页改变时重新获取数据
  useEffect(() => {
    fetchDevices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlace, selectedGroup, selectedStatus, selectedType, searchTerm, currentPage]);

  // 当场地选择改变时，重新获取分组选项
  useEffect(() => {
    if (selectedPlace !== 'all') {
      fetchGroupOptions(selectedPlace as number);
    } else {
      fetchGroupOptions();
    }
    // 重置分组选择
    setSelectedGroup('all');
  }, [selectedPlace]);

  // 获取筛选选项
  const fetchFilterOptions = async () => {
    try {
      const placeResponse = await deviceApi.getPlaceOptions();
      if (placeResponse.success && placeResponse.data) {
        const data = placeResponse.data as FilterOptionsResponse;
        setPlaceOptions(data.options);
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  // 获取分组选项
  const fetchGroupOptions = async (placeId?: number) => {
    try {
      const groupResponse = await deviceApi.getGroupOptions(placeId);
      if (groupResponse.success && groupResponse.data) {
        const data = groupResponse.data as FilterOptionsResponse;
        setGroupOptions(data.options);
      }
    } catch (err) {
      console.error('Error fetching group options:', err);
    }
  };

  // 获取设备列表
  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: DeviceQueryParams = {
        page: currentPage,
        page_size: pageSize,
      };

      // 添加筛选条件
      if (selectedPlace !== 'all') {
        params.place_id = selectedPlace as number;
      }
      if (selectedGroup !== 'all') {
        params.group_id = selectedGroup as number;
      }
      if (selectedStatus !== 'all') {
        params.status = selectedStatus as DeviceBusinessStatus;
      }
      if (selectedType !== 'all') {
        params.device_type = selectedType as number;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await deviceApi.getList(params);
      
      if (response.success && response.data) {
        const listData = response.data as DeviceListResponse;
        setDevices(listData.data || []);
        setTotalDevices(listData.total || 0);
        setTotalPages(listData.total_pages || 0);
      } else {
        throw new Error(response.err_message || '获取设备列表失败');
      }
    } catch (err) {
      console.error('Device list fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : '获取数据失败';
      setError(errorMessage);
      errorToast('获取设备数据失败', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索
  const handleSearch = () => {
    setCurrentPage(1); // 重置到第一页
    fetchDevices();
  };

  // 处理分页
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 重置筛选条件
  const handleResetFilters = () => {
    setSelectedPlace('all');
    setSelectedGroup('all');
    setSelectedStatus('all');
    setSelectedType('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // 查看设备详情
  const handleViewDevice = (device: Device) => {
    setSelectedDevice(device);
    setDetailDialogOpen(true);
  };

  // 编辑设备
  const handleEditDevice = (device: Device) => {
    setSelectedDevice(device);
    setEditDialogOpen(true);
  };

  // 编辑成功后刷新数据
  const handleEditSuccess = () => {
    success('操作成功', '设备信息已更新');
    fetchDevices();
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">设备列表</h1>
          <p className="text-gray-600 mt-1">管理所有游戏设备的状态和信息</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchDevices} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="link" onClick={fetchDevices} className="ml-2 p-0 h-auto">
              重试
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              筛选条件
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              重置筛选
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* 场地筛选 */}
            <div>
              <label className="block text-sm font-medium mb-2">场地</label>
              <Select 
                value={selectedPlace.toString()} 
                onValueChange={(value) => setSelectedPlace(value === 'all' ? 'all' : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部场地</SelectItem>
                  {placeOptions.map((place) => (
                    <SelectItem key={place.id} value={place.id.toString()}>
                      {place.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 分组筛选 */}
            <div>
              <label className="block text-sm font-medium mb-2">分组</label>
              <Select 
                value={selectedGroup.toString()} 
                onValueChange={(value) => setSelectedGroup(value === 'all' ? 'all' : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分组</SelectItem>
                  {groupOptions.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 状态筛选 */}
            <div>
              <label className="block text-sm font-medium mb-2">状态</label>
              <Select 
                value={selectedStatus} 
                onValueChange={(value) => setSelectedStatus(value as DeviceBusinessStatus | 'all')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 设备类型筛选 - 暂时使用占位符 */}
            <div>
              <label className="block text-sm font-medium mb-2">设备类型</label>
              <Select 
                value={selectedType.toString()} 
                onValueChange={(value) => setSelectedType(value === 'all' ? 'all' : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="1">娃娃机</SelectItem>
                  <SelectItem value="2">推币机</SelectItem>
                  <SelectItem value="3">弹珠机</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 搜索框 */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-2">搜索</label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="搜索设备编号"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={loading}>
                  搜索
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 设备表格 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>设备信息</CardTitle>
            <div className="text-sm text-muted-foreground">共 {totalDevices} 台设备</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>设备信息</TableHead>
                  <TableHead>场地/分组</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>活跃时长</TableHead>
                  <TableHead>今日收益</TableHead>
                  <TableHead>最后更新</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // 加载骨架屏
                  Array.from({ length: pageSize }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[100px]" />
                          <Skeleton className="h-3 w-[80px]" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[120px]" />
                          <Skeleton className="h-3 w-[90px]" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[60px] rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : !devices || devices.length === 0 ? (
                  // 空状态
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {error ? '获取数据失败' : '暂无设备数据'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  // 真实数据
                  devices?.map((device) => {
                    const businessStatus = getDeviceBusinessStatus(device);
                    return (
                      <TableRow key={device.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{device.device_no}</div>
                            <div className="text-sm text-muted-foreground">{device.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{device.place_name}</div>
                            <div className="text-sm text-muted-foreground">{device.group_name}</div>
                          </div>
                        </TableCell>
                        <TableCell>{device.device_type_name}</TableCell>
                        <TableCell>{getStatusBadge(businessStatus)}</TableCell>
                        <TableCell>{formatActiveTime(device.active_time_today)}</TableCell>
                        <TableCell className="font-medium">{formatRevenue(device.today_revenue)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatRelativeTime(device.last_update)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              title="查看详情"
                              onClick={() => handleViewDevice(device)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              title="编辑设备"
                              onClick={() => handleEditDevice(device)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {!loading && devices.length > 0 && (
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center justify-between sm:hidden">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  上一页
                </Button>
                <span className="text-sm text-muted-foreground mx-4">
                  {currentPage} / {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  下一页
                </Button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    显示第 <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> 到{' '}
                    <span className="font-medium">{Math.min(currentPage * pageSize, totalDevices)}</span> 条，共{' '}
                    <span className="font-medium">{totalDevices}</span> 条记录
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-3 py-1">
                    第 {currentPage} 页，共 {totalPages} 页
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 设备详情对话框 */}
      <DeviceDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        deviceId={selectedDevice?.id}
        device={selectedDevice || undefined}
      />

      {/* 设备编辑对话框 */}
      <DeviceEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        device={selectedDevice || undefined}
        onSuccess={handleEditSuccess}
      />

      {/* Toast 容器 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
