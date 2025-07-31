'use client';

import { useState } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  PlayIcon,
  PauseIcon,
  CogIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon
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

const venues = [
  { id: 1, name: '万达广场', groups: ['A区娃娃机', 'B区推币机', 'C区夹娃娃', 'D区弹珠机'] },
  { id: 2, name: '银泰城', groups: ['A区娃娃机', 'B区推币机', 'C区夹娃娃', 'D区弹珠机'] },
  { id: 3, name: '龙湖天街', groups: ['A区娃娃机', 'B区推币机', 'C区夹娃娃', 'D区弹珠机'] },
  { id: 4, name: '印象城', groups: ['A区娃娃机', 'B区推币机', 'C区夹娃娃', 'D区弹珠机'] }
];

const registrationLogs = [
  {
    id: 1,
    deviceId: 'DEV-2024-001',
    venue: '万达广场',
    group: 'A区娃娃机',
    status: 'success',
    time: '14:23:45',
    message: '设备注册成功'
  },
  {
    id: 2,
    deviceId: 'DEV-2024-002',
    venue: '万达广场',
    group: 'A区娃娃机',
    status: 'success',
    time: '14:23:12',
    message: '设备注册成功'
  },
  {
    id: 3,
    deviceId: 'DEV-2024-003',
    venue: '银泰城',
    group: 'B区推币机',
    status: 'pending',
    time: '14:22:58',
    message: '等待设备响应'
  },
  {
    id: 4,
    deviceId: 'DEV-2024-004',
    venue: '龙湖天街',
    group: 'C区夹娃娃',
    status: 'failed',
    time: '14:22:34',
    message: '连接超时'
  },
  {
    id: 5,
    deviceId: 'DEV-2024-005',
    venue: '印象城',
    group: 'D区弹珠机',
    status: 'success',
    time: '14:22:18',
    message: '设备注册成功'
  }
];

// 模拟 device_register 表数据 (设备注册批次)
const deviceRegisterBatches = [
  {
    id: 1,
    place_id: 1,
    group_id: 1,
    place_name: '万达广场',
    group_name: 'A区娃娃机',
    total: 10,
    count: 8, // 已注册成功数
    start_time: '2024-03-20 14:20:00',
    end_time: '2024-03-20 14:25:00',
    point_coin: 10, // 积分每币
    tail_play: 1, // 尾数可玩
    coin_count: 3, // 投币档位数
    coin_levels: [1, 5, 10], // 档位数组
    status: 2, // 2:已结束
    created_at: '2024-03-20 14:20:00'
  },
  {
    id: 2,
    place_id: 2,
    group_id: 2,
    place_name: '银泰城',
    group_name: 'B区推币机',
    total: 15,
    count: 12,
    start_time: '2024-03-20 13:30:00',
    end_time: '2024-03-20 13:40:00',
    point_coin: 20,
    tail_play: 0, // 尾数不可玩
    coin_count: 4,
    coin_levels: [1, 2, 5, 10],
    status: 2, // 2:已结束
    created_at: '2024-03-20 13:30:00'
  },
  {
    id: 3,
    place_id: 3,
    group_id: 3,
    place_name: '龙湖天街',
    group_name: 'C区夹娃娃',
    total: 8,
    count: 5,
    start_time: '2024-03-20 15:00:00',
    end_time: null, // 进行中
    point_coin: 15,
    tail_play: 1,
    coin_count: 2,
    coin_levels: [2, 8],
    status: 1, // 1:进行中
    created_at: '2024-03-20 15:00:00'
  },
  {
    id: 4,
    place_id: 4,
    group_id: 4,
    place_name: '印象城',
    group_name: 'D区弹珠机',
    total: 20,
    count: 20,
    start_time: '2024-03-20 10:00:00',
    end_time: '2024-03-20 10:15:00',
    point_coin: 25,
    tail_play: 0,
    coin_count: 5,
    coin_levels: [1, 3, 5, 10, 20],
    status: 2, // 2:已结束
    created_at: '2024-03-20 10:00:00'
  }
];

