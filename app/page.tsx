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
const EXAM    = "2026-07-01";

const TIMETABLE: Record<string, string[]> = {
  "월": ["중독", "심작", "사문", "문학", "고전읽기", "고전읽기", "대수"],
  "화": ["인탐", "진로", "심작", "중문", "중독", "사문", "국제"],
  "수": ["인탐", "중독", "중문", "체육", "문학", "HR/CA", "HR/CA"],
  "목": ["대수", "심작", "중독", "체육", "과탐", "중문", "사문"],
  "금": ["국제", "심작", "인탐", "중독", "중문", "대수", "문학"],
};

// 3개 타일 메인 비주얼 — 핑크/시안/오렌지
const HERO_BLOCKS = [
  {
    href: "/notice",
    eyebrow: "Notice",
    title: ["공지 ·", "수행평가"],
    sub: "읽지 않은 새 글이 있어요. 시험 기간 시작.",
    tone: "pink" as const,
  },
  {
    href: "/counseling",
    eyebrow: "Counsel",
    title: ["1학기", "1차 상담"],
    sub: "희망 시간대 선착순 신청. 부담 없이 와요.",
    tone: "cyan" as const,
  },
  {
    href: "/habits",
    eyebrow: "Habits",
    title: ["90일", "습관 챌린지"],
    sub: "오늘의 한 칸을 채워주세요. 작은 성취가 모여요.",
    tone: "orange" as const,
  },
];

const QUICK_LINKS = [
  { href: "/schedule",   label: "일정/수행", sub: "schedule" },
  { href: "/counseling", label: "상담",       sub: "counsel"  },
  { href: "/habits",     label: "90일 습관",  sub: "habits"   },
  { href: "/roles",      label: "1인1역할",   sub: "roles"    },
  { href: "/wall",       label: "학생 소개",  sub: "wall"     },
  { href: "/album",      label: "앨범",       sub: "album"    },
];

const TONE: Record<"pink"|"cyan"|"orange", { bg:string; ink:string; arrow:string; arrowHover:string }> = {
  pink:   { bg: "linear-gradient(135deg,#FF8FB6,#FF3D86)", ink: "#FFFFFF", arrow:"rgba(255,255,255,0.22)", arrowHover:"#FFFFFF" },
  cyan:   { bg: "linear-gradient(135deg,#7BE3F2,#39C9E5)", ink: "#16131A", arrow:"rgba(0,0,0,0.15)",       arrowHover:"#16131A" },
  orange: { bg: "linear-gradient(135deg,#FFB066,#FF7A2E)", ink: "#16131A", arrow:"rgba(0,0,0,0.15)",       arrowHover:"#16131A" },
};

