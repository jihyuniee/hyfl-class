"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/components/lib/supabaseClient";

// ── 타입 ──
type Student = { student_no: string; name: string };

type WallPost = {
  id: string; author_name: string; content: string; created_at: string;
};

type TeacherNote = {
  id: string; student_no: string; name: string;
  content: string; created_at: string;
};

type CounselingLog = {
  id: string; created_at: string; updated_at: string;
  student_no: string; name: string; date: string;
  category: string; content: string; followup: string | null;
  is_sensitive: boolean;
  gb_jaeyul: string | null; gb_dongari: string | null;
  gb_bongsa: string | null; gb_jinro: string | null;
};

type AiSummary = {
  id: string; student_no: string; name: string;
  summary: string; raw_text: string; created_at: string;
};

const STUDENTS: Student[] = [
  { student_no:"20201", name:"강지우" }, { student_no:"20202", name:"김은솔" },
  { student_no:"20203", name:"김태현" }, { student_no:"20204", name:"김하연" },
  { student_no:"20205", name:"김혜민" }, { student_no:"20206", name:"박민석" },
  { student_no:"20207", name:"박우진" }, { student_no:"20208", name:"성연준" },
  { student_no:"20209", name:"손정연" }, { student_no:"20210", name:"송민주" },
  { student_no:"20211", name:"심지안" }, { student_no:"20212", name:"양효승" },
  { student_no:"20213", name:"유다현" }, { student_no:"20214", name:"윤혜림" },
  { student_no:"20215", name:"이승지" }, { student_no:"20216", name:"이시원" },
  { student_no:"20217", name:"이조은" }, { student_no:"20218", name:"장지현" },
  { student_no:"20219", name:"전주하" }, { student_no:"20220", name:"정은지" },
  { student_no:"20221", name:"주보민" }, { student_no:"20222", name:"최안아" },
  { student_no:"20223", name:"현서정" },
];

const CATEGORIES = [
  { key:"가족관계", emoji:"👨‍👩‍👧", color:"#f97316" },
  { key:"교우관계", emoji:"🤝",       color:"#a855f7" },
  { key:"학업",    emoji:"📚",        color:"#3b82f6" },
  { key:"학원고민", emoji:"🏫",       color:"#06b6d4" },
  { key:"진로",    emoji:"🎯",        color:"#22c55e" },
  { key:"정서/심리", emoji:"💭",      color:"#ec4899" },
  { key:"기타",    emoji:"💬",        color:"#94a3b8" },
];

