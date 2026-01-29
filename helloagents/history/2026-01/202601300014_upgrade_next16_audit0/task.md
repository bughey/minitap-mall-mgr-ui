# 任务清单: 升级 Next.js 16 并清零 npm audit 告警

目录: `helloagents/plan/202601300014_upgrade_next16_audit0/`

> **类型:** 安全（轻量迭代）

---

## 1. 依赖升级与安全修复

- [√] 1.1 升级 Next.js 到 16.1.6（同步 `eslint-config-next`）
- [√] 1.2 执行 `npm audit fix` 清理传递依赖漏洞并确保 `npm audit` 为 0

## 2. 工具链与兼容性

- [√] 2.1 更新 ESLint 配置（Flat Config）并调整 `npm run lint` 为 `eslint .`（适配 Next 16 CLI）
- [√] 2.2 修复 Sidebar skeleton 组件 lint 错误（避免 render 阶段使用 `Math.random()`）
- [√] 2.3 接受 Next 自动更新的 `tsconfig.json`（`jsx: react-jsx` + `.next/dev/types`）

## 3. 文档与验证

- [√] 3.1 初始化并更新 `helloagents/` 知识库（SSOT）
- [√] 3.2 更新 `CLAUDE.md` / `README.md`（Next.js 版本信息）
- [√] 3.3 执行 `npm audit` / `npm run lint` / `npm run build` 通过

