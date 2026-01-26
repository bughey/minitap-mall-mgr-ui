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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ToastContainer } from '@/components/ui/toast';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { activityApi, type MallActivityDto, uploadApi } from '@/lib/api';

type ActivityForm = {
  activity_id: string;
  title: string;
  description: string;
  banner: string;
  status: number;
  sort_order: number;
  start_time: string;
  end_time: string;
};

const defaultForm: ActivityForm = {
  activity_id: '',
  title: '',
  description: '',
  banner: '',
  status: 1,
  sort_order: 0,
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

const statusLabel = (status: number) => {
  switch (status) {
    case 1:
      return '进行中';
    case 2:
      return '即将开始';
    case 3:
      return '已结束';
    case 0:
      return '已下线';
    default:
      return String(status);
  }
};

const statusBadgeVariant = (
  status: number
): 'default' | 'secondary' | 'destructive' => {
  switch (status) {
    case 1:
      return 'default';
    case 2:
      return 'secondary';
    case 3:
      return 'destructive';
    case 0:
      return 'secondary';
    default:
      return 'secondary';
  }
};

export default function ActivitiesPage() {
  const toast = useToast();
  const [items, setItems] = useState<MallActivityDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const safeTotalPages = Math.max(totalPages, 1);

  const [status, setStatus] = useState<string>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<MallActivityDto | null>(null);
  const [form, setForm] = useState<ActivityForm>(defaultForm);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MallActivityDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const requestIdRef = useRef(0);

  const statusFilter = useMemo(() => {
    if (status === 'all') return undefined;
    const n = Number(status);
    return Number.isFinite(n) ? n : undefined;
  }, [status]);

  const fetchList = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      setError(null);

      const resp = await activityApi.page({
        page,
        page_size: pageSize,
        status: statusFilter,
      });

      if (requestId !== requestIdRef.current) return;

      if (!resp.success) {
        throw new Error(resp.err_message || '获取活动列表失败');
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
  }, [page, pageSize, statusFilter, toast]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (activity: MallActivityDto) => {
    setEditing(activity);
    setForm({
      activity_id: activity.activity_id,
      title: activity.title,
      description: activity.description ?? '',
      banner: activity.banner ?? '',
      status: activity.status,
      sort_order: activity.sort_order,
      start_time: toLocalDatetimeInputValue(activity.start_time),
      end_time: toLocalDatetimeInputValue(activity.end_time),
    });
    setDialogOpen(true);
  };

  const handleUploadImage = async (file: File) => {
    try {
      setUploading(true);
      const url = await uploadApi.uploadImage(file);
      setForm((prev) => ({ ...prev, banner: url }));
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
    if (!form.activity_id.trim()) return 'activity_id 不能为空';
    if (!form.title.trim()) return 'title 不能为空';
    if (![0, 1, 2, 3].includes(form.status)) return 'status 仅支持 0/1/2/3';
    if (form.sort_order < 0) return 'sort_order 不能为负数';

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
      activity_id: form.activity_id.trim(),
      title: form.title.trim(),
      description: form.description.trim() ? form.description.trim() : undefined,
      banner: form.banner.trim() ? form.banner.trim() : undefined,
      status: form.status,
      sort_order: form.sort_order,
      start_time: toIsoStringOrUndefined(form.start_time),
      end_time: toIsoStringOrUndefined(form.end_time),
    };

    try {
      setSaving(true);
      const resp = editing
        ? await activityApi.update(editing.activity_id, payload)
        : await activityApi.create(payload);

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

  const setRowStatus = async (activity: MallActivityDto, nextStatus: number) => {
    try {
      const resp = await activityApi.setStatus(activity.activity_id, nextStatus);
      if (!resp.success) {
        throw new Error(resp.err_message || '更新状态失败');
      }
      setItems((prev) =>
        prev.map((it) =>
          it.activity_id === activity.activity_id ? { ...it, status: nextStatus } : it
        )
      );
      toast.success('状态已更新');
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('更新状态失败', message);
    }
  };

  const confirmDelete = (activity: MallActivityDto) => {
    setDeleteTarget(activity);
    setDeleteOpen(true);
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const resp = await activityApi.delete(deleteTarget.activity_id);
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
          <h1 className="text-xl font-semibold tracking-tight">活动管理</h1>
          <p className="text-sm text-muted-foreground">
            活动列表、上下线、时间窗口与编辑
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void fetchList()} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            新增活动
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-background p-4 md:flex-row md:items-end md:justify-between">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                <SelectItem value="1">进行中</SelectItem>
                <SelectItem value="2">即将开始</SelectItem>
                <SelectItem value="3">已结束</SelectItem>
                <SelectItem value="0">已下线</SelectItem>
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
              <TableHead>活动 ID</TableHead>
              <TableHead>标题</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>排序</TableHead>
              <TableHead>时间</TableHead>
              <TableHead>参与</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              items.map((activity) => (
                <TableRow key={activity.activity_id}>
                  <TableCell className="font-mono">{activity.activity_id}</TableCell>
                  <TableCell className="max-w-[240px] truncate">{activity.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusBadgeVariant(activity.status)}>
                        {statusLabel(activity.status)}
                      </Badge>
                      <Select
                        value={String(activity.status)}
                        onValueChange={(v) => void setRowStatus(activity, Number(v))}
                      >
                        <SelectTrigger className="h-8 w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">进行中</SelectItem>
                          <SelectItem value="2">即将开始</SelectItem>
                          <SelectItem value="3">已结束</SelectItem>
                          <SelectItem value="0">已下线</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">{activity.sort_order}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>
                      {activity.start_time
                        ? new Date(activity.start_time).toLocaleString()
                        : '—'}
                    </div>
                    <div>
                      {activity.end_time ? new Date(activity.end_time).toLocaleString() : '—'}
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">{activity.participant_count}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(activity.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(activity)}>
                        <Edit className="h-4 w-4 mr-1" />
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/5"
                        onClick={() => confirmDelete(activity)}
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
            <DialogTitle>{editing ? '编辑活动' : '新增活动'}</DialogTitle>
            <DialogDescription>活动 banner 可上传后填写 URL</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="activity-id">活动 ID</Label>
              <Input
                id="activity-id"
                value={form.activity_id}
                disabled={!!editing}
                onChange={(e) => setForm((prev) => ({ ...prev, activity_id: e.target.value }))}
                placeholder="例如: new_year_2026"
              />
              {editing ? (
                <p className="text-xs text-muted-foreground">activity_id 创建后不可修改</p>
              ) : null}
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
                  <SelectItem value="1">进行中</SelectItem>
                  <SelectItem value="2">即将开始</SelectItem>
                  <SelectItem value="3">已结束</SelectItem>
                  <SelectItem value="0">已下线</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="activity-title">标题</Label>
              <Input
                id="activity-title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="请输入标题"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Banner URL（可选）</Label>
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <Input
                  value={form.banner}
                  onChange={(e) => setForm((prev) => ({ ...prev, banner: e.target.value }))}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity-sort">排序</Label>
              <Input
                id="activity-sort"
                type="number"
                value={String(form.sort_order)}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity-start">开始时间（可选）</Label>
              <Input
                id="activity-start"
                type="datetime-local"
                value={form.start_time}
                onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity-end">结束时间（可选）</Label>
              <Input
                id="activity-end"
                type="datetime-local"
                value={form.end_time}
                onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="activity-desc">描述（可选）</Label>
              <Input
                id="activity-desc"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="一句话描述"
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
        description={
          deleteTarget ? `将删除活动「${deleteTarget.title}」` : '将删除该活动'
        }
        confirmText="删除"
        loading={deleting}
        onConfirm={doDelete}
      />

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}
