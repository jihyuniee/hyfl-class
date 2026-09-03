"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";
import SemesterTabs from "@/components/SemesterTabs";
import { CURRENT_SEMESTER, LEGACY_SEMESTER, type SemesterId } from "@/components/lib/semester";

// 1학기 멘토 명단 — 그대로 동결, 수정하지 않는다.
const MENTORS_1ST = [
  { subject: "국어",  emoji: "📝", mentors: ["박민석", "성연준"],  color: "linear-gradient(135deg,#f472b6,#fb923c)" },
  { subject: "수학",  emoji: "🧮", mentors: ["박우진", "손정연"],  color: "linear-gradient(135deg,#3b82f6,#6366f1)" },
  { subject: "영어",  emoji: "📖", mentors: ["유다현", "이시원"],  color: "linear-gradient(135deg,#34d399,#0ea5e9)" },
  { subject: "중국어",emoji: "🀄", mentors: ["강지우", "송민주"],  color: "linear-gradient(135deg,#f97316,#ef4444)" },
  { subject: "사문",  emoji: "🏛️", mentors: ["최인아", "현서정"],  color: "linear-gradient(135deg,#a855f7,#6366f1)" },
  { subject: "국제",  emoji: "🌏", mentors: ["윤혜림", "장지현"],  color: "linear-gradient(135deg,#06b6d4,#3b82f6)" },
];

// 2학기 멘토 명단.
const MENTORS_2ND = [
  { subject: "국어",   emoji: "📝", mentors: ["이승지", "주보민"],  color: "linear-gradient(135deg,#f472b6,#fb923c)" },
  { subject: "영어",   emoji: "📖", mentors: ["김하연", "김은솔"],  color: "linear-gradient(135deg,#34d399,#0ea5e9)" },
  { subject: "수학",   emoji: "🧮", mentors: ["심지안", "송민주"],  color: "linear-gradient(135deg,#3b82f6,#6366f1)" },
  { subject: "세지",   emoji: "🌍", mentors: ["현서정", "박우진"],  color: "linear-gradient(135deg,#14b8a6,#0ea5e9)" },
  { subject: "세미",   emoji: "🧭", mentors: ["최인아", "윤혜림"],  color: "linear-gradient(135deg,#a855f7,#ec4899)" },
  { subject: "중입",   emoji: "🀄", mentors: ["김혜민", "강지우"],  color: "linear-gradient(135deg,#f97316,#ef4444)" },
  { subject: "중독",   emoji: "📕", mentors: ["전주하", "양효승"],  color: "linear-gradient(135deg,#ef4444,#f43f5e)" },
  { subject: "홍매T",  emoji: "🌸", mentors: ["장지현", "손정연"],  color: "linear-gradient(135deg,#ec4899,#f472b6)" },
  { subject: "과학",   emoji: "🔬", mentors: ["이시원", "박우진"],  color: "linear-gradient(135deg,#10b981,#14b8a6)" },
];

type Resource = {
  id: string;
  created_at: string;
  subject: string;
  title: string;
  description: string | null;
  link: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string;
  uploader_name: string | null;
  delete_code: string | null;
  semester: string;
  upload_batch_id: string | null;
  batch_order: number | null;
};

// 업로드 폼에서 선택한(아직 등록 전인) 사진/파일 한 개
type PendingFile = {
  key: string;
  file: File;
  previewUrl: string;
};

type Comment = {
  id: string;
  resource_id: string;
  author_name: string;
  content: string;
  created_at: string;
};

const ADMIN_PW = "hyfl2025";

// 새로 올릴 때 고를 수 있는 분류. 사진/필기를 가장 앞에 두어 기본값으로 유도한다.
const UPLOAD_TYPES = ["필기노트", "요약정리", "예상문제"] as const;

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

function stripExt(fileName: string) {
  return fileName.replace(/\.[^./]+$/, "");
}

