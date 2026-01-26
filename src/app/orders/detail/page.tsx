'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, RefreshCw, Truck } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { orderApi, type MallOrderDetailDto } from '@/lib/api';

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

const orderTypeLabel = (value: number) => {
  switch (value) {
    case 1:
      return '普通订单';
    case 2:
      return '拼团订单';
    case 3:
      return '秒杀订单';
    default:
      return String(value);
  }
};

const payTypeLabel = (value: number | null) => {
  if (value === null) return '—';
  switch (value) {
    case 0:
      return '积分';
    case 1:
      return '微信';
    case 2:
      return '支付宝';
    case 3:
      return '余额';
    default:
      return String(value);
  }
};

const refundStatusLabel = (value: number) => {
  switch (value) {
    case 0:
      return '无退款';
    case 1:
      return '退款申请中';
    case 2:
      return '退款成功';
    default:
      return String(value);
  }
};

const safeJson = (value: unknown): string => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

function OrderDetailInner() {
  const toast = useToast();
  const params = useSearchParams();
  const orderNo = useMemo(() => params.get('order_no')?.trim() ?? '', [params]);

  const [detail, setDetail] = useState<MallOrderDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [shipOpen, setShipOpen] = useState(false);
  const [shipping, setShipping] = useState(false);
  const [shipForm, setShipForm] = useState({ express_company: '', express_no: '' });

  const fetchDetail = useCallback(async () => {
    if (!orderNo) {
      setDetail(null);
      setLoading(false);
      setError('缺少 order_no 查询参数');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const resp = await orderApi.detail(orderNo);
      if (!resp.success || !resp.data) {
        throw new Error(resp.err_message || '获取订单详情失败');
      }
      setDetail(resp.data);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      toast.error('获取订单详情失败', message);
    } finally {
      setLoading(false);
    }
  }, [orderNo, toast]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const canShip = detail?.status === 1;

  const openShip = () => {
    if (!detail) return;
    setShipForm({
      express_company: detail.express_company ?? '',
      express_no: detail.express_no ?? '',
    });
    setShipOpen(true);
  };

  const doShip = async () => {
    if (!orderNo) return;
    const express_company = shipForm.express_company.trim();
    const express_no = shipForm.express_no.trim();
    if (!express_company) {
      toast.error('发货失败', 'express_company 不能为空');
      return;
    }
    if (!express_no) {
      toast.error('发货失败', 'express_no 不能为空');
      return;
    }

    try {
      setShipping(true);
      const resp = await orderApi.ship(orderNo, { express_company, express_no });
      if (!resp.success || !resp.data) {
        throw new Error(resp.err_message || '发货失败');
      }
      setDetail(resp.data);
      toast.success('发货成功');
      setShipOpen(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('发货失败', message);
    } finally {
      setShipping(false);
    }
  };

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">订单详情</h1>
          <p className="text-sm text-muted-foreground">
            查询参数：`?order_no=`（当前：{orderNo || '—'}）
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回列表
            </Link>
          </Button>
          <Button variant="outline" onClick={() => void fetchDetail()} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button onClick={openShip} disabled={!canShip || loading || shipping}>
            <Truck className="h-4 w-4 mr-2" />
            发货
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>加载失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : detail ? (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-4 md:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">
                  <span className="text-muted-foreground">订单号：</span>
                  <span className="font-mono">{detail.order_no}</span>
                </div>
                <Badge variant={detail.status === 3 ? 'default' : 'secondary'}>
                  {orderStatusLabel(detail.status)}
                </Badge>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">用户 ID</div>
                  <div className="font-mono">{detail.user_id}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">订单类型</div>
                  <div>{orderTypeLabel(detail.order_type)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">支付方式</div>
                  <div>{payTypeLabel(detail.pay_type)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">支付时间</div>
                  <div>{detail.pay_time ? new Date(detail.pay_time).toLocaleString() : '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">实付金额</div>
                  <div className="tabular-nums">{detail.pay_amount}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">优惠/运费</div>
                  <div className="tabular-nums">
                    -{detail.discount_amount} / {detail.freight_amount}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-muted-foreground">交易号</div>
                  <div className="font-mono break-all">{detail.transaction_id ?? '—'}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-muted-foreground">备注</div>
                  <div>{detail.remark ?? '—'}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-muted-foreground">创建时间</div>
                  <div>{new Date(detail.created_at).toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="font-medium">收货信息（PII）</div>
              <div className="mt-3 space-y-2 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">收货人</div>
                  <div>{detail.receiver_name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">手机号</div>
                  <div className="font-mono">{detail.receiver_phone}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">地址</div>
                  <div className="whitespace-pre-wrap break-words">{detail.receiver_address}</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4 md:col-span-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="font-medium">物流信息</div>
                <div className="text-xs text-muted-foreground">
                  说明：接口为幂等发货；已发货订单不支持修改物流（不一致会返回错误）
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">物流公司</div>
                  <div>{detail.express_company ?? '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">物流单号</div>
                  <div className="font-mono">{detail.express_no ?? '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">发货时间</div>
                  <div>{detail.delivery_time ? new Date(detail.delivery_time).toLocaleString() : '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">收货时间</div>
                  <div>{detail.receive_time ? new Date(detail.receive_time).toLocaleString() : '—'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品</TableHead>
                  <TableHead>规格</TableHead>
                  <TableHead>数量</TableHead>
                  <TableHead>单价</TableHead>
                  <TableHead>实付</TableHead>
                  <TableHead>退款</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      暂无明细
                    </TableCell>
                  </TableRow>
                ) : (
                  detail.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="h-10 w-10 rounded-md object-cover border"
                          />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{item.product_name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {item.sku_name}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground max-w-[280px] truncate">
                        {safeJson(item.sku_specs)}
                      </TableCell>
                      <TableCell className="tabular-nums">{item.quantity}</TableCell>
                      <TableCell className="tabular-nums">{item.price}</TableCell>
                      <TableCell className="tabular-nums">{item.pay_amount}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div>{refundStatusLabel(item.refund_status)}</div>
                        <div className="tabular-nums">{item.refund_amount ?? '—'}</div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      ) : null}

      <Dialog
        open={shipOpen}
        onOpenChange={(open) => {
          setShipOpen(open);
          if (!open) {
            setShipForm({ express_company: '', express_no: '' });
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>订单发货</DialogTitle>
            <DialogDescription>
              调用 `PUT /api/v1/order/:order_no/ship`，仅支持 status=待发货 的订单。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="ship-company">物流公司</Label>
              <Input
                id="ship-company"
                value={shipForm.express_company}
                onChange={(e) => setShipForm((prev) => ({ ...prev, express_company: e.target.value }))}
                placeholder="如：顺丰 / 中通"
                disabled={shipping}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ship-no">物流单号</Label>
              <Input
                id="ship-no"
                value={shipForm.express_no}
                onChange={(e) => setShipForm((prev) => ({ ...prev, express_no: e.target.value }))}
                placeholder="请输入物流单号"
                disabled={shipping}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShipOpen(false)} disabled={shipping}>
              取消
            </Button>
            <Button onClick={() => void doShip()} disabled={shipping}>
              {shipping ? '提交中...' : '确认发货'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          加载中...
        </div>
      }
    >
      <OrderDetailInner />
    </Suspense>
  );
}
