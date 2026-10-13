import type { Metadata, Viewport } from "next";
import "./park.css";

export const metadata: Metadata = {
  title: "중어과의 2026 가을 | 함께 걷는 산책",
  description: "2학년 중국어과 1·2반 가을 산책. 종이 질문지로 짝꿍과 이야기하고, 공원 지도와 반별 사진첩을 함께 이용해요.",
  manifest: "/gildong-mission/manifest.webmanifest",
  appleWebApp: { capable: true, title: "중어과의 가을", statusBarStyle: "default" },
  icons: { icon: "/gildong-mission/leaf.svg", apple: "/gildong-mission/leaf.svg" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 5, themeColor: "#234b3c" };
export default function ParkLayout({ children }: { children: React.ReactNode }) { return <div className="park-platform">{children}</div>; }
