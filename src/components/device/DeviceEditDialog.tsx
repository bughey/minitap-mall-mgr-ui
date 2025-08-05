'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Edit, Loader2, Plus, X } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { deviceApi } from '@/lib/api';
import {
  Device,
  DeviceDetail,
  DeviceUpdateData,
  DeviceStatus,
} from '@/types/device';

// 表单验证模式
const deviceEditSchema = z.object({
  name: z
    .string()
    .min(2, { message: '设备名称至少需要2个字符' })
    .max(50, { message: '设备名称不能超过50个字符' })
    .trim(),
  device_type: z
    .number({ message: '请选择设备类型' })
    .min(1, { message: '请选择有效的设备类型' }),
  status: z
    .nativeEnum(DeviceStatus, { message: '请选择设备状态' }),
  point_coin: z
    .number()
    .min(1, { message: '积分每币必须大于0' })
    .max(1000, { message: '积分每币不能超过1000' })
    .optional(),
  tail_play: z
    .number()
    .min(0)
    .max(1)
    .optional(),
  coin_count: z
    .number()
    .min(1, { message: '档位数至少为1' })
    .max(10, { message: '档位数不能超过10' })
    .optional(),
  coin_levels: z
    .array(z.number().min(1, { message: '档位值必须大于0' }))
    .optional(),
});

type DeviceEditFormValues = z.infer<typeof deviceEditSchema>;

interface DeviceEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device?: Device | DeviceDetail;
  onSuccess?: () => void;
}

// 设备类型选项（实际项目中应该从API获取）
const deviceTypeOptions = [
  { id: 1, name: '娃娃机' },
  { id: 2, name: '推币机' },
  { id: 3, name: '弹珠机' },
];

export default function DeviceEditDialog({
  open,
  onOpenChange,
  device,
  onSuccess
}: DeviceEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [coinLevelInput, setCoinLevelInput] = useState('');

  const form = useForm<DeviceEditFormValues>({
    resolver: zodResolver(deviceEditSchema),
    defaultValues: {
      name: '',
      device_type: undefined,
      status: DeviceStatus.NORMAL,
      point_coin: 10,
      tail_play: 0,
      coin_count: 1,
      coin_levels: [1],
    },
  });

  const { handleSubmit, reset, watch, setValue, formState } = form;
  const { isSubmitting, errors } = formState;
  const watchedCoinLevels = watch('coin_levels') || [];

  // 当对话框打开或设备信息变化时重置表单
  useEffect(() => {
    if (open && device) {
      const deviceDetail = device as DeviceDetail;
      reset({
        name: device.name,
        device_type: device.device_type,
        status: device.status,
        point_coin: deviceDetail.point_coin || 10,
        tail_play: deviceDetail.tail_play || 0,
        coin_count: deviceDetail.coin_count || 1,
        coin_levels: deviceDetail.coin_levels || [1],
      });
    } else if (open && !device) {
      reset({
        name: '',
        device_type: undefined,
        status: DeviceStatus.NORMAL,
        point_coin: 10,
        tail_play: 0,
        coin_count: 1,
        coin_levels: [1],
      });
    }
  }, [open, device, reset]);

  const onSubmit = async (values: DeviceEditFormValues) => {
    if (!device?.id) return;

    try {
      setLoading(true);

      const updateData: DeviceUpdateData = {
        name: values.name,
        device_type: values.device_type,
        status: values.status,
        point_coin: values.point_coin,
        tail_play: values.tail_play,
        coin_count: values.coin_count,
        coin_levels: values.coin_levels,
      };

      const response = await deviceApi.update(device.id, updateData);

      if (!response.success) {
        throw new Error(response.err_message || '更新设备失败');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error('Device update error:', err);
      form.setError('root', {
        message: err instanceof Error ? err.message : '更新设备失败',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  // 添加档位
  const addCoinLevel = () => {
    const level = parseInt(coinLevelInput);
    if (level > 0 && !watchedCoinLevels.includes(level)) {
      const newLevels = [...watchedCoinLevels, level].sort((a, b) => a - b);
      setValue('coin_levels', newLevels);
      setValue('coin_count', newLevels.length);
      setCoinLevelInput('');
    }
  };

  // 删除档位
  const removeCoinLevel = (index: number) => {
    const newLevels = watchedCoinLevels.filter((_, i) => i !== index);
    setValue('coin_levels', newLevels);
    setValue('coin_count', newLevels.length);
  };

  // 处理回车键添加档位
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCoinLevel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="w-5 h-5" />
            <span>编辑设备</span>
          </DialogTitle>
          <DialogDescription>
            修改设备信息和配置参数
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

            {/* 基本信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">基本信息</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>设备名称</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="请输入设备名称"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="device_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>设备类型</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择设备类型" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {deviceTypeOptions.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>设备状态</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择设备状态" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={DeviceStatus.NORMAL.toString()}>正常</SelectItem>
                          <SelectItem value={DeviceStatus.MAINTENANCE.toString()}>维护</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="point_coin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>积分每币</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="1000"
                          placeholder="请输入积分每币"
                          disabled={isSubmitting}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        每投入1币可获得的积分数量
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 游戏配置 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">游戏配置</h3>
              
              <FormField
                control={form.control}
                name="tail_play"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>尾数可玩</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择是否允许尾数游玩" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">否</SelectItem>
                        <SelectItem value="1">是</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      是否允许玩家使用剩余的少量积分继续游戏
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 档位配置 */}
              <div className="space-y-3">
                <FormLabel>投币档位配置</FormLabel>
                
                {/* 当前档位显示 */}
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    当前档位数：{watchedCoinLevels.length}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {watchedCoinLevels.map((level, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {level} 币
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeCoinLevel(index)}
                          disabled={isSubmitting || watchedCoinLevels.length <= 1}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 添加新档位 */}
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="输入档位值"
                    value={coinLevelInput}
                    onChange={(e) => setCoinLevelInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isSubmitting}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCoinLevel}
                    disabled={isSubmitting || !coinLevelInput || parseInt(coinLevelInput) <= 0}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  设置不同的投币档位，玩家可以选择投入不同数量的币进行游戏
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting || loading}>
                {isSubmitting || loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    更新中...
                  </>
                ) : (
                  '更新'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}