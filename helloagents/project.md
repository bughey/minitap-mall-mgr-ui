# 项目技术约定（mall-mgr-ui）

## 技术栈
- **框架:** Next.js 16（App Router，静态导出 `output: "export"`）
- **UI:** React 19 + TypeScript（严格模式）
- **样式:** Tailwind CSS 4
- **组件:** `src/components/ui/`（基于 Radix UI 的自定义组件）

## 目录与模块
- 路由页面：`src/app/<route>/page.tsx`
- 页面实现：`src/components/pages/*Page.tsx`
- API 封装：`src/lib/api.ts`
- 类型定义：`src/types/*`

## 开发与验证
- 本地开发：`npm run dev`
- 代码检查：`npm run lint`
- 构建验证：`npm run build`
- 安全检查：`npm audit`

