"use client";

import { usePathname } from "next/navigation";
import NavBar from "./NavBar";

export default function SiteFrame({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path === "/gildong-mission" || path.startsWith("/gildong-mission/")) {
    return <main id="main-content">{children}</main>;
  }
  return (
    <div className="class-app">
      <a href="#main-content" className="skip-link">본문 바로가기</a>
      <NavBar />
      <main id="main-content" tabIndex={-1} className={path === "/" ? "site-main site-main--home" : "site-main"}>
        {children}
      </main>
    </div>
  );
}
