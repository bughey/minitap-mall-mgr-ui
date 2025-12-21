'use client';

import { useState, useEffect, useCallback } from 'react';
import { Building, Computer, DollarSign, Plus, Edit, Eye, RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { placeApi, groupApi } from '@/lib/api';
import { 
  Place, 
  PlaceSummary, 
  PlaceListResponse, 
  Group,
  getUIStatus, 
  getStatusText, 
  getStatusColor 
} from '@/types/venue';
import PlaceFormDialog from '@/components/venue/PlaceFormDialog';
import GroupFormDialog from '@/components/venue/GroupFormDialog';
import PlaceDetailDialog from '@/components/venue/PlaceDetailDialog';

export default function VenuesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [summary, setSummary] = useState<PlaceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Toast 提示
  const { toasts, removeToast, success, error: errorToast } = useToast();
  
  // 表单对话框状态
  const [showPlaceForm, setShowPlaceForm] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | undefined>(undefined);
  
  // 分组对话框状态
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | undefined>(undefined);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  
  // 场地详情对话框状态
  const [showPlaceDetail, setShowPlaceDetail] = useState(false);
  const [selectedPlaceForDetail, setSelectedPlaceForDetail] = useState<Place | null>(null);
  
  // 确认删除对话框状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'place' | 'group';
    id: number;
    name: string;
    placeId?: number;
  } | null>(null);

  const fetchPlaceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await placeApi.getList();
      
      if (response.success && response.data) {
        const data = response.data as PlaceListResponse;
        setPlaces(data.places);
        setSummary(data.summary);
      } else {
        throw new Error(response.err_message || '获取场地数据失败');
      }
    } catch (err) {
      console.error('Place data fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : '获取数据失败';
      setError(errorMessage);
      errorToast('获取数据失败', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [errorToast]);

  useEffect(() => {
    fetchPlaceData();
  }, [fetchPlaceData]);

  // 格式化数字
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('zh-CN').format(num);
  };

  // 格式化货币
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0
    }).format(num);
  };

  // 获取状态徽章
  const getStatusBadge = (place: Place) => {
    const uiStatus = getUIStatus(place.status);
    const statusText = getStatusText(uiStatus);
    const colorClass = getStatusColor(uiStatus);
    
    return (
      <Badge variant="outline" className={colorClass}>
        {statusText}
      </Badge>
    );
  };

  // 添加分组
  const handleAddGroup = (placeId: number) => {
    setSelectedPlaceId(placeId);
    setEditingGroup(undefined);
    setShowGroupForm(true);
  };

  // 编辑分组
  const handleEditGroup = async (placeId: number, groupName: string) => {
    try {
      // 获取该场地的所有分组，找到对应的分组
      const response = await groupApi.getList(placeId);
      if (response.success && response.data) {
        const data = response.data as { groups: Group[] };
        const group = data.groups?.find((g: Group) => g.name === groupName);
        if (group) {
          setSelectedPlaceId(placeId);
          setEditingGroup(group);
          setShowGroupForm(true);
        }
      }
    } catch (err) {
      console.error('Error fetching group details:', err);
    }
  };

  // 删除分组
  const handleDeleteGroup = async (placeId: number, groupName: string) => {
    try {
      // 获取该场地的所有分组，找到对应的分组
      const response = await groupApi.getList(placeId);
      if (response.success && response.data) {
        const data = response.data as { groups: Group[] };
        const group = data.groups?.find((g: Group) => g.name === groupName);
        if (group) {
          setDeleteTarget({
            type: 'group',
            id: group.id,
            name: groupName,
            placeId: placeId
          });
          setShowDeleteConfirm(true);
        }
      }
    } catch (err) {
      console.error('Error fetching group details:', err);
      setError(err instanceof Error ? err.message : '获取分组信息失败');
    }
  };

  // 删除场地
  const handleDeletePlace = (place: Place) => {
    setDeleteTarget({
      type: 'place',
      id: place.id,
      name: place.name
    });
    setShowDeleteConfirm(true);
  };

  // 执行删除操作
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    try {
      if (deleteTarget.type === 'group') {
        const response = await groupApi.delete(deleteTarget.id);
        if (!response.success) {
          throw new Error(response.err_message || '删除分组失败');
        }
        success('删除成功', `分组"${deleteTarget.name}"已被删除`);
      } else if (deleteTarget.type === 'place') {
        const response = await placeApi.delete(deleteTarget.id);
        if (!response.success) {
          throw new Error(response.err_message || '删除场地失败');
        }
        success('删除成功', `场地"${deleteTarget.name}"已被删除`);
      }

      // 成功后关闭对话框并刷新数据
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      fetchPlaceData();
    } catch (err) {
      console.error('Delete error:', err);
      const errorMessage = err instanceof Error ? err.message : '删除失败';
      setError(errorMessage);
      errorToast('删除失败', errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">场地管理</h1>
          <p className="text-gray-600 mt-1">管理所有运营场地和设备分组</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchPlaceData} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button onClick={() => setShowPlaceForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            添加场地
          </Button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="link" onClick={fetchPlaceData} className="ml-2 p-0 h-auto">
              重试
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 场地卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {loading ? (
          // 加载骨架屏
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div>
                      <Skeleton className="h-5 w-24 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="text-center">
                      <Skeleton className="h-4 w-16 mx-auto mb-2" />
                      <Skeleton className="h-8 w-12 mx-auto" />
                    </div>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
                <div className="flex justify-between mt-6 pt-4 border-t">
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : places.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            暂无场地数据
          </div>
        ) : (
          places.map((place) => (
            <Card key={place.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{place.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{place.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">{getStatusBadge(place)}</div>
                </div>

                {/* 关键指标 */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Computer className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">设备总数</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{formatNumber(place.total_devices)}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-muted-foreground">活跃设备</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 mt-1">{formatNumber(place.active_devices)}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">今日收益</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(place.today_revenue)}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {/* 设备分组 */}
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium">设备分组</h4>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleAddGroup(place.id)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    添加分组
                  </Button>
                </div>

                <div className="space-y-3">
                  {place.groups.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">暂无分组</div>
                  ) : (
                    place.groups.map((group, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <span className="text-sm font-medium">{group.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{group.devices} 台设备</span>
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            title="查看分组详情"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            title="编辑分组"
                            onClick={() => handleEditGroup(place.id, group.name)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="删除分组"
                            onClick={() => handleDeleteGroup(place.id, group.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-between flex-row-reverse mt-6 pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedPlaceForDetail(place);
                        setShowPlaceDetail(true);
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      查看详情
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditingPlace(place);
                        setShowPlaceForm(true);
                      }}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      编辑
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive hover:text-destructive border-destructive/20 hover:border-destructive"
                      onClick={() => handleDeletePlace(place)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      删除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 统计信息 */}
      <Card>
        <CardHeader>
          <CardTitle>场地统计</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="text-center">
                  <Skeleton className="h-8 w-16 mx-auto mb-2" />
                  <Skeleton className="h-4 w-20 mx-auto" />
                </div>
              ))}
            </div>
          ) : summary ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{formatNumber(summary.total_places)}</p>
                <p className="text-sm text-muted-foreground mt-1">总场地数</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{formatNumber(summary.total_devices)}</p>
                <p className="text-sm text-muted-foreground mt-1">总设备数</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{formatNumber(summary.active_devices)}</p>
                <p className="text-sm text-muted-foreground mt-1">活跃设备</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">{formatCurrency(summary.today_total_revenue)}</p>
                <p className="text-sm text-muted-foreground mt-1">今日总收益</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">统计数据加载失败</div>
          )}
        </CardContent>
      </Card>

      {/* 场地表单对话框 */}
      <PlaceFormDialog
        open={showPlaceForm}
        onOpenChange={(open) => {
          setShowPlaceForm(open);
          if (!open) {
            setEditingPlace(undefined);
          }
        }}
        place={editingPlace}
        onSuccess={() => {
          fetchPlaceData();
          success(
            editingPlace ? '更新成功' : '创建成功',
            editingPlace ? '场地信息已更新' : '新场地已创建'
          );
        }}
      />

      {/* 分组表单对话框 */}
      {selectedPlaceId && (
        <GroupFormDialog
          open={showGroupForm}
          onOpenChange={(open) => {
            setShowGroupForm(open);
            if (!open) {
              setEditingGroup(undefined);
              setSelectedPlaceId(null);
            }
          }}
          placeId={selectedPlaceId}
          group={editingGroup}
          onSuccess={() => {
            fetchPlaceData();
            success(
              editingGroup ? '更新成功' : '创建成功',
              editingGroup ? '分组信息已更新' : '新分组已创建'
            );
          }}
        />
      )}

      {/* 场地详情对话框 */}
      <PlaceDetailDialog
        open={showPlaceDetail}
        onOpenChange={(open) => {
          setShowPlaceDetail(open);
          if (!open) {
            setSelectedPlaceForDetail(null);
          }
        }}
        placeId={selectedPlaceForDetail?.id}
        place={selectedPlaceForDetail}
      />

      {/* 确认删除对话框 */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={(open) => {
          setShowDeleteConfirm(open);
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title={deleteTarget ? `删除${deleteTarget.type === 'place' ? '场地' : '分组'}` : '确认删除'}
        description={
          deleteTarget 
            ? `确定要删除${deleteTarget.type === 'place' ? '场地' : '分组'}"${deleteTarget.name}"吗？${
                deleteTarget.type === 'place' 
                  ? '删除场地将同时删除该场地下的所有分组和设备，此操作不可撤销。' 
                  : '删除分组将影响该分组下的所有设备，此操作不可撤销。'
              }`
            : ''
        }
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
      />

      {/* Toast 提示容器 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
