import type { Metadata } from "next";
import { Fira_Code, Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "积分商城管理系统",
  description: "积分商城后台管理系统",
};

import AdminLayout from "@/components/layout/AdminLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${notoSans.variable} ${firaCode.variable} antialiased`}
      >
        <AdminLayout>
          {children}
        </AdminLayout>
      </body>
    </html>
  );
}
