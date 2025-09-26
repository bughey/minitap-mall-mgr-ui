'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  PlayIcon,
  PauseIcon,
  CogIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { deviceRegisterApi } from '@/lib/api';
import type {
  Place,
  Group,
  DeviceRegisterBatch,
  DeviceRegisterLog,
  RegistrationStats,
  AdvancedSettings
} from '@/types/device-register';

// 状态图标组件
function getRegisterResultIcon(result: number) {
  switch (result) {
    case 1: // 成功
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    case 0: // 未开始
      return <ClockIcon className="w-5 h-5 text-yellow-500" />;
    case 2: // 失败
      return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
    default:
      return null;
  }
}

function getRegisterResultBadge(result: number) {
  switch (result) {
    case 1: // 成功
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          成功
        </span>
      );
    case 0: // 未开始
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          未开始
        </span>
      );
    case 2: // 失败
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          失败
        </span>
      );
    default:
      return null;
  }
}

function getBatchStatusBadge(status: number) {
  switch (status) {
    case 0: // 未开始
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          未开始
        </span>
      );
    case 1: // 进行中
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          进行中
        </span>
      );
    case 2: // 已结束
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          已结束
        </span>
      );
    case 3: // 已取消
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          已取消
        </span>
      );
    default:
      return null;
  }
}

