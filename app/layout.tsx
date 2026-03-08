import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

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
            maxWidth: 1120,
            margin: "0 auto",
            padding: "28px 20px 60px",
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
