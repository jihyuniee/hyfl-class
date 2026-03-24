"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/components/lib/supabaseClient";

// ── 타입 ──────────────────────────────────────────────────────
type Student = { student_no: string; name: string };

type Submission = {
  id: string;
  payload: {
    studentNo: string; name: string;
    parentContact: string; preferredContactMethod: string;
    mbti: string; closeFriends: string; firstImpression: string;
    wantClassActivity: string; likeSubject: string; likeReason: string;
    dislikeSubject: string; dislikeReason: string; hobby: string;
    presentationStyle: string; learningHelpStyle: string;
    parentsStyle: string; parentsMeaning: string; talkWith: string;
    strengths: string; weaknesses: string; adjectives: string;
    wantToBe: string; dream: string; habitToFix: string;
    messageToTeacher: string; teacherShouldKnow: string;
  };
};

// 분야별 누적 상담 기록
type CounselingEntry = {
  id: string;
  student_no: string;
  date: string;
  field: "학업" | "교우관계" | "진로" | "가족" | "정서" | "기타";
  content: string;
  followup?: string | null;
  is_sensitive: boolean;
  created_at: string;
};

type TeacherNote = { id: string; student_no: string; content: string };

type AiSummary = { id: string; student_no: string; summary: string; created_at: string };

type HrRecord      = { id: string; student_no: string; days: string[] };
type Role          = { id: string; name: string; dept: string; role_name: string; duties: string | null };
type ResearchGroup = { id: string; name: string; topic: string; members: string };
type MentorLog     = { id: string; student_no: string; [key: string]: any };

// ── 상수 ──────────────────────────────────────────────────────
const STUDENTS: Student[] = [
  { student_no: "20201", name: "강지우" }, { student_no: "20202", name: "김은솔" },
  { student_no: "20203", name: "김태현" }, { student_no: "20204", name: "김하연" },
  { student_no: "20205", name: "김혜민" }, { student_no: "20206", name: "박민석" },
  { student_no: "20207", name: "박우진" }, { student_no: "20208", name: "성연준" },
  { student_no: "20209", name: "손정연" }, { student_no: "20210", name: "송민주" },
  { student_no: "20211", name: "심지안" }, { student_no: "20212", name: "양효승" },
  { student_no: "20213", name: "유다현" }, { student_no: "20214", name: "윤혜림" },
  { student_no: "20215", name: "이승지" }, { student_no: "20216", name: "이시원" },
  { student_no: "20217", name: "이조은" }, { student_no: "20218", name: "장지현" },
  { student_no: "20219", name: "전주하" }, { student_no: "20220", name: "정은지" },
  { student_no: "20221", name: "주보민" }, { student_no: "20222", name: "최안아" },
  { student_no: "20223", name: "현서정" },
];

const FIELDS: { key: CounselingEntry["field"]; emoji: string; color: string; bg: string }[] = [
  { key: "학업",    emoji: "📚", color: "#2563eb", bg: "#eff6ff" },
  { key: "교우관계", emoji: "🤝", color: "#a855f7", bg: "#fdf4ff" },
  { key: "진로",    emoji: "🎯", color: "#16a34a", bg: "#f0fdf4" },
  { key: "가족",    emoji: "👨‍👩‍👧", color: "#f97316", bg: "#fff7ed" },
  { key: "정서",    emoji: "💭", color: "#ec4899", bg: "#fdf2f8" },
  { key: "기타",    emoji: "💬", color: "#64748b", bg: "#f8fafc" },
];

const TEACHER_PW = process.env.NEXT_PUBLIC_TEACHER_PW ?? "hyfl-teacher-2026!";

