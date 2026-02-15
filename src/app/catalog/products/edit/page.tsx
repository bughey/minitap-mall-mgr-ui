'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Edit,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmDialog from '@/components/ui/confirm-dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import {
  categoryApi,
  productApi,
  skuApi,
  specApi,
  uploadApi,
  virtualCardApi,
  type ProductCategoryNode,
  type ProductDetail,
  type SkuItem,
  type SpecItem,
  type VirtualCardImportResult,
  type VirtualCardStockResult,
} from '@/lib/api';

type ProductForm = {
  name: string;
  title: string;
  description: string;
  primary_image: string;
  images: string[];
  video: string;
  min_price: number;
  max_price: number;
  category_id: number;
  fulfill_type: number;
  brand: string;
  tagsText: string;
  status: number;
  sort_order: number;
};

const defaultProductForm: ProductForm = {
  name: '',
  title: '',
  description: '',
  primary_image: '',
  images: [],
  video: '',
  min_price: 0,
  max_price: 0,
  category_id: 0,
  fulfill_type: 0,
  brand: '',
  tagsText: '',
  status: 1,
  sort_order: 0,
};

type SpecForm = {
  spec_name: string;
  spec_values_text: string;
  sort_order: number;
};

const defaultSpecForm: SpecForm = {
  spec_name: '',
  spec_values_text: '',
  sort_order: 0,
};

type SkuForm = {
  name: string;
  specs_text: string;
  image: string;
  price: number;
  original_price: number | '';
  stock: number;
  sku_code: string;
  barcode: string;
  weight: number | '';
  volume: number | '';
  status: number;
  sort_order: number;
};

const defaultSkuForm: SkuForm = {
  name: '',
  specs_text: '{\n  \n}',
  image: '',
  price: 0,
  original_price: '',
  stock: 0,
  sku_code: '',
  barcode: '',
  weight: '',
  volume: '',
  status: 1,
  sort_order: 0,
};

const safeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((v) => typeof v === 'string' && v.trim()).map((v) => v.trim());
};

const parseSpecsObject = (text: string): Record<string, unknown> => {
  const trimmed = text.trim();
  const parsed: unknown = JSON.parse(trimmed);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('specs 必须为 JSON 对象');
  }
  return parsed as Record<string, unknown>;
};

const parseVirtualCardImportItems = (text: string): { payload: Record<string, unknown> }[] => {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('请填写待导入的卡密数据');
  }

  const normalizePayload = (input: unknown, index: number): { payload: Record<string, unknown> } => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new Error(`第 ${index + 1} 条不是 JSON 对象`);
    }
    const maybePayload = (input as Record<string, unknown>).payload;
    if (maybePayload && typeof maybePayload === 'object' && !Array.isArray(maybePayload)) {
      return { payload: maybePayload as Record<string, unknown> };
    }
    return { payload: input as Record<string, unknown> };
  };

  if (trimmed.startsWith('[')) {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('JSON 数组不能为空');
    }
    return parsed.map((item, index) => normalizePayload(item, index));
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    throw new Error('请输入至少一条 JSON');
  }
  return lines.map((line, index) => {
    try {
      const parsed = JSON.parse(line) as unknown;
      return normalizePayload(parsed, index);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`第 ${index + 1} 行 JSON 解析失败：${message}`);
    }
  });
};

const flattenCategories = (nodes: ProductCategoryNode[], out: ProductCategoryNode[] = []) => {
  for (const node of nodes) {
    out.push(node);
    if (node.children?.length) flattenCategories(node.children, out);
  }
  return out;
};

