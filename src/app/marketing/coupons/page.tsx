'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Edit, Eye, Plus, RefreshCw, Trash2 } from 'lucide-react';
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
import { couponApi, type MallCouponDto } from '@/lib/api';

type CouponForm = {
  name: string;
  description: string;
  coupon_type: number;
  face_value: number;
  threshold_amount: number;
  scope_type: number;
  scope_values: string;
  total_count: number;
  per_limit: number;
  validity_type: number;
  start_time: string;
  end_time: string;
  validity_days: number;
  status: number;
};

const defaultForm: CouponForm = {
  name: '',
  description: '',
  coupon_type: 1,
  face_value: 100,
  threshold_amount: 0,
  scope_type: 1,
  scope_values: '',
  total_count: 100,
  per_limit: 1,
  validity_type: 1,
  start_time: '',
  end_time: '',
  validity_days: 7,
  status: 1,
};

const safeNumberArray = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => {
      if (typeof v === 'number') return v;
      if (typeof v === 'string') return Number(v);
      return Number.NaN;
    })
    .filter((v) => Number.isFinite(v)) as number[];
};

const parseIdList = (text: string): number[] => {
  const parts = text
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  if (parts.length === 0) return [];
  return parts.map((v) => Number(v));
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

const couponTypeLabel = (value: number) => {
  switch (value) {
    case 1:
      return '满减券';
    case 2:
      return '折扣券';
    case 3:
      return '代金券';
    default:
      return String(value);
  }
};

const scopeTypeLabel = (value: number) => {
  switch (value) {
    case 1:
      return '全场通用';
    case 2:
      return '指定分类';
    case 3:
      return '指定商品';
    default:
      return String(value);
  }
};

const validityTypeLabel = (value: number) => {
  switch (value) {
    case 1:
      return '固定日期';
    case 2:
      return '领取后 N 天';
    default:
      return String(value);
  }
};

const couponStatusLabel = (value: number) => (value === 1 ? '启用' : '禁用');

export default function CouponsPage() {
  const toast = useToast();
  const [items, setItems] = useState<MallCouponDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const safeTotalPages = Math.max(totalPages, 1);

  const [status, setStatus] = useState<string>('all');
  const statusFilter = useMemo(() => {
    if (status === 'all') return undefined;
    const n = Number(status);
    return Number.isFinite(n) ? n : undefined;
  }, [status]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MallCouponDto | null>(null);
  const [form, setForm] = useState<CouponForm>(defaultForm);
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MallCouponDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTarget, setDetailTarget] = useState<MallCouponDto | null>(null);

  const requestIdRef = useRef(0);

  const fetchList = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      setError(null);

      const resp = await couponApi.page({ page, page_size: pageSize, status: statusFilter });
      if (requestId !== requestIdRef.current) return;
      if (!resp.success) {
        throw new Error(resp.err_message || '获取优惠券列表失败');
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

  const openEdit = (coupon: MallCouponDto) => {
    const ids = safeNumberArray(coupon.scope_values);
    setEditing(coupon);
    setForm({
      name: coupon.name,
      description: coupon.description ?? '',
      coupon_type: coupon.coupon_type,
      face_value: coupon.face_value,
      threshold_amount: coupon.threshold_amount,
      scope_type: coupon.scope_type,
      scope_values: ids.join(','),
      total_count: coupon.total_count,
      per_limit: coupon.per_limit,
      validity_type: coupon.validity_type,
      start_time: toLocalDatetimeInputValue(coupon.start_time),
      end_time: toLocalDatetimeInputValue(coupon.end_time),
      validity_days: coupon.validity_days ?? 0,
      status: coupon.status,
    });
    setDialogOpen(true);
  };

  const validateForm = (): string | null => {
    if (!form.name.trim()) return 'name 不能为空';
    if (![1, 2, 3].includes(form.coupon_type)) return 'coupon_type 仅支持 1/2/3';
    if (form.threshold_amount < 0) return 'threshold_amount 不能为负数';
    if (form.coupon_type === 2) {
      if (!(form.face_value >= 1 && form.face_value <= 10000)) return '折扣券 face_value 必须在 1-10000';
    } else if (form.face_value <= 0) {
      return 'face_value 必须大于 0';
    }

    if (![1, 2, 3].includes(form.scope_type)) return 'scope_type 仅支持 1/2/3';
    if (form.scope_type !== 1) {
      const ids = parseIdList(form.scope_values);
      if (ids.length === 0) return 'scope_values 在指定范围时必填';
      if (ids.some((v) => !Number.isFinite(v) || v <= 0)) return 'scope_values 仅支持正整数 ID（逗号分隔）';
    }

    if (form.total_count <= 0) return 'total_count 必须大于0';
    if (form.per_limit <= 0) return 'per_limit 必须大于0';
    if (form.per_limit > form.total_count) return 'per_limit 不能大于 total_count';

    if (![1, 2].includes(form.validity_type)) return 'validity_type 仅支持 1/2';
    if (form.validity_type === 1) {
      const startIso = toIsoStringOrUndefined(form.start_time);
      const endIso = toIsoStringOrUndefined(form.end_time);
      if (!startIso || !endIso) return '固定日期有效期需要同时设置 start_time/end_time';
      if (new Date(startIso).getTime() > new Date(endIso).getTime()) return 'start_time 不能晚于 end_time';
    } else if (form.validity_days <= 0) {
      return 'validity_days 在领取后 N 天模式下必填且大于 0';
    }

    if (form.status !== 0 && form.status !== 1) return 'status 仅支持 0/1';
    return null;
  };

  const buildBasePayload = () => {
    const ids = parseIdList(form.scope_values).filter((v) => Number.isFinite(v) && v > 0);
    const startIso = toIsoStringOrUndefined(form.start_time);
    const endIso = toIsoStringOrUndefined(form.end_time);
    return {
      name: form.name.trim(),
      description: form.description.trim() ? form.description.trim() : undefined,
      coupon_type: form.coupon_type,
      face_value: form.face_value,
      threshold_amount: form.threshold_amount,
      scope_type: form.scope_type,
      scope_values: form.scope_type === 1 ? undefined : ids,
      total_count: form.total_count,
      per_limit: form.per_limit,
      validity_type: form.validity_type,
      start_time: form.validity_type === 1 ? startIso : undefined,
      end_time: form.validity_type === 1 ? endIso : undefined,
      validity_days: form.validity_type === 2 ? form.validity_days : undefined,
    };
  };

  const doSave = async () => {
    const err = validateForm();
    if (err) {
      toast.error('表单校验失败', err);
      return;
    }

    try {
      setSaving(true);
      const basePayload = buildBasePayload();
      if (editing) {
        const resp = await couponApi.update(editing.id, basePayload);
        if (!resp.success || !resp.data) {
          throw new Error(resp.err_message || '保存失败');
        }
        toast.success('更新成功');
      } else {
        const resp = await couponApi.create({ ...basePayload, status: form.status });
        if (!resp.success || !resp.data) {
          throw new Error(resp.err_message || '保存失败');
        }
        toast.success('创建成功');
      }

      setDialogOpen(false);
      await fetchList();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('保存失败', message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (coupon: MallCouponDto, nextStatus: number) => {
    try {
      const resp = await couponApi.setStatus(coupon.id, nextStatus);
      if (!resp.success) {
        throw new Error(resp.err_message || '更新状态失败');
      }
      setItems((prev) =>
        prev.map((it) => (it.id === coupon.id ? { ...it, status: nextStatus } : it))
      );
      toast.success('状态已更新');
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('更新状态失败', message);
    }
  };

  const openDetail = async (coupon: MallCouponDto) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const resp = await couponApi.detail(coupon.id);
      if (!resp.success || !resp.data) {
        throw new Error(resp.err_message || '获取详情失败');
      }
      setDetailTarget(resp.data);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('获取详情失败', message);
      setDetailTarget(coupon);
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmDelete = (coupon: MallCouponDto) => {
    setDeleteTarget(coupon);
    setDeleteOpen(true);
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const resp = await couponApi.delete(deleteTarget.id);
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
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">优惠券管理</h1>
          <p className="text-sm text-muted-foreground">
            优惠券分页、详情、启用/禁用与编辑
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void fetchList()} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            新增优惠券
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>加载失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">状态</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="1">启用</SelectItem>
                  <SelectItem value="0">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            共 {total} 条
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>面值</TableHead>
              <TableHead>门槛</TableHead>
              <TableHead>范围</TableHead>
              <TableHead>发放/使用</TableHead>
              <TableHead>有效期</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell colSpan={11}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="py-8 text-center text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              items.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono">{coupon.id}</TableCell>
                  <TableCell className="font-medium">{coupon.name}</TableCell>
                  <TableCell>{couponTypeLabel(coupon.coupon_type)}</TableCell>
                  <TableCell className="tabular-nums">{coupon.face_value}</TableCell>
                  <TableCell className="tabular-nums">{coupon.threshold_amount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div>{scopeTypeLabel(coupon.scope_type)}</div>
                    {coupon.scope_type === 1 ? null : (
                      <div className="font-mono text-xs truncate max-w-[200px]">
                        {safeNumberArray(coupon.scope_values).join(',') || '—'}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums">
                    <div>总 {coupon.total_count}</div>
                    <div>
                      领 {coupon.issued_count} / 用 {coupon.used_count}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>{validityTypeLabel(coupon.validity_type)}</div>
                    {coupon.validity_type === 1 ? (
                      <div>
                        {coupon.start_time ? new Date(coupon.start_time).toLocaleString() : '—'} ~{' '}
                        {coupon.end_time ? new Date(coupon.end_time).toLocaleString() : '—'}
                      </div>
                    ) : (
                      <div>{coupon.validity_days ?? '—'} 天</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={coupon.status === 1}
                        onCheckedChange={(checked) =>
                          void toggleStatus(coupon, checked ? 1 : 0)
                        }
                        aria-label="切换启用状态"
                      />
                      <Badge variant={coupon.status === 1 ? 'default' : 'secondary'}>
                        {couponStatusLabel(coupon.status)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(coupon.updated_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void openDetail(coupon)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        详情
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(coupon)}>
                        <Edit className="h-4 w-4 mr-1" />
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/5"
                        onClick={() => confirmDelete(coupon)}
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
        <DialogContent className="sm:max-w-[780px]">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑优惠券' : '新增优惠券'}</DialogTitle>
            <DialogDescription>
              scope_values 支持逗号分隔 ID（scope_type=指定分类/指定商品 时必填）。
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="coupon-name">名称</Label>
              <Input
                id="coupon-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="请输入优惠券名称"
                disabled={saving}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="coupon-desc">描述</Label>
              <Input
                id="coupon-desc"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="可选"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label>优惠券类型</Label>
              <Select
                value={String(form.coupon_type)}
                onValueChange={(v) => setForm((prev) => ({ ...prev, coupon_type: Number(v) }))}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">满减券</SelectItem>
                  <SelectItem value="2">折扣券</SelectItem>
                  <SelectItem value="3">代金券</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                折扣券 face_value=折扣比例*100（例：95 折=9500）
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon-face">面值（face_value）</Label>
              <Input
                id="coupon-face"
                type="number"
                value={form.face_value}
                onChange={(e) => setForm((prev) => ({ ...prev, face_value: Number(e.target.value) }))}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon-threshold">门槛（threshold_amount）</Label>
              <Input
                id="coupon-threshold"
                type="number"
                value={form.threshold_amount}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, threshold_amount: Number(e.target.value) }))
                }
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label>适用范围（scope_type）</Label>
              <Select
                value={String(form.scope_type)}
                onValueChange={(v) => setForm((prev) => ({ ...prev, scope_type: Number(v) }))}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择范围" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">全场通用</SelectItem>
                  <SelectItem value="2">指定分类</SelectItem>
                  <SelectItem value="3">指定商品</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.scope_type === 1 ? null : (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="coupon-scope-values">scope_values（逗号分隔 ID）</Label>
                <Input
                  id="coupon-scope-values"
                  value={form.scope_values}
                  onChange={(e) => setForm((prev) => ({ ...prev, scope_values: e.target.value }))}
                  placeholder="如：1,2,3"
                  disabled={saving}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="coupon-total">发放总量（total_count）</Label>
              <Input
                id="coupon-total"
                type="number"
                value={form.total_count}
                onChange={(e) => setForm((prev) => ({ ...prev, total_count: Number(e.target.value) }))}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon-limit">每人限领（per_limit）</Label>
              <Input
                id="coupon-limit"
                type="number"
                value={form.per_limit}
                onChange={(e) => setForm((prev) => ({ ...prev, per_limit: Number(e.target.value) }))}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label>有效期类型（validity_type）</Label>
              <Select
                value={String(form.validity_type)}
                onValueChange={(v) => setForm((prev) => ({ ...prev, validity_type: Number(v) }))}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择有效期" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">固定日期</SelectItem>
                  <SelectItem value="2">领取后 N 天</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.validity_type === 1 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="coupon-start">start_time</Label>
                  <Input
                    id="coupon-start"
                    type="datetime-local"
                    value={form.start_time}
                    onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coupon-end">end_time</Label>
                  <Input
                    id="coupon-end"
                    type="datetime-local"
                    value={form.end_time}
                    onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))}
                    disabled={saving}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="coupon-days">validity_days</Label>
                <Input
                  id="coupon-days"
                  type="number"
                  value={form.validity_days}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, validity_days: Number(e.target.value) }))
                  }
                  disabled={saving}
                />
              </div>
            )}

            {!editing ? (
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-medium">创建后立即启用</div>
                    <div className="text-xs text-muted-foreground">status=1 为启用</div>
                  </div>
                  <Switch
                    checked={form.status === 1}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, status: checked ? 1 : 0 }))
                    }
                    aria-label="切换启用状态"
                    disabled={saving}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              取消
            </Button>
            <Button onClick={() => void doSave()} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            setDetailTarget(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>优惠券详情</DialogTitle>
            <DialogDescription>来自 `GET /api/v1/coupon/:id`</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : detailTarget ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">ID</div>
                <div className="font-mono">{detailTarget.id}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">状态</div>
                <div>{couponStatusLabel(detailTarget.status)}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs text-muted-foreground">名称</div>
                <div className="font-medium">{detailTarget.name}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs text-muted-foreground">描述</div>
                <div>{detailTarget.description ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">类型</div>
                <div>{couponTypeLabel(detailTarget.coupon_type)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">范围</div>
                <div>{scopeTypeLabel(detailTarget.scope_type)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">面值</div>
                <div className="tabular-nums">{detailTarget.face_value}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">门槛</div>
                <div className="tabular-nums">{detailTarget.threshold_amount}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs text-muted-foreground">scope_values</div>
                <div className="font-mono text-xs break-all">
                  {safeNumberArray(detailTarget.scope_values).join(',') || '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">发放总量</div>
                <div className="tabular-nums">{detailTarget.total_count}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">限领</div>
                <div className="tabular-nums">{detailTarget.per_limit}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">已领/已用</div>
                <div className="tabular-nums">
                  {detailTarget.issued_count} / {detailTarget.used_count}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">有效期</div>
                <div>{validityTypeLabel(detailTarget.validity_type)}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs text-muted-foreground">起止时间</div>
                <div>
                  {detailTarget.start_time ? new Date(detailTarget.start_time).toLocaleString() : '—'} ~{' '}
                  {detailTarget.end_time ? new Date(detailTarget.end_time).toLocaleString() : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">领取后天数</div>
                <div>{detailTarget.validity_days ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">创建时间</div>
                <div>{new Date(detailTarget.created_at).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">更新时间</div>
                <div>{new Date(detailTarget.updated_at).toLocaleString()}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">暂无详情</div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              关闭
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
        description={deleteTarget ? `将删除优惠券「${deleteTarget.name}」` : '确认删除该优惠券？'}
        confirmText="删除"
        loading={deleting}
        variant="destructive"
        onConfirm={doDelete}
      />
    </div>
  );
}
