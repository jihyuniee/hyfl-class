"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/components/lib/supabaseClient";
import { nextSchoolExam, examDdayLabel, examStatusText, toKSTDateStr } from "@/components/lib/semester";
import styles from "./Home.module.css";

type Notice = { id: string; created_at: string; title: string; is_pinned: boolean };

const TIMETABLE: Record<string, string[]> = {
  "월": ["중입", "세계", "체육", "심독", "고전읽기", "고전읽기", "중회"],
  "화": ["미적", "중회", "과탐", "중입", "독서", "세지", "심독"],
  "수": ["진로", "중회", "세지", "중입", "과연", "HR/CA", "HR/CA"],
  "목": ["심독", "체육", "중회", "세계", "미적", "과연", "독서"],
  "금": ["과연", "심독", "중회", "독서", "중입", "미적", "세지"],
};

const QUICK_LINKS = [
  { href: "/schedule", label: "일정·수행", sub: "SCHEDULE" },
  { href: "/meal", label: "오늘의 급식", sub: "LUNCH TIME" },
  { href: "/counseling", label: "상담 신청", sub: "LET’S TALK" },
  { href: "/habits", label: "90일 습관", sub: "SMALL STEPS" },
  { href: "/roles", label: "1인 1역할", sub: "OUR ROLES" },
  { href: "/wall", label: "우리반 친구들", sub: "OUR PEOPLE" },
  { href: "/album", label: "학급 앨범", sub: "GOOD TIMES" },
  { href: "/admissions", label: "대학 입시", sub: "NEXT CHAPTER" },
];

const FEATURES = [
  { href: "/notice", tag: "01 / NOTICE", title: "놓치지 말자,", accent: "우리반 소식.", description: "공지와 수행평가, 중요한 소식은 여기서.", tone: "lime" },
  { href: "/counseling", tag: "02 / LET’S TALK", title: "어떤 이야기든,", accent: "편하게 와요.", description: "진로부터 요즘의 고민까지. 2학기 상담 신청.", tone: "lavender" },
  { href: "/gildong-mission", tag: "03 / OUR ARCHIVE", title: "같이 걸어서,", accent: "더 좋았던 날.", description: "길동생태공원에서 함께 만든 가을 기록.", tone: "peach" },
];

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

function isNew(dateStr: string) {
  const age = Date.now() - new Date(dateStr).getTime();
  return age >= 0 && age < 3 * 24 * 60 * 60 * 1000;
}

function noticeDate(dateStr: string) {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "2-digit", day: "2-digit" }).format(new Date(dateStr));
}

