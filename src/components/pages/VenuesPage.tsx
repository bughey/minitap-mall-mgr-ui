'use client';

import { Building, Computer, DollarSign, Plus, Edit, Eye, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// 模拟场地数据
const venues = [
  {
    id: 1,
    name: '万达广场',
    address: '杭州市西湖区万达广场3楼',
    status: 'online',
    totalDevices: 42,
    activeDevices: 38,
    todayRevenue: 3245,
    groups: [
      { name: 'A区娃娃机', devices: 15 },
      { name: 'B区推币机', devices: 12 },
      { name: 'C区夹娃娃', devices: 8 },
      { name: 'D区弹珠机', devices: 7 }
    ]
  },
  {
    id: 2,
    name: '银泰城',
    address: '杭州市江干区银泰城4楼',
    status: 'online',
    totalDevices: 35,
    activeDevices: 32,
    todayRevenue: 2890,
    groups: [
      { name: 'A区娃娃机', devices: 12 },
      { name: 'B区推币机', devices: 10 },
      { name: 'C区夹娃娃', devices: 8 },
      { name: 'D区弹珠机', devices: 5 }
    ]
  },
  {
    id: 3,
    name: '龙湖天街',
    address: '杭州市拱墅区龙湖天街2楼',
    status: 'online',
    totalDevices: 38,
    activeDevices: 35,
    todayRevenue: 3156,
    groups: [
      { name: 'A区娃娃机', devices: 14 },
      { name: 'B区推币机', devices: 11 },
      { name: 'C区夹娃娃', devices: 8 },
      { name: 'D区弹珠机', devices: 5 }
    ]
  },
  {
    id: 4,
    name: '印象城',
    address: '杭州市滨江区印象城3楼',
    status: 'maintenance',
    totalDevices: 28,
    activeDevices: 25,
    todayRevenue: 2234,
    groups: [
      { name: 'A区娃娃机', devices: 10 },
      { name: 'B区推币机', devices: 8 },
      { name: 'C区夹娃娃', devices: 6 },
      { name: 'D区弹珠机', devices: 4 }
    ]
  }
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'online':
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
          在线
        </Badge>
      );
    case 'maintenance':
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
          维护中
        </Badge>
      );
    case 'offline':
      return <Badge variant="destructive">离线</Badge>;
    default:
      return null;
  }
}

export default function VenuesPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">场地管理</h1>
          <p className="text-gray-600 mt-1">管理所有运营场地和设备分组</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          添加场地
        </Button>
      </div>

      {/* 场地卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {venues.map((venue) => (
          <Card key={venue.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="border-b">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{venue.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{venue.address}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">{getStatusBadge(venue.status)}</div>
              </div>

              {/* 关键指标 */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Computer className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">设备总数</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{venue.totalDevices}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-muted-foreground">活跃设备</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600 mt-1">{venue.activeDevices}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">今日收益</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 mt-1">¥{venue.todayRevenue}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* 设备分组 */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium">设备分组</h4>
                <Button variant="ghost" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  添加分组
                </Button>
              </div>

              <div className="space-y-3">
                {venue.groups.map((group, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <span className="text-sm font-medium">{group.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{group.devices} 台设备</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-between flex-row-reverse mt-6 pt-4 border-t">
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-3 h-3 mr-1" />
                    查看详情
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="w-3 h-3 mr-1" />
                    编辑
                  </Button>
                </div>
                {/* <Button variant="outline" size="sm">
                  <Wrench className="w-3 h-3 mr-1" />
                  维护模式
                </Button> */}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 统计信息 */}
      <Card>
        <CardHeader>
          <CardTitle>场地统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold">4</p>
              <p className="text-sm text-muted-foreground mt-1">总场地数</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">143</p>
              <p className="text-sm text-muted-foreground mt-1">总设备数</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">130</p>
              <p className="text-sm text-muted-foreground mt-1">活跃设备</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">¥11,525</p>
              <p className="text-sm text-muted-foreground mt-1">今日总收益</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
