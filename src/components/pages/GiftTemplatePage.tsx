'use client';

import { useEffect, useRef, useState } from 'react';
import { Ban, CheckCircle2, ChevronLeft, ChevronRight, Pencil, Plus, RefreshCw, Search, Settings2, Trash2, Upload, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { giftTemplateApi, uploadApi } from '@/lib/api';
import { GiftTemplate, GiftTemplateListResponse } from '@/types/gift-template';

type TemplateFormMode = 'create' | 'edit';

type TemplateFormState = {
  title: string;
  subtitle: string;
  image: string;
  description: string;
  default_cost: number;
  default_point: number;
  status: 0 | 1;
};

const blankForm: TemplateFormState = {
  title: '',
  subtitle: '',
  image: '',
  description: '',
  default_cost: 0,
  default_point: 0,
  status: 0
};

export default function GiftTemplatePage() {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<GiftTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [searchTitle, setSearchTitle] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | '0' | '1'>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<TemplateFormMode>('create');
  const [editing, setEditing] = useState<GiftTemplate | null>(null);
  const [form, setForm] = useState<TemplateFormState>(blankForm);

  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState<GiftTemplate | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const { toasts, removeToast, error: errorToast, success } = useToast();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const resp = await giftTemplateApi.page({
        page,
        page_size: pageSize,
        title: searchTitle.trim() ? searchTitle.trim() : undefined,
        status: statusFilter === 'all' ? undefined : Number(statusFilter)
      });
      if (resp.success && resp.data) {
        const data = resp.data as GiftTemplateListResponse;
        setTemplates(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 0);
      } else {
        throw new Error(resp.err_message || '获取礼品库失败');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '获取礼品库失败';
      errorToast('加载失败', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleSearch = () => {
    if (page === 1) {
      fetchTemplates();
      return;
    }
    setPage(1);
  };

  const openCreate = () => {
    setFormMode('create');
    setEditing(null);
    setForm(blankForm);
    setDialogOpen(true);
  };

  const openEdit = (t: GiftTemplate) => {
    setFormMode('edit');
    setEditing(t);
    setForm({
      title: t.title || '',
      subtitle: String(t.subtitle || ''),
      image: String(t.image || ''),
      description: String(t.description || ''),
      default_cost: t.default_cost ?? 0,
      default_point: t.default_point ?? 0,
      status: (t.status ?? 0) as 0 | 1
    });
    setDialogOpen(true);
  };

  const openDelete = (t: GiftTemplate) => {
    setDeleting(t);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleting) return;
    try {
      setDeletingLoading(true);
      const resp = await giftTemplateApi.delete(deleting.id);
      if (!resp.success) throw new Error(resp.err_message || '删除失败');
      success('删除成功', '已移除该模板（软删除）');
      setDeleteConfirmOpen(false);
      setDeleting(null);
      fetchTemplates();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '删除失败';
      errorToast('操作失败', msg);
    } finally {
      setDeletingLoading(false);
    }
  };

  const handleToggleStatus = async (t: GiftTemplate) => {
    try {
      const nextStatus = t.status === 0 ? 1 : 0;
      const resp = await giftTemplateApi.update({ id: t.id, status: nextStatus });
      if (!resp.success) throw new Error(resp.err_message || '更新失败');
      success('更新成功', nextStatus === 0 ? '模板已启用' : '模板已停用');
      fetchTemplates();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '更新失败';
      errorToast('操作失败', msg);
    }
  };

  const handleSelectImage = () => {
    imageInputRef.current?.click();
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImageUploading(true);
      const url = await uploadApi.uploadImage(file);
      setForm((prev) => ({ ...prev, image: url }));
      success('上传成功', '图片已上传并回填 URL');
    } catch (error) {
      const msg = error instanceof Error ? error.message : '图片上传失败';
      errorToast('上传失败', msg);
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const title = form.title.trim();
    if (!title) {
      errorToast('校验失败', '请输入模板名称');
      return;
    }
    if (Number.isNaN(form.default_cost) || form.default_cost < 0) {
      errorToast('校验失败', '默认成本价不能为负数');
      return;
    }
    if (Number.isNaN(form.default_point) || form.default_point < 0) {
      errorToast('校验失败', '默认兑换积分不能为负数');
      return;
    }

    try {
      if (formMode === 'create') {
        const resp = await giftTemplateApi.create({
          title,
          subtitle: form.subtitle.trim() ? form.subtitle.trim() : undefined,
          image: form.image.trim() ? form.image.trim() : undefined,
          description: form.description.trim() ? form.description.trim() : undefined,
          default_cost: form.default_cost,
          default_point: form.default_point,
          status: form.status
        });
        if (!resp.success) throw new Error(resp.err_message || '新增失败');
        success('新增成功', '模板已创建，可用于快速新增场地礼品');
      } else {
        if (!editing) return;
        const resp = await giftTemplateApi.update({
          id: editing.id,
          title,
          subtitle: form.subtitle.trim() ? form.subtitle.trim() : undefined,
          image: form.image.trim() ? form.image.trim() : undefined,
          description: form.description.trim() ? form.description.trim() : undefined,
          default_cost: form.default_cost,
          default_point: form.default_point,
          status: form.status
        });
        if (!resp.success) throw new Error(resp.err_message || '更新失败');
        success('更新成功', '模板信息已更新（不会自动同步到场地库存）');
      }

      setDialogOpen(false);
      fetchTemplates();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '提交失败';
      errorToast('操作失败', msg);
    }
  };

  const handlePageChange = (next: number) => {
    if (next < 1 || next > totalPages) return;
    setPage(next);
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">礼品库</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            维护租户维度的礼品模板（用于预填新增场地礼品），模板修改不会自动同步到场地库存
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchTemplates} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            新增模板
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            筛选与搜索
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>模板名称</Label>
            <div className="flex gap-2">
              <Input
                placeholder="搜索模板名称"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">支持模糊搜索（title ILIKE）</p>
          </div>

          <div className="space-y-2">
            <Label>状态</Label>
            <Select value={statusFilter} onValueChange={(v) => {
              setPage(1);
              setStatusFilter(v as 'all' | '0' | '1');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="请选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="0">启用</SelectItem>
                <SelectItem value="1">停用</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">停用模板仍可保留，但不建议用于新增</p>
          </div>

          <div className="flex items-end justify-end">
            <div className="text-sm text-muted-foreground">
              共 {total} 条 · 第 {page}/{totalPages || 1} 页
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">模板列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
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
                    <TableHead className="w-[140px]">默认积分</TableHead>
                    <TableHead className="w-[140px]">默认成本(分)</TableHead>
                    <TableHead className="w-[120px]">状态</TableHead>
                    <TableHead className="w-[220px] text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    templates.map((t) => (
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
                          {t.status === 0 ? (
                            <Badge variant="default">启用</Badge>
                          ) : (
                            <Badge variant="secondary">停用</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEdit(t)}>
                              <Pencil className="h-4 w-4 mr-1" />
                              编辑
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleToggleStatus(t)}>
                              {t.status === 0 ? (
                                <>
                                  <Ban className="h-4 w-4 mr-1" />
                                  停用
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  启用
                                </>
                              )}
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => openDelete(t)}>
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

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  共 {total} 条 · 第 {page}/{totalPages || 1} 页
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(page - 1)} disabled={page <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages}>
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{formMode === 'create' ? '新增模板' : '编辑模板'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">模板名称</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="例如：可乐"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">副标题</Label>
                <Input
                  id="subtitle"
                  value={form.subtitle}
                  onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="可选"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_point">默认兑换积分</Label>
                <Input
                  id="default_point"
                  type="number"
                  min={0}
                  value={form.default_point}
                  onChange={(e) => setForm((prev) => ({ ...prev, default_point: Number(e.target.value) }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_cost">默认成本(分)</Label>
                <Input
                  id="default_cost"
                  type="number"
                  min={0}
                  value={form.default_cost}
                  onChange={(e) => setForm((prev) => ({ ...prev, default_cost: Number(e.target.value) }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>状态</Label>
                <Select
                  value={String(form.status)}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, status: (Number(v) as 0 | 1) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">启用</SelectItem>
                    <SelectItem value="1">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="image">图片</Label>
                <div className="flex gap-2">
                  <Input
                    id="image"
                    value={form.image}
                    onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.value }))}
                    placeholder="可选：可粘贴图片 URL 或上传"
                  />
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileChange}
                  />
                  <Button type="button" variant="outline" onClick={handleSelectImage} disabled={imageUploading}>
                    {imageUploading ? (
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
                  {form.image ? (
                    <Button type="button" variant="outline" onClick={() => setForm((prev) => ({ ...prev, image: '' }))} disabled={imageUploading}>
                      <X className="h-4 w-4 mr-2" />
                      清空
                    </Button>
                  ) : null}
                </div>
                {form.image ? (
                  <div className="flex items-center gap-3 rounded-md border bg-slate-50 p-2">
                    <div className="h-12 w-12 rounded bg-white bg-cover bg-center border" style={{ backgroundImage: `url(${form.image})` }} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs text-muted-foreground">{form.image}</div>
                      <a href={form.image} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline underline-offset-2">
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
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="可选"
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">{formMode === 'create' ? '创建' : '保存'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="确认删除模板？"
        description={deleting ? `将软删除模板「${deleting.title}」，不影响已创建的场地库存。` : '将软删除该模板。'}
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        loading={deletingLoading}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