export default function Home() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticeState, setNoticeState] = useState<"loading" | "ready" | "error">("loading");
  const [heroSrc, setHeroSrc] = useState("/class-gildong-202610.jpg");
  const todayStr = useSyncExternalStore(subscribeDate, currentDate, serverDate);
  const today = todayStr ? new Date(`${todayStr}T00:00:00+09:00`) : null;
  const todayName = todayStr ? ["일", "월", "화", "수", "목", "금", "토"][new Date(`${todayStr}T00:00:00Z`).getUTCDay()] : "—";
  const schoolExam = today ? nextSchoolExam(today) : undefined;
  const examMessage = schoolExam && today ? examStatusText(schoolExam.start, today, schoolExam) : null;
  const ddayData = [
    ...(schoolExam && today ? [{ label: schoolExam.shortLabel, value: examDdayLabel(schoolExam.start, today, schoolExam.end) }] : []),
    { label: "수능", value: today ? examDdayLabel("2026-11-18", today) : null },
  ].filter(item => item.value !== null);

  useEffect(() => {
    let active = true;
    async function loadNotices() {
      try {
        const { data, error } = await supabase.from("notices")
          .select("id, created_at, title, is_pinned")
          .order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(4);
        if (!active) return;
        if (error) { setNoticeState("error"); return; }
        setNotices((data as Notice[]) ?? []);
        setNoticeState("ready");
      } catch {
        if (active) setNoticeState("error");
      }
    }
    void loadNotices();
    return () => { active = false; };
  }, []);

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.issueLine}>
          <span><i aria-hidden="true" /> HANYOUNG FOREIGN LANGUAGE HIGH SCHOOL</span>
          <span>2026 · 2ND SEMESTER</span>
        </div>
        <div className={styles.masthead}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>한영외고 2학년 2반 · OUR CLASS, OUR STORY</p>
            <h1 id="home-title" className={styles.heroTitle}>우리의 지금,<br className={styles.titleBreak} /> <span>2-2.</span><svg aria-hidden="true" viewBox="0 0 64 64"><path d="M32 0v64M0 32h64M9.4 9.4l45.2 45.2M9.4 54.6 54.6 9.4" /></svg></h1>
            <p className={styles.heroSubtitle}>각자의 색으로, 함께 만드는 우리만의 한 페이지.</p>
          </div>
          <Link href="/wall" className={styles.classStamp}>
            <span>DIFFERENT COLORS</span><strong>23<span>명</span></strong><span>하나의 우리반 <span aria-hidden="true">↗</span></span>
          </Link>
        </div>
        <figure className={styles.cover}>
          <div className={styles.heroPhoto}>
            <Image src={heroSrc} alt="길동생태공원에서 함께 찍은 한영외고 2학년 2반 단체사진" fill priority
              sizes="(max-width: 640px) calc(100vw - 28px), (max-width: 1100px) 92vw, 1020px"
              className={styles.heroImage} onError={() => { if (heroSrc !== "/class-photo.jpg") setHeroSrc("/class-photo.jpg"); }} />
            <span className={styles.photoLabel}>THE 2-2 COLLECTIVE <span aria-hidden="true">✳</span></span>
          </div>
          <figcaption className={styles.photoCaption}>
            <span><span className={styles.captionDot} aria-hidden="true" /> 길동생태공원에서, 함께.</span>
            <Link href="/album">우리의 순간들 보기 <span aria-hidden="true">↗</span></Link>
          </figcaption>
        </figure>
        <div className={styles.statusBar}>
          <div className={styles.todayDate}><span className={styles.microLabel}>TODAY</span><strong>{todayStr ? `${Number(todayStr.slice(5, 7))}.${todayStr.slice(8, 10)}` : "—"}<span>{todayName}요일</span></strong></div>
          <div className={styles.countdowns}>{ddayData.map(item => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
          <Link href="/schedule" className={styles.scheduleAction}>오늘 일정 확인 <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <section aria-labelledby="shortcuts-title" className={styles.shortcutSection}>
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>DAILY ESSENTIALS</p><h2 id="shortcuts-title">오늘도, 여기서 시작.</h2></div><span className={styles.sectionAside}>필요한 메뉴로 바로 가기 <span aria-hidden="true">↙</span></span></div>
        <div className={styles.quickGrid}>{QUICK_LINKS.map(item => <Link key={item.href} href={item.href} className={styles.quickLink}>
          <span className={styles.shortcutTop}><ShortcutIcon name={item.href} /><span aria-hidden="true">↗</span></span>
          <span className={styles.shortcutLabel}>{item.label}</span><span className={styles.shortcutSubtitle}>{item.sub}</span>
        </Link>)}</div>
      </section>

      {examMessage && <Link href="/schedule" className={styles.examBanner}><span className={styles.examTag}>COMING UP</span><span>{examMessage}</span><span aria-hidden="true">↗</span></Link>}

      <div className={styles.featureGrid}>{FEATURES.map(feature => <Link key={feature.href} href={feature.href} className={styles.featureCard} data-tone={feature.tone}>
        <div className={styles.featureTop}><span>{feature.tag}</span><span aria-hidden="true">↗</span></div>
        <h2>{feature.title}<br />{feature.accent}</h2><p>{feature.description}</p>
      </Link>)}</div>

      <div className={styles.dashboardGrid}>
        <section className={styles.timetableCard} aria-labelledby="timetable-title">
          <div className={styles.cardHeading}><div><p className={styles.eyebrow}>THIS WEEK</p><h2 id="timetable-title">우리반 시간표<span aria-hidden="true">.</span></h2></div><span className={styles.todayPill}>{todayName}요일</span></div>
          <div className={styles.tableWrap}><table className={styles.timetable}>
            <caption className={styles.srOnly}>2학년 2반 주간 시간표. 오늘 요일은 강조되어 있습니다.</caption>
            <thead><tr><th scope="col"><span className={styles.srOnly}>교시</span></th>{Object.keys(TIMETABLE).map(day => <th key={day} scope="col" data-today={day === todayName || undefined}>{day}</th>)}</tr></thead>
            <tbody>{[0, 1, 2, 3, 4, 5, 6].map(period => <tr key={period}><th scope="row">{period + 1}<span className={styles.srOnly}>교시</span></th>{Object.entries(TIMETABLE).map(([day, subjects]) => <td key={day} data-today={day === todayName || undefined}>{subjects[period]}</td>)}</tr>)}</tbody>
          </table></div>
        </section>

        <div className={styles.sideStack}>
          <section className={styles.noticeCard} aria-labelledby="notices-title">
            <div className={styles.cardHeading}><div><p className={styles.eyebrow}>KEEP IN THE LOOP</p><h2 id="notices-title">최근 소식<span aria-hidden="true">.</span></h2></div><Link href="/notice" className={styles.textLink}>전체보기 <span aria-hidden="true">↗</span></Link></div>
            <div className={styles.noticeList} aria-live="polite" aria-busy={noticeState === "loading"}>
              {noticeState === "loading" ? <p className={styles.emptyNotice}>우리반 소식을 불러오고 있어요.</p> : noticeState === "error" ? <p className={styles.emptyNotice}>소식을 불러오지 못했어요. <Link href="/notice">공지 게시판 확인하기 ↗</Link></p> : notices.length === 0 ? <p className={styles.emptyNotice}>아직 등록된 공지가 없어요.</p> : notices.map((notice, index) => <Link key={notice.id} href="/notice" className={styles.noticeItem}>
                <span className={styles.noticeNumber} data-pinned={notice.is_pinned || undefined}>{notice.is_pinned ? "PIN" : String(index + 1).padStart(2, "0")}</span>
                <span className={styles.noticeTitle}>{notice.title}{isNew(notice.created_at) && <span className={styles.newBadge}>NEW</span>}</span>
                <time dateTime={notice.created_at}>{noticeDate(notice.created_at)}</time>
              </Link>)}
            </div>
          </section>
          <Link href="/todo" className={styles.todoCard}><div><p className={styles.microLabel}>ONE THING AT A TIME</p><h2>오늘의 나,<br /><span>하나씩 해내는 중.</span></h2><p>작은 체크 하나로 시작하는 오늘의 할 일.</p></div><span className={styles.todoArrow} aria-hidden="true">↗</span></Link>
        </div>
      </div>

      <footer className={styles.footer}><strong>2-2<span aria-hidden="true">✳</span></strong><p>Oh, my God! 오 내 신!<span>서로의 오늘을 응원하는 우리반.</span></p><span className={styles.footerEdition}>OUR STORY CONTINUES · 2026</span></footer>
    </div>
  );
}

