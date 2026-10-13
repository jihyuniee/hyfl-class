"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/components/lib/supabaseClient";
import { nextSchoolExam, examDdayLabel, examStatusText, toKSTDateStr } from "@/components/lib/semester";
import styles from "./Home.module.css";

type Notice = {
  id: string;
  created_at: string;
  title: string;
  is_pinned: boolean;
};

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

const TIMETABLE: Record<string, string[]> = {
  "월": ["중입", "세계", "체육", "심독", "고전읽기", "고전읽기", "중회"],
  "화": ["미적", "중회", "과탐", "중입", "독서", "세지", "심독"],
  "수": ["진로", "중회", "세지", "중입", "과연", "HR/CA", "HR/CA"],
  "목": ["심독", "체육", "중회", "세계", "미적", "과연", "독서"],
  "금": ["과연", "심독", "중회", "독서", "중입", "미적", "세지"],
};

// 3개 타일 메인 비주얼 — 핑크/시안/오렌지
const HERO_BLOCKS = [
  {
    href: "/notice",
    eyebrow: "Notice",
    title: ["공지 ·", "수행평가"],
    sub: "새로운 소식과 수행평가 일정을 확인해요.",
    tone: "pink" as const,
  },
  {
    href: "/counseling",
    eyebrow: "Counsel",
    title: ["2학기", "상담 신청"],
    sub: "희망 시간대 선착순 신청. 부담 없이 와요.",
    tone: "cyan" as const,
  },
  {
    href: "/habits",
    eyebrow: "Habits",
    title: ["2학기", "습관 챌린지"],
    sub: "새 학기, 새로운 습관을 시작해봐요. 작은 성취가 모여요.",
    tone: "orange" as const,
  },
];

