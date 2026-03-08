"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const NAV_GROUPS = [
  {
    label: "홈", emoji: "🏠",
    items: [
      { href: "/", label: "홈" },
      { href: "/notice", label: "공지" },
    ],
  },
  {
    label: "우리반", emoji: "👥",
    items: [
      { href: "/teacher", label: "담임 소개" },
      { href: "/wall", label: "학생 소개" },
      { href: "/campaign", label: "공약" },
    ],
  },
  {
    label: "활동", emoji: "📋",
    items: [
      { href: "/schedule", label: "일정/수행" },
      { href: "/habits", label: "90일 습관" },
      { href: "/roles", label: "1인1역할" },
      { href: "/cleaning", label: "청소" },
      { href: "/study", label: "야자 신청" },
    ],
  },
  {
    label: "소통", emoji: "💬",
    items: [
      { href: "/counseling", label: "상담" },
      { href: "/counseling-request", label: "상담 신청" },
      { href: "/pledges", label: "규칙" },
      { href: "/board", label: "신문고" },
      { href: "/hr", label: "HR 기록" },
    ],
  },
];

export default function NavBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenGroup(null);
  }, [pathname]);

  const handleEnter = (label: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenGroup(label);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpenGroup(null), 120);
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 100,
      background: scrolled ? "rgba(255,249,255,0.96)" : "#fff",
      backdropFilter: "blur(16px)",
      borderBottom: "1.5px solid #f0e6f6",
      boxShadow: scrolled ? "0 4px 20px rgba(192,132,252,0.12)" : "none",
      transition: "box-shadow 0.2s, background 0.2s",
    }}>
      <nav style={{
        maxWidth: 1120, margin: "0 auto", padding: "0 20px",
        height: 64, display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 12,
      }}>
        {/* Logo */}
        <Link href="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none", flexShrink:0 }}>
          <div style={{
            width:38, height:38, borderRadius:13,
            background:"linear-gradient(135deg,#f472b6,#a78bfa)",
            display:"flex", alignItems:"center", justifyContent:"center",
            color:"#fff", fontWeight:900, fontSize:13,
            boxShadow:"0 4px 12px rgba(244,114,182,0.4)",
            letterSpacing:"-0.5px", flexShrink:0,
          }}>2·2</div>
          <span style={{ fontWeight:900, fontSize:16, color:"var(--text)", letterSpacing:"-0.4px" }}>
            우리반 🌸
          </span>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display:"flex", alignItems:"center", gap:2, flex:1, justifyContent:"center" }}
          className="desktop-only">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} style={{ position:"relative" }}
              onMouseEnter={() => handleEnter(group.label)}
              onMouseLeave={handleLeave}>
              <button style={{
                display:"flex", alignItems:"center", gap:5,
                padding:"8px 14px", borderRadius:12, border:"none",
                background: openGroup===group.label ? "var(--primary-light)" : "transparent",
                color: openGroup===group.label ? "var(--primary)" : "var(--text-muted)",
                fontWeight:700, fontSize:14, cursor:"pointer",
                transition:"all 0.15s", fontFamily:"inherit",
              }}>
                <span>{group.emoji}</span>
                <span>{group.label}</span>
                <span style={{ fontSize:9, opacity:0.5, marginLeft:2 }}>▾</span>
              </button>

              {openGroup===group.label && (
                <div
                  onMouseEnter={() => handleEnter(group.label)}
                  onMouseLeave={handleLeave}
                  style={{
                    position:"absolute", top:"calc(100% + 6px)",
                    left:"50%", transform:"translateX(-50%)",
                    background:"#fff", border:"1.5px solid #f0e6f6",
                    borderRadius:16, boxShadow:"0 12px 40px rgba(192,132,252,0.18)",
                    padding:"6px", minWidth:148,
                    animation:"dropIn 0.15s ease",
                  }}>
                  {group.items.map((item) => (
                    <Link key={item.href} href={item.href} style={{
                      display:"flex", alignItems:"center",
                      padding:"9px 14px", borderRadius:10,
                      color: isActive(item.href) ? "var(--primary)" : "var(--text)",
                      background: isActive(item.href) ? "var(--primary-light)" : "transparent",
                      fontSize:14, fontWeight: isActive(item.href) ? 800 : 500,
                      textDecoration:"none", whiteSpace:"nowrap", transition:"background 0.1s",
                    }}
                      onMouseEnter={e => !isActive(item.href) && (e.currentTarget.style.background="#fdf2f8")}
                      onMouseLeave={e => !isActive(item.href) && (e.currentTarget.style.background="transparent")}
                    >{item.label}</Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <Link href="/schedule" style={{
            padding:"9px 18px", borderRadius:999,
            background:"linear-gradient(135deg,#f472b6,#a78bfa)",
            color:"#fff", fontWeight:800, fontSize:13,
            textDecoration:"none",
            boxShadow:"0 4px 14px rgba(244,114,182,0.35)",
            whiteSpace:"nowrap", letterSpacing:"-0.2px",
          }}>
            오늘의 일정 ✨
          </Link>

          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="mobile-only"
            style={{
              width:42, height:42, borderRadius:13,
              border:"1.5px solid #f0e6f6",
              background: mobileOpen ? "var(--primary-light)" : "#fff",
              cursor:"pointer", display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", gap:5, flexShrink:0,
            }}>
            {[0,1,2].map(i => (
              <span key={i} style={{
                display:"block", width:16, height:2.5, borderRadius:2,
                background: mobileOpen ? "var(--primary)" : "var(--text-muted)",
                transition:"all 0.2s",
                transform: mobileOpen&&i===0 ? "rotate(45deg) translate(5px,5px)"
                  : mobileOpen&&i===2 ? "rotate(-45deg) translate(5px,-5px)" : "none",
                opacity: mobileOpen&&i===1 ? 0 : 1,
              }}/>
            ))}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="mobile-only" style={{
          borderTop:"1.5px solid #f0e6f6",
          background:"#fff", padding:"12px 20px 24px",
        }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} style={{ marginBottom:18 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                <span style={{ fontSize:14 }}>{group.emoji}</span>
                <span style={{ fontSize:11, fontWeight:800, color:"var(--text-subtle)", letterSpacing:"0.08em", textTransform:"uppercase" }}>
                  {group.label}
                </span>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {group.items.map((item) => (
                  <Link key={item.href} href={item.href} style={{
                    padding:"7px 16px", borderRadius:999,
                    background: isActive(item.href) ? "linear-gradient(135deg,#f472b6,#a78bfa)" : "#fdf2f8",
                    color: isActive(item.href) ? "#fff" : "var(--text-muted)",
                    fontSize:13, fontWeight:700, textDecoration:"none",
                  }}>{item.label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .desktop-only { display: flex !important; }
        .mobile-only  { display: none  !important; }
        @media (max-width: 768px) {
          .desktop-only { display: none  !important; }
          .mobile-only  { display: flex  !important; }
        }
        @keyframes dropIn {
          from { opacity:0; transform:translateX(-50%) translateY(-8px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
      `}</style>
    </header>
  );
}
