"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type PraisePost = {
  id: string;
  created_at: string;
  type: "friend" | "self";
  from_name: string | null;
  to_name: string | null;
  category: string | null;
  content: string;
  likes: number;
};

const STUDENTS = [
  "강지우","김은솔","김태현","김하연","김혜민",
  "박민석","박우진","성연준","손정연","송민주",
  "심지안","양효승","유다현","윤혜림","이승지",
  "이시원","이조은","장지현","전주하","정은지",
  "주보민","최인아","현서정",
];

const FRIEND_CATEGORIES = [
  { emoji:"🙋", label:"책임감", desc:"맡은 일을 꾸준히 수행하고 끝까지 마무리한 모습" },
  { emoji:"🌱", label:"솔선수범", desc:"필요한 일을 스스로 찾아 먼저 행동한 모습" },
  { emoji:"🌸", label:"배려와 공감", desc:"친구의 어려움을 살피고 따뜻하게 도운 모습" },
  { emoji:"💬", label:"소통과 조율", desc:"의견을 경청하고 갈등을 합리적으로 조정한 모습" },
  { emoji:"🤝", label:"학급 기여", desc:"우리 반이 더 좋아지도록 힘을 보탠 모습" },
  { emoji:"💡", label:"학습 나눔", desc:"배운 내용을 설명하고 함께 성장하도록 도운 모습" },
  { emoji:"🛠️", label:"문제 해결", desc:"학급의 불편을 발견하고 해결 방법을 실천한 모습" },
  { emoji:"☀️", label:"긍정적 태도", desc:"밝고 성실한 태도로 좋은 분위기를 만든 모습" },
  { emoji:"✨", label:"그 밖의 좋은 행동", desc:"친구에게서 발견한 의미 있는 행동" },
];

