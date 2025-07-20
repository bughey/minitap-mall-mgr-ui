'use client'

import { useState } from 'react'
import { 
  ChartBarIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  ShareIcon
} from '@heroicons/react/24/outline'

const reportTypes = [
  { id: 'revenue', name: '收益报表', description: '分析各场地和设备的收益情况' },
  { id: 'device', name: '设备运行报表', description: '统计设备运行状态和使用情况' },
  { id: 'fault', name: '故障统计', description: '设备故障频率和维修记录' },
  { id: 'usage', name: '使用分析', description: '用户使用行为和偏好分析' }
]

const timeRanges = [
  { id: 'today', name: '今天' },
  { id: 'yesterday', name: '昨天' },
  { id: 'week', name: '本周' },
  { id: 'month', name: '本月' },
  { id: 'quarter', name: '本季度' },
  { id: 'custom', name: '自定义' }
]

const venues = ['全部场地', '万达广场', '银泰城', '龙湖天街', '印象城']
const deviceTypes = ['全部类型', '娃娃机', '推币机', '夹娃娃', '弹珠机']

// 模拟报表数据
const revenueData = [
  { venue: '万达广场', today: 3245, yesterday: 2980, week: 21580, month: 89650 },
  { venue: '银泰城', today: 2890, yesterday: 3120, week: 19870, month: 78450 },
  { venue: '龙湖天街', today: 3156, yesterday: 2850, week: 20650, month: 82340 },
  { venue: '印象城', today: 2234, yesterday: 2680, week: 17890, month: 65780 }
]

const deviceStats = [
  { type: '娃娃机', total: 51, active: 48, usage: 94, faults: 2 },
  { type: '推币机', total: 41, active: 39, usage: 95, faults: 1 },
  { type: '夹娃娃', total: 30, active: 28, usage: 93, faults: 3 },
  { type: '弹珠机', total: 21, active: 20, usage: 95, faults: 1 }
]

export default function ReportsPage() {
  const [selectedReportType, setSelectedReportType] = useState('revenue')
  const [selectedTimeRange, setSelectedTimeRange] = useState('month')
  const [selectedVenue, setSelectedVenue] = useState('全部场地')
  const [selectedDeviceType, setSelectedDeviceType] = useState('全部类型')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const handleExport = (format: string) => {
    console.log(`导出 ${format} 格式报表`)
    // 这里实现导出逻辑
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = () => {
    console.log('分享报表')
    // 这里实现分享逻辑
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">报表统计</h1>
        <p className="text-gray-600 mt-1">生成和查看各类运营数据报表</p>
      </div>

      {/* 报表配置 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4 mb-6">
          <ChartBarIcon className="w-5 h-5 text-gray-400" />
          <span className="text-lg font-medium text-gray-900">报表配置</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* 报表类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">报表类型</label>
            <select 
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {reportTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          {/* 时间范围 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">时间范围</label>
            <select 
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timeRanges.map(range => (
                <option key={range.id} value={range.id}>{range.name}</option>
              ))}
            </select>
          </div>

          {/* 场地筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">场地</label>
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

          {/* 设备类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">设备类型</label>
            <select 
              value={selectedDeviceType}
              onChange={(e) => setSelectedDeviceType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {deviceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 自定义时间范围 */}
        {selectedTimeRange === 'custom' && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-3">
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700">
            <ChartBarIcon className="w-4 h-4 mr-2" />
            生成报表
          </button>
          <button 
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <PrinterIcon className="w-4 h-4 mr-2" />
            打印
          </button>
          <button 
            onClick={handleShare}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ShareIcon className="w-4 h-4 mr-2" />
            分享
          </button>
          <div className="flex space-x-2">
            <button 
              onClick={() => handleExport('pdf')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
              PDF
            </button>
            <button 
              onClick={() => handleExport('excel')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
              Excel
            </button>
            <button 
              onClick={() => handleExport('csv')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* 报表内容 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {reportTypes.find(t => t.id === selectedReportType)?.name} - 
          {timeRanges.find(t => t.id === selectedTimeRange)?.name}
        </h2>

        {selectedReportType === 'revenue' && (
          <div className="space-y-6">
            {/* 收益概览 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">¥125,520</p>
                <p className="text-sm text-gray-600 mt-1">总收益</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">¥11,525</p>
                <p className="text-sm text-gray-600 mt-1">今日收益</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">+8.2%</p>
                <p className="text-sm text-gray-600 mt-1">环比增长</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">¥795</p>
                <p className="text-sm text-gray-600 mt-1">设备均值</p>
              </div>
            </div>

            {/* 场地收益表格 */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">场地</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">今日</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">昨日</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">本周</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">本月</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">增长率</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {revenueData.map((venue) => (
                    <tr key={venue.venue}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{venue.venue}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥{venue.today.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥{venue.yesterday.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥{venue.week.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥{venue.month.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`${venue.today > venue.yesterday ? 'text-green-600' : 'text-red-600'}`}>
                          {venue.today > venue.yesterday ? '+' : ''}{(((venue.today - venue.yesterday) / venue.yesterday) * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedReportType === 'device' && (
          <div className="space-y-6">
            {/* 设备概览 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">143</p>
                <p className="text-sm text-gray-600 mt-1">总设备数</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">135</p>
                <p className="text-sm text-gray-600 mt-1">活跃设备</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">94.4%</p>
                <p className="text-sm text-gray-600 mt-1">平均使用率</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">7</p>
                <p className="text-sm text-gray-600 mt-1">故障设备</p>
              </div>
            </div>

            {/* 设备类型统计 */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">活跃</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用率</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">故障数</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deviceStats.map((device) => (
                    <tr key={device.type}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{device.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.total}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.active}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${device.usage}%` }}></div>
                          </div>
                          <span className="text-sm text-gray-900">{device.usage}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.faults}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(selectedReportType === 'fault' || selectedReportType === 'usage') && (
          <div className="text-center py-12">
            <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">该报表类型的详细数据正在开发中...</p>
            <p className="text-sm text-gray-400 mt-2">请选择其他报表类型查看数据</p>
          </div>
        )}
      </div>
    </div>
  )
}