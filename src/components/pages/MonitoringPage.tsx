'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CurrencyDollarIcon,
  ComputerDesktopIcon,
  PlayIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { monitoringApi } from '@/lib/api';
import { MonitoringStats, VenueStatus, MonitoringAlert } from '@/types/monitoring';
import { formatRevenue } from '@/types/device';

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
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [venues, setVenues] = useState<VenueStatus[]>([]);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 综合获取所有监控数据
  const fetchMonitoringData = useCallback(async () => {
    setLoading(true);
    try {
      // 并行获取所有数据
      const [statsResponse, venuesResponse, alertsResponse] = await Promise.all([
        monitoringApi.getStats(),
        monitoringApi.getVenues(),
        monitoringApi.getAlerts()
      ]);

      // 处理统计数据响应
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data as MonitoringStats);
      } else {
        console.error('获取监控统计数据失败:', statsResponse.err_message);
        setError(statsResponse.err_message || '获取监控统计数据失败');
      }

      // 处理场地数据响应
      if (venuesResponse.success && venuesResponse.data) {
        setVenues(venuesResponse.data as VenueStatus[]);
      } else {
        console.error('获取场地状态数据失败:', venuesResponse.err_message);
        setError(venuesResponse.err_message || '获取场地状态数据失败');
      }

      // 处理告警数据响应
      if (alertsResponse.success && alertsResponse.data) {
        const alertsData = alertsResponse.data as MonitoringAlert[];
        setAlerts(Array.isArray(alertsData) ? alertsData : []);
      } else {
        console.error('获取告警数据失败:', alertsResponse.err_message);
        setAlerts([]); // 确保失败时也设置为空数组
        setError(alertsResponse.err_message || '获取告警数据失败');
      }

      // 如果所有请求都成功，清除错误状态
      if (statsResponse.success && venuesResponse.success && alertsResponse.success) {
        setError(null);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('获取监控数据失败:', error);
      setError('网络错误，无法获取监控数据');
      // 确保异常时也设置默认值
      setAlerts([]);
      setVenues([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 手动刷新数据
  const handleRefresh = async () => {
    await fetchMonitoringData();
  };

  // 确保组件只在客户端渲染
  useEffect(() => {
    setMounted(true);
    setLastUpdate(new Date());
  }, []);

  // 定时获取监控数据
  useEffect(() => {
    if (!mounted) return;

    // 立即获取一次数据
    fetchMonitoringData();

    // 如果开启自动刷新，设置定时器
    if (autoRefresh) {
      const interval = setInterval(fetchMonitoringData, 10000); // 10秒刷新一次
      return () => clearInterval(interval);
    }
  }, [autoRefresh, mounted, fetchMonitoringData]);

  // 加载状态组件
  const LoadingSkeleton = () => (
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

  // 防止水合错误，在客户端渲染之前显示加载状态
  if (!mounted || loading) {
    return <LoadingSkeleton />;
  }

  // 错误状态
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">实时监控</h1>
            <p className="text-gray-600 mt-1">监控所有设备和场地的实时状态</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                数据加载失败
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  onClick={handleRefresh}
                >
                  重试
                </button>
              </div>
            </div>
          </div>
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
          <button
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
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            立即刷新
          </button>
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
              <p className="text-2xl font-bold text-gray-900">
                {typeof stats?.realTimeRevenue === 'number' ? formatRevenue(stats.realTimeRevenue) : '--'}
              </p>
              <p className="text-xs text-green-600">
                {typeof stats?.recentRevenueChange === 'number'
                  ? `+${formatRevenue(stats.recentRevenueChange)} (最近1小时)`
                  : '暂无数据'}
              </p>
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
              <p className="text-2xl font-bold text-gray-900">
                {stats?.activeDevices ?? '--'}
              </p>
              <p className="text-xs text-gray-500">
                总计{stats?.totalDevices ?? '--'}台
              </p>
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
              <p className="text-2xl font-bold text-gray-900">
                {stats?.gameCount ? stats.gameCount.toLocaleString() : '--'}
              </p>
              <p className="text-xs text-blue-600">
                {stats?.recentGameChange ? `+${stats.recentGameChange} (最近1小时)` : '暂无数据'}
              </p>
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
              <p className="text-2xl font-bold text-gray-900">
                {stats?.gameRefund ?? '--'}
              </p>
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
            {venues.length > 0 ? (
              venues.map((venue) => (
                <div key={venue.id} className="border border-gray-200 rounded-lg p-4">
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
                      <span className="ml-2 font-medium">{formatRevenue(venue.revenue)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">退分数:</span>
                      <span className={`ml-2 font-medium ${venue.refundCount > 30 ? 'text-red-600' : 'text-green-600'}`}>
                        {venue.refundCount}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    更新时间: {new Date(venue.lastUpdateTime).toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">暂无场地数据</p>
              </div>
            )}
          </div>
        </div>

        {/* 实时警报流 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">实时警报</h2>
            <div className="flex items-center text-sm text-gray-500">
              <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
              {Array.isArray(alerts) ? alerts.filter((alert) => alert.type === 'error').length : 0} 错误,{' '}
              {Array.isArray(alerts) ? alerts.filter((alert) => alert.type === 'warning').length : 0} 警告
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {Array.isArray(alerts) && alerts.length > 0 ? (
              alerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{alert.message}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <span>{alert.venue}</span>
                      <span className="mx-1">•</span>
                      <span>{alert.time}</span>
                      {alert.severity && (
                        <>
                          <span className="mx-1">•</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {alert.severity === 'critical' ? '严重' :
                             alert.severity === 'high' ? '高' :
                             alert.severity === 'medium' ? '中' : '低'}
                          </span>
                        </>
                      )}
                    </div>
                    {alert.deviceName && (
                      <div className="mt-1 text-xs text-gray-400">
                        设备: {alert.deviceName}
                      </div>
                    )}
                  </div>
                  {!alert.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">暂无警报信息</p>
              </div>
            )}
          </div>

          <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium">
            查看全部警报历史
          </button>
        </div>
      </div>
    </div>
  );
}
