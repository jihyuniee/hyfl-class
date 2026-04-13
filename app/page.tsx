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

// ── 2학년 2반 실제 시간표 ──
type Period = { subject: string; teacher: string };
const PERIOD_TIMES = ["08:10", "09:10", "10:10", "11:10", "13:10", "14:10", "15:10"];
const TIMETABLE: Record<string, Period[]> = {
  "월": [
    { subject: "중독",    teacher: "유지민" },
    { subject: "심작",    teacher: "강민지" },
    { subject: "사문",    teacher: "백지연" },
    { subject: "문학",    teacher: "정규성" },
    { subject: "고전읽기",teacher: "" },
    { subject: "고전읽기",teacher: "" },
    { subject: "대수",    teacher: "김진아" },
  ],
  "화": [
    { subject: "인탐",    teacher: "이지현" },
    { subject: "진로",    teacher: "양홀민" },
    { subject: "심작",    teacher: "크래그" },
    { subject: "중문",    teacher: "박의경" },
    { subject: "중독",    teacher: "조홀매" },
    { subject: "사문",    teacher: "정욱군" },
    { subject: "국제",    teacher: "구미연" },
  ],
  "수": [
    { subject: "인탐",    teacher: "이지현" },
    { subject: "중독",    teacher: "유지민" },
    { subject: "중문",    teacher: "조홀매" },
    { subject: "체육",    teacher: "노재호" },
    { subject: "문학",    teacher: "김영은" },
    { subject: "HR/CA",   teacher: "" },
    { subject: "HR/CA",   teacher: "" },
  ],
  "목": [
    { subject: "대수",    teacher: "김진아" },
    { subject: "심작",    teacher: "신수진" },
    { subject: "중독",    teacher: "조홀매" },
    { subject: "체육",    teacher: "노재호" },
    { subject: "고탐",    teacher: "김담이" },
    { subject: "중문",    teacher: "박의경" },
    { subject: "사문",    teacher: "정욱군" },
  ],
  "금": [
    { subject: "국제",    teacher: "최규동" },
    { subject: "심작",    teacher: "강민지" },
    { subject: "인탐",    teacher: "이지현" },
    { subject: "중독",    teacher: "유지민" },
    { subject: "중문",    teacher: "박의경" },
    { subject: "대수",    teacher: "김진아" },
    { subject: "문학",    teacher: "김영은" },
  ],
};
const SUBJECT_COLOR: Record<string, { bg: string; color: string }> = {
  "중독":    { bg: "#fff7ed", color: "#ea580c" },
  "심작":    { bg: "#fdf2f8", color: "#db2777" },
  "사문":    { bg: "#f5f3ff", color: "#7c3aed" },
  "문학":    { bg: "#fff1f2", color: "#e11d48" },
  "고전읽기":{ bg: "#f0fdfa", color: "#0f766e" },
  "대수":    { bg: "#eff6ff", color: "#2563eb" },
  "인탐":    { bg: "#faf5ff", color: "#9333ea" },
  "진로":    { bg: "#fefce8", color: "#ca8a04" },
  "중문":    { bg: "#fff7ed", color: "#c2410c" },
  "체육":    { bg: "#f0fdf4", color: "#16a34a" },
  "국제":    { bg: "#f0f9ff", color: "#0284c7" },
  "고탐":    { bg: "#fdf4ff", color: "#a21caf" },
  "HR/CA":   { bg: "#f8fafc", color: "#64748b" },
};

const QUICK_LINKS = [
  { href: "/schedule",   emoji: "📅", label: "일정·수행", accent: "#6366f1", bg: "#eef2ff" },
  { href: "/notice",     emoji: "📢", label: "공지사항",  accent: "#f43f5e", bg: "#fff1f2" },
  { href: "/counseling", emoji: "💬", label: "상담",      accent: "#059669", bg: "#ecfdf5" },
  { href: "/habits",     emoji: "💪", label: "90일 습관", accent: "#7c3aed", bg: "#f5f3ff" },
  { href: "/roles",      emoji: "🙋", label: "1인1역할",  accent: "#ea580c", bg: "#fff7ed" },
  { href: "/wall",       emoji: "🌸", label: "학생 소개", accent: "#db2777", bg: "#fdf2f8" },
  { href: "/todo",       emoji: "✅", label: "나의 할일", accent: "#0284c7", bg: "#f0f9ff" },
  { href: "/meal",       emoji: "🍱", label: "급식",      accent: "#ca8a04", bg: "#fefce8" },
];