// 模拟 device_register_log 表数据 (具体设备注册记录)
const deviceRegisterLogs = [
  // 万达广场 A区娃娃机批次的设备
  {
    id: 1,
    device_register_id: 1,
    device_no: 'DEV-2024-001',
    place_name: '万达广场',
    group_name: 'A区娃娃机',
    device_type_name: '夹娃娃机',
    result: 1,
    created_at: '2024-03-20 14:21:15'
  },
  {
    id: 2,
    device_register_id: 1,
    device_no: 'DEV-2024-002',
    place_name: '万达广场',
    group_name: 'A区娃娃机',
    device_type_name: '夹娃娃机',
    result: 1,
    created_at: '2024-03-20 14:21:20'
  },
  {
    id: 3,
    device_register_id: 1,
    device_no: 'DEV-2024-003',
    place_name: '万达广场',
    group_name: 'A区娃娃机',
    device_type_name: '夹娃娃机',
    result: 2,
    created_at: '2024-03-20 14:21:25'
  },
  {
    id: 4,
    device_register_id: 1,
    device_no: 'DEV-2024-004',
    place_name: '万达广场',
    group_name: 'A区娃娃机',
    device_type_name: '夹娃娃机',
    result: 1,
    created_at: '2024-03-20 14:21:30'
  },
  {
    id: 5,
    device_register_id: 1,
    device_no: 'DEV-2024-005',
    place_name: '万达广场',
    group_name: 'A区娃娃机',
    device_type_name: '夹娃娃机',
    result: 1,
    created_at: '2024-03-20 14:21:35'
  },
  {
    id: 6,
    device_register_id: 1,
    device_no: 'DEV-2024-006',
    place_name: '万达广场',
    group_name: 'A区娃娃机',
    device_type_name: '夹娃娃机',
    result: 1,
    created_at: '2024-03-20 14:21:40'
  },
  {
    id: 7,
    device_register_id: 1,
    device_no: 'DEV-2024-007',
    place_name: '万达广场',
    group_name: 'A区娃娃机',
    device_type_name: '夹娃娃机',
    result: 1,
    created_at: '2024-03-20 14:21:45'
  },
  {
    id: 8,
    device_register_id: 1,
    device_no: 'DEV-2024-008',
    place_name: '万达广场',
    group_name: 'A区娃娃机',
    device_type_name: '夹娃娃机',
    result: 1,
    created_at: '2024-03-20 14:21:50'
  },
  {
    id: 9,
    device_register_id: 1,
    device_no: 'DEV-2024-009',
    place_name: '万达广场',
    group_name: 'A区娃娃机',
    device_type_name: '夹娃娃机',
    result: 2,
    created_at: '2024-03-20 14:21:55'
  },
  {
    id: 10,
    device_register_id: 1,
    device_no: 'DEV-2024-010',
    place_name: '万达广场',
    group_name: 'A区娃娃机',
    device_type_name: '夹娃娃机',
    result: 2,
    created_at: '2024-03-20 14:22:00'
  },

  // 银泰城 B区推币机批次的设备
  {
    id: 11,
    device_register_id: 2,
    device_no: 'DEV-2024-011',
    place_name: '银泰城',
    group_name: 'B区推币机',
    device_type_name: '推币机',
    result: 1,
    created_at: '2024-03-20 13:31:00'
  },
  {
    id: 12,
    device_register_id: 2,
    device_no: 'DEV-2024-012',
    place_name: '银泰城',
    group_name: 'B区推币机',
    device_type_name: '推币机',
    result: 1,
    created_at: '2024-03-20 13:31:05'
  },
  {
    id: 13,
    device_register_id: 2,
    device_no: 'DEV-2024-013',
    place_name: '银泰城',
    group_name: 'B区推币机',
    device_type_name: '推币机',
    result: 2,
    created_at: '2024-03-20 13:31:10'
  },

  // 龙湖天街 C区夹娃娃批次的设备 (进行中)
  {
    id: 14,
    device_register_id: 3,
    device_no: 'DEV-2024-014',
    place_name: '龙湖天街',
    group_name: 'C区夹娃娃',
    device_type_name: '夹娃娃机',
    result: 1,
    created_at: '2024-03-20 15:01:00'
  },
  {
    id: 15,
    device_register_id: 3,
    device_no: 'DEV-2024-015',
    place_name: '龙湖天街',
    group_name: 'C区夹娃娃',
    device_type_name: '夹娃娃机',
    result: 1,
    created_at: '2024-03-20 15:01:05'
  },
  {
    id: 16,
    device_register_id: 3,
    device_no: 'DEV-2024-016',
    place_name: '龙湖天街',
    group_name: 'C区夹娃娃',
    device_type_name: '夹娃娃机',
    result: 0,
    created_at: '2024-03-20 15:01:10'
  }
];

