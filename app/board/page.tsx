"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type Post = {
  id: string;
  created_at: string;
  category: "건의사항" | "선생님께" | "페이지 의견";
  content: string;
  author: string | null;
  is_anonymous: boolean;
  comment_count?: number;
};

type Comment = {
  id: string;
  post_id: string;
  created_at: string;
  content: string;
  author: string | null;
  is_anonymous: boolean;
};

const CAT_STYLE: Record<string, { bg: string; color: string; emoji: string }> = {
  "건의사항":   { bg: "#fff7ed", color: "#f97316", emoji: "📣" },
  "선생님께":   { bg: "#f0fdf4", color: "#22c55e", emoji: "💌" },
  "페이지 의견": { bg: "#eff6ff", color: "#3b82f6", emoji: "💡" },
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff/60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff/3600)}시간 전`;
  return `${Math.floor(diff/86400)}일 전`;
}

export default function BoardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [filter, setFilter] = useState("전체");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 관리자
  const [pw, setPw]           = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [pwOpen, setPwOpen]   = useState(false);

  // 글 작성 폼
  const [formOpen, setFormOpen] = useState(false);
  const [fCat,     setFCat]     = useState<Post["category"]>("건의사항");
  const [fContent, setFContent] = useState("");
  const [fAuthor,  setFAuthor]  = useState("");
  const [fAnon,    setFAnon]    = useState(false);
  const [loading,  setLoading]  = useState(false);

  // 댓글 작성
  const [cContent, setCContent] = useState<Record<string, string>>({});
  const [cAuthor,  setCAuthor]  = useState<Record<string, string>>({});
  const [cAnon,    setCAnon]    = useState<Record<string, boolean>>({});

  async function load() {
    const { data: pData } = await supabase
      .from("board_posts")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: cData } = await supabase
      .from("board_comments")
      .select("*")
      .order("created_at");
    setPosts((pData as Post[]) ?? []);
    setComments((cData as Comment[]) ?? []);
  }

  useEffect(() => { load(); }, []);

  const filtered = posts.filter(p => {
    if (p.category === "선생님께" && !isAdmin) return false;
    return filter === "전체" || p.category === filter;
  });

  function commentsOf(postId: string) {
    return comments.filter(c => c.post_id === postId);
  }

  async function submitPost() {
    if (!fContent.trim()) { alert("내용을 입력하세요"); return; }
    setLoading(true);
    const { error } = await supabase.from("board_posts").insert({
      category: fCat,
      content: fContent.trim(),
      author: fAnon ? null : (fAuthor.trim() || "익명"),
      is_anonymous: fAnon,
    });
    setLoading(false);
    if (error) { alert(error.message); return; }
    setFContent(""); setFAuthor(""); setFAnon(false); setFormOpen(false);
    await load();
  }

  async function submitComment(postId: string) {
    const content = cContent[postId]?.trim();
    if (!content) { alert("댓글 내용을 입력하세요"); return; }
    const anon = cAnon[postId] ?? false;
    const { error } = await supabase.from("board_comments").insert({
      post_id: postId,
      content,
      author: anon ? null : (cAuthor[postId]?.trim() || "익명"),
      is_anonymous: anon,
    });
    if (error) { alert(error.message); return; }
    setCContent(p => ({ ...p, [postId]: "" }));
    await load();
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* 헤더 */}
      <div className="hy-hero">
        <div style={{ position:"relative" }}>
          <p style={{ color:"rgba(255,255,255,0.8)", fontSize:13, fontWeight:600, margin:"0 0 6px" }}>
            자유롭게 의견을 남겨요
          </p>
          <h1 style={{ color:"#fff", fontSize:"clamp(22px,4vw,32px)", fontWeight:900, margin:0, letterSpacing:"-0.5px" }}>
            🪗 우리반 신문고
          </h1>
        </div>
      </div>

      {/* 필터 + 글쓰기 */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["전체", "건의사항", "선생님께", "페이지 의견"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding:"6px 14px", borderRadius:999, border:"1.5px solid",
                borderColor: filter===f ? "var(--primary)" : "var(--border)",
                background: filter===f ? "var(--primary-light)" : "#fff",
                color: filter===f ? "var(--primary)" : "var(--text-muted)",
                fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit",
                transition:"all 0.15s",
              }}>
              {CAT_STYLE[f]?.emoji} {f}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {!isAdmin ? (
            <button onClick={() => setPwOpen(o => !o)} className="hy-btn" style={{ fontSize:12 }}>
              🔒 선생님 로그인
            </button>
          ) : (
            <button onClick={() => setIsAdmin(false)} className="hy-btn" style={{ fontSize:12, color:"var(--primary)", borderColor:"var(--primary)" }}>
              ✅ 선생님 모드
            </button>
          )}
          <button onClick={() => setFormOpen(o => !o)}
            className="hy-btn hy-btn-primary"
            style={{ fontSize:13, padding:"8px 18px" }}>
            {formOpen ? "닫기" : "✏️ 글쓰기"}
          </button>
        </div>
      </div>

      {/* 선생님 로그인 */}
      {pwOpen && !isAdmin && (
        <div className="hy-card" style={{ padding:"16px 20px" }}>
          <p style={{ fontSize:13, fontWeight:700, color:"var(--text-muted)", margin:"0 0 10px" }}>
            🔒 선생님께 보내는 글은 선생님만 볼 수 있어요.
          </p>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <input type="password" placeholder="비밀번호 입력"
              value={pw} onChange={e => setPw(e.target.value)}
              onKeyDown={e => { if(e.key==="Enter") { setIsAdmin(pw==="hyfl2025"); if(pw==="hyfl2025") setPwOpen(false); }}}
              className="hy-input" style={{ maxWidth:180 }}/>
            <button onClick={() => { setIsAdmin(pw==="hyfl2025"); if(pw==="hyfl2025") setPwOpen(false); else alert("비밀번호가 틀렸어요"); }}
              className="hy-btn" style={{ fontSize:13 }}>확인</button>
          </div>
        </div>
      )}

      {/* 글쓰기 폼 */}
      {formOpen && (
        <div className="hy-card" style={{ padding:"22px 24px" }}>
          <h3 style={{ fontSize:15, fontWeight:800, color:"var(--text)", margin:"0 0 16px" }}>글 작성하기</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <select value={fCat} onChange={e => setFCat(e.target.value as Post["category"])}
              className="hy-input" style={{ cursor:"pointer" }}>
              <option value="건의사항">📣 건의사항</option>
              <option value="선생님께">💌 선생님께</option>
              <option value="페이지 의견">💡 페이지 의견</option>
            </select>
            <textarea
              placeholder="자유롭게 의견을 남겨줘요 🙂"
              value={fContent} onChange={e => setFContent(e.target.value)}
              className="hy-input"
              style={{ minHeight:100, resize:"vertical" }}
            />
            <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
              {!fAnon && (
                <input placeholder="이름 (선택, 비워두면 익명)"
                  value={fAuthor} onChange={e => setFAuthor(e.target.value)}
                  className="hy-input" style={{ maxWidth:220 }} />
              )}
              <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:13, color:"var(--text-muted)", fontWeight:600 }}>
                <input type="checkbox" checked={fAnon} onChange={e => setFAnon(e.target.checked)} />
                익명으로 작성
              </label>
            </div>
            <button onClick={submitPost} disabled={loading}
              className="hy-btn hy-btn-primary" style={{ fontSize:13, alignSelf:"flex-start" }}>
              {loading ? "등록 중..." : "등록하기"}
            </button>
          </div>
        </div>
      )}

      {/* 선생님께 잠금 안내 */}
      {(filter === "선생님께" || filter === "전체") && !isAdmin && (
        <div style={{ padding:"14px 18px", borderRadius:14, background:"#f0fdf4", border:"1.5px solid #86efac", display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:20 }}>🔒</span>
          <p style={{ fontSize:13, color:"#16a34a", fontWeight:700, margin:0 }}>
            선생님께 보내는 글은 선생님만 볼 수 있어요. 선생님 로그인 후 확인 가능해요.
          </p>
        </div>
      )}

      {/* 글 목록 */}
      {filtered.length === 0 ? (
        <div className="hy-card" style={{ padding:"40px", textAlign:"center" }}>
          <p style={{ fontSize:15, color:"var(--text-subtle)", fontWeight:600 }}>
            아직 글이 없어요. 첫 번째로 의견을 남겨봐요! 🌱
          </p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {filtered.map(post => {
            const cs = CAT_STYLE[post.category];
            const postComments = commentsOf(post.id);
            const isExpanded = expandedId === post.id;
            return (
              <div key={post.id} className="hy-card" style={{ padding:"20px 22px" }}>
                {/* 글 헤더 */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                    <span style={{
                      padding:"3px 10px", borderRadius:999, fontSize:12, fontWeight:700,
                      background: cs.bg, color: cs.color,
                    }}>
                      {cs.emoji} {post.category}
                    </span>
                    <span style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:500 }}>
                      {post.is_anonymous ? "익명" : post.author ?? "익명"} · {timeAgo(post.created_at)}
                    </span>
                  </div>
                </div>

                {/* 내용 */}
                <p style={{ fontSize:14, color:"var(--text)", lineHeight:1.7, margin:"0 0 12px", whiteSpace:"pre-wrap" }}>
                  {post.content}
                </p>

                {/* 댓글 토글 */}
                <button onClick={() => setExpandedId(isExpanded ? null : post.id)}
                  style={{
                    background:"none", border:"none", cursor:"pointer",
                    fontSize:13, color:"var(--text-muted)", fontWeight:700,
                    display:"flex", alignItems:"center", gap:4, padding:0, fontFamily:"inherit",
                  }}>
                  💬 댓글 {postComments.length}개 {isExpanded ? "▴" : "▾"}
                </button>

                {/* 댓글 영역 */}
                {isExpanded && (
                  <div style={{ marginTop:14, borderTop:"1.5px solid var(--border)", paddingTop:14 }}>
                    {/* 댓글 목록 */}
                    {postComments.length > 0 && (
                      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                        {postComments.map(c => (
                          <div key={c.id} style={{
                            padding:"10px 14px", borderRadius:12,
                            background:"#fafafa", border:"1.5px solid var(--border)",
                          }}>
                            <div style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:600, marginBottom:4 }}>
                              {c.is_anonymous ? "익명" : c.author ?? "익명"} · {timeAgo(c.created_at)}
                            </div>
                            <p style={{ fontSize:13, color:"var(--text)", margin:0, whiteSpace:"pre-wrap" }}>{c.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 댓글 작성 */}
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      <textarea
                        placeholder="댓글을 입력하세요"
                        value={cContent[post.id] ?? ""}
                        onChange={e => setCContent(p => ({ ...p, [post.id]: e.target.value }))}
                        className="hy-input"
                        style={{ minHeight:70, resize:"vertical" }}
                      />
                      <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                        {!(cAnon[post.id]) && (
                          <input placeholder="이름 (선택)"
                            value={cAuthor[post.id] ?? ""}
                            onChange={e => setCAuthor(p => ({ ...p, [post.id]: e.target.value }))}
                            className="hy-input" style={{ maxWidth:160 }} />
                        )}
                        <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:13, color:"var(--text-muted)", fontWeight:600 }}>
                          <input type="checkbox"
                            checked={cAnon[post.id] ?? false}
                            onChange={e => setCAnon(p => ({ ...p, [post.id]: e.target.checked }))} />
                          익명
                        </label>
                        <button onClick={() => submitComment(post.id)}
                          className="hy-btn hy-btn-primary"
                          style={{ fontSize:12, padding:"7px 16px" }}>
                          댓글 등록
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
