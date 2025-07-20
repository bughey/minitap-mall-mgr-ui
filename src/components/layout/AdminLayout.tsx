'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  ComputerDesktopIcon, 
  BuildingOfficeIcon,
  PlusIcon,
  EyeIcon,
  ChartBarIcon,
  CogIcon,
  UserIcon,
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface MenuItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const menuItems: MenuItem[] = [
  { name: '系统总览', href: '/', icon: HomeIcon },
  { name: '场地管理', href: '/venues', icon: BuildingOfficeIcon },
  { name: '设备列表', href: '/devices', icon: ComputerDesktopIcon },
  { name: '设备注册', href: '/registration', icon: PlusIcon },
  { name: '实时监控', href: '/monitoring', icon: EyeIcon },
  { name: '报表统计', href: '/reports', icon: ChartBarIcon },
  { name: '系统设置', href: '/settings', icon: CogIcon },
]

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 移动端菜单背景 */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <div className={`
        fixed inset-y-0 left-0 z-50 flex flex-col bg-gradient-to-b from-blue-800 to-blue-900 shadow-xl
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}
        w-64
      `}>
        {/* Logo 区域 */}
        <div className="flex items-center justify-between p-4 border-b border-blue-700">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <ComputerDesktopIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg">MiniTap</span>
            </div>
          )}
          
          {/* 桌面端折叠按钮 */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:block p-1 rounded-md text-blue-200 hover:text-white hover:bg-blue-700"
          >
            {sidebarCollapsed ? (
              <ChevronRightIcon className="w-5 h-5" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5" />
            )}
          </button>

          {/* 移动端关闭按钮 */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 rounded-md text-blue-200 hover:text-white"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-700 text-white shadow-md' 
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                  }
                  ${sidebarCollapsed ? 'justify-center' : 'justify-start space-x-3'}
                `}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* 系统状态 */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-blue-700">
            <div className="flex items-center space-x-2 text-blue-200 text-xs">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>系统运行正常</span>
            </div>
            <div className="text-blue-300 text-xs mt-1">
              158台设备在线
            </div>
          </div>
        )}
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部导航 */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            {/* 移动端菜单按钮 */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -m-2 text-gray-600 hover:text-gray-900"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            {/* 面包屑 */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <HomeIcon className="w-4 h-4" />
              <span>/</span>
              <span className="text-gray-900 font-medium">
                {menuItems.find(item => item.href === pathname)?.name || '系统总览'}
              </span>
            </div>

            {/* 右侧工具栏 */}
            <div className="flex items-center space-x-4">
              {/* 通知 */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <BellIcon className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              {/* 用户信息 */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">管理员</div>
                  <div className="text-xs text-gray-500">admin@minitap.com</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}