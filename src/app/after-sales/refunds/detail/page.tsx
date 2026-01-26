'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
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
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { refundApi, type MallRefundDetailDto } from '@/lib/api';

const refundStatusLabel = (status: number) => {
  switch (status) {
    case 0:
      return '申请中';
    case 1:
      return '同意退款';
    case 2:
      return '拒绝退款';
    case 3:
      return '退款成功';
    case 4:
      return '已取消';
    default:
      return String(status);
  }
};

const refundTypeLabel = (value: number) => {
  switch (value) {
    case 1:
      return '仅退款';
    case 2:
      return '退货退款';
    default:
      return String(value);
  }
};

const safeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
};

function RefundDetailInner() {
  const toast = useToast();
  const params = useSearchParams();
  const refundNo = useMemo(() => params.get('refund_no')?.trim() ?? '', [params]);

  const [detail, setDetail] = useState<MallRefundDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [auditOpen, setAuditOpen] = useState(false);
  const [auditRemark, setAuditRemark] = useState('');
  const [auditing, setAuditing] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!refundNo) {
      setDetail(null);
      setLoading(false);
      setError('缺少 refund_no 查询参数');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const resp = await refundApi.detail(refundNo);
      if (!resp.success || !resp.data) {
        throw new Error(resp.err_message || '获取退款详情失败');
      }
      setDetail(resp.data);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      toast.error('获取退款详情失败', message);
    } finally {
      setLoading(false);
    }
  }, [refundNo, toast]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const canAudit = detail?.status === 0;

  const openAudit = () => {
    if (!canAudit) return;
    setAuditRemark('');
    setAuditOpen(true);
  };

  const doAudit = async (approved: boolean) => {
    if (!refundNo) return;
    const remark = auditRemark.trim();
    try {
      setAuditing(true);
      const resp = await refundApi.audit(refundNo, { approved, remark: remark || undefined });
      if (!resp.success || !resp.data) {
        throw new Error(resp.err_message || '审核失败');
      }
      setDetail(resp.data);
      toast.success('审核已提交');
      setAuditOpen(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('审核失败', message);
    } finally {
      setAuditing(false);
    }
  };

  const images = useMemo(() => safeStringArray(detail?.images), [detail?.images]);

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">退款详情</h1>
          <p className="text-sm text-muted-foreground">
            查询参数：`?refund_no=`（当前：{refundNo || '—'}）
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/after-sales/refunds">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回列表
            </Link>
          </Button>
          <Button variant="outline" onClick={() => void fetchDetail()} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button onClick={openAudit} disabled={!canAudit || loading || auditing}>
            <ShieldCheck className="h-4 w-4 mr-2" />
            审核
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
                  <span className="text-muted-foreground">退款单号：</span>
                  <span className="font-mono">{detail.refund_no}</span>
                </div>
                <Badge variant={detail.status === 0 ? 'secondary' : detail.status === 3 ? 'default' : 'secondary'}>
                  {refundStatusLabel(detail.status)}
                </Badge>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">订单号</div>
                  <div className="font-mono">
                    <Link href={`/orders/detail?order_no=${encodeURIComponent(detail.order_no)}`} className="hover:underline">
                      {detail.order_no}
                    </Link>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">用户 ID</div>
                  <div className="font-mono">{detail.user_id}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">退款类型</div>
                  <div>{refundTypeLabel(detail.refund_type)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">退款金额</div>
                  <div className="tabular-nums">{detail.refund_amount}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">退款数量</div>
                  <div className="tabular-nums">{detail.refund_quantity ?? '—'}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-muted-foreground">原因</div>
                  <div>{detail.reason}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-muted-foreground">说明</div>
                  <div className="whitespace-pre-wrap break-words">{detail.description ?? '—'}</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="font-medium">审核信息</div>
              <div className="mt-3 space-y-2 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">审核时间</div>
                  <div>{detail.audit_time ? new Date(detail.audit_time).toLocaleString() : '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">审核备注</div>
                  <div className="whitespace-pre-wrap break-words">{detail.audit_remark ?? '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">处理标识</div>
                  <div className="font-mono text-xs break-all">{detail.refund_transaction_id ?? '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">退款成功时间</div>
                  <div>{detail.refund_time ? new Date(detail.refund_time).toLocaleString() : '—'}</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4 md:col-span-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="font-medium">凭证图片</div>
                {images.length === 0 ? (
                  <div className="text-xs text-muted-foreground">无</div>
                ) : (
                  <div className="text-xs text-muted-foreground">共 {images.length} 张</div>
                )}
              </div>
              {images.length === 0 ? null : (
                <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-6">
                  {images.map((url, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`${url}-${idx}`}
                      src={url}
                      alt={`refund-${idx}`}
                      className="h-20 w-full rounded-md object-cover border"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border bg-card p-4 md:col-span-3">
              <div className="font-medium">退货物流（如有）</div>
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
                  <div className="text-xs text-muted-foreground">创建时间</div>
                  <div>{new Date(detail.created_at).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      <Dialog
        open={auditOpen}
        onOpenChange={(open) => {
          setAuditOpen(open);
          if (!open) setAuditRemark('');
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>退款审核</DialogTitle>
            <DialogDescription>
              调用 `PUT /api/v1/refund/:refund_no/audit`；仅 status=申请中 可审核。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="audit-remark">审核备注（可选，≤200 字）</Label>
            <Input
              id="audit-remark"
              value={auditRemark}
              onChange={(e) => setAuditRemark(e.target.value)}
              placeholder="可填写拒绝原因/说明"
              disabled={auditing}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAuditOpen(false)} disabled={auditing}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => void doAudit(false)}
              disabled={auditing}
            >
              {auditing ? '提交中...' : '拒绝退款'}
            </Button>
            <Button onClick={() => void doAudit(true)} disabled={auditing}>
              {auditing ? '提交中...' : '同意退款'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RefundDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          加载中...
        </div>
      }
    >
      <RefundDetailInner />
    </Suspense>
  );
}
