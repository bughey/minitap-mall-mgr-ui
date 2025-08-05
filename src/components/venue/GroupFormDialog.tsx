'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Users, Loader2 } from 'lucide-react';
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { groupApi } from '@/lib/api';
import { Group, GroupFormData, GroupUpdateData } from '@/types/venue';

// 表单验证模式
const groupFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: '分组名称至少需要2个字符' })
    .max(30, { message: '分组名称不能超过30个字符' })
    .trim(),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;

interface GroupFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeId: number;          // 所属场地ID
  group?: Group;            // 如果有group则为编辑模式，否则为添加模式
  onSuccess?: () => void;   // 成功回调，用于刷新数据
}

export default function GroupFormDialog({
  open,
  onOpenChange,
  placeId,
  group,
  onSuccess
}: GroupFormDialogProps) {
  const isEdit = !!group;

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: '',
    },
  });

  const { handleSubmit, reset, formState } = form;
  const { isSubmitting, errors } = formState;

  // 当对话框打开或group变化时重置表单
  useEffect(() => {
    if (open) {
      if (group) {
        reset({
          name: group.name,
        });
      } else {
        reset({
          name: '',
        });
      }
    }
  }, [open, group, reset]);

  const onSubmit = async (values: GroupFormValues) => {
    try {
      if (isEdit && group) {
        // 编辑模式
        const updateData: GroupUpdateData = {
          name: values.name,
        };
        
        const response = await groupApi.update(group.id, updateData);
        
        if (!response.success) {
          throw new Error(response.err_message || '更新分组失败');
        }
      } else {
        // 添加模式
        const createData: GroupFormData = {
          place_id: placeId,
          name: values.name,
        };
        
        const response = await groupApi.create(createData);
        
        if (!response.success) {
          throw new Error(response.err_message || '创建分组失败');
        }
      }

      // 成功后关闭对话框并触发刷新
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error('Group form submit error:', err);
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
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>{isEdit ? '编辑分组' : '添加分组'}</span>
          </DialogTitle>
          <DialogDescription>
            {isEdit ? '修改设备分组信息' : '为场地创建新的设备分组'}
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
                  <FormLabel>分组名称</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="请输入分组名称"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    设备分组的显示名称，用于组织场地内的设备
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