export default function RegistrationPage() {
  // 基础状态
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // API数据状态
  const [places, setPlaces] = useState<Place[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentBatch, setCurrentBatch] = useState<DeviceRegisterBatch | null>(null);
  const [recentLogs, setRecentLogs] = useState<DeviceRegisterLog[]>([]);
  const [batches, setBatches] = useState<DeviceRegisterBatch[]>([]);
  const [selectedBatchLogs, setSelectedBatchLogs] = useState<DeviceRegisterLog[]>([]);
  
  // 表单状态
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [maxDevices, setMaxDevices] = useState('50');
  const [timeLimit, setTimeLimit] = useState('60');
  
  // 对话框状态
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showRegistrationLogs, setShowRegistrationLogs] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 高级设置状态
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    point_coin: 10,
    tail_play: false,
    coin_count: 6,
    coin_levels: [1, 5, 10, 20, 50, 100]
  });

  // 计算统计数据
  const stats: RegistrationStats = {
    waiting: recentLogs.filter(log => log.result === 0).length,
    success: recentLogs.filter(log => log.result === 1).length,
    failed: recentLogs.filter(log => log.result === 2).length
  };

  // 获取场地列表
  const fetchPlaces = useCallback(async () => {
    try {
      const response = await deviceRegisterApi.getPlaces();
      if (response.success && response.data) {
        setPlaces(response.data as Place[]);
      } else {
        setError(response.err_message || '获取场地列表失败');
      }
    } catch (err) {
      setError('获取场地列表失败');
      console.error('Error fetching places:', err);
    }
  }, []);

  // 获取分组列表
  const fetchGroups = useCallback(async (placeId: number) => {
    try {
      const response = await deviceRegisterApi.getGroups(placeId);
      if (response.success && response.data) {
        setGroups(response.data as Group[]);
      } else {
        setError(response.err_message || '获取分组列表失败');
      }
    } catch (err) {
      setError('获取分组列表失败');
      console.error('Error fetching groups:', err);
    }
  }, []);

  // 获取当前注册状态
  const fetchCurrentBatch = useCallback(async () => {
    try {
      const response = await deviceRegisterApi.getCurrent();
      if (response.success) {
        setCurrentBatch((response.data as DeviceRegisterBatch) || null);
      } else {
        setError(response.err_message || '获取注册状态失败');
      }
    } catch (err) {
      console.error('Error fetching current batch:', err);
    }
  }, []);

  // 获取最近日志
  const fetchRecentLogs = useCallback(async () => {
    try {
      const response = await deviceRegisterApi.getRecentLogs();
      if (response.success && response.data) {
        setRecentLogs(response.data as DeviceRegisterLog[]);
      } else {
        setError(response.err_message || '获取日志失败');
      }
    } catch (err) {
      console.error('Error fetching recent logs:', err);
    }
  }, []);

  // 获取注册批次列表
  const fetchBatches = useCallback(async (searchQuery?: string) => {
    try {
      const response = await deviceRegisterApi.getBatches({
        search: searchQuery,
        page: 1,
        page_size: 20
      });
      if (response.success && response.data) {
        setBatches(response.data as DeviceRegisterBatch[]);
      } else {
        setError(response.err_message || '获取批次列表失败');
      }
    } catch (err) {
      console.error('Error fetching batches:', err);
    }
  }, []);

  // 获取批次日志
  const fetchBatchLogs = useCallback(async (batchId: number) => {
    try {
      const response = await deviceRegisterApi.getBatchLogs(batchId);
      if (response.success && response.data) {
        setSelectedBatchLogs(response.data as DeviceRegisterLog[]);
      } else {
        setError(response.err_message || '获取批次日志失败');
      }
    } catch (err) {
      console.error('Error fetching batch logs:', err);
    }
  }, []);

  // 开始注册
  const handleStartRegistration = async () => {
    if (!selectedPlace || !selectedGroup) {
      setError('请先选择场地和分组');
      return;
    }

    try {
      const data = {
        place_id: selectedPlace.id,
        group_id: selectedGroup.id,
        total: parseInt(maxDevices),
        ...advancedSettings,
        tail_play: advancedSettings.tail_play ? 1 : 0
      };

      const response = await deviceRegisterApi.start(data);
      if (response.success) {
        await fetchCurrentBatch();
        await fetchRecentLogs();
        setError(null);
      } else {
        setError(response.err_message || '开始注册失败');
      }
    } catch (err) {
      setError('开始注册失败');
      console.error('Error starting registration:', err);
    }
  };

  // 停止注册
  const handleStopRegistration = async () => {
    try {
      const response = await deviceRegisterApi.stop();
      if (response.success) {
        await fetchCurrentBatch();
        await fetchRecentLogs();
        setError(null);
      } else {
        setError(response.err_message || '停止注册失败');
      }
    } catch (err) {
      setError('停止注册失败');
      console.error('Error stopping registration:', err);
    }
  };

  // 场地选择处理
  const handlePlaceSelect = async (place: Place) => {
    setSelectedPlace(place);
    setSelectedGroup(null);
    setGroups([]);
    await fetchGroups(place.id);
  };

  // 分组选择处理
  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
  };

  // 高级设置管理
  const loadSettingsFromBatch = (batch: DeviceRegisterBatch) => {
    setAdvancedSettings({
      point_coin: batch.point_coin,
      tail_play: batch.tail_play === 1,
      coin_count: batch.coin_count,
      coin_levels: [...batch.coin_levels]
    });
  };

  const resetAdvancedSettings = () => {
    setAdvancedSettings({
      point_coin: 10,
      tail_play: false,
      coin_count: 6,
      coin_levels: [1, 5, 10, 20, 50, 100]
    });
  };

  const addCoinLevel = () => {
    setAdvancedSettings(prev => ({
      ...prev,
      coin_levels: [...prev.coin_levels, 0]
    }));
  };

  const removeCoinLevel = (index: number) => {
    setAdvancedSettings(prev => ({
      ...prev,
      coin_levels: prev.coin_levels.filter((_, i) => i !== index)
    }));
  };

  const updateCoinLevel = (index: number, value: number) => {
    setAdvancedSettings(prev => ({
      ...prev,
      coin_levels: prev.coin_levels.map((level, i) => (i === index ? value : level))
    }));
  };

  // 初始数据加载
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPlaces(),
        fetchCurrentBatch(),
        fetchRecentLogs(),
        fetchBatches()
      ]);
      setLoading(false);
    };

    loadInitialData();
  }, [fetchPlaces, fetchCurrentBatch, fetchRecentLogs, fetchBatches]);

  // 定时刷新数据
  useEffect(() => {
    const interval = setInterval(async () => {
      // 如果有正在进行的注册，频繁刷新
      if (currentBatch?.status === 1) {
        await Promise.all([
          fetchCurrentBatch(),
          fetchRecentLogs()
        ]);
      }
    }, 5000); // 每5秒刷新一次

    return () => clearInterval(interval);
  }, [currentBatch?.status, fetchCurrentBatch, fetchRecentLogs]);

  // 批次选择处理
  const handleBatchSelect = async (batchId: number) => {
    setSelectedBatch(batchId);
    await fetchBatchLogs(batchId);
  };

  // 搜索处理
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    await fetchBatches(query);
  };

  // 过滤批次
  const filteredBatches = batches.filter(batch =>
    batch.place_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    batch.group_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationCircleIcon className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">设备注册</h1>
        <p className="text-gray-600 mt-1">批量注册新设备到指定场地和分组</p>
      </div>

      {/* 注册状态 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">注册状态</h2>
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                currentBatch?.status === 1 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
              }`}
            />
            <span className="text-sm text-gray-600">
              {currentBatch?.status === 1 ? '注册进行中' : '系统就绪'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <ClockIcon className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">等待注册</span>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{stats.waiting}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-700">注册成功</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.success}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-gray-700">注册失败</span>
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 注册配置 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">注册配置</h2>

          <div className="space-y-4">
            {/* 场地选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择场地</label>
              <div className="grid grid-cols-2 gap-2">
                {places.map((place) => (
                  <button
                    key={place.id}
                    onClick={() => handlePlaceSelect(place)}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      selectedPlace?.id === place.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">{place.name}</div>
                    <div className="text-xs text-gray-500">{place.device_count} 个设备</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 分组选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择分组</label>
              <div className="grid grid-cols-2 gap-2">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleGroupSelect(group)}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      selectedGroup?.id === group.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    disabled={!selectedPlace}
                  >
                    <div className="font-medium">{group.name}</div>
                    <div className="text-xs text-gray-500">{group.device_count} 个设备</div>
                  </button>
                ))}
              </div>
              {!selectedPlace && <p className="text-sm text-gray-500 mt-2">请先选择场地</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">时间限制(分钟)</label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">最大注册数</label>
                <input
                  type="number"
                  value={maxDevices}
                  onChange={(e) => setMaxDevices(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 控制按钮 */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={currentBatch?.status === 1 ? handleStopRegistration : handleStartRegistration}
                disabled={(!selectedPlace || !selectedGroup) && currentBatch?.status !== 1}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentBatch?.status === 1 ? (
                  <>
                    <PauseIcon className="w-4 h-4 mr-2" />
                    停止注册
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-4 h-4 mr-2" />
                    开始注册
                  </>
                )}
              </button>
              <button
                onClick={() => setShowAdvancedSettings(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <CogIcon className="w-4 h-4 mr-2" />
                高级设置
              </button>
            </div>
          </div>
        </div>

        {/* 注册日志 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">注册日志</h2>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                  {getRegisterResultIcon(log.result)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{log.device_no}</p>
                      <span className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {log.place_name} - {log.group_name}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">{log.result_msg}</p>
                      {getRegisterResultBadge(log.result)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">暂无注册日志</div>
            )}
          </div>

          <button
            onClick={() => setShowRegistrationLogs(true)}
            className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            查看完整日志
          </button>
        </div>
      </div>

      {/* 高级设置对话框 */}
      <Dialog open={showAdvancedSettings} onOpenChange={setShowAdvancedSettings}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>高级设置</DialogTitle>
            <DialogDescription>配置设备的高级参数，这些设置将应用于所有新注册的设备</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 快速加载设置 */}
            <div className="border-b pb-4">
              <Label className="text-sm font-medium">快速加载设置</Label>
              <p className="text-xs text-gray-500 mb-2">从现有注册批次加载配置</p>
              <div className="flex gap-2 flex-wrap mb-2">
                {batches.slice(0, 3).map((batch) => (
                  <Button
                    key={batch.id}
                    onClick={() => loadSettingsFromBatch(batch)}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    {batch.place_name} - {batch.group_name}
                  </Button>
                ))}
              </div>
              <Button
                onClick={resetAdvancedSettings}
                size="sm"
                variant="ghost"
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                重置为默认值
              </Button>
            </div>

            {/* 积分每币 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="point_coin" className="text-right">
                积分每币
              </Label>
              <Input
                id="point_coin"
                type="number"
                value={advancedSettings.point_coin}
                onChange={(e) =>
                  setAdvancedSettings((prev) => ({ ...prev, point_coin: parseInt(e.target.value) || 0 }))
                }
                className="col-span-3"
              />
            </div>

            {/* 尾数是否可玩 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tail_play" className="text-right">
                尾数可玩
              </Label>
              <div className="col-span-3 flex items-center">
                <Switch
                  id="tail_play"
                  checked={advancedSettings.tail_play}
                  onCheckedChange={(checked) => setAdvancedSettings((prev) => ({ ...prev, tail_play: checked }))}
                />
                <Label htmlFor="tail_play" className="ml-2 text-sm text-gray-500">
                  {advancedSettings.tail_play ? '是' : '否'}
                </Label>
              </div>
            </div>

            {/* 投币档位数 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="coin_count" className="text-right">
                投币档位数
              </Label>
              <Input
                id="coin_count"
                type="number"
                value={advancedSettings.coin_count}
                onChange={(e) =>
                  setAdvancedSettings((prev) => ({ ...prev, coin_count: parseInt(e.target.value) || 0 }))
                }
                className="col-span-3"
              />
            </div>

            {/* 档位设置 */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-2">档位设置</Label>
              <div className="col-span-3 space-y-2">
                {advancedSettings.coin_levels.map((level, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={level}
                      onChange={(e) => updateCoinLevel(index, parseInt(e.target.value) || 0)}
                      placeholder={`档位 ${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => removeCoinLevel(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button onClick={addCoinLevel} size="sm" variant="outline" className="w-full">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  添加档位
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdvancedSettings(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                setShowAdvancedSettings(false);
              }}
            >
              保存设置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 注册日志对话框 */}
      <Dialog open={showRegistrationLogs} onOpenChange={setShowRegistrationLogs}>
        <DialogContent className="max-w-[95vw] max-h-[85vh] p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>设备注册日志</DialogTitle>
            <DialogDescription>查看设备注册的详细日志信息</DialogDescription>
          </DialogHeader>
          <div className="flex h-[85vh]">
            {/* 左侧注册批次列表 */}
            <div className="w-1/3 border-r border-gray-200 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-3">注册批次列表</h3>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="搜索场地或分组..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredBatches.map((batch) => (
                    <div
                      key={batch.id}
                      onClick={() => handleBatchSelect(batch.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedBatch === batch.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{batch.place_name}</p>
                          <p className="text-xs text-gray-600">{batch.group_name}</p>
                        </div>
                        {getBatchStatusBadge(batch.status)}
                      </div>

                      <div className="space-y-1 text-xs text-gray-500">
                        <div className="flex justify-between">
                          <span>注册进度:</span>
                          <span className="font-medium text-green-600">
                            {batch.count}/{batch.total}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 my-1">
                          <div
                            className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${(batch.count / batch.total) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between">
                          <span>开始:</span>
                          <span>{new Date(batch.created_at).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex justify-between text-blue-600">
                          <span>积分/币:</span>
                          <span className="font-medium">{batch.point_coin}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 右侧设备注册记录 */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">设备注册记录</h3>
              </div>
              {selectedBatch ? (
                <div className="space-y-4">
                  {/* 批次信息摘要 */}
                  {(() => {
                    const batch = batches.find((b) => b.id === selectedBatch);
                    if (!batch) return null;

                    return (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="text-md font-medium mb-3">批次信息</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">场地分组:</span>
                            <p className="font-medium">
                              {batch.place_name} - {batch.group_name}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">注册进度:</span>
                            <p className="font-medium text-green-600">
                              {batch.count}/{batch.total}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">批次状态:</span>
                            <div className="mt-1">{getBatchStatusBadge(batch.status)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">开始时间:</span>
                            <p className="font-medium">{batch.created_at}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">结束时间:</span>
                            <p className="font-medium">{batch.end_time || '进行中'}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">积分每币:</span>
                            <p className="font-medium">{batch.point_coin}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">尾数可玩:</span>
                            <p className="font-medium">{batch.tail_play ? '是' : '否'}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">投币档位:</span>
                            <p className="font-medium">{batch.coin_count} 档</p>
                          </div>
                          <div>
                            <span className="text-gray-600">档位设置:</span>
                            <p className="font-medium">[{batch.coin_levels.join(', ')}]</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 设备列表 */}
                  <div className="space-y-2">
                    {selectedBatchLogs.length > 0 ? (
                      selectedBatchLogs.map((log) => (
                        <div key={log.id} className="bg-white border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              {getRegisterResultIcon(log.result)}
                              <div>
                                <p className="font-medium text-sm">{log.device_no}</p>
                                <p className="text-xs text-gray-600">{log.device_type_name}</p>
                              </div>
                            </div>
                            {getRegisterResultBadge(log.result)}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                            <div>
                              <span>场地:</span>
                              <span className="ml-1 font-medium">{log.place_name}</span>
                            </div>
                            <div>
                              <span>分组:</span>
                              <span className="ml-1 font-medium">{log.group_name}</span>
                            </div>
                            <div className="col-span-2">
                              <span>注册时间:</span>
                              <span className="ml-1 font-medium">{log.created_at}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-8">该批次暂无设备注册记录</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 mt-10">请从左侧列表中选择一个注册批次查看设备记录</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}