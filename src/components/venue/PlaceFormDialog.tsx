'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Building, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { placeApi } from '@/lib/api';
import { Place, PlaceFormData, PlaceUpdateData } from '@/types/venue';

// 表单验证模式
const placeFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: '场地名称至少需要2个字符' })
    .max(50, { message: '场地名称不能超过50个字符' })
    .trim(),
  address: z
    .string()
    .min(5, { message: '场地地址至少需要5个字符' })
    .max(200, { message: '场地地址不能超过200个字符' })
    .trim(),
  remark: z
    .string()
    .max(500, { message: '备注信息不能超过500个字符' })
    .transform(val => val?.trim() || '')
    .optional(),
});

type PlaceFormValues = z.infer<typeof placeFormSchema>;

interface PlaceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  place?: Place; // 如果有place则为编辑模式，否则为添加模式
  onSuccess?: () => void; // 成功回调，用于刷新数据
}

export default function PlaceFormDialog({
  open,
  onOpenChange,
  place,
  onSuccess
}: PlaceFormDialogProps) {
  const isEdit = !!place;

  const form = useForm<PlaceFormValues>({
    resolver: zodResolver(placeFormSchema),
    defaultValues: {
      name: '',
      address: '',
      remark: '',
    },
  });

  const { handleSubmit, reset, formState } = form;
  const { isSubmitting, errors } = formState;

  // 当对话框打开或place变化时重置表单
  useEffect(() => {
    if (open) {
      if (place) {
        reset({
          name: place.name,
          address: place.address,
          remark: place.remark || '',
        });
      } else {
        reset({
          name: '',
          address: '',
          remark: '',
        });
      }
    }
  }, [open, place, reset]);

  const onSubmit = async (values: PlaceFormValues) => {
    try {
      if (isEdit && place) {
        // 编辑模式
        const updateData: PlaceUpdateData = {
          name: values.name,
          address: values.address,
          remark: values.remark,
        };
        
        const response = await placeApi.update(place.id, updateData);
        
        if (!response.success) {
          throw new Error(response.err_message || '更新场地失败');
        }
      } else {
        // 添加模式
        const createData: PlaceFormData = {
          name: values.name,
          address: values.address,
          remark: values.remark,
        };
        
        const response = await placeApi.create(createData);
        
        if (!response.success) {
          throw new Error(response.err_message || '创建场地失败');
        }
      }

      // 成功后关闭对话框并触发刷新
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error('Place form submit error:', err);
      // 设置表单级别错误
      form.setError('root', {
        message: err instanceof Error ? err.message : '操作失败',
      });
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>{isEdit ? '编辑场地' : '添加场地'}</span>
          </DialogTitle>
          <DialogDescription>
            {isEdit ? '修改场地信息' : '创建新的运营场地'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* 根级错误提示 */}
            {errors.root && (
              <div className="rounded-md bg-destructive/15 p-3">
                <p className="text-sm text-destructive">{errors.root.message}</p>
              </div>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>场地名称</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="请输入场地名称"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    场地的显示名称，将在系统中展示
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>场地地址</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="请输入场地详细地址"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    场地的具体位置信息
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remark"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>备注信息</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请输入备注信息（可选）"
                      rows={3}
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    可选的补充说明信息
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEdit ? '更新中...' : '创建中...'}
                  </>
                ) : (
                  isEdit ? '更新' : '创建'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}