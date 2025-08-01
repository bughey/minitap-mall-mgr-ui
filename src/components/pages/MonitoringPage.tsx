'use client';

import { useState, useEffect } from 'react';
import {
  CurrencyDollarIcon,
  ComputerDesktopIcon,
  PlayIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  StopIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// 模拟实时数据
const initialStats = {
  realTimeRevenue: 12580,
  activeDevices: 142,
  gameCount: 1847,
  gameRefund: 23
};

const venueData = [
  {
    name: '万达广场',
    activeDevices: 38,
    gameCount: 524,
    revenue: 3245,
    refundCount: 18,
    status: 'normal'
  },
  {
    name: '银泰城',
    activeDevices: 32,
    gameCount: 445,
    revenue: 2890,
    refundCount: 25,
    status: 'normal'
  },
  {
    name: '龙湖天街',
    activeDevices: 35,
    gameCount: 478,
    revenue: 3156,
    refundCount: 21,
    status: 'normal'
  },
  {
    name: '印象城',
    activeDevices: 25,
    gameCount: 298,
    revenue: 2234,
    refundCount: 34,
    status: 'warning'
  }
];

const initialAlerts = [
  { id: 1, message: '万达广场 A区娃娃机-001 连接超时', time: '刚刚', type: 'error', venue: '万达广场' },
  { id: 2, message: '银泰城 B区推币机-005 电量低于20%', time: '1分钟前', type: 'warning', venue: '银泰城' },
  { id: 3, message: '龙湖天街系统延迟异常', time: '2分钟前', type: 'warning', venue: '龙湖天街' },
  { id: 4, message: '印象城 D区弹珠机-008 固件更新成功', time: '3分钟前', type: 'success', venue: '印象城' },
  { id: 5, message: '万达广场收益达到日目标', time: '5分钟前', type: 'info', venue: '万达广场' }
];

function getAlertIcon(type: string) {
  switch (type) {
    case 'error':
      return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
    case 'warning':
      return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
    case 'success':
      return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
    case 'info':
      return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
    default:
      return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'normal':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          正常
        </span>
      );
    case 'warning':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          告警
        </span>
      );
    case 'error':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          异常
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          未知
        </span>
      );
  }
}

export default function MonitoringPage() {
  const [stats, setStats] = useState(initialStats);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [mounted, setMounted] = useState(false);

  // 从后端获取实时统计数据
  const fetchMonitoringStats = async () => {
    try {
      // TODO: 替换为实际的API调用
      // const response = await fetch('/api/monitoring/stats');
      // const data = await response.json();
      // setStats(data);

      // 临时模拟数据更新
      setStats((prev) => ({
        realTimeRevenue: prev.realTimeRevenue + Math.floor(Math.random() * 50) + 10,
        activeDevices: prev.activeDevices + (Math.random() > 0.5 ? 1 : -1),
        gameCount: prev.gameCount + Math.floor(Math.random() * 10) + 5,
        gameRefund: Math.floor(Math.random() * 20) + 15
      }));
    } catch (error) {
      console.error('获取监控统计数据失败:', error);
    }
  };

  // 从后端获取场地状态数据
  const fetchVenueStatus = async () => {
    try {
      // TODO: 替换为实际的API调用
      // const response = await fetch('/api/monitoring/venues');
      // const venueData = await response.json();
      // 更新场地数据状态
    } catch (error) {
      console.error('获取场地状态数据失败:', error);
    }
  };

  // 从后端获取告警数据
  const fetchAlerts = async () => {
    try {
      // TODO: 替换为实际的API调用
      // const response = await fetch('/api/monitoring/alerts');
      // const alertsData = await response.json();
      // setAlerts(alertsData);

      // 临时模拟告警更新
      if (Math.random() > 0.8) {
        const newAlert = {
          id: Date.now(),
          message: '新的设备告警信息',
          time: '刚刚',
          type: ['error', 'warning', 'success', 'info'][Math.floor(Math.random() * 4)],
          venue: ['万达广场', '银泰城', '龙湖天街', '印象城'][Math.floor(Math.random() * 4)]
        };
        setAlerts((prev) => [newAlert, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      console.error('获取告警数据失败:', error);
    }
  };

  // 综合获取所有监控数据
  const fetchMonitoringData = async () => {
    await Promise.all([fetchMonitoringStats(), fetchVenueStatus(), fetchAlerts()]);
    setLastUpdate(new Date());
  };

  // 确保组件只在客户端渲染
  useEffect(() => {
    setMounted(true);
    setLastUpdate(new Date());
  }, []);

  // 定时获取监控数据
  useEffect(() => {
    if (!autoRefresh || !mounted) return;

    // 立即获取一次数据
    fetchMonitoringData();

    const interval = setInterval(fetchMonitoringData, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, mounted]);

  // 防止水合错误，在客户端渲染之前显示加载状态
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">实时监控</h1>
            <p className="text-gray-600 mt-1">监控所有设备和场地的实时状态</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="animate-pulse">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-20 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和控制 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">实时监控</h1>
          <p className="text-gray-600 mt-1">监控所有设备和场地的实时状态</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <div className="flex items-center text-sm text-gray-500">
            <ClockIcon className="w-4 h-4 mr-1" />
            最后更新: {lastUpdate ? lastUpdate.toLocaleTimeString() : '--'}
          </div>
          {/* <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium ${
              autoRefresh 
                ? 'text-green-700 bg-green-50 border-green-300' 
                : 'text-gray-700 bg-white'
            }`}
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? '自动刷新' : '手动刷新'}
          </button>
          <button 
            onClick={() => fetchMonitoringData()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            立即刷新
          </button> */}
        </div>
      </div>

      {/* 实时统计面板 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <CurrencyDollarIcon className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">实时收益</h3>
              <p className="text-2xl font-bold text-gray-900">¥{stats.realTimeRevenue.toLocaleString()}</p>
              <p className="text-xs text-green-600">+¥245 (最近5分钟)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <ComputerDesktopIcon className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">活跃设备</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.activeDevices}</p>
              <p className="text-xs text-gray-500">总计158台</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <PlayIcon className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">游戏次数</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.gameCount.toLocaleString()}</p>
              <p className="text-xs text-blue-600">+23 (最近5分钟)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
              <ArrowPathIcon className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">游戏退分</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.gameRefund}</p>
              <p className="text-xs text-gray-500">今日退分数</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 场地状态监控 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">场地状态监控</h2>
          <div className="space-y-4">
            {venueData.map((venue) => (
              <div key={venue.name} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{venue.name}</h3>
                  {getStatusBadge(venue.status)}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">活跃设备:</span>
                    <span className="ml-2 font-medium">{venue.activeDevices}台</span>
                  </div>
                  <div>
                    <span className="text-gray-500">游戏数:</span>
                    <span className="ml-2 font-medium">{venue.gameCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">收益:</span>
                    <span className="ml-2 font-medium">¥{venue.revenue}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">退分数:</span>
                    <span className={`ml-2 font-medium ${venue.refundCount > 30 ? 'text-red-600' : 'text-green-600'}`}>
                      {venue.refundCount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 实时警报流 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">实时警报</h2>
            <div className="flex items-center text-sm text-gray-500">
              <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
              {alerts.filter((alert) => alert.type === 'error').length} 错误,{' '}
              {alerts.filter((alert) => alert.type === 'warning').length} 警告
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                {getAlertIcon(alert.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{alert.message}</p>
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <span>{alert.venue}</span>
                    <span className="mx-1">•</span>
                    <span>{alert.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium">
            查看全部警报历史
          </button>
        </div>
      </div>
    </div>
  );
}
