# Changelog

本文件记录项目所有重要变更。
格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/),
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 变更
- 左侧菜单文案：Banner 更名为「轮播图」。
- 依赖升级：升级 Next.js 至 16.1.6（App Router），同步升级 `eslint-config-next`。
- 工具链：采用 ESLint Flat Config，`npm run lint` 改为 `eslint .` 以兼容 Next 16 CLI。

### 修复
- UI：修复 Sidebar skeleton 组件在 render 阶段使用 `Math.random()` 导致的 lint 错误。

### 安全
- 依赖：执行 `npm audit fix` 并确保 `npm audit` 为 0 告警。
