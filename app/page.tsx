import Link from "next/link";

function dday(target: string) {
  const today = new Date();
  const t = new Date(target);
  today.setHours(0, 0, 0, 0);
  t.setHours(0, 0, 0, 0);
  return Math.ceil((t.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

const SUNEUNG = "2026-11-18";
const EXAM    = "2026-04-29";

const QUICK_LINKS = [
  { href: "/schedule",   emoji: "📅", label: "일정/수행",  bg: "#eff6ff", accent: "#3b82f6" },
  { href: "/counseling", emoji: "💬", label: "상담",       bg: "#f0fdf4", accent: "#22c55e" },
  { href: "/habits",     emoji: "💪", label: "90일 습관",  bg: "#fdf4ff", accent: "#a855f7" },
  { href: "/roles",      emoji: "🙋", label: "1인1역할",   bg: "#fff7ed", accent: "#f97316" },
  { href: "/wall",       emoji: "👤", label: "학생 소개",  bg: "#fef2f2", accent: "#ef4444" },
  { href: "/notice",     emoji: "📢", label: "공지",       bg: "#f0f9ff", accent: "#0ea5e9" },
];

const NOTICES = ["개학 준비물 안내", "자리 배치 공지", "수행평가 일정 안내"];

export default function Home() {
  const suneungD = dday(SUNEUNG);
  const examD    = dday(EXAM);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Hero */}
      <div className="hy-hero">
        <div style={{
          display: "inline-flex", alignItems: "center",
          background: "rgba(255,255,255,0.15)", borderRadius: 999,
          padding: "4px 14px", marginBottom: 14,
        }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
            📚 2025학년도 2학년 2반
          </span>
        </div>
        <h1 className="hy-title" style={{
          color: "#fff", fontSize: "clamp(22px,4vw,34px)",
          fontWeight: 800, margin: "0 0 8px",
        }}>
          안녕하세요, 우리반! 👋
        </h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, margin: 0 }}>
          일정 · 수행평가 · 상담 · 우리반 약속을 한 곳에서
        </p>
      </div>

      {/* D-day */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 14 }}>
        {[
          { label: "수능",     date: SUNEUNG, d: suneungD, emoji: "🎓", accent: "#3b82f6" },
          { label: "중간고사", date: EXAM,    d: examD,    emoji: "📝", accent: "#f97316" },
        ].map((item) => (
          <div key={item.label} className="hy-card"
            style={{ padding: "20px 22px", borderLeft: `4px solid ${item.accent}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{item.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>{item.label}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: item.accent, letterSpacing: "-1px" }}>
              D-{item.d}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 4 }}>{item.date}</div>
          </div>
        ))}

        <div className="hy-card" style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>오늘 체크</span>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {["수행평가 마감 확인", "공지 새 글 확인", "상담 신청 필요 여부"].map((t) => (
              <li key={t} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)", flexShrink: 0, display: "inline-block" }} />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Quick links */}
      <div>
        <p className="hy-section-label" style={{ marginBottom: 12 }}>빠른 이동</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))", gap: 12 }}>
          {QUICK_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="hy-quick-link"
              style={{ background: item.bg, border: `1px solid ${item.accent}22` }}>
              <span style={{ fontSize: 24 }}>{item.emoji}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.2px" }}>
                {item.label}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: item.accent }}>바로가기 →</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Notice */}
      <div className="hy-card" style={{ padding: "24px 26px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <p className="hy-section-label" style={{ marginBottom: 2 }}>최근 공지</p>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0, letterSpacing: "-0.3px" }}>
              📢 공지사항
            </h3>
          </div>
          <Link href="/notice" style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)", textDecoration: "none" }}>
            전체보기 →
          </Link>
        </div>
        <div className="hy-soft" style={{ borderRadius: 14, padding: "14px 16px" }}>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            {NOTICES.map((t, i) => (
              <li key={t} style={{
                display: "flex", alignItems: "center", gap: 10,
                fontSize: 14, color: "var(--text-muted)",
                paddingBottom: i < 2 ? 10 : 0,
                borderBottom: i < 2 ? "1px solid var(--border)" : "none",
              }}>
                <span style={{
                  width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                  background: "var(--primary-light)", color: "var(--primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                }}>
                  {i + 1}
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
}
