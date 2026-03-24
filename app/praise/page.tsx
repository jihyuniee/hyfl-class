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
  "주보민","최안아","현서정",
];

const FRIEND_CATEGORIES = [
  { emoji:"⏱", label:"시간 활용의 달인", desc:"자투리 시간을 효율적으로 활용한 친구" },
  { emoji:"🛡", label:"위기 해결사", desc:"어려움이 있을 때 잘 해결되도록 도와준 친구" },
  { emoji:"🎯", label:"진로를 향해", desc:"진로를 위해 열심히 노력하는 친구" },
  { emoji:"🤝", label:"돈독한 친구", desc:"닮고 싶은 좋은 관계를 만드는 친구" },
  { emoji:"💡", label:"친절한 선생님", desc:"친구들의 질문에 친절하게 대답해주는 친구" },
  { emoji:"🌸", label:"양보와 배려", desc:"배려가 몸에 밴 친구" },
  { emoji:"👑", label:"리더십", desc:"우리반 리더십이 뛰어난 친구" },
  { emoji:"📚", label:"수업 태도", desc:"수업시간에 가장 칭찬해주고 싶은 친구" },
  { emoji:"✨", label:"기타 칭찬", desc:"그 외 칭찬하고 싶은 친구" },
];

const SELF_CATEGORIES = [
  { emoji:"🙋", label:"1인1역할", desc:"오늘 내 역할을 완벽하게 해냈어요" },
  { emoji:"📚", label:"학습 성취", desc:"공부에서 뿌듯한 일이 있었어요" },
  { emoji:"🤝", label:"학급 기여", desc:"우리 반을 위해 의미 있는 일을 했어요" },
  { emoji:"🎯", label:"목표 달성", desc:"세운 목표를 이뤄냈어요" },
  { emoji:"💪", label:"도전 극복", desc:"어렵지만 포기하지 않았어요" },
  { emoji:"✨", label:"기타 자랑", desc:"그 외 자랑하고 싶은 일" },
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
    if (formType === "friend" && !toName) { alert("칭찬할 친구를 선택해주세요"); return; }
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
          🌟 칭찬 게시판
        </h1>
        <p style={{ color:"rgba(255,255,255,0.85)", fontSize:13, margin:0, fontWeight:500, lineHeight:1.8 }}>
          친구를 칭찬하거나, 오늘 내가 한 일을 자랑해봐요!
        </p>
      </div>

      <p style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:600, margin:"0 0 -8px", textAlign:"right" }}>
        💡 구체적으로 쓸수록 더 의미 있어요
      </p>

      {/* 글쓰기 버튼 */}
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={() => openForm("friend")}
          className="hy-btn hy-btn-primary"
          style={{ flex:1, fontSize:13, padding:"14px" }}>
          🙌 친구 칭찬하기
        </button>
        <button onClick={() => openForm("self")}
          style={{
            flex:1, padding:"14px", borderRadius:16,
            border:"2px solid #fbbf24", background:"#fffbeb",
            color:"#92400e", fontSize:13, fontWeight:800,
            cursor:"pointer", fontFamily:"inherit",
          }}>
          🌟 오늘 내 자랑하기
        </button>
      </div>

      {/* 글쓰기 폼 */}
      {formOpen && (
        <div className="hy-card" style={{
          padding:"24px 26px",
          border:`2px solid ${formType === "friend" ? "var(--primary)" : "#fbbf24"}`,
        }}>
          <h3 style={{ fontSize:15, fontWeight:900, color:"var(--text)", margin:"0 0 18px" }}>
            {formType === "friend" ? "🙌 친구 칭찬하기" : "🌟 오늘 내 자랑하기"}
          </h3>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* 내 이름 */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:5 }}>
                내 이름 {formType === "friend" ? "(익명 가능, 선택)" : "(선택)"}
              </label>
              <select
                value={fromName}
                onChange={e => setFromName(e.target.value)}
                className="hy-input"
                style={{ cursor:"pointer" }}
              >
                <option value="">익명으로 올리기</option>
                {STUDENTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* 칭찬받을 친구 선택 — 드롭다운 */}
            {formType === "friend" && (
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:5 }}>
                  칭찬할 친구 *
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
                  <option value="">우리 반 친구를 선택해주세요 👇</option>
                  {STUDENTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {toName && (
                  <p style={{ fontSize:12, color:"var(--primary)", fontWeight:700, margin:"6px 0 0" }}>
                    ✓ {toName} 에게 칭찬을 보낼게요!
                  </p>
                )}
              </div>
            )}

            {/* 카테고리 */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:8 }}>
                {formType === "friend" ? "어떤 점을 칭찬하고 싶어요? *" : "어떤 일을 자랑하고 싶어요? *"}
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
                어떤 상황이었는지 구체적으로 써줘요 *
              </label>
              <textarea
                placeholder={formType === "friend"
                  ? "언제, 어떤 상황에서, 어떤 행동이 좋았는지 구체적으로 써줘요 🙂\n예) 3월 11일 조회시간에 내가 준비물을 못 챙겼는데 아무 말 없이 자기 것을 나눠줬다. 항상 배려가 몸에 배어 있는 것 같아서 닮고 싶다."
                  : "언제, 무엇을, 어떻게 했는지 구체적으로 써줘요 💪\n예) 오늘 1인1역할 청소 당번이었는데 수업이 끝나고 가장 먼저 빗자루를 들고 구석구석 청소했다. 선생님이 안 봐도 늘 같은 자세로 임하는 내 모습이 뿌듯했다."}
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
          { key:"friend", label:"🙌 친구 칭찬" },
          { key:"self",   label:"🌟 내 자랑" },
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
            아직 글이 없어요.<br/>첫 번째로 칭찬을 남겨봐요!
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
                      {post.type === "friend" ? "🙌 친구 칭찬" : "🌟 내 자랑"}
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