function ShortcutIcon({ name }: { name: string }) {
  const common = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none" as const, stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  switch (name) {
    case "/schedule": return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4M7 13h3m4 0h3m-10 4h3" /></svg>;
    case "/meal": return <svg {...common}><path d="M4 3v6a2 2 0 0 0 4 0V3M6 3v18M18 3c-4 3-4 9 0 9V3Zm0 9v9" /></svg>;
    case "/counseling": return <svg {...common}><path d="M21 11a8 8 0 0 1-8 8H5l-3 3V11a9.5 9.5 0 0 1 19 0Z" /><path d="M7 10h10m-10 4h6" /></svg>;
    case "/habits": return <svg {...common}><path d="m8 12 3 3 5-6" /><rect x="3" y="3" width="18" height="18" rx="3" /></svg>;
    case "/roles": return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3 21v-1a6 6 0 0 1 12 0v1M16 4a3 3 0 0 1 0 6m1 4a5 5 0 0 1 4 5v2" /></svg>;
    case "/wall": return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
    case "/album": return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8" cy="9" r="1.5" /><path d="m3 17 5-4 4 3 4-5 5 6" /></svg>;
    default: return <svg {...common}><path d="m2 9 10-5 10 5-10 5L2 9Zm4 2v6c4 3 8 3 12 0v-6m4-2v8" /></svg>;
  }
}
