"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type Notice = {
  id: string;
  created_at: string;
  title: string;
  is_pinned: boolean;
};

function dday(target: string) {
  const today = new Date();
  const t = new Date(target);
  today.setHours(0, 0, 0, 0);
  t.setHours(0, 0, 0, 0);
  return Math.ceil((t.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function isNew(dateStr: string) {
  return Date.now() - new Date(dateStr).getTime() < 3 * 24 * 60 * 60 * 1000;
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

const SUNEUNG = "2026-11-18";
const EXAM    = "2026-04-27";

const QUICK_LINKS = [
  { href: "/schedule",   emoji: "📅", label: "일정/수행", bg: "linear-gradient(135deg,#dbeafe,#e0f2fe)", accent: "#3b82f6", border: "#bfdbfe" },
  { href: "/counseling", emoji: "💬", label: "상담",      bg: "linear-gradient(135deg,#dcfce7,#d1fae5)", accent: "#22c55e", border: "#bbf7d0" },
  { href: "/habits",     emoji: "💪", label: "90일 습관", bg: "linear-gradient(135deg,#f3e8ff,#ede9fe)", accent: "#a855f7", border: "#e9d5ff" },
  { href: "/roles",      emoji: "🙋", label: "1인1역할",  bg: "linear-gradient(135deg,#ffedd5,#fef3c7)", accent: "#f97316", border: "#fed7aa" },
  { href: "/wall",       emoji: "🌸", label: "학생 소개", bg: "linear-gradient(135deg,#fce7f3,#fdf2f8)", accent: "#ec4899", border: "#fbcfe8" },
  { href: "/notice",     emoji: "📢", label: "공지",      bg: "linear-gradient(135deg,#e0f2fe,#f0f9ff)", accent: "#0ea5e9", border: "#bae6fd" },
];

const DDAYS = [
  { label: "수능",     date: SUNEUNG, emoji: "🎓", grad: "linear-gradient(135deg,#6366f1,#a78bfa)", shadow: "rgba(99,102,241,0.35)" },
  { label: "중간고사", date: EXAM,    emoji: "📝", grad: "linear-gradient(135deg,#f97316,#f472b6)", shadow: "rgba(249,115,22,0.35)" },
];

export default function Home() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [heroSrc, setHeroSrc] = useState("/class-photo2.jpg");
  const ddays = DDAYS.map(d => ({ ...d, d: dday(d.date) }));

  useEffect(() => {
    supabase
      .from("notices")
      .select("id, created_at, title, is_pinned")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setNotices((data as Notice[]) ?? []));
  }, []);

  const newCount = notices.filter(n => isNew(n.created_at)).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── 히어로 ── */}
      <div style={{
        borderRadius: 28, overflow: "hidden", position: "relative",
        boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
        background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#4c1d95 100%)",
      }}>
        {/* 사진 */}
        <div style={{ position: "relative", width: "100%", height: "clamp(300px, 52vw, 560px)" }}>
          <Image
            src={heroSrc}
            alt="2-2 우리반"
            fill
            style={{ objectFit: "cover", objectPosition: "center 35%" }}
            priority
            onError={() => setHeroSrc("/class-photo.jpg")}
          />
          {/* 그라데이션 오버레이 */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.15) 40%, rgba(15,10,40,0.80) 80%, rgba(15,10,40,0.95) 100%)",
          }}/>
          {/* 상단 뱃지 */}
          <div style={{ position: "absolute", top: 20, left: 24 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)",
              borderRadius: 999, padding: "6px 16px",
              border: "1px solid rgba(255,255,255,0.25)",
            }}>
              <span style={{ fontSize: 13 }}>🌸</span>
              <span style={{ fontSize: 12, color: "#fff", fontWeight: 700, letterSpacing: "0.02em" }}>
                2026학년도 한영외고 2학년 2반
              </span>
            </div>
          </div>
        </div>

        {/* 텍스트 오버레이 */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "32px 36px 36px",
        }}>
          <h1 style={{
            color: "#fff", fontSize: "clamp(24px,4.5vw,44px)",
            fontWeight: 900, margin: "0 0 14px", letterSpacing: "-0.8px",
            textShadow: "0 4px 24px rgba(0,0,0,0.5)",
            lineHeight: 1.15,
          }}>
            안녕하세요,<br/>우리반! 🌟
          </h1>
          {/* 급훈 */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 12,
            background: "rgba(255,255,255,0.12)", backdropFilter: "blur(16px)",
            borderRadius: 18, padding: "12px 20px",
            border: "1px solid rgba(255,255,255,0.22)",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12, flexShrink: 0,
              background: "linear-gradient(135deg,#f472b6,#a78bfa)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>🌟</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: "-0.3px" }}>
                Oh, my God! 오 내 신!
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.70)", fontWeight: 600, marginTop: 2 }}>
                우리반 급훈
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── D-day + 오늘 체크 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 14 }}>
        {ddays.map((item) => (
          <div key={item.label} style={{
            background: item.grad, borderRadius: 24, padding: "24px 26px",
            boxShadow: `0 10px 32px ${item.shadow}`,
            border: "1.5px solid rgba(255,255,255,0.25)",
            position: "relative", overflow: "hidden",
          }}>
            {/* 배경 원 장식 */}
            <div style={{
              position: "absolute", width: 120, height: 120, borderRadius: "50%",
              background: "rgba(255,255,255,0.07)", top: -30, right: -20,
            }}/>
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 22 }}>{item.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.92)" }}>{item.label}</span>
              </div>
              <div style={{ fontSize: 40, fontWeight: 900, color: "#fff", letterSpacing: "-2.5px", lineHeight: 1 }}>
                D-{item.d}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 8, fontWeight: 600 }}>{item.date}</div>
            </div>
          </div>
        ))}

        {/* 오늘 체크 */}
        <div style={{
          borderRadius: 24, padding: "24px 26px",
          background: "linear-gradient(135deg,#fff5f9,#f5f0ff)",
          border: "1.5px solid #f9d0ea",
          boxShadow: "0 6px 24px rgba(244,114,182,0.13)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg,#f472b6,#a78bfa)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>☀️</div>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>오늘 체크</span>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { text: "수행평가 마감 확인", icon: "📋" },
              { text: "공지 새 글 확인",    icon: "📢" },
              { text: "상담 신청 필요 여부", icon: "💬" },
            ].map((t) => (
              <li key={t.text} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>
                <span style={{ fontSize: 14 }}>{t.icon}</span>
                {t.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── 빠른 이동 ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <p className="hy-section-label" style={{ margin: 0 }}>빠른 이동</p>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }}/>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12 }}>
          {QUICK_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="hy-quick-link"
              style={{ background: item.bg, border: `1.5px solid ${item.border}`, position: "relative" }}>
              {item.href === "/notice" && newCount > 0 && (
                <span style={{
                  position: "absolute", top: 10, right: 10,
                  minWidth: 20, height: 20, borderRadius: 999, padding: "0 6px",
                  background: "linear-gradient(135deg,#ef4444,#f97316)",
                  color: "#fff", fontSize: 11, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(239,68,68,0.5)",
                }}>
                  {newCount}
                </span>
              )}
              <span style={{ fontSize: 28 }}>{item.emoji}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.3px" }}>
                {item.label}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: item.accent }}>바로가기 →</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── 최근 공지 ── */}
      <div className="hy-card" style={{ padding: "26px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12, flexShrink: 0,
              background: "linear-gradient(135deg,#0ea5e9,#6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>📢</div>
            <div>
              <p className="hy-section-label" style={{ marginBottom: 2 }}>최근 공지</p>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: "-0.3px", display: "flex", alignItems: "center", gap: 8 }}>
                공지사항
                {newCount > 0 && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    minWidth: 22, height: 22, borderRadius: 999, padding: "0 7px",
                    background: "linear-gradient(135deg,#ef4444,#f97316)",
                    color: "#fff", fontSize: 11, fontWeight: 800,
                    boxShadow: "0 2px 8px rgba(239,68,68,0.35)",
                  }}>
                    {newCount}
                  </span>
                )}
              </h3>
            </div>
          </div>
          <Link href="/notice" style={{
            fontSize: 13, fontWeight: 700, color: "var(--primary)", textDecoration: "none",
            padding: "6px 14px", borderRadius: 999,
            background: "var(--primary-light)", border: "1.5px solid #f9d0ea",
          }}>
            전체보기 →
          </Link>
        </div>

        {notices.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <p style={{ fontSize: 13, color: "var(--text-subtle)", margin: 0 }}>공지가 없습니다</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {notices.map((n, i) => (
              <Link key={n.id} href="/notice" style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", borderRadius: 14,
                  transition: "background 0.12s",
                  borderBottom: i < notices.length - 1 ? "1px solid var(--border)" : "none",
                  cursor: "pointer",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--primary-light)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: 10, flexShrink: 0,
                    background: n.is_pinned
                      ? "linear-gradient(135deg,#f59e0b,#ef4444)"
                      : "linear-gradient(135deg,#f472b6,#a78bfa)",
                    color: "#fff", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: n.is_pinned ? 13 : 12, fontWeight: 800,
                  }}>
                    {n.is_pinned ? "📌" : i + 1}
                  </span>
                  <span style={{
                    fontSize: 14, color: "var(--text)", fontWeight: 600,
                    flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {n.title}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {isNew(n.created_at) && (
                      <span style={{
                        fontSize: 10, fontWeight: 800, color: "#fff",
                        background: "linear-gradient(135deg,#ef4444,#f97316)",
                        padding: "2px 8px", borderRadius: 999,
                      }}>NEW</span>
                    )}
                    <span style={{ fontSize: 11, color: "var(--text-subtle)", fontWeight: 500 }}>
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
