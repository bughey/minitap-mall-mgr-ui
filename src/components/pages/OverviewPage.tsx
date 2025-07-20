'use client'

import { 
  ComputerDesktopIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  CogIcon
} from '@heroicons/react/24/outline'

// 模拟数据
const stats = [
  {
    title: '总设备数',
    value: '158',
    subtitle: '台设备',
    icon: ComputerDesktopIcon,
    color: 'blue'
  },
  {
    title: '今日活跃',
    value: '142',
    subtitle: '台设备',
    icon: PlayIcon,
    color: 'green'
  },
  {
    title: '今日收益',
    value: '¥12,580',
    subtitle: '比昨日+8.2%',
    icon: CurrencyDollarIcon,
    color: 'yellow'
  },
  {
    title: '维护设备',
    value: '3',
    subtitle: '需要处理',
    icon: ExclamationTriangleIcon,
    color: 'red'
  }
]

const venues = [
  { name: '万达广场', total: 42, active: 38, rate: 90 },
  { name: '银泰城', total: 35, active: 32, rate: 91 },
  { name: '龙湖天街', total: 38, active: 35, rate: 92 },
  { name: '印象城', total: 28, active: 25, rate: 89 },
  { name: '大悦城', total: 15, active: 12, rate: 80 }
]

const alerts = [
  { message: '万达广场 A区娃娃机-001 需要维护', time: '2分钟前', type: 'warning' },
  { message: '银泰城 B区推币机-005 电量不足', time: '5分钟前', type: 'error' },
  { message: '龙湖天街 C区夹娃娃-012 固件更新完成', time: '8分钟前', type: 'success' }
]

const todayData = [
  { label: '投币数', value: '2,847' },
  { label: '退分数', value: '892' },
  { label: '活跃设备', value: '142' },
  { label: '投币次数', value: '4,231' }
]

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题和快速操作 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统总览</h1>
          <p className="text-gray-600 mt-1">游戏机台运营管理概览</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <PlusIcon className="w-4 h-4 mr-2" />
            添加设备
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
            搜索
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            导出报表
          </button>
          <button className="inline-flex items-center px-3 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700">
            <CogIcon className="w-4 h-4 mr-2" />
            系统设置
          </button>
        </div>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`
                p-3 rounded-lg
                ${stat.color === 'blue' ? 'bg-blue-100 text-blue-600' : ''}
                ${stat.color === 'green' ? 'bg-green-100 text-green-600' : ''}
                ${stat.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' : ''}
                ${stat.color === 'red' ? 'bg-red-100 text-red-600' : ''}
              `}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 场地设备分布 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">场地设备分布</h2>
          <div className="space-y-4">
            {venues.map((venue) => (
              <div key={venue.name} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{venue.name}</span>
                    <span className="text-sm text-gray-500">{venue.active}/{venue.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${venue.rate}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">活跃率 {venue.rate}%</span>
                    <span className="text-xs text-gray-500">总计 {venue.total} 台</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 实时警告 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">实时警告</h2>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                <div className={`
                  w-2 h-2 rounded-full mt-2 flex-shrink-0
                  ${alert.type === 'warning' ? 'bg-yellow-500' : ''}
                  ${alert.type === 'error' ? 'bg-red-500' : ''}
                  ${alert.type === 'success' ? 'bg-green-500' : ''}
                `}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium">
            查看全部警告
          </button>
        </div>
      </div>

      {/* 今日数据统计 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">今日数据统计</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {todayData.map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              <p className="text-sm text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}