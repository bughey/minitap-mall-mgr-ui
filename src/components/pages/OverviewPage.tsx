'use client';

import { useState, useEffect } from 'react';
import { Computer, DollarSign, AlertTriangle, Play, Plus, Search, Download, Coins, TrendingDown, ArrowLeft, ListOrdered } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { dashboardApi } from '@/lib/api';

interface DashboardStats {
  total_device_count: number;
  active_device_count: number;
  today_revenue: number;
  maintenance_count: number;
  today_coin_count: number;
  today_point_back_count: number;
  today_coin_back_count: number;
  today_order_count: number;
}

interface PlaceDistribution {
  place_id: number;
  place_name: string;
  total_devices: number;
  active_devices: number;
  active_rate: number;
}

interface DashboardAlert {
  id: number;
  device_no: string;
  device_name: string;
  place_name: string;
  alert_type: string;
  message: string;
  created_at: string;
}

export default function OverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [placeDistribution, setPlaceDistribution] = useState<PlaceDistribution[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 并行请求所有数据
      const [statsRes, distributionRes, alertsRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getPlaceDistribution(),
        dashboardApi.getAlerts()
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data as DashboardStats);
      } else {
        throw new Error(statsRes.err_message || '获取统计数据失败');
      }

      if (distributionRes.success && distributionRes.data) {
        const data = distributionRes.data as { places: PlaceDistribution[] };
        if (data.places) {
          setPlaceDistribution(data.places);
        }
      } else {
        throw new Error(distributionRes.err_message || '获取场地分布数据失败');
      }

      if (alertsRes.success && alertsRes.data) {
        const data = alertsRes.data as { alerts: DashboardAlert[] };
        if (data.alerts) {
          setAlerts(data.alerts);
        }
      } else {
        throw new Error(alertsRes.err_message || '获取告警数据失败');
      }
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 格式化数字
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('zh-CN').format(num);
  };

  // 格式化货币
  const formatCurrency = (num: number) => {
    const amountYuan = num / 100;
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amountYuan);
  };

  // 计算相对时间
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  const statCards = stats ? [
    {
      title: '总设备数',
      value: formatNumber(stats.total_device_count),
      subtitle: '台设备',
      icon: Computer,
      color: 'blue'
    },
    {
      title: '今日活跃',
      value: formatNumber(stats.active_device_count),
      subtitle: '台设备',
      icon: Play,
      color: 'green'
    },
    {
      title: '今日收益',
      value: formatCurrency(stats.today_revenue),
      subtitle: `${formatNumber(stats.today_coin_count)}个币`,
      icon: DollarSign,
      color: 'yellow'
    },
    {
      title: '维护设备',
      value: formatNumber(stats.maintenance_count),
      subtitle: '需要处理',
      icon: AlertTriangle,
      color: 'red'
    }
  ] : [];

  const todayData = stats ? [
    { label: '投币数', value: formatNumber(stats.today_coin_count), icon: Coins },
    { label: '退分数', value: formatNumber(stats.today_point_back_count), icon: TrendingDown },
    { label: '退币数', value: formatNumber(stats.today_coin_back_count), icon: ArrowLeft },
    { label: '订单数', value: formatNumber(stats.today_order_count), icon: ListOrdered }
  ] : [];
  return (
    <div className="space-y-6">
      {/* 页面标题和快速操作 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统总览</h1>
          <p className="text-gray-600 mt-1">游戏机台运营管理概览</p>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="link" onClick={fetchDashboardData} className="ml-2 p-0 h-auto">
              重试
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          // 加载骨架屏
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="relative overflow-hidden shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-11 w-11 rounded-xl" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
              <Skeleton className="absolute bottom-0 left-0 right-0 h-1" />
            </Card>
          ))
        ) : (
          statCards.map((stat) => (
            <Card key={stat.title} className="relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                <div
                  className={`
                  p-3 rounded-xl shadow-md
                  ${stat.color === 'blue' ? 'bg-blue-500 text-white' : ''}
                  ${stat.color === 'green' ? 'bg-green-500 text-white' : ''}
                  ${stat.color === 'yellow' ? 'bg-yellow-500 text-white' : ''}
                  ${stat.color === 'red' ? 'bg-red-500 text-white' : ''}
                `}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <p
                  className={`text-xs font-medium
                  ${stat.color === 'blue' ? 'text-blue-600' : ''}
                  ${stat.color === 'green' ? 'text-green-600' : ''}
                  ${stat.color === 'yellow' ? 'text-yellow-600' : ''}
                  ${stat.color === 'red' ? 'text-red-600' : ''}
                `}>
                  {stat.subtitle}
                </p>
              </CardContent>
              <div
                className={`absolute bottom-0 left-0 right-0 h-1
                ${stat.color === 'blue' ? 'bg-blue-500' : ''}
                ${stat.color === 'green' ? 'bg-green-500' : ''}
                ${stat.color === 'yellow' ? 'bg-yellow-500' : ''}
                ${stat.color === 'red' ? 'bg-red-500' : ''}
              `}></div>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 场地设备分布 */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">场地设备分布</CardTitle>
            <Link href="/venues">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                <span className="text-sm">查看详情</span>
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              // 加载骨架屏
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-3 w-3 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))
            ) : placeDistribution.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无场地数据</div>
            ) : (
              placeDistribution.slice(0, 5).map((place, index) => (
                <div key={place.place_id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index === 0
                            ? 'bg-blue-500'
                            : index === 1
                            ? 'bg-green-500'
                            : index === 2
                            ? 'bg-orange-500'
                            : index === 3
                            ? 'bg-purple-500'
                            : 'bg-gray-500'
                        }`}></div>
                      <span className="font-medium">{place.place_name}</span>
                      <Badge variant="outline" className="text-xs">
                        运营中
                      </Badge>
                    </div>
                    <span className="text-sm font-semibold">{place.total_devices} 台设备</span>
                  </div>
                  <Progress value={place.active_rate} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>活跃: {place.active_devices}台</span>
                    <span>待玩: {place.total_devices - place.active_devices}台</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* 实时告警 */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <span>实时告警</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                // 加载骨架屏
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                    <Skeleton className="h-4 w-4 mt-0.5" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))
              ) : alerts.length === 0 ? (
                <div className="text-center py-4 text-gray-500">暂无告警信息</div>
              ) : (
                alerts.slice(0, 5).map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`flex items-start space-x-3 p-3 rounded-lg border-l-4 ${
                      alert.alert_type === '待处理' 
                        ? 'bg-orange-50 border-orange-500' 
                        : 'bg-red-50 border-red-500'
                    }`}
                  >
                    <AlertTriangle 
                      className={`w-4 h-4 mt-0.5 ${
                        alert.alert_type === '待处理' ? 'text-orange-500' : 'text-red-500'
                      }`} 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{alert.alert_type}</p>
                      <p className="text-sm text-gray-600">
                        {alert.place_name} - {alert.device_name} ({alert.device_no})
                      </p>
                      <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{getRelativeTime(alert.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* 快速操作 */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">快速操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/registration">
                  <Button variant="outline" className="flex flex-col items-center p-4 h-auto w-full">
                    <Plus className="w-5 h-5 mb-2" />
                    <span className="text-sm">添加设备</span>
                  </Button>
                </Link>
                <Link href="/devices">
                  <Button variant="outline" className="flex flex-col items-center p-4 h-auto w-full">
                    <Search className="w-5 h-5 mb-2" />
                    <span className="text-sm">设备搜索</span>
                  </Button>
                </Link>
                <Link href="/reports">
                  <Button variant="outline" className="flex flex-col items-center p-4 h-auto w-full">
                    <Download className="w-5 h-5 mb-2" />
                    <span className="text-sm">导出报表</span>
                  </Button>
                </Link>
                {/* <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
                  <Settings className="w-5 h-5 mb-2" />
                  <span className="text-sm">系统设置</span>
                </Button> */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 今日数据统计 */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">今日数据</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            // 加载骨架屏
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                  <Skeleton className="h-8 w-20 mx-auto mb-2" />
                  <Skeleton className="h-4 w-16 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {todayData.map((item) => (
                <div key={item.label} className="text-center p-4 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                  <div className="flex justify-center mb-2">
                    <item.icon className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                  <p className="text-sm text-gray-600 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
