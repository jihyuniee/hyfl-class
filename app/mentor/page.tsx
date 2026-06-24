"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/components/lib/supabaseClient";

const MENTORS = [
  { subject: "국어",  emoji: "📝", mentors: ["박민석", "성연준"],  color: "linear-gradient(135deg,#f472b6,#fb923c)" },
  { subject: "수학",  emoji: "🧮", mentors: ["박우진", "손정연"],  color: "linear-gradient(135deg,#3b82f6,#6366f1)" },
  { subject: "영어",  emoji: "📖", mentors: ["유다현", "이시원"],  color: "linear-gradient(135deg,#34d399,#0ea5e9)" },
  { subject: "중국어",emoji: "🀄", mentors: ["강지우", "송민주"],  color: "linear-gradient(135deg,#f97316,#ef4444)" },
  { subject: "사문",  emoji: "🏛️", mentors: ["최안아", "현서정"],  color: "linear-gradient(135deg,#a855f7,#6366f1)" },
  { subject: "국제",  emoji: "🌏", mentors: ["윤혜림", "장지현"],  color: "linear-gradient(135deg,#06b6d4,#3b82f6)" },
];

type MentorLog = {
  id: string;
  created_at: string;
  subject: string;
  mentor_name: string;
  date: string;
  activity: string;
  content: string;
  resource_link: string | null;
};

type Resource = {
  id: string;
  created_at: string;
  subject: string;
  title: string;
  description: string | null;
  link: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: "예상문제" | "학습자료" | "쪽지시험";
  uploader_name: string | null;
  delete_code: string | null;
};

type Comment = {
  id: string;
  resource_id: string;
  author_name: string;
  content: string;
  created_at: string;
};

const ADMIN_PW = "hyfl2025";