const QUICK_LINKS = [
  { href: "/schedule",   label: "일정/수행", sub: "schedule" },
  { href: "/counseling", label: "상담",       sub: "counsel"  },
  { href: "/gildong-mission", label: "길동 미션", sub: "mission" },
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

// 서버의 빌드 날짜 대신 접속한 브라우저의 현재 한국 날짜로 안내한다.
function subscribeDate(onChange: () => void) {
  const timer = window.setInterval(onChange, 30_000);
  window.addEventListener("focus", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}
const currentDate = () => toKSTDateStr();
const serverDate = () => null;

export default function Home() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [heroSrc, setHeroSrc] = useState("/class-photo2.jpg");

  const todayStr = useSyncExternalStore(subscribeDate, currentDate, serverDate);
  const today = todayStr ? new Date(`${todayStr}T00:00:00+09:00`) : null;
  const dayNames  = ["일", "월", "화", "수", "목", "금", "토"];
  const todayName = todayStr ? dayNames[new Date(`${todayStr}T00:00:00Z`).getUTCDay()] : "—";

  const schoolExam = today ? nextSchoolExam(today) : undefined;
  const examMessage = schoolExam && today
    ? examStatusText(schoolExam.start, today, schoolExam)
    : null;
  const ddayData = [
    ...(schoolExam && today ? [{ label: schoolExam.shortLabel, dLabel: examDdayLabel(schoolExam.start, today, schoolExam.end), color: "#FF3D86" }] : []),
    { label: "수능", dLabel: today ? examDdayLabel(SUNEUNG, today) : null, color: "#16131A" },
  ].filter(item => item.dLabel !== null);


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
    <div className={styles.page}>

      {/* ════════ HERO — 풀너비 사진 + 상단 텍스트 바 ════════ */}
      <section className={styles.hero}>
        {/* 좁은 화면에서는 소개, 오늘의 정보, 사진이 순서대로 배치됩니다. */}
        <div className={styles.heroContent}>
          {/* 왼쪽: 브랜딩 + 제목 + 부제 */}
          <div className={styles.heroCopy}>
            <div className={styles.heroBrand}>
              {todayStr?.slice(0, 4) ?? "2026"} 2학기 · 한영외고 2학년 2반
              <span aria-hidden="true" className={styles.brandDot}/>
            </div>
            <h1 className={styles.heroTitle}>
              New Day,<br className={styles.heroTitleBreak}/>{" "}
              <span style={{ fontStyle: "italic", fontWeight: 500, color: "#FF3D86" }}>New Us.</span>
            </h1>
            <div className={styles.heroSubtitle}>
              <b style={{ color: "#16131A" }}>2학기, 다시 함께 시작합니다 🍂</b><br/>
              함께여서 더 빛나는 우리반 23명. 오늘도 2-2의 하루가 시작됐어요.
            </div>
          </div>

          {/* 오른쪽: D-day + 버튼 + 급훈 */}
          <div className={styles.heroStatus}>
            {/* D-day 위젯 */}
            <div className={styles.daySummary}>
              {ddayData.map(item => (
                <div key={item.label} style={{ display: "contents" }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#9C95A0" }}>{item.label}</div>
                    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", marginTop: 2, color: item.color }}>
                      {item.dLabel}
                    </div>
                  </div>
                  <div style={{ width: 1, alignSelf: "stretch", background: "#ECE4DF" }}/>
                </div>
              ))}
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#9C95A0" }}>오늘</div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", marginTop: 2, color: "#16131A" }}>
                  {todayName}<small style={{ fontSize: 11, color: "#9C95A0", fontWeight: 500, marginLeft: 3 }}>요일</small>
                </div>
              </div>
            </div>

            {/* 버튼 행 */}
            <div className={styles.heroActions}>
              <Link href="/wall" className={`${styles.heroAction} ${styles.studentAction}`}>
                학생 소개 23명
              </Link>
              <Link href="/schedule" className={`${styles.heroAction} ${styles.scheduleAction}`}>
                오늘 일정 보기 <span aria-hidden="true" style={{ fontSize: 14 }}>→</span>
              </Link>
            </div>

            {/* 급훈 */}
            <div className={styles.heroMotto}>
              ✦ Oh, my God! 오 내 신!
            </div>
          </div>
        </div>

        <div className={styles.heroPhoto}>
          <Image
            src={heroSrc} alt="2-2 우리반 단체사진" fill priority
            sizes="(max-width: 640px) calc(100vw - 28px), (max-width: 1100px) 92vw, 1020px"
            className={styles.heroImage}
            onError={() => setHeroSrc("/class-photo.jpg")}
          />
          <div className={styles.heroGradient}/>
        </div>

        {/* 시안 도넛 장식 */}
        <svg className={styles.heroDecoration} aria-hidden="true" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#39C9E5" strokeWidth="14"/>
        </svg>
      </section>

      {/* ════════ Quick links ════════ */}
      <section aria-labelledby="home-shortcuts-title">
        <div className={styles.shortcutHeading}>
          <h2 id="home-shortcuts-title" className={styles.shortcutTitle}>
            자주 찾는 <span style={{ color: "#FF3D86" }}>메뉴</span>
          </h2>
          <span className={styles.shortcutCount}>{QUICK_LINKS.length}개 메뉴</span>
        </div>

        <div className={styles.quickGrid}>
          {QUICK_LINKS.map(item => (
            <Link key={item.href} href={item.href} className={styles.quickLink}>
              {item.href === "/notice" && newCount > 0 && (
                <span style={{
                  position: "absolute", top: 12, right: 12,
                  fontFamily: "'Inter',sans-serif", fontSize: 10, fontWeight: 700,
                  background: "#FF3D86", color: "#fff",
                  padding: "2px 7px", borderRadius: 999,
                }}>{newCount}</span>
              )}
              <div className={styles.shortcutIcon} aria-hidden="true">
                <ShortcutIcon name={item.href} />
              </div>
              <div className={styles.shortcutText}>
                <div className={styles.shortcutLabel}>
                  {item.label}
                </div>
                <div className={styles.shortcutSubtitle}>
                  {item.sub}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ════════ 현재/다음 시험 상태 배너 ════════ */}
      {schoolExam && examMessage && (
        <div className="hy-soft" style={{
          padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 16 }}>📅</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#16131A" }}>
            {examMessage}
          </span>
          <span style={{ fontSize: 12, color: "#9C95A0", fontWeight: 600 }}>
            · {schoolExam.shortLabel} 시작일 {Number(schoolExam.start.slice(5, 7))}월 {Number(schoolExam.start.slice(8, 10))}일
          </span>
        </div>
      )}

      {/* ════════ 컬러 블록 3-up ════════ */}
      <div className={styles.featureGrid}>
        {HERO_BLOCKS.map(b => {
          const t = TONE[b.tone];
          return (
            <Link key={b.href} href={b.href} className={styles.featureCard}
              style={{ background: t.bg, color: t.ink }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.85 }}>
                  {b.eyebrow}
                </div>
                <h3 className={styles.featureTitle}>
                  {b.title[0]}<br className={styles.featureTitleBreak}/>{" "}{b.title[1]}
                </h3>
                <div className={styles.featureDescription}>
                  {b.sub}
                </div>
              </div>
              <div className={styles.featureArrow} aria-hidden="true">
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: t.arrow, display: "grid", placeItems: "center",
                  color: t.ink, fontSize: 16,
                }}>→</div>
              </div>
              <div aria-hidden="true" style={{
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

      {/* ════════ 공지 + TODO ════════ */}
      <div className={styles.bottomGrid}>
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
