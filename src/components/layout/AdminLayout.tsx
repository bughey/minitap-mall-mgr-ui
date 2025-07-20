'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home,
  Computer,
  Building,
  Plus,
  Eye,
  BarChart3,
  Settings,
  User,
  Bell
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface MenuItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const menuItems: MenuItem[] = [
  { name: '系统总览', href: '/', icon: Home },
  { name: '场地管理', href: '/venues', icon: Building },
  { name: '设备列表', href: '/devices', icon: Computer },
  { name: '设备注册', href: '/registration', icon: Plus },
  { name: '实时监控', href: '/monitoring', icon: Eye },
  { name: '报表统计', href: '/reports', icon: BarChart3 },
  { name: '系统设置', href: '/settings', icon: Settings },
]

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon" className="bg-gradient-to-b from-[#4F46E5] to-[#3730A3] shadow-2xl">
          <SidebarHeader>
            <div className="flex items-center space-x-3 px-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-data-[collapsible=icon]:mx-auto">
                <Computer className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg group-data-[collapsible=icon]:hidden">
                MiniTap
              </span>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.name}
                          className="text-white/80 hover:bg-white/20 hover:text-white data-[active=true]:bg-white/25 data-[active=true]:text-white"
                        >
                          <Link href={item.href}>
                            <item.icon className="w-5 h-5" />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter>
            <div className="p-2 group-data-[collapsible=icon]:hidden">
              <div className="flex items-center space-x-2 text-white/70 text-xs">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>系统运行正常</span>
              </div>
              <div className="text-white/60 text-xs mt-1">
                版本 v2.1.0
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <SidebarInset>
          {/* 顶部导航栏 */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4">
              {/* 左侧：侧边栏触发器和面包屑 */}
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="md:hidden" />
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Home className="w-4 h-4" />
                  <span>/</span>
                  <span className="text-foreground font-medium">
                    {menuItems.find(item => item.href === pathname)?.name || '系统总览'}
                  </span>
                </div>
              </div>

              {/* 右侧工具栏 */}
              <div className="flex items-center space-x-4">
                {/* 通知按钮 */}
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                  >
                    3
                  </Badge>
                </Button>

                {/* 用户信息 */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium">管理员</div>
                    <div className="text-xs text-muted-foreground">admin@minitap.com</div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* 页面内容 */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}