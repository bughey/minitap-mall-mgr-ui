'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Edit, Plus, RefreshCw, Trash2 } from 'lucide-react';
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
import { categoryApi, type ProductCategoryNode } from '@/lib/api';

type FlatCategory = {
  node: ProductCategoryNode;
  depth: number;
  parent?: ProductCategoryNode;
};

type CategoryForm = {
  parent_id: number;
  name: string;
  description: string;
  icon: string;
  image: string;
  is_visible: boolean;
  sort_order: number;
};

const defaultForm: CategoryForm = {
  parent_id: 0,
  name: '',
  description: '',
  icon: '',
  image: '',
  is_visible: true,
  sort_order: 0,
};

const flattenTree = (
  nodes: ProductCategoryNode[],
  depth = 0,
  parent?: ProductCategoryNode
): FlatCategory[] => {
  const out: FlatCategory[] = [];
  for (const node of nodes) {
    out.push({ node, depth, parent });
    if (node.children?.length) {
      out.push(...flattenTree(node.children, depth + 1, node));
    }
  }
  return out;
};

export default function CategoriesPage() {
  const toast = useToast();
  const [tree, setTree] = useState<ProductCategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<FlatCategory | null>(null);
  const [form, setForm] = useState<CategoryForm>(defaultForm);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FlatCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const flat = useMemo(() => flattenTree(tree), [tree]);
  const parentCandidates = useMemo(
    () => flat.filter((f) => f.node.level < 3),
    [flat]
  );

  const fetchTree = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      setError(null);
      const resp = await categoryApi.tree();
      if (requestId !== requestIdRef.current) return;
      if (!resp.success || !resp.data) {
        throw new Error(resp.err_message || '获取分类树失败');
      }
      setTree(resp.data);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      toast.error('加载失败', message);
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchTree();
  }, [fetchTree]);

  const openCreate = (parent?: ProductCategoryNode) => {
    setEditing(null);
    setForm({
      ...defaultForm,
      parent_id: parent ? parent.id : 0,
    });
    setDialogOpen(true);
  };

  const openEdit = (item: FlatCategory) => {
    setEditing(item);
    setForm({
      parent_id: item.node.parent_id,
      name: item.node.name,
      description: item.node.description ?? '',
      icon: item.node.icon ?? '',
      image: item.node.image ?? '',
      is_visible: item.node.is_visible,
      sort_order: item.node.sort_order,
    });
    setDialogOpen(true);
  };

  const validateForm = (): string | null => {
    if (!form.name.trim()) return 'name 不能为空';
    if (form.parent_id < 0) return 'parent_id 不能为负数';
    if (form.sort_order < 0) return 'sort_order 不能为负数';
    return null;
  };

  const submit = async () => {
    const err = validateForm();
    if (err) {
      toast.error('参数错误', err);
      return;
    }

    const payload = {
      parent_id: form.parent_id,
      name: form.name.trim(),
      description: form.description.trim() ? form.description.trim() : undefined,
      icon: form.icon.trim() ? form.icon.trim() : undefined,
      image: form.image.trim() ? form.image.trim() : undefined,
      is_visible: form.is_visible,
      sort_order: form.sort_order,
    };

    try {
      setSaving(true);
      if (editing) {
        const resp = await categoryApi.update(editing.node.id, payload);
        if (!resp.success || !resp.data) {
          throw new Error(resp.err_message || '保存失败');
        }
      } else {
        const resp = await categoryApi.create(payload);
        if (!resp.success || !resp.data) {
          throw new Error(resp.err_message || '创建失败');
        }
      }

      toast.success(editing ? '更新成功' : '创建成功');
      setDialogOpen(false);
      await fetchTree();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('保存失败', message);
    } finally {
      setSaving(false);
    }
  };

  const toggleVisible = async (node: ProductCategoryNode, next: boolean) => {
    try {
      const resp = await categoryApi.setVisible(node.id, next);
      if (!resp.success) {
        throw new Error(resp.err_message || '更新失败');
      }
      await fetchTree();
      toast.success('已更新');
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('更新失败', message);
    }
  };

  const confirmDelete = (item: FlatCategory) => {
    setDeleteTarget(item);
    setDeleteOpen(true);
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const resp = await categoryApi.delete(deleteTarget.node.id);
      if (!resp.success) {
        throw new Error(resp.err_message || '删除失败');
      }
      toast.success('删除成功');
      setDeleteOpen(false);
      setDeleteTarget(null);
      await fetchTree();
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
          <h1 className="text-xl font-semibold tracking-tight">分类管理</h1>
          <p className="text-sm text-muted-foreground">
            三级分类树维护、显示/隐藏与排序
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void fetchTree()} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button onClick={() => openCreate()}>
            <Plus className="h-4 w-4 mr-2" />
            新增分类
          </Button>
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
              <TableHead>名称</TableHead>
              <TableHead>层级</TableHead>
              <TableHead>可见</TableHead>
              <TableHead>排序</TableHead>
              <TableHead>路径</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : flat.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  暂无分类
                </TableCell>
              </TableRow>
            ) : (
              flat.map((item) => (
                <TableRow key={item.node.id}>
                  <TableCell className="font-mono">{item.node.id}</TableCell>
                  <TableCell>
                    <div
                      className="flex items-center gap-2"
                      style={{ paddingLeft: item.depth * 16 }}
                    >
                      <span className="font-medium">{item.node.name}</span>
                      {item.node.description ? (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {item.node.description}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    <Badge variant="secondary">{item.node.level}</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={item.node.is_visible}
                      onCheckedChange={(checked) => void toggleVisible(item.node, checked)}
                      aria-label="切换显示状态"
                    />
                  </TableCell>
                  <TableCell className="tabular-nums">{item.node.sort_order}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {item.node.path}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={item.node.level >= 3}
                        onClick={() => openCreate(item.node)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        子分类
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                        <Edit className="h-4 w-4 mr-1" />
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/5"
                        onClick={() => confirmDelete(item)}
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
            <DialogTitle>{editing ? '编辑分类' : '新增分类'}</DialogTitle>
            <DialogDescription>仅支持三级分类；编辑不支持调整父级</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>父分类</Label>
              <Select
                value={String(form.parent_id)}
                onValueChange={(v) => setForm((prev) => ({ ...prev, parent_id: Number(v) }))}
                disabled={!!editing}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">顶级分类</SelectItem>
                  {parentCandidates.map((p) => (
                    <SelectItem key={p.node.id} value={String(p.node.id)}>
                      {`${'—'.repeat(p.depth)} ${p.node.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="category-name">名称</Label>
              <Input
                id="category-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="category-desc">描述（可选）</Label>
              <Input
                id="category-desc"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-icon">Icon URL（可选）</Label>
              <Input
                id="category-icon"
                value={form.icon}
                onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-image">Image URL（可选）</Label>
              <Input
                id="category-image"
                value={form.image}
                onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>显示</Label>
              <Select
                value={form.is_visible ? '1' : '0'}
                onValueChange={(v) => setForm((prev) => ({ ...prev, is_visible: v === '1' }))}
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
              <Label htmlFor="category-sort">排序</Label>
              <Input
                id="category-sort"
                type="number"
                value={String(form.sort_order)}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
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
          deleteTarget
            ? `将删除分类「${deleteTarget.node.name}」（要求无子分类、无商品）`
            : '将删除该分类'
        }
        confirmText="删除"
        loading={deleting}
        onConfirm={doDelete}
      />

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}
