# API 手册

## 概述
本项目通过 `src/lib/api.ts` 封装后端接口，默认基址为同域名 `/api/v1`（可用 `NEXT_PUBLIC_API_URL` 覆盖，若项目支持）。

## 认证方式
- 浏览器端使用 Cookie（`credentials: "include"`）。
- 401 自动跳转（若实现了统一登录跳转逻辑）。

## 响应约定
以 `src/lib/api.ts` 实现为准（如 `ApiResponse` / `PageResponse`）。

