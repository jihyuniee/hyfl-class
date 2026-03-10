"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type Post = {
  id: string;
  created_at: string;
  content: string;
  author: string | null;
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff/60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff/3600)}시간 전`;
  const d = new Date(iso);
  return `${d.getMonth()+1}월 ${d.getDate()}일`;
}

const ACTIVITIES = [
  {
    emoji: "🔬",
    title: "전공분야별 심화탐구활동",
    color: "linear-gradient(135deg,#0ea5e9,#6366f1)",
    shadow: "rgba(14,165,233,0.2)",
    href: "/research",
    items: [
      "공통된 탐구 주제를 선정합니다.",
      "학년 초 관심 분야 또는 희망 진로를 바탕으로 모둠을 구성합니다.",
      "모둠별로 관련 도서를 선정하여 아침 자습 시간을 활용해 독서를 진행합니다.",
      "아침시간 및 HR 시간을 활용하여 심화 탐구 활동을 진행합니다.",
      "설문조사, 잡지 제작 등 다양한 형태의 결과물을 제작하고 1학기 말에 중간 보고물을 제출합니다.",
      "학년 말 HR 시간을 활용하여 모둠별 탐구 결과를 발표합니다.",
    ],
    note: "운영: HR 시간 활동은 회장, 부회장이 중심이 되어 진행합니다.",
  },
  {
    emoji: "🤝",
    title: "교과 멘토·멘티 협력 학습 활동",
    color: "linear-gradient(135deg,#f59e0b,#ef4444)",
    shadow: "rgba(245,158,11,0.2)",
    href: "/mentor",
    items: [
      "교과별로 학습 역량이 우수한 학생을 멘토로 선발합니다.",
      "멘토는 친구들의 질문에 답변하며 학습을 돕습니다.",
      "시험 기간 전 예상 문제 제작 및 학습 자료 공유 활동을 합니다.",
      "간단한 쪽지시험 또는 문제 풀이 활동을 통해 학습 내용을 점검합니다.",
      "멘토 학생은 활동 내용을 멘토 활동 기록지에 작성합니다.",
    ],
    note: "운영: HR 시간 활동은 회장, 부회장이 중심이 되어 진행합니다.",
  },
  {
    emoji: "💪",
    title: "90일 좋은 습관 만들기 프로젝트",
    color: "linear-gradient(135deg,#34d399,#3b82f6)",
    shadow: "rgba(52,211,153,0.2)",
    href: "/habits",
    items: [
      "각자 만들고 싶은 좋은 습관을 하나 정합니다.",
      "90일 동안 꾸준히 실천하며 습관 형성을 목표로 합니다.",
      "매일 실천 여부를 웹앱에 체크합니다.",
      "서로의 실천을 응원하며 꾸준한 자기관리 습관을 기릅니다.",
    ],
    note: "운영: 웹앱을 통해 수시로 체크합니다.",
  },
];

export default function AboutPage() {
  const [posts,    setPosts]    = useState<Post[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [content,  setContent]  = useState("");
  const [author,   setAuthor]   = useState("");
  const [loading,  setLoading]  = useState(false);

  async function load() {
    const { data } = await supabase
      .from("about_posts")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts((data as Post[]) ?? []);
  }

  useEffect(() => { load(); }, []);

  async function submit() {
    if (!content.trim()) { alert("내용을 입력하세요"); return; }
    setLoading(true);
    await supabase.from("about_posts").insert({
      content: content.trim(),
      author: author.trim() || null,
    });
    setLoading(false);
    setContent(""); setAuthor(""); setFormOpen(false);
    await load();
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

      {/* 헤더 */}
      <div className="hy-hero">
        <div style={{ position:"relative" }}>
          <div style={{ display:"inline-flex", alignItems:"center", background:"rgba(255,255,255,0.2)", backdropFilter:"blur(8px)", borderRadius:999, padding:"4px 14px", marginBottom:12, border:"1px solid rgba(255,255,255,0.3)" }}>
            <span style={{ fontSize:12, color:"#fff", fontWeight:700 }}>2026 한영외고 2-2</span>
          </div>
          <h1 style={{ color:"#fff", fontSize:"clamp(22px,4vw,32px)", fontWeight:900, margin:"0 0 8px", letterSpacing:"-0.5px" }}>
            🏫 학급 소개
          </h1>
          <p style={{ color:"rgba(255,255,255,0.85)", fontSize:13, margin:0, fontWeight:500, lineHeight:1.7 }}>
            한영외국어고등학교 중국어과 2학년 2반
          </p>
        </div>
      </div>

      {/* 급훈 */}
      <div style={{ borderRadius:24, padding:"28px", background:"linear-gradient(135deg,#fdf2f8,#f5f3ff)", border:"1.5px solid #f9a8d4", textAlign:"center" }}>
        <p style={{ fontSize:13, fontWeight:700, color:"var(--primary)", margin:"0 0 8px", letterSpacing:"0.05em" }}>✨ 우리반 급훈</p>
        <h2 style={{ fontSize:"clamp(20px,5vw,30px)", fontWeight:900, color:"var(--text)", margin:"0 0 16px", letterSpacing:"-0.5px" }}>
          Oh, my God! 오 내 신!
        </h2>
        <div style={{ display:"flex", flexDirection:"column", gap:8, maxWidth:420, margin:"0 auto" }}>
          <div style={{ background:"#fff", borderRadius:14, padding:"12px 18px", border:"1px solid #f9a8d4" }}>
            <span style={{ fontSize:13, color:"var(--text-muted)", fontWeight:600 }}>
              🙏 <b>Oh, my God!</b> — 매 순간 감사하는 마음으로
            </span>
          </div>
          <div style={{ background:"#fff", borderRadius:14, padding:"12px 18px", border:"1px solid #c4b5fd" }}>
            <span style={{ fontSize:13, color:"var(--text-muted)", fontWeight:600 }}>
              📚 <b>오 내 신!</b> — 오직 내신만이 살 길! 열심히 공부하자
            </span>
          </div>
        </div>
      </div>

      {/* 우리반 정보 카드 */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
        {[
          { emoji:"🏫", label:"학교", value:"한영외국어고등학교" },
          { emoji:"🌏", label:"학과", value:"중국어과" },
          { emoji:"📚", label:"학년/반", value:"2학년 2반" },
          { emoji:"📅", label:"학년도", value:"2026학년도" },
        ].map(item => (
          <div key={item.label} className="hy-card" style={{ padding:"16px", textAlign:"center" }}>
            <p style={{ fontSize:26, margin:"0 0 6px" }}>{item.emoji}</p>
            <p style={{ fontSize:11, color:"var(--text-subtle)", fontWeight:700, margin:"0 0 4px", textTransform:"uppercase", letterSpacing:"0.05em" }}>{item.label}</p>
            <p style={{ fontSize:12, color:"var(--text)", fontWeight:800, margin:0, lineHeight:1.4 }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* 학급 자율활동 */}
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"20px 24px", background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", borderRadius:22, border:"1.5px solid #86efac", marginBottom:14 }}>
          <span style={{ fontSize:28 }}>📢</span>
          <div>
            <p style={{ fontSize:12, fontWeight:800, color:"#22c55e", margin:"0 0 2px", textTransform:"uppercase", letterSpacing:"0.06em" }}>2026학년도</p>
            <h2 style={{ fontSize:17, fontWeight:900, color:"var(--text)", margin:0 }}>우리반 학급 자율활동</h2>
            <p style={{ fontSize:13, color:"var(--text-muted)", margin:"4px 0 0", fontWeight:500 }}>올해 우리 반은 다음 3가지 학급 자율활동을 진행합니다.</p>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {ACTIVITIES.map(act => (
            <div key={act.title} style={{ borderRadius:20, overflow:"hidden", boxShadow:`0 4px 20px ${act.shadow}` }}>
              <div style={{ background:act.color, padding:"16px 22px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:22 }}>{act.emoji}</span>
                  <h3 style={{ color:"#fff", fontSize:14, fontWeight:900, margin:0 }}>{act.title}</h3>
                </div>
                <a href={act.href} style={{ fontSize:12, fontWeight:700, color:"#fff", background:"rgba(255,255,255,0.2)", padding:"4px 12px", borderRadius:999, textDecoration:"none", border:"1px solid rgba(255,255,255,0.3)", whiteSpace:"nowrap" }}>
                  바로가기 →
                </a>
              </div>
              <div style={{ background:"#fff", padding:"16px 22px" }}>
                <ul style={{ margin:0, padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:6 }}>
                  {act.items.map((item, i) => (
                    <li key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:13, color:"var(--text-muted)", lineHeight:1.6 }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--primary)", flexShrink:0, marginTop:6 }}/>
                      {item}
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop:10, padding:"8px 14px", borderRadius:10, background:"#f9fafb", border:"1px solid var(--border)" }}>
                  <p style={{ fontSize:12, fontWeight:700, color:"var(--text-subtle)", margin:0 }}>📌 {act.note}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 우리반 한마디 */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <h2 style={{ fontSize:17, fontWeight:900, color:"var(--text)", margin:"0 0 4px" }}>💬 우리반 한마디</h2>
            <p style={{ fontSize:13, color:"var(--text-muted)", margin:0, fontWeight:500 }}>
              우리반 소개에 넣고 싶은 말을 자유롭게 남겨봐요
            </p>
          </div>
          <button onClick={() => setFormOpen(o => !o)} className="hy-btn hy-btn-primary" style={{ fontSize:13, whiteSpace:"nowrap" }}>
            {formOpen ? "닫기" : "✏️ 글 남기기"}
          </button>
        </div>

        {formOpen && (
          <div className="hy-card" style={{ padding:"20px 22px", marginBottom:14 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <textarea
                placeholder="우리반에 대해 하고 싶은 말을 자유롭게 써줘요 🙂"
                value={content} onChange={e => setContent(e.target.value)}
                className="hy-input" style={{ minHeight:100, resize:"vertical" }}
              />
              <input placeholder="이름 (선택, 비워두면 익명)" value={author} onChange={e => setAuthor(e.target.value)} className="hy-input"/>
              <button onClick={submit} disabled={loading} className="hy-btn hy-btn-primary" style={{ fontSize:13, alignSelf:"flex-start" }}>
                {loading ? "등록 중..." : "등록하기"}
              </button>
            </div>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="hy-card" style={{ padding:"40px", textAlign:"center" }}>
            <p style={{ fontSize:32, margin:"0 0 10px" }}>💬</p>
            <p style={{ fontSize:14, color:"var(--text-subtle)", fontWeight:600 }}>첫 번째로 한마디 남겨봐요!</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {posts.map(post => (
              <div key={post.id} className="hy-card" style={{ padding:"16px 20px", borderLeft:"3px solid var(--primary)" }}>
                <p style={{ fontSize:14, color:"var(--text)", lineHeight:1.7, margin:"0 0 8px", whiteSpace:"pre-wrap" }}>{post.content}</p>
                <p style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:600, margin:0 }}>
                  {post.author ?? "익명"} · {timeAgo(post.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