function getStatusIcon(status: string) {
  switch (status) {
    case 'success':
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    case 'pending':
      return <ClockIcon className="w-5 h-5 text-yellow-500" />;
    case 'failed':
      return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
    default:
      return null;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'success':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          成功
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          等待中
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          失败
        </span>
      );
    default:
      return null;
  }
}

function getLogLevelColor(level: string) {
  switch (level) {
    case 'info':
      return 'text-gray-600';
    case 'success':
      return 'text-green-600';
    case 'warning':
      return 'text-yellow-600';
    case 'error':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

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
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [registrationMode, setRegistrationMode] = useState('auto');
  const [timeLimit, setTimeLimit] = useState('60');
  const [maxDevices, setMaxDevices] = useState('50');

  // 对话框状态
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showRegistrationLogs, setShowRegistrationLogs] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 高级设置状态
  const [advancedSettings, setAdvancedSettings] = useState({
    point_coin: 0,
    tail_play: false,
    coin_count: 0,
    coin_levels: [] as number[]
  });

  // 从批次加载设置
  const loadSettingsFromBatch = (batchId: number) => {
    const batch = deviceRegisterBatches.find((b) => b.id === batchId);
    if (batch) {
      setAdvancedSettings({
        point_coin: batch.point_coin,
        tail_play: batch.tail_play === 1,
        coin_count: batch.coin_count,
        coin_levels: [...batch.coin_levels]
      });
    }
  };

  // 重置高级设置
  const resetAdvancedSettings = () => {
    setAdvancedSettings({
      point_coin: 0,
      tail_play: false,
      coin_count: 0,
      coin_levels: []
    });
  };

  const stats = {
    waiting: 12,
    success: 145,
    failed: 3
  };

  const handleStartRegistration = () => {
    if (!selectedVenue || !selectedGroup) {
      alert('请先选择场地和分组');
      return;
    }
    setIsRegistering(true);
    // 模拟注册过程
    setTimeout(() => {
      setIsRegistering(false);
    }, 5000);
  };

  const availableGroups = selectedVenue ? venues.find((v) => v.name === selectedVenue)?.groups || [] : [];

  // 档位管理函数
  const addCoinLevel = () => {
    setAdvancedSettings((prev) => ({
      ...prev,
      coin_levels: [...prev.coin_levels, 0]
    }));
  };

  const removeCoinLevel = (index: number) => {
    setAdvancedSettings((prev) => ({
      ...prev,
      coin_levels: prev.coin_levels.filter((_, i) => i !== index)
    }));
  };

  const updateCoinLevel = (index: number, value: number) => {
    setAdvancedSettings((prev) => ({
      ...prev,
      coin_levels: prev.coin_levels.map((level, i) => (i === index ? value : level))
    }));
  };

  // 过滤注册批次
  const filteredBatches = deviceRegisterBatches.filter(
    (batch) =>
      batch.place_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.group_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 获取选中批次的设备日志
  const selectedBatchLogs = selectedBatch
    ? deviceRegisterLogs.filter((log) => log.device_register_id === selectedBatch)
    : [];

  return (
    <div className="space-y-6">
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
              className={`w-3 h-3 rounded-full ${isRegistering ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <span className="text-sm text-gray-600">{isRegistering ? '注册进行中' : '系统就绪'}</span>
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
                {venues.map((venue) => (
                  <button
                    key={venue.id}
                    onClick={() => {
                      setSelectedVenue(venue.name);
                      setSelectedGroup('');
                    }}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      selectedVenue === venue.name
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                    <div className="font-medium">{venue.name}</div>
                    <div className="text-xs text-gray-500">{venue.groups.length} 个分组</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 分组选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择分组</label>
              <div className="grid grid-cols-2 gap-2">
                {availableGroups.map((group) => (
                  <button
                    key={group}
                    onClick={() => setSelectedGroup(group)}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      selectedGroup === group
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    disabled={!selectedVenue}>
                    <div className="font-medium">{group}</div>
                  </button>
                ))}
              </div>
              {!selectedVenue && <p className="text-sm text-gray-500 mt-2">请先选择场地</p>}
            </div>

            {/* 注册设置 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">注册模式</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="auto"
                    checked={registrationMode === 'auto'}
                    onChange={(e) => setRegistrationMode(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">自动注册</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="manual"
                    checked={registrationMode === 'manual'}
                    onChange={(e) => setRegistrationMode(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">手动确认</span>
                </label>
              </div>
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
                onClick={handleStartRegistration}
                disabled={isRegistering || !selectedVenue || !selectedGroup}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {isRegistering ? (
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
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
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
            {registrationLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                {getStatusIcon(log.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{log.deviceId}</p>
                    <span className="text-xs text-gray-500">{log.time}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {log.venue} - {log.group}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">{log.message}</p>
                    {getStatusBadge(log.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowRegistrationLogs(true)}
            className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium">
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
                {deviceRegisterBatches.map((batch) => (
                  <Button
                    key={batch.id}
                    onClick={() => loadSettingsFromBatch(batch.id)}
                    size="sm"
                    variant="outline"
                    className="text-xs">
                    {batch.place_name} - {batch.group_name}
                  </Button>
                ))}
              </div>
              <Button
                onClick={resetAdvancedSettings}
                size="sm"
                variant="ghost"
                className="text-xs text-gray-500 hover:text-gray-700">
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
                      className="text-red-600 hover:text-red-700">
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
                // 这里可以添加保存逻辑
                console.log('保存高级设置:', advancedSettings);
                setShowAdvancedSettings(false);
              }}>
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
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredBatches.map((batch) => (
                    <div
                      key={batch.id}
                      onClick={() => setSelectedBatch(batch.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedBatch === batch.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
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
                            style={{ width: `${(batch.count / batch.total) * 100}%` }}></div>
                        </div>
                        <div className="flex justify-between">
                          <span>开始:</span>
                          <span>{batch.start_time.split(' ')[1]}</span>
                        </div>
                        {/* {batch.end_time && (
                          <div className="flex justify-between">
                            <span>结束:</span>
                            <span>{batch.end_time.split(' ')[1]}</span>
                          </div>
                        )} */}
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
                {selectedBatch && (
                  <Button
                    onClick={() => {
                      // 导出功能，这里可以实现CSV导出等
                      console.log('导出批次日志:', selectedBatch);
                    }}
                    size="sm"
                    variant="outline"
                    className="text-xs">
                    <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                    导出记录
                  </Button>
                )}
              </div>
              {selectedBatch ? (
                <div className="space-y-4">
                  {/* 批次信息摘要 */}
                  {(() => {
                    const batch = deviceRegisterBatches.find((b) => b.id === selectedBatch);
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
                            <p className="font-medium">{batch.start_time}</p>
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
