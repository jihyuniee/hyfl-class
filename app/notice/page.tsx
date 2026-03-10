"use client";

import { useEffect, useState, useRef } from "react";
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
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const { data } = await supabase
      .from("notices")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    setNotices((data as Notice[]) ?? []);
  }

  useEffect(() => { load(); }, []);

  async function uploadAndInsertImage(file: File) {
    setUploading(true);
    const ext = file.type.split("/")[1] || "png";
    const fileName = `notice_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { data: storageData, error } = await supabase.storage
      .from("uploads")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });
    setUploading(false);
    if (error) { alert("이미지 업로드 실패: " + error.message); return; }
    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(storageData.path);
    const url = urlData.publicUrl;

    // 커서 위치에 이미지 삽입
    const img = document.createElement("img");
    img.src = url;
    img.style.cssText = "max-width:100%;border-radius:10px;margin:8px 0;display:block;";
    img.contentEditable = "false";

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      // 이미지 앞뒤에 줄바꿈
      const br1 = document.createElement("br");
      const br2 = document.createElement("br");
      range.insertNode(br2);
      range.insertNode(img);
      range.insertNode(br1);
      range.setStartAfter(br2);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      editorRef.current?.appendChild(img);
    }
  }

  async function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) await uploadAndInsertImage(file);
        return;
      }
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      await uploadAndInsertImage(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // editor HTML에서 텍스트와 이미지 URL 추출
  function parseEditor(): { content: string; image_urls: string[] } {
    const el = editorRef.current;
    if (!el) return { content: "", image_urls: [] };
    const image_urls: string[] = [];
    // 이미지를 [이미지N] 플레이스홀더로 대체해서 텍스트 추출
    const clone = el.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("img").forEach((img, idx) => {
      image_urls.push(img.src);
      img.replaceWith(`[이미지${idx+1}]`);
    });
    const content = clone.innerText.trim();
    return { content, image_urls };
  }

  async function submit() {
    if (!fTitle.trim()) { alert("제목을 입력하세요"); return; }
    const { content, image_urls } = parseEditor();
    if (!content && image_urls.length === 0) { alert("내용을 입력하세요"); return; }
    setLoading(true);
    const { error } = await supabase.from("notices").insert({
      title: fTitle.trim(),
      content: editorRef.current?.innerHTML ?? "",  // HTML 그대로 저장
      is_pinned: fPinned,
      image_urls,
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

      {/* 헤더 */}
      <div className="hy-hero">
        <div style={{ position:"relative" }}>
          <p style={{ color:"rgba(255,255,255,0.8)", fontSize:13, fontWeight:600, margin:"0 0 6px" }}>우리반 소식</p>
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
              <input type="password" placeholder="관리자 비밀번호"
                value={adminPw} onChange={e => setAdminPw(e.target.value)}
                className="hy-input" style={{ maxWidth:180 }}
                onKeyDown={e => e.key === "Enter" && setIsAdmin(adminPw === "hyfl2025")}/>
              <button onClick={() => setIsAdmin(adminPw === "hyfl2025")}
                className="hy-btn" style={{ fontSize:13 }}>확인</button>
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
          <h3 style={{ fontSize:15, fontWeight:800, color:"var(--text)", margin:"0 0 16px" }}>공지 작성하기</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <input placeholder="제목 *" value={fTitle} onChange={e => setFTitle(e.target.value)} className="hy-input"/>

            {/* 툴바 */}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", padding:"8px 12px", background:"#f9fafb", borderRadius:"12px 12px 0 0", border:"1.5px solid var(--border)", borderBottom:"none" }}>
              <button onClick={() => fileInputRef.current?.click()}
                style={{ padding:"5px 12px", borderRadius:999, border:"1.5px solid var(--border)", background:"#fff", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit", color:"var(--text-muted)" }}>
                📷 사진 삽입
              </button>
              {uploading && <span style={{ fontSize:12, color:"var(--primary)", fontWeight:700, alignSelf:"center" }}>⏳ 업로드 중...</span>}
              <span style={{ fontSize:11, color:"var(--text-subtle)", alignSelf:"center", marginLeft:"auto" }}>
                Ctrl+V 로도 이미지 붙여넣기 가능
              </span>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display:"none" }}/>

            {/* 에디터 */}
            <div
              ref={editorRef}
              contentEditable
              onPaste={handlePaste}
              data-placeholder="내용을 입력하세요. 사진을 원하는 위치에 Ctrl+V로 바로 붙여넣을 수 있어요 📷"
              suppressContentEditableWarning
              style={{
                minHeight:180, padding:"14px 16px",
                border:"1.5px solid var(--border)", borderRadius:"0 0 12px 12px",
                fontSize:14, lineHeight:1.8, color:"var(--text)",
                outline:"none", background:"#fff",
                fontFamily:"'Noto Sans KR', sans-serif",
              }}
            />

            <style>{`
              [contenteditable]:empty:before {
                content: attr(data-placeholder);
                color: #b8a8c8;
                pointer-events: none;
              }
            `}</style>

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
              expanded={expandedId === n.id}
              onToggle={() => setExpandedId(expandedId === n.id ? null : n.id)}
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
        {regular.length === 0 && pinned.length === 0 ? (
          <div className="hy-card" style={{ padding:"40px", textAlign:"center" }}>
            <p style={{ fontSize:15, color:"var(--text-subtle)", fontWeight:600 }}>아직 공지가 없어요 🌱</p>
          </div>
        ) : regular.map(n => (
          <NoticeCard key={n.id} notice={n}
            expanded={expandedId === n.id}
            onToggle={() => setExpandedId(expandedId === n.id ? null : n.id)}
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
  notice: Notice;
  expanded: boolean;
  onToggle: () => void;
  isAdmin: boolean;
  onPin: () => void;
  onDelete: () => void;
  pinned: boolean;
}) {
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
            {notice.image_urls?.length > 0 && (
              <span style={{ fontSize:11, color:"var(--text-subtle)", fontWeight:600 }}>🖼️ {notice.image_urls.length}장</span>
            )}
          </div>
          <span style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:500 }}>{timeAgo(notice.created_at)}</span>
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
          {/* HTML 그대로 렌더링 (이미지 위치 보존) */}
          <div
            style={{ fontSize:14, color:"var(--text)", lineHeight:1.8 }}
            dangerouslySetInnerHTML={{ __html: notice.content }}
          />
        </div>
      )}
    </div>
  );
}
