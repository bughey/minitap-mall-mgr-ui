'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Edit, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToastContainer } from '@/components/ui/toast';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { bannerApi, type MallBannerDto, uploadApi } from '@/lib/api';

type BannerForm = {
  title: string;
  image_url: string;
  jump_url: string;
  sort_order: number;
  status: number;
  position: number;
  start_time: string;
  end_time: string;
};

const defaultForm: BannerForm = {
  title: '',
  image_url: '',
  jump_url: '',
  sort_order: 0,
  status: 1,
  position: 1,
  start_time: '',
  end_time: '',
};

const toLocalDatetimeInputValue = (value: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const toIsoStringOrUndefined = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

const statusLabel = (status: number) => (status === 1 ? '显示' : '隐藏');
const positionLabel = (position: number) => {
  switch (position) {
    case 1:
      return '首页轮播';
    case 2:
      return '分类页';
    case 3:
      return '活动页';
    default:
      return String(position);
  }
};

export default function BannersPage() {
  const toast = useToast();
  const [items, setItems] = useState<MallBannerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const safeTotalPages = Math.max(totalPages, 1);

  const [status, setStatus] = useState<string>('all');
  const [position, setPosition] = useState<string>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<MallBannerDto | null>(null);
  const [form, setForm] = useState<BannerForm>(defaultForm);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MallBannerDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const requestIdRef = useRef(0);

  const statusFilter = useMemo(() => {
    if (status === 'all') return undefined;
    const n = Number(status);
    return Number.isFinite(n) ? n : undefined;
  }, [status]);

  const positionFilter = useMemo(() => {
    if (position === 'all') return undefined;
    const n = Number(position);
    return Number.isFinite(n) ? n : undefined;
  }, [position]);

  const fetchList = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      setError(null);

      const resp = await bannerApi.page({
        page,
        page_size: pageSize,
        status: statusFilter,
        position: positionFilter,
      });

      if (requestId !== requestIdRef.current) return;

      if (!resp.success) {
        throw new Error(resp.err_message || '获取 Banner 列表失败');
      }

      setItems(resp.data);
      setTotal(resp.total);
      setTotalPages(resp.total_pages);
      setPage(resp.current_page);
      setPageSize(resp.page_size);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      toast.error('获取列表失败', message);
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
    }
  }, [page, pageSize, positionFilter, statusFilter, toast]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (banner: MallBannerDto) => {
    setEditing(banner);
    setForm({
      title: banner.title,
      image_url: banner.image_url,
      jump_url: banner.jump_url ?? '',
      sort_order: banner.sort_order,
      status: banner.status,
      position: banner.position,
      start_time: toLocalDatetimeInputValue(banner.start_time),
      end_time: toLocalDatetimeInputValue(banner.end_time),
    });
    setDialogOpen(true);
  };

  const handleUploadImage = async (file: File) => {
    try {
      setUploading(true);
      const url = await uploadApi.uploadImage(file);
      setForm((prev) => ({ ...prev, image_url: url }));
      toast.success('图片上传成功', url);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('图片上传失败', message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const validateForm = (): string | null => {
    if (!form.title.trim()) return 'title 不能为空';
    if (!form.image_url.trim()) return 'image_url 不能为空';
    if (form.sort_order < 0) return 'sort_order 不能为负数';
    if (![0, 1].includes(form.status)) return 'status 仅支持 0/1';
    if (![1, 2, 3].includes(form.position)) return 'position 仅支持 1-3';

    const startIso = toIsoStringOrUndefined(form.start_time);
    const endIso = toIsoStringOrUndefined(form.end_time);
    if (startIso && endIso && new Date(startIso) > new Date(endIso)) {
      return 'start_time 不能晚于 end_time';
    }
    return null;
  };

  const submit = async () => {
    const errorMsg = validateForm();
    if (errorMsg) {
      toast.error('参数错误', errorMsg);
      return;
    }

    const payload = {
      title: form.title.trim(),
      image_url: form.image_url.trim(),
      jump_url: form.jump_url.trim() ? form.jump_url.trim() : undefined,
      sort_order: form.sort_order,
      status: form.status,
      position: form.position,
      start_time: toIsoStringOrUndefined(form.start_time),
      end_time: toIsoStringOrUndefined(form.end_time),
    };

    try {
      setSaving(true);
      const resp = editing
        ? await bannerApi.update(editing.id, payload)
        : await bannerApi.create(payload);

      if (!resp.success || !resp.data) {
        throw new Error(resp.err_message || '保存失败');
      }

      toast.success(editing ? '更新成功' : '创建成功');
      setDialogOpen(false);
      await fetchList();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('保存失败', message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (banner: MallBannerDto, nextStatus: number) => {
    try {
      const resp = await bannerApi.setStatus(banner.id, nextStatus);
      if (!resp.success) {
        throw new Error(resp.err_message || '更新状态失败');
      }
      setItems((prev) =>
        prev.map((it) => (it.id === banner.id ? { ...it, status: nextStatus } : it))
      );
      toast.success('状态已更新');
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('更新状态失败', message);
    }
  };

  const confirmDelete = (banner: MallBannerDto) => {
    setDeleteTarget(banner);
    setDeleteOpen(true);
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const resp = await bannerApi.delete(deleteTarget.id);
      if (!resp.success) {
        throw new Error(resp.err_message || '删除失败');
      }
      toast.success('删除成功');
      setDeleteOpen(false);
      setDeleteTarget(null);
      await fetchList();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('删除失败', message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Banner 管理</h1>
          <p className="text-sm text-muted-foreground">
            轮播图列表、上下线、排序与编辑
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void fetchList()} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            新增 Banner
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-background p-4 md:flex-row md:items-end md:justify-between">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">状态</Label>
            <Select
              value={status}
              onValueChange={(v) => {
                setPage(1);
                setStatus(v);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="1">显示</SelectItem>
                <SelectItem value="0">隐藏</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">位置</Label>
            <Select
              value={position}
              onValueChange={(v) => {
                setPage(1);
                setPosition(v);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="1">首页轮播</SelectItem>
                <SelectItem value="2">分类页</SelectItem>
                <SelectItem value="3">活动页</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">每页</Label>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPage(1);
                setPageSize(Number(v));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          第 {page} / {safeTotalPages} 页 · 共 {total} 条
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>加载失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>标题</TableHead>
              <TableHead>位置</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>排序</TableHead>
              <TableHead>生效时间</TableHead>
              <TableHead>点击</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell colSpan={9}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              items.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell className="font-mono">{banner.id}</TableCell>
                  <TableCell className="max-w-[240px] truncate">{banner.title}</TableCell>
                  <TableCell>{positionLabel(banner.position)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={banner.status === 1}
                        onCheckedChange={(checked) =>
                          void toggleStatus(banner, checked ? 1 : 0)
                        }
                        aria-label="切换显示状态"
                      />
                      <Badge variant={banner.status === 1 ? 'default' : 'secondary'}>
                        {statusLabel(banner.status)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">{banner.sort_order}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>{banner.start_time ? new Date(banner.start_time).toLocaleString() : '—'}</div>
                    <div>{banner.end_time ? new Date(banner.end_time).toLocaleString() : '—'}</div>
                  </TableCell>
                  <TableCell className="tabular-nums">{banner.click_count}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(banner.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(banner)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/5"
                        onClick={() => confirmDelete(banner)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={loading || page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          上一页
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={loading || page >= safeTotalPages}
          onClick={() => setPage((p) => Math.min(safeTotalPages, p + 1))}
        >
          下一页
        </Button>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditing(null);
            setForm(defaultForm);
          }
        }}
      >
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑 Banner' : '新增 Banner'}</DialogTitle>
            <DialogDescription>
              图片可通过上传接口获取 URL（同域：`POST /api/v1/upload/image`）
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="banner-title">标题</Label>
              <Input
                id="banner-title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="请输入标题"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>图片 URL</Label>
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <Input
                  value={form.image_url}
                  onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://..."
                />
                <div className="flex items-center gap-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading || saving}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleUploadImage(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading || saving}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? '上传中…' : '上传'}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                选择文件后会自动上传并填入 URL
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="banner-jump">跳转链接（可选）</Label>
              <Input
                id="banner-jump"
                value={form.jump_url}
                onChange={(e) => setForm((prev) => ({ ...prev, jump_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>位置</Label>
              <Select
                value={String(form.position)}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, position: Number(v) }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">首页轮播</SelectItem>
                  <SelectItem value="2">分类页</SelectItem>
                  <SelectItem value="3">活动页</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>状态</Label>
              <Select
                value={String(form.status)}
                onValueChange={(v) => setForm((prev) => ({ ...prev, status: Number(v) }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">显示</SelectItem>
                  <SelectItem value="0">隐藏</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-sort">排序（越小越靠前）</Label>
              <Input
                id="banner-sort"
                type="number"
                value={String(form.sort_order)}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-start">开始时间（可选）</Label>
              <Input
                id="banner-start"
                type="datetime-local"
                value={form.start_time}
                onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-end">结束时间（可选）</Label>
              <Input
                id="banner-end"
                type="datetime-local"
                value={form.end_time}
                onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              取消
            </Button>
            <Button type="button" onClick={() => void submit()} disabled={saving}>
              {saving ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteTarget(null);
        }}
        title="确认删除"
        description={deleteTarget ? `将删除 Banner「${deleteTarget.title}」` : '将删除该 Banner'}
        confirmText="删除"
        loading={deleting}
        onConfirm={doDelete}
      />

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}
