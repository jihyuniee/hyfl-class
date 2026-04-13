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

// ── 시간표 (실제 시간표로 수정해주세요) ──
const TIMETABLE: Record<string, string[]> = {
  "월": ["국어", "수학", "영어", "중국어", "사문", "국제", "HR"],
  "화": ["수학", "영어", "국어", "국제", "중국어", "체육", "창체"],
  "수": ["영어", "국어", "수학", "사문", "국제", "중국어", "체육"],
  "목": ["중국어", "수학", "영어", "국어", "사문", "국제", "창체"],
  "금": ["국어", "영어", "사문", "수학", "국제", "중국어", "HR"],
};

const SUBJECT_COLOR: Record<string, { bg: string; color: string }> = {
  "국어":   { bg: "#fce7f3", color: "#db2777" },
  "수학":   { bg: "#eff6ff", color: "#2563eb" },
  "영어":   { bg: "#ecfdf5", color: "#059669" },
  "중국어": { bg: "#fff7ed", color: "#ea580c" },
  "사문":   { bg: "#f5f3ff", color: "#7c3aed" },
  "국제":   { bg: "#f0f9ff", color: "#0284c7" },
  "체육":   { bg: "#fefce8", color: "#b45309" },
  "HR":     { bg: "#fff1f2", color: "#e11d48" },
  "창체":   { bg: "#f0fdf4", color: "#16a34a" },
};

const QUICK_LINKS = [
  { href: "/schedule",   emoji: "📅", label: "일정/수행", color: "#2563eb", bg: "linear-gradient(135deg,#eff6ff,#dbeafe)" },
  { href: "/counseling", emoji: "💬", label: "상담",      color: "#059669", bg: "linear-gradient(135deg,#ecfdf5,#d1fae5)" },
  { href: "/habits",     emoji: "💪", label: "90일 습관", color: "#7c3aed", bg: "linear-gradient(135deg,#f5f3ff,#ede9fe)" },
  { href: "/roles",      emoji: "🙋", label: "1인1역할",  color: "#ea580c", bg: "linear-gradient(135deg,#fff7ed,#ffedd5)" },
  { href: "/wall",       emoji: "🌸", label: "학생 소개", color: "#db2777", bg: "linear-gradient(135deg,#fdf2f8,#fce7f3)" },
  { href: "/notice",     emoji: "📢", label: "공지",      color: "#0284c7", bg: "linear-gradient(135deg,#f0f9ff,#e0f2fe)" },
];

