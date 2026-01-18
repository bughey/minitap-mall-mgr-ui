# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

MiniTap 设备管理系统前端 - 基于 Next.js 15 (App Router) 开发的游戏机台运营管理系统 Web 界面。这是一个完全响应式的单页应用，提供设备生命周期管理、实时监控、报表统计等功能。

## 开发命令

### 本地开发
```bash
# 安装依赖
npm install

# 启动开发服务器 (使用 Turbopack)
npm run dev
# 访问: http://device.m.minitap.org:3001

# 代码检查
npm run lint

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### 测试单个组件
```bash
# 直接访问特定页面进行测试
# 例如: http://device.m.minitap.org:3001/devices
```

## 架构说明

### 技术栈
- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript (严格模式)
- **样式**: Tailwind CSS 4
- **UI 组件**: 自定义组件库 (基于 Radix UI)
- **图标**: Heroicons + Lucide React
- **构建**: Turbopack (开发) + Next.js Build (生产)

### 目录结构
```
src/
├── app/                    # Next.js App Router 页面
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页 (系统总览)
│   ├── devices/           # 设备管理
│   ├── venues/            # 场地管理
│   ├── monitoring/        # 实时监控
│   ├── registration/      # 设备注册
│   ├── reports/           # 报表统计
│   └── settings/          # 系统设置
├── components/
│   ├── ui/                # 基础 UI 组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── sidebar.tsx
│   │   └── ...
│   ├── layout/
│   │   └── AdminLayout.tsx # 管理后台布局
│   └── pages/             # 页面组件
│       ├── OverviewPage.tsx
│       ├── DevicesPage.tsx
│       └── ...
└── globals.css            # 全局样式
```

### 路由结构
- `/` - 系统总览 (dashboard)
- `/venues` - 场地管理
- `/devices` - 设备列表
- `/registration` - 设备注册
- `/monitoring` - 实时监控
- `/reports` - 报表统计
- `/settings` - 系统设置 (已注释，待实现)

### UI 组件系统
项目使用基于 Radix UI 的自定义组件库，所有组件位于 `src/components/ui/`：
- 使用 `class-variance-authority` 管理组件变体
- 使用 `tailwind-merge` 合并类名
- 支持完全的类型安全和自动补全

### 状态管理
- 当前使用 React 组件内部状态管理
- 页面间通过 URL 参数传递状态
- 未来可能需要引入全局状态管理 (如 Zustand)

### API 集成
- 后端 API 地址需要配置 (待实现)
- 使用 fetch API 进行数据请求
- 统一的错误处理和响应格式

## 开发注意事项

1. **TypeScript 严格模式**: 所有代码必须通过严格的类型检查
2. **组件规范**: 使用函数组件和 TypeScript 接口定义 props
3. **样式规范**: 使用 Tailwind CSS 类，避免内联样式
4. **路径别名**: 使用 `@/` 作为 `src/` 的别名
5. **响应式设计**: 所有页面必须支持移动端、平板和桌面端
6. **无 ESLint 警告**: 代码必须通过 `npm run lint` 检查
7. **性能优化**: 使用 Next.js 的图片优化、代码分割等特性

## 主要功能模块

### AdminLayout 组件
- 侧边栏导航 (可折叠)
- 响应式布局适配
- 活动路由高亮
- 用户信息展示

### 页面组件规范
每个页面组件都应该：
1. 导出为默认函数
2. 使用 AdminLayout 包裹
3. 实现响应式布局
4. 处理加载和错误状态

### 样式主题
- 主色调: 深蓝色 (#4F46E5 到 #3730A3 渐变)
- 卡片式设计风格
- 圆角和阴影效果
- 深色背景配浅色文字

## 后续开发建议

1. **API 集成**: 需要实现与后端 API 的连接
2. **认证系统**: 添加 JWT 认证和路由保护
3. **实时数据**: 使用 WebSocket 或 SSE 实现实时更新
4. **国际化**: 考虑添加多语言支持
5. **测试**: 添加单元测试和 E2E 测试
6. **性能监控**: 集成性能监控工具
