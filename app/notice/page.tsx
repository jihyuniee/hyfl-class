"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type Notice = {
  id: string;
  created_at: string;
  title: string;
  content: string;
  is_pinned: boolean;
  image_urls: string[];
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
  const [notices,    setNotices]    = useState<Notice[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formOpen,   setFormOpen]   = useState(false);
  const [fTitle,     setFTitle]     = useState("");
  const [fPinned,    setFPinned]    = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [adminPw,    setAdminPw]    = useState("");
  const [isAdmin,    setIsAdmin]    = useState(false);
  const editorRef    = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRange   = useRef<Range | null>(null);

  async function load() {
    const { data } = await supabase
      .from("notices")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    setNotices((data as Notice[]) ?? []);
  }

  useEffect(() => { load(); }, []);

  async function uploadImage(file: File): Promise<string | null> {
    const ext = file.type.split("/")[1] || "png";
    const fileName = `notice_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error } = await supabase.storage
      .from("uploads")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });
    if (error) { alert("이미지 업로드 실패: " + error.message); return null; }
    return supabase.storage.from("uploads").getPublicUrl(data.path).data.publicUrl;
  }

  function insertImageAtCursor(url: string) {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();

    const sel = window.getSelection();
    let range: Range;

    if (savedRange.current) {
      range = savedRange.current;
    } else if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
      range = sel.getRangeAt(0);
    } else {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }

    range.deleteContents();

    // 이미지 앞 줄바꿈
    range.insertNode(document.createElement("br"));
    // 이미지
    const img = document.createElement("img");
    img.src = url;
    img.style.cssText = "max-width:100%;border-radius:10px;margin:6px 0;display:block;cursor:default;";
    range.insertNode(img);
    // 이미지 뒤 줄바꿈 + 빈 텍스트
    const br = document.createElement("br");
    range.insertNode(br);
    const textNode = document.createTextNode("\u200B");
    range.insertNode(textNode);

    // 커서를 이미지 뒤로
    const newRange = document.createRange();
    newRange.setStartAfter(textNode);
    newRange.collapse(true);
    if (sel) { sel.removeAllRanges(); sel.addRange(newRange); }
    savedRange.current = null;
  }

  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(i => i.type.startsWith("image/"));
    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;
      setUploading(true);
      const url = await uploadImage(file);
      setUploading(false);
      if (url) insertImageAtCursor(url);
    }
    // 텍스트 붙여넣기는 plain text로만 (서식 제거)
    else {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
    }
  }, []);

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setUploading(true);
    for (const file of files) {
      const url = await uploadImage(file);
      if (url) insertImageAtCursor(url);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit() {
    if (!fTitle.trim()) { alert("제목을 입력하세요"); return; }
    const editor = editorRef.current;
    if (!editor || !editor.innerHTML.trim() || editor.innerHTML === "<br>") {
      alert("내용을 입력하세요"); return;
    }

    // 이미지 URL 목록 수집
    const imgs = Array.from(editor.querySelectorAll("img")).map(img => img.src);

    // HTML 저장 (줄바꿈 보존)
    const html = editor.innerHTML;

    setLoading(true);
    const { error } = await supabase.from("notices").insert({
      title: fTitle.trim(),
      content: html,
      is_pinned: fPinned,
      image_urls: imgs,
    });
    setLoading(false);
    if (error) { alert(error.message); return; }

    setFTitle(""); setFPinned(false);
    if (editorRef.current) editorRef.current.innerHTML = "";
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

      <style>{`
        .notice-editor { min-height:200px; padding:14px 16px; border:1.5px solid var(--border); border-radius:0 0 14px 14px; font-size:14px; line-height:1.9; color:var(--text); outline:none; background:#fff; font-family:'Noto Sans KR',sans-serif; word-break:break-word; }
        .notice-editor:empty:before { content:"내용을 입력하세요.\\A이미지는 📷 버튼 또는 Ctrl+V(PC) 로 원하는 위치에 삽입할 수 있어요."; white-space:pre; color:#c4b5d4; pointer-events:none; }
        .notice-editor img { max-width:100%; border-radius:10px; margin:6px 0; display:block; }
        .notice-content { font-size:14px; line-height:1.9; color:var(--text); word-break:break-word; }
        .notice-content img { max-width:100%; border-radius:12px; margin:10px 0; display:block; }
      `}</style>

      {/* 헤더 */}
      <div className="hy-hero">
        <p style={{ color:"rgba(255,255,255,0.8)", fontSize:13, fontWeight:600, margin:"0 0 6px" }}>우리반 소식</p>
        <h1 style={{ color:"#fff", fontSize:"clamp(22px,4vw,32px)", fontWeight:900, margin:0, letterSpacing:"-0.5px" }}>
          📢 공지사항
        </h1>
      </div>

      {/* 관리자 + 글쓰기 */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {!isAdmin ? (
            <>
              <input type="password" placeholder="관리자 비밀번호"
                value={adminPw} onChange={e => setAdminPw(e.target.value)}
                className="hy-input" style={{ maxWidth:180 }}
                onKeyDown={e => e.key==="Enter" && setIsAdmin(adminPw==="hyfl2025")}/>
              <button onClick={() => setIsAdmin(adminPw==="hyfl2025")} className="hy-btn" style={{ fontSize:13 }}>확인</button>
            </>
          ) : (
            <span style={{ fontSize:13, color:"var(--primary)", fontWeight:700 }}>✅ 관리자 모드</span>
          )}
        </div>
        <button onClick={() => setFormOpen(o => !o)} className="hy-btn hy-btn-primary" style={{ fontSize:13 }}>
          {formOpen ? "닫기" : "✏️ 공지 작성"}
        </button>
      </div>

      {/* 공지 작성 폼 */}
      {formOpen && (
        <div className="hy-card" style={{ padding:"22px 24px" }}>
          <h3 style={{ fontSize:15, fontWeight:800, color:"var(--text)", margin:"0 0 14px" }}>공지 작성하기</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <input placeholder="제목 *" value={fTitle} onChange={e => setFTitle(e.target.value)} className="hy-input"/>

            {/* 툴바 */}
            <div style={{ display:"flex", gap:8, alignItems:"center", padding:"8px 14px", background:"#f9fafb", border:"1.5px solid var(--border)", borderBottom:"none", borderRadius:"14px 14px 0 0" }}>
              <button
                onMouseDown={saveSelection}
                onClick={() => fileInputRef.current?.click()}
                style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:999, border:"1.5px solid var(--border)", background:"#fff", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit", color:"var(--text-muted)" }}>
                📷 사진 삽입
              </button>
              {uploading && <span style={{ fontSize:12, color:"var(--primary)", fontWeight:700 }}>⏳ 업로드 중...</span>}
              <span style={{ fontSize:11, color:"var(--text-subtle)", marginLeft:"auto" }}>PC: Ctrl+V · 아이폰: 📷 버튼</span>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display:"none" }}/>

            {/* 에디터 */}
            <div
              ref={editorRef}
              contentEditable
              onPaste={handlePaste}
              className="notice-editor"
              suppressContentEditableWarning
            />

            <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, color:"var(--text-muted)", fontWeight:600 }}>
              <input type="checkbox" checked={fPinned} onChange={e => setFPinned(e.target.checked)}/>
              📌 상단 고정
            </label>
            <button onClick={submit} disabled={loading || uploading} className="hy-btn hy-btn-primary" style={{ fontSize:13, alignSelf:"flex-start" }}>
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
              expanded={expandedId===n.id}
              onToggle={() => setExpandedId(expandedId===n.id ? null : n.id)}
              isAdmin={isAdmin}
              onPin={() => togglePin(n.id, n.is_pinned)}
              onDelete={() => deleteNotice(n.id)}
              pinned/>
          ))}
        </div>
      )}

      {/* 일반 공지 */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {pinned.length > 0 && <p className="hy-section-label" style={{ marginBottom:4 }}>전체 공지</p>}
        {regular.length===0 && pinned.length===0 ? (
          <div className="hy-card" style={{ padding:"40px", textAlign:"center" }}>
            <p style={{ fontSize:15, color:"var(--text-subtle)", fontWeight:600 }}>아직 공지가 없어요 🌱</p>
          </div>
        ) : regular.map(n => (
          <NoticeCard key={n.id} notice={n}
            expanded={expandedId===n.id}
            onToggle={() => setExpandedId(expandedId===n.id ? null : n.id)}
            isAdmin={isAdmin}
            onPin={() => togglePin(n.id, n.is_pinned)}
            onDelete={() => deleteNotice(n.id)}
            pinned={false}/>
        ))}
      </div>
    </div>
  );
}

function NoticeCard({ notice, expanded, onToggle, isAdmin, onPin, onDelete, pinned }: {
  notice: Notice; expanded: boolean; onToggle: () => void;
  isAdmin: boolean; onPin: () => void; onDelete: () => void; pinned: boolean;
}) {
  // 기존 공지(plain text)는 줄바꿈 처리, 새 공지(HTML)는 그대로 렌더링
  const isHtml = notice.content.includes("<") && notice.content.includes(">");

  return (
    <div className="hy-card" style={{
      padding:"18px 22px",
      borderLeft: pinned ? "4px solid var(--primary)" : "4px solid transparent",
      background: pinned ? "var(--primary-light)" : "#fff",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
        <div style={{ flex:1, cursor:"pointer" }} onClick={onToggle}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
            {pinned && <span style={{ fontSize:11, fontWeight:800, color:"var(--primary)", background:"var(--primary-light)", padding:"2px 8px", borderRadius:999 }}>📌 고정</span>}
            <span style={{ fontWeight:800, fontSize:15, color:"var(--text)" }}>{notice.title}</span>
            {notice.image_urls?.length > 0 && <span style={{ fontSize:11, color:"var(--text-subtle)", fontWeight:600 }}>🖼️ {notice.image_urls.length}장</span>}
          </div>
          <span style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:500 }}>{timeAgo(notice.created_at)}</span>
        </div>
        {isAdmin && (
          <div style={{ display:"flex", gap:6, flexShrink:0 }}>
            <button onClick={onPin} style={{ fontSize:11, padding:"4px 10px", borderRadius:999, border:"1.5px solid var(--border)", background:"#fff", cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>
              {pinned ? "고정 해제" : "📌 고정"}
            </button>
            <button onClick={onDelete} style={{ fontSize:11, padding:"4px 10px", borderRadius:999, border:"1.5px solid #fecaca", background:"#fff5f5", color:"#ef4444", cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>
              삭제
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div style={{ marginTop:14, paddingTop:14, borderTop:"1.5px solid var(--border)" }}>
          {isHtml ? (
            // 새 방식: HTML 그대로 (이미지 위치 보존)
            <div className="notice-content" dangerouslySetInnerHTML={{ __html: notice.content }}/>
          ) : (
            // 기존 공지: 줄바꿈 보존
            <p style={{ fontSize:14, color:"var(--text)", lineHeight:1.9, margin:0, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
              {notice.content}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
