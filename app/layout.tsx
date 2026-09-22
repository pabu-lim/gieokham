import type { Metadata, Viewport } from "next";
import "./globals.css";
import {InstallApp} from "@/components/install-app";
export const viewport:Viewport={width:"device-width",initialScale:1,themeColor:"#2458da"};

export const metadata: Metadata = {
  title: "기억함 · 나의 메모와 할 일",
  description: "빠르게 기록하고 오늘 할 일을 확인하는 개인용 기억 보관함.",
  manifest: "/manifest.webmanifest",
  applicationName: "기억함",
  icons: {
    icon: "/icons/memory-64.png",
    shortcut: "/icons/memory-64.png",
    apple: "/icons/memory-180.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}<InstallApp/></body>
    </html>
  );
}
