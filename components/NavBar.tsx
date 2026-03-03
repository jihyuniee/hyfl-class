"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "홈" },
  { href: "/notice", label: "공지" },
  { href: "/teacher", label: "담임 소개" },
  { href: "/class", label: "우리반" },
  { href: "/schedule", label: "일정/수행" },
  { href: "/counseling", label: "상담" },
  { href: "/rules", label: "규칙" },
  { href: "/wall", label: "학생 소개" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          2-2 우리반
        </Link>

        {/* 데스크톱 메뉴 */}
        <div className="hidden items-center gap-2 md:flex">
          {links.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  active
                    ? "hy-btn-primary text-white"
                    : "text-gray-700 hover:bg-black/[0.04] hover:text-black"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        {/* 우측 버튼 */}
        <Link
          href="/schedule"
          className="hy-btn hy-btn-primary text-sm text-white"
        >
          오늘의 일정
        </Link>
      </nav>

      {/* 모바일 메뉴 */}
      <div className="mx-auto block max-w-6xl px-4 pb-3 md:hidden">
        <div className="flex flex-wrap gap-2">
          {links.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  active
                    ? "bg-black text-white border-black"
                    : "text-gray-700 hover:bg-black/[0.04]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}