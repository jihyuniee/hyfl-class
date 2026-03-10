"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type PraisePost = {
  id: string;
  created_at: string;
  type: "friend" | "self";
  from_name: string | null;
  to_name: string | null;
  content: string;
  likes: number;
};

const STUDENTS = [
  "강지우","김은솔","김태현","김하연","김혜민",
  "박민석","박우진","성연준","손정연","송민주",
  "심지안","양효승","유다현","윤혜림","이승지",
  "이시원","이조은","장지현","전주하","정은지",
  "주보민","최안아","현서정",
];

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff/60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff/3600)}시간 전`;
  const d = new Date(iso);
  return `${d.getMonth()+1}월 ${d.getDate()}일`;
}

export default function PraisePage() {
  const [posts,    setPosts]    = useState<PraisePost[]>([]);
  const [tab,      setTab]      = useState<"all"|"friend"|"self">("all");
  const [formType, setFormType] = useState<"friend"|"self">("friend");
  const [formOpen, setFormOpen] = useState(false);

  // 폼
  const [fromName, setFromName] = useState("");
  const [toName,   setToName]   = useState("");
  const [content,  setContent]  = useState("");
  const [posting,  setPosting]  = useState(false);

  // 이름 검색
  const [toSearch, setToSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const filtered = STUDENTS.filter(s => s.includes(toSearch) && toSearch.length > 0);

  async function load() {
    const { data } = await supabase.from("praise_posts").select("*").order("created_at", { ascending: false });
    setPosts((data as PraisePost[]) ?? []);
  }

  useEffect(() => { load(); }, []);

  async function submit() {
    if (!content.trim()) { alert("내용을 입력해주세요"); return; }
    if (formType === "friend" && !toName) { alert("칭찬할 친구를 선택해주세요"); return; }
    setPosting(true);
    await supabase.from("praise_posts").insert({
      type: formType,
      from_name: fromName.trim() || null,
      to_name: formType === "friend" ? toName : null,
      content: content.trim(),
      likes: 0,
    });
    setPosting(false);
    setFromName(""); setToName(""); setToSearch(""); setContent("");
    setFormOpen(false);
    await load();
  }

  async function like(id: string, current: number) {
    await supabase.from("praise_posts").update({ likes: current + 1 }).eq("id", id);
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: current + 1 } : p));
  }

  const filtered_posts = posts.filter(p =>
    tab === "all" ? true : p.type === tab
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* 헤더 */}
      <div className="hy-hero">
        <h1 style={{ color:"#fff", fontSize:"clamp(22px,4vw,32px)", fontWeight:900, margin:"0 0 8px" }}>🌟 칭찬 게시판</h1>
        <p style={{ color:"rgba(255,255,255,0.85)", fontSize:13, margin:0, fontWeight:500, lineHeight:1.7 }}>
          친구를 칭찬하거나, 오늘 내가 한 일을 자랑해봐요!
        </p>
      </div>

      {/* 글쓰기 버튼 */}
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={() => { setFormType("friend"); setFormOpen(true); }}
          className="hy-btn hy-btn-primary" style={{ flex:1, fontSize:13, padding:"14px" }}>
          🙌 친구 칭찬하기
        </button>
        <button onClick={() => { setFormType("self"); setFormOpen(true); }}
          style={{ flex:1, padding:"14px", borderRadius:16, border:"2px solid #fbbf24", background:"#fffbeb",
            color:"#92400e", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>
          🌟 오늘 내 자랑하기
        </button>
      </div>

      {/* 글쓰기 폼 */}
      {formOpen && (
        <div className="hy-card" style={{ padding:"22px 24px", border:`2px solid ${formType==="friend" ? "var(--primary)" : "#fbbf24"}` }}>
          <h3 style={{ fontSize:15, fontWeight:900, color:"var(--text)", margin:"0 0 16px" }}>
            {formType === "friend" ? "🙌 친구 칭찬하기" : "🌟 오늘 내 자랑하기"}
          </h3>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

            {/* 내 이름 */}
            <input placeholder={formType==="friend" ? "내 이름 (익명 가능, 선택)" : "내 이름 (선택)"}
              value={fromName} onChange={e=>setFromName(e.target.value)} className="hy-input"/>

            {/* 친구 태그 (친구 칭찬일 때만) */}
            {formType === "friend" && (
              <div style={{ position:"relative" }}>
                <input placeholder="칭찬할 친구 이름 검색 🔍"
                  value={toSearch}
                  onChange={e => { setToSearch(e.target.value); setToName(""); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  className="hy-input"
                  style={{ borderColor: toName ? "var(--primary)" : undefined }}/>
                {toName && (
                  <div style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                    fontSize:12, fontWeight:800, color:"var(--primary)", background:"var(--primary-light)",
                    padding:"2px 10px", borderRadius:999 }}>
                    ✓ {toName}
                  </div>
                )}
                {showDropdown && filtered.length > 0 && (
                  <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:100, marginTop:4,
                    background:"#fff", borderRadius:14, border:"1.5px solid var(--border)", boxShadow:"0 8px 24px rgba(0,0,0,0.1)", overflow:"hidden" }}>
                    {filtered.map(s => (
                      <button key={s} onClick={() => { setToName(s); setToSearch(s); setShowDropdown(false); }}
                        style={{ width:"100%", padding:"12px 16px", border:"none", background:"transparent",
                          textAlign:"left", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                          borderBottom:"1px solid #f3f4f6", color:"var(--text)" }}>
                        👤 {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <textarea
              placeholder={formType === "friend"
                ? "어떤 점이 좋았는지 구체적으로 써줘요 🙂\n예) 오늘 수업 도구 빌려줘서 너무 고마웠어! 항상 배려심이 넘쳐!"
                : "오늘 내가 한 일을 자랑해봐요 💪\n예) 오늘 수학 문제 드디어 풀었다!!! 3일 걸렸는데 성공!"}
              value={content} onChange={e=>setContent(e.target.value)}
              className="hy-input" style={{ minHeight:100, resize:"vertical" }}/>

            <div style={{ display:"flex", gap:8 }}>
              <button onClick={submit} disabled={posting} className="hy-btn hy-btn-primary" style={{ flex:1, fontSize:14 }}>
                {posting ? "올리는 중..." : "게시하기 🚀"}
              </button>
              <button onClick={() => { setFormOpen(false); setFromName(""); setToName(""); setToSearch(""); setContent(""); }}
                className="hy-btn" style={{ fontSize:13 }}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 탭 필터 */}
      <div style={{ display:"flex", background:"#f3f4f6", borderRadius:16, padding:4, gap:4 }}>
        {([
          { key:"all",    label:"✨ 전체" },
          { key:"friend", label:"🙌 친구 칭찬" },
          { key:"self",   label:"🌟 내 자랑" },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex:1, padding:"10px 8px", borderRadius:12, border:"none", cursor:"pointer", fontFamily:"inherit",
              background: tab===t.key ? "#fff" : "transparent",
              boxShadow: tab===t.key ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              fontSize:13, fontWeight:800,
              color: tab===t.key ? "var(--primary)" : "var(--text-muted)" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 게시글 목록 */}
      {filtered_posts.length === 0 ? (
        <div className="hy-card" style={{ padding:"40px", textAlign:"center" }}>
          <p style={{ fontSize:32, margin:"0 0 12px" }}>🌱</p>
          <p style={{ fontSize:14, color:"var(--text-subtle)", fontWeight:600 }}>
            아직 글이 없어요.<br/>첫 번째로 칭찬을 남겨봐요!
          </p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {filtered_posts.map(post => (
            <div key={post.id} className="hy-card" style={{ padding:"18px 22px",
              borderLeft: `4px solid ${post.type==="friend" ? "var(--primary)" : "#fbbf24"}` }}>

              {/* 상단: 타입 뱃지 + 시간 */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:11, padding:"3px 10px", borderRadius:999, fontWeight:800,
                    background: post.type==="friend" ? "var(--primary-light)" : "#fffbeb",
                    color: post.type==="friend" ? "var(--primary)" : "#92400e" }}>
                    {post.type==="friend" ? "🙌 친구 칭찬" : "🌟 내 자랑"}
                  </span>
                  {/* 친구 칭찬: to/from 표시 */}
                  {post.type==="friend" && post.to_name && (
                    <span style={{ fontSize:13, fontWeight:900, color:"var(--text)" }}>
                      {post.from_name ? `${post.from_name} → ` : "익명 → "}
                      <span style={{ color:"var(--primary)" }}>@{post.to_name}</span>
                    </span>
                  )}
                  {/* 내 자랑: from 표시 */}
                  {post.type==="self" && (
                    <span style={{ fontSize:13, fontWeight:900, color:"var(--text)" }}>
                      {post.from_name ?? "익명"}
                    </span>
                  )}
                </div>
                <span style={{ fontSize:11, color:"var(--text-subtle)", fontWeight:600 }}>{timeAgo(post.created_at)}</span>
              </div>

              {/* 내용 */}
              <p style={{ fontSize:14, color:"var(--text)", lineHeight:1.8, margin:"0 0 12px", whiteSpace:"pre-wrap" }}>
                {post.content}
              </p>

              {/* 좋아요 */}
              <button onClick={() => like(post.id, post.likes)}
                style={{ padding:"6px 14px", borderRadius:999, border:"1.5px solid #fecdd3", background:"#fff5f5",
                  fontSize:13, fontWeight:700, color:"#e11d48", cursor:"pointer", fontFamily:"inherit",
                  display:"flex", alignItems:"center", gap:4 }}>
                ❤️ {post.likes}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
