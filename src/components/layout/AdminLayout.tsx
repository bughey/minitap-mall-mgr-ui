'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BadgePercent,
  Bell,
  FolderTree,
  Home,
  Image,
  LayoutDashboard,
  Package,
  ReceiptText,
  TicketPercent,
  Undo2,
  User,
} from 'lucide-react';
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
  SidebarTrigger
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';


interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const menuItems: MenuItem[] = [
  { name: '仪表盘', href: '/', icon: LayoutDashboard },
  { name: 'Banner', href: '/content/banners', icon: Image },
  { name: '活动', href: '/content/activities', icon: BadgePercent },
  { name: '分类', href: '/catalog/categories', icon: FolderTree },
  { name: '商品', href: '/catalog/products', icon: Package },
  { name: '订单', href: '/orders', icon: ReceiptText },
  { name: '退款审核', href: '/after-sales/refunds', icon: Undo2 },
  { name: '优惠券', href: '/marketing/coupons', icon: TicketPercent },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon" className="bg-gradient-to-b from-[#1E40AF] to-[#3B82F6] shadow-2xl">
          <SidebarHeader>
            <div className="flex items-center space-x-3 px-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-data-[collapsible=icon]:mx-auto">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg group-data-[collapsible=icon]:hidden">积分商城</span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    const isActive = item.href === '/' 
                      ? pathname === '/' 
                      : pathname.startsWith(item.href);
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.name}
                          className="text-white/80 hover:bg-white/20 hover:text-white data-[active=true]:bg-white/30 data-[active=true]:text-white data-[active=true]:font-semibold outline-none focus-visible:ring-0">
                          <Link href={item.href}>
                            <item.icon className="w-5 h-5" />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
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
              <div className="text-white/60 text-xs mt-1">版本 v2.1.0</div>
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
                      {menuItems.find((item) => 
                        item.href === '/' 
                          ? pathname === '/' || pathname === '/index.html'
                          : pathname.startsWith(item.href)
                    )?.name || '仪表盘'}
                    </span>
                  </div>
                </div>

              {/* 右侧工具栏 */}
                <div className="flex items-center space-x-4">
                  {/* 通知按钮 */}
                  <Button variant="ghost" size="icon" className="relative" aria-label="通知">
                    <Bell className="w-5 h-5" />

                  </Button>

                {/* 用户信息 */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium">管理员</div>
                    <div className="text-xs text-muted-foreground">mall.mgr</div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* 页面内容 */}
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