export default function Home() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [heroSrc, setHeroSrc] = useState("/class-photo2.jpg");

  const today     = new Date();
  const dayNames  = ["일", "월", "화", "수", "목", "금", "토"];
  const todayName = dayNames[today.getDay()];

  const ddayData = [
    { label: "수능",     date: SUNEUNG, emoji: "🎓", d: dday(SUNEUNG), from: "#6366f1", to: "#8b5cf6" },
    { label: "중간고사", date: EXAM,    emoji: "📝", d: dday(EXAM),    from: "#f43f5e", to: "#fb923c" },
  ];

  useEffect(() => {
    supabase
      .from("notices")
      .select("id, created_at, title, is_pinned")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data }) => setNotices((data as Notice[]) ?? []));
  }, []);

  const newCount = notices.filter(n => isNew(n.created_at)).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ════════ HERO ════════ */}
      <div style={{
        borderRadius: 28, overflow: "hidden", position: "relative",
        boxShadow: "0 24px 64px rgba(100,80,200,0.14), 0 4px 16px rgba(0,0,0,0.08)",
      }}>
        <div style={{ position: "relative", width: "100%", height: "clamp(280px, 52vw, 540px)" }}>
          <Image
            src={heroSrc} alt="2-2 우리반" fill priority
            style={{ objectFit: "cover", objectPosition: "center 45%" }}
            onError={() => setHeroSrc("/class-photo.jpg")}
          />
          {/* 좌상단 → 우하단 대각선 그라데이션 — 학생 얼굴 보호 */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(135deg, rgba(8,3,28,0.82) 0%, rgba(8,3,28,0.50) 28%, rgba(0,0,0,0.04) 55%, rgba(0,0,0,0) 100%)",
          }}/>
        </div>

        {/* 텍스트 — 좌상단 배치 (학생과 겹치지 않음) */}
        <div style={{ position: "absolute", top: 0, left: 0, padding: "28px 32px" }}>
          {/* 뱃지 */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.16)", backdropFilter: "blur(14px)",
            borderRadius: 999, padding: "5px 14px", marginBottom: 16,
            border: "1px solid rgba(255,255,255,0.26)",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fb7185", display: "inline-block" }}/>
            <span style={{ fontSize: 11, color: "#fff", fontWeight: 700, letterSpacing: "0.06em" }}>
              2026 한영외고 2학년 2반
            </span>
          </div>

          {/* 메인 타이틀 */}
          <h1 style={{
            color: "#fff", fontSize: "clamp(26px, 4.5vw, 50px)",
            fontWeight: 900, margin: "0 0 18px", letterSpacing: "-1px",
            lineHeight: 1.12, textShadow: "0 3px 20px rgba(0,0,0,0.40)",
          }}>
            안녕하세요,<br/>우리반! 🌸
          </h1>

          {/* 급훈 */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "rgba(255,255,255,0.13)", backdropFilter: "blur(18px)",
            borderRadius: 14, padding: "9px 16px",
            border: "1px solid rgba(255,255,255,0.22)",
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8,
              background: "linear-gradient(135deg,#f472b6,#a78bfa)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
            }}>🌟</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", letterSpacing: "-0.2px" }}>
                Oh, my God! 오 내 신!
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
                우리반 급훈
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════ D-DAY ════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(175px,1fr))", gap: 14 }}>
        {ddayData.map(item => (
          <div key={item.label} style={{
            borderRadius: 22, padding: "24px", overflow: "hidden", position: "relative",
            background: `linear-gradient(135deg,${item.from},${item.to})`,
            boxShadow: `0 10px 30px ${item.from}40`,
          }}>
            <div style={{ position: "absolute", width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.09)", top: -28, right: -20 }}/>
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>{item.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.88)" }}>{item.label}</span>
              </div>
              <div style={{ fontSize: 44, fontWeight: 900, color: "#fff", letterSpacing: "-3px", lineHeight: 1, marginBottom: 7 }}>
                D-{item.d}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>{item.date}</div>
            </div>
          </div>
        ))}

        {/* 오늘 체크 */}
        <div style={{
          borderRadius: 22, padding: "22px",
          background: "#fff", border: "1.5px solid #ede9fe",
          boxShadow: "0 4px 16px rgba(139,92,246,0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 9,
              background: "linear-gradient(135deg,#fde68a,#fb923c)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
              boxShadow: "0 2px 8px rgba(251,146,60,0.30)",
            }}>☀️</div>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>오늘 체크</span>
          </div>
          {[
            { icon: "📋", text: "수행평가 마감 확인" },
            { icon: "📢", text: "공지 새 글 확인" },
            { icon: "💬", text: "상담 신청 여부" },
          ].map(t => (
            <div key={t.text} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12 }}>{t.icon}</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{t.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ════════ 시간표 ════════ */}
      <div style={{
        background: "#fff", borderRadius: 24,
        border: "1.5px solid #f0e4f8",
        boxShadow: "0 4px 20px rgba(139,92,246,0.08)",
        overflow: "hidden",
      }}>
        {/* 헤더 */}
        <div style={{
          padding: "18px 22px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1.5px solid #faf5ff",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 11,
              background: "linear-gradient(135deg,#8b5cf6,#6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
              boxShadow: "0 3px 10px rgba(139,92,246,0.30)",
            }}>📚</div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, color: "var(--text-subtle)", letterSpacing: "0.10em", textTransform: "uppercase", margin: "0 0 1px" }}>Schedule</p>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: "-0.3px" }}>이번 주 시간표</h3>
            </div>
          </div>
          <div style={{
            padding: "5px 12px", borderRadius: 999,
            background: "linear-gradient(135deg,#f5f3ff,#ede9fe)",
            border: "1.5px solid #ddd6fe",
          }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#7c3aed" }}>
              오늘 ({todayName})
            </span>
          </div>
        </div>

        {/* 시간표 그리드 */}
        <div style={{ padding: "14px 16px 18px", overflowX: "auto" }}>
          <div style={{ minWidth: 360 }}>
            {/* 요일 헤더 */}
            <div style={{ display: "grid", gridTemplateColumns: "40px repeat(5,1fr)", gap: 6, marginBottom: 8 }}>
              <div/>
              {Object.keys(TIMETABLE).map(day => (
                <div key={day} style={{
                  textAlign: "center", padding: "6px 4px",
                  borderRadius: 10,
                  background: day === todayName
                    ? "linear-gradient(135deg,#8b5cf6,#6366f1)"
                    : "var(--border-light)",
                  fontSize: 13, fontWeight: 800,
                  color: day === todayName ? "#fff" : "var(--text-muted)",
                  boxShadow: day === todayName ? "0 3px 10px rgba(139,92,246,0.28)" : "none",
                }}>
                  {day}
                </div>
              ))}
            </div>

            {/* 교시별 행 */}
            {[0,1,2,3,4,5,6].map(period => (
              <div key={period} style={{
                display: "grid", gridTemplateColumns: "40px repeat(5,1fr)", gap: 6, marginBottom: 5,
              }}>
                {/* 교시 번호 */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, color: "var(--text-subtle)",
                }}>
                  {period + 1}교시
                </div>
                {/* 각 요일 과목 */}
                {Object.entries(TIMETABLE).map(([day, subjects]) => {
                  const subject = subjects[period] ?? "";
                  const colors = SUBJECT_COLOR[subject] ?? { bg: "#f9fafb", color: "#6b7280" };
                  const isToday = day === todayName;
                  return (
                    <div key={day} style={{
                      textAlign: "center", padding: "6px 4px",
                      borderRadius: 9,
                      background: isToday ? colors.bg : "#fafafa",
                      color: isToday ? colors.color : "var(--text-subtle)",
                      fontSize: 12, fontWeight: isToday ? 800 : 500,
                      border: isToday ? `1.5px solid ${colors.color}22` : "1.5px solid transparent",
                      transition: "all 0.12s",
                    }}>
                      {subject}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════ 빠른 이동 ════════ */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 4, height: 18, borderRadius: 2, background: "linear-gradient(to bottom,#f43f5e,#a78bfa)" }}/>
          <span style={{ fontSize: 15, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.3px" }}>빠른 이동</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {QUICK_LINKS.map(item => (
            <Link key={item.href} href={item.href} style={{
              textDecoration: "none", position: "relative",
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 7, padding: "20px 10px",
              background: item.bg, borderRadius: 18,
              border: "1.5px solid rgba(255,255,255,0.85)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              transition: "transform 0.18s cubic-bezier(.34,1.56,.64,1), box-shadow 0.18s",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 12px 28px ${item.color}22`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.04)";
              }}
            >
              {item.href === "/notice" && newCount > 0 && (
                <span style={{
                  position: "absolute", top: 9, right: 9,
                  minWidth: 18, height: 18, borderRadius: 999, padding: "0 5px",
                  background: "#f43f5e", color: "#fff",
                  fontSize: 10, fontWeight: 900,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(244,63,94,0.45)",
                }}>{newCount}</span>
              )}
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: "#fff", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 22,
                boxShadow: `0 3px 12px ${item.color}18`,
              }}>{item.emoji}</div>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.2px" }}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ════════ 공지 + TODO ════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, alignItems: "start" }}>

        {/* 공지사항 */}
        <div style={{
          background: "#fff", borderRadius: 22,
          border: "1.5px solid #f0e4f8",
          boxShadow: "0 4px 20px rgba(244,114,182,0.07)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "18px 20px 14px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: "1.5px solid #fdf4ff",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: "linear-gradient(135deg,#f43f5e,#fb923c)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                boxShadow: "0 3px 8px rgba(244,63,94,0.25)",
              }}>📢</div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.3px" }}>공지사항</span>
                {newCount > 0 && (
                  <span style={{
                    minWidth: 18, height: 18, borderRadius: 999, padding: "0 5px",
                    background: "#f43f5e", color: "#fff",
                    fontSize: 10, fontWeight: 900,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}>{newCount}</span>
                )}
              </div>
            </div>
            <Link href="/notice" style={{
              fontSize: 11, fontWeight: 800, color: "#f43f5e",
              textDecoration: "none", padding: "5px 12px", borderRadius: 999,
              background: "#fff1f2", border: "1.5px solid #fecdd3",
            }}>전체보기 →</Link>
          </div>

          <div style={{ padding: "6px 12px 10px" }}>
            {notices.length === 0 ? (
              <p style={{ textAlign: "center", padding: "20px 0", fontSize: 13, color: "var(--text-subtle)", margin: 0 }}>
                등록된 공지가 없습니다
              </p>
            ) : notices.map((n, i) => (
              <Link key={n.id} href="/notice" style={{ textDecoration: "none" }}>
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 8px", borderRadius: 12,
                    borderBottom: i < notices.length - 1 ? "1px solid #fdf4ff" : "none",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fff1f2")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                    background: n.is_pinned
                      ? "linear-gradient(135deg,#fbbf24,#f43f5e)"
                      : "linear-gradient(135deg,#f472b6,#a78bfa)",
                    color: "#fff", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: n.is_pinned ? 11 : 10, fontWeight: 800,
                  }}>
                    {n.is_pinned ? "📌" : i + 1}
                  </div>
                  <span style={{
                    fontSize: 13, color: "var(--text)", fontWeight: 600, flex: 1, minWidth: 0,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{n.title}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    {isNew(n.created_at) && (
                      <span style={{
                        fontSize: 9, fontWeight: 900, color: "#fff",
                        background: "#f43f5e", padding: "2px 7px", borderRadius: 999,
                      }}>NEW</span>
                    )}
                    <span style={{ fontSize: 11, color: "var(--text-subtle)" }}>{timeAgo(n.created_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* TODO 바로가기 */}
        <Link href="/todo" style={{
          textDecoration: "none", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 12,
          padding: "24px 20px", borderRadius: 22, minWidth: 120,
          background: "linear-gradient(145deg,#6366f1,#8b5cf6,#a855f7)",
          boxShadow: "0 10px 30px rgba(99,102,241,0.30)",
          border: "1.5px solid rgba(255,255,255,0.15)",
          transition: "transform 0.18s cubic-bezier(.34,1.56,.64,1)",
        }}
          onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-4px)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "none")}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 16, background: "rgba(255,255,255,0.20)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
          }}>✅</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", letterSpacing: "-0.2px" }}>나의 할일</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 2, fontWeight: 600 }}>바로가기 →</div>
          </div>
        </Link>
      </div>

    </div>
  );
}
