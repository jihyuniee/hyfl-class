"use client";
import { usePathname } from "next/navigation";
import NavBar from "./NavBar";

export default function SiteFrame({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path === "/gildong-mission" || path.startsWith("/gildong-mission/")) return <main>{children}</main>;
  if (path === "/") return <div style={{ minHeight: "100vh", background: "#f6f6ef" }}><NavBar /><main style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(20px, 3vw, 28px) clamp(14px, 4vw, 40px) 64px" }}>{children}</main></div>;
  return <><NavBar /><main style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(16px, 3vw, 28px) clamp(14px, 4vw, 40px) 80px" }}>{children}</main></>;
}
