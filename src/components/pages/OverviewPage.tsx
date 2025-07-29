'use client';

import { Computer, DollarSign, AlertTriangle, Play, Plus, Search, Download, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

// 模拟数据
const stats = [
  {
    title: '总设备数',
    value: '158',
    subtitle: '台设备',
    icon: Computer,
    color: 'blue'
  },
  {
    title: '今日活跃',
    value: '142',
    subtitle: '台设备',
    icon: Play,
    color: 'green'
  },
  {
    title: '今日收益',
    value: '¥12,580',
    subtitle: '比昨日+8.2%',
    icon: DollarSign,
    color: 'yellow'
  },
  {
    title: '维护设备',
    value: '3',
    subtitle: '需要处理',
    icon: AlertTriangle,
    color: 'red'
  }
];

const venues = [
  { name: '万达广场', total: 42, active: 38, rate: 90 },
  { name: '银泰城', total: 35, active: 32, rate: 91 },
  { name: '龙湖天街', total: 38, active: 35, rate: 92 },
  { name: '印象城', total: 28, active: 25, rate: 89 },
  { name: '大悦城', total: 15, active: 12, rate: 80 }
];

const alerts = [
  { message: '万达广场 A区娃娃机-001 需要维护', time: '2分钟前', type: 'warning' },
  { message: '银泰城 B区推币机-005 电量不足', time: '5分钟前', type: 'error' },
  { message: '龙湖天街 C区夹娃娃-012 固件更新完成', time: '8分钟前', type: 'success' }
];

const todayData = [
  { label: '投币数', value: '2,847' },
  { label: '退分数', value: '892' },
  { label: '退币数', value: '142' },
  { label: '投币次数', value: '1,231' }
];

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题和快速操作 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统总览</h1>
          <p className="text-gray-600 mt-1">游戏机台运营管理概览</p>
        </div>
        {/* <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            添加设备
          </Button>
          <Button variant="outline" size="sm">
            <Search className="w-4 h-4 mr-2" />
            搜索
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            导出报表
          </Button>
          <Button size="sm">
            <Settings className="w-4 h-4 mr-2" />
            系统设置
          </Button>
        </div> */}
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
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
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 场地设备分布 */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">场地设备分布</CardTitle>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              <span className="text-sm">查看详情</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {venues.map((venue, index) => (
              <div key={venue.name} className="p-4 bg-gray-50 rounded-lg space-y-3">
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
                    <span className="font-medium">{venue.name}店</span>
                    <Badge variant="outline" className="text-xs">
                      运营中
                    </Badge>
                  </div>
                  <span className="text-sm font-semibold">{venue.total} 台设备</span>
                </div>
                <Progress value={venue.rate} className="h-2" />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>活跃: {venue.active}台</span>
                  <span>待玩: {venue.total - venue.active}台</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* 实时警告 */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <span>实时警告</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-orange-50 border-l-4 border-orange-500">
                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">设备维护</p>
                  <p className="text-sm text-gray-600">万达广场店 - A区设备#12</p>
                  <p className="text-xs text-gray-500 mt-1">2分钟前</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 快速操作 */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">快速操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
                  <Plus className="w-5 h-5 mb-2" />
                  <span className="text-sm">添加设备</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
                  <Search className="w-5 h-5 mb-2" />
                  <span className="text-sm">设备搜索</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
                  <Download className="w-5 h-5 mb-2" />
                  <span className="text-sm">导出报表</span>
                </Button>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {todayData.map((item, index) => (
              <div key={item.label} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                <p className="text-sm text-gray-600 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
