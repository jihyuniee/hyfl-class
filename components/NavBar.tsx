"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/components/lib/supabaseClient";
import styles from "./NavBar.module.css";

const NAV_GROUPS = [
  {
    label: "홈", emoji: "🏠",
    items: [
      { href: "/", label: "홈" },
      { href: "/notice", label: "공지" },
      { href: "/meal", label: "급식 🍱" },
      { href: "/praise", label: "성장 기록 🌱" },
    ],
  },
  {
    label: "우리반", emoji: "👥",
    items: [
      { href: "/about", label: "학급 소개 🏫" },
      { href: "/teacher", label: "담임 소개" },
      { href: "/wall", label: "학생 소개" },
      { href: "/album", label: "앨범 📸" },
      { href: "/campaign", label: "공약" },
    ],
  },
  {
    label: "활동", emoji: "📋",
    items: [
      { href: "/todo", label: "나의 할일 ✅" },
      { href: "/schedule", label: "일정/수행" },
      { href: "/roles", label: "1인1역할" },
      { href: "/cleaning", label: "청소" },
      { href: "/study", label: "야자 신청" },
    ],
  },
  {
    label: "자율활동", emoji: "🌱",
    items: [
      { href: "/gildong-mission", label: "길동 미션톡" },
      { href: "/habits", label: "90일 습관" },
      { href: "/research", label: "심화탐구" },
      { href: "/mentor", label: "멘토·멘티" },
      { href: "/hyfl", label: "AI 대회코치 🤖" },
    ],
  },
  {
    label: "대학입시", emoji: "🎓",
    items: [
      { href: "/admissions", label: "대학입시 살펴보기 🎓" },
    ],
  },
  {
    label: "소통", emoji: "💬",
    items: [
      { href: "/counseling", label: "상담" },
      { href: "/pledges", label: "규칙" },
      { href: "/board", label: "신문고" },
      { href: "/contacts", label: "연락처 확인 🔒" },
      { href: "/hr", label: "HR 기록" },
    ],
  },
];

const QUICK_LINKS = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/notice", label: "공지", icon: "notice" },
  { href: "/schedule", label: "일정", icon: "calendar" },
  { href: "/meal", label: "급식", icon: "meal" },
  { href: "/counseling", label: "상담", icon: "chat" },
];