const SELF_CATEGORIES = [
  { emoji:"🙋", label:"1인 1역할", desc:"맡은 역할을 책임감 있게 수행한 일" },
  { emoji:"🌱", label:"자발적인 실천", desc:"시키지 않아도 필요한 일을 먼저 한 경험" },
  { emoji:"🤝", label:"친구와 학급 돕기", desc:"친구 또는 우리 반에 도움이 된 행동" },
  { emoji:"💡", label:"학습 나눔", desc:"배운 내용을 친구와 나누며 함께 성장한 경험" },
  { emoji:"🛠️", label:"문제 해결", desc:"불편이나 문제를 발견하고 해결한 경험" },
  { emoji:"💪", label:"꾸준함과 성장", desc:"어려움 속에서도 계속 실천하거나 개선한 일" },
  { emoji:"✨", label:"그 밖의 실천", desc:"나의 책임감과 성장을 보여 주는 행동" },
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

  const [fromName, setFromName] = useState("");
  const [toName,   setToName]   = useState("");
  const [category, setCategory] = useState("");
  const [content,  setContent]  = useState("");
  const [posting,  setPosting]  = useState(false);

  const cats = formType === "friend" ? FRIEND_CATEGORIES : SELF_CATEGORIES;

  async function load() {
    const { data } = await supabase
      .from("praise_posts").select("*")
      .order("created_at", { ascending: false });
    setPosts((data as PraisePost[]) ?? []);
  }

  useEffect(() => { load(); }, []);

  function openForm(type: "friend" | "self") {
    setFormType(type); setFormOpen(true);
    setFromName(""); setToName(""); setCategory(""); setContent("");
  }

  async function submit() {
    if (!category)           { alert("카테고리를 선택해주세요"); return; }
    if (!content.trim())     { alert("내용을 입력해주세요"); return; }
    if (formType === "friend" && !toName) { alert("좋은 행동을 발견한 친구를 선택해주세요"); return; }
    if (formType === "self" && !fromName) { alert("내 이름을 선택해주세요"); return; }
    setPosting(true);
    await supabase.from("praise_posts").insert({
      type: formType,
      from_name: fromName.trim() || null,
      to_name: formType === "friend" ? toName : null,
      category,
      content: content.trim(),
      likes: 0,
    });
    setPosting(false);
    setFormOpen(false);
    await load();
  }

  async function like(id: string, current: number) {
    await supabase.from("praise_posts").update({ likes: current + 1 }).eq("id", id);
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: current + 1 } : p));
  }

  const filteredPosts = posts.filter(p => tab === "all" || p.type === tab);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* 헤더 */}
      <div className="hy-hero">
        <h1 style={{ color:"#fff", fontSize:"clamp(22px,4vw,32px)", fontWeight:900, margin:"0 0 8px" }}>
          🌱 우리 반 성장 기록
        </h1>
        <p style={{ color:"rgba(255,255,255,0.85)", fontSize:13, margin:0, fontWeight:500, lineHeight:1.8 }}>
          평소의 작은 실천과 서로의 좋은 행동을 구체적으로 남겨요.
        </p>
      </div>

      <div className="hy-card" style={{ padding:"16px 18px", background:"#f8fafc" }}>
        <p style={{ fontSize:13, color:"var(--text)", fontWeight:800, margin:"0 0 7px" }}>
          작은 행동도 좋은 기록이 됩니다
        </p>
        <p style={{ fontSize:12, color:"var(--text-muted)", lineHeight:1.75, margin:0 }}>
          1인 1역할을 꾸준히 수행한 일, 친구를 도운 일, 학습을 나눈 일, 학급의 문제를 해결한 일처럼
          평소의 구체적인 모습을 남겨주세요. 선생님이 여러분을 더 잘 이해하는 참고 자료로 활용합니다.
        </p>
      </div>

      <p style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:600, margin:"0 0 -8px", textAlign:"right" }}>
        💡 상황 → 행동 → 도움·변화의 순서로 기록해요
      </p>

      {/* 글쓰기 버튼 */}
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={() => openForm("friend")}
          className="hy-btn hy-btn-primary"
          style={{ flex:1, fontSize:13, padding:"14px" }}>
          👀 친구의 좋은 행동 남기기
        </button>
        <button onClick={() => openForm("self")}
          style={{
            flex:1, padding:"14px", borderRadius:16,
            border:"2px solid #fbbf24", background:"#fffbeb",
            color:"#92400e", fontSize:13, fontWeight:800,
            cursor:"pointer", fontFamily:"inherit",
          }}>
          ✍️ 나의 실천 기록하기
        </button>
      </div>

      {/* 글쓰기 폼 */}
      {formOpen && (
        <div className="hy-card" style={{
          padding:"24px 26px",
          border:`2px solid ${formType === "friend" ? "var(--primary)" : "#fbbf24"}`,
        }}>
          <h3 style={{ fontSize:15, fontWeight:900, color:"var(--text)", margin:"0 0 18px" }}>
            {formType === "friend" ? "👀 친구의 좋은 행동 남기기" : "✍️ 나의 실천 기록하기"}
          </h3>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* 내 이름 */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:5 }}>
                내 이름 {formType === "friend" ? "(익명 가능)" : "*"}
              </label>
              <select
                value={fromName}
                onChange={e => setFromName(e.target.value)}
                className="hy-input"
                style={{ cursor:"pointer" }}
              >
                <option value="">{formType === "friend" ? "익명으로 올리기" : "내 이름을 선택해주세요"}</option>
                {STUDENTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* 칭찬받을 친구 선택 — 드롭다운 */}
            {formType === "friend" && (
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:5 }}>
                  좋은 행동을 발견한 친구 *
                </label>
                <select
                  value={toName}
                  onChange={e => setToName(e.target.value)}
                  className="hy-input"
                  style={{
                    cursor:"pointer",
                    borderColor: toName ? "var(--primary)" : undefined,
                    background: toName ? "var(--primary-light)" : undefined,
                    color: toName ? "var(--primary)" : undefined,
                    fontWeight: toName ? 800 : undefined,
                  }}
                >
                  <option value="">친구를 선택해주세요 👇</option>
                  {STUDENTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {toName && (
                  <p style={{ fontSize:12, color:"var(--primary)", fontWeight:700, margin:"6px 0 0" }}>
                    ✓ {toName}의 좋은 행동을 기록할게요!
                  </p>
                )}
              </div>
            )}

            {/* 카테고리 */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:8 }}>
                {formType === "friend" ? "어떤 좋은 행동이었나요? *" : "어떤 실천을 기록할까요? *"}
              </label>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {cats.map(c => (
                  <button key={c.label} onClick={() => setCategory(c.label)}
                    style={{
                      padding:"11px 16px", borderRadius:12, border:"1.5px solid",
                      textAlign:"left", cursor:"pointer", fontFamily:"inherit",
                      transition:"all 0.1s",
                      borderColor: category === c.label ? "var(--primary)" : "var(--border)",
                      background: category === c.label ? "var(--primary-light)" : "#fff",
                    }}>
                    <p style={{
                      fontSize:13, fontWeight:800, margin:"0 0 2px",
                      color: category === c.label ? "var(--primary)" : "var(--text)",
                    }}>{c.emoji} {c.label}</p>
                    <p style={{ fontSize:11, color:"var(--text-subtle)", margin:0, fontWeight:500 }}>
                      {c.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* 내용 */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:6 }}>
                상황과 행동, 도움이나 변화를 구체적으로 써주세요 *
              </label>
              <textarea
                placeholder={formType === "friend"
                  ? "상황 → 친구가 한 행동 → 도움이 된 점을 써주세요.\n예) 수행평가 일정을 놓친 친구에게 준비물과 제출일을 다시 알려 주고 함께 확인하여 과제를 제때 제출하도록 도왔다."
                  : "상황 → 내가 한 행동 → 친구나 학급에 생긴 변화를 써주세요.\n예) 이번 주 알림이 역할을 맡아 수행평가 일정을 정리하고 전날 다시 안내하여 친구들이 제출일을 놓치지 않도록 도왔다."}
                value={content}
                onChange={e => setContent(e.target.value)}
                className="hy-input"
                style={{ minHeight:120, resize:"vertical" }}
              />
            </div>

            <div style={{ display:"flex", gap:8 }}>
              <button onClick={submit} disabled={posting}
                className="hy-btn hy-btn-primary"
                style={{ flex:1, fontSize:14 }}>
                {posting ? "올리는 중..." : "게시하기 🚀"}
              </button>
              <button onClick={() => setFormOpen(false)} className="hy-btn" style={{ fontSize:13 }}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 탭 필터 */}
      <div style={{ display:"flex", background:"#f3f4f6", borderRadius:16, padding:4, gap:4 }}>
        {([
          { key:"all",    label:"✨ 전체" },
          { key:"friend", label:"👀 친구의 좋은 행동" },
          { key:"self",   label:"✍️ 나의 실천" },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              flex:1, padding:"10px 8px", borderRadius:12, border:"none",
              cursor:"pointer", fontFamily:"inherit",
              background: tab === t.key ? "#fff" : "transparent",
              boxShadow: tab === t.key ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              fontSize:13, fontWeight:800,
              color: tab === t.key ? "var(--primary)" : "var(--text-muted)",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 게시글 목록 */}
      {filteredPosts.length === 0 ? (
        <div className="hy-card" style={{ padding:"40px", textAlign:"center" }}>
          <p style={{ fontSize:32, margin:"0 0 12px" }}>🌱</p>
          <p style={{ fontSize:14, color:"var(--text-subtle)", fontWeight:600 }}>
            아직 기록이 없어요.<br/>오늘 발견한 좋은 행동부터 남겨봐요!
          </p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {filteredPosts.map(post => {
            const allCats = [...FRIEND_CATEGORIES, ...SELF_CATEGORIES];
            return (
              <div key={post.id} className="hy-card" style={{
                padding:"18px 22px",
                borderLeft:`4px solid ${post.type === "friend" ? "var(--primary)" : "#fbbf24"}`,
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
                  marginBottom:8, flexWrap:"wrap", gap:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                    <span style={{
                      fontSize:11, padding:"3px 10px", borderRadius:999, fontWeight:800,
                      background: post.type === "friend" ? "var(--primary-light)" : "#fffbeb",
                      color: post.type === "friend" ? "var(--primary)" : "#92400e",
                    }}>
                      {post.type === "friend" ? "👀 친구의 좋은 행동" : "✍️ 나의 실천"}
                    </span>
                    {post.category && (
                      <span style={{
                        fontSize:11, padding:"3px 10px", borderRadius:999, fontWeight:700,
                        background:"#f3f4f6", color:"var(--text-muted)",
                      }}>
                        {allCats.find(c => c.label === post.category)?.emoji ?? "✨"} {post.category}
                      </span>
                    )}
                    {post.type === "friend" && post.to_name && (
                      <span style={{ fontSize:13, fontWeight:900, color:"var(--text)" }}>
                        {post.from_name ? `${post.from_name} → ` : "익명 → "}
                        <span style={{ color:"var(--primary)" }}>@{post.to_name}</span>
                      </span>
                    )}
                    {post.type === "self" && (
                      <span style={{ fontSize:13, fontWeight:900, color:"var(--text)" }}>
                        {post.from_name ?? "익명"}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize:11, color:"var(--text-subtle)", fontWeight:600 }}>
                    {timeAgo(post.created_at)}
                  </span>
                </div>

                <p style={{ fontSize:14, color:"var(--text)", lineHeight:1.8, margin:"0 0 12px", whiteSpace:"pre-wrap" }}>
                  {post.content}
                </p>

                <button onClick={() => like(post.id, post.likes)}
                  style={{
                    padding:"6px 14px", borderRadius:999,
                    border:"1.5px solid #fecdd3", background:"#fff5f5",
                    fontSize:13, fontWeight:700, color:"#e11d48",
                    cursor:"pointer", fontFamily:"inherit",
                    display:"flex", alignItems:"center", gap:4,
                  }}>
                  ❤️ {post.likes}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
