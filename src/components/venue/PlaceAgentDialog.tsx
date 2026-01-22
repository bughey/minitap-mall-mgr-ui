'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Search, UserCog } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { agentApi, placeApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { AgentListItem, AgentListResponse, PlaceAgentResponse } from '@/types/agent';

interface PlaceAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  place?: { id: number; name: string };
  onChanged?: () => void;
  successToast?: (title: string, description?: string) => void;
  errorToast?: (title: string, description?: string) => void;
}

export default function PlaceAgentDialog({
  open,
  onOpenChange,
  place,
  onChanged,
  successToast,
  errorToast,
}: PlaceAgentDialogProps) {
  const [current, setCurrent] = useState<PlaceAgentResponse | null>(null);
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [keyword, setKeyword] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);

  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unbinding, setUnbinding] = useState(false);
  const [showUnbindConfirm, setShowUnbindConfirm] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  const currentAgentLabel = useMemo(() => {
    if (!current?.agent_id) return '未绑定';
    if (current.agent) return current.agent.nickname || current.agent.username;
    return `已绑定（ID: ${current.agent_id}）`;
  }, [current]);

  const hasBinding = !!current?.agent_id;
  const isDirty = (current?.agent_id ?? null) !== selectedAgentId;
  const canSave = !!place?.id && !!selectedAgentId && isDirty && !saving && !unbinding;

  const loadCurrent = useCallback(async () => {
    if (!place?.id) return;
    setLoadingCurrent(true);
    setFormError(null);
    try {
      const res = await placeApi.getAgent(place.id);
      if (!res.success || !res.data) {
        throw new Error(res.err_message || '获取当前负责代理失败');
      }
      setCurrent(res.data as PlaceAgentResponse);
      setSelectedAgentId((res.data as PlaceAgentResponse).agent_id ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '获取当前负责代理失败';
      setFormError(msg);
      errorToast?.('加载失败', msg);
    } finally {
      setLoadingCurrent(false);
    }
  }, [errorToast, place?.id]);

  const loadAgents = useCallback(
    async (kw: string) => {
      setLoadingAgents(true);
      setFormError(null);
      try {
        const res = await agentApi.list({ keyword: kw, status: 1, limit: 50 });
        if (!res.success || !res.data) {
          throw new Error(res.err_message || '获取代理列表失败');
        }
        const data = res.data as AgentListResponse;
        setAgents(data.agents || []);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '获取代理列表失败';
        setFormError(msg);
        errorToast?.('加载失败', msg);
      } finally {
        setLoadingAgents(false);
      }
    },
    [errorToast],
  );

  useEffect(() => {
    if (!open) {
      setCurrent(null);
      setAgents([]);
      setKeyword('');
      setSelectedAgentId(null);
      setFormError(null);
      setShowUnbindConfirm(false);
      return;
    }

    if (!place?.id) return;
    loadCurrent();
    loadAgents('');
  }, [open, place?.id, loadAgents, loadCurrent]);

  useEffect(() => {
    if (!open || !place?.id) return;
    const timer = window.setTimeout(() => {
      loadAgents(keyword.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [keyword, open, place?.id, loadAgents]);

  const handleSave = async () => {
    if (!place?.id || !selectedAgentId) return;
    setSaving(true);
    setFormError(null);
    try {
      const res = await placeApi.setAgent(place.id, { agent_id: selectedAgentId });
      if (!res.success) {
        throw new Error(res.err_message || '保存失败');
      }
      await loadCurrent();
      onChanged?.();
      successToast?.('保存成功', '已更新场地负责代理');
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '保存失败';
      setFormError(msg);
      errorToast?.('保存失败', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleUnbind = async () => {
    if (!place?.id) return;
    setUnbinding(true);
    setFormError(null);
    try {
      const res = await placeApi.unsetAgent(place.id);
      if (!res.success) {
        throw new Error(res.err_message || '解绑失败');
      }
      setShowUnbindConfirm(false);
      await loadCurrent();
      onChanged?.();
      successToast?.('解绑成功', '已取消场地负责代理绑定');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '解绑失败';
      setFormError(msg);
      errorToast?.('解绑失败', msg);
    } finally {
      setUnbinding(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              <span>设置负责代理</span>
            </DialogTitle>
            <DialogDescription>
              为场地 <span className="font-medium text-foreground">{place?.name || '-'}</span> 绑定一个当前有效的代理账号
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="rounded-md bg-destructive/15 p-3">
              <p className="text-sm text-destructive">{formError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">当前负责代理</span>
                {loadingCurrent ? (
                  <Skeleton className="h-5 w-24" />
                ) : (
                  <Badge variant={hasBinding ? 'default' : 'outline'}>{currentAgentLabel}</Badge>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                {hasBinding ? '更换代理会保留历史绑定记录' : '未绑定时不会影响代理端统计范围'}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="agent-search">
                搜索代理
              </label>
              <div className="relative">
                <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="agent-search"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="输入 username / nickname / phone / email"
                  className="pl-9"
                  disabled={saving || unbinding}
                />
              </div>
            </div>

            <div className="rounded-lg border">
              <div className="max-h-[320px] overflow-auto">
                {loadingAgents ? (
                  <div className="space-y-2 p-3">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <Skeleton key={idx} className="h-12 w-full" />
                    ))}
                  </div>
                ) : agents.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    暂无可用代理
                  </div>
                ) : (
                  <div className="p-2">
                    {agents.map((a) => {
                      const selected = selectedAgentId === a.id;
                      const title = a.nickname || a.username;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setSelectedAgentId(a.id)}
                          className={cn(
                            'w-full rounded-md px-3 py-3 text-left transition-colors duration-200',
                            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                            'hover:bg-muted',
                            selected && 'bg-muted',
                          )}
                          aria-pressed={selected}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{title}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                账号: <span className="font-mono">{a.username}</span> · ID:{' '}
                                <span className="font-mono">{a.id}</span>
                              </div>
                            </div>
                            <div
                              className={cn(
                                'mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border',
                                selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30 text-transparent',
                              )}
                              aria-hidden="true"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowUnbindConfirm(true)}
                disabled={!hasBinding || saving || unbinding}
              >
                {unbinding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    解绑中...
                  </>
                ) : (
                  '解绑'
                )}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving || unbinding}>
                取消
              </Button>
              <Button type="button" onClick={handleSave} disabled={!canSave}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  '保存'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showUnbindConfirm}
        onOpenChange={setShowUnbindConfirm}
        title="取消负责代理绑定"
        description={`确认取消场地“${place?.name || ''}”的负责代理绑定吗？取消后代理端将不再统计该场地。`}
        confirmText="确认解绑"
        cancelText="取消"
        variant="destructive"
        loading={unbinding}
        onConfirm={handleUnbind}
      />
    </>
  );
}

