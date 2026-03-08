"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_GROUPS = [
  {
    label: "홈",
    emoji: "🏠",
    items: [
      { href: "/", label: "홈" },
      { href: "/notice", label: "공지" },
    ],
  },
  {
    label: "우리반",
    emoji: "👥",
    items: [
      { href: "/teacher", label: "담임 소개" },
      { href: "/wall", label: "학생 소개" },
      { href: "/campaign", label: "공약" },
    ],
  },
  {
    label: "활동",
    emoji: "📋",
    items: [
      { href: "/schedule", label: "일정/수행" },
      { href: "/habits", label: "90일 습관" },
      { href: "/roles", label: "1인1역할" },
    ],
  },
  {
    label: "소통",
    emoji: "💬",
    items: [
      { href: "/counseling", label: "상담" },
      { href: "/pledges", label: "규칙" },
    ],
  },
];

export default function NavBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
    setOpenGroup(null);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.96)" : "#fff",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
        boxShadow: scrolled ? "var(--shadow-md)" : "none",
        transition: "box-shadow 0.2s, background 0.2s",
      }}
    >
      <nav
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "0 20px",
          height: 62,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        {/* ── Logo ── */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 11,
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: "-0.5px",
              boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
              flexShrink: 0,
            }}
          >
            2·2
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: 16,
              color: "var(--text)",
              letterSpacing: "-0.4px",
            }}
          >
            우리반
          </span>
        </Link>

        {/* ── Desktop Nav ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flex: 1,
            justifyContent: "center",
          }}
          className="desktop-only"
        >
          {NAV_GROUPS.map((group) => (
            <div
              key={group.label}
              style={{ position: "relative" }}
              onMouseEnter={() => setOpenGroup(group.label)}
              onMouseLeave={() => setOpenGroup(null)}
            >
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "7px 14px",
                  borderRadius: 10,
                  border: "none",
                  background:
                    openGroup === group.label
                      ? "var(--primary-light)"
                      : "transparent",
                  color:
                    openGroup === group.label
                      ? "var(--primary)"
                      : "var(--text-muted)",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                  letterSpacing: "-0.2px",
                }}
              >
                <span>{group.emoji}</span>
                <span>{group.label}</span>
                <span style={{ fontSize: 9, opacity: 0.5, marginLeft: 2 }}>▾</span>
              </button>

              {openGroup === group.label && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#fff",
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    boxShadow: "var(--shadow-lg)",
                    padding: "6px",
                    minWidth: 140,
                    animation: "dropIn 0.15s ease",
                  }}
                >
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "9px 14px",
                        borderRadius: 10,
                        color: isActive(item.href)
                          ? "var(--primary)"
                          : "var(--text)",
                        background: isActive(item.href)
                          ? "var(--primary-light)"
                          : "transparent",
                        fontSize: 14,
                        fontWeight: isActive(item.href) ? 700 : 500,
                        textDecoration: "none",
                        transition: "background 0.1s",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) =>
                        !isActive(item.href) &&
                        (e.currentTarget.style.background = "#f8faff")
                      }
                      onMouseLeave={(e) =>
                        !isActive(item.href) &&
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Right side ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Link
            href="/schedule"
            style={{
              padding: "9px 18px",
              borderRadius: 999,
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
              boxShadow: "0 2px 10px rgba(99,102,241,0.28)",
              whiteSpace: "nowrap",
              letterSpacing: "-0.2px",
              transition: "all 0.15s",
            }}
          >
            오늘의 일정
          </Link>

          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="mobile-only"
            style={{
              width: 40,
              height: 40,
              borderRadius: 11,
              border: "1.5px solid var(--border)",
              background: mobileOpen ? "var(--primary-light)" : "#fff",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              flexShrink: 0,
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  display: "block",
                  width: 16,
                  height: 2,
                  borderRadius: 2,
                  background: mobileOpen ? "var(--primary)" : "var(--text-muted)",
                  transition: "all 0.2s",
                  transform:
                    mobileOpen && i === 0
                      ? "rotate(45deg) translate(5px, 5px)"
                      : mobileOpen && i === 2
                      ? "rotate(-45deg) translate(5px, -5px)"
                      : "none",
                  opacity: mobileOpen && i === 1 ? 0 : 1,
                }}
              />
            ))}
          </button>
        </div>
      </nav>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div
          className="mobile-only"
          style={{
            borderTop: "1px solid var(--border)",
            background: "#fff",
            padding: "12px 20px 20px",
          }}
        >
          {NAV_GROUPS.map((group) => (
            <div key={group.label} style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 14 }}>{group.emoji}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text-subtle)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {group.label}
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 999,
                      background: isActive(item.href)
                        ? "linear-gradient(135deg, #3b82f6, #6366f1)"
                        : "var(--border-light, #f0f3fa)",
                      color: isActive(item.href) ? "#fff" : "var(--text-muted)",
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: "none",
                      letterSpacing: "-0.2px",
                    }}
                  >
                    {item.label}
                  </Link>
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
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </header>
  );
}
