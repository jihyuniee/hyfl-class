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
  { href: "/schedule",   emoji: "📅", label: "일정/수행",  bg: "linear-gradient(135deg,#dbeafe,#e0f2fe)", accent: "#3b82f6", border: "#bfdbfe" },
  { href: "/counseling", emoji: "💬", label: "상담",       bg: "linear-gradient(135deg,#dcfce7,#d1fae5)", accent: "#22c55e", border: "#bbf7d0" },
  { href: "/habits",     emoji: "💪", label: "90일 습관",  bg: "linear-gradient(135deg,#f3e8ff,#ede9fe)", accent: "#a855f7", border: "#e9d5ff" },
  { href: "/roles",      emoji: "🙋", label: "1인1역할",   bg: "linear-gradient(135deg,#ffedd5,#fef3c7)", accent: "#f97316", border: "#fed7aa" },
  { href: "/wall",       emoji: "🌸", label: "학생 소개",  bg: "linear-gradient(135deg,#fce7f3,#fdf2f8)", accent: "#ec4899", border: "#fbcfe8" },
  { href: "/notice",     emoji: "📢", label: "공지",       bg: "linear-gradient(135deg,#e0f2fe,#f0f9ff)", accent: "#0ea5e9", border: "#bae6fd" },
];

const NOTICES = ["개학 준비물 안내", "자리 배치 공지", "수행평가 일정 안내"];

const DDAYS = [
  { label: "수능",     date: SUNEUNG, emoji: "🎓", grad: "linear-gradient(135deg,#818cf8,#a78bfa)", shadow: "rgba(129,140,248,0.35)" },
  { label: "중간고사", date: EXAM,    emoji: "📝", grad: "linear-gradient(135deg,#fb923c,#f472b6)", shadow: "rgba(251,146,60,0.35)" },
];

export default function Home() {
  const ddays = DDAYS.map(d => ({ ...d, d: dday(d.date) }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #f9a8d4 0%, #c084fc 40%, #818cf8 100%)",
        borderRadius: 28, padding: "36px 32px",
        position: "relative", overflow: "hidden",
        boxShadow: "0 12px 40px rgba(192,132,252,0.35)",
      }}>
        {[
          { w:160, h:160, top:-50, right:-30, op:0.12 },
          { w:90,  h:90,  top:20,  right:120, op:0.09 },
          { w:60,  h:60,  bottom:-20, left:80, op:0.10 },
        ].map((b, i) => (
          <div key={i} style={{
            position:"absolute", width:b.w, height:b.h,
            top:b.top, right:b.right, bottom:b.bottom, left:b.left,
            borderRadius:"50%", background:"#fff", opacity:b.op,
          }}/>
        ))}
        <div style={{ position:"relative" }}>
          <div style={{
            display:"inline-flex", alignItems:"center",
            background:"rgba(255,255,255,0.25)", backdropFilter:"blur(8px)",
            borderRadius:999, padding:"5px 14px", marginBottom:16,
            border:"1px solid rgba(255,255,255,0.35)",
          }}>
            <span style={{ fontSize:13, color:"#fff", fontWeight:700 }}>
              2025학년도 2학년 2반
            </span>
          </div>
          <h1 style={{
            color:"#fff", fontSize:"clamp(24px,4vw,38px)",
            fontWeight:900, margin:"0 0 10px",
            letterSpacing:"-0.5px", textShadow:"0 2px 12px rgba(0,0,0,0.12)",
          }}>
            안녕하세요, 우리반! 🌟
          </h1>
          <p style={{ color:"rgba(255,255,255,0.85)", fontSize:15, margin:0, fontWeight:500 }}>
            일정 · 수행평가 · 상담 · 우리반 약속을 한 곳에서 🎀
          </p>
        </div>
      </div>

      {/* D-day */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:14 }}>
        {ddays.map((item) => (
          <div key={item.label} style={{
            background: item.grad, borderRadius:22, padding:"22px 24px",
            boxShadow: `0 8px 24px ${item.shadow}`,
            border:"1.5px solid rgba(255,255,255,0.6)",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <span style={{ fontSize:22 }}>{item.emoji}</span>
              <span style={{ fontSize:13, fontWeight:800, color:"rgba(255,255,255,0.9)" }}>{item.label}</span>
            </div>
            <div style={{ fontSize:36, fontWeight:900, color:"#fff", letterSpacing:"-2px", lineHeight:1 }}>
              D-{item.d}
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)", marginTop:6, fontWeight:500 }}>{item.date}</div>
          </div>
        ))}

        <div style={{
          background:"linear-gradient(135deg,#fdf2f8,#f5f3ff)",
          borderRadius:22, padding:"22px 24px",
          border:"1.5px solid #f9d0ea",
          boxShadow:"0 4px 16px rgba(244,114,182,0.12)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <span style={{ fontSize:22 }}>☀️</span>
            <span style={{ fontSize:13, fontWeight:800, color:"var(--text-muted)" }}>오늘 체크</span>
          </div>
          <ul style={{ margin:0, padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:8 }}>
            {["수행평가 마감 확인", "공지 새 글 확인", "상담 신청 필요 여부"].map((t) => (
              <li key={t} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"var(--text-muted)", fontWeight:500 }}>
                <span style={{
                  width:7, height:7, borderRadius:"50%",
                  background:"linear-gradient(135deg,#f472b6,#a78bfa)",
                  flexShrink:0, display:"inline-block",
                }}/>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 빠른 이동 */}
      <div>
        <p className="hy-section-label" style={{ marginBottom:14 }}>빠른 이동</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(145px,1fr))", gap:12 }}>
          {QUICK_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="hy-quick-link"
              style={{ background:item.bg, border:`1.5px solid ${item.border}` }}>
              <span style={{ fontSize:26 }}>{item.emoji}</span>
              <span style={{ fontSize:14, fontWeight:800, color:"var(--text)", letterSpacing:"-0.3px" }}>
                {item.label}
              </span>
              <span style={{ fontSize:12, fontWeight:700, color:item.accent }}>바로가기 →</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 공지 */}
      <div className="hy-card" style={{ padding:"24px 26px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div>
            <p className="hy-section-label" style={{ marginBottom:4 }}>최근 공지</p>
            <h3 style={{ fontSize:16, fontWeight:800, color:"var(--text)", margin:0, letterSpacing:"-0.3px" }}>
              📢 공지사항
            </h3>
          </div>
          <Link href="/notice" style={{ fontSize:13, fontWeight:700, color:"var(--primary)", textDecoration:"none" }}>
            전체보기 →
          </Link>
        </div>
        <div className="hy-soft" style={{ padding:"14px 16px" }}>
          <ul style={{ margin:0, padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:10 }}>
            {NOTICES.map((t, i) => (
              <li key={t} style={{
                display:"flex", alignItems:"center", gap:10,
                fontSize:14, color:"var(--text-muted)", fontWeight:500,
                paddingBottom: i < 2 ? 10 : 0,
                borderBottom: i < 2 ? "1.5px solid var(--border)" : "none",
              }}>
                <span style={{
                  width:26, height:26, borderRadius:9, flexShrink:0,
                  background:"linear-gradient(135deg,#f472b6,#a78bfa)",
                  color:"#fff", display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:11, fontWeight:800,
                }}>
                  {i+1}
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