export default function Home() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [heroSrc, setHeroSrc] = useState("/class-photo2.jpg");

  const today     = new Date();
  const dayNames  = ["일", "월", "화", "수", "목", "금", "토"];
  const todayName = dayNames[today.getDay()];

  const ddayData = [
    { label: "기말고사", date: EXAM,    d: dday(EXAM)    },
    { label: "수능",     date: SUNEUNG, d: dday(SUNEUNG) },
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
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

      {/* ════════ HERO — 풀너비 사진 + 텍스트 오버레이 ════════ */}
      <section style={{ position: "relative", borderRadius: 28, overflow: "hidden", minHeight: 500, aspectRatio: "16/7" }}>

        {/* 사진 — 왼쪽 기준 cover (오른쪽 주차금지 쪽만 잘림) */}
        <Image
          src={heroSrc} alt="2-2 우리반 단체사진" fill priority
          style={{ objectFit: "cover", objectPosition: "left center" }}
          onError={() => setHeroSrc("/class-photo.jpg")}
        />

        {/* 오른쪽 상단 텍스트 영역 그라디언트 배경 */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to left, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.88) 38%, rgba(255,255,255,0.2) 60%, transparent 78%)",
          pointerEvents: "none",
        }}/>

        {/* 텍스트 오버레이 — 오른쪽 상단 */}
        <div style={{
          position: "absolute", top: 0, right: 0,
          display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-end",
          padding: "32px 36px",
          maxWidth: 460,
          textAlign: "right",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
            textTransform: "uppercase", color: "#16131A",
          }}>
            {today.getFullYear()} · 한영외고 2학년 2반
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF3D86" }}/>
          </div>

          <h1 style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 800, fontSize: "clamp(32px, 3.5vw, 56px)",
            lineHeight: 0.98, letterSpacing: "-0.045em",
            margin: "16px 0 0", color: "#16131A",
          }}>
            New Day,<br/>
            <span style={{ fontStyle: "italic", fontWeight: 500, color: "#FF3D86" }}>New Us.</span>
          </h1>

          <div style={{ marginTop: 14, fontSize: 14, color: "#5A5160", lineHeight: 1.6 }}>
            함께여서 더 빛나는 우리반 23명.<br/>오늘도 2-2의 하루가 시작됐어요.
          </div>

          <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Link href="/wall" style={{
              background: "#FFD93D", color: "#16131A",
              padding: "12px 20px", borderRadius: 999,
              fontWeight: 700, fontSize: 13, textDecoration: "none",
            }}>학생 소개 23명</Link>
            <Link href="/schedule" style={{
              background: "#16131A", color: "#fff",
              padding: "12px 22px", borderRadius: 999,
              fontWeight: 600, fontSize: 13, textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>오늘 일정 보기 <span style={{ fontSize: 14 }}>→</span></Link>
          </div>

          {/* D-day 위젯 */}
          <div style={{
            marginTop: 20,
            background: "rgba(250,246,242,0.92)", borderRadius: 18,
            padding: "14px 18px",
            display: "inline-flex", gap: 18, alignItems: "center",
            alignSelf: "flex-end",
          }}>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#9C95A0" }}>기말고사</div>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginTop: 2, color: "#FF3D86" }}>
                D{ddayData[0].d >= 0 ? `-${ddayData[0].d}` : `+${-ddayData[0].d}`}
              </div>
            </div>
            <div style={{ width: 1, alignSelf: "stretch", background: "#ECE4DF" }}/>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#9C95A0" }}>수능</div>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginTop: 2, color: "#16131A" }}>
                D{ddayData[1].d >= 0 ? `-${ddayData[1].d}` : `+${-ddayData[1].d}`}
              </div>
            </div>
            <div style={{ width: 1, alignSelf: "stretch", background: "#ECE4DF" }}/>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#9C95A0" }}>오늘</div>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", marginTop: 2, color: "#16131A" }}>
                {todayName}<small style={{ fontSize: 12, color: "#9C95A0", fontWeight: 500, marginLeft: 4 }}>요일</small>
              </div>
            </div>
          </div>

          {/* 급훈 라벨 */}
          <div style={{
            marginTop: 10,
            background: "#16131A", color: "#fff",
            padding: "9px 16px", borderRadius: 999,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
            alignSelf: "flex-end",
          }}>
            ✦ Oh, my God! 오 내 신!
          </div>
        </div>

        {/* 시안 도넛 장식 */}
        <svg style={{ position: "absolute", right: 32, top: 32, width: 90, height: 90, pointerEvents: "none" }} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#39C9E5" strokeWidth="14"/>
        </svg>
        {/* 작은 별 장식 */}
        <svg style={{ position: "absolute", right: "16%", bottom: "18%", width: 32, height: 32, pointerEvents: "none" }} viewBox="0 0 64 64">
          <path d="M32 4 L37 25 L58 30 L37 35 L32 56 L27 35 L6 30 L27 25 Z" fill="#FFD93D" stroke="#16131A" strokeWidth="2"/>
        </svg>
      </section>

      {/* ════════ 컬러 블록 3-up ════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }} className="block-grid">
        {HERO_BLOCKS.map(b => {
          const t = TONE[b.tone];
          return (
            <Link key={b.href} href={b.href} style={{
              textDecoration: "none",
              borderRadius: 28, padding: "28px 24px",
              minHeight: 220, position: "relative", overflow: "hidden",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              background: t.bg, color: t.ink,
              transition: "transform 0.25s ease",
            }}
              onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-3px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "none")}
            >
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.85 }}>
                  {b.eyebrow}
                </div>
                <h3 style={{
                  fontFamily: "'Inter',sans-serif", fontWeight: 700,
                  fontSize: 28, lineHeight: 1.05, letterSpacing: "-0.035em",
                  margin: "10px 0 8px",
                }}>
                  {b.title[0]}<br/>{b.title[1]}
                </h3>
                <div style={{ fontSize: 13, lineHeight: 1.55, opacity: 0.85, maxWidth: 240 }}>
                  {b.sub}
                </div>
              </div>
              <div style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: t.arrow, display: "grid", placeItems: "center",
                  color: t.ink, fontSize: 16,
                }}>→</div>
              </div>
              <div style={{
                position: "absolute", right: -10, top: -10, fontSize: 84,
                lineHeight: 1, opacity: 0.18, pointerEvents: "none",
              }}>✦</div>
            </Link>
          );
        })}
      </div>

      {/* ════════ 시간표 ════════ */}
      <div style={{
        background: "#fff", borderRadius: 28,
        border: "1px solid #E8E1DB", overflow: "hidden",
      }}>
        <div style={{
          padding: "22px 24px 16px",
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          borderBottom: "1px solid #F4EEEA", gap: 14, flexWrap: "wrap",
        }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, color: "#9C95A0", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 4px" }}>
              Schedule · This Week
            </p>
            <h3 style={{
              fontFamily: "'Inter',sans-serif", fontSize: 22, fontWeight: 700,
              letterSpacing: "-0.03em", margin: 0, color: "#16131A",
            }}>
              이번 주 <span style={{ fontStyle: "italic", fontWeight: 500, color: "#FF3D86" }}>timetable.</span>
            </h3>
          </div>
          <div style={{
            padding: "6px 14px", borderRadius: 999,
            background: "#FFF1F6", border: "1px solid #FFD2DD",
            fontSize: 11, fontWeight: 700, color: "#FF3D86",
            letterSpacing: "0.04em",
          }}>
            오늘 · {todayName}요일
          </div>
        </div>

        <div style={{ padding: "18px 20px 22px", overflowX: "auto" }}>
          <div style={{ minWidth: 360 }}>
            <div style={{ display: "grid", gridTemplateColumns: "44px repeat(5,1fr)", gap: 8, marginBottom: 10 }}>
              <div/>
              {Object.keys(TIMETABLE).map(day => (
                <div key={day} style={{
                  textAlign: "center", padding: "8px 4px",
                  borderRadius: 12,
                  background: day === todayName ? "#16131A" : "transparent",
                  border: day === todayName ? "1px solid #16131A" : "1px solid #E8E1DB",
                  fontSize: 13, fontWeight: 700,
                  color: day === todayName ? "#fff" : "#5A5160",
                  letterSpacing: "-0.01em",
                }}>
                  {day}
                </div>
              ))}
            </div>

            {[0,1,2,3,4,5,6].map(period => (
              <div key={period} style={{
                display: "grid", gridTemplateColumns: "44px repeat(5,1fr)", gap: 8, marginBottom: 6,
              }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 11, fontWeight: 700, color: "#9C95A0", letterSpacing: "0.02em",
                }}>
                  {period + 1}
                </div>
                {Object.entries(TIMETABLE).map(([day, subjects]) => {
                  const subject = subjects[period] ?? "";
                  const isToday = day === todayName;
                  return (
                    <div key={day} style={{
                      textAlign: "center", padding: "9px 4px",
                      borderRadius: 10,
                      background: isToday ? "#FFF1F6" : "#FAF6F2",
                      color: isToday ? "#16131A" : "#9C95A0",
                      fontSize: 12.5, fontWeight: isToday ? 700 : 500,
                      border: isToday ? "1px solid #FFD2DD" : "1px solid transparent",
                      letterSpacing: "-0.005em",
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

      {/* ════════ Quick links ════════ */}
      <div>
        <div style={{
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          marginBottom: 16, gap: 14,
        }}>
          <h2 style={{
            fontFamily: "'Inter',sans-serif", fontSize: 24, fontWeight: 700,
            letterSpacing: "-0.035em", margin: 0, color: "#16131A",
          }}>
            Quick <span style={{ fontStyle: "italic", fontWeight: 500, color: "#FF3D86" }}>shortcuts.</span>
          </h2>
          <span style={{
            fontSize: 11, fontWeight: 600, color: "#9C95A0",
            letterSpacing: "0.1em", textTransform: "uppercase",
          }}>6 menus</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12 }} className="quick-grid">
          {QUICK_LINKS.map(item => (
            <Link key={item.href} href={item.href} style={{
              textDecoration: "none", position: "relative",
              background: "#fff", border: "1px solid #E8E1DB",
              borderRadius: 22, padding: "20px 16px",
              display: "flex", flexDirection: "column", alignItems: "flex-start",
              gap: 14, minHeight: 120, cursor: "pointer",
              transition: "transform 0.18s, border-color 0.18s, box-shadow 0.18s",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.borderColor = "#FFB5C9";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(255,61,134,0.10)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.borderColor = "#E8E1DB";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {item.href === "/notice" && newCount > 0 && (
                <span style={{
                  position: "absolute", top: 12, right: 12,
                  fontFamily: "'Inter',sans-serif", fontSize: 10, fontWeight: 700,
                  background: "#FF3D86", color: "#fff",
                  padding: "2px 7px", borderRadius: 999,
                }}>{newCount}</span>
              )}
              <div style={{
                width: 28, height: 28, display: "grid", placeItems: "center", color: "#16131A",
              }}>
                <ShortcutIcon name={item.href} />
              </div>
              <div style={{ marginTop: "auto" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#16131A", letterSpacing: "-0.005em" }}>
                  {item.label}
                </div>
                <div style={{
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
                  color: "#9C95A0", marginTop: 4,
                }}>
                  {item.sub}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ════════ 공지 + TODO ════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, alignItems: "start" }} className="bottom-grid">
        <div style={{
          background: "#fff", borderRadius: 28,
          border: "1px solid #E8E1DB", overflow: "hidden",
        }}>
          <div style={{
            padding: "22px 24px 16px",
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            borderBottom: "1px solid #F4EEEA", gap: 12, flexWrap: "wrap",
          }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, color: "#9C95A0", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 4px" }}>
                Notice Board
              </p>
              <h3 style={{
                fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 700,
                letterSpacing: "-0.03em", margin: 0, color: "#16131A",
              }}>
                공지<span style={{ fontStyle: "italic", fontWeight: 500, color: "#FF3D86" }}> · latest.</span>
              </h3>
            </div>
            <Link href="/notice" style={{
              fontSize: 11, fontWeight: 700, color: "#16131A",
              textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>
              전체보기
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#16131A", color: "#fff", display: "grid", placeItems: "center", fontSize: 10 }}>→</span>
            </Link>
          </div>

          <div style={{ padding: "4px 12px 14px" }}>
            {notices.length === 0 ? (
              <p style={{ textAlign: "center", padding: "32px 0", fontSize: 13, color: "#9C95A0", margin: 0 }}>
                등록된 공지가 없습니다
              </p>
            ) : notices.map((n, i) => (
              <Link key={n.id} href="/notice" style={{ textDecoration: "none" }}>
                <div
                  style={{
                    display: "grid", gridTemplateColumns: "32px 1fr auto",
                    alignItems: "center", gap: 14,
                    padding: "14px 12px", borderRadius: 14,
                    borderTop: i === 0 ? "none" : "1px solid #F4EEEA",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#FAF6F2")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{
                    fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 600,
                    color: n.is_pinned ? "#FF3D86" : "#9C95A0", letterSpacing: "0.04em",
                  }}>
                    {n.is_pinned ? "PIN" : String(i + 1).padStart(2, "0")}
                  </div>
                  <span style={{
                    fontSize: 14, color: "#16131A", fontWeight: 500, minWidth: 0,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    letterSpacing: "-0.005em",
                  }}>{n.title}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {isNew(n.created_at) && (
                      <span style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                        color: "#fff", background: "#FF3D86",
                        padding: "3px 7px", borderRadius: 999,
                      }}>NEW</span>
                    )}
                    <span style={{
                      fontFamily: "'Inter',sans-serif",
                      fontSize: 11, color: "#9C95A0", letterSpacing: "0.02em",
                    }}>{timeAgo(n.created_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* TODO CTA */}
        <Link href="/todo" style={{
          textDecoration: "none", display: "flex", flexDirection: "column",
          justifyContent: "space-between",
          padding: "28px 26px", borderRadius: 28, minHeight: 220,
          background: "linear-gradient(135deg,#16131A,#2C2630)",
          color: "#fff",
          transition: "transform 0.18s",
        }}
          onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-3px)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "none")}
        >
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.6 }}>
              Today
            </div>
            <h3 style={{
              fontFamily: "'Inter',sans-serif", fontWeight: 700,
              fontSize: 28, letterSpacing: "-0.035em", lineHeight: 1.05,
              margin: "12px 0 12px",
            }}>
              나의<br/><span style={{ fontStyle: "italic", fontWeight: 500, color: "#FF6BA3" }}>to-do list.</span>
            </h3>
            <div style={{ fontSize: 13, lineHeight: 1.55, opacity: 0.7, maxWidth: 240 }}>
              오늘 할 일을 한 곳에서 정리해요.
            </div>
          </div>
          <div style={{
            marginTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between",
            paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.14)",
          }}>
            <span style={{
              fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.85,
            }}>open</span>
            <span style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "#FF3D86", color: "#fff",
              display: "grid", placeItems: "center", fontSize: 14,
            }}>→</span>
          </div>
        </Link>
      </div>

      <style jsx>{`
        @media (max-width: 880px) {
          .block-grid   { grid-template-columns: 1fr !important; }
          .bottom-grid  { grid-template-columns: 1fr !important; }
          .quick-grid   { grid-template-columns: repeat(3,1fr) !important; }
        }
        @media (max-width: 520px) {
          .quick-grid   { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </div>
  );
}

function ShortcutIcon({ name }: { name: string }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none" as const,
    stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "/schedule":
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M8 3v4M16 3v4"/></svg>;
    case "/counseling":
      return <svg {...common}><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/></svg>;
    case "/habits":
      return <svg {...common}><path d="M9 12l2 2 4-4"/><rect x="3" y="3" width="18" height="18" rx="3"/></svg>;
    case "/roles":
      return <svg {...common}><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="6" r="2"/><path d="M15 14a4 4 0 0 1 6 4"/></svg>;
    case "/wall":
      return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
    case "/album":
      return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 17l-5-5-9 9"/></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
  }
}