function fmtDate(d: string) {
  if (!d) return "";
  const dt = new Date(`${d}T00:00:00+09:00`);
  const days = ["일","월","화","수","목","금","토"];
  return `${dt.getMonth()+1}/${dt.getDate()}(${days[dt.getDay()]})`;
}
function toKSTDate() {
  const k = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${k.getFullYear()}-${String(k.getMonth()+1).padStart(2,"0")}-${String(k.getDate()).padStart(2,"0")}`;
}
function safeParseIntro(content: string) {
  try {
    const obj = JSON.parse(content);
    return { name: obj.name ?? "", mbti: obj.mbti ?? "", like: obj.likeBehaviors ?? "",
      dislike: obj.dislikeBehaviors ?? "", goal: obj.thisYearGoal ?? "", message: obj.message ?? "" };
  } catch { return null; }
}

const emptyForm = () => ({
  student_no: "", name: "", date: toKSTDate(), category: "학업",
  content: "", followup: "", is_sensitive: false,
  gb_jaeyul: "", gb_dongari: "", gb_bongsa: "", gb_jinro: "",
});

// ── 비밀번호: 환경변수 or 기본값 ──
// Vercel에서 NEXT_PUBLIC_TEACHER_PW 환경변수로 설정하세요
const TEACHER_PW = process.env.NEXT_PUBLIC_TEACHER_PW ?? "hyfl-teacher-2026!";

export default function TeacherOnlyPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw]         = useState("");
  const [pwErr, setPwErr]   = useState(false);
  const [view, setView]     = useState<"dashboard"|"student"|"form"|"ai">("dashboard");

  // 데이터
  const [logs,         setLogs]         = useState<CounselingLog[]>([]);
  const [wallPosts,    setWallPosts]     = useState<WallPost[]>([]);
  const [teacherNotes, setTeacherNotes] = useState<TeacherNote[]>([]);
  const [aiSummaries,  setAiSummaries]  = useState<AiSummary[]>([]);
  const [loading,      setLoading]      = useState(false);

  // 선택된 학생
  const [selStudent, setSelStudent]   = useState<Student | null>(null);
  const [activeTab,  setActiveTab]    = useState<"intro"|"log"|"gb"|"ai">("intro");

  // 폼
  const [form,    setForm]    = useState(emptyForm());
  const [selLog,  setSelLog]  = useState<CounselingLog | null>(null);
  const [saving,  setSaving]  = useState(false);

  // AI 요약
  const [aiFile,       setAiFile]       = useState<File | null>(null);
  const [aiStudentNo,  setAiStudentNo]  = useState("");
  const [aiLoading,    setAiLoading]    = useState(false);
  const [aiResult,     setAiResult]     = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleLogin() {
    if (pw === TEACHER_PW) { setAuthed(true); loadAll(); }
    else { setPwErr(true); setPw(""); setTimeout(() => setPwErr(false), 1500); }
  }

  async function loadAll() {
    setLoading(true);
    const [{ data: ld }, { data: wd }, { data: tn }, { data: ai }] = await Promise.all([
      supabase.from("counseling_logs").select("*").order("date", { ascending: false }),
      supabase.from("wall_posts").select("id,author_name,content,created_at").order("created_at"),
      supabase.from("teacher_notes").select("*").order("created_at"),
      supabase.from("ai_summaries").select("*").order("created_at", { ascending: false }),
    ]);
    setLogs((ld as CounselingLog[]) ?? []);
    setWallPosts((wd as WallPost[]) ?? []);
    setTeacherNotes((tn as TeacherNote[]) ?? []);
    setAiSummaries((ai as AiSummary[]) ?? []);
    setLoading(false);
  }

  async function saveLog() {
    if (!form.student_no || !form.content.trim()) { alert("학생과 상담 내용을 입력해주세요"); return; }
    setSaving(true);
    const payload = {
      student_no: form.student_no, name: form.name, date: form.date,
      category: form.category, content: form.content.trim(),
      followup: form.followup?.trim() || null, is_sensitive: form.is_sensitive,
      gb_jaeyul: form.gb_jaeyul?.trim() || null, gb_dongari: form.gb_dongari?.trim() || null,
      gb_bongsa: form.gb_bongsa?.trim() || null, gb_jinro: form.gb_jinro?.trim() || null,
      updated_at: new Date().toISOString(),
    };
    if (selLog) await supabase.from("counseling_logs").update(payload).eq("id", selLog.id);
    else await supabase.from("counseling_logs").insert(payload);
    setSaving(false); setSelLog(null); setForm(emptyForm());
    await loadAll();
    setView("student");
  }

  async function deleteLog(id: string) {
    if (!confirm("삭제할까요?")) return;
    await supabase.from("counseling_logs").delete().eq("id", id);
    await loadAll();
  }

  async function saveTeacherNote(student_no: string, name: string, content: string) {
    const existing = teacherNotes.find(n => n.student_no === student_no);
    if (existing) await supabase.from("teacher_notes").update({ content, updated_at: new Date().toISOString() }).eq("id", existing.id);
    else await supabase.from("teacher_notes").insert({ student_no, name, content });
    await loadAll();
  }

  // AI 요약 (파일 → 텍스트 추출 → Claude API)
  async function runAiSummary() {
    if (!aiFile || !aiStudentNo) { alert("학생과 파일을 선택해주세요"); return; }
    const student = STUDENTS.find(s => s.student_no === aiStudentNo);
    if (!student) return;
    setAiLoading(true); setAiResult("");

    try {
      // PDF → base64
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res((r.result as string).split(",")[1]);
        r.onerror = () => rej(new Error("파일 읽기 실패"));
        r.readAsDataURL(aiFile);
      });

      const isPdf = aiFile.type === "application/pdf";
      const isExcel = aiFile.name.endsWith(".xlsx") || aiFile.name.endsWith(".xls");

      let messages: any[];
      if (isPdf) {
        messages = [{
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
            { type: "text", text: `이 학생(${student.name}, ${student.student_no})의 생기부/성적 자료입니다. 아래 항목을 한국 고등학교 담임 선생님 시각으로 간결하게 요약해주세요:\n\n1. 자율활동 주요 내용\n2. 동아리활동 특이사항\n3. 봉사활동\n4. 진로활동 및 희망 진로\n5. 성적 특이사항 (있으면)\n6. 행동발달 기재에 참고할 특기사항\n7. 상담 시 주목할 점\n\n각 항목은 짧고 명확하게, 없는 항목은 "해당 없음"으로 표시해주세요.` }
          ]
        }];
      } else {
        // 엑셀/텍스트는 텍스트로 처리 안내
        setAiResult("⚠️ 현재 PDF만 AI 분석을 지원해요. 엑셀 파일은 PDF로 변환 후 업로드해주세요.");
        setAiLoading(false); return;
      }

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages }),
      });
      const data = await resp.json();
      const result = data.content?.find((c: any) => c.type === "text")?.text ?? "요약 실패";
      setAiResult(result);

      // DB 저장
      await supabase.from("ai_summaries").upsert({
        student_no: student.student_no, name: student.name,
        summary: result, raw_text: `[${aiFile.name}]`,
        updated_at: new Date().toISOString(),
      }, { onConflict: "student_no" });
      await loadAll();
    } catch (e) {
      setAiResult("오류가 발생했어요. 다시 시도해주세요.");
    }
    setAiLoading(false);
  }

  // 파생 데이터
  const logsByStudent: Record<string, CounselingLog[]> = {};
  logs.forEach(l => { if (!logsByStudent[l.student_no]) logsByStudent[l.student_no] = []; logsByStudent[l.student_no].push(l); });
  const wallByStudent: Record<string, WallPost> = {};
  wallPosts.forEach(w => { wallByStudent[w.author_name] = w; });
  const noteByStudent: Record<string, TeacherNote> = {};
  teacherNotes.forEach(n => { noteByStudent[n.student_no] = n; });
  const aiByStudent: Record<string, AiSummary> = {};
  aiSummaries.forEach(a => { aiByStudent[a.student_no] = a; });

  const counseledCount    = Object.keys(logsByStudent).length;
  const notCounseledCount = STUDENTS.length - counseledCount;
  const selLogs           = selStudent ? (logsByStudent[selStudent.student_no] ?? []) : [];
  const selWall           = selStudent ? wallByStudent[selStudent.name] : null;
  const selNote           = selStudent ? noteByStudent[selStudent.student_no] : null;
  const selAi             = selStudent ? aiByStudent[selStudent.student_no] : null;
  const [noteText, setNoteText] = useState("");

  function openStudent(s: Student) {
    setSelStudent(s);
    setNoteText(noteByStudent[s.student_no]?.content ?? "");
    setActiveTab("intro");
    setView("student");
  }

  // ── 로그인 화면 ──
  if (!authed) return (
    <div style={{ minHeight:"70vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div className="hy-card" style={{ padding:"44px 40px", maxWidth:380, width:"100%", textAlign:"center" }}>
        <p style={{ fontSize:40, margin:"0 0 16px" }}>🔐</p>
        <h2 style={{ fontSize:18, fontWeight:900, color:"var(--text)", margin:"0 0 4px" }}>교사 전용 페이지</h2>
        <p style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:600, margin:"0 0 28px", lineHeight:1.7 }}>
          이 페이지의 URL은 학생에게 공유하지 마세요.<br/>상담 일지와 생기부 자료가 포함되어 있어요.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <input type="password" placeholder="비밀번호" value={pw}
            onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()}
            className="hy-input" style={{ textAlign:"center", fontSize:16,
              borderColor: pwErr ? "#ef4444" : undefined,
              animation: pwErr ? "shake 0.3s" : "none" }}/>
          {pwErr && <p style={{ fontSize:12, color:"#ef4444", fontWeight:700, margin:0 }}>비밀번호가 틀렸어요</p>}
          <button onClick={handleLogin} className="hy-btn hy-btn-primary" style={{ fontSize:14 }}>
            입장하기
          </button>
        </div>
        <p style={{ fontSize:11, color:"var(--text-subtle)", marginTop:20, lineHeight:1.7 }}>
          💡 Vercel 환경변수 <code>NEXT_PUBLIC_TEACHER_PW</code>로<br/>비밀번호를 변경할 수 있어요
        </p>
      </div>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }`}</style>
    </div>
  );

  // ── 상담 기록 폼 ──
  if (view === "form") return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={() => { setView("student"); setSelLog(null); setForm(emptyForm()); }}
          className="hy-btn" style={{ fontSize:13 }}>← 돌아가기</button>
        <h2 style={{ fontSize:17, fontWeight:900, color:"var(--text)", margin:0 }}>
          {selLog ? "✏️ 기록 수정" : `✏️ ${selStudent?.name} 상담 기록`}
        </h2>
      </div>

      <div className="hy-card" style={{ padding:"26px 28px" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:5 }}>학생 *</label>
              <select value={form.student_no}
                onChange={e => { const s = STUDENTS.find(s => s.student_no === e.target.value); setForm(f => ({ ...f, student_no: e.target.value, name: s?.name ?? "" })); }}
                className="hy-input" style={{ cursor:"pointer" }}>
                <option value="">학생 선택</option>
                {STUDENTS.map(s => <option key={s.student_no} value={s.student_no}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:5 }}>날짜 *</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="hy-input"/>
            </div>
          </div>

          <div>
            <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:8 }}>상담 분류 *</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {CATEGORIES.map(c => (
                <button key={c.key} onClick={() => setForm(f => ({ ...f, category: c.key }))}
                  style={{ padding:"8px 14px", borderRadius:999, border:"1.5px solid", fontFamily:"inherit", cursor:"pointer", fontSize:13, fontWeight:700,
                    borderColor: form.category === c.key ? c.color : "var(--border)",
                    background:  form.category === c.key ? c.color + "22" : "#fff",
                    color:       form.category === c.key ? c.color : "var(--text-muted)" }}>
                  {c.emoji} {c.key}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:5 }}>상담 내용 *</label>
            <textarea placeholder="학생이 말한 내용, 선생님 반응, 느낀 점 등"
              value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              className="hy-input" style={{ minHeight:140, resize:"vertical" }}/>
          </div>

          <div>
            <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:5 }}>후속 조치 / 다음 상담 메모</label>
            <textarea placeholder="다음에 확인할 것, 연락할 사항 등"
              value={form.followup ?? ""} onChange={e => setForm(f => ({ ...f, followup: e.target.value }))}
              className="hy-input" style={{ minHeight:70, resize:"vertical" }}/>
          </div>

          <div style={{ padding:"16px 18px", borderRadius:16, background:"#f8f7ff", border:"1.5px solid #e0d9ff" }}>
            <p style={{ fontSize:13, fontWeight:900, color:"#5b21b6", margin:"0 0 12px" }}>📝 생기부 기재 참고</p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {([
                { key:"gb_jaeyul", label:"자율활동", ph:"자율활동 특기사항에 참고할 내용" },
                { key:"gb_dongari", label:"동아리", ph:"동아리 관련 내용" },
                { key:"gb_bongsa", label:"봉사", ph:"봉사 관련 내용" },
                { key:"gb_jinro", label:"진로", ph:"진로 희망, 관심 분야" },
              ] as const).map(item => (
                <div key={item.key}>
                  <label style={{ fontSize:11, fontWeight:700, color:"#7c3aed", display:"block", marginBottom:4 }}>{item.label}</label>
                  <textarea placeholder={item.ph} value={(form as any)[item.key] ?? ""}
                    onChange={e => setForm(f => ({ ...f, [item.key]: e.target.value }))}
                    className="hy-input" style={{ minHeight:52, resize:"vertical", fontSize:13 }}/>
                </div>
              ))}
            </div>
          </div>

          <label style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", borderRadius:12, background:"#fff5f5", border:"1.5px solid #fecaca", cursor:"pointer" }}>
            <input type="checkbox" checked={form.is_sensitive} onChange={e => setForm(f => ({ ...f, is_sensitive: e.target.checked }))} style={{ width:16, height:16 }}/>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:"#dc2626", margin:"0 0 1px" }}>🔒 민감 기록</p>
              <p style={{ fontSize:11, color:"#ef4444", margin:0 }}>특별히 주의가 필요한 내용</p>
            </div>
          </label>

          <div style={{ display:"flex", gap:8 }}>
            <button onClick={saveLog} disabled={saving} className="hy-btn hy-btn-primary" style={{ flex:1, fontSize:14 }}>
              {saving ? "저장 중..." : selLog ? "수정 완료" : "💾 저장"}
            </button>
            <button onClick={() => { setView("student"); setSelLog(null); setForm(emptyForm()); }} className="hy-btn" style={{ fontSize:13 }}>취소</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── 학생 상세 뷰 ──
  if (view === "student" && selStudent) return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
        <button onClick={() => setView("dashboard")} className="hy-btn" style={{ fontSize:13 }}>← 대시보드</button>
        <h2 style={{ fontSize:18, fontWeight:900, color:"var(--text)", margin:0 }}>
          {selStudent.name}
          <span style={{ fontSize:13, color:"var(--text-subtle)", fontWeight:600, marginLeft:8 }}>{selStudent.student_no}</span>
        </h2>
        <span style={{ fontSize:12, color:"var(--primary)", fontWeight:700 }}>상담 {selLogs.length}회</span>
        <button onClick={() => { setForm({ ...emptyForm(), student_no: selStudent.student_no, name: selStudent.name }); setSelLog(null); setView("form"); }}
          className="hy-btn hy-btn-primary" style={{ fontSize:12, padding:"8px 16px", marginLeft:"auto" }}>
          ✏️ 상담 기록 추가
        </button>
      </div>

      {/* 탭 */}
      <div style={{ display:"flex", background:"#f3f4f6", borderRadius:14, padding:4, gap:3 }}>
        {([
          { key:"intro", label:"🌸 자기소개" },
          { key:"log",   label:"📋 상담 기록" },
          { key:"gb",    label:"📝 생기부 참고" },
          { key:"ai",    label:"🤖 AI 요약" },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ flex:1, padding:"9px 6px", borderRadius:10, border:"none", cursor:"pointer", fontFamily:"inherit",
              background: activeTab === t.key ? "#fff" : "transparent",
              boxShadow: activeTab === t.key ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              fontSize:12, fontWeight:800,
              color: activeTab === t.key ? "var(--primary)" : "var(--text-muted)" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 자기소개 탭 */}
      {activeTab === "intro" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {selWall ? (() => {
            const intro = safeParseIntro(selWall.content);
            return (
              <div className="hy-card" style={{ padding:"22px 24px" }}>
                <p style={{ fontSize:13, fontWeight:900, color:"var(--text)", margin:"0 0 14px" }}>🌸 {selStudent.name}의 자기소개</p>
                {intro ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {[
                      { label:"🧬 MBTI",         value: intro.mbti },
                      { label:"😊 좋아하는 것",   value: intro.like },
                      { label:"😤 싫어하는 것",   value: intro.dislike },
                      { label:"🎯 올해 목표",      value: intro.goal },
                      { label:"💬 선생님께 한마디", value: intro.message },
                    ].filter(f => f.value?.trim()).map(f => (
                      <div key={f.label} style={{ background:"#f9fafb", borderRadius:12, padding:"12px 14px" }}>
                        <p style={{ fontSize:11, fontWeight:800, color:"var(--text-subtle)", margin:"0 0 4px" }}>{f.label}</p>
                        <p style={{ fontSize:13, color:"var(--text)", margin:0, whiteSpace:"pre-wrap", lineHeight:1.7 }}>{f.value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize:13, color:"var(--text)", whiteSpace:"pre-wrap", lineHeight:1.7, margin:0 }}>{selWall.content}</p>
                )}
              </div>
            );
          })() : (
            <div className="hy-card" style={{ padding:"30px", textAlign:"center" }}>
              <p style={{ fontSize:13, color:"var(--text-subtle)", fontWeight:600 }}>아직 자기소개를 작성하지 않았어요</p>
            </div>
          )}

          {/* 교사 메모 */}
          <div className="hy-card" style={{ padding:"22px 24px" }}>
            <p style={{ fontSize:13, fontWeight:900, color:"var(--text)", margin:"0 0 10px" }}>📌 이 학생에 대한 메모</p>
            <textarea placeholder="첫인상, 특이사항, 기억해 둘 것 등 자유롭게"
              value={noteText} onChange={e => setNoteText(e.target.value)}
              className="hy-input" style={{ minHeight:90, resize:"vertical" }}/>
            <button onClick={() => saveTeacherNote(selStudent.student_no, selStudent.name, noteText)}
              className="hy-btn hy-btn-primary" style={{ marginTop:8, fontSize:13 }}>저장</button>
          </div>
        </div>
      )}

      {/* 상담 기록 탭 */}
      {activeTab === "log" && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {selLogs.length === 0 ? (
            <div className="hy-card" style={{ padding:"40px", textAlign:"center" }}>
              <p style={{ fontSize:13, color:"var(--text-subtle)", fontWeight:600 }}>아직 상담 기록이 없어요</p>
            </div>
          ) : selLogs.map(log => {
            const c = CATEGORIES.find(c => c.key === log.category);
            const [exp, setExp] = useState(false);
            return (
              <div key={log.id} className="hy-card" style={{ padding:"16px 20px", borderLeft:`4px solid ${c?.color ?? "var(--primary)"}`, background: log.is_sensitive ? "#fff8f8" : undefined }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, gap:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                    <span style={{ fontSize:11, padding:"3px 10px", borderRadius:999, fontWeight:800, background:(c?.color ?? "#aaa")+"1a", color: c?.color ?? "#aaa" }}>{c?.emoji} {log.category}</span>
                    {log.is_sensitive && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:999, fontWeight:800, background:"#fff5f5", color:"#ef4444" }}>🔒</span>}
                    <span style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:600 }}>{fmtDate(log.date)}</span>
                  </div>
                  <div style={{ display:"flex", gap:5 }}>
                    <button onClick={() => { setForm({ student_no:log.student_no, name:log.name, date:log.date, category:log.category, content:log.content, followup:log.followup??'', is_sensitive:log.is_sensitive, gb_jaeyul:log.gb_jaeyul??'', gb_dongari:log.gb_dongari??'', gb_bongsa:log.gb_bongsa??'', gb_jinro:log.gb_jinro??'' }); setSelLog(log); setView("form"); }}
                      style={{ fontSize:11, padding:"3px 10px", borderRadius:999, border:"1.5px solid var(--border)", background:"#fff", cursor:"pointer", fontFamily:"inherit", fontWeight:700, color:"var(--text-muted)" }}>수정</button>
                    <button onClick={() => deleteLog(log.id)}
                      style={{ fontSize:11, padding:"3px 10px", borderRadius:999, border:"1.5px solid #fecaca", background:"#fff5f5", cursor:"pointer", fontFamily:"inherit", fontWeight:700, color:"#ef4444" }}>삭제</button>
                  </div>
                </div>
                {log.is_sensitive && !exp ? (
                  <button onClick={() => setExp(true)} style={{ fontSize:12, color:"#ef4444", fontWeight:700, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>🔒 민감 기록 — 탭해서 보기</button>
                ) : (
                  <>
                    <p style={{ fontSize:13, color:"var(--text)", lineHeight:1.8, margin:"0 0 6px", whiteSpace:"pre-wrap" }}>{log.content}</p>
                    {log.followup && (
                      <div style={{ padding:"8px 12px", borderRadius:10, background:"#f0fdf4", border:"1px solid #86efac" }}>
                        <p style={{ fontSize:11, fontWeight:700, color:"#15803d", margin:"0 0 2px" }}>📌 후속 조치</p>
                        <p style={{ fontSize:12, color:"#166534", margin:0, whiteSpace:"pre-wrap" }}>{log.followup}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 생기부 탭 */}
      {activeTab === "gb" && (
        <div className="hy-card" style={{ padding:"22px 24px" }}>
          <p style={{ fontSize:13, fontWeight:900, color:"var(--text)", margin:"0 0 16px" }}>📝 생기부 기재 참고 모음</p>
          {([
            { key:"gb_jaeyul",  label:"자율활동",  color:"#3b82f6" },
            { key:"gb_dongari", label:"동아리활동", color:"#a855f7" },
            { key:"gb_bongsa",  label:"봉사활동",  color:"#22c55e" },
            { key:"gb_jinro",   label:"진로활동",  color:"#f97316" },
          ] as const).map(item => {
            const relevant = selLogs.filter(l => (l as any)[item.key]);
            return (
              <div key={item.key} style={{ marginBottom:16 }}>
                <p style={{ fontSize:13, fontWeight:900, color:item.color, margin:"0 0 8px", borderBottom:`2px solid ${item.color}22`, paddingBottom:6 }}>{item.label}</p>
                {relevant.length === 0 ? (
                  <p style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:500 }}>기재 내용 없음</p>
                ) : relevant.map(l => (
                  <div key={l.id} style={{ marginBottom:6, padding:"10px 14px", borderRadius:10, background:"#f9fafb", border:"1px solid var(--border)" }}>
                    <p style={{ fontSize:11, color:"var(--text-subtle)", fontWeight:600, margin:"0 0 3px" }}>{fmtDate(l.date)}</p>
                    <p style={{ fontSize:13, color:"var(--text)", margin:0, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{(l as any)[item.key]}</p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* AI 요약 탭 */}
      {activeTab === "ai" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div className="hy-card" style={{ padding:"22px 24px" }}>
            <p style={{ fontSize:13, fontWeight:900, color:"var(--text)", margin:"0 0 6px" }}>🤖 생기부/성적 파일 AI 요약</p>
            <p style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:600, margin:"0 0 14px" }}>
              PDF 파일을 업로드하면 Claude가 자동으로 활동 내역을 요약해줘요
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <input ref={fileRef} type="file" accept=".pdf" onChange={e => setAiFile(e.target.files?.[0] ?? null)}
                style={{ display:"none" }}/>
              <button onClick={() => { setAiStudentNo(selStudent.student_no); fileRef.current?.click(); }}
                style={{ padding:"14px", borderRadius:14, border:"2px dashed var(--border)", background:"#f9fafb",
                  cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:700, color:"var(--text-muted)" }}>
                {aiFile ? `📄 ${aiFile.name}` : "📁 PDF 파일 선택"}
              </button>
              <button onClick={runAiSummary} disabled={aiLoading || !aiFile}
                className="hy-btn hy-btn-primary" style={{ fontSize:13, opacity: !aiFile ? 0.5 : 1 }}>
                {aiLoading ? "분석 중... 잠깐만요 ✨" : "🤖 AI 요약 시작"}
              </button>
            </div>
          </div>

          {(aiResult || selAi) && (
            <div className="hy-card" style={{ padding:"22px 24px", background:"#f8f7ff", border:"1.5px solid #e0d9ff" }}>
              <p style={{ fontSize:13, fontWeight:900, color:"#5b21b6", margin:"0 0 12px" }}>
                ✨ AI 요약 결과
                {selAi && !aiResult && <span style={{ fontSize:11, color:"var(--text-subtle)", fontWeight:600, marginLeft:8 }}>이전 저장 결과</span>}
              </p>
              <p style={{ fontSize:13, color:"var(--text)", lineHeight:1.9, margin:0, whiteSpace:"pre-wrap" }}>
                {aiResult || selAi?.summary}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── 대시보드 ──
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* 헤더 */}
      <div className="hy-hero" style={{ background:"linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4c1d95 100%)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
          <div>
            <p style={{ color:"rgba(255,255,255,0.5)", fontSize:11, fontWeight:700, margin:"0 0 6px", letterSpacing:"0.12em" }}>
              🔒 TEACHER ONLY · 2026 한영외고 2-2
            </p>
            <h1 style={{ color:"#fff", fontSize:"clamp(18px,4vw,26px)", fontWeight:900, margin:"0 0 8px" }}>
              📋 학생 상담 대시보드
            </h1>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              {[
                { label:"전체 학생", value:STUDENTS.length, color:"rgba(255,255,255,0.9)" },
                { label:"상담 완료", value:counseledCount, color:"#86efac" },
                { label:"미상담",   value:notCounseledCount, color:"#fca5a5" },
                { label:"총 기록",  value:logs.length, color:"#c4b5fd" },
              ].map(s => (
                <div key={s.label}>
                  <p style={{ fontSize:18, fontWeight:900, color:s.color, margin:"0 0 2px" }}>{s.value}</p>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", margin:0, fontWeight:600 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => setView("ai")}
              style={{ padding:"10px 16px", borderRadius:999, border:"1.5px solid rgba(255,255,255,0.3)", background:"rgba(255,255,255,0.1)", color:"#fff", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>
              🤖 AI 요약
            </button>
            <button onClick={() => { setAuthed(false); setPw(""); }}
              style={{ padding:"8px 14px", borderRadius:999, border:"1.5px solid rgba(255,255,255,0.2)", background:"transparent", color:"rgba(255,255,255,0.5)", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              나가기
            </button>
          </div>
        </div>
      </div>

      {/* 학생 그리드 */}
      <div>
        <p style={{ fontSize:12, fontWeight:800, color:"var(--text-muted)", margin:"0 0 10px", letterSpacing:"0.06em" }}>
          👥 학생별 현황 — 클릭하면 상세 페이지로
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:8 }}>
          {STUDENTS.map(s => {
            const cnt      = logsByStudent[s.student_no]?.length ?? 0;
            const latest   = logsByStudent[s.student_no]?.[0];
            const latestC  = CATEGORIES.find(c => c.key === latest?.category);
            const hasIntro = !!wallByStudent[s.name];
            const hasNote  = !!noteByStudent[s.student_no];
            const hasAi    = !!aiByStudent[s.student_no];
            return (
              <button key={s.student_no} onClick={() => openStudent(s)}
                style={{ padding:"14px 10px", borderRadius:14, border:"1.5px solid",
                  borderColor: cnt > 0 ? (latestC?.color ?? "var(--primary)") + "55" : "var(--border)",
                  background: cnt > 0 ? (latestC?.color ?? "#a855f7") + "0d" : "#fafafa",
                  cursor:"pointer", fontFamily:"inherit", textAlign:"center", transition:"all 0.15s" }}>
                <p style={{ fontSize:13, fontWeight:900, color:"var(--text)", margin:"0 0 4px" }}>{s.name}</p>
                <p style={{ fontSize:11, fontWeight:700, margin:"0 0 4px",
                  color: cnt > 0 ? (latestC?.color ?? "var(--primary)") : "var(--text-subtle)" }}>
                  {cnt > 0 ? `${cnt}회` : "미상담"}
                </p>
                <div style={{ display:"flex", justifyContent:"center", gap:3 }}>
                  {hasIntro && <span title="자기소개" style={{ fontSize:10 }}>🌸</span>}
                  {hasNote  && <span title="메모"     style={{ fontSize:10 }}>📌</span>}
                  {hasAi    && <span title="AI요약"   style={{ fontSize:10 }}>🤖</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 최근 상담 기록 */}
      <div>
        <p style={{ fontSize:12, fontWeight:800, color:"var(--text-muted)", margin:"0 0 10px", letterSpacing:"0.06em" }}>
          📋 최근 상담 기록
        </p>
        {loading ? (
          <p style={{ fontSize:13, color:"var(--text-subtle)", fontWeight:600 }}>불러오는 중...</p>
        ) : logs.slice(0, 8).map(log => {
          const c = CATEGORIES.find(c => c.key === log.category);
          return (
            <div key={log.id} className="hy-card" style={{ padding:"14px 18px", marginBottom:8,
              borderLeft:`3px solid ${c?.color ?? "var(--primary)"}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:11, padding:"2px 8px", borderRadius:999, fontWeight:800, background:(c?.color ?? "#aaa")+"1a", color: c?.color ?? "#aaa" }}>{c?.emoji} {log.category}</span>
                  <button onClick={() => openStudent(STUDENTS.find(s => s.student_no === log.student_no) ?? { student_no: log.student_no, name: log.name })}
                    style={{ fontSize:13, fontWeight:900, color:"var(--text)", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", textDecoration:"underline", textDecorationColor:"var(--border)", padding:0 }}>
                    {log.name}
                  </button>
                  <span style={{ fontSize:12, color:"var(--text-subtle)" }}>{fmtDate(log.date)}</span>
                </div>
                {log.is_sensitive && <span style={{ fontSize:10, color:"#ef4444", fontWeight:800 }}>🔒 민감</span>}
              </div>
              {!log.is_sensitive && (
                <p style={{ fontSize:12, color:"var(--text-muted)", margin:"6px 0 0", lineHeight:1.6,
                  overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                  {log.content}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* AI 일괄 요약 뷰 */}
      {view === "ai" && (
        <div className="hy-card" style={{ padding:"24px 26px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <p style={{ fontSize:14, fontWeight:900, color:"var(--text)", margin:0 }}>🤖 생기부 AI 요약</p>
            <button onClick={() => setView("dashboard")} style={{ fontSize:20, background:"none", border:"none", cursor:"pointer", color:"var(--text-subtle)" }}>×</button>
          </div>
          <p style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:600, margin:"0 0 16px", lineHeight:1.7 }}>
            학생을 선택하고 생기부 PDF를 올리면 AI가 자동으로 정리해줘요.<br/>
            학생 카드를 클릭 → AI 요약 탭에서도 사용할 수 있어요.
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <select value={aiStudentNo} onChange={e => setAiStudentNo(e.target.value)} className="hy-input" style={{ cursor:"pointer" }}>
              <option value="">학생 선택</option>
              {STUDENTS.map(s => <option key={s.student_no} value={s.student_no}>{s.name}</option>)}
            </select>
            <input ref={fileRef} type="file" accept=".pdf" onChange={e => setAiFile(e.target.files?.[0] ?? null)} style={{ display:"none" }}/>
            <button onClick={() => fileRef.current?.click()}
              style={{ padding:"14px", borderRadius:14, border:"2px dashed var(--border)", background:"#f9fafb", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:700, color:"var(--text-muted)" }}>
              {aiFile ? `📄 ${aiFile.name}` : "📁 PDF 파일 선택 (생기부, 성적표 등)"}
            </button>
            <button onClick={runAiSummary} disabled={aiLoading || !aiFile || !aiStudentNo}
              className="hy-btn hy-btn-primary" style={{ fontSize:14, opacity: (!aiFile || !aiStudentNo) ? 0.5 : 1 }}>
              {aiLoading ? "분석 중... ✨" : "🤖 AI 요약 시작"}
            </button>
            {aiResult && (
              <div style={{ padding:"18px 20px", borderRadius:14, background:"#f8f7ff", border:"1.5px solid #e0d9ff", marginTop:4 }}>
                <p style={{ fontSize:12, fontWeight:900, color:"#5b21b6", margin:"0 0 10px" }}>✨ AI 요약 결과</p>
                <p style={{ fontSize:13, color:"var(--text)", lineHeight:1.9, margin:0, whiteSpace:"pre-wrap" }}>{aiResult}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
