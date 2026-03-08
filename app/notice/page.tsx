"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type Notice = {
  id: string;
  created_at: string;
  title: string;
  content: string;
  is_pinned: boolean;
  image_url: string | null;
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff/60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff/3600)}시간 전`;
  const d = new Date(iso);
  return `${d.getMonth()+1}월 ${d.getDate()}일`;
}

export default function NoticePage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [fTitle,   setFTitle]   = useState("");
  const [fContent, setFContent] = useState("");
  const [fPinned,  setFPinned]  = useState(false);
  const [fImage,   setFImage]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [adminPw,  setAdminPw]  = useState("");
  const [isAdmin,  setIsAdmin]  = useState(false);

  async function load() {
    const { data } = await supabase
      .from("notices")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    setNotices((data as Notice[]) ?? []);
  }

  useEffect(() => { load(); }, []);

  async function submit() {
    if (!fTitle.trim() || !fContent.trim()) { alert("제목과 내용을 입력하세요"); return; }
    setLoading(true);
    const { error } = await supabase.from("notices").insert({
      title: fTitle.trim(),
      content: fContent.trim(),
      is_pinned: fPinned,
      image_url: fImage.trim() || null,
    });
    setLoading(false);
    if (error) { alert(error.message); return; }
    setFTitle(""); setFContent(""); setFPinned(false); setFImage("");
    setFormOpen(false);
    await load();
  }

  async function togglePin(id: string, current: boolean) {
    await supabase.from("notices").update({ is_pinned: !current }).eq("id", id);
    await load();
  }

  async function deleteNotice(id: string) {
    if (!confirm("삭제할까요?")) return;
    await supabase.from("notices").delete().eq("id", id);
    await load();
  }

  const pinned  = notices.filter(n => n.is_pinned);
  const regular = notices.filter(n => !n.is_pinned);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* 헤더 */}
      <div className="hy-hero">
        <div style={{ position:"relative" }}>
          <p style={{ color:"rgba(255,255,255,0.8)", fontSize:13, fontWeight:600, margin:"0 0 6px" }}>
            우리반 소식
          </p>
          <h1 style={{ color:"#fff", fontSize:"clamp(22px,4vw,32px)", fontWeight:900, margin:0, letterSpacing:"-0.5px" }}>
            📢 공지사항
          </h1>
        </div>
      </div>

      {/* 관리자 + 글쓰기 */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {!isAdmin ? (
            <>
              <input
                type="password" placeholder="관리자 비밀번호"
                value={adminPw} onChange={e => setAdminPw(e.target.value)}
                className="hy-input" style={{ maxWidth:180 }}
                onKeyDown={e => e.key === "Enter" && setIsAdmin(adminPw === "hyfl2025")}
              />
              <button onClick={() => setIsAdmin(adminPw === "hyfl2025")}
                className="hy-btn" style={{ fontSize:13, padding:"8px 16px" }}>
                확인
              </button>
            </>
          ) : (
            <span style={{ fontSize:13, color:"var(--primary)", fontWeight:700 }}>
              ✅ 관리자 모드
            </span>
          )}
        </div>
        <button onClick={() => setFormOpen(o => !o)}
          className="hy-btn hy-btn-primary"
          style={{ fontSize:13, padding:"8px 18px" }}>
          {formOpen ? "닫기" : "✏️ 공지 작성"}
        </button>
      </div>

      {/* 공지 작성 폼 */}
      {formOpen && (
        <div className="hy-card" style={{ padding:"22px 24px" }}>
          <h3 style={{ fontSize:15, fontWeight:800, color:"var(--text)", margin:"0 0 16px" }}>
            공지 작성하기
          </h3>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <input placeholder="제목 *" value={fTitle} onChange={e => setFTitle(e.target.value)}
              className="hy-input" />
            <textarea
              placeholder="내용을 입력하세요. 카톡 내용 그대로 붙여넣어도 돼요 🙂"
              value={fContent} onChange={e => setFContent(e.target.value)}
              className="hy-input" style={{ minHeight:140, resize:"vertical" }}
            />
            <input placeholder="이미지 URL (선택)"
              value={fImage} onChange={e => setFImage(e.target.value)}
              className="hy-input" />
            <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, color:"var(--text-muted)", fontWeight:600 }}>
              <input type="checkbox" checked={fPinned} onChange={e => setFPinned(e.target.checked)} />
              📌 상단 고정
            </label>
            <button onClick={submit} disabled={loading}
              className="hy-btn hy-btn-primary" style={{ fontSize:13, alignSelf:"flex-start" }}>
              {loading ? "등록 중..." : "공지 올리기"}
            </button>
          </div>
        </div>
      )}

      {/* 고정 공지 */}
      {pinned.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <p className="hy-section-label" style={{ marginBottom:4 }}>📌 고정 공지</p>
          {pinned.map(n => (
            <NoticeCard key={n.id} notice={n}
              expanded={expandedId === n.id}
              onToggle={() => setExpandedId(expandedId === n.id ? null : n.id)}
              isAdmin={isAdmin}
              onPin={() => togglePin(n.id, n.is_pinned)}
              onDelete={() => deleteNotice(n.id)}
              pinned
            />
          ))}
        </div>
      )}

      {/* 일반 공지 */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {pinned.length > 0 && <p className="hy-section-label" style={{ marginBottom:4 }}>전체 공지</p>}
        {regular.length === 0 && pinned.length === 0 ? (
          <div className="hy-card" style={{ padding:"40px", textAlign:"center" }}>
            <p style={{ fontSize:15, color:"var(--text-subtle)", fontWeight:600 }}>
              아직 공지가 없어요 🌱
            </p>
          </div>
        ) : regular.map(n => (
          <NoticeCard key={n.id} notice={n}
            expanded={expandedId === n.id}
            onToggle={() => setExpandedId(expandedId === n.id ? null : n.id)}
            isAdmin={isAdmin}
            onPin={() => togglePin(n.id, n.is_pinned)}
            onDelete={() => deleteNotice(n.id)}
            pinned={false}
          />
        ))}
      </div>

    </div>
  );
}

function NoticeCard({ notice, expanded, onToggle, isAdmin, onPin, onDelete, pinned }: {
  notice: Notice;
  expanded: boolean;
  onToggle: () => void;
  isAdmin: boolean;
  onPin: () => void;
  onDelete: () => void;
  pinned: boolean;
}) {
  function timeAgo(iso: string) {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return "방금 전";
    if (diff < 3600) return `${Math.floor(diff/60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff/3600)}시간 전`;
    const d = new Date(iso);
    return `${d.getMonth()+1}월 ${d.getDate()}일`;
  }

  return (
    <div className="hy-card" style={{
      padding:"18px 22px",
      borderLeft: pinned ? "4px solid var(--primary)" : "4px solid transparent",
      background: pinned ? "var(--primary-light)" : "#fff",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
        <div style={{ flex:1, cursor:"pointer" }} onClick={onToggle}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
            {pinned && (
              <span style={{ fontSize:11, fontWeight:800, color:"var(--primary)", background:"var(--primary-light)", padding:"2px 8px", borderRadius:999 }}>
                📌 고정
              </span>
            )}
            <span style={{ fontWeight:800, fontSize:15, color:"var(--text)" }}>{notice.title}</span>
          </div>
          <span style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:500 }}>
            {timeAgo(notice.created_at)}
          </span>
        </div>
        {isAdmin && (
          <div style={{ display:"flex", gap:6, flexShrink:0 }}>
            <button onClick={onPin}
              style={{ fontSize:11, padding:"4px 10px", borderRadius:999, border:"1.5px solid var(--border)", background:"#fff", cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>
              {pinned ? "고정 해제" : "📌 고정"}
            </button>
            <button onClick={onDelete}
              style={{ fontSize:11, padding:"4px 10px", borderRadius:999, border:"1.5px solid #fecaca", background:"#fff5f5", color:"#ef4444", cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>
              삭제
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div style={{ marginTop:14, paddingTop:14, borderTop:"1.5px solid var(--border)" }}>
          <p style={{ fontSize:14, color:"var(--text)", lineHeight:1.8, margin:0, whiteSpace:"pre-wrap" }}>
            {notice.content}
          </p>
          {notice.image_url && (
            <img src={notice.image_url} alt="공지 이미지"
              style={{ marginTop:14, width:"100%", maxWidth:480, borderRadius:12 }} />
          )}
        </div>
      )}
    </div>
  );
}
