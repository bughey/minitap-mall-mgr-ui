'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Building, Computer, DollarSign, Activity, Plus, Edit, Eye, RefreshCw, AlertTriangle, Trash2, UserCog } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { groupApi, placeApi } from '@/lib/api';
import { 
  Place, 
  PlacePageItem,
  PlacePageResponse,
  PlaceSummary, 
  getUIStatus, 
  getStatusText, 
  getStatusColor 
} from '@/types/venue';
import type { Group } from '@/types/venue';
import PlaceFormDialog from '@/components/venue/PlaceFormDialog';
import GroupFormDialog from '@/components/venue/GroupFormDialog';
import PlaceDetailDialog from '@/components/venue/PlaceDetailDialog';
import PlaceAgentDialog from '@/components/venue/PlaceAgentDialog';

export default function VenuesPage() {
  const [places, setPlaces] = useState<PlacePageItem[]>([]);
  const [summary, setSummary] = useState<PlaceSummary | null>(null);

  // 列表 / 统计分别加载和错误状态（允许部分失败仍渲染可用部分）
  const [loadingList, setLoadingList] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorList, setErrorList] = useState<string | null>(null);
  const [errorStats, setErrorStats] = useState<string | null>(null);

  // 分页元数据
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // API 可能在空数据/边界情况下返回 0；UI 统一至少展示 1 页。
  const safeTotalPages = Math.max(totalPages, 1);

  // 搜索输入（不直接触发请求，避免 keystroke storm）
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Search debounce (type -> apply after idle). We keep a ref so pagination changes
  // do not accidentally schedule a debounce apply.
  const searchEditedRef = useRef(false);
  const searchDebounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 列表请求竞态保护：只接受最新请求返回
  const listRequestIdRef = useRef(0);
  
  // Toast 提示
  const { toasts, removeToast, success, error: errorToast } = useToast();
  
  // 表单对话框状态
  const [showPlaceForm, setShowPlaceForm] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | undefined>(undefined);
  
  // 分组对话框状态
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);

  // 分组列表（按需查看）对话框状态：仅在打开时请求，避免列表渲染阶段 N+1。
  const [showGroupsView, setShowGroupsView] = useState(false);
  const [selectedPlaceForGroupsView, setSelectedPlaceForGroupsView] = useState<{ id: number; name: string } | null>(null);
  const [groupsViewLoading, setGroupsViewLoading] = useState(false);
  const [groupsViewError, setGroupsViewError] = useState<string | null>(null);
  const [groupsViewItems, setGroupsViewItems] = useState<Group[] | null>(null);
  const groupsViewRequestIdRef = useRef(0);

  const selectedPlaceIdForGroupsView = selectedPlaceForGroupsView?.id ?? null;
  
  // 场地详情对话框状态
  const [showPlaceDetail, setShowPlaceDetail] = useState(false);
  const [selectedPlaceIdForDetail, setSelectedPlaceIdForDetail] = useState<number | null>(null);

  // 场地负责代理对话框状态
  const [showPlaceAgent, setShowPlaceAgent] = useState(false);
  const [selectedPlaceForAgent, setSelectedPlaceForAgent] = useState<{ id: number; name: string } | null>(null);
  
  // 确认删除对话框状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const fetchPlaceList = useCallback(async () => {
    const requestId = ++listRequestIdRef.current;
    try {
      setLoadingList(true);
      setErrorList(null);

      const response = await placeApi.page({
        page: currentPage,
        page_size: pageSize,
        search,
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.err_message || '获取场地列表失败');
      }

      if (requestId !== listRequestIdRef.current) return;

      const data = response.data as PlacePageResponse;
      setPlaces(data.data);
      setTotal(data.total);
      setTotalPages(data.total_pages);
      setCurrentPage(data.current_page);
      setPageSize(data.page_size);
    } catch (err) {
      if (requestId !== listRequestIdRef.current) return;

      console.error('Place list fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : '获取列表失败';
      setErrorList(errorMessage);
      errorToast('获取列表失败', errorMessage);
    } finally {
      if (requestId !== listRequestIdRef.current) return;
      setLoadingList(false);
    }
  }, [currentPage, pageSize, search, errorToast]);

  const fetchPlaceStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      setErrorStats(null);

      const response = await placeApi.getStats();

      if (!response.success || !response.data) {
        throw new Error(response.err_message || '获取统计数据失败');
      }

      setSummary(response.data as PlaceSummary);
    } catch (err) {
      console.error('Place stats fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : '获取统计失败';
      setErrorStats(errorMessage);
      errorToast('获取统计失败', errorMessage);
    } finally {
      setLoadingStats(false);
    }
  }, [errorToast]);

  useEffect(() => {
    fetchPlaceList();
  }, [fetchPlaceList]);

  useEffect(() => {
    fetchPlaceStats();
  }, [fetchPlaceStats]);

  // Debounced search apply: only when user edited input, and only when the
  // trimmed input differs from applied `search` OR when we need to reset to page 1.
  useEffect(() => {
    if (!searchEditedRef.current) return;

    const trimmed = searchInput.trim();
    const shouldApply = trimmed !== search || currentPage !== 1;

    // Nothing meaningful to apply; also clear the "edited" flag so pagination
    // changes won't accidentally schedule a debounce.
    if (!shouldApply) {
      searchEditedRef.current = false;
      return;
    }

    if (searchDebounceTimeoutRef.current) {
      clearTimeout(searchDebounceTimeoutRef.current);
      searchDebounceTimeoutRef.current = null;
    }

    searchDebounceTimeoutRef.current = setTimeout(() => {
      searchDebounceTimeoutRef.current = null;
      searchEditedRef.current = false;

      // Avoid redundant state updates; reduces chance of double fetches.
      if (currentPage !== 1) setCurrentPage(1);
      if (trimmed !== search) setSearch(trimmed);
    }, 400);

    return () => {
      if (searchDebounceTimeoutRef.current) {
        clearTimeout(searchDebounceTimeoutRef.current);
        searchDebounceTimeoutRef.current = null;
      }
    };
  }, [currentPage, search, searchInput]);

  const refreshAll = useCallback(() => {
    // stats/list 是独立请求；任一失败不影响另一部分渲染
    fetchPlaceList();
    fetchPlaceStats();
  }, [fetchPlaceList, fetchPlaceStats]);

  const refreshAllWithOptions = useCallback(
    (options?: { skipList?: boolean; skipStats?: boolean }) => {
      // stats/list 是独立请求；任一失败不影响另一部分渲染
      if (!options?.skipList) fetchPlaceList();
      if (!options?.skipStats) fetchPlaceStats();
    },
    [fetchPlaceList, fetchPlaceStats]
  );

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

  // 获取状态徽章
  const getStatusBadge = (place: PlacePageItem) => {
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
    setShowGroupForm(true);
  };

  const openGroupsView = (place: { id: number; name: string }) => {
    setSelectedPlaceForGroupsView(place);
    // Avoid flashing stale data when switching places quickly.
    setGroupsViewItems(null);
    setGroupsViewError(null);
    setShowGroupsView(true);
  };

  const fetchGroupsForPlace = useCallback(async (placeId: number) => {
    const requestId = ++groupsViewRequestIdRef.current;
    try {
      setGroupsViewLoading(true);
      setGroupsViewError(null);

      const response = await groupApi.getList(placeId);
      if (!response.success || !response.data) {
        throw new Error(response.err_message || '获取分组失败');
      }

      if (requestId !== groupsViewRequestIdRef.current) return;

      const data = response.data as { groups: Group[] };
      setGroupsViewItems(Array.isArray(data.groups) ? data.groups : []);
    } catch (err) {
      if (requestId !== groupsViewRequestIdRef.current) return;

      console.error('Group list fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : '获取分组失败';
      setGroupsViewError(errorMessage);
      setGroupsViewItems(null);
    } finally {
      if (requestId !== groupsViewRequestIdRef.current) return;
      setGroupsViewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showGroupsView || !selectedPlaceIdForGroupsView) return;
    fetchGroupsForPlace(selectedPlaceIdForGroupsView);
  }, [fetchGroupsForPlace, selectedPlaceIdForGroupsView, showGroupsView]);

  // 编辑场地：分页列表项不包含 remark/groups，需要按需拉取详情
  const handleEditPlace = async (placeId: number) => {
    try {
      const response = await placeApi.getDetail(placeId);
      if (!response.success || !response.data) {
        throw new Error(response.err_message || '获取场地详情失败');
      }
      setEditingPlace(response.data as Place);
      setShowPlaceForm(true);
    } catch (err) {
      console.error('Place detail fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : '获取详情失败';
      errorToast('获取详情失败', errorMessage);
    }
  };

  // 删除场地
  const handleDeletePlace = (place: { id: number; name: string }) => {
    setDeleteTarget({
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
      const shouldGoPrevPageAfterDelete = currentPage > 1 && places.length === 1;

      const response = await placeApi.delete(deleteTarget.id);
      if (!response.success) {
        throw new Error(response.err_message || '删除场地失败');
      }
      success('删除成功', `场地"${deleteTarget.name}"已被删除`);

      // 成功后关闭对话框并刷新数据
      setShowDeleteConfirm(false);
      setDeleteTarget(null);

      // 删除导致当前页变空：回退到上一页，避免用户看到空列表。
      // 注意：这里不主动 fetchPlaceList，交给 currentPage 变化触发 useEffect 拉取，避免双请求。
      if (shouldGoPrevPageAfterDelete) {
        setCurrentPage((p) => Math.max(1, p - 1));
        refreshAllWithOptions({ skipList: true });
      } else {
        refreshAll();
      }
    } catch (err) {
      console.error('Delete error:', err);
      const errorMessage = err instanceof Error ? err.message : '删除失败';
      errorToast('删除失败', errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleApplySearch = () => {
    if (searchDebounceTimeoutRef.current) {
      clearTimeout(searchDebounceTimeoutRef.current);
      searchDebounceTimeoutRef.current = null;
    }
    searchEditedRef.current = false;

    const nextSearch = searchInput.trim();
    const nextPage = 1;

    // 如果查询条件没变，手动触发一次拉取；否则交给 useEffect 响应 state 变化
    if (nextSearch === search && nextPage === currentPage) {
      fetchPlaceList();
      return;
    }

    setSearch(nextSearch);
    setCurrentPage(nextPage);
  };

  const kpiCards = summary
    ? [
        {
          title: '总场地数',
          value: formatNumber(summary.total_places),
          subtitle: '已录入场地',
          icon: Building,
          color: 'blue'
        },
        {
          title: '总设备数',
          value: formatNumber(summary.total_devices),
          subtitle: '台设备',
          icon: Computer,
          color: 'green'
        },
        {
          title: '活跃设备',
          value: formatNumber(summary.active_devices),
          subtitle: '今日活跃',
          icon: Activity,
          color: 'blue'
        },
        {
          title: '今日总收益',
          value: formatCurrency(summary.today_total_revenue),
          subtitle: '今日累计',
          icon: DollarSign,
          color: 'yellow'
        }
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">场地管理</h1>
          <p className="text-gray-600 mt-1">管理所有运营场地和设备分组</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={refreshAll} disabled={loadingList || loadingStats}>
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
      {errorList && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {errorList}
            <Button variant="link" onClick={fetchPlaceList} className="ml-2 p-0 h-auto">
              重试
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {errorStats && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {errorStats}
            <Button variant="link" onClick={fetchPlaceStats} className="ml-2 p-0 h-auto">
              重试
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 关键指标卡片（统计数据独立于列表加载，失败不阻塞列表渲染） */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loadingStats ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="relative overflow-hidden shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-11 w-11 rounded-xl" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
              <Skeleton className="absolute bottom-0 left-0 right-0 h-1" />
            </Card>
          ))
        ) : summary ? (
          kpiCards.map((stat) => (
            <Card key={stat.title} className="relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                <div
                  className={`
                  p-3 rounded-xl shadow-md
                  ${stat.color === 'blue' ? 'bg-blue-500 text-white' : ''}
                  ${stat.color === 'green' ? 'bg-green-500 text-white' : ''}
                  ${stat.color === 'yellow' ? 'bg-yellow-500 text-white' : ''}
                `}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <p
                  className={`text-xs font-medium
                  ${stat.color === 'blue' ? 'text-blue-600' : ''}
                  ${stat.color === 'green' ? 'text-green-600' : ''}
                  ${stat.color === 'yellow' ? 'text-yellow-600' : ''}
                `}
                >
                  {stat.subtitle}
                </p>
              </CardContent>
              <div
                className={`absolute bottom-0 left-0 right-0 h-1
                ${stat.color === 'blue' ? 'bg-blue-500' : ''}
                ${stat.color === 'green' ? 'bg-green-500' : ''}
                ${stat.color === 'yellow' ? 'bg-yellow-500' : ''}
              `}
              ></div>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm">
              <AlertTriangle className="h-4 w-4 text-gray-500" />
              <span>统计数据加载失败</span>
            </div>
          </div>
        )}
      </div>

      {/* 搜索 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Input
            value={searchInput}
            onChange={(e) => {
              searchEditedRef.current = true;
              setSearchInput(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplySearch();
              }
            }}
            placeholder="搜索场地名称"
            className="w-full sm:w-72"
          />
          <Button variant="outline" onClick={handleApplySearch} disabled={loadingList}>
            搜索
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (!searchInput && !search) return;

              if (searchDebounceTimeoutRef.current) {
                clearTimeout(searchDebounceTimeoutRef.current);
                searchDebounceTimeoutRef.current = null;
              }
              searchEditedRef.current = false;

              setSearchInput('');
              setSearch('');
              setCurrentPage(1);
            }}
            disabled={loadingList}
          >
            清除
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          第 {currentPage} / {safeTotalPages} 页 · 每页 {pageSize} · 共 {formatNumber(total)} 个场地
        </div>
      </div>

      {/* Desktop: table view (md+) */}
      <div className="hidden md:block">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>场地列表</CardTitle>
              <div className="text-sm text-muted-foreground">共 {formatNumber(total)} 个场地</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[340px]">场地名称/地址</TableHead>
                    <TableHead className="text-right">设备总数</TableHead>
                    <TableHead className="text-right">活跃设备</TableHead>
                    <TableHead className="text-right">今日收益</TableHead>
                    <TableHead className="text-right">分组数量</TableHead>
                    <TableHead>负责代理</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingList ? (
                    // 加载骨架屏
                    Array.from({ length: pageSize }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell className="whitespace-normal">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[160px]" />
                            <Skeleton className="h-3 w-[260px]" />
                          </div>
                        </TableCell>
                        <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-[56px]" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-[56px]" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-[80px]" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="ml-auto h-8 w-[72px] rounded" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-[92px] rounded" /></TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Skeleton className="h-8 w-8 rounded" />
                            <Skeleton className="h-8 w-8 rounded" />
                            <Skeleton className="h-8 w-8 rounded" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : places.length === 0 ? (
                    // 空状态
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-muted-foreground">暂无场地数据</div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    places.map((place) => (
                      <TableRow key={place.id}>
                        <TableCell className="whitespace-normal">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium text-foreground truncate">{place.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{place.address}</div>
                              {place.remark ? (
                                <div className="text-xs text-muted-foreground/80 truncate">
                                  备注：{place.remark}
                                </div>
                              ) : null}
                            </div>
                            <div className="shrink-0">{getStatusBadge(place)}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(place.total_devices)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          <span className={place.active_devices > 0 ? 'font-medium text-green-600' : 'text-muted-foreground'}>
                            {formatNumber(place.active_devices)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{formatCurrency(place.today_revenue)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => openGroupsView({ id: place.id, name: place.name })}
                          >
                            {formatNumber(place.group_count)} 个
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => {
                              setSelectedPlaceForAgent({ id: place.id, name: place.name });
                              setShowPlaceAgent(true);
                            }}
                          >
                            <UserCog className="w-4 h-4 mr-2" />
                            负责代理
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="查看详情"
                              onClick={() => {
                                setSelectedPlaceIdForDetail(place.id);
                                setShowPlaceDetail(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="编辑"
                              onClick={() => handleEditPlace(place.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              title="删除"
                              onClick={() => handleDeletePlace({ id: place.id, name: place.name })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile: keep card view (<md) */}
      <div className="md:hidden">
        <div className="grid grid-cols-1 gap-4">
          {loadingList ? (
            // 加载骨架屏
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded" />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-9 flex-1" />
                    ))}
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
              <Card key={place.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-base truncate">{place.name}</div>
                      <div className="text-xs text-muted-foreground truncate mt-1">{place.address}</div>
                      {place.remark ? (
                        <div className="text-xs text-muted-foreground truncate mt-1">
                          备注：{place.remark}
                        </div>
                      ) : null}
                    </div>
                    <div className="shrink-0">
                      {getStatusBadge(place)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <div className="text-xs text-muted-foreground mb-1">设备总数</div>
                      <div className="font-semibold text-lg">{formatNumber(place.total_devices)}</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <div className="text-xs text-muted-foreground mb-1">活跃设备</div>
                      <div className="font-semibold text-lg text-green-600">{formatNumber(place.active_devices)}</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <div className="text-xs text-muted-foreground mb-1">今日收益</div>
                      <div className="font-semibold text-lg text-blue-600">{formatCurrency(place.today_revenue)}</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <div className="text-xs text-muted-foreground mb-1">分组数量</div>
                      <Button
                        variant="link"
                        className="h-auto p-0 justify-start font-semibold text-lg text-foreground"
                        onClick={() => openGroupsView({ id: place.id, name: place.name })}
                      >
                        {formatNumber(place.group_count)}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 min-w-[3.5rem] px-0"
                      onClick={() => {
                        setSelectedPlaceIdForDetail(place.id);
                        setShowPlaceDetail(true);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      详情
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 min-w-[3.5rem] px-0"
                      onClick={() => {
                        setSelectedPlaceForAgent({ id: place.id, name: place.name });
                        setShowPlaceAgent(true);
                      }}
                    >
                      <UserCog className="w-3.5 h-3.5 mr-1" />
                      代理
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 min-w-[3.5rem] px-0"
                      onClick={() => handleEditPlace(place.id)}
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      编辑
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 min-w-[3.5rem] px-0"
                      onClick={() => handleAddGroup(place.id)}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      分组
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 min-w-[3.5rem] px-0 text-destructive hover:text-destructive hover:bg-destructive/5"
                      onClick={() => handleDeletePlace({ id: place.id, name: place.name })}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      删除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* 分页 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          第 {currentPage} / {safeTotalPages} 页 · 共 {formatNumber(total)} 个场地
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={loadingList || currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={loadingList || currentPage >= safeTotalPages}
            onClick={() => setCurrentPage((p) => Math.min(safeTotalPages, p + 1))}
          >
            下一页
          </Button>
        </div>
      </div>

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
          refreshAll();
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
              setSelectedPlaceId(null);
            }
          }}
          placeId={selectedPlaceId}
          onSuccess={() => {
            fetchPlaceList();
            success(
              '创建成功',
              '新分组已创建'
            );
          }}
          />
        )}

      {/* 分组列表查看对话框（按需加载） */}
      <Dialog
        open={showGroupsView}
        onOpenChange={(open) => {
          setShowGroupsView(open);
          if (!open) {
            // Invalidate any in-flight request so it can't update state after close.
            groupsViewRequestIdRef.current += 1;
            setSelectedPlaceForGroupsView(null);
            setGroupsViewItems(null);
            setGroupsViewError(null);
            setGroupsViewLoading(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>分组列表</DialogTitle>
            <DialogDescription>
              {selectedPlaceForGroupsView ? `场地：${selectedPlaceForGroupsView.name}` : '查看该场地的分组列表'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {groupsViewLoading || (!groupsViewError && groupsViewItems === null) ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`group-skeleton-${index}`}
                  className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2"
                >
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))
            ) : groupsViewError ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {groupsViewError}
                  <Button
                    variant="link"
                    className="ml-2 p-0 h-auto"
                    onClick={() => {
                      if (!selectedPlaceForGroupsView) return;
                      fetchGroupsForPlace(selectedPlaceForGroupsView.id);
                    }}
                  >
                    重试
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (groupsViewItems ?? []).length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">暂无分组</div>
            ) : (
              <div className="max-h-[50vh] overflow-auto pr-1">
                <div className="space-y-2">
                  {(groupsViewItems ?? []).map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">{group.name}</div>
                        <div className="text-xs text-muted-foreground">设备数：{formatNumber(group.device_count)}</div>
                      </div>
                      <div className="shrink-0 tabular-nums text-sm text-muted-foreground">#{group.id}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGroupsView(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 场地详情对话框 */}
      <PlaceDetailDialog
        open={showPlaceDetail}
        onOpenChange={(open) => {
          setShowPlaceDetail(open);
          if (!open) {
            setSelectedPlaceIdForDetail(null);
          }
        }}
        placeId={selectedPlaceIdForDetail ?? undefined}
      />

      {/* 场地负责代理对话框 */}
      <PlaceAgentDialog
        open={showPlaceAgent}
        onOpenChange={(open) => {
          setShowPlaceAgent(open);
          if (!open) {
            setSelectedPlaceForAgent(null);
          }
        }}
        place={selectedPlaceForAgent ?? undefined}
        onChanged={refreshAll}
        successToast={success}
        errorToast={errorToast}
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
        title={deleteTarget ? '删除场地' : '确认删除'}
        description={
          deleteTarget 
            ? `确定要删除场地"${deleteTarget.name}"吗？删除场地将同时删除该场地下的所有分组和设备，此操作不可撤销。`
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
