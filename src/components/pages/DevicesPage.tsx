'use client'

import { useState } from 'react'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  PlayIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

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
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          活跃
        </span>
      )
    case 'idle':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          待玩
        </span>
      )
    case 'maintenance':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          维护中
        </span>
      )
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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4 mb-4">
          <FunnelIcon className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">筛选条件</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* 场地筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">场地</label>
            <select 
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {venues.map(venue => (
                <option key={venue} value={venue}>{venue}</option>
              ))}
            </select>
          </div>

          {/* 分组筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分组</label>
            <select 
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {groups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>

          {/* 状态筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* 设备类型筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">设备类型</label>
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {deviceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* 搜索框 */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">搜索</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索设备ID、名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 设备表格 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">设备信息</h2>
            <div className="text-sm text-gray-500">
              共 {devices.length} 台设备
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  设备信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  场地/分组
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  活跃时长
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  今日收益
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最后更新
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {devices.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{device.id}</div>
                      <div className="text-sm text-gray-500">{device.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{device.venue}</div>
                      <div className="text-sm text-gray-500">{device.group}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {device.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(device.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {device.activeTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {device.todayRevenue}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {device.lastUpdate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button className="text-yellow-600 hover:text-yellow-900">
                        <PlayIcon className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <ArrowPathIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              上一页
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                显示第 <span className="font-medium">1</span> 到{' '}
                <span className="font-medium">{Math.min(itemsPerPage, devices.length)}</span> 条，共{' '}
                <span className="font-medium">{devices.length}</span> 条记录
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}