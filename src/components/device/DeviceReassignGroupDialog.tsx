'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { groupApi, placeApi } from '@/lib/api';
import { Group, GroupListResponse, PlacePageItem, PlacePageResponse } from '@/types/venue';

export interface ReassignGroupTarget {
  target_place_id: number;
  target_place_name?: string;
  target_group_id: number;
  target_group_name?: string;
}

interface DeviceReassignGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (target: ReassignGroupTarget) => Promise<void>;
}

export default function DeviceReassignGroupDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
}: DeviceReassignGroupDialogProps) {
  const [placesLoading, setPlacesLoading] = useState(false);
  const [places, setPlaces] = useState<PlacePageItem[]>([]);
  const [placeId, setPlaceId] = useState<string>('');

  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState<string>('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const selectedPlace = useMemo(() => {
    const id = Number(placeId);
    if (!id) return undefined;
    return places.find((p) => p.id === id);
  }, [placeId, places]);

  const selectedGroup = useMemo(() => {
    const id = Number(groupId);
    if (!id) return undefined;
    return groups.find((g) => g.id === id);
  }, [groupId, groups]);

  useEffect(() => {
    if (!open) return;

    setPlaceId('');
    setGroupId('');
    setGroups([]);
    setConfirmOpen(false);
    setConfirmLoading(false);

    const fetchPlaces = async () => {
      setPlacesLoading(true);
      try {
        const resp = await placeApi.page({ page: 1, page_size: 100 });
        if (resp.success && resp.data) {
          const data = resp.data as PlacePageResponse;
          setPlaces(data.data || []);
        } else {
          setPlaces([]);
        }
      } catch (err) {
        console.error('fetch places failed:', err);
        setPlaces([]);
      } finally {
        setPlacesLoading(false);
      }
    };

    fetchPlaces();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = Number(placeId);
    if (!id) {
      setGroups([]);
      setGroupId('');
      return;
    }

    const fetchGroups = async () => {
      setGroupsLoading(true);
      try {
        const resp = await groupApi.getList(id);
        if (resp.success && resp.data) {
          const data = resp.data as GroupListResponse;
          setGroups(data.groups || []);
        } else {
          setGroups([]);
        }
      } catch (err) {
        console.error('fetch groups failed:', err);
        setGroups([]);
      } finally {
        setGroupsLoading(false);
      }
    };

    setGroupId('');
    fetchGroups();
  }, [open, placeId]);

  const canSubmit = selectedCount > 0 && Number(placeId) > 0 && Number(groupId) > 0;

  const confirmDescription = useMemo(() => {
    const placeName = selectedPlace?.name ?? `场地ID ${placeId}`;
    const groupName = selectedGroup?.name ?? `分组ID ${groupId}`;
    return `将 ${selectedCount} 台设备迁移到「${placeName} / ${groupName}」。该操作可能跨场地调整设备归属与统计，请确认继续。`;
  }, [selectedCount, selectedPlace?.name, selectedGroup?.name, placeId, groupId]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (confirmLoading || confirmOpen) return;
    onOpenChange(nextOpen);
  };

  const handleConfirm = async () => {
    if (!canSubmit || !selectedPlace || !selectedGroup) return;

    setConfirmLoading(true);
    try {
      await onConfirm({
        target_place_id: selectedPlace.id,
        target_place_name: selectedPlace.name,
        target_group_id: selectedGroup.id,
        target_group_name: selectedGroup.name,
      });
      setConfirmOpen(false);
      onOpenChange(false);
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>批量重新分组</DialogTitle>
            <DialogDescription>为已选设备选择目标场地与目标分组。</DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              此操作支持跨场地迁移。请确认目标场地与目标分组正确，避免误操作影响运营统计。
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">目标场地</div>
              <Select value={placeId} onValueChange={setPlaceId} disabled={placesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={placesLoading ? '加载中...' : '请选择场地'} />
                </SelectTrigger>
                <SelectContent>
                  {places.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">目标分组</div>
              <Select
                value={groupId}
                onValueChange={setGroupId}
                disabled={!placeId || groupsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={groupsLoading ? '加载中...' : '请选择分组'} />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.name}（{g.device_count} 台）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={confirmLoading}>
                取消
              </Button>
              <Button onClick={() => setConfirmOpen(true)} disabled={!canSubmit || confirmLoading}>
                确认迁移
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="确认批量迁移"
        description={confirmDescription}
        confirmText="确认迁移"
        cancelText="再检查一下"
        variant="default"
        loading={confirmLoading}
        onConfirm={handleConfirm}
      />
    </>
  );
}
