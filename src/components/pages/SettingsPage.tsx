'use client'

import { useState } from 'react'
import { 
  CogIcon,
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  DocumentDuplicateIcon,
  CloudArrowUpIcon,
  TrashIcon,
  PencilIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

const tabs = [
  { id: 'basic', name: '基本设置', icon: CogIcon },
  { id: 'users', name: '用户管理', icon: UserIcon },
  { id: 'notifications', name: '通知设置', icon: BellIcon },
  { id: 'security', name: '安全设置', icon: ShieldCheckIcon },
  { id: 'backup', name: '数据备份', icon: DocumentDuplicateIcon }
]

const users = [
  { id: 1, name: '张三', email: 'zhangsan@minitap.com', role: '超级管理员', status: '活跃', lastLogin: '2小时前' },
  { id: 2, name: '李四', email: 'lisi@minitap.com', role: '运营管理员', status: '活跃', lastLogin: '1天前' },
  { id: 3, name: '王五', email: 'wangwu@minitap.com', role: '场地管理员', status: '离线', lastLogin: '3天前' },
  { id: 4, name: '赵六', email: 'zhaoliu@minitap.com', role: '技术支持', status: '活跃', lastLogin: '5分钟前' }
]

// const roles = ['超级管理员', '运营管理员', '场地管理员', '技术支持', '只读用户']

const backupHistory = [
  { id: 1, type: 'auto', date: '2024-01-20 02:00:00', size: '2.3 GB', status: 'success' },
  { id: 2, type: 'manual', date: '2024-01-19 14:30:00', size: '2.2 GB', status: 'success' },
  { id: 3, type: 'auto', date: '2024-01-19 02:00:00', size: '2.2 GB', status: 'success' },
  { id: 4, type: 'auto', date: '2024-01-18 02:00:00', size: '2.1 GB', status: 'failed' }
]

function getStatusBadge(status: string) {
  switch (status) {
    case '活跃':
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">活跃</span>
    case '离线':
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">离线</span>
    default:
      return null
  }
}

function getBackupStatusBadge(status: string) {
  switch (status) {
    case 'success':
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">成功</span>
    case 'failed':
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">失败</span>
    default:
      return null
  }
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('basic')
  const [systemName, setSystemName] = useState('趣兑 设备管理系统')
  const [timezone, setTimezone] = useState('Asia/Shanghai')
  const [language, setLanguage] = useState('zh-CN')
  const [theme, setTheme] = useState('light')
  
  // 通知设置
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [deviceAlerts, setDeviceAlerts] = useState(true)
  const [revenueAlerts, setRevenueAlerts] = useState(true)
  
  // 备份设置
  const [autoBackup, setAutoBackup] = useState(true)
  const [backupTime, setBackupTime] = useState('02:00')
  const [backupRetention, setBackupRetention] = useState('30')
  
  // 安全设置
  const [minPasswordLength, setMinPasswordLength] = useState('8')
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('5')
  const [sessionTimeout, setSessionTimeout] = useState('30')
  const [passwordExpireDays, setPasswordExpireDays] = useState('90')

  const handleSaveBasicSettings = () => {
    console.log('保存基本设置')
    // 这里实现保存逻辑
  }

  const handleCreateBackup = () => {
    console.log('创建手动备份')
    // 这里实现备份逻辑
  }

  const renderBasicSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">系统信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">系统名称</label>
            <input
              type="text"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">时区</label>
            <select 
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Asia/Shanghai">中国标准时间 (GMT+8)</option>
              <option value="UTC">协调世界时 (GMT+0)</option>
              <option value="America/New_York">美国东部时间</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">语言</label>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="zh-CN">中文(简体)</option>
              <option value="en-US">English</option>
              <option value="ja-JP">日本語</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">主题</label>
            <select 
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">浅色主题</option>
              <option value="dark">深色主题</option>
              <option value="auto">跟随系统</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-200">
        <button 
          onClick={handleSaveBasicSettings}
          className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
        >
          保存设置
        </button>
      </div>
    </div>
  )

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">用户列表</h3>
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700">
          <PlusIcon className="w-4 h-4 mr-2" />
          添加用户
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最后登录</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                      <UserIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(user.status)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastLogin}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">通知设置</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">邮件通知</h4>
            <p className="text-sm text-gray-500">接收系统相关的邮件通知</p>
          </div>
          <button
            onClick={() => setEmailNotifications(!emailNotifications)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              emailNotifications ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">短信通知</h4>
            <p className="text-sm text-gray-500">接收紧急情况的短信通知</p>
          </div>
          <button
            onClick={() => setSmsNotifications(!smsNotifications)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              smsNotifications ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              smsNotifications ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">设备告警</h4>
            <p className="text-sm text-gray-500">设备故障或异常时通知</p>
          </div>
          <button
            onClick={() => setDeviceAlerts(!deviceAlerts)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              deviceAlerts ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              deviceAlerts ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">收益提醒</h4>
            <p className="text-sm text-gray-500">收益达到目标或异常时通知</p>
          </div>
          <button
            onClick={() => setRevenueAlerts(!revenueAlerts)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              revenueAlerts ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              revenueAlerts ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">安全设置</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">密码最小长度</label>
          <input
            type="number"
            value={minPasswordLength}
            onChange={(e) => setMinPasswordLength(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">登录失败锁定次数</label>
          <input
            type="number"
            value={maxLoginAttempts}
            onChange={(e) => setMaxLoginAttempts(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">会话超时时间(分钟)</label>
          <input
            type="number"
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">密码过期天数</label>
          <input
            type="number"
            value={passwordExpireDays}
            onChange={(e) => setPasswordExpireDays(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  )

  const renderBackupSettings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">数据备份</h3>
        <button 
          onClick={handleCreateBackup}
          className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
        >
          <CloudArrowUpIcon className="w-4 h-4 mr-2" />
          手动备份
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">自动备份</h4>
            <p className="text-sm text-gray-500">每日自动备份数据</p>
          </div>
          <button
            onClick={() => setAutoBackup(!autoBackup)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              autoBackup ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              autoBackup ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">备份时间</label>
          <input
            type="time"
            value={backupTime}
            onChange={(e) => setBackupTime(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">保留天数</label>
          <input
            type="number"
            value={backupRetention}
            onChange={(e) => setBackupRetention(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-4">备份历史</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">大小</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {backupHistory.map((backup) => (
                <tr key={backup.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {backup.type === 'auto' ? '自动备份' : '手动备份'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{backup.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{backup.size}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getBackupStatusBadge(backup.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">下载</button>
                    <button className="text-green-600 hover:text-green-900 mr-3">恢复</button>
                    <button className="text-red-600 hover:text-red-900">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return renderBasicSettings()
      case 'users':
        return renderUserManagement()
      case 'notifications':
        return renderNotificationSettings()
      case 'security':
        return renderSecuritySettings()
      case 'backup':
        return renderBackupSettings()
      default:
        return renderBasicSettings()
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
        <p className="text-gray-600 mt-1">管理系统配置和用户权限</p>
      </div>

      <div className="flex">
        {/* 左侧导航 */}
        <div className="w-64 bg-white rounded-lg shadow p-4 mr-6">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-3" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 bg-white rounded-lg shadow p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
