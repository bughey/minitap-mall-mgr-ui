'use client'

import { 
  BuildingOfficeIcon,
  ComputerDesktopIcon,
  CurrencyDollarIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'

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
]

function getStatusBadge(status: string) {
  switch (status) {
    case 'online':
      return (
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm text-green-700">在线</span>
        </div>
      )
    case 'maintenance':
      return (
        <div className="flex items-center">
          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
          <span className="text-sm text-yellow-700">维护中</span>
        </div>
      )
    case 'offline':
      return (
        <div className="flex items-center">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
          <span className="text-sm text-red-700">离线</span>
        </div>
      )
    default:
      return null
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
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700">
          <PlusIcon className="w-4 h-4 mr-2" />
          添加场地
        </button>
      </div>

      {/* 场地卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {venues.map((venue) => (
          <div key={venue.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200">
            {/* 场地头部信息 */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{venue.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{venue.address}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(venue.status)}
                </div>
              </div>

              {/* 关键指标 */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <ComputerDesktopIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">设备总数</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{venue.totalDevices}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-500">活跃设备</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600 mt-1">{venue.activeDevices}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">今日收益</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 mt-1">¥{venue.todayRevenue}</p>
                </div>
              </div>
            </div>

            {/* 设备分组 */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-900">设备分组</h4>
                <button className="text-sm text-blue-600 hover:text-blue-800">
                  <PlusIcon className="w-4 h-4 inline mr-1" />
                  添加分组
                </button>
              </div>
              
              <div className="space-y-3">
                {venue.groups.map((group, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{group.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{group.devices} 台设备</span>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-gray-400 hover:text-gray-600">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
              <div className="flex justify-between">
                <div className="flex space-x-2">
                  <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                    <EyeIcon className="w-3 h-3 mr-1" />
                    查看详情
                  </button>
                  <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                    <PencilIcon className="w-3 h-3 mr-1" />
                    编辑
                  </button>
                </div>
                <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                  <WrenchScrewdriverIcon className="w-3 h-3 mr-1" />
                  维护模式
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 统计信息 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">场地统计</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">4</p>
            <p className="text-sm text-gray-500 mt-1">总场地数</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">143</p>
            <p className="text-sm text-gray-500 mt-1">总设备数</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">130</p>
            <p className="text-sm text-gray-500 mt-1">活跃设备</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">¥11,525</p>
            <p className="text-sm text-gray-500 mt-1">今日总收益</p>
          </div>
        </div>
      </div>
    </div>
  )
}