function toKSTDate() {
  const k = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${k.getFullYear()}-${String(k.getMonth()+1).padStart(2,"0")}-${String(k.getDate()).padStart(2,"0")}`;
}
function fmtDate(d: string) {
  if (!d) return "";
  const dt = new Date(`${d}T00:00:00+09:00`);
  const days = ["일","월","화","수","목","금","토"];
  return `${dt.getMonth()+1}/${dt.getDate()}(${days[dt.getDay()]})`;
}
function parseWall(c: string) {
  try {
    const o = JSON.parse(c);
    return { mbti: o.mbti ?? "", like: o.likeBehaviors ?? "", dislike: o.dislikeBehaviors ?? "", goal: o.thisYearGoal ?? "", message: o.message ?? "" };
  } catch { return null; }
}

// ── 탭 타입 ──────────────────────────────────────────────────
type TabKey = "overview" | "survey" | "log" | "field" | "memo";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "⚡ 한눈에" },
  { key: "survey",   label: "📋 설문" },
  { key: "log",      label: "💬 상담기록" },
  { key: "field",    label: "📂 분야별" },
  { key: "memo",     label: "📌 메모" },
];

// ── 상담 입력 폼 컴포넌트 ─────────────────────────────────────
function CounselingForm({
  studentNo, name,
  onSaved, onCancel,
  editing,
}: {
  studentNo: string; name: string;
  onSaved: () => void; onCancel: () => void;
  editing?: CounselingEntry | null;
}) {
  const [field, setField] = useState<CounselingEntry["field"]>(editing?.field ?? "학업");
  const [date,  setDate]  = useState(editing?.date ?? toKSTDate());
  const [content, setContent] = useState(editing?.content ?? "");
  const [followup, setFollowup] = useState(editing?.followup ?? "");
  const [sensitive, setSensitive] = useState(editing?.is_sensitive ?? false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!content.trim()) { alert("내용을 입력해주세요"); return; }
    setSaving(true);
    const payload = {
      student_no: studentNo, name,
      date, field, content: content.trim(),
      followup: followup.trim() || null,
      is_sensitive: sensitive,
      updated_at: new Date().toISOString(),
    };
    if (editing) {
      await supabase.from("counseling_logs").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("counseling_logs").insert(payload);
    }
    setSaving(false);
    onSaved();
  }

  const selField = FIELDS.find(f => f.key === field)!;

  return (
    <div style={{
      background: "#fff", border: "1.5px solid var(--border)", borderRadius: 16,
      padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", margin: 0 }}>
          {editing ? "✏️ 기록 수정" : "✏️ 상담 기록 추가"}
        </p>
        <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8" }}>×</button>
      </div>

      {/* 분야 선택 */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 8px" }}>분야</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FIELDS.map(f => (
            <button key={f.key} onClick={() => setField(f.key)}
              style={{
                padding: "6px 12px", borderRadius: 999, border: "1.5px solid",
                borderColor: field === f.key ? f.color : "var(--border)",
                background: field === f.key ? f.bg : "#fff",
                color: field === f.key ? f.color : "var(--text-muted)",
                fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>
              {f.emoji} {f.key}
            </button>
          ))}
        </div>
      </div>

      {/* 날짜 */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 5px" }}>날짜</p>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="hy-input" style={{ maxWidth: 180 }} />
      </div>

      {/* 내용 */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: selField.color, margin: "0 0 5px" }}>
          {selField.emoji} {selField.key} 상담 내용
        </p>
        <textarea
          placeholder={`${name} 학생과 나눈 ${selField.key} 관련 내용을 적어요...`}
          value={content}
          onChange={e => setContent(e.target.value)}
          className="hy-input"
          style={{ minHeight: 110, resize: "vertical", fontSize: 13, lineHeight: 1.7,
            borderColor: content ? selField.color + "66" : undefined,
            background: content ? selField.bg : undefined }}
        />
      </div>

      {/* 후속 조치 */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 5px" }}>후속 조치 (선택)</p>
        <textarea
          placeholder="다음 상담 시 확인할 것, 연락할 사항..."
          value={followup}
          onChange={e => setFollowup(e.target.value)}
          className="hy-input"
          style={{ minHeight: 60, resize: "vertical", fontSize: 13 }}
        />
      </div>

      {/* 민감 여부 */}
      <label style={{
        display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
        padding: "10px 14px", borderRadius: 10,
        background: sensitive ? "#fff5f5" : "#f9fafb",
        border: `1px solid ${sensitive ? "#fecaca" : "var(--border)"}`,
      }}>
        <input type="checkbox" checked={sensitive} onChange={e => setSensitive(e.target.checked)}
          style={{ width: 15, height: 15, accentColor: "#e11d48", cursor: "pointer" }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: sensitive ? "#dc2626" : "var(--text-muted)" }}>
          🔒 민감 기록 (특별 주의 필요)
        </span>
      </label>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={save} disabled={saving}
          className="hy-btn hy-btn-primary" style={{ flex: 1, fontSize: 13 }}>
          {saving ? "저장 중..." : editing ? "수정 완료" : "💾 저장"}
        </button>
        <button onClick={onCancel} className="hy-btn" style={{ fontSize: 13 }}>취소</button>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function TeacherOnlyPage() {
  const [authed,   setAuthed]   = useState(false);
  const [pw,       setPw]       = useState("");
  const [pwErr,    setPwErr]    = useState(false);

  const [logs,          setLogs]          = useState<CounselingEntry[]>([]);
  const [hrRecords,     setHrRecords]     = useState<HrRecord[]>([]);
  const [researchGroups,setResearchGroups]= useState<ResearchGroup[]>([]);
  const [roleRecords,   setRoleRecords]   = useState<Role[]>([]);
  const [mentorData,    setMentorData]    = useState<any[]>([]);
  const [contacts,      setContacts]      = useState<any[]>([]);
  const [subs,     setSubs]     = useState<Submission[]>([]);
  const [walls,    setWalls]    = useState<{ author_name: string; content: string }[]>([]);
  const [notes,    setNotes]    = useState<TeacherNote[]>([]);
  const [ais,      setAis]      = useState<AiSummary[]>([]);
  const [loading,  setLoading]  = useState(false);

  const [sel,      setSel]      = useState<Student | null>(null);
  const [tab,      setTab]      = useState<TabKey>("overview");
  const [showForm, setShowForm] = useState(false);
  const [editLog,  setEditLog]  = useState<CounselingEntry | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [search,   setSearch]   = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult,  setAiResult]  = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [aiFile, setAiFile] = useState<File | null>(null);

  // 분야별 탭
  const [fieldTab, setFieldTab] = useState<CounselingEntry["field"]>("학업");

  function login() {
    if (pw === TEACHER_PW) { setAuthed(true); loadAll(); }
    else { setPwErr(true); setPw(""); setTimeout(() => setPwErr(false), 1500); }
  }

  async function loadAll() {
    setLoading(true);
    const [a, b, c, d, e, f, g, h, ii, j] = await Promise.all([
      supabase.from("counseling_logs").select("*").order("date", { ascending: false }),
      supabase.from("counseling_submissions").select("*"),
      supabase.from("wall_posts").select("author_name,content"),
      supabase.from("teacher_notes").select("*"),
      supabase.from("ai_summaries").select("*").order("created_at", { ascending: false }),
      supabase.from("hr_records").select("id,student_no,days"),
      supabase.from("research_groups").select("id,name,topic,members"),
      supabase.from("roles").select("id,name,dept,role_name,duties"),
      supabase.from("mentor_resources").select("*"),
      supabase.from("student_contacts").select("student_no,name,birthday,student_phone"),
    ]);
    setLogs((a.data as CounselingEntry[]) ?? []);
    setWalls((c.data as any[]) ?? []);
    setNotes((d.data as TeacherNote[]) ?? []);
    setAis((e.data as AiSummary[]) ?? []);
    setHrRecords((f.data as HrRecord[]) ?? []);
    setResearchGroups((g.data as ResearchGroup[]) ?? []);
    setRoleRecords((h.data as Role[]) ?? []);
    setMentorData((ii.data as any[]) ?? []);
    setContacts((j.data as any[]) ?? []);

    // 설문 파싱
    const parsed = ((b.data ?? []) as any[]).map((r: any) => ({
      id: r.id,
      payload: {
        studentNo: r.student_no ?? r.payload?.studentNo ?? "",
        name: r.name ?? r.payload?.name ?? "",
        parentContact: r.parent_contact ?? r.payload?.parentContact ?? "",
        preferredContactMethod: r.preferred_contact_method ?? r.payload?.preferredContactMethod ?? "",
        mbti: r.mbti ?? r.payload?.mbti ?? "",
        closeFriends: r.close_friends ?? r.payload?.closeFriends ?? "",
        firstImpression: r.first_impression ?? r.payload?.firstImpression ?? "",
        wantClassActivity: r.want_class_activity ?? r.payload?.wantClassActivity ?? "",
        likeSubject: r.like_subject ?? r.payload?.likeSubject ?? "",
        likeReason: r.like_reason ?? r.payload?.likeReason ?? "",
        dislikeSubject: r.dislike_subject ?? r.payload?.dislikeSubject ?? "",
        dislikeReason: r.dislike_reason ?? r.payload?.dislikeReason ?? "",
        hobby: r.hobby ?? r.payload?.hobby ?? "",
        presentationStyle: r.presentation_style ?? r.payload?.presentationStyle ?? "",
        learningHelpStyle: r.learning_help_style ?? r.payload?.learningHelpStyle ?? "",
        parentsStyle: r.parents_style ?? r.payload?.parentsStyle ?? "",
        parentsMeaning: r.parents_meaning ?? r.payload?.parentsMeaning ?? "",
        talkWith: r.talk_with ?? r.payload?.talkWith ?? "",
        strengths: r.strengths ?? r.payload?.strengths ?? "",
        weaknesses: r.weaknesses ?? r.payload?.weaknesses ?? "",
        adjectives: r.adjectives ?? r.payload?.adjectives ?? "",
        wantToBe: r.want_to_be ?? r.payload?.wantToBe ?? "",
        dream: r.dream ?? r.payload?.dream ?? "",
        habitToFix: r.habit_to_fix ?? r.payload?.habitToFix ?? "",
        messageToTeacher: r.message_to_teacher ?? r.payload?.messageToTeacher ?? "",
        teacherShouldKnow: r.teacher_should_know ?? r.payload?.teacherShouldKnow ?? "",
      },
    }));
    setSubs(parsed as Submission[]);
    setLoading(false);
  }

  // 맵 계산
  const logMap = useMemo(() => {
    const m: Record<string, CounselingEntry[]> = {};
    logs.forEach(l => { if (!m[l.student_no]) m[l.student_no] = []; m[l.student_no].push(l); });
    return m;
  }, [logs]);

  const subMap = useMemo(() => {
    const m: Record<string, Submission> = {};
    subs.forEach(s => { if (s.payload?.studentNo) m[s.payload.studentNo] = s; });
    return m;
  }, [subs]);

  const subByName = useMemo(() => {
    const m: Record<string, Submission> = {};
    subs.forEach(s => { if (s.payload?.name) m[s.payload.name] = s; });
    return m;
  }, [subs]);

  const wallMap = useMemo(() => {
    const m: Record<string, string> = {};
    walls.forEach(w => { m[w.author_name] = w.content; });
    return m;
  }, [walls]);

  const noteMap = useMemo(() => {
    const m: Record<string, TeacherNote> = {};
    notes.forEach(n => { m[n.student_no] = n; });
    return m;
  }, [notes]);

  const aiMap = useMemo(() => {
    const m: Record<string, AiSummary> = {};
    ais.forEach(a => { m[a.student_no] = a; });
    return m;
  }, [ais]);

  function openStudent(s: Student) {
    setSel(s);
    setTab("overview");
    setShowForm(false);
    setEditLog(null);
    setAiResult("");
    setAiFile(null);
    setNoteText(noteMap[s.student_no]?.content ?? "");
  }

  async function saveNote() {
    if (!sel) return;
    setNoteSaving(true);
    const ex = noteMap[sel.student_no];
    if (ex) {
      await supabase.from("teacher_notes").update({ content: noteText, updated_at: new Date().toISOString() }).eq("id", ex.id);
    } else {
      await supabase.from("teacher_notes").insert({ student_no: sel.student_no, name: sel.name, content: noteText });
    }
    await loadAll();
    setNoteSaving(false);
  }

  async function deleteLog(id: string) {
    if (!confirm("삭제할까요?")) return;
    await supabase.from("counseling_logs").delete().eq("id", id);
    await loadAll();
  }

  async function runAI() {
    if (!aiFile || !sel) return;
    setAiLoading(true); setAiResult("");
    try {
      const b64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res((r.result as string).split(",")[1]);
        r.onerror = () => rej(new Error("실패"));
        r.readAsDataURL(aiFile);
      });
      if (aiFile.type !== "application/pdf") { setAiResult("⚠️ PDF만 지원해요."); setAiLoading(false); return; }
      const sub = subMap[sel.student_no] ?? subByName[sel.name];
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } },
            { type: "text", text: `${sel.name} 학생 자료입니다. 담임 시각으로 요약:\n1.자율활동\n2.동아리\n3.봉사\n4.진로\n5.성적 특이사항\n6.상담 시 주목할 점\n각 2줄 내외${sub ? `\n[참고] MBTI:${sub.payload.mbti}, 꿈:${sub.payload.dream}, 장점:${sub.payload.strengths}` : ""}` }
          ]}]
        }),
      });
      const data = await resp.json();
      const result = data.content?.find((c: any) => c.type === "text")?.text ?? "요약 실패";
      setAiResult(result);
      await supabase.from("ai_summaries").upsert(
        { student_no: sel.student_no, name: sel.name, summary: result, updated_at: new Date().toISOString() },
        { onConflict: "student_no" }
      );
      await loadAll();
    } catch { setAiResult("오류가 발생했어요."); }
    setAiLoading(false);
  }

  // 필터링된 학생 목록
  const filteredStudents = useMemo(() =>
    STUDENTS.filter(s => s.name.includes(search) || s.student_no.includes(search)),
    [search]
  );

  // ── 로그인 화면 ──────────────────────────────────────────────
  if (!authed) return (
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="hy-card" style={{ padding: "44px 40px", maxWidth: 360, width: "100%", textAlign: "center" }}>
        <p style={{ fontSize: 36, margin: "0 0 16px" }}>🔐</p>
        <h2 style={{ fontSize: 17, fontWeight: 900, color: "var(--text)", margin: "0 0 4px" }}>교사 전용 페이지</h2>
        <p style={{ fontSize: 12, color: "var(--text-subtle)", fontWeight: 600, margin: "0 0 24px", lineHeight: 1.7 }}>
          이 URL은 학생에게 공유하지 마세요
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input type="password" placeholder="비밀번호" value={pw}
            onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && login()}
            className="hy-input"
            style={{ textAlign: "center", fontSize: 15, borderColor: pwErr ? "#ef4444" : undefined }} />
          {pwErr && <p style={{ fontSize: 12, color: "#ef4444", fontWeight: 700, margin: 0 }}>비밀번호가 틀렸어요</p>}
          <button onClick={login} className="hy-btn hy-btn-primary" style={{ fontSize: 14 }}>입장하기</button>
        </div>
      </div>
    </div>
  );

  // ── 메인 대시보드 (2단 레이아웃) ──────────────────────────────
  const selLogs = sel ? (logMap[sel.student_no] ?? []) : [];
  const selSub  = sel ? (subMap[sel.student_no] ?? subByName[sel.name] ?? null) : null;
  const selWall = sel ? (wallMap[sel.name] ? parseWall(wallMap[sel.name]) : null) : null;
  const selAi   = sel ? (aiMap[sel.student_no] ?? null) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* 헤더 */}
      <div className="hy-hero" style={{ marginBottom: 0, borderRadius: "16px 16px 0 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 700, margin: "0 0 4px", letterSpacing: "0.1em" }}>
              🔒 TEACHER ONLY · 2026 한영외고 2-2
            </p>
            <h1 style={{ color: "#fff", fontSize: "clamp(16px,3vw,22px)", fontWeight: 900, margin: 0 }}>
              📋 학생 상담 대시보드
            </h1>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { label: "전체", value: STUDENTS.length },
                { label: "상담완료", value: Object.keys(logMap).length },
                { label: "총기록", value: logs.length },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", margin: 0, fontWeight: 600 }}>{s.label}</p>
                </div>
              ))}
            </div>
            <button onClick={() => { setAuthed(false); setPw(""); }}
              style={{ padding: "6px 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit" }}>나가기</button>
          </div>
        </div>
      </div>

      {/* 2단 레이아웃 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        minHeight: "calc(100vh - 200px)",
        border: "1px solid var(--border)",
        borderTop: "none",
        borderRadius: "0 0 16px 16px",
        overflow: "hidden",
        background: "#fff",
      }}>

        {/* ── 왼쪽: 학생 명단 사이드바 ── */}
        <div style={{
          borderRight: "1px solid var(--border)",
          background: "#fafafa",
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 200px)",
          position: "sticky",
          top: 0,
        }}>
          {/* 검색 */}
          <div style={{ padding: "12px 12px 8px" }}>
            <input
              placeholder="이름 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "7px 10px", borderRadius: 8, fontSize: 12,
                border: "1px solid var(--border)", background: "#fff", fontFamily: "inherit",
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* 학생 목록 */}
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px 12px" }}>
            {filteredStudents.map(s => {
              const cnt   = logMap[s.student_no]?.length ?? 0;
              const isSelected = sel?.student_no === s.student_no;
              const hasSensitive = logMap[s.student_no]?.some(l => l.is_sensitive);
              const lastLog = logMap[s.student_no]?.[0];
              const lastField = FIELDS.find(f => f.key === lastLog?.field);

              return (
                <button
                  key={s.student_no}
                  onClick={() => openStudent(s)}
                  style={{
                    width: "100%", padding: "10px 10px", borderRadius: 10,
                    border: "1px solid",
                    borderColor: isSelected ? "var(--primary)" : "transparent",
                    background: isSelected ? "var(--primary-light)" : "transparent",
                    cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: 8,
                    marginBottom: 2, textAlign: "left",
                    transition: "all 0.1s",
                  }}
                >
                  {/* 아바타 */}
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: isSelected ? "var(--primary)" : cnt > 0 ? "#e9d5ff" : "#e2e8f0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 900,
                    color: isSelected ? "#fff" : cnt > 0 ? "#7c3aed" : "#94a3b8",
                  }}>
                    {s.name.slice(-1)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{
                        fontSize: 13, fontWeight: 800,
                        color: isSelected ? "var(--primary)" : "var(--text)",
                      }}>{s.name}</span>
                      {hasSensitive && <span style={{ fontSize: 9 }}>🔒</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {cnt > 0 ? (
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          color: lastField?.color ?? "var(--primary)",
                        }}>
                          {lastField?.emoji} {cnt}회
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, color: "#cbd5e1", fontWeight: 600 }}>미상담</span>
                      )}
                    </div>
                  </div>

                  {/* 분야 색상 도트 */}
                  {cnt > 0 && (
                    <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                      {FIELDS.filter(f => logMap[s.student_no]?.some(l => l.field === f.key))
                        .slice(0, 3).map(f => (
                        <div key={f.key} style={{
                          width: 6, height: 6, borderRadius: "50%", background: f.color,
                        }} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* 하단 통계 */}
          <div style={{
            padding: "10px 12px", borderTop: "1px solid var(--border)",
            background: "#f1f5f9",
          }}>
            <p style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, margin: "0 0 4px" }}>분야별 상담 현황</p>
            {FIELDS.map(f => {
              const cnt = logs.filter(l => l.field === f.key).length;
              if (cnt === 0) return null;
              return (
                <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 10, color: f.color, fontWeight: 700, minWidth: 50 }}>
                    {f.emoji} {f.key}
                  </span>
                  <div style={{ flex: 1, height: 3, borderRadius: 999, background: "#e2e8f0", overflow: "hidden" }}>
                    <div style={{ height: "100%", background: f.color, width: `${Math.min(100, cnt * 8)}%` }} />
                  </div>
                  <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>{cnt}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 오른쪽: 학생 상세 ── */}
        <div style={{ overflowY: "auto", height: "calc(100vh - 200px)" }}>
          {!sel ? (
            // 선택 전 빈 상태
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
              <p style={{ fontSize: 36 }}>👈</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-subtle)" }}>왼쪽에서 학생을 선택하세요</p>
              <p style={{ fontSize: 12, color: "#cbd5e1" }}>총 {STUDENTS.length}명 · 상담 기록 {logs.length}건</p>
            </div>
          ) : (
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

              {/* 학생 헤더 */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexWrap: "wrap", gap: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: "var(--primary-light)", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 16, fontWeight: 900, color: "var(--primary)",
                  }}>
                    {sel.name.slice(-1)}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--text)", margin: 0 }}>{sel.name}</h2>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{sel.student_no}</span>
                      {selLogs.some(l => l.is_sensitive) && (
                        <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 999, background: "#fee2e2", color: "#991b1b", fontWeight: 700 }}>🔒 민감</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                      {selSub && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 999, background: "#eff6ff", color: "#2563eb", fontWeight: 700 }}>📋 설문완료</span>}
                      {selLogs.length > 0 && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 999, background: "#fdf4ff", color: "#9333ea", fontWeight: 700 }}>상담 {selLogs.length}회</span>}
                      {selAi && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 999, background: "#f0fdf4", color: "#16a34a", fontWeight: 700 }}>🤖 AI분석</span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setShowForm(true); setEditLog(null); setTab("log"); }}
                  className="hy-btn hy-btn-primary"
                  style={{ fontSize: 12, padding: "8px 16px" }}>
                  ✏️ 상담 기록 추가
                </button>
              </div>

              {/* 탭 */}
              <div style={{
                display: "flex", background: "#f3f4f6", borderRadius: 12,
                padding: 4, gap: 2, overflowX: "auto",
              }}>
                {TABS.map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    style={{
                      flex: "0 0 auto", padding: "8px 14px", borderRadius: 8,
                      border: "none", cursor: "pointer", fontFamily: "inherit",
                      background: tab === t.key ? "#fff" : "transparent",
                      boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                      fontSize: 12, fontWeight: 800,
                      color: tab === t.key ? "var(--primary)" : "var(--text-muted)",
                    }}>
                    {t.label}
                    {t.key === "log" && selLogs.length > 0 && (
                      <span style={{
                        marginLeft: 4, fontSize: 10, padding: "1px 5px", borderRadius: 999,
                        background: "var(--primary-light)", color: "var(--primary)", fontWeight: 800,
                      }}>{selLogs.length}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* 상담 기록 추가 폼 */}
              {showForm && tab === "log" && (
                <CounselingForm
                  studentNo={sel.student_no} name={sel.name}
                  editing={editLog}
                  onSaved={async () => { setShowForm(false); setEditLog(null); await loadAll(); }}
                  onCancel={() => { setShowForm(false); setEditLog(null); }}
                />
              )}

              {/* ── 탭: 한눈에 ── */}
              {tab === "overview" && (() => {
                // 프로필 데이터 계산
                const hrRec      = hrRecords.find(r => r.student_no === sel.student_no);
                const yajadays   = hrRec?.days ?? [];
                const selContact = contacts.find(c => c.student_no === sel.student_no);
                const selRoles   = roleRecords.filter(r => r.name === sel.name);
                const selResearch= researchGroups.find(g =>
                  g.members?.split(/[,，、\s]+/).map((s:string)=>s.trim()).some((m:string) => m.includes(sel.name) || sel.name.includes(m))
                );
                // 멘토링: mentor_resources의 각 row에서 이름 포함 여부 확인
                const selMentor  = mentorData.filter(m => {
                  const vals = Object.values(m).join(" ");
                  return vals.includes(sel.name);
                });

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                    {/* ── 섹션 1: 학급 활동 정보 (한눈에) ── */}
                    <div style={{ padding: "16px 18px", borderRadius: 14, background: "linear-gradient(135deg,#f8f7ff,#eff6ff)", border: "1.5px solid #e0d9ff" }}>
                      <p style={{ fontSize: 12, fontWeight: 800, color: "#5b21b6", margin: "0 0 12px" }}>
                        🏫 학급 활동 한눈에
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 8 }}>

                        {/* 야자 요일 */}
                        <div style={{ padding: "12px 14px", borderRadius: 10, background: "#fff", border: "1px solid #e0d9ff" }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", margin: "0 0 6px" }}>🌙 야자 요일</p>
                          {yajadays.length > 0 ? (
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {yajadays.map((d:string) => (
                                <span key={d} style={{
                                  fontSize: 12, fontWeight: 800, padding: "3px 9px", borderRadius: 999,
                                  background: "#ede9fe", color: "#7c3aed",
                                }}>{d}</span>
                              ))}
                            </div>
                          ) : (
                            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>정보 없음</p>
                          )}
                        </div>

                        {/* 학급 역할 */}
                        <div style={{ padding: "12px 14px", borderRadius: 10, background: "#fff", border: "1px solid #bfdbfe" }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: "#2563eb", margin: "0 0 6px" }}>🎖 학급 역할</p>
                          {selRoles.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              {selRoles.map((r, i) => (
                                <div key={i}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb" }}>{r.role_name}</span>
                                  {r.dept && <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 5 }}>{r.dept}</span>}
                                  {r.duties && <p style={{ fontSize: 10, color: "#64748b", margin: "2px 0 0", lineHeight: 1.4 }}>{r.duties}</p>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>정보 없음</p>
                          )}
                        </div>

                        {/* 심화탐구 조 */}
                        <div style={{ padding: "12px 14px", borderRadius: 10, background: "#fff", border: "1px solid #bbf7d0" }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", margin: "0 0 6px" }}>🔬 심화탐구</p>
                          {selResearch ? (
                            <div>
                              <p style={{ fontSize: 12, fontWeight: 800, color: "#16a34a", margin: "0 0 2px" }}>{selResearch.name}</p>
                              <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 4px" }}>{selResearch.topic}</p>
                              <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>
                                {selResearch.members?.split(/[,，、]+/).map((m:string)=>m.trim()).join(" · ")}
                              </p>
                            </div>
                          ) : (
                            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>정보 없음</p>
                          )}
                        </div>

                        {/* 멘토링 */}
                        <div style={{ padding: "12px 14px", borderRadius: 10, background: "#fff", border: "1px solid #fed7aa" }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: "#ea580c", margin: "0 0 6px" }}>🤝 멘토링</p>
                          {selMentor.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              {selMentor.map((m: any, i: number) => (
                                <div key={i}>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: "#ea580c" }}>
                                    {m.subject ?? m.name ?? "멘토"}
                                  </span>
                                  {m.role && <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 4 }}>{m.role}</span>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>정보 없음</p>
                          )}
                        </div>

                        {/* 생일 */}
                        <div style={{ padding: "12px 14px", borderRadius: 10, background: "#fff", border: "1px solid #fecdd3" }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: "#e11d48", margin: "0 0 6px" }}>🎂 생일</p>
                          {selContact?.birthday ? (
                            <p style={{ fontSize: 13, fontWeight: 800, color: "#e11d48", margin: 0 }}>{selContact.birthday}</p>
                          ) : (
                            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>정보 없음</p>
                          )}
                          {selContact?.student_phone && (
                            <p style={{ fontSize: 10, color: "#94a3b8", margin: "4px 0 0" }}>
                              📱 {selContact.student_phone}
                            </p>
                          )}
                        </div>

                        {/* MBTI */}
                        <div style={{ padding: "12px 14px", borderRadius: 10, background: "#fff", border: "1px solid var(--border)" }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 6px" }}>🧠 MBTI</p>
                          <p style={{ fontSize: 16, fontWeight: 900, color: "var(--primary)", margin: "0 0 2px" }}>
                            {selSub?.payload.mbti || selWall?.mbti || "-"}
                          </p>
                          {selSub?.payload.dream && (
                            <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>🎯 {selSub.payload.dream}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ── 섹션 2: 2단 — 선생님께 한 말 + 장단점 ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {(selSub?.payload.messageToTeacher || selSub?.payload.teacherShouldKnow) && (
                        <div style={{ padding: "14px 16px", borderRadius: 12, background: "#fdf4ff", border: "1.5px solid #e9d5ff", borderLeft: "4px solid var(--primary)" }}>
                          <p style={{ fontSize: 11, fontWeight: 800, color: "var(--primary)", margin: "0 0 7px" }}>💬 선생님께 한 말</p>
                          {selSub?.payload.messageToTeacher && (
                            <p style={{ fontSize: 12, color: "var(--text)", margin: "0 0 4px", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{selSub.payload.messageToTeacher}</p>
                          )}
                          {selSub?.payload.teacherShouldKnow && (
                            <p style={{ fontSize: 12, color: "var(--text)", margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{selSub.payload.teacherShouldKnow}</p>
                          )}
                        </div>
                      )}
                      {(selSub?.payload.strengths || selSub?.payload.weaknesses) && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {selSub?.payload.strengths && (
                            <div style={{ padding: "11px 14px", borderRadius: 10, background: "#f0fdf4", borderLeft: "3px solid #16a34a", flex: 1 }}>
                              <p style={{ fontSize: 10, fontWeight: 800, color: "#15803d", margin: "0 0 4px" }}>💪 장점</p>
                              <p style={{ fontSize: 12, color: "var(--text)", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{selSub.payload.strengths}</p>
                            </div>
                          )}
                          {selSub?.payload.weaknesses && (
                            <div style={{ padding: "11px 14px", borderRadius: 10, background: "#fff7ed", borderLeft: "3px solid #f97316", flex: 1 }}>
                              <p style={{ fontSize: 10, fontWeight: 800, color: "#c2410c", margin: "0 0 4px" }}>🌱 단점/고칠 점</p>
                              <p style={{ fontSize: 12, color: "var(--text)", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{selSub.payload.weaknesses}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ── 섹션 3: 최근 상담 ── */}
                    {selLogs.length > 0 && (
                      <div style={{ padding: "14px 16px", borderRadius: 12, background: "#f8fafc", border: "1px solid var(--border)" }}>
                        <p style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", margin: "0 0 10px" }}>
                          최근 상담 기록
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {selLogs.slice(0, 3).map(log => {
                            const f = FIELDS.find(f => f.key === log.field);
                            return (
                              <div key={log.id} style={{
                                display: "flex", gap: 10, alignItems: "flex-start",
                                padding: "8px 10px", borderRadius: 8, background: f?.bg ?? "#fff",
                              }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: f?.color, minWidth: 50, flexShrink: 0 }}>
                                  {f?.emoji} {log.field}
                                </span>
                                <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 50, flexShrink: 0 }}>
                                  {fmtDate(log.date)}
                                </span>
                                {log.is_sensitive ? (
                                  <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700 }}>🔒 민감 기록</span>
                                ) : (
                                  <span style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5,
                                    overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" as any }}>
                                    {log.content}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {selLogs.length > 3 && (
                          <button onClick={() => setTab("log")}
                            style={{ marginTop: 8, fontSize: 11, color: "var(--primary)", background: "none",
                              border: "none", cursor: "pointer", fontWeight: 700, padding: 0 }}>
                            전체 {selLogs.length}건 보기 →
                          </button>
                        )}
                      </div>
                    )}

                    {/* ── 섹션 4: AI 요약 ── */}
                    {selAi && (
                      <div style={{ padding: "14px 16px", borderRadius: 12, background: "#f8f7ff", border: "1.5px solid #e0d9ff" }}>
                        <p style={{ fontSize: 11, fontWeight: 800, color: "#5b21b6", margin: "0 0 8px" }}>🤖 AI 생기부 요약</p>
                        <p style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap" }}>{selAi.summary}</p>
                      </div>
                    )}

                    {/* ── 섹션 5: 교사 메모 (빠른 편집) ── */}
                    <div style={{ padding: "14px 16px", borderRadius: 12, background: "#fff", border: "1px solid var(--border)" }}>
                      <p style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", margin: "0 0 8px" }}>📌 교사 메모</p>
                      <textarea
                        placeholder="첫인상, 특이사항, 기억해 둘 것..."
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        className="hy-input"
                        style={{ minHeight: 70, resize: "vertical", fontSize: 12, lineHeight: 1.6 }}
                      />
                      <button onClick={saveNote} disabled={noteSaving}
                        className="hy-btn hy-btn-primary" style={{ marginTop: 7, fontSize: 11 }}>
                        {noteSaving ? "저장 중..." : "저장"}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* ── 탭: 설문 ── */}
              {tab === "survey" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {!selSub && !selWall ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--text-subtle)", fontSize: 13, fontWeight: 600 }}>
                      아직 설문/자기소개 데이터가 없어요
                    </div>
                  ) : (
                    <>
                      {selSub && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                          {[
                            { section: "👤 기본 정보", items: [
                              { l: "MBTI",       v: selSub.payload.mbti },
                              { l: "친한 친구",  v: selSub.payload.closeFriends },
                              { l: "취미/관심",  v: selSub.payload.hobby },
                              { l: "학부모 연락", v: selSub.payload.parentContact },
                            ]},
                            { section: "📚 학습", items: [
                              { l: "좋아하는 과목",  v: selSub.payload.likeSubject },
                              { l: "이유",           v: selSub.payload.likeReason },
                              { l: "싫어하는 과목",  v: selSub.payload.dislikeSubject },
                              { l: "이유",           v: selSub.payload.dislikeReason },
                              { l: "발표 스타일",    v: selSub.payload.presentationStyle },
                              { l: "모를 때",        v: selSub.payload.learningHelpStyle },
                            ]},
                            { section: "🏠 가정/관계", items: [
                              { l: "부모님 스타일",  v: selSub.payload.parentsStyle },
                              { l: "부모님은",       v: selSub.payload.parentsMeaning },
                              { l: "고민 의논 대상", v: selSub.payload.talkWith },
                            ]},
                            { section: "🌱 자아/진로", items: [
                              { l: "장점",           v: selSub.payload.strengths },
                              { l: "단점",           v: selSub.payload.weaknesses },
                              { l: "형용사",         v: selSub.payload.adjectives },
                              { l: "되고 싶은 사람", v: selSub.payload.wantToBe },
                              { l: "진로/꿈",        v: selSub.payload.dream },
                              { l: "고치고 싶은 것", v: selSub.payload.habitToFix },
                            ]},
                            { section: "💬 선생님께", items: [
                              { l: "드리고 싶은 말",     v: selSub.payload.messageToTeacher },
                              { l: "알아줬으면 하는 것", v: selSub.payload.teacherShouldKnow },
                              { l: "원하는 학급 활동",   v: selSub.payload.wantClassActivity },
                            ]},
                          ].map(section => (
                            <div key={section.section} style={{ marginBottom: 14 }}>
                              <p style={{ fontSize: 12, fontWeight: 900, color: "var(--primary)", margin: "0 0 6px" }}>{section.section}</p>
                              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                                {section.items.filter(i => i.v?.trim()).map((item, idx) => (
                                  <div key={item.l + idx} style={{
                                    display: "grid", gridTemplateColumns: "110px 1fr", gap: 8,
                                    padding: "9px 14px", borderBottom: "1px solid #f3f4f6",
                                  }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", margin: 0 }}>{item.l}</p>
                                    <p style={{ fontSize: 13, color: "var(--text)", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{item.v}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {selWall && (
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 900, color: "var(--primary)", margin: "0 0 6px" }}>🌸 자기소개 담벼락</p>
                          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                            {[
                              { l: "MBTI",          v: selWall.mbti },
                              { l: "좋아하는 것",   v: selWall.like },
                              { l: "싫어하는 것",   v: selWall.dislike },
                              { l: "올해 목표",     v: selWall.goal },
                              { l: "선생님께",      v: selWall.message },
                            ].filter(i => i.v?.trim()).map(item => (
                              <div key={item.l} style={{
                                display: "grid", gridTemplateColumns: "110px 1fr", gap: 8,
                                padding: "9px 14px", borderBottom: "1px solid #f3f4f6",
                              }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", margin: 0 }}>{item.l}</p>
                                <p style={{ fontSize: 13, color: "var(--text)", margin: 0, lineHeight: 1.6 }}>{item.v}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── 탭: 상담 기록 (전체 타임라인) ── */}
              {tab === "log" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {!showForm && (
                    <button
                      onClick={() => { setShowForm(true); setEditLog(null); }}
                      style={{
                        padding: "12px", borderRadius: 12, border: "2px dashed var(--border)",
                        background: "transparent", fontSize: 13, fontWeight: 700,
                        color: "var(--text-muted)", cursor: "pointer", fontFamily: "inherit",
                      }}>
                      ＋ 상담 기록 추가하기
                    </button>
                  )}
                  {selLogs.length === 0 && !showForm ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--text-subtle)", fontSize: 13 }}>
                      아직 상담 기록이 없어요
                    </div>
                  ) : (
                    selLogs.map(log => {
                      const f = FIELDS.find(f => f.key === log.field);
                      return (
                        <div key={log.id} style={{
                          padding: "14px 16px", borderRadius: 12,
                          background: log.is_sensitive ? "#fff8f8" : f?.bg ?? "#f9fafb",
                          border: `1.5px solid ${log.is_sensitive ? "#fecaca" : (f?.color ?? "#e2e8f0") + "44"}`,
                          borderLeft: `4px solid ${f?.color ?? "#94a3b8"}`,
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{
                                fontSize: 11, padding: "2px 9px", borderRadius: 999,
                                background: (f?.color ?? "#94a3b8") + "22",
                                color: f?.color ?? "#64748b", fontWeight: 800,
                              }}>
                                {f?.emoji} {log.field}
                              </span>
                              {log.is_sensitive && <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 800 }}>🔒</span>}
                              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmtDate(log.date)}</span>
                            </div>
                            <div style={{ display: "flex", gap: 4 }}>
                              <button
                                onClick={() => { setEditLog(log); setShowForm(true); }}
                                style={{ fontSize: 11, padding: "3px 9px", borderRadius: 999,
                                  border: "1px solid var(--border)", background: "#fff",
                                  cursor: "pointer", fontFamily: "inherit", fontWeight: 700, color: "var(--text-muted)" }}>
                                수정
                              </button>
                              <button
                                onClick={() => deleteLog(log.id)}
                                style={{ fontSize: 11, padding: "3px 9px", borderRadius: 999,
                                  border: "1px solid #fecaca", background: "#fff5f5",
                                  cursor: "pointer", fontFamily: "inherit", fontWeight: 700, color: "#ef4444" }}>
                                삭제
                              </button>
                            </div>
                          </div>
                          {log.is_sensitive ? (
                            <p style={{ fontSize: 12, color: "#ef4444", fontWeight: 700, margin: 0 }}>🔒 민감 기록 — 클릭하여 수정에서 확인</p>
                          ) : (
                            <>
                              <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.8, margin: "0 0 6px", whiteSpace: "pre-wrap" }}>
                                {log.content}
                              </p>
                              {log.followup && (
                                <div style={{ padding: "8px 10px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", marginTop: 6 }}>
                                  <p style={{ fontSize: 10, fontWeight: 800, color: "#15803d", margin: "0 0 2px" }}>📌 후속 조치</p>
                                  <p style={{ fontSize: 12, color: "#166534", margin: 0, whiteSpace: "pre-wrap" }}>{log.followup}</p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ── 탭: 분야별 누적 (좌우 2단) ── */}
              {tab === "field" && (() => {
                const currentField = FIELDS.find(f => f.key === fieldTab)!;
                const fieldLogs = selLogs
                  .filter(l => l.field === fieldTab)
                  .sort((a, b) => a.date.localeCompare(b.date));

                // 분야별 설문 참고 항목 매핑
                const fieldSurveyItems: Record<string, { l: string; v: string }[]> = {
                  학업: selSub ? [
                    { l: "좋아하는 과목", v: selSub.payload.likeSubject },
                    { l: "이유",         v: selSub.payload.likeReason },
                    { l: "싫어하는 과목",v: selSub.payload.dislikeSubject },
                    { l: "이유",         v: selSub.payload.dislikeReason },
                    { l: "발표 스타일",  v: selSub.payload.presentationStyle },
                    { l: "모를 때",      v: selSub.payload.learningHelpStyle },
                    { l: "장점",         v: selSub.payload.strengths },
                    { l: "단점",         v: selSub.payload.weaknesses },
                  ].filter(i => i.v?.trim()) : [],
                  교우관계: selSub ? [
                    { l: "친한 친구",    v: selSub.payload.closeFriends },
                    { l: "고민 의논 대상",v: selSub.payload.talkWith },
                    { l: "취미/관심",   v: selSub.payload.hobby },
                    { l: "첫인상",       v: selSub.payload.firstImpression },
                  ].filter(i => i.v?.trim()) : [],
                  진로: selSub ? [
                    { l: "진로/꿈",      v: selSub.payload.dream },
                    { l: "되고 싶은 사람",v: selSub.payload.wantToBe },
                    { l: "형용사",       v: selSub.payload.adjectives },
                    { l: "고치고 싶은 것",v: selSub.payload.habitToFix },
                  ].filter(i => i.v?.trim()) : [],
                  가족: selSub ? [
                    { l: "부모님 스타일",v: selSub.payload.parentsStyle },
                    { l: "부모님은",     v: selSub.payload.parentsMeaning },
                    { l: "고민 의논 대상",v: selSub.payload.talkWith },
                    { l: "학부모 연락",  v: selSub.payload.parentContact },
                  ].filter(i => i.v?.trim()) : [],
                  정서: selSub ? [
                    { l: "장점",         v: selSub.payload.strengths },
                    { l: "단점",         v: selSub.payload.weaknesses },
                    { l: "고민 의논 대상",v: selSub.payload.talkWith },
                    { l: "선생님께",     v: selSub.payload.messageToTeacher },
                    { l: "알아줬으면",   v: selSub.payload.teacherShouldKnow },
                  ].filter(i => i.v?.trim()) : [],
                  기타: selSub ? [
                    { l: "MBTI",         v: selSub.payload.mbti },
                    { l: "취미/관심",   v: selSub.payload.hobby },
                    { l: "선생님께",     v: selSub.payload.messageToTeacher },
                  ].filter(i => i.v?.trim()) : [],
                };
                const surveyItems = fieldSurveyItems[fieldTab] ?? [];

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                    {/* 분야 탭 선택 */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {FIELDS.map(f => {
                        const cnt = selLogs.filter(l => l.field === f.key).length;
                        return (
                          <button key={f.key} onClick={() => setFieldTab(f.key)}
                            style={{
                              padding: "7px 14px", borderRadius: 999, border: "1.5px solid",
                              borderColor: fieldTab === f.key ? f.color : "var(--border)",
                              background: fieldTab === f.key ? f.bg : "#fff",
                              color: fieldTab === f.key ? f.color : "var(--text-muted)",
                              fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                            }}>
                            {f.emoji} {f.key}
                            {cnt > 0 && (
                              <span style={{
                                marginLeft: 5, fontSize: 10, padding: "1px 5px", borderRadius: 999,
                                background: fieldTab === f.key ? f.color + "33" : "#f1f5f9",
                                color: fieldTab === f.key ? f.color : "#94a3b8",
                              }}>{cnt}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* 좌우 2단 */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>

                      {/* ── 왼쪽: 참고자료 (설문 + 이전 기록) ── */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                        {/* 설문 참고 */}
                        {surveyItems.length > 0 && (
                          <div style={{
                            borderRadius: 12, border: `1.5px solid ${currentField.color}33`,
                            overflow: "hidden",
                          }}>
                            <div style={{
                              padding: "10px 14px",
                              background: currentField.bg,
                              borderBottom: `1px solid ${currentField.color}22`,
                            }}>
                              <p style={{ fontSize: 11, fontWeight: 800, color: currentField.color, margin: 0 }}>
                                📋 학생 설문 참고
                              </p>
                            </div>
                            <div style={{ background: "#fff" }}>
                              {surveyItems.map((item, idx) => (
                                <div key={idx} style={{
                                  display: "grid", gridTemplateColumns: "90px 1fr", gap: 8,
                                  padding: "9px 14px",
                                  borderBottom: idx < surveyItems.length - 1 ? "1px solid #f3f4f6" : "none",
                                }}>
                                  <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", margin: 0, paddingTop: 1 }}>
                                    {item.l}
                                  </p>
                                  <p style={{ fontSize: 12, color: "var(--text)", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                                    {item.v}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 이전 상담 기록 타임라인 */}
                        {fieldLogs.length > 0 ? (
                          <div style={{
                            borderRadius: 12, border: `1.5px solid ${currentField.color}33`,
                            overflow: "hidden",
                          }}>
                            <div style={{
                              padding: "10px 14px",
                              background: currentField.bg,
                              borderBottom: `1px solid ${currentField.color}22`,
                              display: "flex", justifyContent: "space-between", alignItems: "center",
                            }}>
                              <p style={{ fontSize: 11, fontWeight: 800, color: currentField.color, margin: 0 }}>
                                🗂 이전 상담 기록 ({fieldLogs.length}회)
                              </p>
                            </div>
                            <div style={{ background: "#fff", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 0 }}>
                              {fieldLogs.map((log, idx) => (
                                <div key={log.id} style={{
                                  display: "flex", gap: 10,
                                  paddingBottom: idx < fieldLogs.length - 1 ? 14 : 0,
                                  marginBottom: idx < fieldLogs.length - 1 ? 14 : 0,
                                  borderBottom: idx < fieldLogs.length - 1 ? `1px solid ${currentField.color}18` : "none",
                                }}>
                                  {/* 타임라인 도트 */}
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 3 }}>
                                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: currentField.color }} />
                                    {idx < fieldLogs.length - 1 && (
                                      <div style={{ width: 1, flex: 1, background: currentField.color + "30", marginTop: 3 }} />
                                    )}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                                      <p style={{ fontSize: 10, fontWeight: 700, color: currentField.color, margin: 0 }}>
                                        {fmtDate(log.date)}
                                      </p>
                                      <div style={{ display: "flex", gap: 3 }}>
                                        <button
                                          onClick={() => { setEditLog(log); setShowForm(true); setTab("log"); }}
                                          style={{ fontSize: 9, padding: "2px 7px", borderRadius: 999,
                                            border: "1px solid var(--border)", background: "#fff",
                                            cursor: "pointer", fontFamily: "inherit", fontWeight: 700, color: "var(--text-muted)" }}>
                                          수정
                                        </button>
                                        <button
                                          onClick={() => deleteLog(log.id)}
                                          style={{ fontSize: 9, padding: "2px 7px", borderRadius: 999,
                                            border: "1px solid #fecaca", background: "#fff5f5",
                                            cursor: "pointer", fontFamily: "inherit", fontWeight: 700, color: "#ef4444" }}>
                                          삭제
                                        </button>
                                      </div>
                                    </div>
                                    {log.is_sensitive ? (
                                      <p style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, margin: 0 }}>🔒 민감 기록</p>
                                    ) : (
                                      <>
                                        <p style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
                                          {log.content}
                                        </p>
                                        {log.followup && (
                                          <div style={{ marginTop: 5, padding: "5px 9px", borderRadius: 6, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                                            <p style={{ fontSize: 10, color: "#166534", margin: 0 }}>📌 {log.followup}</p>
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          surveyItems.length === 0 && (
                            <div style={{
                              padding: "24px", textAlign: "center",
                              background: currentField.bg, borderRadius: 12,
                              border: `1.5px dashed ${currentField.color}44`,
                            }}>
                              <p style={{ fontSize: 18, margin: "0 0 6px" }}>{currentField.emoji}</p>
                              <p style={{ fontSize: 12, color: currentField.color, fontWeight: 700, margin: 0 }}>
                                참고 자료가 없어요
                              </p>
                            </div>
                          )
                        )}
                      </div>

                      {/* ── 오른쪽: 새 내용 추가 ── */}
                      <div style={{
                        position: "sticky", top: 16,
                        borderRadius: 12, border: `1.5px solid ${currentField.color}55`,
                        background: currentField.bg, overflow: "hidden",
                      }}>
                        <div style={{
                          padding: "12px 16px",
                          background: currentField.color + "18",
                          borderBottom: `1px solid ${currentField.color}33`,
                        }}>
                          <p style={{ fontSize: 12, fontWeight: 800, color: currentField.color, margin: 0 }}>
                            {currentField.emoji} {fieldTab} 내용 추가
                          </p>
                          <p style={{ fontSize: 10, color: currentField.color + "aa", margin: "2px 0 0" }}>
                            왼쪽 자료를 참고하며 내용을 덧붙여요
                          </p>
                        </div>
                        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, background: "#fff" }}>
                          {/* 날짜 */}
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                              날짜
                            </label>
                            <input
                              type="date"
                              id={`field-date-${fieldTab}`}
                              defaultValue={toKSTDate()}
                              className="hy-input"
                              style={{ fontSize: 12 }}
                            />
                          </div>
                          {/* 내용 */}
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 700, color: currentField.color, display: "block", marginBottom: 4 }}>
                              상담 내용
                            </label>
                            <textarea
                              id={`field-content-${fieldTab}`}
                              placeholder={
                                fieldTab === "학업" ? "수업 태도, 공부 방법, 성적 관련 이야기..." :
                                fieldTab === "교우관계" ? "친구 관계, 갈등, 교우 상황..." :
                                fieldTab === "진로" ? "희망 진로, 관심사, 진로 고민..." :
                                fieldTab === "가족" ? "가족 상황, 가정환경, 부모님 관련..." :
                                fieldTab === "정서" ? "감정 상태, 스트레스, 심리적 상황..." :
                                "기타 상담 내용..."
                              }
                              className="hy-input"
                              style={{
                                minHeight: 140, resize: "vertical", fontSize: 12, lineHeight: 1.7,
                                borderColor: currentField.color + "55",
                              }}
                            />
                          </div>
                          {/* 후속 조치 */}
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                              후속 조치 (선택)
                            </label>
                            <textarea
                              id={`field-followup-${fieldTab}`}
                              placeholder="다음에 확인할 것, 연락할 사항..."
                              className="hy-input"
                              style={{ minHeight: 60, resize: "vertical", fontSize: 12 }}
                            />
                          </div>
                          {/* 민감 여부 */}
                          <label style={{
                            display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
                            padding: "7px 10px", borderRadius: 8,
                            background: "#f9fafb", border: "1px solid var(--border)",
                          }}>
                            <input
                              type="checkbox"
                              id={`field-sensitive-${fieldTab}`}
                              style={{ width: 13, height: 13, accentColor: "#e11d48", cursor: "pointer" }}
                            />
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>
                              🔒 민감 기록
                            </span>
                          </label>
                          {/* 저장 버튼 */}
                          <button
                            onClick={async () => {
                              const dateEl    = document.getElementById(`field-date-${fieldTab}`) as HTMLInputElement;
                              const contentEl = document.getElementById(`field-content-${fieldTab}`) as HTMLTextAreaElement;
                              const followupEl= document.getElementById(`field-followup-${fieldTab}`) as HTMLTextAreaElement;
                              const sensitiveEl= document.getElementById(`field-sensitive-${fieldTab}`) as HTMLInputElement;
                              const content = contentEl?.value?.trim();
                              if (!content) { alert("내용을 입력해주세요"); return; }
                              await supabase.from("counseling_logs").insert({
                                student_no: sel.student_no, name: sel.name,
                                date: dateEl?.value ?? toKSTDate(),
                                field: fieldTab,
                                content,
                                followup: followupEl?.value?.trim() || null,
                                is_sensitive: sensitiveEl?.checked ?? false,
                                updated_at: new Date().toISOString(),
                              });
                              contentEl.value = "";
                              followupEl.value = "";
                              if (sensitiveEl) sensitiveEl.checked = false;
                              await loadAll();
                            }}
                            style={{
                              width: "100%", padding: "11px", borderRadius: 10,
                              border: "none", cursor: "pointer", fontFamily: "inherit",
                              background: currentField.color, color: "#fff",
                              fontSize: 13, fontWeight: 800, transition: "opacity 0.15s",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                          >
                            💾 {fieldTab} 기록 저장
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── 탭: 메모 + AI ── */}
              {tab === "memo" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* 교사 메모 */}
                  <div style={{ padding: "16px 18px", background: "#fff", border: "1px solid var(--border)", borderRadius: 12 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>📌 교사 메모</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 10px" }}>
                      첫인상, 특이사항, 기억해 둘 것 등 자유롭게 기록
                    </p>
                    <textarea
                      placeholder="이 학생에 대해 기억해두고 싶은 것들..."
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      className="hy-input"
                      style={{ minHeight: 120, resize: "vertical", fontSize: 13, lineHeight: 1.7 }}
                    />
                    <button onClick={saveNote} disabled={noteSaving}
                      className="hy-btn hy-btn-primary" style={{ marginTop: 8, fontSize: 12 }}>
                      {noteSaving ? "저장 중..." : "저장"}
                    </button>
                  </div>

                  {/* AI 생기부 분석 */}
                  <div style={{ padding: "16px 18px", background: "#f8f7ff", border: "1.5px solid #e0d9ff", borderRadius: 12 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#5b21b6", margin: "0 0 4px" }}>🤖 생기부 AI 분석</p>
                    <p style={{ fontSize: 11, color: "#7c3aed", margin: "0 0 12px" }}>PDF 업로드하면 항목별로 요약해줘요</p>
                    <input ref={fileRef} type="file" accept=".pdf"
                      onChange={e => setAiFile(e.target.files?.[0] ?? null)} style={{ display: "none" }} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => fileRef.current?.click()}
                        style={{
                          flex: 1, padding: "10px", borderRadius: 10,
                          border: "2px dashed #c4b5fd", background: "#fff",
                          cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: "#7c3aed",
                        }}>
                        {aiFile ? `📄 ${aiFile.name}` : "📁 생기부 PDF 선택"}
                      </button>
                      <button onClick={runAI} disabled={aiLoading || !aiFile}
                        className="hy-btn hy-btn-primary"
                        style={{ fontSize: 12, opacity: !aiFile ? 0.5 : 1, flexShrink: 0 }}>
                        {aiLoading ? "분석 중..." : "분석하기"}
                      </button>
                    </div>
                    {(aiResult || selAi) && (
                      <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 10, background: "#fff" }}>
                        <p style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap" }}>
                          {aiResult || selAi?.summary}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
