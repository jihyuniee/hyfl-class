import Link from "next/link";

const links = [
  { href: "/", label: "홈" },
  { href: "/notice", label: "공지" },
  { href: "/teacher", label: "담임 소개" },
  { href: "/class", label: "우리반" },
  { href: "/schedule", label: "일정/수행" },
  { href: "/counseling", label: "상담" },
  { href: "/rules", label: "규칙" },
  { href: "/students", label: "학생 소개" }, // 담벼락 연결(이미 쓰는 구조)
  { href: "/campaign", label: "공약" },
  { href: "/roles", label: "1인1역할" },
];

export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          2-2 우리반
        </Link>

        <div className="hidden gap-4 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-gray-700 hover:text-black"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <Link
          href="/schedule"
          className="rounded-full bg-black px-3 py-1.5 text-sm text-white hover:opacity-90"
        >
          오늘의 일정
        </Link>
      </nav>

      {/* 모바일 메뉴 */}
      <div className="mx-auto block max-w-6xl px-4 pb-3 md:hidden">
        <div className="flex flex-wrap gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full border px-3 py-1 text-xs text-gray-700"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}