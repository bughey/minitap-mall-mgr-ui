import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 配置静态导出用于 nginx 部署
  output: 'export',
  
  // 启用尾部斜杠，确保 /login -> /login/ 并生成 /login/index.html
  trailingSlash: true,
  
  // 图片配置：禁用内置图片优化（静态导出不支持）
  images: {
    unoptimized: true,
  },
  
  // 禁用 x-powered-by 头部
  poweredByHeader: false,
  
  // 启用 React 严格模式
  reactStrictMode: true,
  
  // 压缩输出
  compress: true,
  
  // 生成 ETag
  generateEtags: true,
};

export default nextConfig;
