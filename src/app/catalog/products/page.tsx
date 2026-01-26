'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Edit, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Switch } from '@/components/ui/switch';
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
import {
  categoryApi,
  productApi,
  type ProductCategoryNode,
  type ProductListItem,
} from '@/lib/api';

const flattenCategories = (nodes: ProductCategoryNode[], out: ProductCategoryNode[] = []) => {
  for (const node of nodes) {
    out.push(node);
    if (node.children?.length) flattenCategories(node.children, out);
  }
  return out;
};

const productStatusLabel = (status: number) => (status === 1 ? '上架' : '下架');

export default function ProductsPage() {
  const toast = useToast();

  const [categories, setCategories] = useState<ProductCategoryNode[]>([]);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [items, setItems] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const safeTotalPages = Math.max(totalPages, 1);

  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const keywordEditedRef = useRef(false);
  const keywordDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [categoryId, setCategoryId] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [sort, setSort] = useState<string>('0');

  const requestIdRef = useRef(0);

  const categoryIdFilter = useMemo(() => {
    if (categoryId === 'all') return undefined;
    const n = Number(categoryId);
    return Number.isFinite(n) ? n : undefined;
  }, [categoryId]);

  const statusFilter = useMemo(() => {
    if (status === 'all') return undefined;
    const n = Number(status);
    return Number.isFinite(n) ? n : undefined;
  }, [status]);

  const sortFilter = useMemo(() => {
    const n = Number(sort);
    return Number.isFinite(n) ? n : 0;
  }, [sort]);

  const categoryMap = useMemo(() => {
    const flat = flattenCategories(categories, []);
    const map = new Map<number, string>();
    for (const c of flat) map.set(c.id, c.name);
    return map;
  }, [categories]);

  const fetchCategories = useCallback(async () => {
    try {
      const resp = await categoryApi.tree();
      if (!resp.success || !resp.data) {
        throw new Error(resp.err_message || '获取分类失败');
      }
      setCategories(resp.data);
      setCategoryError(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setCategoryError(message);
    }
  }, []);

  const fetchList = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      setError(null);

      const resp = await productApi.page({
        page,
        page_size: pageSize,
        category_id: categoryIdFilter,
        keyword: keyword.trim() ? keyword.trim() : undefined,
        status: statusFilter,
        sort: sortFilter,
      });

      if (requestId !== requestIdRef.current) return;

      if (!resp.success) {
        throw new Error(resp.err_message || '获取商品列表失败');
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
  }, [categoryIdFilter, keyword, page, pageSize, sortFilter, statusFilter, toast]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (!keywordEditedRef.current) return;

    const trimmed = keywordInput.trim();
    const shouldApply = trimmed !== keyword || page !== 1;
    if (!shouldApply) {
      keywordEditedRef.current = false;
      return;
    }

    if (keywordDebounceRef.current) {
      clearTimeout(keywordDebounceRef.current);
      keywordDebounceRef.current = null;
    }

    keywordDebounceRef.current = setTimeout(() => {
      keywordDebounceRef.current = null;
      keywordEditedRef.current = false;
      if (page !== 1) setPage(1);
      if (trimmed !== keyword) setKeyword(trimmed);
    }, 400);

    return () => {
      if (keywordDebounceRef.current) {
        clearTimeout(keywordDebounceRef.current);
        keywordDebounceRef.current = null;
      }
    };
  }, [keyword, keywordInput, page]);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = (product: ProductListItem) => {
    setDeleteTarget(product);
    setDeleteOpen(true);
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const resp = await productApi.delete(deleteTarget.id);
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

  const toggleStatus = async (product: ProductListItem, next: number) => {
    try {
      const resp = await productApi.setStatus(product.id, next);
      if (!resp.success) {
        throw new Error(resp.err_message || '更新失败');
      }
      setItems((prev) =>
        prev.map((it) => (it.id === product.id ? { ...it, status: next } : it))
      );
      toast.success('状态已更新');
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('更新状态失败', message);
    }
  };

  const categoryOptions = useMemo(() => {
    const flat = flattenCategories(categories, []);
    return flat.map((c) => ({ id: c.id, name: c.name, level: c.level }));
  }, [categories]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">商品管理</h1>
          <p className="text-sm text-muted-foreground">
            商品分页、搜索、上下架与库存概览
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void fetchList()} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button asChild>
            <Link href="/catalog/products/edit">
              <Plus className="h-4 w-4 mr-2" />
              新增商品
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-background p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs text-muted-foreground">搜索</Label>
            <Input
              value={keywordInput}
              onChange={(e) => {
                keywordEditedRef.current = true;
                setKeywordInput(e.target.value);
              }}
              placeholder="商品名/标题"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">分类</Label>
            <Select
              value={categoryId}
              onValueChange={(v) => {
                setPage(1);
                setCategoryId(v);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {categoryOptions.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {`${'—'.repeat(Math.max(0, c.level - 1))} ${c.name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categoryError ? (
              <p className="text-xs text-destructive">分类加载失败：{categoryError}</p>
            ) : null}
          </div>

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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="1">上架</SelectItem>
                <SelectItem value="0">下架</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">排序</Label>
            <Select
              value={sort}
              onValueChange={(v) => {
                setPage(1);
                setSort(v);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">综合</SelectItem>
                <SelectItem value="1">销量</SelectItem>
                <SelectItem value="2">价格升序</SelectItem>
                <SelectItem value="3">价格降序</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            第 {page} / {safeTotalPages} 页 · 共 {total} 条
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">每页</Label>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPage(1);
                setPageSize(Number(v));
              }}
            >
              <SelectTrigger className="w-[110px]">
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
              <TableHead>商品</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>价格</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>销量</TableHead>
              <TableHead>更新时间</TableHead>
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
              items.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono">{product.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.primary_image}
                        alt={product.name}
                        className="h-10 w-10 rounded-md object-cover border"
                      />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{product.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {product.title}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {categoryMap.get(product.category_id) ?? `#${product.category_id}`}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {product.min_price} ~ {product.max_price}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={product.status === 1}
                        onCheckedChange={(checked) =>
                          void toggleStatus(product, checked ? 1 : 0)
                        }
                        aria-label="切换上下架"
                      />
                      <Badge variant={product.status === 1 ? 'default' : 'secondary'}>
                        {productStatusLabel(product.status)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">{product.sales_count}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(product.updated_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/catalog/products/edit?id=${product.id}`}>
                          <Edit className="h-4 w-4 mr-1" />
                          编辑
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/5"
                        onClick={() => confirmDelete(product)}
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

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteTarget(null);
        }}
        title="确认删除"
        description={deleteTarget ? `将删除商品「${deleteTarget.name}」` : '将删除该商品'}
        confirmText="删除"
        loading={deleting}
        onConfirm={doDelete}
      />

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}
