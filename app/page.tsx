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
  { href: "/schedule",   emoji: "📅", label: "일정/수행", color: "#3b82f6",  bg: "linear-gradient(135deg,#eff6ff,#dbeafe)" },
  { href: "/counseling", emoji: "💬", label: "상담",      color: "#10b981",  bg: "linear-gradient(135deg,#ecfdf5,#d1fae5)" },
  { href: "/habits",     emoji: "💪", label: "90일 습관", color: "#8b5cf6",  bg: "linear-gradient(135deg,#f5f3ff,#ede9fe)" },
  { href: "/roles",      emoji: "🙋", label: "1인1역할",  color: "#f97316",  bg: "linear-gradient(135deg,#fff7ed,#ffedd5)" },
  { href: "/wall",       emoji: "🌸", label: "학생 소개", color: "#ec4899",  bg: "linear-gradient(135deg,#fdf2f8,#fce7f3)" },
  { href: "/notice",     emoji: "📢", label: "공지",      color: "#0ea5e9",  bg: "linear-gradient(135deg,#f0f9ff,#e0f2fe)" },
];

export default function Home() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [heroSrc, setHeroSrc] = useState("/class-photo2.jpg");

  const ddayData = [
    { label: "수능",     date: SUNEUNG, emoji: "🎓", d: dday(SUNEUNG), from: "#6366f1", to: "#a78bfa" },
    { label: "중간고사", date: EXAM,    emoji: "📝", d: dday(EXAM),    from: "#f43f5e", to: "#fb923c" },
  ];

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
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ─────────── HERO ─────────── */}
      <div style={{
        borderRadius: 32, overflow: "hidden", position: "relative",
        boxShadow: "0 32px 80px rgba(244,63,94,0.18), 0 8px 24px rgba(0,0,0,0.10)",
      }}>
        {/* 사진 */}
        <div style={{ position: "relative", width: "100%", height: "clamp(300px, 56vw, 580px)" }}>
          <Image
            src={heroSrc} alt="2-2 우리반" fill priority
            style={{ objectFit: "cover", objectPosition: "center 55%" }}
            onError={() => setHeroSrc("/class-photo.jpg")}
          />
          {/* 오버레이 */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(170deg, rgba(0,0,0,0.0) 25%, rgba(0,0,0,0.08) 55%, rgba(8,2,28,0.78) 100%)",
          }}/>
        </div>

        {/* 상단 뱃지 */}
        <div style={{ position: "absolute", top: 20, left: 24 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: "rgba(255,255,255,0.18)", backdropFilter: "blur(16px)",
            borderRadius: 999, padding: "6px 16px",
            border: "1px solid rgba(255,255,255,0.28)",
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fb7185", display: "inline-block" }}/>
            <span style={{ fontSize: 11, color: "#fff", fontWeight: 700, letterSpacing: "0.06em" }}>
              2026 한영외고 2학년 2반
            </span>
          </div>
        </div>

        {/* 하단 텍스트 */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "40px 36px 36px" }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 700, margin: "0 0 8px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Our Class · 우리반
          </p>
          <h1 style={{
            color: "#fff", fontSize: "clamp(30px,5.5vw,58px)",
            fontWeight: 900, margin: "0 0 20px", letterSpacing: "-1.5px",
            lineHeight: 1.08, textShadow: "0 4px 24px rgba(0,0,0,0.30)",
          }}>
            안녕하세요,<br/>우리반! 🌸
          </h1>
          {/* 급훈 태그 */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "rgba(255,255,255,0.13)", backdropFilter: "blur(20px)",
            borderRadius: 14, padding: "10px 18px",
            border: "1px solid rgba(255,255,255,0.22)",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: "linear-gradient(135deg,#f472b6,#a78bfa)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
            }}>🌟</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", letterSpacing: "-0.3px" }}>Oh, my God! 오 내 신!</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: 600, marginTop: 1 }}>우리반 급훈 · Class Motto</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────── D-DAY ─────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(175px,1fr))", gap: 14 }}>
        {ddayData.map(item => (
          <div key={item.label} style={{
            borderRadius: 24, padding: "26px 24px", overflow: "hidden", position: "relative",
            background: `linear-gradient(135deg, ${item.from}, ${item.to})`,
            boxShadow: `0 12px 36px ${item.from}44`,
          }}>
            {/* 배경 장식 */}
            <div style={{ position: "absolute", width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.10)", top: -30, right: -24 }}/>
            <div style={{ position: "absolute", width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.07)", bottom: 12, left: 16 }}/>
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                <span style={{ fontSize: 18 }}>{item.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.90)", letterSpacing: "0.02em" }}>{item.label}</span>
              </div>
              <div style={{ fontSize: 46, fontWeight: 900, color: "#fff", letterSpacing: "-3px", lineHeight: 1, marginBottom: 8 }}>
                D-{item.d}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>{item.date}</div>
            </div>
          </div>
        ))}

        {/* 오늘 체크 */}
        <div style={{
          borderRadius: 24, padding: "24px",
          background: "#fff",
          border: "1.5px solid #f0e4f8",
          boxShadow: "0 4px 20px rgba(244,114,182,0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 10,
              background: "linear-gradient(135deg,#fde68a,#fb923c)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
              boxShadow: "0 3px 8px rgba(251,146,60,0.35)",
            }}>☀️</div>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.2px" }}>오늘 체크</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: "📋", text: "수행평가 마감 확인" },
              { icon: "📢", text: "공지 새 글 확인" },
              { icon: "💬", text: "상담 신청 여부" },
            ].map(t => (
              <div key={t.text} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg,#f472b6,#a78bfa)",
                }}/>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────── 빠른 이동 ─────────── */}
      <div>
        {/* 섹션 헤더 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 4, height: 20, borderRadius: 2, background: "linear-gradient(to bottom,#f43f5e,#a78bfa)" }}/>
            <span style={{ fontSize: 15, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.4px" }}>빠른 이동</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {QUICK_LINKS.map(item => (
            <Link key={item.href} href={item.href} style={{
              textDecoration: "none", position: "relative",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 8, padding: "22px 12px",
              background: item.bg,
              borderRadius: 20,
              border: "1.5px solid rgba(255,255,255,0.8)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              transition: "transform 0.18s cubic-bezier(.34,1.56,.64,1), box-shadow 0.18s",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px) scale(1.02)";
                e.currentTarget.style.boxShadow = `0 12px 32px ${item.color}28`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)";
              }}
            >
              {/* 공지 NEW 배지 */}
              {item.href === "/notice" && newCount > 0 && (
                <span style={{
                  position: "absolute", top: 10, right: 10,
                  minWidth: 20, height: 20, borderRadius: 999, padding: "0 6px",
                  background: "linear-gradient(135deg,#f43f5e,#fb923c)",
                  color: "#fff", fontSize: 10, fontWeight: 900,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(244,63,94,0.5)",
                }}>{newCount}</span>
              )}
              {/* 아이콘 */}
              <div style={{
                width: 48, height: 48, borderRadius: 16, flexShrink: 0,
                background: "#fff", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 24,
                boxShadow: `0 4px 14px ${item.color}22`,
              }}>
                {item.emoji}
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.3px" }}>
                {item.label}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: item.color }}>바로가기 →</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ─────────── 공지사항 ─────────── */}
      <div style={{
        background: "#fff", borderRadius: 28,
        border: "1.5px solid #f0e4f8",
        boxShadow: "0 4px 24px rgba(244,114,182,0.08)",
        overflow: "hidden",
      }}>
        {/* 헤더 */}
        <div style={{
          padding: "22px 26px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1.5px solid #f9f0fd",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 13,
              background: "linear-gradient(135deg,#f43f5e,#f97316)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, boxShadow: "0 4px 12px rgba(244,63,94,0.30)",
            }}>📢</div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, color: "var(--text-subtle)", letterSpacing: "0.10em", textTransform: "uppercase", margin: "0 0 2px" }}>
                Notice
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: "-0.4px" }}>공지사항</h3>
                {newCount > 0 && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    minWidth: 20, height: 20, borderRadius: 999, padding: "0 6px",
                    background: "linear-gradient(135deg,#f43f5e,#fb923c)",
                    color: "#fff", fontSize: 10, fontWeight: 900,
                    boxShadow: "0 2px 6px rgba(244,63,94,0.35)",
                  }}>{newCount}</span>
                )}
              </div>
            </div>
          </div>
          <Link href="/notice" style={{
            fontSize: 12, fontWeight: 800, color: "#f43f5e",
            textDecoration: "none", padding: "7px 16px",
            borderRadius: 999, background: "#fff1f2",
            border: "1.5px solid #fecdd3",
            transition: "all 0.15s",
          }}>전체보기 →</Link>
        </div>

        {/* 목록 */}
        <div style={{ padding: "8px 16px 12px" }}>
          {notices.length === 0 ? (
            <p style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: "var(--text-subtle)", margin: 0 }}>
              등록된 공지가 없습니다
            </p>
          ) : notices.map((n, i) => (
            <Link key={n.id} href="/notice" style={{ textDecoration: "none" }}>
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 10px", borderRadius: 14,
                  borderBottom: i < notices.length - 1 ? "1px solid #fdf2f8" : "none",
                  transition: "background 0.12s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#fff1f2")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                  background: n.is_pinned
                    ? "linear-gradient(135deg,#fbbf24,#f43f5e)"
                    : "linear-gradient(135deg,#f472b6,#a78bfa)",
                  color: "#fff", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: n.is_pinned ? 13 : 11, fontWeight: 800,
                }}>
                  {n.is_pinned ? "📌" : i + 1}
                </div>
                <span style={{
                  fontSize: 14, color: "var(--text)", fontWeight: 600, flex: 1, minWidth: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {n.title}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  {isNew(n.created_at) && (
                    <span style={{
                      fontSize: 9, fontWeight: 900, color: "#fff",
                      background: "linear-gradient(135deg,#f43f5e,#fb923c)",
                      padding: "2px 8px", borderRadius: 999, letterSpacing: "0.05em",
                    }}>NEW</span>
                  )}
                  <span style={{ fontSize: 11, color: "var(--text-subtle)", fontWeight: 500 }}>{timeAgo(n.created_at)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
