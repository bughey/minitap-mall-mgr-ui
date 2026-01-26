'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Eye, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { orderApi, type MallOrderListItemDto } from '@/lib/api';

const orderStatusLabel = (status: number) => {
  switch (status) {
    case 0:
      return '待付款';
    case 1:
      return '待发货';
    case 2:
      return '待收货';
    case 3:
      return '已完成';
    case 4:
      return '已取消';
    case 5:
      return '退款中';
    default:
      return String(status);
  }
};

const toIsoStringOrUndefined = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

export default function OrdersPage() {
  const toast = useToast();
  const [items, setItems] = useState<MallOrderListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const safeTotalPages = Math.max(totalPages, 1);

  const [status, setStatus] = useState<string>('all');
  const [orderNo, setOrderNo] = useState('');
  const [userId, setUserId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const statusFilter = useMemo(() => {
    if (status === 'all') return undefined;
    const n = Number(status);
    return Number.isFinite(n) ? n : undefined;
  }, [status]);

  const userIdFilter = useMemo(() => {
    const trimmed = userId.trim();
    if (!trimmed) return undefined;
    const n = Number(trimmed);
    if (!Number.isFinite(n) || n <= 0) return undefined;
    return n;
  }, [userId]);

  const requestIdRef = useRef(0);

  const fetchList = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      setError(null);

      const resp = await orderApi.page({
        page,
        page_size: pageSize,
        status: statusFilter,
        order_no: orderNo.trim() ? orderNo.trim() : undefined,
        user_id: userIdFilter,
        start_time: toIsoStringOrUndefined(startTime),
        end_time: toIsoStringOrUndefined(endTime),
      });

      if (requestId !== requestIdRef.current) return;
      if (!resp.success) {
        throw new Error(resp.err_message || '获取订单列表失败');
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
  }, [endTime, orderNo, page, pageSize, startTime, statusFilter, toast, userIdFilter]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">订单管理</h1>
          <p className="text-sm text-muted-foreground">
            分页筛选、查看详情与发货
          </p>
        </div>
        <Button variant="outline" onClick={() => void fetchList()} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>加载失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-lg border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">状态</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="0">待付款</SelectItem>
                <SelectItem value="1">待发货</SelectItem>
                <SelectItem value="2">待收货</SelectItem>
                <SelectItem value="3">已完成</SelectItem>
                <SelectItem value="4">已取消</SelectItem>
                <SelectItem value="5">退款中</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs text-muted-foreground">订单号</Label>
            <Input
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              placeholder="order_no"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">用户 ID</Label>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="user_id"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">时间范围</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <Input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
          <div>共 {total} 条</div>
          <div className="text-xs">
            说明：订单列表展示的手机号已脱敏；详情页包含收货信息（PII）
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>订单号</TableHead>
              <TableHead>用户</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>金额</TableHead>
              <TableHead>收货人</TableHead>
              <TableHead>物流</TableHead>
              <TableHead>下单时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, idx) => (
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
              items.map((order) => (
                <TableRow key={order.order_no}>
                  <TableCell className="font-mono">
                    <Link
                      href={`/orders/detail?order_no=${encodeURIComponent(order.order_no)}`}
                      className="hover:underline"
                    >
                      {order.order_no}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono">{order.user_id}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === 3 ? 'default' : 'secondary'}>
                      {orderStatusLabel(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums">
                    <div>实付 {order.pay_amount}</div>
                    <div>商品 {order.product_amount}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div>{order.receiver_name}</div>
                    <div className="font-mono">{order.receiver_phone}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>{order.express_company ?? '—'}</div>
                    <div className="font-mono">{order.express_no ?? '—'}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/orders/detail?order_no=${encodeURIComponent(order.order_no)}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        详情
                      </Link>
                    </Button>
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
    </div>
  );
}
