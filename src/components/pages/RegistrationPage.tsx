'use client'

import { useState } from 'react'
import { 
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  PlayIcon,
  PauseIcon,
  CogIcon
} from '@heroicons/react/24/outline'

const venues = [
  { id: 1, name: '万达广场', groups: ['A区娃娃机', 'B区推币机', 'C区夹娃娃', 'D区弹珠机'] },
  { id: 2, name: '银泰城', groups: ['A区娃娃机', 'B区推币机', 'C区夹娃娃', 'D区弹珠机'] },
  { id: 3, name: '龙湖天街', groups: ['A区娃娃机', 'B区推币机', 'C区夹娃娃', 'D区弹珠机'] },
  { id: 4, name: '印象城', groups: ['A区娃娃机', 'B区推币机', 'C区夹娃娃', 'D区弹珠机'] }
]

const registrationLogs = [
  { id: 1, deviceId: 'DEV-2024-001', venue: '万达广场', group: 'A区娃娃机', status: 'success', time: '14:23:45', message: '设备注册成功' },
  { id: 2, deviceId: 'DEV-2024-002', venue: '万达广场', group: 'A区娃娃机', status: 'success', time: '14:23:12', message: '设备注册成功' },
  { id: 3, deviceId: 'DEV-2024-003', venue: '银泰城', group: 'B区推币机', status: 'pending', time: '14:22:58', message: '等待设备响应' },
  { id: 4, deviceId: 'DEV-2024-004', venue: '龙湖天街', group: 'C区夹娃娃', status: 'failed', time: '14:22:34', message: '连接超时' },
  { id: 5, deviceId: 'DEV-2024-005', venue: '印象城', group: 'D区弹珠机', status: 'success', time: '14:22:18', message: '设备注册成功' }
]

function getStatusIcon(status: string) {
  switch (status) {
    case 'success':
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />
    case 'pending':
      return <ClockIcon className="w-5 h-5 text-yellow-500" />
    case 'failed':
      return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
    default:
      return null
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'success':
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">成功</span>
    case 'pending':
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">等待中</span>
    case 'failed':
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">失败</span>
    default:
      return null
  }
}

export default function RegistrationPage() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [registrationMode, setRegistrationMode] = useState('auto')
  const [timeLimit, setTimeLimit] = useState('60')
  const [maxDevices, setMaxDevices] = useState('50')
  
  const stats = {
    waiting: 12,
    success: 145,
    failed: 3
  }

  const handleStartRegistration = () => {
    if (!selectedVenue || !selectedGroup) {
      alert('请先选择场地和分组')
      return
    }
    setIsRegistering(true)
    // 模拟注册过程
    setTimeout(() => {
      setIsRegistering(false)
    }, 5000)
  }

  const availableGroups = selectedVenue ? venues.find(v => v.name === selectedVenue)?.groups || [] : []

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">设备注册</h1>
        <p className="text-gray-600 mt-1">批量注册新设备到指定场地和分组</p>
      </div>

      {/* 注册状态 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">注册状态</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isRegistering ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <span className="text-sm text-gray-600">
              {isRegistering ? '注册进行中' : '系统就绪'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <ClockIcon className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">等待注册</span>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{stats.waiting}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-700">注册成功</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.success}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-gray-700">注册失败</span>
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 注册配置 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">注册配置</h2>
          
          <div className="space-y-4">
            {/* 场地选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择场地</label>
              <div className="grid grid-cols-2 gap-2">
                {venues.map((venue) => (
                  <button
                    key={venue.id}
                    onClick={() => {
                      setSelectedVenue(venue.name)
                      setSelectedGroup('')
                    }}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      selectedVenue === venue.name
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">{venue.name}</div>
                    <div className="text-xs text-gray-500">{venue.groups.length} 个分组</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 分组选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择分组</label>
              <div className="grid grid-cols-2 gap-2">
                {availableGroups.map((group) => (
                  <button
                    key={group}
                    onClick={() => setSelectedGroup(group)}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      selectedGroup === group
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    disabled={!selectedVenue}
                  >
                    <div className="font-medium">{group}</div>
                  </button>
                ))}
              </div>
              {!selectedVenue && (
                <p className="text-sm text-gray-500 mt-2">请先选择场地</p>
              )}
            </div>

            {/* 注册设置 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">注册模式</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="auto"
                    checked={registrationMode === 'auto'}
                    onChange={(e) => setRegistrationMode(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">自动注册</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="manual"
                    checked={registrationMode === 'manual'}
                    onChange={(e) => setRegistrationMode(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">手动确认</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">时间限制(分钟)</label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">最大注册数</label>
                <input
                  type="number"
                  value={maxDevices}
                  onChange={(e) => setMaxDevices(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 控制按钮 */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleStartRegistration}
                disabled={isRegistering || !selectedVenue || !selectedGroup}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRegistering ? (
                  <>
                    <PauseIcon className="w-4 h-4 mr-2" />
                    停止注册
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-4 h-4 mr-2" />
                    开始注册
                  </>
                )}
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <CogIcon className="w-4 h-4 mr-2" />
                高级设置
              </button>
            </div>
          </div>
        </div>

        {/* 注册日志 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">注册日志</h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {registrationLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                {getStatusIcon(log.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{log.deviceId}</p>
                    <span className="text-xs text-gray-500">{log.time}</span>
                  </div>
                  <p className="text-sm text-gray-600">{log.venue} - {log.group}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">{log.message}</p>
                    {getStatusBadge(log.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium">
            查看完整日志
          </button>
        </div>
      </div>
    </div>
  )
}