// ── ETUDE 스타일 섹션 헤더 ──
function SectionHeader({ sub, title }: { sub: string; title: string }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 28 }}>
      <p style={{
        fontSize: 11, fontWeight: 800, letterSpacing: "0.18em",
        textTransform: "uppercase", color: "#f472b6", margin: "0 0 6px",
      }}>✦ {sub} ✦</p>
      <h2 style={{
        fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 900,
        color: "#1a0a2e", margin: 0, letterSpacing: "-0.5px",
      }}>{title}</h2>
      <div style={{
        width: 36, height: 2.5, borderRadius: 2,
        background: "linear-gradient(90deg,#f472b6,#a78bfa)",
        margin: "10px auto 0",
      }}/>
    </div>
  );
}

export default function Home() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [heroSrc, setHeroSrc] = useState("/class-photo2.jpg");

  const today     = new Date();
  const dayNames  = ["일", "월", "화", "수", "목", "금", "토"];
  const todayName = dayNames[today.getDay()];
  const todayFmt  = `${today.getMonth() + 1}월 ${today.getDate()}일 (${todayName})`;

  const ddayItems = [
    { label: "수능",     emoji: "🎓", d: dday(SUNEUNG), accent: "#6366f1" },
    { label: "중간고사", emoji: "📝", d: dday(EXAM),    accent: "#f43f5e" },
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
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* ══════════════════════════════════════════════
          FULL-BLEED HERO
      ══════════════════════════════════════════════ */}
      <div style={{
        marginLeft:  "clamp(-40px, -4vw, -14px)",
        marginRight: "clamp(-40px, -4vw, -14px)",
        marginTop:   "clamp(-28px, -3vw, -16px)",
        position: "relative",
        height: "clamp(300px, 56vw, 620px)",
      }}>
        <Image
          src={heroSrc} alt="2-2 우리반" fill priority
          style={{ objectFit: "cover", objectPosition: "center 40%" }}
          onError={() => setHeroSrc("/class-photo.jpg")}
        />
        {/* 좌상단 → 우하단 대각선 그라데이션 */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(140deg, rgba(8,3,28,0.80) 0%, rgba(8,3,28,0.45) 30%, rgba(0,0,0,0.0) 58%)",
        }}/>

        {/* 텍스트 — 좌상단 */}
        <div style={{ position: "absolute", top: 0, left: 0, padding: "clamp(20px,3vw,36px) clamp(20px,3vw,40px)" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.14)", backdropFilter: "blur(12px)",
            borderRadius: 999, padding: "5px 14px", marginBottom: 14,
            border: "1px solid rgba(255,255,255,0.24)",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#fb7185", display: "inline-block" }}/>
            <span style={{ fontSize: 11, color: "#fff", fontWeight: 700, letterSpacing: "0.08em" }}>
              2026 한영외고 2학년 2반
            </span>
          </div>
          <h1 style={{
            color: "#fff", fontSize: "clamp(24px, 4.2vw, 52px)",
            fontWeight: 900, margin: "0 0 16px", letterSpacing: "-1.5px",
            lineHeight: 1.1, textShadow: "0 3px 24px rgba(0,0,0,0.35)",
          }}>
            안녕하세요,<br/>우리반! 🌸
          </h1>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 9,
            background: "rgba(255,255,255,0.12)", backdropFilter: "blur(16px)",
            borderRadius: 13, padding: "8px 15px",
            border: "1px solid rgba(255,255,255,0.22)",
          }}>
            <span style={{ fontSize: 18 }}>🌟</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", letterSpacing: "-0.2px" }}>
                Oh, my God! 오 내 신!
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>우리반 급훈</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          D-DAY 스트립
      ══════════════════════════════════════════════ */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        background: "#fff",
        borderBottom: "1.5px solid #f0e6f6",
        marginLeft:  "clamp(-40px, -4vw, -14px)",
        marginRight: "clamp(-40px, -4vw, -14px)",
      }}>
        {/* 오늘 날짜 */}
        <div style={{
          padding: "20px 24px",
          borderRight: "1.5px solid #f0e6f6",
          display: "flex", flexDirection: "column", gap: 3,
        }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#b8a8c8" }}>TODAY</p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#1a0a2e" }}>{todayFmt}</p>
        </div>

        {/* D-day 카드들 */}
        {ddayItems.map((item, i) => (
          <div key={item.label} style={{
            padding: "20px 24px",
            borderRight: i === 0 ? "1.5px solid #f0e6f6" : "none",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14, flexShrink: 0,
              background: `${item.accent}18`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>{item.emoji}</div>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 800, color: "#b8a8c8", letterSpacing: "0.1em", textTransform: "uppercase" }}>{item.label}</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: "-1.5px", color: item.accent }}>
                D-{item.d}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          바로가기 (ETUDE "Hot Deals" style)
      ══════════════════════════════════════════════ */}
      <section style={{ padding: "48px 0 40px" }}>
        <SectionHeader sub="Quick Menu" title="바로가기" />

        {/* 가로 스크롤 카드 */}
        <div style={{
          display: "flex", gap: 12, overflowX: "auto",
          padding: "4px 2px 16px",
          scrollbarWidth: "none",
          marginLeft:  "clamp(-40px, -4vw, -14px)",
          marginRight: "clamp(-40px, -4vw, -14px)",
          paddingLeft: "clamp(14px, 4vw, 40px)",
          paddingRight: "clamp(14px, 4vw, 40px)",
        }}>
          {QUICK_LINKS.map(item => (
            <Link key={item.href} href={item.href} style={{
              textDecoration: "none", flexShrink: 0,
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 10, padding: "22px 16px",
              width: 110,
              background: "#fff",
              borderRadius: 20,
              border: "1.5px solid #f0e6f6",
              boxShadow: "0 2px 12px rgba(167,139,250,0.08)",
              transition: "transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s",
              position: "relative",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = `0 14px 32px ${item.accent}1a`;
                e.currentTarget.style.borderColor = `${item.accent}44`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 2px 12px rgba(167,139,250,0.08)";
                e.currentTarget.style.borderColor = "#f0e6f6";
              }}
            >
              {item.href === "/notice" && newCount > 0 && (
                <span style={{
                  position: "absolute", top: 10, right: 10,
                  width: 18, height: 18, borderRadius: 999,
                  background: "#f43f5e", color: "#fff",
                  fontSize: 9, fontWeight: 900,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(244,63,94,0.4)",
                }}>{newCount}</span>
              )}
              <div style={{
                width: 52, height: 52, borderRadius: 18,
                background: item.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24,
              }}>{item.emoji}</div>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#1a0a2e", letterSpacing: "-0.2px", textAlign: "center" }}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          시간표
      ══════════════════════════════════════════════ */}
      <section style={{ padding: "8px 0 48px" }}>
        <SectionHeader sub="Schedule" title="이번 주 시간표" />

        <div style={{
          background: "#fff",
          border: "1.5px solid #f0e6f6",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(167,139,250,0.08)",
        }}>
          <div style={{ overflowX: "auto", padding: "16px 18px 20px" }}>
            <div style={{ minWidth: 380 }}>

              {/* 요일 헤더 */}
              <div style={{ display: "grid", gridTemplateColumns: "52px repeat(5,1fr)", gap: 6, marginBottom: 8 }}>
                <div/>
                {Object.keys(TIMETABLE).map(day => (
                  <div key={day} style={{
                    textAlign: "center", padding: "7px 4px", borderRadius: 12,
                    background: day === todayName
                      ? "linear-gradient(135deg,#f472b6,#a78bfa)"
                      : "#fdf2f8",
                    fontSize: 13, fontWeight: 900,
                    color: day === todayName ? "#fff" : "#b8a8c8",
                    boxShadow: day === todayName ? "0 4px 12px rgba(244,114,182,0.30)" : "none",
                  }}>{day}</div>
                ))}
              </div>

              {/* 교시별 행 */}
              {[0,1,2,3,4,5,6].map(idx => (
                <div key={idx} style={{
                  display: "grid", gridTemplateColumns: "52px repeat(5,1fr)", gap: 6, marginBottom: 5,
                }}>
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#b8a8c8" }}>{idx + 1}교시</span>
                    <span style={{ fontSize: 9, color: "#d4c8de" }}>{PERIOD_TIMES[idx]}</span>
                  </div>

                  {Object.entries(TIMETABLE).map(([day, periods]) => {
                    const p      = periods[idx];
                    const name   = p?.subject ?? "";
                    const colors = SUBJECT_COLOR[name] ?? { bg: "#f9fafb", color: "#9ca3af" };
                    const isToday = day === todayName;
                    return (
                      <div key={day} style={{
                        textAlign: "center", padding: "5px 3px", borderRadius: 10,
                        background: isToday ? colors.bg : "#fafafa",
                        border: isToday ? `1.5px solid ${colors.color}28` : "1.5px solid transparent",
                      }}>
                        <div style={{ fontSize: 11, fontWeight: isToday ? 800 : 500, color: isToday ? colors.color : "#c4b5d4", lineHeight: 1.3 }}>{name}</div>
                        {p?.teacher && isToday && (
                          <div style={{ fontSize: 9, color: colors.color, opacity: 0.65, marginTop: 1, fontWeight: 600 }}>{p.teacher}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          공지사항
      ══════════════════════════════════════════════ */}
      <section style={{ paddingBottom: 16 }}>
        <SectionHeader
          sub="Notice"
          title={newCount > 0 ? `공지사항 · NEW ${newCount}` : "공지사항"}
        />

        <div style={{
          background: "#fff",
          border: "1.5px solid #f0e6f6",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(167,139,250,0.08)",
        }}>
          {/* 상단 전체보기 바 */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "flex-end",
            padding: "14px 20px 0",
          }}>
            <Link href="/notice" style={{
              fontSize: 12, fontWeight: 800, color: "#f472b6",
              textDecoration: "none", display: "flex", alignItems: "center", gap: 3,
            }}>전체보기 →</Link>
          </div>

          <div style={{ padding: "8px 16px 16px" }}>
            {notices.length === 0 ? (
              <p style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: "#b8a8c8", margin: 0 }}>
                등록된 공지가 없습니다
              </p>
            ) : notices.map((n, i) => (
              <Link key={n.id} href="/notice" style={{ textDecoration: "none" }}>
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 10px", borderRadius: 14,
                    borderBottom: i < notices.length - 1 ? "1px solid #fdf4ff" : "none",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fdf2f8")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {/* 번호/핀 */}
                  <div style={{
                    width: 28, height: 28, borderRadius: 10, flexShrink: 0,
                    background: n.is_pinned
                      ? "linear-gradient(135deg,#fbbf24,#f43f5e)"
                      : "linear-gradient(135deg,#f9a8d4,#c084fc)",
                    color: "#fff", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: n.is_pinned ? 12 : 11, fontWeight: 900,
                  }}>
                    {n.is_pinned ? "📌" : i + 1}
                  </div>

                  <span style={{
                    fontSize: 13, color: "#1a0a2e", fontWeight: 600, flex: 1,
                    minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{n.title}</span>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {isNew(n.created_at) && (
                      <span style={{
                        fontSize: 9, fontWeight: 900, color: "#fff",
                        background: "linear-gradient(135deg,#f43f5e,#f472b6)",
                        padding: "2px 7px", borderRadius: 999,
                      }}>NEW</span>
                    )}
                    <span style={{ fontSize: 11, color: "#b8a8c8" }}>{timeAgo(n.created_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
