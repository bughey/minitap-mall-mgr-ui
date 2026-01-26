'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, ClipboardList, Minus, Plus, RefreshCw, Search, Settings2, Upload, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { giftTemplateApi, placeApi, placeGiftApi, uploadApi } from '@/lib/api';
import { Place } from '@/types/venue';
import { GiftTemplate, GiftTemplateListResponse } from '@/types/gift-template';
import { getOpTypeText, PlaceGift, PlaceGiftLog, PlaceGiftLogOpType, PlaceGiftListResponse, PlaceGiftLogListResponse } from '@/types/place-gift';

type GiftFormMode = 'create' | 'edit';

type GiftFormPreset = {
  title: string;
  subtitle: string;
  image: string;
  description: string;
  cost: number;
  point: number;
  count: number;
  remark: string;
};

const blankGiftPreset: GiftFormPreset = {
  title: '',
  subtitle: '',
  image: '',
  description: '',
  cost: 0,
  point: 0,
  count: 0,
  remark: ''
};

export default function PlaceStockPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | 'none'>('none');

  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [gifts, setGifts] = useState<PlaceGift[]>([]);
  const [totalGifts, setTotalGifts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTitle, setSearchTitle] = useState('');

  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [giftDialogKey, setGiftDialogKey] = useState(0);
  const [giftFormMode, setGiftFormMode] = useState<GiftFormMode>('create');
  const [editingGift, setEditingGift] = useState<PlaceGift | null>(null);
  const [giftFormPreset, setGiftFormPreset] = useState<GiftFormPreset>(blankGiftPreset);
  const [giftImageUrl, setGiftImageUrl] = useState('');
  const [giftImageUploading, setGiftImageUploading] = useState(false);
  const giftImageInputRef = useRef<HTMLInputElement | null>(null);

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templates, setTemplates] = useState<GiftTemplate[]>([]);
  const [templateTotal, setTemplateTotal] = useState(0);
  const [templateTotalPages, setTemplateTotalPages] = useState(0);
  const [templatePage, setTemplatePage] = useState(1);
  const [templatePageSize] = useState(10);
  const [templateSearchTitle, setTemplateSearchTitle] = useState('');
  const [templateStatusFilter, setTemplateStatusFilter] = useState<'all' | '0' | '1'>('0');

  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustGift, setAdjustGift] = useState<PlaceGift | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(0);
  const [adjustRemark, setAdjustRemark] = useState('');

  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [logsGift, setLogsGift] = useState<PlaceGift | null>(null);
  const [logs, setLogs] = useState<PlaceGiftLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsTotalPages, setLogsTotalPages] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsPageSize] = useState(10);
  const [logsOpType, setLogsOpType] = useState<PlaceGiftLogOpType | 'all'>('all');

  const { toasts, removeToast, error: errorToast, success } = useToast();

  const selectedPlace = useMemo(
    () => places.find((p) => p.id === selectedPlaceId) || null,
    [places, selectedPlaceId]
  );

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        setLoadingPlaces(true);
        const resp = await placeApi.getList();
        if (resp.success && resp.data) {
          const data = resp.data as { places: Place[] };
          setPlaces(data.places || []);
          if (data.places?.length) {
            setSelectedPlaceId(data.places[0].id);
          }
        } else {
          throw new Error(resp.err_message || '获取场地列表失败');
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : '获取场地列表失败';
        errorToast('加载失败', msg);
      } finally {
        setLoadingPlaces(false);
      }
    };

    fetchPlaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedPlaceId === 'none') return;
    fetchGifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlaceId, currentPage, searchTitle]);

  const fetchGifts = async () => {
    if (selectedPlaceId === 'none') return;
    try {
      setLoadingGifts(true);
      const resp = await placeGiftApi.page({
        place_id: selectedPlaceId as number,
        page: currentPage,
        page_size: pageSize,
        title: searchTitle.trim() ? searchTitle.trim() : undefined
      });
      if (resp.success && resp.data) {
        const data = resp.data as PlaceGiftListResponse;
        setGifts(data.data || []);
        setTotalGifts(data.total || 0);
        setTotalPages(data.total_pages || 0);
      } else {
        throw new Error(resp.err_message || '获取库存列表失败');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '获取库存列表失败';
      errorToast('加载失败', msg);
    } finally {
      setLoadingGifts(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const resp = await giftTemplateApi.page({
        page: templatePage,
        page_size: templatePageSize,
        title: templateSearchTitle.trim() ? templateSearchTitle.trim() : undefined,
        status: templateStatusFilter === 'all' ? undefined : Number(templateStatusFilter)
      });
      if (resp.success && resp.data) {
        const data = resp.data as GiftTemplateListResponse;
        setTemplates(data.data || []);
        setTemplateTotal(data.total || 0);
        setTemplateTotalPages(data.total_pages || 0);
      } else {
        throw new Error(resp.err_message || '获取礼品库失败');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '获取礼品库失败';
      errorToast('加载失败', msg);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (!templateDialogOpen) return;
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateDialogOpen, templatePage, templateStatusFilter]);

  const handleSearch = () => {
    if (currentPage === 1) {
      fetchGifts();
      return;
    }
    setCurrentPage(1);
  };

  const handleTemplateSearch = () => {
    if (templatePage === 1) {
      fetchTemplates();
      return;
    }
    setTemplatePage(1);
  };

  const handleTemplatePageChange = (next: number) => {
    if (next < 1 || next > templateTotalPages) return;
    setTemplatePage(next);
  };

  const applyTemplateToCreate = (template: GiftTemplate) => {
    if (selectedPlaceId === 'none') return;
    const title = (template.title || '').trim();
    if (!title) {
      errorToast('操作失败', '模板标题为空');
      return;
    }

    const duplicated = gifts.some((g) => (g.title || '').trim() === title);
    if (duplicated) {
      errorToast('无法创建', '该场地已存在同名礼品');
      return;
    }

    setGiftFormMode('create');
    setEditingGift(null);
    setGiftFormPreset({
      title,
      subtitle: String(template.subtitle || ''),
      image: String(template.image || ''),
      description: String(template.description || ''),
      cost: template.default_cost ?? 0,
      point: template.default_point ?? 0,
      count: 0,
      remark: ''
    });
    setGiftImageUrl(template.image || '');
    setGiftDialogKey((v) => v + 1);
    setTemplateDialogOpen(false);
    setGiftDialogOpen(true);
  };

  const openTemplatePicker = () => {
    if (selectedPlaceId === 'none') return;
    setTemplateSearchTitle('');
    setTemplateStatusFilter('0');
    setTemplatePage(1);
    setTemplateDialogOpen(true);
  };

  const openCreateGift = () => {
    if (selectedPlaceId === 'none') return;
    setGiftFormMode('create');
    setEditingGift(null);
    setGiftFormPreset(blankGiftPreset);
    setGiftImageUrl('');
    setGiftDialogKey((v) => v + 1);
    setGiftDialogOpen(true);
  };

  const openEditGift = (gift: PlaceGift) => {
    setGiftFormMode('edit');
    setEditingGift(gift);
    setGiftFormPreset({
      title: gift.title || '',
      subtitle: String(gift.subtitle || ''),
      image: String(gift.image || ''),
      description: String(gift.description || ''),
      cost: gift.cost ?? 0,
      point: gift.point ?? 0,
      count: gift.count ?? 0,
      remark: ''
    });
    setGiftImageUrl(gift.image || '');
    setGiftDialogKey((v) => v + 1);
    setGiftDialogOpen(true);
  };

  const openAdjustGift = (gift: PlaceGift) => {
    setAdjustGift(gift);
    setAdjustDelta(0);
    setAdjustRemark('');
    setAdjustDialogOpen(true);
  };

  const openLogs = (gift: PlaceGift) => {
    setLogsGift(gift);
    setLogs([]);
    setLogsPage(1);
    setLogsOpType('all');
    setLogsDialogOpen(true);
  };

  useEffect(() => {
    if (!logsDialogOpen || !logsGift) return;
    const fetchLogs = async () => {
      try {
        setLoadingLogs(true);
        const resp = await placeGiftApi.logs({
          place_id: logsGift.place_id,
          place_gift_id: logsGift.id,
          op_type: logsOpType === 'all' ? undefined : logsOpType,
          page: logsPage,
          page_size: logsPageSize
        });
        if (resp.success && resp.data) {
          const data = resp.data as PlaceGiftLogListResponse;
          setLogs(data.data || []);
          setLogsTotal(data.total || 0);
          setLogsTotalPages(data.total_pages || 0);
        } else {
          throw new Error(resp.err_message || '获取日志失败');
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : '获取日志失败';
        errorToast('加载失败', msg);
      } finally {
        setLoadingLogs(false);
      }
    };

    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logsDialogOpen, logsGift, logsPage, logsOpType]);

  const handleGiftSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedPlaceId === 'none') return;

    const formData = new FormData(e.currentTarget);
    const title = String(formData.get('title') || '').trim();
    const subtitle = String(formData.get('subtitle') || '').trim();
    const image = giftImageUrl.trim();
    const description = String(formData.get('description') || '').trim();
    const cost = Number(formData.get('cost') || 0);
    const point = Number(formData.get('point') || 0);
    const count = Number(formData.get('count') || 0);
    const remark = String(formData.get('remark') || '').trim();

    if (!title) {
      errorToast('校验失败', '请输入礼品名称');
      return;
    }
    const duplicated =
      giftFormMode === 'create'
        ? gifts.some((g) => (g.title || '').trim() === title)
        : editingGift
          ? gifts.some((g) => g.id !== editingGift.id && (g.title || '').trim() === title)
          : false;
    if (duplicated) {
      errorToast('校验失败', '该场地已存在同名礼品');
      return;
    }
    if (Number.isNaN(cost) || cost < 0) {
      errorToast('校验失败', '成本价不能为负数');
      return;
    }
    if (Number.isNaN(point) || point < 0) {
      errorToast('校验失败', '兑换积分不能为负数');
      return;
    }
    if (giftFormMode === 'create' && (Number.isNaN(count) || count < 0)) {
      errorToast('校验失败', '初始库存不能为负数');
      return;
    }

    try {
      if (giftFormMode === 'create') {
        const resp = await placeGiftApi.create({
          place_id: selectedPlaceId as number,
          title,
          subtitle: subtitle || undefined,
          image: image || undefined,
          description: description || undefined,
          cost,
          point,
          count,
          remark: remark || undefined
        });
        if (!resp.success) throw new Error(resp.err_message || '新增失败');
        success('新增成功', '已创建礼品库存');
      } else {
        if (!editingGift) return;
        const resp = await placeGiftApi.update({
          id: editingGift.id,
          title,
          subtitle: subtitle || undefined,
          image: image || undefined,
          description: description || undefined,
          cost,
          point,
          remark: remark || undefined
        });
        if (!resp.success) throw new Error(resp.err_message || '更新失败');
        success('更新成功', '礼品信息已更新');
      }

      setGiftDialogOpen(false);
      fetchGifts();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '提交失败';
      errorToast('操作失败', msg);
    }
  };

  const handleSelectGiftImage = () => {
    giftImageInputRef.current?.click();
  };

  const handleGiftImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setGiftImageUploading(true);
      const url = await uploadApi.uploadImage(file);
      setGiftImageUrl(url);
      success('上传成功', '图片已上传并回填 URL');
    } catch (error) {
      const msg = error instanceof Error ? error.message : '图片上传失败';
      errorToast('上传失败', msg);
    } finally {
      setGiftImageUploading(false);
      e.target.value = '';
    }
  };

  const handleAdjustSubmit = async () => {
    if (!adjustGift) return;
    if (!adjustDelta || Number.isNaN(adjustDelta)) {
      errorToast('校验失败', '请输入非 0 的调整数量');
      return;
    }

    try {
      const resp = await placeGiftApi.adjust({
        id: adjustGift.id,
        delta: adjustDelta,
        remark: adjustRemark.trim() ? adjustRemark.trim() : undefined
      });
      if (!resp.success) throw new Error(resp.err_message || '调整失败');
      success('调整成功', `库存已${adjustDelta > 0 ? '增加' : '减少'} ${Math.abs(adjustDelta)}`);
      setAdjustDialogOpen(false);
      fetchGifts();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '调整失败';
      errorToast('操作失败', msg);
    }
  };

  const handlePageChange = (next: number) => {
    if (next < 1 || next > totalPages) return;
    setCurrentPage(next);
  };

  const handleLogsPageChange = (next: number) => {
    if (next < 1 || next > logsTotalPages) return;
    setLogsPage(next);
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">场地库存</h1>
          <p className="mt-1 text-sm text-muted-foreground">管理场地礼品仓库库存（place_gift），支持补货/扣减与审计查询</p>
        </div>
        <Button variant="outline" onClick={fetchGifts} disabled={loadingGifts || selectedPlaceId === 'none'}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loadingGifts ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            筛选与操作
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>场地</Label>
            {loadingPlaces ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedPlaceId === 'none' ? '' : String(selectedPlaceId)}
                onValueChange={(v) => {
                  const id = Number(v);
                  setSelectedPlaceId(Number.isNaN(id) ? 'none' : id);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择场地" />
                </SelectTrigger>
                <SelectContent>
                  {places.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedPlace ? <p className="text-xs text-muted-foreground truncate">{selectedPlace.address || '-'}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>礼品名称</Label>
            <div className="flex gap-2">
              <Input
                placeholder="搜索礼品名称"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
              <Button onClick={handleSearch} disabled={selectedPlaceId === 'none'}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">支持模糊搜索（title ILIKE）</p>
          </div>

          <div className="flex items-end justify-end gap-2">
            <Button variant="outline" onClick={openTemplatePicker} disabled={selectedPlaceId === 'none'}>
              <BookOpen className="mr-2 h-4 w-4" />
              从礼品库选择
            </Button>
            <Button onClick={openCreateGift} disabled={selectedPlaceId === 'none'}>
              <Plus className="mr-2 h-4 w-4" />
              新增礼品
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">库存列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingGifts ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>礼品</TableHead>
                    <TableHead className="w-[120px]">兑换积分</TableHead>
                    <TableHead className="w-[120px]">成本(分)</TableHead>
                    <TableHead className="w-[120px]">库存</TableHead>
                    <TableHead className="w-[260px] text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gifts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    gifts.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">{g.title}</div>
                          <div className="text-xs text-muted-foreground">{g.subtitle || g.description || ''}</div>
                        </TableCell>
                        <TableCell>{g.point}</TableCell>
                        <TableCell>{g.cost}</TableCell>
                        <TableCell>
                          <span className="font-semibold">{g.count}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditGift(g)}>
                              编辑
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openAdjustGift(g)}>
                              调整库存
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openLogs(g)}>
                              <ClipboardList className="mr-1 h-4 w-4" />
                              日志
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  共 {totalGifts} 条 · 第 {currentPage}/{totalPages || 1} 页
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>从礼品库选择</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2 space-y-2">
              <Label>模板名称</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="搜索模板名称"
                  value={templateSearchTitle}
                  onChange={(e) => setTemplateSearchTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTemplateSearch();
                  }}
                />
                <Button onClick={handleTemplateSearch}>
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={fetchTemplates} disabled={loadingTemplates}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loadingTemplates ? 'animate-spin' : ''}`} />
                  刷新
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                选择模板后将预填新增表单；同一场地不允许同名礼品（已存在会被拦截）
              </p>
            </div>

            <div className="space-y-2">
              <Label>状态</Label>
              <Select
                value={templateStatusFilter}
                onValueChange={(v) => {
                  setTemplatePage(1);
                  setTemplateStatusFilter(v as 'all' | '0' | '1');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">启用</SelectItem>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="1">停用</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">默认仅展示启用模板</p>
            </div>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>礼品</TableHead>
                  <TableHead className="w-[140px]">默认积分</TableHead>
                  <TableHead className="w-[140px]">默认成本(分)</TableHead>
                  <TableHead className="w-[120px]">状态</TableHead>
                  <TableHead className="w-[160px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingTemplates ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div>暂无模板</div>
                        <Button asChild variant="outline" size="sm">
                          <Link href="/gift-templates" onClick={() => setTemplateDialogOpen(false)}>
                            去礼品库创建模板
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((t) => {
                    const title = (t.title || '').trim();
                    const duplicated = gifts.some((g) => (g.title || '').trim() === title);
                    const disabled = t.status !== 0 || duplicated;
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="min-w-0">
                          <div className="flex items-center gap-3 min-w-0">
                            {t.image ? (
                              <div
                                className="h-10 w-10 shrink-0 rounded-md bg-white bg-cover bg-center border"
                                style={{ backgroundImage: `url(${t.image})` }}
                              />
                            ) : (
                              <div className="h-10 w-10 shrink-0 rounded-md border bg-muted/30" />
                            )}
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 truncate">{t.title}</div>
                              <div className="text-xs text-muted-foreground truncate">{t.subtitle || t.description || ''}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{t.default_point}</TableCell>
                        <TableCell>{t.default_cost}</TableCell>
                        <TableCell>
                          {t.status === 0 ? <Badge variant="default">启用</Badge> : <Badge variant="secondary">停用</Badge>}
                          {duplicated ? <Badge variant="outline" className="ml-2">已存在</Badge> : null}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => applyTemplateToCreate(t)} disabled={disabled}>
                            使用
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              共 {templateTotal} 条 · 第 {templatePage}/{templateTotalPages || 1} 页
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTemplatePageChange(templatePage - 1)}
                disabled={templatePage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTemplatePageChange(templatePage + 1)}
                disabled={templatePage >= templateTotalPages}
              >
                下一页
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={giftDialogOpen} onOpenChange={setGiftDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{giftFormMode === 'create' ? '新增礼品库存' : '编辑礼品信息'}</DialogTitle>
          </DialogHeader>
          <form key={giftDialogKey} onSubmit={handleGiftSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">礼品名称</Label>
                <Input id="title" name="title" defaultValue={giftFormPreset.title} placeholder="例如：可乐" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">副标题</Label>
                <Input id="subtitle" name="subtitle" defaultValue={giftFormPreset.subtitle} placeholder="可选" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="point">兑换积分</Label>
                <Input id="point" name="point" type="number" min={0} defaultValue={giftFormPreset.point} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">成本(分)</Label>
                <Input id="cost" name="cost" type="number" min={0} defaultValue={giftFormPreset.cost} required />
              </div>
              {giftFormMode === 'create' ? (
                <div className="space-y-2">
                  <Label htmlFor="count">初始库存</Label>
                  <Input id="count" name="count" type="number" min={0} defaultValue={giftFormPreset.count} required />
                </div>
              ) : null}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="image">图片</Label>
                <div className="flex gap-2">
                  <Input
                    id="image"
                    name="image"
                    value={giftImageUrl}
                    onChange={(event) => setGiftImageUrl(event.target.value)}
                    placeholder="可选：可粘贴图片 URL 或上传"
                  />
                  <input
                    ref={giftImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleGiftImageFileChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSelectGiftImage}
                    disabled={giftImageUploading}
                  >
                    {giftImageUploading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        上传中
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        上传
                      </>
                    )}
                  </Button>
                  {giftImageUrl ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setGiftImageUrl('')}
                      disabled={giftImageUploading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      清空
                    </Button>
                  ) : null}
                </div>
                {giftImageUrl ? (
                  <div className="flex items-center gap-3 rounded-md border bg-slate-50 p-2">
                    <div
                      className="h-12 w-12 rounded bg-white bg-cover bg-center"
                      style={{
                        backgroundImage:
                          /^https?:\/\//.test(giftImageUrl) || giftImageUrl.startsWith('data:image/')
                            ? `url(${giftImageUrl})`
                            : undefined
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs text-muted-foreground">{giftImageUrl}</div>
                      <a
                        href={giftImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 underline underline-offset-2"
                      >
                        打开原图
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">支持 JPG/PNG/WebP/GIF，最大 5MB</p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">描述</Label>
                <Input id="description" name="description" defaultValue={giftFormPreset.description} placeholder="可选" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="remark">备注（可选，写入日志）</Label>
                <Input
                  id="remark"
                  name="remark"
                  defaultValue={giftFormPreset.remark}
                  placeholder="例如：首次录入/修改兑换积分"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGiftDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">{giftFormMode === 'create' ? '创建' : '保存'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>调整库存</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border bg-slate-50 p-3 text-sm">
              <div className="font-medium text-slate-900">{adjustGift?.title || '-'}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                当前库存：<span className="font-semibold text-slate-900">{adjustGift?.count ?? 0}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>调整数量（可正可负）</Label>
              <div className="flex gap-2">
                <Button variant="outline" type="button" onClick={() => setAdjustDelta((v) => v - 1)}>
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(Number(e.target.value))}
                  placeholder="例如：10 或 -3"
                />
                <Button variant="outline" type="button" onClick={() => setAdjustDelta((v) => v + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">减少库存时不得减到负数</p>
            </div>

            <div className="space-y-2">
              <Label>备注（可选）</Label>
              <Input value={adjustRemark} onChange={(e) => setAdjustRemark(e.target.value)} placeholder="例如：补货/损耗/盘点纠错" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              取消
            </Button>
            <Button type="button" onClick={handleAdjustSubmit}>
              确认调整
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>库存日志</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {logsGift ? (
                <>
                  <span className="font-medium text-slate-900">{logsGift.title}</span>
                  <span className="mx-2">·</span>
                  <span>{places.find((p) => p.id === logsGift.place_id)?.name || `场地#${logsGift.place_id}`}</span>
                </>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Select value={logsOpType === 'all' ? 'all' : String(logsOpType)} onValueChange={(v) => {
                setLogsPage(1);
                setLogsOpType(v === 'all' ? 'all' : (Number(v) as PlaceGiftLogOpType));
              }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="操作类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="0">新增</SelectItem>
                  <SelectItem value="1">调整</SelectItem>
                  <SelectItem value="2">修改信息</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">类型</TableHead>
                  <TableHead className="w-[140px]">变更</TableHead>
                  <TableHead className="w-[160px]">前/后库存</TableHead>
                  <TableHead className="w-[120px]">操作人</TableHead>
                  <TableHead>备注</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingLogs ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      暂无日志
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{getOpTypeText(l.op_type)}</TableCell>
                      <TableCell>
                        <span className={l.delta > 0 ? 'text-green-600 font-medium' : l.delta < 0 ? 'text-red-600 font-medium' : 'text-slate-600'}>
                          {l.delta > 0 ? `+${l.delta}` : String(l.delta)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {l.before_count} → <span className="font-semibold">{l.after_count}</span>
                      </TableCell>
                      <TableCell>{l.operator_uid ?? '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{l.remark || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              共 {logsTotal} 条 · 第 {logsPage}/{logsTotalPages || 1} 页
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleLogsPageChange(logsPage - 1)} disabled={logsPage <= 1}>
                <ChevronLeft className="h-4 w-4" />
                上一页
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleLogsPageChange(logsPage + 1)} disabled={logsPage >= logsTotalPages}>
                下一页
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLogsDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