function toISODateKST() {
  const k = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${k.getFullYear()}-${String(k.getMonth()+1).padStart(2,"0")}-${String(k.getDate()).padStart(2,"0")}`;
}

function formatDate(dateStr: string) {
  const d = new Date(new Date(dateStr).toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;
}

function formatDateTime(dateStr: string) {
  const d = new Date(new Date(dateStr).toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

function getFileIcon(fileName: string | null) {
  if (!fileName) return "📎";
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "📄";
  if (ext === "hwp" || ext === "hwpx") return "📝";
  if (["jpg","jpeg","png","gif","webp"].includes(ext ?? "")) return "🖼️";
  if (["ppt","pptx"].includes(ext ?? "")) return "📊";
  if (["doc","docx"].includes(ext ?? "")) return "📃";
  return "📎";
}

function isImageFile(fileName: string | null) {
  if (!fileName) return false;
  const ext = fileName.split(".").pop()?.toLowerCase();
  return ["jpg","jpeg","png","gif","webp"].includes(ext ?? "");
}

const FTYPE_STYLE: Record<string, { bg: string; color: string }> = {
  "예상문제": { bg:"#fff7ed", color:"#f97316" },
  "학습자료": { bg:"#eff6ff", color:"#3b82f6" },
  "쪽지시험": { bg:"#fdf4ff", color:"#a855f7" },
};

export default function MentorPage() {
  const [logs, setLogs]           = useState<MentorLog[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [comments, setComments]   = useState<Comment[]>([]);
  const [tab, setTab]             = useState<"mentors"|"logs"|"resources">("mentors");
  const [filterSubject, setFilterSubject] = useState("전체");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // 활동 일지 작성
  const [lSubject,  setLSubject]  = useState(MENTORS[0].subject);
  const [lMentor,   setLMentor]   = useState("");
  const [lDate,     setLDate]     = useState(toISODateKST());
  const [lActivity, setLActivity] = useState("");
  const [lContent,  setLContent]  = useState("");
  const [lLink,     setLLink]     = useState("");
  const [lOpen,     setLOpen]     = useState(false);
  const [saving,    setSaving]    = useState(false);

  // 자료 공유
  const [rSubject,      setRSubject]      = useState(MENTORS[0].subject);
  const [rTitle,        setRTitle]        = useState("");
  const [rDesc,         setRDesc]         = useState("");
  const [rType,         setRType]         = useState<Resource["file_type"]>("학습자료");
  const [rUploaderName, setRUploaderName] = useState("");
  const [rDeleteCode,   setRDeleteCode]   = useState("");
  const [rFile,         setRFile]         = useState<File | null>(null);
  const [rOpen,         setROpen]         = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // 관리자
  const [pw, setPw]           = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // 댓글
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, { author: string; content: string }>>({});
  const [savingComment, setSavingComment] = useState<string | null>(null);

  // 삭제 코드 입력
  const [deletingResource, setDeletingResource] = useState<string | null>(null);
  const [deleteCodeInput,  setDeleteCodeInput]  = useState("");

  // 새글 추적 (localStorage 기반)
  const [lastVisit] = useState<Date | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("mentor_last_visit");
    localStorage.setItem("mentor_last_visit", new Date().toISOString());
    return stored ? new Date(stored) : null;
  });

  const subjectSectionRef = useRef<HTMLDivElement>(null);

  async function load() {
    const [{ data: ld }, { data: rd }, { data: cd }] = await Promise.all([
      supabase.from("mentor_logs").select("*").order("date", { ascending: false }),
      supabase.from("mentor_resources").select("*").order("created_at", { ascending: false }),
      supabase.from("resource_comments").select("*").order("created_at", { ascending: true }),
    ]);
    setLogs((ld as MentorLog[]) ?? []);
    setResources((rd as Resource[]) ?? []);
    setComments((cd as Comment[]) ?? []);
  }

  useEffect(() => { load(); }, []);

  function handleMentorCardClick(subject: string) {
    setSelectedSubject(prev => prev === subject ? null : subject);
    setTimeout(() => {
      subjectSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  // 새글 여부 판별
  function isNew(dateStr: string) {
    if (!lastVisit) return false;
    return new Date(dateStr) > lastVisit;
  }

  async function addLog() {
    if (!lMentor.trim() || !lContent.trim() || !lActivity.trim()) {
      alert("이름, 활동유형, 내용을 입력하세요");
      return;
    }
    setSaving(true);
    await supabase.from("mentor_logs").insert({
      subject: lSubject, mentor_name: lMentor.trim(), date: lDate,
      activity: lActivity.trim(), content: lContent.trim(), resource_link: lLink.trim() || null,
    });
    setSaving(false);
    setLContent(""); setLActivity(""); setLLink(""); setLMentor(""); setLOpen(false);
    await load();
  }

  async function addResource(subjectOverride?: string) {
    if (!rTitle.trim()) { alert("자료 제목을 입력하세요"); return; }
    if (!rUploaderName.trim()) { alert("올리는 사람 이름을 입력하세요"); return; }
    if (!rFile) { alert("파일을 선택해주세요"); return; }
    setUploading(true);

    try {
      const ext = rFile.name.split(".").pop() ?? "bin";
      const safeName = `mentor-files/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("uploads")
        .upload(safeName, rFile, { cacheControl: "3600", upsert: false });

      if (upErr) { alert("파일 업로드 실패: " + upErr.message); setUploading(false); return; }

      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(safeName);

      const { error: insertErr } = await supabase.from("mentor_resources").insert({
        subject: subjectOverride ?? rSubject,
        title: rTitle.trim(),
        description: rDesc.trim() || null,
        link: null,
        file_url: urlData.publicUrl,
        file_name: rFile.name,
        file_type: rType,
        uploader_name: rUploaderName.trim(),
        delete_code: rDeleteCode.trim() || null,
      });

      if (insertErr) {
        console.error("mentor_resources insert error:", insertErr);
        alert("데이터베이스 저장 실패: " + insertErr.message);
        setUploading(false);
        return;
      }

      setRTitle(""); setRDesc(""); setRFile(null); setRUploaderName(""); setRDeleteCode("");
      if (fileRef.current) fileRef.current.value = "";
      setROpen(false);
      await load();
    } catch (err) {
      console.error("addResource error:", err);
      alert("오류가 발생했습니다: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
    }
  }

  async function deleteResource(id: string, fileUrl: string | null) {
    if (!confirm("자료를 삭제할까요?")) return;
    const res = await fetch("/api/mentor-resources/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, adminPw: pw }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "알 수 없는 오류" }));
      alert("삭제에 실패했습니다: " + error);
      return;
    }
    await load();
  }

  // 삭제 코드 검증 후 삭제
  async function handleCodeDelete(r: Resource) {
    if (!deleteCodeInput.trim()) { alert("삭제 코드를 입력하세요"); return; }
    const code = deleteCodeInput.trim();
    setDeletingResource(null);
    setDeleteCodeInput("");
    const res = await fetch("/api/mentor-resources/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, code }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "알 수 없는 오류" }));
      alert(res.status === 403 ? "삭제 코드가 맞지 않아요 🔒" : "삭제에 실패했습니다: " + error);
      return;
    }
    await load();
  }

  async function addComment(resourceId: string) {
    const input = commentInputs[resourceId];
    if (!input?.author?.trim() || !input?.content?.trim()) {
      alert("이름과 댓글 내용을 입력하세요");
      return;
    }
    setSavingComment(resourceId);
    await supabase.from("resource_comments").insert({
      resource_id: resourceId,
      author_name: input.author.trim(),
      content: input.content.trim(),
    });
    setCommentInputs(prev => ({
      ...prev,
      [resourceId]: { author: prev[resourceId]?.author ?? "", content: "" },
    }));
    setSavingComment(null);
    await load();
  }

  async function deleteComment(id: string) {
    if (!confirm("댓글을 삭제할까요?")) return;
    await supabase.from("resource_comments").delete().eq("id", id);
    await load();
  }

  function toggleComments(id: string) {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filteredLogs = logs.filter(l => filterSubject === "전체" || l.subject === filterSubject);
  const filteredRes  = resources.filter(r => filterSubject === "전체" || r.subject === filterSubject);

  const selectedSubjectResources = selectedSubject
    ? resources.filter(r => r.subject === selectedSubject).sort((a, b) => b.created_at.localeCompare(a.created_at))
    : [];
  const selectedMentor = MENTORS.find(m => m.subject === selectedSubject);

  // 새글 카운트 (탭 뱃지용)
  const newResCount = resources.filter(r => isNew(r.created_at)).length;
  const newLogCount = logs.filter(l => isNew(l.created_at)).length;

  // ─── 자료 카드 렌더 ───
  const renderResourceCard = (r: Resource, showSubject = false) => {
    const m = MENTORS.find(x => x.subject === r.subject);
    const ts = FTYPE_STYLE[r.file_type];
    const openUrl = r.file_url || r.link || null;
    const isImg = isImageFile(r.file_name);
    const resComments = comments.filter(c => c.resource_id === r.id);
    const isExpanded = expandedComments.has(r.id);
    const cInput = commentInputs[r.id] ?? { author: "", content: "" };
    const newItem = isNew(r.created_at);
    const isBeingDeleted = deletingResource === r.id;

    return (
      <div key={r.id} style={{ borderRadius:16, overflow:"hidden", border: newItem ? "2px solid #6366f1" : "1.5px solid var(--border)", background:"#fff", boxShadow: newItem ? "0 2px 16px rgba(99,102,241,0.15)" : "0 2px 10px rgba(0,0,0,0.06)" }}>
        {/* 헤더 */}
        <div style={{ padding:"14px 18px", display:"flex", alignItems:"flex-start", gap:12, background: newItem ? "#f5f3ff" : "#fafafa", borderBottom:"1px solid var(--border)" }}>
          <div style={{ width:44, height:44, borderRadius:12, background:ts.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
            {getFileIcon(r.file_name)}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5, flexWrap:"wrap" }}>
              {newItem && (
                <span style={{ fontSize:10, fontWeight:800, padding:"2px 7px", borderRadius:999, background:"#6366f1", color:"#fff", letterSpacing:"0.5px" }}>NEW</span>
              )}
              <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:999, background:ts.bg, color:ts.color }}>{r.file_type}</span>
              {showSubject && m && (
                <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:999, background:"#f3f4f6", color:"var(--text-muted)" }}>{m.emoji} {r.subject}</span>
              )}
              <span style={{ fontSize:11, color:"var(--text-subtle)" }}>{formatDateTime(r.created_at)}</span>
            </div>
            <h4 style={{ fontSize:15, fontWeight:800, color:"var(--text)", margin:"0 0 5px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.title}</h4>
            {/* 올린 사람 */}
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:999, padding:"2px 10px" }}>
                <span style={{ fontSize:11 }}>👤</span>
                <span style={{ fontSize:12, fontWeight:700, color:"#16a34a" }}>{r.uploader_name ?? "익명"}</span>
              </div>
              {r.delete_code && (
                <span style={{ fontSize:10, color:"var(--text-subtle)", fontWeight:600 }}>🔒 삭제 코드 있음</span>
              )}
            </div>
          </div>

          {/* 삭제 버튼 영역 */}
          <div style={{ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
            {isAdmin ? (
              <button onClick={() => deleteResource(r.id, r.file_url)}
                style={{ fontSize:11, padding:"4px 10px", borderRadius:999, border:"1px solid #fecaca", background:"#fff5f5", color:"#ef4444", cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>
                삭제
              </button>
            ) : r.delete_code ? (
              isBeingDeleted ? (
                <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
                  <input
                    placeholder="삭제 코드 입력"
                    value={deleteCodeInput}
                    onChange={e => setDeleteCodeInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleCodeDelete(r); }}
                    className="hy-input"
                    style={{ fontSize:12, width:110, padding:"4px 10px", textAlign:"center" }}
                    autoFocus
                  />
                  <div style={{ display:"flex", gap:4 }}>
                    <button onClick={() => handleCodeDelete(r)}
                      style={{ fontSize:11, padding:"3px 8px", borderRadius:999, border:"1px solid #fecaca", background:"#fff5f5", color:"#ef4444", cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>
                      확인
                    </button>
                    <button onClick={() => { setDeletingResource(null); setDeleteCodeInput(""); }}
                      style={{ fontSize:11, padding:"3px 8px", borderRadius:999, border:"1px solid var(--border)", background:"#fff", color:"var(--text-muted)", cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setDeletingResource(r.id)}
                  style={{ fontSize:11, padding:"4px 10px", borderRadius:999, border:"1px solid #fecaca", background:"#fff5f5", color:"#ef4444", cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>
                  삭제
                </button>
              )
            ) : null}
          </div>
        </div>

        {/* 이미지 미리보기 */}
        {isImg && openUrl && (
          <div style={{ padding:"12px 18px 0", background:"#fff" }}>
            <a href={openUrl} target="_blank" rel="noopener noreferrer">
              <img src={openUrl} alt={r.title}
                style={{ width:"100%", maxHeight:300, objectFit:"contain", borderRadius:12, border:"1px solid var(--border)", background:"#f8f9fa", display:"block", cursor:"zoom-in" }}/>
            </a>
          </div>
        )}

        {/* 설명 + 파일 열기 */}
        <div style={{ padding:"14px 18px", background:"#fff" }}>
          {r.description && (
            <p style={{ fontSize:13, color:"var(--text)", lineHeight:1.7, margin:"0 0 12px", whiteSpace:"pre-wrap" }}>{r.description}</p>
          )}
          {openUrl && !isImg && (
            <a href={openUrl} target="_blank" rel="noopener noreferrer"
              style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:13, fontWeight:700, color:"#6366f1", textDecoration:"none", padding:"8px 18px", borderRadius:999, background:"#eff6ff", border:"1.5px solid #c7d2fe" }}>
              {getFileIcon(r.file_name)} {r.file_name ?? "파일 열기"} 보기 →
            </a>
          )}
          {openUrl && isImg && (
            <a href={openUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize:12, fontWeight:600, color:"#6366f1", textDecoration:"none" }}>
              🔍 원본 크기로 보기 →
            </a>
          )}
        </div>

        {/* 댓글 섹션 */}
        <div style={{ borderTop:"1px solid var(--border)" }}>
          <button onClick={() => toggleComments(r.id)}
            style={{ width:"100%", padding:"10px 18px", background:"#f9fafb", border:"none", borderBottom: isExpanded ? "1px solid var(--border)" : "none", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:6, fontSize:12, fontWeight:700, color:"var(--text-muted)" }}>
            💬 댓글 {resComments.length}개 {isExpanded ? "▲" : "▼"}
          </button>
          {isExpanded && (
            <div style={{ padding:"14px 18px", background:"#f9fafb", display:"flex", flexDirection:"column", gap:10 }}>
              {resComments.length === 0 ? (
                <p style={{ fontSize:12, color:"var(--text-subtle)", margin:0, textAlign:"center", fontWeight:600 }}>첫 번째 댓글을 남겨봐요!</p>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {resComments.map(c => (
                    <div key={c.id} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                      <div style={{ width:30, height:30, borderRadius:999, background:"var(--primary-light)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"var(--primary)", flexShrink:0 }}>
                        {c.author_name.charAt(0)}
                      </div>
                      <div style={{ flex:1, background:"#fff", borderRadius:12, padding:"8px 12px", border:"1px solid var(--border)" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                          <span style={{ fontSize:12, fontWeight:800, color:"var(--text)" }}>{c.author_name}</span>
                          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                            <span style={{ fontSize:10, color:"var(--text-subtle)" }}>{formatDateTime(c.created_at)}</span>
                            {isAdmin && (
                              <button onClick={() => deleteComment(c.id)}
                                style={{ fontSize:10, color:"#ef4444", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:700, padding:0 }}>삭제</button>
                            )}
                          </div>
                        </div>
                        <p style={{ fontSize:13, color:"var(--text)", margin:0, lineHeight:1.6, whiteSpace:"pre-wrap" }}>{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display:"flex", gap:8 }}>
                <input placeholder="이름" value={cInput.author}
                  onChange={e => setCommentInputs(prev => ({ ...prev, [r.id]: { ...prev[r.id] ?? { content:"" }, author: e.target.value } }))}
                  className="hy-input" style={{ maxWidth:100, fontSize:12 }}/>
                <input placeholder="댓글 입력 (Enter로 등록)"
                  value={cInput.content}
                  onChange={e => setCommentInputs(prev => ({ ...prev, [r.id]: { ...prev[r.id] ?? { author:"" }, content: e.target.value } }))}
                  onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); addComment(r.id); } }}
                  className="hy-input" style={{ flex:1, fontSize:12 }}/>
                <button onClick={() => addComment(r.id)} disabled={savingComment === r.id}
                  className="hy-btn hy-btn-primary" style={{ fontSize:12, padding:"8px 14px", flexShrink:0, minWidth:52 }}>
                  {savingComment === r.id ? "..." : "등록"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── 업로드 폼 렌더 ───
  const renderUploadForm = (subjectFixed?: string) => (
    <div style={{ padding:"18px 20px", background:"#f8faff", borderRadius:16, border:"1.5px solid #e0e7ff" }}>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:10 }}>
          {!subjectFixed && (
            <select value={rSubject} onChange={e => setRSubject(e.target.value)} className="hy-input" style={{ cursor:"pointer" }}>
              {MENTORS.map(m => <option key={m.subject} value={m.subject}>{m.subject}</option>)}
            </select>
          )}
          <select value={rType} onChange={e => setRType(e.target.value as Resource["file_type"])} className="hy-input" style={{ cursor:"pointer" }}>
            <option value="학습자료">학습자료</option>
            <option value="예상문제">예상문제</option>
            <option value="쪽지시험">쪽지시험</option>
          </select>
          <input placeholder="올리는 사람 이름 *" value={rUploaderName} onChange={e => setRUploaderName(e.target.value)} className="hy-input"/>
        </div>
        <input placeholder="자료 제목 *" value={rTitle} onChange={e => setRTitle(e.target.value)} className="hy-input"/>
        <input placeholder="설명 (선택)" value={rDesc} onChange={e => setRDesc(e.target.value)} className="hy-input"/>

        {/* 삭제 코드 */}
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"#fffbeb", borderRadius:10, border:"1px solid #fde68a" }}>
          <span style={{ fontSize:14 }}>🔑</span>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:11, color:"#92400e", fontWeight:700, margin:"0 0 4px" }}>삭제 코드 (선택)</p>
            <input
              placeholder="나중에 삭제할 때 필요한 코드 (예: 1234)"
              value={rDeleteCode}
              onChange={e => setRDeleteCode(e.target.value)}
              className="hy-input"
              style={{ fontSize:12 }}
            />
            <p style={{ fontSize:10, color:"#92400e", margin:"4px 0 0", fontWeight:600 }}>코드 없이 올리면 관리자만 삭제할 수 있어요</p>
          </div>
        </div>

        <div style={{ border:"2px dashed #c7d2fe", borderRadius:12, padding:"16px", background:"#fff", textAlign:"center", cursor:"pointer" }}
          onClick={() => fileRef.current?.click()}>
          {rFile ? (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              <span style={{ fontSize:20 }}>{getFileIcon(rFile.name)}</span>
              <span style={{ fontSize:13, fontWeight:700, color:"var(--primary)" }}>{rFile.name}</span>
              <button onClick={e => { e.stopPropagation(); setRFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                style={{ fontSize:11, color:"#ef4444", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>✕</button>
            </div>
          ) : (
            <>
              <p style={{ fontSize:13, color:"var(--text-subtle)", margin:"0 0 4px", fontWeight:600 }}>📁 파일을 클릭해서 선택하세요</p>
              <p style={{ fontSize:11, color:"var(--text-subtle)", margin:0 }}>PDF · HWP · JPG · PNG · PPT · DOC 등 (최대 50MB)</p>
            </>
          )}
        </div>
        <input ref={fileRef} type="file"
          accept=".pdf,.hwp,.hwpx,.jpg,.jpeg,.png,.gif,.webp,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.zip"
          style={{ display:"none" }}
          onChange={e => setRFile(e.target.files?.[0] ?? null)}/>

        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button onClick={() => addResource(subjectFixed)} disabled={uploading}
            className="hy-btn hy-btn-primary" style={{ fontSize:13 }}>
            {uploading ? "업로드 중..." : "공유하기"}
          </button>
          {uploading && <span style={{ fontSize:12, color:"var(--text-subtle)" }}>업로드 중입니다...</span>}
        </div>
      </div>
    </div>
  );

  // ─── 탭 뱃지 컴포넌트 ───
  const TabBadge = ({ count }: { count: number }) => count === 0 ? null : (
    <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", minWidth:16, height:16, borderRadius:999, background:"#ef4444", color:"#fff", fontSize:9, fontWeight:800, padding:"0 4px", marginLeft:4 }}>
      {count > 9 ? "9+" : count}
    </span>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* 헤더 */}
      <div style={{ background:"linear-gradient(135deg,#f59e0b 0%,#ef4444 50%,#ec4899 100%)", borderRadius:28, padding:"32px 28px", position:"relative", overflow:"hidden", boxShadow:"0 12px 40px rgba(245,158,11,0.3)" }}>
        {[{w:140,h:140,top:-40,right:-20,op:0.08},{w:70,h:70,bottom:-10,left:60,op:0.07}].map((b,i)=>(
          <div key={i} style={{ position:"absolute",width:b.w,height:b.h,top:(b as {top?:number}).top,right:(b as {right?:number}).right,bottom:(b as {bottom?:number}).bottom,left:(b as {left?:number}).left,borderRadius:"50%",background:"#fff",opacity:b.op }}/>
        ))}
        <div style={{ position:"relative" }}>
          <div style={{ display:"inline-flex",alignItems:"center",background:"rgba(255,255,255,0.2)",backdropFilter:"blur(8px)",borderRadius:999,padding:"4px 14px",marginBottom:12,border:"1px solid rgba(255,255,255,0.3)" }}>
            <span style={{ fontSize:12,color:"#fff",fontWeight:700 }}>🤝 학급자율활동</span>
          </div>
          <h1 style={{ color:"#fff",fontSize:"clamp(20px,4vw,30px)",fontWeight:900,margin:"0 0 8px",letterSpacing:"-0.5px" }}>교과 멘토·멘티 협력학습</h1>
          <p style={{ color:"rgba(255,255,255,0.85)",fontSize:13,margin:0,lineHeight:1.7,fontWeight:500 }}>
            멘토가 질문에 답변하고 예상 문제와 자료를 공유해요.<br/>시험 기간 전 적극적으로 활용해봐요!
          </p>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {([
          ["mentors", "멘토 명단 👥", 0],
          ["logs",    "활동 일지 📋", newLogCount],
          ["resources","자료 공유 📂", newResCount],
        ] as const).map(([t, label, count]) => (
          <button key={t} onClick={() => { setTab(t); setSelectedSubject(null); }}
            className={t===tab ? "hy-btn hy-btn-primary" : "hy-btn"}
            style={{ fontSize:13, padding:"8px 18px", display:"flex", alignItems:"center" }}>
            {label}
            <TabBadge count={count}/>
          </button>
        ))}
      </div>

      {/* 관리자 */}
      <div className="hy-card" style={{ padding:"12px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          {!isAdmin ? (
            <>
              <input type="password" placeholder="관리자 비밀번호" value={pw} onChange={e=>setPw(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&setIsAdmin(pw===ADMIN_PW)} className="hy-input" style={{ maxWidth:180 }}/>
              <button onClick={()=>setIsAdmin(pw===ADMIN_PW)} className="hy-btn" style={{ fontSize:13 }}>확인</button>
            </>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:13,color:"var(--primary)",fontWeight:800 }}>✅ 관리자 모드 — 자료·댓글 삭제 가능</span>
              <button onClick={()=>{ setIsAdmin(false); setPw(""); }} className="hy-btn" style={{ fontSize:11, padding:"4px 10px" }}>해제</button>
            </div>
          )}
        </div>
      </div>

      {/* ───────── 멘토 명단 탭 ───────── */}
      {tab==="mentors" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
            {MENTORS.map(m=>{
              const isSelected = selectedSubject === m.subject;
              const resCount = resources.filter(r=>r.subject===m.subject).length;
              const logCount = logs.filter(l=>l.subject===m.subject).length;
              const recentRes = resources.filter(r=>r.subject===m.subject).slice(0,2);
              const hasNew = resources.some(r=>r.subject===m.subject && isNew(r.created_at));
              return (
                <div key={m.subject}
                  onClick={()=>handleMentorCardClick(m.subject)}
                  style={{ borderRadius:20, overflow:"hidden", cursor:"pointer",
                    boxShadow: isSelected ? "0 8px 30px rgba(99,102,241,0.3)" : "0 4px 16px rgba(0,0,0,0.08)",
                    border: isSelected ? "2.5px solid #6366f1" : hasNew ? "2.5px solid #f59e0b" : "2.5px solid transparent",
                    transition:"all 0.15s",
                  }}>
                  <div style={{ background:m.color, padding:"16px 20px", display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:24 }}>{m.emoji}</span>
                    <div style={{ flex:1 }}>
                      <h3 style={{ color:"#fff", fontSize:17, fontWeight:900, margin:0 }}>
                        {m.subject}
                        {hasNew && <span style={{ marginLeft:6, fontSize:10, fontWeight:800, background:"#ef4444", color:"#fff", padding:"1px 6px", borderRadius:999, verticalAlign:"middle" }}>NEW</span>}
                      </h3>
                      <p style={{ color:"rgba(255,255,255,0.8)", fontSize:12, margin:0, fontWeight:600 }}>멘토 {m.mentors.length}명</p>
                    </div>
                    <span style={{ fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.9)",background:"rgba(255,255,255,0.2)",padding:"3px 10px",borderRadius:999 }}>
                      {isSelected ? "선택됨 ✓" : "자료 보기 →"}
                    </span>
                  </div>
                  <div style={{ background:"#fff", padding:"14px 18px" }}>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
                      {m.mentors.map(name=>(
                        <span key={name} style={{ padding:"6px 14px", borderRadius:999, background:"#fdf2f8", color:"var(--primary)", fontWeight:800, fontSize:13, border:"1.5px solid #f9d0ea" }}>
                          {name}
                        </span>
                      ))}
                    </div>
                    <div style={{ padding:"8px 12px", borderRadius:10, background:"#fafafa", border:"1px solid var(--border)", marginBottom: recentRes.length > 0 ? 10 : 0 }}>
                      <p style={{ fontSize:11, color:"var(--text-subtle)", margin:0, fontWeight:600 }}>
                        활동 일지: {logCount}건 · 공유 자료: {resCount}개
                      </p>
                    </div>
                    {recentRes.map(r => {
                      const ts = FTYPE_STYLE[r.file_type];
                      const openUrl = r.file_url || r.link || null;
                      return (
                        <div key={r.id}
                          style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 0", borderTop:"1px solid var(--border)" }}
                          onClick={e => e.stopPropagation()}>
                          {isNew(r.created_at) && <span style={{ fontSize:9, fontWeight:800, padding:"1px 5px", borderRadius:999, background:"#6366f1", color:"#fff", flexShrink:0 }}>N</span>}
                          <span style={{ fontSize:14, flexShrink:0 }}>{getFileIcon(r.file_name)}</span>
                          <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:999, background:ts.bg, color:ts.color, flexShrink:0 }}>{r.file_type}</span>
                          {openUrl ? (
                            <a href={openUrl} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize:12, color:"var(--text)", fontWeight:600, flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", textDecoration:"none" }}>
                              {r.title}
                            </a>
                          ) : (
                            <span style={{ fontSize:12, color:"var(--text)", fontWeight:600, flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {r.title}
                            </span>
                          )}
                          <span style={{ fontSize:10, color:"#16a34a", flexShrink:0, whiteSpace:"nowrap", fontWeight:700 }}>
                            {r.uploader_name ?? "익명"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 선택된 과목 자료 */}
          {selectedSubject && (
            <div ref={subjectSectionRef} className="hy-card" style={{ padding:"24px 26px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:40,height:40,borderRadius:12,background:selectedMentor?.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>
                    {selectedMentor?.emoji}
                  </div>
                  <div>
                    <h3 style={{ fontSize:17,fontWeight:900,color:"var(--text)",margin:0 }}>{selectedSubject} 공유 자료</h3>
                    <p style={{ fontSize:12,color:"var(--text-subtle)",margin:0 }}>멘토: {selectedMentor?.mentors.join(", ")}</p>
                  </div>
                </div>
                <button onClick={()=>setROpen(o=>!o)} className="hy-btn hy-btn-primary" style={{ fontSize:13 }}>
                  {rOpen ? "닫기" : "📤 자료 올리기"}
                </button>
              </div>

              {rOpen && <div style={{ marginBottom:20 }}>{renderUploadForm(selectedSubject)}</div>}

              {selectedSubjectResources.length === 0 ? (
                <div style={{ textAlign:"center",padding:"32px 0" }}>
                  <p style={{ fontSize:14,color:"var(--text-subtle)",fontWeight:600 }}>아직 공유된 자료가 없어요. 첫 자료를 올려봐요! 📂</p>
                </div>
              ) : (
                <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                  {selectedSubjectResources.map(r => renderResourceCard(r))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ───────── 활동 일지 탭 ───────── */}
      {tab==="logs" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {["전체", ...MENTORS.map(m=>m.subject)].map(s=>(
                <button key={s} onClick={()=>setFilterSubject(s)}
                  style={{ padding:"6px 14px", borderRadius:999, border:"1.5px solid", fontFamily:"inherit", cursor:"pointer",
                    borderColor: filterSubject===s ? "var(--primary)" : "var(--border)",
                    background: filterSubject===s ? "var(--primary-light)" : "#fff",
                    color: filterSubject===s ? "var(--primary)" : "var(--text-muted)",
                    fontWeight:700, fontSize:12,
                  }}>{s}</button>
              ))}
            </div>
            <button onClick={()=>setLOpen(o=>!o)} className="hy-btn hy-btn-primary" style={{ fontSize:13 }}>
              {lOpen ? "닫기" : "✏️ 일지 쓰기"}
            </button>
          </div>

          {lOpen && (
            <div className="hy-card" style={{ padding:"20px 22px" }}>
              <h3 style={{ fontSize:15,fontWeight:800,color:"var(--text)",margin:"0 0 14px" }}>활동 일지 작성</h3>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10 }}>
                  <select value={lSubject} onChange={e=>setLSubject(e.target.value)} className="hy-input" style={{ cursor:"pointer" }}>
                    {MENTORS.map(m=><option key={m.subject} value={m.subject}>{m.subject}</option>)}
                  </select>
                  <input placeholder="이름 *" value={lMentor} onChange={e=>setLMentor(e.target.value)} className="hy-input"/>
                  <input type="date" value={lDate} onChange={e=>setLDate(e.target.value)} className="hy-input"/>
                  <input placeholder="활동 유형 (예: 질문 답변)" value={lActivity} onChange={e=>setLActivity(e.target.value)} className="hy-input"/>
                </div>
                <textarea placeholder="활동 내용을 자유롭게 써봐요 *" value={lContent} onChange={e=>setLContent(e.target.value)}
                  className="hy-input" style={{ minHeight:120,resize:"vertical" }}/>
                <input placeholder="관련 자료 링크 (선택)" value={lLink} onChange={e=>setLLink(e.target.value)} className="hy-input"/>
                <button onClick={addLog} disabled={saving} className="hy-btn hy-btn-primary" style={{ fontSize:13,alignSelf:"flex-start" }}>
                  {saving ? "저장 중..." : "일지 올리기"}
                </button>
              </div>
            </div>
          )}

          {filteredLogs.length === 0 ? (
            <div className="hy-card" style={{ padding:"40px",textAlign:"center" }}>
              <p style={{ fontSize:14,color:"var(--text-subtle)",fontWeight:600 }}>아직 활동 일지가 없어요 📋</p>
            </div>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              {filteredLogs.map(l=>{
                const m = MENTORS.find(x=>x.subject===l.subject);
                const newLog = isNew(l.created_at);
                return (
                  <div key={l.id} className="hy-card" style={{ padding:"18px 22px", border: newLog ? "2px solid #6366f1" : undefined, background: newLog ? "#fdfcff" : undefined }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                      <div style={{ width:38, height:38, borderRadius:999, background:"var(--primary-light)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:900, color:"var(--primary)", flexShrink:0 }}>
                        {l.mentor_name.charAt(0)}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                          {newLog && <span style={{ fontSize:10, fontWeight:800, padding:"2px 7px", borderRadius:999, background:"#6366f1", color:"#fff" }}>NEW</span>}
                          <span style={{ fontSize:14, fontWeight:800, color:"var(--text)" }}>{l.mentor_name}</span>
                          <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:999, background:"var(--primary-light)", color:"var(--primary)" }}>{m?.emoji} {l.subject}</span>
                          <span style={{ fontSize:11, padding:"2px 8px", borderRadius:999, background:"#f3f4f6", color:"var(--text-muted)", fontWeight:600 }}>{l.activity}</span>
                        </div>
                        <span style={{ fontSize:11, color:"var(--text-subtle)", fontWeight:500 }}>{l.date} · {formatDateTime(l.created_at)} 작성</span>
                      </div>
                    </div>
                    <p style={{ fontSize:14, color:"var(--text)", lineHeight:1.8, margin:0, whiteSpace:"pre-wrap", paddingLeft:12, borderLeft:"3px solid var(--primary-light)" }}>
                      {l.content}
                    </p>
                    {l.resource_link && (
                      <a href={l.resource_link} target="_blank" rel="noopener noreferrer"
                        style={{ display:"inline-flex",alignItems:"center",gap:4,marginTop:12,fontSize:12,fontWeight:700,color:"#6366f1",textDecoration:"none",padding:"5px 12px",borderRadius:999,background:"#eff6ff",border:"1px solid #c7d2fe" }}>
                        📎 자료 보기 →
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ───────── 자료 공유 탭 ───────── */}
      {tab==="resources" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {["전체", ...MENTORS.map(m=>m.subject)].map(s=>(
                <button key={s} onClick={()=>setFilterSubject(s)}
                  style={{ padding:"6px 14px",borderRadius:999,border:"1.5px solid",fontFamily:"inherit",cursor:"pointer",
                    borderColor: filterSubject===s ? "var(--primary)" : "var(--border)",
                    background: filterSubject===s ? "var(--primary-light)" : "#fff",
                    color: filterSubject===s ? "var(--primary)" : "var(--text-muted)",
                    fontWeight:700,fontSize:12,
                  }}>{s}</button>
              ))}
            </div>
            <button onClick={()=>setROpen(o=>!o)} className="hy-btn hy-btn-primary" style={{ fontSize:13 }}>
              {rOpen ? "닫기" : "📤 자료 공유"}
            </button>
          </div>

          {rOpen && (
            <div className="hy-card" style={{ padding:"20px 22px" }}>
              <h3 style={{ fontSize:15,fontWeight:800,color:"var(--text)",margin:"0 0 14px" }}>자료 공유하기</h3>
              {renderUploadForm()}
            </div>
          )}

          {filteredRes.length === 0 ? (
            <div className="hy-card" style={{ padding:"40px",textAlign:"center" }}>
              <p style={{ fontSize:14,color:"var(--text-subtle)",fontWeight:600 }}>공유된 자료가 없어요 📂</p>
            </div>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              {filteredRes.map(r => renderResourceCard(r, true))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
