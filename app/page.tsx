import Link from "next/link";
import Image from "next/image";

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

const DDAYS = [
  { label: "수능",     date: SUNEUNG, emoji: "🎓", grad: "linear-gradient(135deg,#818cf8,#a78bfa)", shadow: "rgba(129,140,248,0.35)" },
  { label: "중간고사", date: EXAM,    emoji: "📝", grad: "linear-gradient(135deg,#fb923c,#f472b6)", shadow: "rgba(251,146,60,0.35)" },
];

export default function Home() {
  const ddays = DDAYS.map(d => ({ ...d, d: dday(d.date) }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── 우리반 사진 히어로 ── */}
      <div style={{ borderRadius: 28, overflow: "hidden", position: "relative", boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}>
        {/* 사진 */}
        <div style={{ position: "relative", width: "100%", height: "clamp(320px, 55vw, 580px)" }}>
          <Image
            src="/class-photo.jpg"
            alt="2-2 우리반"
            fill
            style={{ objectFit: "cover", objectPosition: "center top" }}
            priority
          />
          {/* 어두운 그라데이션 오버레이 */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.75) 100%)",
          }}/>
        </div>

        {/* 텍스트 오버레이 */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "28px 32px",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center",
            background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)",
            borderRadius: 999, padding: "4px 14px", marginBottom: 10,
            border: "1px solid rgba(255,255,255,0.35)",
          }}>
            <span style={{ fontSize: 12, color: "#fff", fontWeight: 700 }}>
              2026학년도 한영외국어고등학교 2학년 2반 🌸
            </span>
          </div>
          <h1 style={{
            color: "#fff", fontSize: "clamp(22px,4vw,38px)",
            fontWeight: 900, margin: "0 0 8px", letterSpacing: "-0.5px",
            textShadow: "0 2px 16px rgba(0,0,0,0.5)",
          }}>
            안녕하세요, 우리반! 🌟
          </h1>
          {/* 급훈 */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)",
            borderRadius: 16, padding: "10px 18px",
            border: "1px solid rgba(255,255,255,0.3)",
          }}>
            <span style={{ fontSize: 20 }}>✝️</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: "-0.3px", textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}>
                Oh, my God! 오 내 신!
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 600, marginTop: 2 }}>
                우리반 급훈
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 급훈 설명 카드 ── */}
      <div style={{
        borderRadius: 22, padding: "22px 26px",
        background: "linear-gradient(135deg,#fdf4ff,#eff6ff)",
        border: "1.5px solid #e9d5ff",
        boxShadow: "0 4px 20px rgba(167,139,250,0.12)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: "linear-gradient(135deg,#a78bfa,#818cf8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, boxShadow: "0 4px 12px rgba(167,139,250,0.4)",
          }}>✝️</div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: "var(--text)", margin: "0 0 8px", letterSpacing: "-0.3px" }}>
              급훈: Oh, my God! 오 내 신!
            </h2>
            <div style={{ marginTop: 8, padding: "12px 16px", borderRadius: 12, background: "rgba(167,139,250,0.1)", border: "1px solid #ddd6fe" }}>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.7 }}>
                "오 내 신(내신)!" — 내신 시험을 향한 우리의 다짐이에요.
                시험마다 최선을 다해 좋은 내신 성적을 만들어 나가자는 의미예요. 기가 막힌 내신, 기가 막힌 한 해가 되길 🌟
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── D-day ── */}
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

      {/* ── 빠른 이동 ── */}
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

      {/* ── 공지 ── */}
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
            {["개학 준비물 안내", "자리 배치 공지", "수행평가 일정 안내"].map((t, i) => (
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