function MenuIcon({ name }: { name: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === "home" && <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" /></>}
      {name === "notice" && <><path d="M4 10v5h4l11 4V5L8 10Z" /><path d="m8 15 1 6H6l-1-6M8 10v5" /></>}
      {name === "calendar" && <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18m-13 5h2m4 0h2" /></>}
      {name === "meal" && <><path d="M5 3v6m3-6v6M5 7h3m-1.5 2v12M18 3c-3 3-3 8 0 8V3Zm0 8v10" /></>}
      {name === "chat" && <><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2v-10A9 9 0 0 1 21 11.5Z" /><path d="M7 11h10m-10 4h6" /></>}
      {name === "menu" && <path d="M4 6h16M4 12h16M4 18h16" />}
      {name === "close" && <path d="m6 6 12 12M6 18 18 6" />}
    </svg>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [previousPathname, setPreviousPathname] = useState(pathname);
  const [newNoticeCount, setNewNoticeCount] = useState(0);
  const headerRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset disclosures for browser history and programmatic navigation as well as link clicks.
  if (previousPathname !== pathname) {
    setPreviousPathname(pathname);
    setMobileOpen(false);
    setOpenGroup(null);
  }

  useEffect(() => {
    let active = true;
    const loadNoticeCount = async () => {
      try {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        const { count } = await supabase
          .from("notices")
          .select("id", { count: "exact", head: true })
          .gt("created_at", threeDaysAgo);
        if (active) setNewNoticeCount(count ?? 0);
      } catch {
        // Navigation remains usable when the optional notice badge cannot load.
      }
    };
    void loadNoticeCount();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const breakpoint = window.matchMedia("(min-width: 1024px)");
    const onBreakpointChange = (event: MediaQueryListEvent) => {
      setOpenGroup(null);
      if (event.matches) setMobileOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpenGroup(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !breakpoint.matches) return;
      const trigger = headerRef.current?.querySelector<HTMLButtonElement>('button[aria-expanded="true"]');
      setOpenGroup(null);
      trigger?.focus();
    };
    breakpoint.addEventListener("change", onBreakpointChange);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      breakpoint.removeEventListener("change", onBreakpointChange);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const handleEnter = (label: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenGroup(label);
  };
  const handleLeave = (groupElement: HTMLDivElement) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (!groupElement.contains(document.activeElement)) setOpenGroup(null);
    }, 160);
  };
  const closeMenus = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMobileOpen(false);
    setOpenGroup(null);
  };
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  const noticeBadge = (href: string) => href === "/notice" && newNoticeCount > 0 ? (
    <span className={styles.noticeBadge} aria-label={`새 공지 ${newNoticeCount}개`}>
      {newNoticeCount > 99 ? "99+" : newNoticeCount}
    </span>
  ) : null;

  return (
    <>
      <header ref={headerRef} className={`${styles.header} ${pathname === "/" ? styles.homeHeader : ""}`}>
        <nav className={styles.headerBar} aria-label="주 메뉴">
          <Link href="/" onClick={closeMenus} className={styles.brand} aria-label="2학년 2반 우리반 홈">
            <span className={styles.brandMark}>2·2</span>
            <span className={styles.brandText}>우리반 <span aria-hidden="true">{pathname === "/" ? "✳" : "🌸"}</span></span>
          </Link>

          <div className={styles.desktopNav}>
            {NAV_GROUPS.map((group, index) => (
              <div key={group.label} className={styles.desktopGroup}
                onPointerEnter={event => { if (event.pointerType === "mouse") handleEnter(group.label); }}
                onPointerLeave={event => { if (event.pointerType === "mouse") handleLeave(event.currentTarget); }}
                onFocus={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }}
                onBlur={event => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenGroup(null);
                }}
              >
                <button type="button" className={styles.desktopButton}
                  aria-expanded={openGroup === group.label}
                  aria-controls={`desktop-menu-${index}`}
                  data-active={group.items.some(item => isActive(item.href)) || undefined}
                  onClick={() => {
                    if (timeoutRef.current) clearTimeout(timeoutRef.current);
                    setOpenGroup(current => current === group.label ? null : group.label);
                  }}
                >
                  <span aria-hidden="true">{group.emoji}</span>
                  <span>{group.label}</span>
                  <span className={styles.chevron} aria-hidden="true">▾</span>
                </button>
                {openGroup === group.label && (
                  <div id={`desktop-menu-${index}`} className={styles.desktopDropdown}>
                    {group.items.map(item => (
                      <Link key={item.href} href={item.href} onClick={closeMenus}
                        className={styles.desktopLink} aria-current={isActive(item.href) ? "page" : undefined}>
                        <span>{item.label}</span>
                        {noticeBadge(item.href)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className={styles.headerActions}>
            <Link href="/schedule" className={styles.todayLink}>오늘의 일정 <span aria-hidden="true">✨</span></Link>
            <button type="button" onClick={() => setMobileOpen(true)} className={styles.menuButton}
              aria-haspopup="dialog" aria-expanded={mobileOpen} aria-controls="mobile-navigation">
              <MenuIcon name="menu" />
              <span>전체 메뉴</span>
            </button>
          </div>
        </nav>

        <nav className={styles.quickNav} aria-label="자주 사용하는 메뉴">
          {QUICK_LINKS.map(item => (
            <Link key={item.href} href={item.href} onClick={closeMenus} className={styles.quickLink}
              aria-current={isActive(item.href) ? "page" : undefined}>
              <MenuIcon name={item.icon} />
              <span>{item.label}</span>
              {item.href === "/notice" && newNoticeCount > 0 && (
                <span className={styles.unreadDot} aria-label={`새 공지 ${newNoticeCount}개`} />
              )}
            </Link>
          ))}
        </nav>
      </header>

      <dialog id="mobile-navigation" ref={dialogRef} className={styles.mobileDialog}
        aria-labelledby="mobile-navigation-title" onClose={() => setMobileOpen(false)}
        onClick={event => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
            setMobileOpen(false);
          }
        }}>
        <div className={styles.dialogHeader}>
          <div>
            <p className={styles.dialogEyebrow}>2학년 2반</p>
            <h2 id="mobile-navigation-title" className={styles.dialogTitle}>전체 메뉴</h2>
          </div>
          <button ref={closeButtonRef} type="button" className={styles.closeButton}
            onClick={() => setMobileOpen(false)} aria-label="전체 메뉴 닫기">
            <MenuIcon name="close" /><span>닫기</span>
          </button>
        </div>
        <nav className={styles.dialogBody} aria-label="전체 메뉴">
          {NAV_GROUPS.map((group, index) => (
            <section key={group.label} className={styles.menuGroup} aria-labelledby={`mobile-group-${index}`}>
              <h3 id={`mobile-group-${index}`} className={styles.groupTitle}>
                <span aria-hidden="true">{group.emoji}</span>{group.label}
              </h3>
              <div className={styles.menuGrid} data-single={group.items.length === 1 || undefined}>
                {group.items.map(item => (
                  <Link key={item.href} href={item.href} onClick={closeMenus} className={styles.menuLink}
                    aria-current={isActive(item.href) ? "page" : undefined}>
                    <span>{item.label}</span>
                    {noticeBadge(item.href)}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </nav>
      </dialog>
    </>
  );
}