function ProductEditInner() {
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();

  const idParam = params.get('id');
  const productId = idParam ? Number(idParam) : null;
  const isEdit = productId !== null && Number.isFinite(productId) && productId > 0;

  const [categories, setCategories] = useState<ProductCategoryNode[]>([]);
  const categoryOptions = useMemo(() => {
    const flat = flattenCategories(categories, []);
    return flat.map((c) => ({ id: c.id, name: c.name, level: c.level }));
  }, [categories]);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [form, setForm] = useState<ProductForm>(defaultProductForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const primaryUploadRef = useRef<HTMLInputElement | null>(null);
  const galleryUploadRef = useRef<HTMLInputElement | null>(null);

  const [specs, setSpecs] = useState<SpecItem[]>([]);
  const [skus, setSkus] = useState<SkuItem[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  const [specDialogOpen, setSpecDialogOpen] = useState(false);
  const [specSaving, setSpecSaving] = useState(false);
  const [specEditing, setSpecEditing] = useState<SpecItem | null>(null);
  const [specForm, setSpecForm] = useState<SpecForm>(defaultSpecForm);

  const [skuDialogOpen, setSkuDialogOpen] = useState(false);
  const [skuSaving, setSkuSaving] = useState(false);
  const [skuEditing, setSkuEditing] = useState<SkuItem | null>(null);
  const [skuForm, setSkuForm] = useState<SkuForm>(defaultSkuForm);
  const skuImageUploadRef = useRef<HTMLInputElement | null>(null);

  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockTarget, setStockTarget] = useState<SkuItem | null>(null);
  const [stockDelta, setStockDelta] = useState(0);
  const [stockSaving, setStockSaving] = useState(false);
  const [virtualStocks, setVirtualStocks] = useState<Record<number, VirtualCardStockResult>>({});
  const [virtualStockLoading, setVirtualStockLoading] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importTarget, setImportTarget] = useState<SkuItem | null>(null);
  const [importPayloadText, setImportPayloadText] = useState('');
  const [importBatchName, setImportBatchName] = useState('');
  const [importRemark, setImportRemark] = useState('');
  const [importResult, setImportResult] = useState<VirtualCardImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  const [deleteSkuOpen, setDeleteSkuOpen] = useState(false);
  const [deleteSkuTarget, setDeleteSkuTarget] = useState<SkuItem | null>(null);
  const [deleteSkuLoading, setDeleteSkuLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    const resp = await categoryApi.tree();
    if (!resp.success || !resp.data) {
      throw new Error(resp.err_message || '获取分类失败');
    }
    setCategories(resp.data);
  }, []);

  const fillFormFromProduct = (p: ProductDetail) => {
    const images = safeStringArray(p.images);
    const tags = safeStringArray(p.tags);
    setForm({
      name: p.name,
      title: p.title,
      description: p.description ?? '',
      primary_image: p.primary_image,
      images,
      video: p.video ?? '',
      min_price: p.min_price,
      max_price: p.max_price,
      category_id: p.category_id,
      fulfill_type: p.fulfill_type,
      brand: p.brand ?? '',
      tagsText: tags.join(', '),
      status: p.status,
      sort_order: p.sort_order,
    });
  };

  const fetchAll = useCallback(async () => {
    if (!isEdit || !productId) {
      setLoading(false);
      setProduct(null);
      setSpecs([]);
      setSkus([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const resp = await productApi.detail(productId);
      if (!resp.success || !resp.data) {
        throw new Error(resp.err_message || '获取商品失败');
      }
      setProduct(resp.data);
      fillFormFromProduct(resp.data);

      setLoadingLists(true);
      const [specResp, skuResp] = await Promise.all([
        specApi.list(productId),
        skuApi.list(productId),
      ]);
      if (specResp.success && specResp.data) {
        setSpecs(specResp.data);
      } else {
        throw new Error(specResp.err_message || '获取规格失败');
      }
      if (skuResp.success && skuResp.data) {
        setSkus(skuResp.data);
      } else {
        throw new Error(skuResp.err_message || '获取 SKU 失败');
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      toast.error('加载失败', message);
    } finally {
      setLoading(false);
      setLoadingLists(false);
    }
  }, [isEdit, productId, toast]);

  useEffect(() => {
    void fetchCategories().catch((e) => {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('分类加载失败', message);
    });
  }, [fetchCategories, toast]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const reloadSkuList = useCallback(async (): Promise<SkuItem[]> => {
    if (!productId) return [];
    const resp = await skuApi.list(productId);
    if (!resp.success || !resp.data) {
      throw new Error(resp.err_message || '获取 SKU 失败');
    }
    setSkus(resp.data);
    return resp.data;
  }, [productId]);

  const refreshVirtualStocks = useCallback(
    async (targetSkus: SkuItem[]) => {
      if (targetSkus.length === 0) {
        setVirtualStocks({});
        return;
      }
      try {
        setVirtualStockLoading(true);
        const stockPairs = await Promise.all(
          targetSkus.map(async (sku) => {
            const resp = await virtualCardApi.stock(sku.id);
            if (!resp.success || !resp.data) {
              throw new Error(resp.err_message || `获取 SKU#${sku.id} 卡密库存失败`);
            }
            return [sku.id, resp.data] as const;
          })
        );
        setVirtualStocks(Object.fromEntries(stockPairs));
      } finally {
        setVirtualStockLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!isEdit || form.fulfill_type !== 1) {
      setVirtualStocks({});
      return;
    }
    if (skus.length === 0) {
      setVirtualStocks({});
      return;
    }
    void refreshVirtualStocks(skus).catch((e) => {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('卡密库存加载失败', message);
    });
  }, [isEdit, form.fulfill_type, skus, refreshVirtualStocks, toast]);

  const uploadAndSet = async (file: File, setter: (url: string) => void) => {
    try {
      const url = await uploadApi.uploadImage(file);
      setter(url);
      toast.success('图片上传成功', url);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('图片上传失败', message);
    }
  };

  const validateProduct = (): string | null => {
    if (!form.name.trim()) return 'name 不能为空';
    if (!form.title.trim()) return 'title 不能为空';
    if (!form.primary_image.trim()) return 'primary_image 不能为空';
    if (form.category_id <= 0) return '请选择分类';
    if (form.min_price < 0 || form.max_price < 0) return '价格不能为负数';
    if (form.min_price > form.max_price) return 'min_price 不能大于 max_price';
    if (form.sort_order < 0) return 'sort_order 不能为负数';
    if (![0, 1].includes(form.status)) return 'status 仅支持 0/1';
    if (![0, 1].includes(form.fulfill_type)) return 'fulfill_type 仅支持 0/1';
    return null;
  };

  const saveProduct = async () => {
    const err = validateProduct();
    if (err) {
      toast.error('参数错误', err);
      return;
    }

    const tags = safeStringArray(
      form.tagsText
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
    );

    const payload = {
      name: form.name.trim(),
      title: form.title.trim(),
      description: form.description.trim() ? form.description.trim() : undefined,
      primary_image: form.primary_image.trim(),
      images: form.images.length ? form.images : undefined,
      video: form.video.trim() ? form.video.trim() : undefined,
      min_price: form.min_price,
      max_price: form.max_price,
      category_id: form.category_id,
      fulfill_type: form.fulfill_type,
      brand: form.brand.trim() ? form.brand.trim() : undefined,
      tags: tags.length ? tags : undefined,
      status: form.status,
      sort_order: form.sort_order,
    };

    try {
      setSaving(true);
      const resp = isEdit && productId
        ? await productApi.update(productId, payload)
        : await productApi.create(payload);

      if (!resp.success || !resp.data) {
        throw new Error(resp.err_message || '保存失败');
      }

      toast.success('保存成功');
      setProduct(resp.data);
      fillFormFromProduct(resp.data);

      if (!isEdit) {
        router.push(`/catalog/products/edit?id=${resp.data.id}`);
      } else {
        await fetchAll();
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('保存失败', message);
    } finally {
      setSaving(false);
    }
  };

  const openCreateSpec = () => {
    setSpecEditing(null);
    setSpecForm(defaultSpecForm);
    setSpecDialogOpen(true);
  };

  const openEditSpec = (spec: SpecItem) => {
    setSpecEditing(spec);
    setSpecForm({
      spec_name: spec.spec_name,
      spec_values_text: spec.spec_values.join(', '),
      sort_order: spec.sort_order,
    });
    setSpecDialogOpen(true);
  };

  const saveSpec = async () => {
    if (!productId) return;
    if (!specForm.spec_name.trim()) {
      toast.error('参数错误', 'spec_name 不能为空');
      return;
    }
    const values = specForm.spec_values_text
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    if (values.length === 0) {
      toast.error('参数错误', 'spec_values 不能为空');
      return;
    }
    if (specForm.sort_order < 0) {
      toast.error('参数错误', 'sort_order 不能为负数');
      return;
    }

    try {
      setSpecSaving(true);
      const resp = specEditing
        ? await specApi.update(specEditing.id, {
            spec_name: specForm.spec_name.trim(),
            spec_values: values,
            sort_order: specForm.sort_order,
          })
        : await specApi.create({
            product_id: productId,
            spec_name: specForm.spec_name.trim(),
            spec_values: values,
            sort_order: specForm.sort_order,
          });

      if (!resp.success || !resp.data) {
        throw new Error(resp.err_message || '保存失败');
      }

      toast.success(specEditing ? '更新成功' : '创建成功');
      setSpecDialogOpen(false);
      const listResp = await specApi.list(productId);
      if (listResp.success && listResp.data) setSpecs(listResp.data);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('保存失败', message);
    } finally {
      setSpecSaving(false);
    }
  };

  const deleteSpec = async (spec: SpecItem) => {
    if (!productId) return;
    try {
      const resp = await specApi.delete(spec.id);
      if (!resp.success) {
        throw new Error(resp.err_message || '删除失败');
      }
      toast.success('删除成功');
      const listResp = await specApi.list(productId);
      if (listResp.success && listResp.data) setSpecs(listResp.data);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('删除失败', message);
    }
  };

  const openCreateSku = () => {
    setSkuEditing(null);
    setSkuForm(defaultSkuForm);
    setSkuDialogOpen(true);
  };

  const openEditSku = (sku: SkuItem) => {
    setSkuEditing(sku);
    setSkuForm({
      name: sku.name,
      specs_text: JSON.stringify(sku.specs ?? {}, null, 2),
      image: sku.image ?? '',
      price: sku.price,
      original_price: sku.original_price ?? '',
      stock: sku.stock,
      sku_code: sku.sku_code ?? '',
      barcode: sku.barcode ?? '',
      weight: sku.weight ?? '',
      volume: sku.volume ?? '',
      status: sku.status,
      sort_order: sku.sort_order,
    });
    setSkuDialogOpen(true);
  };

  const saveSku = async () => {
    if (!productId) return;
    if (!skuForm.name.trim()) {
      toast.error('参数错误', 'name 不能为空');
      return;
    }
    if (skuForm.price < 0) {
      toast.error('参数错误', 'price 不能为负数');
      return;
    }
    if (skuForm.stock < 0) {
      toast.error('参数错误', 'stock 不能为负数');
      return;
    }
    if (skuForm.sort_order < 0) {
      toast.error('参数错误', 'sort_order 不能为负数');
      return;
    }
    let specsObj: Record<string, unknown>;
    try {
      specsObj = parseSpecsObject(skuForm.specs_text);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('specs 格式错误', message);
      return;
    }

    try {
      setSkuSaving(true);
      const resp = skuEditing
        ? await skuApi.update(skuEditing.id, {
            name: skuForm.name.trim(),
            specs: specsObj,
            image: skuForm.image.trim() ? skuForm.image.trim() : undefined,
            price: skuForm.price,
            original_price: skuForm.original_price === '' ? undefined : skuForm.original_price,
            stock: skuForm.stock,
            sku_code: skuForm.sku_code.trim() ? skuForm.sku_code.trim() : undefined,
            barcode: skuForm.barcode.trim() ? skuForm.barcode.trim() : undefined,
            weight: skuForm.weight === '' ? undefined : skuForm.weight,
            volume: skuForm.volume === '' ? undefined : skuForm.volume,
            status: skuForm.status,
            sort_order: skuForm.sort_order,
          })
        : await skuApi.create({
            product_id: productId,
            name: skuForm.name.trim(),
            specs: specsObj,
            image: skuForm.image.trim() ? skuForm.image.trim() : undefined,
            price: skuForm.price,
            original_price: skuForm.original_price === '' ? undefined : skuForm.original_price,
            stock: skuForm.stock,
            sku_code: skuForm.sku_code.trim() ? skuForm.sku_code.trim() : undefined,
            barcode: skuForm.barcode.trim() ? skuForm.barcode.trim() : undefined,
            weight: skuForm.weight === '' ? undefined : skuForm.weight,
            volume: skuForm.volume === '' ? undefined : skuForm.volume,
            status: skuForm.status,
            sort_order: skuForm.sort_order,
          });

      if (!resp.success || !resp.data) {
        throw new Error(resp.err_message || '保存失败');
      }

      toast.success(skuEditing ? '更新成功' : '创建成功');
      setSkuDialogOpen(false);
      await reloadSkuList();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('保存失败', message);
    } finally {
      setSkuSaving(false);
    }
  };

  const toggleSkuStatus = async (sku: SkuItem, next: number) => {
    try {
      const resp = await skuApi.setStatus(sku.id, next);
      if (!resp.success) {
        throw new Error(resp.err_message || '更新失败');
      }
      setSkus((prev) => prev.map((it) => (it.id === sku.id ? { ...it, status: next } : it)));
      toast.success('状态已更新');
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('更新状态失败', message);
    }
  };

  const openAdjustStock = (sku: SkuItem) => {
    setStockTarget(sku);
    setStockDelta(0);
    setStockDialogOpen(true);
  };

  const saveStock = async () => {
    if (!stockTarget) return;
    if (stockDelta === 0) {
      toast.error('参数错误', 'delta 不能为0');
      return;
    }
    try {
      setStockSaving(true);
      const resp = await skuApi.adjustStock(stockTarget.id, stockDelta);
      if (!resp.success || !resp.data) {
        throw new Error(resp.err_message || '调整失败');
      }
      toast.success('库存已调整');
      setStockDialogOpen(false);
      const latestSkus = await reloadSkuList();
      if (form.fulfill_type === 1) {
        await refreshVirtualStocks(latestSkus);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('调整失败', message);
    } finally {
      setStockSaving(false);
    }
  };

  const confirmDeleteSku = (sku: SkuItem) => {
    setDeleteSkuTarget(sku);
    setDeleteSkuOpen(true);
  };

  const doDeleteSku = async () => {
    if (!deleteSkuTarget || !productId) return;
    try {
      setDeleteSkuLoading(true);
      const resp = await skuApi.delete(deleteSkuTarget.id);
      if (!resp.success) {
        throw new Error(resp.err_message || '删除失败');
      }
      toast.success('删除成功');
      setDeleteSkuOpen(false);
      setDeleteSkuTarget(null);
      await reloadSkuList();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('删除失败', message);
    } finally {
      setDeleteSkuLoading(false);
    }
  };

  const openImportVirtualCards = (sku: SkuItem) => {
    setImportTarget(sku);
    setImportPayloadText('');
    setImportBatchName('');
    setImportRemark('');
    setImportResult(null);
    setImportDialogOpen(true);
  };

  const doImportVirtualCards = async () => {
    if (!importTarget) return;
    let items: { payload: Record<string, unknown> }[];
    try {
      items = parseVirtualCardImportItems(importPayloadText);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('导入参数错误', message);
      return;
    }

    try {
      setImporting(true);
      const resp = await virtualCardApi.importBatch({
        sku_id: importTarget.id,
        batch_name: importBatchName.trim() || undefined,
        remark: importRemark.trim() || undefined,
        items,
      });
      if (!resp.success || !resp.data) {
        throw new Error(resp.err_message || '导入失败');
      }
      setImportResult(resp.data);
      toast.success(
        '导入完成',
        `新增 ${resp.data.imported}，重复 ${resp.data.duplicated}，无效 ${resp.data.invalid}`
      );
      const latestSkus = await reloadSkuList();
      await refreshVirtualStocks(latestSkus);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('导入失败', message);
    } finally {
      setImporting(false);
    }
  };

  const skuReady = isEdit && !!productId;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/catalog/products">
                <ArrowLeft className="h-4 w-4 mr-1" />
                返回
              </Link>
            </Button>
            <h1 className="text-xl font-semibold tracking-tight">
              商品编辑{product?.id ? ` #${product.id}` : ''}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            使用查询参数：`?id=`（新增时不传 id）
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void fetchAll()} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button onClick={() => void saveProduct()} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? '保存中…' : '保存'}
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>加载失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>商品信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="p-name">名称</Label>
                <Input
                  id="p-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="p-title">标题</Label>
                <Input
                  id="p-title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="p-desc">描述（可选）</Label>
                <Textarea
                  id="p-desc"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="商品卖点、使用说明等"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>主图</Label>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <Input
                    value={form.primary_image}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, primary_image: e.target.value }))
                    }
                    placeholder="https://..."
                  />
                  <Input
                    ref={primaryUploadRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void uploadAndSet(file, (url) =>
                          setForm((prev) => ({ ...prev, primary_image: url }))
                        );
                      }
                      if (primaryUploadRef.current) primaryUploadRef.current.value = '';
                    }}
                  />
                  <Button type="button" variant="outline" onClick={() => primaryUploadRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    上传
                  </Button>
                </div>
                {form.primary_image.trim() ? (
                  <div className="rounded-lg border bg-background">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.primary_image}
                      alt="主图预览"
                      className="h-48 w-full rounded-lg object-cover"
                    />
                  </div>
                ) : null}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>轮播图（可选）</Label>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <Input
                    ref={galleryUploadRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void uploadAndSet(file, (url) =>
                          setForm((prev) => ({ ...prev, images: [url, ...prev.images] }))
                        );
                      }
                      if (galleryUploadRef.current) galleryUploadRef.current.value = '';
                    }}
                  />
                  <Button type="button" variant="outline" onClick={() => galleryUploadRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    添加图片
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    轮播图会以数组形式写入 `images`
                  </p>
                </div>

                {form.images.length === 0 ? (
                  <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
                    暂无轮播图
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {form.images.map((url) => (
                      <div key={url} className="rounded-lg border bg-background">
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt="轮播图"
                            className="h-40 w-full rounded-t-lg object-cover"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="absolute right-2 top-2"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                images: prev.images.filter((u) => u !== url),
                              }))
                            }
                            aria-label="移除图片"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          <div className="line-clamp-2 font-mono">{url}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="p-min">最低价</Label>
                <Input
                  id="p-min"
                  type="number"
                  value={String(form.min_price)}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, min_price: Number(e.target.value) }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="p-max">最高价</Label>
                <Input
                  id="p-max"
                  type="number"
                  value={String(form.max_price)}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, max_price: Number(e.target.value) }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>分类</Label>
                <Select
                  value={String(form.category_id)}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, category_id: Number(v) }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="请选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">请选择</SelectItem>
                    {categoryOptions.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {`${'—'.repeat(Math.max(0, c.level - 1))} ${c.name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>状态</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.status === 1}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, status: checked ? 1 : 0 }))
                    }
                  />
                  <Badge variant={form.status === 1 ? 'default' : 'secondary'}>
                    {form.status === 1 ? '上架' : '下架'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>履约类型</Label>
                <Select
                  value={String(form.fulfill_type)}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, fulfill_type: Number(v) }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="请选择履约类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">实物商品</SelectItem>
                    <SelectItem value="1">虚拟卡密商品</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="p-sort">排序</Label>
                <Input
                  id="p-sort"
                  type="number"
                  value={String(form.sort_order)}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="p-brand">品牌（可选）</Label>
                <Input
                  id="p-brand"
                  value={form.brand}
                  onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="p-tags">标签（可选，逗号分隔）</Label>
                <Input
                  id="p-tags"
                  value={form.tagsText}
                  onChange={(e) => setForm((prev) => ({ ...prev, tagsText: e.target.value }))}
                  placeholder="热卖, 促销, 限时"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="p-video">视频 URL（可选）</Label>
                <Input
                  id="p-video"
                  value={form.video}
                  onChange={(e) => setForm((prev) => ({ ...prev, video: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 规格定义 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>规格定义</span>
            <Button type="button" onClick={openCreateSpec} disabled={!skuReady}>
              <Plus className="h-4 w-4 mr-2" />
              新增规格
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!skuReady ? (
            <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
              请先保存商品后再维护规格/SKU
            </div>
          ) : loadingLists ? (
            <Skeleton className="h-12 w-full" />
          ) : specs.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
              暂无规格定义
            </div>
          ) : (
            <div className="rounded-lg border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead>可选值</TableHead>
                    <TableHead>排序</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specs.map((spec) => (
                    <TableRow key={spec.id}>
                      <TableCell className="font-medium">{spec.spec_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {spec.spec_values.join('、')}
                      </TableCell>
                      <TableCell className="tabular-nums">{spec.sort_order}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditSpec(spec)}>
                            <Edit className="h-4 w-4 mr-1" />
                            编辑
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/5"
                            onClick={() => void deleteSpec(spec)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SKU 列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span>SKU 列表</span>
              {form.fulfill_type === 1 ? (
                <Badge variant="secondary">虚拟卡密商品</Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {form.fulfill_type === 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void refreshVirtualStocks(skus)}
                  disabled={!skuReady || virtualStockLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {virtualStockLoading ? '刷新中…' : '刷新卡密库存'}
                </Button>
              ) : null}
              <Button type="button" onClick={openCreateSku} disabled={!skuReady}>
                <Plus className="h-4 w-4 mr-2" />
                新增 SKU
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!skuReady ? (
            <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
              请先保存商品后再维护规格/SKU
            </div>
          ) : loadingLists ? (
            <Skeleton className="h-12 w-full" />
          ) : skus.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
              暂无 SKU
            </div>
          ) : (
            <div className="rounded-lg border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>名称</TableHead>
                    <TableHead>规格</TableHead>
                    <TableHead>价格</TableHead>
                    <TableHead>库存</TableHead>
                    {form.fulfill_type === 1 ? <TableHead>卡密库存</TableHead> : null}
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skus.map((sku) => (
                    <TableRow key={sku.id}>
                      <TableCell className="font-mono">{sku.id}</TableCell>
                      <TableCell className="font-medium">{sku.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[280px] truncate">
                        {JSON.stringify(sku.specs)}
                      </TableCell>
                      <TableCell className="tabular-nums">{sku.price}</TableCell>
                      <TableCell className="tabular-nums">{sku.stock}</TableCell>
                      {form.fulfill_type === 1 ? (
                        <TableCell className="text-xs text-muted-foreground">
                          {virtualStocks[sku.id] ? (
                            <div className="space-y-1">
                              <div className="tabular-nums">
                                可用 {virtualStocks[sku.id].available} / 总量 {virtualStocks[sku.id].total}
                              </div>
                              <div className="tabular-nums">
                                已发 {virtualStocks[sku.id].delivered} / 作废 {virtualStocks[sku.id].invalid}
                              </div>
                            </div>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      ) : null}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={sku.status === 1}
                            onCheckedChange={(checked) =>
                              void toggleSkuStatus(sku, checked ? 1 : 0)
                            }
                          />
                          <Badge variant={sku.status === 1 ? 'default' : 'secondary'}>
                            {sku.status === 1 ? '启用' : '禁用'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openAdjustStock(sku)}>
                            库存
                          </Button>
                          {form.fulfill_type === 1 ? (
                            <Button variant="outline" size="sm" onClick={() => openImportVirtualCards(sku)}>
                              导入卡密
                            </Button>
                          ) : null}
                          <Button variant="outline" size="sm" onClick={() => openEditSku(sku)}>
                            <Edit className="h-4 w-4 mr-1" />
                            编辑
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/5"
                            onClick={() => confirmDeleteSku(sku)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spec dialog */}
      <Dialog
        open={specDialogOpen}
        onOpenChange={(open) => {
          setSpecDialogOpen(open);
          if (!open) {
            setSpecEditing(null);
            setSpecForm(defaultSpecForm);
          }
        }}
      >
        <DialogContent className="sm:max-w-[680px]">
          <DialogHeader>
            <DialogTitle>{specEditing ? '编辑规格' : '新增规格'}</DialogTitle>
            <DialogDescription>spec_values 用逗号分隔</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="spec-name">规格名</Label>
              <Input
                id="spec-name"
                value={specForm.spec_name}
                onChange={(e) => setSpecForm((prev) => ({ ...prev, spec_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="spec-values">规格值（逗号分隔）</Label>
              <Input
                id="spec-values"
                value={specForm.spec_values_text}
                onChange={(e) =>
                  setSpecForm((prev) => ({ ...prev, spec_values_text: e.target.value }))
                }
                placeholder="红色, 蓝色, 黑色"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spec-sort">排序</Label>
              <Input
                id="spec-sort"
                type="number"
                value={String(specForm.sort_order)}
                onChange={(e) =>
                  setSpecForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSpecDialogOpen(false)} disabled={specSaving}>
              取消
            </Button>
            <Button type="button" onClick={() => void saveSpec()} disabled={specSaving}>
              {specSaving ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SKU dialog */}
      <Dialog
        open={skuDialogOpen}
        onOpenChange={(open) => {
          setSkuDialogOpen(open);
          if (!open) {
            setSkuEditing(null);
            setSkuForm(defaultSkuForm);
          }
        }}
      >
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>{skuEditing ? '编辑 SKU' : '新增 SKU'}</DialogTitle>
            <DialogDescription>specs 为 JSON 对象（键值自定义）</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sku-name">名称</Label>
              <Input
                id="sku-name"
                value={skuForm.name}
                onChange={(e) => setSkuForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>规格 JSON（必填）</Label>
              <Textarea
                value={skuForm.specs_text}
                onChange={(e) => setSkuForm((prev) => ({ ...prev, specs_text: e.target.value }))}
                className="font-mono text-xs"
                rows={8}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>图片 URL（可选）</Label>
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <Input
                  value={skuForm.image}
                  onChange={(e) => setSkuForm((prev) => ({ ...prev, image: e.target.value }))}
                  placeholder="https://..."
                />
                <Input
                  ref={skuImageUploadRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      void uploadAndSet(file, (url) =>
                        setSkuForm((prev) => ({ ...prev, image: url }))
                      );
                    }
                    if (skuImageUploadRef.current) skuImageUploadRef.current.value = '';
                  }}
                />
                <Button type="button" variant="outline" onClick={() => skuImageUploadRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  上传
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku-price">价格</Label>
              <Input
                id="sku-price"
                type="number"
                value={String(skuForm.price)}
                onChange={(e) =>
                  setSkuForm((prev) => ({ ...prev, price: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku-op">原价（可选）</Label>
              <Input
                id="sku-op"
                type="number"
                value={skuForm.original_price === '' ? '' : String(skuForm.original_price)}
                onChange={(e) =>
                  setSkuForm((prev) => ({
                    ...prev,
                    original_price: e.target.value === '' ? '' : Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku-stock">库存</Label>
              <Input
                id="sku-stock"
                type="number"
                value={String(skuForm.stock)}
                onChange={(e) =>
                  setSkuForm((prev) => ({ ...prev, stock: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku-sort">排序</Label>
              <Input
                id="sku-sort"
                type="number"
                value={String(skuForm.sort_order)}
                onChange={(e) =>
                  setSkuForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>状态</Label>
              <Select
                value={String(skuForm.status)}
                onValueChange={(v) => setSkuForm((prev) => ({ ...prev, status: Number(v) }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">启用</SelectItem>
                  <SelectItem value="0">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku-code">SKU Code（可选）</Label>
              <Input
                id="sku-code"
                value={skuForm.sku_code}
                onChange={(e) => setSkuForm((prev) => ({ ...prev, sku_code: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku-barcode">条码（可选）</Label>
              <Input
                id="sku-barcode"
                value={skuForm.barcode}
                onChange={(e) => setSkuForm((prev) => ({ ...prev, barcode: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku-weight">重量（可选）</Label>
              <Input
                id="sku-weight"
                type="number"
                value={skuForm.weight === '' ? '' : String(skuForm.weight)}
                onChange={(e) =>
                  setSkuForm((prev) => ({
                    ...prev,
                    weight: e.target.value === '' ? '' : Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku-volume">体积（可选）</Label>
              <Input
                id="sku-volume"
                type="number"
                value={skuForm.volume === '' ? '' : String(skuForm.volume)}
                onChange={(e) =>
                  setSkuForm((prev) => ({
                    ...prev,
                    volume: e.target.value === '' ? '' : Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSkuDialogOpen(false)} disabled={skuSaving}>
              取消
            </Button>
            <Button type="button" onClick={() => void saveSku()} disabled={skuSaving}>
              {skuSaving ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock dialog */}
      <Dialog
        open={stockDialogOpen}
        onOpenChange={(open) => {
          setStockDialogOpen(open);
          if (!open) {
            setStockTarget(null);
            setStockDelta(0);
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>调整库存</DialogTitle>
            <DialogDescription>
              delta 可正可负（不影响 sold_count）
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>SKU</Label>
            <div className="text-sm text-muted-foreground">
              {stockTarget ? `${stockTarget.name}（当前库存 ${stockTarget.stock}）` : '—'}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock-delta">delta</Label>
            <Input
              id="stock-delta"
              type="number"
              value={String(stockDelta)}
              onChange={(e) => setStockDelta(Number(e.target.value))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStockDialogOpen(false)} disabled={stockSaving}>
              取消
            </Button>
            <Button type="button" onClick={() => void saveStock()} disabled={stockSaving}>
              {stockSaving ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Virtual card import dialog */}
      <Dialog
        open={importDialogOpen}
        onOpenChange={(open) => {
          setImportDialogOpen(open);
          if (!open) {
            setImportTarget(null);
            setImportPayloadText('');
            setImportBatchName('');
            setImportRemark('');
            setImportResult(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>导入卡密库存</DialogTitle>
            <DialogDescription>
              支持 JSON 数组或 JSON Lines（每行一个 JSON）。示例字段：
              <span className="font-mono"> vendor/card_no/card_pwd/expire_at/redeem_url/tips</span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>SKU</Label>
              <div className="text-sm text-muted-foreground">
                {importTarget ? `${importTarget.name}（ID ${importTarget.id}）` : '—'}
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="vc-batch">批次名（可选）</Label>
              <Input
                id="vc-batch"
                value={importBatchName}
                onChange={(e) => setImportBatchName(e.target.value)}
                placeholder="如：20260215-京东卡-补仓"
                disabled={importing}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="vc-remark">备注（可选）</Label>
              <Input
                id="vc-remark"
                value={importRemark}
                onChange={(e) => setImportRemark(e.target.value)}
                placeholder="如：供应商A 第1批"
                disabled={importing}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="vc-payload">卡密负载</Label>
              <Textarea
                id="vc-payload"
                value={importPayloadText}
                onChange={(e) => setImportPayloadText(e.target.value)}
                className="font-mono text-xs"
                rows={12}
                placeholder={`[\n  {\n    \"vendor\": \"JD\",\n    \"card_no\": \"NO-001\",\n    \"card_pwd\": \"PWD-001\",\n    \"expire_at\": \"2027-12-31\",\n    \"redeem_url\": \"https://example.com/redeem\",\n    \"tips\": \"到账后不可退\"\n  }\n]`}
                disabled={importing}
              />
            </div>
          </div>

          {importResult ? (
            <div className="rounded-lg border bg-muted/20 p-3 text-sm">
              <div className="font-medium">最近一次导入结果</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-muted-foreground md:grid-cols-4">
                <div className="tabular-nums">批次: {importResult.batch_id}</div>
                <div className="tabular-nums">新增: {importResult.imported}</div>
                <div className="tabular-nums">重复: {importResult.duplicated}</div>
                <div className="tabular-nums">无效: {importResult.invalid}</div>
              </div>
              {importTarget && virtualStocks[importTarget.id] ? (
                <div className="mt-2 text-xs text-muted-foreground">
                  当前库存：可用 {virtualStocks[importTarget.id].available} / 总量 {virtualStocks[importTarget.id].total} / 已发 {virtualStocks[importTarget.id].delivered}
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setImportDialogOpen(false)} disabled={importing}>
              取消
            </Button>
            <Button type="button" onClick={() => void doImportVirtualCards()} disabled={importing}>
              {importing ? '导入中…' : '开始导入'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteSkuOpen}
        onOpenChange={(open) => {
          setDeleteSkuOpen(open);
          if (!open) setDeleteSkuTarget(null);
        }}
        title="确认删除 SKU"
        description={deleteSkuTarget ? `将删除 SKU「${deleteSkuTarget.name}」` : '将删除该 SKU'}
        confirmText="删除"
        loading={deleteSkuLoading}
        onConfirm={doDeleteSku}
      />

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}

export default function ProductEditPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          加载中...
        </div>
      }
    >
      <ProductEditInner />
    </Suspense>
  );
}
