'use client'

import { useState } from 'react'
import { 
  Search,
  Filter,
  Eye,
  Edit,
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// 模拟设备数据
const devices = [
  {
    id: 'DEV001',
    name: '娃娃机-001',
    venue: '万达广场',
    group: 'A区娃娃机',
    type: '娃娃机',
    status: 'active',
    activeTime: '2小时38分',
    todayRevenue: '¥245',
    lastUpdate: '2分钟前'
  },
  {
    id: 'DEV002', 
    name: '推币机-005',
    venue: '银泰城',
    group: 'B区推币机',
    type: '推币机',
    status: 'idle',
    activeTime: '45分钟',
    todayRevenue: '¥128',
    lastUpdate: '5分钟前'
  },
  {
    id: 'DEV003',
    name: '夹娃娃-012',
    venue: '龙湖天街',
    group: 'C区夹娃娃',
    type: '夹娃娃',
    status: 'maintenance',
    activeTime: '0分钟',
    todayRevenue: '¥0',
    lastUpdate: '1小时前'
  },
  {
    id: 'DEV004',
    name: '弹珠机-008',
    venue: '印象城',
    group: 'D区弹珠机',
    type: '弹珠机',
    status: 'active',
    activeTime: '1小时15分',
    todayRevenue: '¥89',
    lastUpdate: '1分钟前'
  },
  {
    id: 'DEV005',
    name: '抓娃娃-003',
    venue: '万达广场',
    group: 'A区娃娃机',
    type: '抓娃娃',
    status: 'active',
    activeTime: '3小时22分',
    todayRevenue: '¥356',
    lastUpdate: '刚刚'
  }
]

const venues = ['全部场地', '万达广场', '银泰城', '龙湖天街', '印象城', '大悦城']
const groups = ['全部分组', 'A区娃娃机', 'B区推币机', 'C区夹娃娃', 'D区弹珠机']
const statuses = ['全部状态', '活跃', '待玩', '维护中']
const deviceTypes = ['全部类型', '娃娃机', '推币机', '夹娃娃', '弹珠机', '抓娃娃']

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">活跃</Badge>
    case 'idle':
      return <Badge variant="secondary">待玩</Badge>
    case 'maintenance':
      return <Badge variant="destructive">维护中</Badge>
    default:
      return null
  }
}

export default function DevicesPage() {
  const [selectedVenue, setSelectedVenue] = useState('全部场地')
  const [selectedGroup, setSelectedGroup] = useState('全部分组')
  const [selectedStatus, setSelectedStatus] = useState('全部状态')
  const [selectedType, setSelectedType] = useState('全部类型')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">设备列表</h1>
        <p className="text-gray-600 mt-1">管理所有游戏设备的状态和信息</p>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* 场地筛选 */}
            <div>
              <label className="block text-sm font-medium mb-2">场地</label>
              <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {venues.map(venue => (
                    <SelectItem key={venue} value={venue}>{venue}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 分组筛选 */}
            <div>
              <label className="block text-sm font-medium mb-2">分组</label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 状态筛选 */}
            <div>
              <label className="block text-sm font-medium mb-2">状态</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 设备类型筛选 */}
            <div>
              <label className="block text-sm font-medium mb-2">设备类型</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {deviceTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 搜索框 */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-2">搜索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="搜索设备ID、名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 设备表格 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>设备信息</CardTitle>
            <div className="text-sm text-muted-foreground">
              共 {devices.length} 台设备
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>设备信息</TableHead>
                  <TableHead>场地/分组</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>活跃时长</TableHead>
                  <TableHead>今日收益</TableHead>
                  <TableHead>最后更新</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{device.id}</div>
                        <div className="text-sm text-muted-foreground">{device.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{device.venue}</div>
                        <div className="text-sm text-muted-foreground">{device.group}</div>
                      </div>
                    </TableCell>
                    <TableCell>{device.type}</TableCell>
                    <TableCell>{getStatusBadge(device.status)}</TableCell>
                    <TableCell>{device.activeTime}</TableCell>
                    <TableCell className="font-medium">{device.todayRevenue}</TableCell>
                    <TableCell className="text-muted-foreground">{device.lastUpdate}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center justify-between sm:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                下一页
              </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  显示第 <span className="font-medium">1</span> 到{' '}
                  <span className="font-medium">{Math.min(itemsPerPage, devices.length)}</span> 条，共{' '}
                  <span className="font-medium">{devices.length}</span> 条记录
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}