// 자료의 등록 날짜(한국 시간 기준 "YYYY-MM-DD")
function dateKeyKST(iso: string) {
  const d = new Date(new Date(iso).toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function fmtDateKR(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

// 이미 정렬된 목록을 등록 날짜 기준으로 묶는다. (같은 날 올린 자료가 흩어지지 않고 붙어 보이도록)
function groupByDate(list: Resource[]) {
  const groups: { date: string; items: Resource[] }[] = [];
  for (const r of list) {
    const key = dateKeyKST(r.created_at);
    const last = groups[groups.length - 1];
    if (last && last.date === key) last.items.push(r);
    else groups.push({ date: key, items: [r] });
  }
  return groups;
}

// 옛 자료(1학기 "학습자료"/"쪽지시험" 등)도 그대로 표시되도록 새 분류와 함께 색을 지정한다.
const FTYPE_STYLE: Record<string, { bg: string; color: string }> = {
  "필기노트": { bg:"#eff6ff", color:"#3b82f6" },
  "요약정리": { bg:"#f0fdf4", color:"#16a34a" },
  "예상문제": { bg:"#fff7ed", color:"#f97316" },
  "학습자료": { bg:"#eff6ff", color:"#3b82f6" },
  "쪽지시험": { bg:"#fdf4ff", color:"#a855f7" },
};

export default function MentorPage() {
  const [semester, setSemester] = useState<SemesterId>(CURRENT_SEMESTER);
  const MENTORS = semester === CURRENT_SEMESTER ? MENTORS_2ND : MENTORS_1ST;
  const isFrozen = semester === LEGACY_SEMESTER;

  const [resources, setResources] = useState<Resource[]>([]);
  const [comments, setComments]   = useState<Comment[]>([]);
  const [tab, setTab]             = useState<"mentors"|"resources">("mentors");
  const [filterSubject, setFilterSubject] = useState("전체");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid"|"list">("grid");

  // 자료 공유
  const [rSubject,      setRSubject]      = useState(MENTORS[0].subject);
  const [rTitle,        setRTitle]        = useState("");
  const [rDesc,         setRDesc]         = useState("");
  const [rType,         setRType]         = useState<string>(UPLOAD_TYPES[0]);
  const [rUploaderName, setRUploaderName] = useState("");
  const [rDeleteCode,   setRDeleteCode]   = useState("");
  const [rFiles,        setRFiles]        = useState<PendingFile[]>([]);
  const [rDragOver,     setRDragOver]     = useState(false);
  const [rOpen,         setROpen]         = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // 관리자
  const [pw, setPw]           = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // 댓글
  const [commentInputs, setCommentInputs] = useState<Record<string, { author: string; content: string }>>({});
  const [savingComment, setSavingComment] = useState<string | null>(null);

  // 삭제 코드 입력
  const [deletingResource, setDeletingResource] = useState<string | null>(null);
  const [deleteCodeInput,  setDeleteCodeInput]  = useState("");

  // 상세 보기(탭하면 열리는 모달) — 사진 갤러리처럼 그리드에서 눌러야 자세히 보임
  const [detailId, setDetailId] = useState<string | null>(null);

  // 새글 추적 (localStorage 기반)
  const [lastVisit] = useState<Date | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("mentor_last_visit");
    localStorage.setItem("mentor_last_visit", new Date().toISOString());
    return stored ? new Date(stored) : null;
  });

  const subjectSectionRef = useRef<HTMLDivElement>(null);

  async function load() {
    const [{ data: rd }, { data: cd }] = await Promise.all([
      supabase.from("mentor_resources").select("*")
        .order("created_at", { ascending: false })
        .order("batch_order", { ascending: true }),
      supabase.from("resource_comments").select("*").order("created_at", { ascending: true }),
    ]);
    setResources((rd as Resource[]) ?? []);
    setComments((cd as Comment[]) ?? []);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setFilterSubject("전체");
    setSelectedSubject(null);
    setRSubject(MENTORS[0].subject);
    setROpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semester]);

  // 선택한 파일들의 미리보기 URL을 세션이 끝날 때 정리한다.
  const rFilesRef = useRef<PendingFile[]>([]);
  useEffect(() => { rFilesRef.current = rFiles; }, [rFiles]);
  useEffect(() => {
    return () => { rFilesRef.current.forEach(f => URL.revokeObjectURL(f.previewUrl)); };
  }, []);

  const scopedResources = resources.filter(r => r.semester === semester);

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

  // 파일(들)을 선택 목록에 추가한다. 파일이 이미 1개 이상 있거나 한 번에 여러 개를
  // 고른 경우엔 "사진 여러 장 업로드"로 보고 이미지가 아닌 파일은 걸러낸다.
  // (파일을 하나만 고르는 기존 흐름은 문서 파일도 그대로 올릴 수 있도록 유지한다.)
  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    const willBeMulti = rFiles.length > 0 || incoming.length > 1;
    const candidates = willBeMulti ? incoming.filter(f => f.type.startsWith("image/")) : incoming;
    const nonImageCount = incoming.length - candidates.length;

    const seen = new Set(rFiles.map(sf => `${sf.file.name}|${sf.file.size}|${sf.file.lastModified}`));
    const toAdd: PendingFile[] = [];
    let dupCount = 0;
    for (const f of candidates) {
      const dedupKey = `${f.name}|${f.size}|${f.lastModified}`;
      if (seen.has(dedupKey)) { dupCount++; continue; }
      seen.add(dedupKey);
      toAdd.push({ key: `${dedupKey}-${Math.random().toString(36).slice(2)}`, file: f, previewUrl: URL.createObjectURL(f) });
    }

    if (toAdd.length > 0) setRFiles(prev => [...prev, ...toAdd]);
    if (nonImageCount > 0) alert(`사진 여러 장을 올릴 땐 이미지 파일만 가능해요. (${nonImageCount}개 파일 제외)`);
    if (dupCount > 0) alert(`이미 선택한 사진은 다시 추가되지 않아요. (${dupCount}개 제외)`);

    if (rFiles.length === 0 && toAdd.length === 1 && !rTitle.trim()) {
      setRTitle(stripExt(toAdd[0].file.name));
    }
  }

  function removeFile(key: string) {
    setRFiles(prev => {
      const target = prev.find(f => f.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter(f => f.key !== key);
    });
  }

  function clearFiles() {
    rFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
    setRFiles([]);
  }

  async function addResource(subjectOverride?: string) {
    if (!rUploaderName.trim()) { alert("올리는 사람 이름을 입력해주세요"); return; }
    if (rFiles.length === 0) { alert("사진이나 파일을 선택해주세요"); return; }
    setUploading(true);

    const total = rFiles.length;
    const batchId = total > 1 ? crypto.randomUUID() : null;
    let successCount = 0;

    try {
      for (let i = 0; i < rFiles.length; i++) {
        const { file } = rFiles[i];
        const ext = file.name.split(".").pop() ?? "bin";
        const safeName = `mentor-files/${Date.now()}_${i}_${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("uploads")
          .upload(safeName, file, { cacheControl: "3600", upsert: false });

        if (upErr) {
          console.error("mentor resource upload error:", upErr);
          if (total === 1) alert("파일 업로드 실패: " + upErr.message);
          continue;
        }

        const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(safeName);
        const title = total > 1 ? stripExt(file.name) : (rTitle.trim() || stripExt(file.name));

        const { error: insertErr } = await supabase.from("mentor_resources").insert({
          subject: subjectOverride ?? rSubject,
          title,
          description: rDesc.trim() || null,
          link: null,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_type: rType,
          uploader_name: rUploaderName.trim(),
          delete_code: rDeleteCode.trim() || null,
          semester,
          upload_batch_id: batchId,
          batch_order: i,
        });

        if (insertErr) {
          console.error("mentor_resources insert error:", insertErr);
          if (total === 1) alert("데이터베이스 저장 실패: " + insertErr.message);
          continue;
        }

        successCount++;
      }

      if (total > 1) {
        alert(`사진 ${total}장 중 ${successCount}장이 등록되었습니다.`);
      }

      if (successCount > 0) {
        setRTitle(""); setRDesc(""); setRDeleteCode(""); clearFiles();
        if (fileRef.current) fileRef.current.value = "";
        setROpen(false);
        await load();
      }
    } catch (err) {
      console.error("addResource error:", err);
      alert("오류가 발생했습니다: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
    }
  }

  async function deleteResource(id: string) {
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
    setDetailId(null);
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
    setDetailId(null);
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

  const filteredRes = scopedResources.filter(r => filterSubject === "전체" || r.subject === filterSubject);

  const selectedSubjectResources = selectedSubject
    ? scopedResources.filter(r => r.subject === selectedSubject).sort((a, b) => b.created_at.localeCompare(a.created_at))
    : [];
  const selectedMentor = MENTORS.find(m => m.subject === selectedSubject);

  // 새글 카운트 (탭 뱃지용)
  const newResCount = scopedResources.filter(r => isNew(r.created_at)).length;

  const detailResource = resources.find(r => r.id === detailId) ?? null;

  // ─── 갤러리 타일(그리드 안의 카드) ───
  const renderResourceTile = (r: Resource, showSubject = false) => {
    const m = MENTORS.find(x => x.subject === r.subject);
    const ts = FTYPE_STYLE[r.file_type] ?? { bg:"#f3f4f6", color:"var(--text-muted)" };
    const openUrl = r.file_url || r.link || null;
    const isImg = isImageFile(r.file_name);
    const newItem = isNew(r.created_at);

    return (
      <button
        key={r.id}
        onClick={() => setDetailId(r.id)}
        style={{
          position:"relative", display:"block", width:"100%", padding:0, cursor:"pointer",
          border: newItem ? "2px solid #6366f1" : "1.5px solid var(--border)",
          borderRadius:16, overflow:"hidden", background:"#fff", textAlign:"left", fontFamily:"inherit",
          boxShadow: newItem ? "0 4px 18px rgba(99,102,241,0.18)" : "0 2px 10px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ position:"relative", aspectRatio:"1 / 1", width:"100%", background:ts.bg, overflow:"hidden" }}>
          {isImg && openUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={openUrl} alt={r.title} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
          ) : (
            <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40 }}>
              {getFileIcon(r.file_name)}
            </div>
          )}
          {newItem && (
            <span style={{ position:"absolute", top:8, left:8, fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:999, background:"#6366f1", color:"#fff", letterSpacing:"0.5px" }}>NEW</span>
          )}
          <span style={{ position:"absolute", top:8, right:8, fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999, background:"rgba(255,255,255,0.92)", color:ts.color }}>
            {r.file_type}
          </span>
        </div>
        <div style={{ padding:"10px 12px" }}>
          <p style={{ fontSize:13, fontWeight:800, color:"var(--text)", margin:"0 0 4px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {r.title}
          </p>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:6 }}>
            {showSubject && m ? (
              <span style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)" }}>{m.emoji} {r.subject}</span>
            ) : (
              <span style={{ fontSize:10, fontWeight:700, color:"#16a34a" }}>👤 {r.uploader_name ?? "익명"}</span>
            )}
            <span style={{ fontSize:9, color:"var(--text-subtle)", flexShrink:0 }}>{formatDateTime(r.created_at)}</span>
          </div>
        </div>
      </button>
    );
  };

  // ─── 드라이브식 목록 줄 ───
  const renderResourceRow = (r: Resource, showSubject = false) => {
    const m = MENTORS.find(x => x.subject === r.subject);
    const ts = FTYPE_STYLE[r.file_type] ?? { bg:"#f3f4f6", color:"var(--text-muted)" };
    const openUrl = r.file_url || r.link || null;
    const isImg = isImageFile(r.file_name);
    const newItem = isNew(r.created_at);

    return (
      <div
        key={r.id}
        style={{
          display:"flex", alignItems:"center", gap:12, padding:"9px 12px", borderRadius:14,
          border: newItem ? "1.5px solid #6366f1" : "1px solid var(--border)",
          background: newItem ? "#f5f3ff" : "#fff",
        }}
      >
        <button onClick={() => setDetailId(r.id)}
          style={{ width:44, height:44, borderRadius:10, overflow:"hidden", flexShrink:0, border:"1px solid var(--border)", padding:0, cursor:"pointer", background:ts.bg }}>
          {isImg && openUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={openUrl} alt={r.title} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
          ) : (
            <span style={{ display:"flex", alignItems:"center", justifyContent:"center", width:"100%", height:"100%", fontSize:18 }}>
              {getFileIcon(r.file_name)}
            </span>
          )}
        </button>

        <button onClick={() => setDetailId(r.id)}
          style={{ flex:1, minWidth:0, textAlign:"left", background:"none", border:"none", cursor:"pointer", padding:0, fontFamily:"inherit" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            {newItem && (
              <span style={{ fontSize:9, fontWeight:800, padding:"1px 6px", borderRadius:999, background:"#6366f1", color:"#fff" }}>NEW</span>
            )}
            <span style={{ fontSize:13, fontWeight:800, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"100%" }}>
              {r.title}
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:3, flexWrap:"wrap" }}>
            <span style={{ fontSize:10, fontWeight:700, padding:"1px 7px", borderRadius:999, background:ts.bg, color:ts.color }}>{r.file_type}</span>
            {showSubject && m && (
              <span style={{ fontSize:10, color:"var(--text-muted)", fontWeight:600 }}>{m.emoji} {r.subject}</span>
            )}
            <span style={{ fontSize:10, color:"#16a34a", fontWeight:700 }}>👤 {r.uploader_name ?? "익명"}</span>
            <span style={{ fontSize:10, color:"var(--text-subtle)" }}>{formatDateTime(r.created_at)}</span>
          </div>
        </button>

        {openUrl && (
          <a href={openUrl} target="_blank" rel="noopener noreferrer"
            style={{ flexShrink:0, fontSize:11, fontWeight:700, color:"#6366f1", textDecoration:"none", padding:"6px 12px", borderRadius:999, background:"#eff6ff", border:"1px solid #c7d2fe", whiteSpace:"nowrap" }}>
            {isImg ? "보기" : "열기"} ↗
          </a>
        )}
      </div>
    );
  };

  // ─── 날짜별로 묶어서 그리드/목록으로 렌더 (같은 날 올린 자료가 이어서 보이도록) ───
  const DateGroupHeader = ({ date, count }: { date: string; count: number }) => (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
      <div style={{ padding:"4px 14px", borderRadius:999, background:"linear-gradient(135deg,var(--primary),var(--accent))", color:"#fff", fontSize:12, fontWeight:800 }}>
        {fmtDateKR(date)}
      </div>
      <div style={{ flex:1, height:1, background:"var(--border)" }}/>
      <span style={{ fontSize:11, color:"var(--text-subtle)", fontWeight:600 }}>{count}개</span>
    </div>
  );

  const renderGroupedGrid = (list: Resource[], showSubject = false) => (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {groupByDate(list).map(g => (
        <div key={g.date}>
          <DateGroupHeader date={g.date} count={g.items.length}/>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {g.items.map(r => renderResourceTile(r, showSubject))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderGroupedList = (list: Resource[], showSubject = false) => (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {groupByDate(list).map(g => (
        <div key={g.date}>
          <DateGroupHeader date={g.date} count={g.items.length}/>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {g.items.map(r => renderResourceRow(r, showSubject))}
          </div>
        </div>
      ))}
    </div>
  );

  // ─── 그리드/목록 보기 전환 버튼 ───
  const ViewToggle = () => (
    <div style={{ display:"inline-flex", borderRadius:999, border:"1.5px solid var(--border)", padding:2, gap:2, flexShrink:0 }}>
      <button onClick={() => setViewMode("grid")}
        style={{ padding:"5px 12px", borderRadius:999, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:700,
          background: viewMode==="grid" ? "var(--primary-light)" : "transparent", color: viewMode==="grid" ? "var(--primary)" : "var(--text-muted)" }}>
        🖼️ 그리드
      </button>
      <button onClick={() => setViewMode("list")}
        style={{ padding:"5px 12px", borderRadius:999, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:700,
          background: viewMode==="list" ? "var(--primary-light)" : "transparent", color: viewMode==="list" ? "var(--primary)" : "var(--text-muted)" }}>
        📋 목록
      </button>
    </div>
  );

  // ─── 상세 보기 모달 ───
  const renderDetailModal = () => {
    if (!detailResource) return null;
    const r = detailResource;
    const m = MENTORS.find(x => x.subject === r.subject);
    const ts = FTYPE_STYLE[r.file_type] ?? { bg:"#f3f4f6", color:"var(--text-muted)" };
    const openUrl = r.file_url || r.link || null;
    const isImg = isImageFile(r.file_name);
    const resComments = comments.filter(c => c.resource_id === r.id);
    const cInput = commentInputs[r.id] ?? { author: "", content: "" };
    const isBeingDeleted = deletingResource === r.id;

    return (
      <div
        onClick={() => setDetailId(null)}
        style={{ position:"fixed", inset:0, zIndex:100, background:"rgba(15,15,20,0.72)", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"24px 14px", overflowY:"auto" }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{ width:"100%", maxWidth:520, background:"#fff", borderRadius:20, overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}
        >
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderBottom:"1px solid var(--border)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:999, background:ts.bg, color:ts.color }}>{r.file_type}</span>
              {m && <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:999, background:"#f3f4f6", color:"var(--text-muted)" }}>{m.emoji} {r.subject}</span>}
            </div>
            <button onClick={() => setDetailId(null)}
              style={{ fontSize:16, background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", padding:4, lineHeight:1 }}>
              ✕
            </button>
          </div>

          {isImg && openUrl && (
            <a href={openUrl} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={openUrl} alt={r.title} style={{ width:"100%", maxHeight:420, objectFit:"contain", background:"#f8f9fa", display:"block", cursor:"zoom-in" }}/>
            </a>
          )}

          <div style={{ padding:"16px 18px" }}>
            <h4 style={{ fontSize:16, fontWeight:900, color:"var(--text)", margin:"0 0 8px" }}>{r.title}</h4>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:999, padding:"2px 10px" }}>
                <span style={{ fontSize:11 }}>👤</span>
                <span style={{ fontSize:12, fontWeight:700, color:"#16a34a" }}>{r.uploader_name ?? "익명"}</span>
              </div>
              <span style={{ fontSize:11, color:"var(--text-subtle)" }}>{formatDateTime(r.created_at)}</span>
            </div>

            {r.description && (
              <p style={{ fontSize:13, color:"var(--text)", lineHeight:1.7, margin:"0 0 12px", whiteSpace:"pre-wrap" }}>{r.description}</p>
            )}

            {openUrl && !isImg && (
              <a href={openUrl} target="_blank" rel="noopener noreferrer"
                style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:13, fontWeight:700, color:"#6366f1", textDecoration:"none", padding:"8px 18px", borderRadius:999, background:"#eff6ff", border:"1.5px solid #c7d2fe", marginBottom:12 }}>
                {getFileIcon(r.file_name)} {r.file_name ?? "파일 열기"} 보기 →
              </a>
            )}

            <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:12 }}>
              {isAdmin ? (
                <button onClick={() => deleteResource(r.id)}
                  style={{ fontSize:11, padding:"4px 10px", borderRadius:999, border:"1px solid #fecaca", background:"#fff5f5", color:"#ef4444", cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>
                  삭제
                </button>
              ) : r.delete_code ? (
                isBeingDeleted ? (
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <input
                      placeholder="삭제 코드 입력"
                      value={deleteCodeInput}
                      onChange={e => setDeleteCodeInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleCodeDelete(r); }}
                      className="hy-input"
                      style={{ fontSize:12, width:110, padding:"4px 10px", textAlign:"center" }}
                      autoFocus
                    />
                    <button onClick={() => handleCodeDelete(r)}
                      style={{ fontSize:11, padding:"3px 8px", borderRadius:999, border:"1px solid #fecaca", background:"#fff5f5", color:"#ef4444", cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>
                      확인
                    </button>
                    <button onClick={() => { setDeletingResource(null); setDeleteCodeInput(""); }}
                      style={{ fontSize:11, padding:"3px 8px", borderRadius:999, border:"1px solid var(--border)", background:"#fff", color:"var(--text-muted)", cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>
                      취소
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setDeletingResource(r.id)}
                    style={{ fontSize:11, padding:"4px 10px", borderRadius:999, border:"1px solid #fecaca", background:"#fff5f5", color:"#ef4444", cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>
                    삭제
                  </button>
                )
              ) : null}
            </div>

            <div style={{ borderTop:"1px solid var(--border)", paddingTop:14 }}>
              <p style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", margin:"0 0 10px" }}>💬 댓글 {resComments.length}개</p>
              {resComments.length === 0 ? (
                <p style={{ fontSize:12, color:"var(--text-subtle)", margin:"0 0 12px", textAlign:"center", fontWeight:600 }}>첫 번째 댓글을 남겨봐요!</p>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
                  {resComments.map(c => (
                    <div key={c.id} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                      <div style={{ width:28, height:28, borderRadius:999, background:"var(--primary-light)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"var(--primary)", flexShrink:0 }}>
                        {c.author_name.charAt(0)}
                      </div>
                      <div style={{ flex:1, background:"#f9fafb", borderRadius:12, padding:"8px 12px", border:"1px solid var(--border)" }}>
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
              {!isFrozen && (
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
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── 업로드 폼 렌더 ───
  const renderUploadForm = (subjectFixed?: string) => (
    <div style={{ padding:"18px 20px", background:"#f8faff", borderRadius:16, border:"1.5px solid #e0e7ff" }}>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setRDragOver(true); }}
          onDragLeave={() => setRDragOver(false)}
          onDrop={e => { e.preventDefault(); setRDragOver(false); if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files); }}
          style={{
            border: rDragOver ? "2px dashed #6366f1" : "2px dashed #c7d2fe",
            borderRadius:14, padding: rFiles.length > 0 ? 10 : 22, background: rDragOver ? "#eef2ff" : "#fff",
            textAlign:"center", cursor:"pointer", transition:"all 0.12s",
          }}>
          {rFiles.length === 0 ? (
            <>
              <p style={{ fontSize:26, margin:"0 0 4px" }}>📸</p>
              <p style={{ fontSize:13, color:"var(--text)", margin:"0 0 4px", fontWeight:700 }}>필기 사진을 올리거나 여기로 끌어다 놓으세요</p>
              <p style={{ fontSize:11, color:"var(--text-subtle)", margin:0 }}>JPG · PNG · PDF · HWP · PPT · DOC 등 (최대 50MB) · 사진은 여러 장 한 번에 선택할 수 있어요</p>
            </>
          ) : rFiles.length === 1 && !isImageFile(rFiles[0].file.name) ? (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              <span style={{ fontSize:20 }}>{getFileIcon(rFiles[0].file.name)}</span>
              <span style={{ fontSize:13, fontWeight:700, color:"var(--primary)" }}>{rFiles[0].file.name}</span>
              <button onClick={e => { e.stopPropagation(); removeFile(rFiles[0].key); if (fileRef.current) fileRef.current.value = ""; }}
                style={{ fontSize:11, color:"#ef4444", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>✕</button>
            </div>
          ) : rFiles.length === 1 ? (
            <div style={{ position:"relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={rFiles[0].previewUrl} alt="미리보기" style={{ width:"100%", maxHeight:220, objectFit:"contain", borderRadius:10, display:"block" }}/>
              <button onClick={e => { e.stopPropagation(); removeFile(rFiles[0].key); if (fileRef.current) fileRef.current.value = ""; }}
                style={{ position:"absolute", top:6, right:6, width:26, height:26, borderRadius:999, border:"none", background:"rgba(0,0,0,0.55)", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:700 }}>✕</button>
            </div>
          ) : (
            <div onClick={e => e.stopPropagation()} style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(84px,1fr))", gap:8 }}>
              {rFiles.map((f, i) => (
                <div key={f.key} style={{ position:"relative", aspectRatio:"1 / 1", borderRadius:10, overflow:"hidden", border:"1px solid var(--border)", background:"#f3f4f6" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.previewUrl} alt={f.file.name} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
                  <span style={{ position:"absolute", bottom:3, left:3, fontSize:9, fontWeight:800, padding:"1px 6px", borderRadius:999, background:"rgba(0,0,0,0.6)", color:"#fff" }}>{i+1}</span>
                  <button onClick={() => { removeFile(f.key); }}
                    style={{ position:"absolute", top:3, right:3, width:20, height:20, borderRadius:999, border:"none", background:"rgba(0,0,0,0.6)", color:"#fff", cursor:"pointer", fontSize:11, fontWeight:700, lineHeight:1 }}>✕</button>
                </div>
              ))}
              <div onClick={() => fileRef.current?.click()}
                style={{ aspectRatio:"1 / 1", borderRadius:10, border:"1.5px dashed #c7d2fe", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, color:"var(--primary)", cursor:"pointer", background:"#fff" }}>
                ＋
              </div>
            </div>
          )}
        </div>
        {rFiles.length > 1 && (
          <p style={{ fontSize:12, color:"var(--text-subtle)", margin:0, fontWeight:600 }}>
            📎 사진 {rFiles.length}장 선택됨 · {(rFiles.reduce((s, f) => s + f.file.size, 0)/1024/1024).toFixed(1)}MB
          </p>
        )}
        <input ref={fileRef} type="file" multiple
          accept=".pdf,.hwp,.hwpx,.jpg,.jpeg,.png,.gif,.webp,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.zip"
          style={{ display:"none" }}
          onChange={e => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }}/>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {!subjectFixed && (
            <select value={rSubject} onChange={e => setRSubject(e.target.value)} className="hy-input" style={{ cursor:"pointer" }}>
              {MENTORS.map(m => <option key={m.subject} value={m.subject}>{m.subject}</option>)}
            </select>
          )}
          <select value={rType} onChange={e => setRType(e.target.value)} className="hy-input" style={{ cursor:"pointer" }}>
            {UPLOAD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input placeholder="올리는 사람 이름 *" value={rUploaderName} onChange={e => setRUploaderName(e.target.value)} className="hy-input"/>
        </div>
        {rFiles.length <= 1 ? (
          <input placeholder="제목 (선택, 비우면 파일명 사용)" value={rTitle} onChange={e => setRTitle(e.target.value)} className="hy-input"/>
        ) : (
          <p style={{ fontSize:12, color:"var(--text-subtle)", margin:0, fontWeight:600 }}>📝 제목은 각 사진의 파일명으로 자동 등록돼요</p>
        )}
        <input placeholder="한 줄 메모 (선택, 예: 3단원 개념 정리했어요!)" value={rDesc} onChange={e => setRDesc(e.target.value)} className="hy-input"/>
        <input
          placeholder="🔑 삭제 코드 (선택, 나중에 직접 지울 때 필요해요)"
          value={rDeleteCode}
          onChange={e => setRDeleteCode(e.target.value)}
          className="hy-input"
          style={{ fontSize:12 }}
        />

        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button onClick={() => addResource(subjectFixed)} disabled={uploading}
            className="hy-btn hy-btn-primary" style={{ fontSize:13 }}>
            {uploading ? (rFiles.length > 1 ? `올리는 중... (${rFiles.length}장)` : "올리는 중...") : "📤 공유하기"}
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
          <h1 style={{ color:"#fff",fontSize:"clamp(20px,4vw,30px)",fontWeight:900,margin:"0 0 8px",letterSpacing:"-0.5px" }}>교과 멘토·멘티 필기 공유</h1>
          <p style={{ color:"rgba(255,255,255,0.85)",fontSize:13,margin:"0 0 14px",lineHeight:1.7,fontWeight:500 }}>
            {isFrozen
              ? "1학기 최종 기록이에요. 자료는 그대로 보존됩니다."
              : <>필기 사진, 요약 자료, 예상 문제를 사진 한 장으로 편하게 공유해요.<br/>시험 기간 전 적극적으로 활용해봐요!</>}
          </p>
          <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:14, padding:6, display:"inline-flex" }}>
            <SemesterTabs value={semester} onChange={setSemester} />
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {([
          ["mentors", "멘토 명단 👥", 0],
          ["resources","필기·자료 공유 📸", newResCount],
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
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            {MENTORS.map(m=>{
              const isSelected = selectedSubject === m.subject;
              const subjectRes = scopedResources.filter(r=>r.subject===m.subject);
              const resCount = subjectRes.length;
              const recentRes = subjectRes.slice(0,3);
              const hasNew = subjectRes.some(r => isNew(r.created_at));
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
                      <p style={{ color:"rgba(255,255,255,0.8)", fontSize:12, margin:0, fontWeight:600 }}>멘토 {m.mentors.length}명 · 공유 자료 {resCount}개</p>
                    </div>
                    <span style={{ fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.9)",background:"rgba(255,255,255,0.2)",padding:"3px 10px",borderRadius:999 }}>
                      {isSelected ? "선택됨 ✓" : "자료 보기 →"}
                    </span>
                  </div>
                  <div style={{ background:"#fff", padding:"14px 18px" }}>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom: recentRes.length > 0 ? 12 : 0 }}>
                      {m.mentors.map(name=>(
                        <span key={name} style={{ padding:"6px 14px", borderRadius:999, background:"#fdf2f8", color:"var(--primary)", fontWeight:800, fontSize:13, border:"1.5px solid #f9d0ea" }}>
                          {name}
                        </span>
                      ))}
                    </div>
                    {recentRes.length > 0 && (
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }} onClick={e => e.stopPropagation()}>
                        {recentRes.map(r => {
                          const openUrl = r.file_url || r.link || null;
                          const isImg = isImageFile(r.file_name);
                          return (
                            <button key={r.id} onClick={() => setDetailId(r.id)}
                              style={{ position:"relative", aspectRatio:"1 / 1", borderRadius:10, overflow:"hidden", border:"1px solid var(--border)", padding:0, cursor:"pointer", background:"#fafafa" }}>
                              {isImg && openUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={openUrl} alt={r.title} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
                              ) : (
                                <span style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{getFileIcon(r.file_name)}</span>
                              )}
                              {isNew(r.created_at) && (
                                <span style={{ position:"absolute", top:3, left:3, fontSize:7, fontWeight:800, padding:"1px 4px", borderRadius:999, background:"#6366f1", color:"#fff" }}>N</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
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
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <ViewToggle />
                  {!isFrozen && (
                    <button onClick={()=>setROpen(o=>!o)} className="hy-btn hy-btn-primary" style={{ fontSize:13 }}>
                      {rOpen ? "닫기" : "📸 필기 올리기"}
                    </button>
                  )}
                </div>
              </div>

              {!isFrozen && rOpen && <div style={{ marginBottom:20 }}>{renderUploadForm(selectedSubject)}</div>}

              {selectedSubjectResources.length === 0 ? (
                <div style={{ textAlign:"center",padding:"32px 0" }}>
                  <p style={{ fontSize:14,color:"var(--text-subtle)",fontWeight:600 }}>
                    {isFrozen ? "공유된 자료가 없어요." : "아직 공유된 자료가 없어요. 첫 필기를 올려봐요! 📸"}
                  </p>
                </div>
              ) : viewMode === "grid" ? (
                renderGroupedGrid(selectedSubjectResources)
              ) : (
                renderGroupedList(selectedSubjectResources)
              )}
            </div>
          )}
        </div>
      )}

      {/* ───────── 필기·자료 공유 탭 ───────── */}
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
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <ViewToggle />
              {!isFrozen && (
                <button onClick={()=>setROpen(o=>!o)} className="hy-btn hy-btn-primary" style={{ fontSize:13 }}>
                  {rOpen ? "닫기" : "📸 필기/자료 올리기"}
                </button>
              )}
            </div>
          </div>

          {!isFrozen && rOpen && (
            <div className="hy-card" style={{ padding:"20px 22px" }}>
              <h3 style={{ fontSize:15,fontWeight:800,color:"var(--text)",margin:"0 0 14px" }}>필기·자료 공유하기</h3>
              {renderUploadForm()}
            </div>
          )}

          {filteredRes.length === 0 ? (
            <div className="hy-card" style={{ padding:"40px",textAlign:"center" }}>
              <p style={{ fontSize:14,color:"var(--text-subtle)",fontWeight:600 }}>공유된 자료가 없어요 📂</p>
            </div>
          ) : viewMode === "grid" ? (
            renderGroupedGrid(filteredRes, true)
          ) : (
            renderGroupedList(filteredRes, true)
          )}
        </div>
      )}

      {renderDetailModal()}
    </div>
  );
}
