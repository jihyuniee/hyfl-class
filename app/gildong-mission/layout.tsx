import type { Metadata, Viewport } from "next";
import "./park.css";

export const metadata: Metadata = {
  title: "길동 미션톡 | 둘이 걷는 가을",
  description: "길동생태공원에서 함께 발견하고 기록하는 로미오와 줄리엣 미션 산책. 지도, 탐험 미션, 가을 사진전.",
  manifest: "/gildong-mission/manifest.webmanifest",
  appleWebApp: { capable: true, title: "길동 미션톡", statusBarStyle: "default" },
  icons: { icon: "/gildong-mission/leaf.svg", apple: "/gildong-mission/leaf.svg" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 5, themeColor: "#234b3c" };
export default function ParkLayout({ children }: { children: React.ReactNode }) { return <div className="park-platform">{children}</div>; }
