import type { Metadata, Viewport } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "2-2 우리반",
  description: "2학년 2반 학급 페이지 — 일정, 수행평가, 상담, 역할을 한 곳에서",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <NavBar />
        <main
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "clamp(16px, 3vw, 28px) clamp(14px, 4vw, 40px) 80px",
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
