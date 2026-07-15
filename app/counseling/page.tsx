"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type Slot = { id: string; date: string; time: string; is_available: boolean; };
type Application = { id: string; slot_id: string; student_no: string; name: string; reason: string | null; is_private: boolean; is_confirmed: boolean; created_at: string; };
type WalkIn = { id: string; created_at: string; student_no: string; name: string; content: string; preferred_time: string | null; is_private: boolean; is_checked: boolean; };

type PrepSurvey = {
  student_no: string; name: string; created_at: string;
  feeling: string | null; effort_score: number | null;
  hardest_subject: string | null; least_effort_subject: string | null;
  proud: string | null; regret: string | null; subject_balance: string | null;
  subject_korean: string | null; subject_math: string | null; subject_english: string | null;
  subject_gukje: string | null; subject_culture: string | null;
  improve_method: string | null; improve_habit: string | null;
  vacation_plan: string | null; psych_state: string | null;
  emotional_concern: string | null; record_concern: string | null;
};

type PrepFormState = {
  feeling: string; effort_score: string; hardest_subject: string; least_effort_subject: string;
  proud: string; regret: string; subject_balance: string;
  subject_korean: string; subject_math: string; subject_english: string;
  subject_gukje: string; subject_culture: string;
  improve_method: string; improve_habit: string;
  vacation_plan: string; psych_state: string; emotional_concern: string; record_concern: string;
};

const EMPTY_PREP_FORM: PrepFormState = {
  feeling: "", effort_score: "", hardest_subject: "", least_effort_subject: "",
  proud: "", regret: "", subject_balance: "",
  subject_korean: "", subject_math: "", subject_english: "",
  subject_gukje: "", subject_culture: "",
  improve_method: "", improve_habit: "",
  vacation_plan: "", psych_state: "", emotional_concern: "", record_concern: "",
};

const PREP_SUBJECTS: { key: keyof PrepFormState; label: string }[] = [
  { key: "subject_korean",  label: "국어" },
  { key: "subject_math",    label: "수학" },
  { key: "subject_english", label: "영어" },
  { key: "subject_gukje",   label: "국제" },
  { key: "subject_culture", label: "사회와 문화" },
];

const ADMIN_PW = "hyfl2025";

function fmtDate(d: string) {
  const dt = new Date(`${d}T00:00:00+09:00`);
  const days = ["일","월","화","수","목","금","토"];
  return `${dt.getMonth()+1}월 ${dt.getDate()}일 (${days[dt.getDay()]})`;
}
function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff/60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff/3600)}시간 전`;
  const d = new Date(iso); return `${d.getMonth()+1}월 ${d.getDate()}일`;
}

function PrepField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:6 }}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} className="hy-input" style={{ minHeight:60, resize:"vertical", width:"100%" }}/>
    </div>
  );
}

function PrepRow({ label, value }: { label: string; value: string | number | null }) {
  if (value === null || value === "" || value === undefined) return null;
  return (
    <div style={{ padding:"8px 0", borderBottom:"1px solid #f3f4f6" }}>
      <p style={{ fontSize:11, fontWeight:800, color:"#7c3aed", margin:"0 0 3px" }}>{label}</p>
      <p style={{ fontSize:13, color:"var(--text)", margin:0, whiteSpace:"pre-wrap", lineHeight:1.6 }}>{value}</p>
    </div>
  );
}

function PrepSurveyView({ prep }: { prep: PrepSurvey }) {
  return (
    <div style={{ padding:"14px 16px", borderRadius:12, background:"#faf5ff", border:"1.5px solid #e9d5ff" }}>
      <PrepRow label="1. 기말고사 직후 느낌/감정" value={prep.feeling} />
      <PrepRow label="2. 최선을 다한 정도" value={prep.effort_score !== null ? `${prep.effort_score}점` : null} />
      <PrepRow label="3. 가장 열심히 준비한 과목" value={prep.hardest_subject} />
      <PrepRow label="4. 가장 노력이 적었던 과목" value={prep.least_effort_subject} />
      <PrepRow label="5. 자랑하고 싶은 것" value={prep.proud} />
      <PrepRow label="6. 아쉬운 점 / 후회" value={prep.regret} />
      <PrepRow label="7. 과목별 밸런스" value={prep.subject_balance} />
      <PrepRow label="8. 국어" value={prep.subject_korean} />
      <PrepRow label="8. 수학" value={prep.subject_math} />
      <PrepRow label="8. 영어" value={prep.subject_english} />
      <PrepRow label="8. 국제" value={prep.subject_gukje} />
      <PrepRow label="8. 사회와 문화" value={prep.subject_culture} />
      <PrepRow label="9. 보완할 점 - 학습 방법" value={prep.improve_method} />
      <PrepRow label="9. 보완할 점 - 생활 습관/노력의 정도" value={prep.improve_habit} />
      <PrepRow label="10. 여름방학 계획" value={prep.vacation_plan} />
      <PrepRow label="11. 현재 심리 상태" value={prep.psych_state} />
      <PrepRow label="12. 정서/심리 고민" value={prep.emotional_concern} />
      <PrepRow label="13. 생기부 관련 고민" value={prep.record_concern} />
    </div>
  );
}

export default function CounselingPage() {
  const [tab, setTab] = useState<"formal"|"walkin">("formal");

  const [slots,        setSlots]        = useState<Slot[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [walkIns,      setWalkIns]      = useState<WalkIn[]>([]);

  // 1학기 마무리 설문 (상담 신청 전 필수)
  const [gateNo,          setGateNo]          = useState("");
  const [gateName,        setGateName]        = useState("");
  const [gateNameLoading, setGateNameLoading] = useState(false);
  const [gateChecking,    setGateChecking]    = useState(false);
  const [gateStatus,      setGateStatus]      = useState<"idle"|"checked-missing"|"checked-exists">("idle");
  const [prepForm,        setPrepForm]        = useState<PrepFormState>(EMPTY_PREP_FORM);
  const [prepSubmitting,  setPrepSubmitting]  = useState(false);

  // 관리자: 학생별 사전 설문 열람
  const [prepCache,    setPrepCache]    = useState<Record<string, PrepSurvey | "none">>({});
  const [expandedPrep, setExpandedPrep] = useState<Record<string, boolean>>({});

  // 정식 상담 신청
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [sNo,          setSNo]          = useState("");
  const [sName,        setSName]        = useState("");
  const [sNameLoading, setSNameLoading] = useState(false);
  const [sReason,      setSReason]      = useState("");
  const [sPrivate,     setSPrivate]     = useState(false);
  const [submitting,   setSubmitting]   = useState(false);

  // 내 신청 확인 + 취소
  const [checkNo,    setCheckNo]    = useState("");
  const [checkName,  setCheckName]  = useState("");
  const [checkLoading,setCheckLoading] = useState(false);
  const [myApp,      setMyApp]      = useState<Application | null | "none">(null);
  const [cancelling, setCancelling] = useState(false);

  // 수시 상담
  const [wNo,         setWNo]         = useState("");
  const [wName,       setWName]       = useState("");
  const [wNameLoading,setWNameLoading]= useState(false);
  const [wContent,    setWContent]    = useState("");
  const [wPreferred,  setWPreferred]  = useState("");
  const [wPrivate,    setWPrivate]    = useState(false);
  const [wSubmitting, setWSubmitting] = useState(false);
  const [wDone,       setWDone]       = useState(false);

  // 관리자
  const [pw,        setPw]        = useState("");
  const [isAdmin,   setIsAdmin]   = useState(false);
  const [fDate,     setFDate]     = useState("");
  const [fTime,     setFTime]     = useState("");
  const [addLoading,setAddLoading]= useState(false);

  async function load() {
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
    const { data: sd } = await supabase.from("counseling_slots").select("*").gte("date", today).order("date").order("time");
    const { data: ad } = await supabase.from("counseling_applications").select("*").order("created_at");
    const { data: wd } = await supabase.from("counseling_walkins").select("*").order("created_at", { ascending: false });
    setSlots((sd as Slot[]) ?? []);
    setApplications((ad as Application[]) ?? []);
    setWalkIns((wd as WalkIn[]) ?? []);
  }

  useEffect(() => { load(); }, []);

  // 학번으로 이름 자동 조회
  async function lookupName(no: string, setName: (n: string) => void, setLoading: (b: boolean) => void) {
    if (no.trim().length < 5) return;
    setLoading(true);
    const { data } = await supabase.from("student_contacts").select("name").eq("student_no", no.trim()).maybeSingle();
    if (data?.name) setName(data.name);
    setLoading(false);
  }

  // 사전 설문 제출 여부 확인
  async function checkGate() {
    if (!gateNo.trim()) return;
    setGateChecking(true);
    let name = gateName.trim();
    if (!name) {
      const { data } = await supabase.from("student_contacts").select("name").eq("student_no", gateNo.trim()).maybeSingle();
      if (data?.name) { name = data.name; setGateName(data.name); }
    }
    const { data: prep } = await supabase.from("counseling_prep_surveys").select("*").eq("student_no", gateNo.trim()).maybeSingle();
    setGateChecking(false);
    if (prep) {
      setGateStatus("checked-exists");
      setSNo(gateNo.trim()); setSName(name);
    } else {
      setGateStatus("checked-missing");
    }
  }

  // 사전 설문 제출
  async function submitPrep() {
    if (!gateNo.trim() || !gateName.trim()) { alert("학번을 다시 확인해주세요."); return; }
    setPrepSubmitting(true);
    const { error } = await supabase.from("counseling_prep_surveys").insert({
      student_no: gateNo.trim(), name: gateName.trim(),
      feeling: prepForm.feeling.trim() || null,
      effort_score: prepForm.effort_score.trim() ? Number(prepForm.effort_score) : null,
      hardest_subject: prepForm.hardest_subject.trim() || null,
      least_effort_subject: prepForm.least_effort_subject.trim() || null,
      proud: prepForm.proud.trim() || null,
      regret: prepForm.regret.trim() || null,
      subject_balance: prepForm.subject_balance.trim() || null,
      subject_korean: prepForm.subject_korean.trim() || null,
      subject_math: prepForm.subject_math.trim() || null,
      subject_english: prepForm.subject_english.trim() || null,
      subject_gukje: prepForm.subject_gukje.trim() || null,
      subject_culture: prepForm.subject_culture.trim() || null,
      improve_method: prepForm.improve_method.trim() || null,
      improve_habit: prepForm.improve_habit.trim() || null,
      vacation_plan: prepForm.vacation_plan.trim() || null,
      psych_state: prepForm.psych_state.trim() || null,
      emotional_concern: prepForm.emotional_concern.trim() || null,
      record_concern: prepForm.record_concern.trim() || null,
    });
    setPrepSubmitting(false);
    if (error) { alert("설문 제출 실패: " + error.message); return; }
    setSNo(gateNo.trim()); setSName(gateName.trim());
    setGateStatus("checked-exists");
    setPrepForm(EMPTY_PREP_FORM);
    alert("설문 제출 완료! 이제 상담 시간을 선택할 수 있어요 🙂");
  }

  // 관리자: 학생 사전 설문 열람/접기
  async function togglePrepView(appId: string, studentNo: string) {
    setExpandedPrep(prev => ({ ...prev, [appId]: !prev[appId] }));
    if (prepCache[studentNo] !== undefined) return;
    const { data } = await supabase.from("counseling_prep_surveys").select("*").eq("student_no", studentNo).maybeSingle();
    setPrepCache(prev => ({ ...prev, [studentNo]: (data as PrepSurvey) ?? "none" }));
  }

  // 정식 상담 신청
  async function submitFormal() {
    if (!selectedSlot || !sNo.trim() || !sName.trim()) return;
    setSubmitting(true);
    const { data: freshSlot } = await supabase.from("counseling_slots").select("is_available").eq("id", selectedSlot.id).single();
    if (!freshSlot?.is_available) {
      setSubmitting(false);
      alert("방금 다른 학생이 신청했어요 😢\n다른 시간을 선택해주세요!");
      await load(); setSelectedSlot(null); return;
    }
    await supabase.from("counseling_slots").update({ is_available: false }).eq("id", selectedSlot.id);
    await supabase.from("counseling_applications").insert({
      slot_id: selectedSlot.id, student_no: sNo.trim(), name: sName.trim(),
      reason: sReason.trim() || null, is_private: sPrivate,
    });
    setSubmitting(false);
    setSelectedSlot(null); setSNo(""); setSName(""); setSReason(""); setSPrivate(false);
    await load();
    alert("신청 완료! 선생님이 확인하실 거예요 🙂");
  }

  // 내 신청 확인
  async function checkMyApp() {
    if (!checkNo.trim()) return;
    setCheckLoading(true);
    let name = checkName.trim();
    if (!name) {
      const { data } = await supabase.from("student_contacts").select("name").eq("student_no", checkNo.trim()).maybeSingle();
      if (data?.name) { name = data.name; setCheckName(data.name); }
    }
    const found = applications.find(a => a.student_no === checkNo.trim());
    setMyApp(found ?? "none");
    setCheckLoading(false);
  }

  // 상담 취소
  async function cancelApp() {
    if (!myApp || myApp === "none") return;
    if (!confirm("상담 신청을 취소할까요?")) return;
    setCancelling(true);
    const app = myApp as Application;
    await supabase.from("counseling_applications").delete().eq("id", app.id);
    await supabase.from("counseling_slots").update({ is_available: true }).eq("id", app.slot_id);
    setCancelling(false);
    setMyApp(null); setCheckNo(""); setCheckName("");
    await load();
    alert("취소 완료! 해당 시간이 다시 열렸어요.");
  }

  // 수시 상담 신청
  async function submitWalkIn() {
    if (!wNo.trim() || !wName.trim() || !wContent.trim()) return;
    setWSubmitting(true);
    await supabase.from("counseling_walkins").insert({
      student_no: wNo.trim(), name: wName.trim(),
      content: wContent.trim(), preferred_time: wPreferred.trim() || null,
      is_private: wPrivate, is_checked: false,
    });
    setWSubmitting(false);
    setWNo(""); setWName(""); setWContent(""); setWPreferred(""); setWPrivate(false);
    setWDone(true); await load();
  }

  async function addSlot() {
    if (!fDate || !fTime.trim()) return;
    setAddLoading(true);
    await supabase.from("counseling_slots").insert({ date: fDate, time: fTime.trim(), is_available: true });
    setAddLoading(false); setFDate(""); setFTime(""); await load();
  }

  async function deleteSlot(id: string) {
    if (!confirm("슬롯을 삭제할까요?")) return;
    await supabase.from("counseling_slots").delete().eq("id", id);
    await load();
  }

  async function toggleChecked(id: string, current: boolean) {
    await supabase.from("counseling_walkins").update({ is_checked: !current }).eq("id", id);
    await load();
  }

  async function confirmApp(id: string, current: boolean) {
    await supabase.from("counseling_applications").update({ is_confirmed: !current }).eq("id", id);
    await load();
  }

  const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  const allGroupedSlots: Record<string, Slot[]> = {};
  slots.filter(s => s.date >= todayStr).forEach(s => {
    if (!allGroupedSlots[s.date]) allGroupedSlots[s.date] = [];
    allGroupedSlots[s.date].push(s);
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      <div className="hy-hero">
        <h1 style={{ color:"#fff", fontSize:"clamp(20px,4vw,30px)", fontWeight:900, margin:"0 0 8px" }}>💬 상담 신청</h1>
        <p style={{ color:"rgba(255,255,255,0.85)", fontSize:13, margin:0, fontWeight:500, lineHeight:1.7 }}>
          정식 상담 기간에는 슬롯을 선택하고,<br/>평소에는 언제든 수시 상담을 신청할 수 있어요
        </p>
      </div>

      {/* 탭 */}
      <div style={{ display:"flex", background:"#f3f4f6", borderRadius:16, padding:4, gap:4 }}>
        {([{ key:"formal", label:"📅 정식 상담", desc:"집중 상담 기간" },
           { key:"walkin", label:"🙋 수시 상담", desc:"평소 언제든" }] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex:1, padding:"12px 8px", borderRadius:12, border:"none", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s",
              background: tab===t.key ? "#fff" : "transparent",
              boxShadow: tab===t.key ? "0 2px 8px rgba(0,0,0,0.08)" : "none" }}>
            <p style={{ fontSize:13, fontWeight:900, color: tab===t.key ? "var(--primary)" : "var(--text-muted)", margin:"0 0 2px" }}>{t.label}</p>
            <p style={{ fontSize:11, fontWeight:600, color:"var(--text-subtle)", margin:0 }}>{t.desc}</p>
          </button>
        ))}
      </div>

      {/* 관리자 로그인 */}
      <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"flex-end" }}>
        {!isAdmin ? (
          <>
            <input type="password" placeholder="관리자 비밀번호" value={pw}
              onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&setIsAdmin(pw===ADMIN_PW)}
              className="hy-input" style={{ maxWidth:180 }}/>
            <button onClick={()=>setIsAdmin(pw===ADMIN_PW)} className="hy-btn" style={{ fontSize:13 }}>확인</button>
          </>
        ) : (
          <span style={{ fontSize:13, color:"var(--primary)", fontWeight:700 }}>✅ 관리자 모드</span>
        )}
      </div>

      {/* ══ 정식 상담 탭 ══ */}
      {tab === "formal" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* 관리자: 신청 현황 */}
          {isAdmin && applications.length > 0 && (
            <div className="hy-card" style={{ padding:"20px 22px", background:"#fdf2f8", border:"2px solid var(--primary)" }}>
              <h3 style={{ fontSize:14, fontWeight:900, color:"var(--primary)", margin:"0 0 14px" }}>
                📋 상담 신청 현황 ({applications.length}건)
              </h3>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {applications.map(app => {
                  const slot = slots.find(s => s.id === app.slot_id);
                  return (
                    <div key={app.id} style={{ padding:"12px 16px", borderRadius:12, background: app.is_confirmed ? "#f0fdf4" : "#fff", border:`1.5px solid ${app.is_confirmed ? "#86efac" : "#f9a8d4"}` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                            <p style={{ fontSize:14, fontWeight:900, color:"var(--text)", margin:0 }}>{app.student_no} {app.name}</p>
                            {app.is_confirmed && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:999, background:"#dcfce7", color:"#15803d", fontWeight:800 }}>✅ 확인완료</span>}
                          </div>
                          <p style={{ fontSize:12, color:"var(--primary)", fontWeight:700, margin:"0 0 4px" }}>
                            📅 {slot ? `${fmtDate(slot.date)} ${slot.time}` : "-"}
                          </p>
                          {app.reason ? (
                            <div style={{ marginTop:6, padding:"8px 12px", borderRadius:8,
                              background: app.is_private ? "#fff5f5" : "#f9fafb",
                              border: `1px solid ${app.is_private ? "#fecaca" : "#f3f4f6"}` }}>
                              {app.is_private && <p style={{ fontSize:10, fontWeight:800, color:"#ef4444", margin:"0 0 3px" }}>🔒 비공개 신청 — 관리자만 열람</p>}
                              <p style={{ fontSize:13, color:"var(--text-muted)", margin:0, lineHeight:1.6, whiteSpace:"pre-wrap" }}>{app.reason}</p>
                            </div>
                          ) : (
                            <p style={{ fontSize:12, color:"var(--text-subtle)", margin:"4px 0 0" }}>신청 사유 없음</p>
                          )}
                          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                            <button onClick={() => confirmApp(app.id, app.is_confirmed)}
                              style={{ marginTop:8, fontSize:11, padding:"4px 12px", borderRadius:999, cursor:"pointer", fontFamily:"inherit", fontWeight:700,
                                border: app.is_confirmed ? "1.5px solid #86efac" : "1.5px solid var(--border)",
                                background: app.is_confirmed ? "#dcfce7" : "#fff",
                                color: app.is_confirmed ? "#15803d" : "var(--text-muted)" }}>
                              {app.is_confirmed ? "✅ 확인완료 (클릭시 취소)" : "확인하기"}
                            </button>
                            <button onClick={() => togglePrepView(app.id, app.student_no)}
                              style={{ marginTop:8, fontSize:11, padding:"4px 12px", borderRadius:999, cursor:"pointer", fontFamily:"inherit", fontWeight:700,
                                border:"1.5px solid #c4b5fd", background:"#f5f3ff", color:"#7c3aed" }}>
                              {expandedPrep[app.id] ? "📝 사전 설문 접기" : "📝 사전 설문 보기"}
                            </button>
                          </div>
                          {expandedPrep[app.id] && (
                            <div style={{ marginTop:10 }}>
                              {prepCache[app.student_no] === undefined ? (
                                <p style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:600 }}>불러오는 중...</p>
                              ) : prepCache[app.student_no] === "none" ? (
                                <p style={{ fontSize:12, color:"#ef4444", fontWeight:700 }}>😢 사전 설문을 제출하지 않았어요.</p>
                              ) : (
                                <PrepSurveyView prep={prepCache[app.student_no] as PrepSurvey} />
                              )}
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize:11, color:"var(--text-subtle)", fontWeight:600, flexShrink:0 }}>{timeAgo(app.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 관리자: 슬롯 추가 */}
          {isAdmin && (
            <div className="hy-card" style={{ padding:"20px 22px", background:"#fdf2f8" }}>
              <h3 style={{ fontSize:14, fontWeight:900, color:"var(--primary)", margin:"0 0 14px" }}>➕ 상담 가능 시간 추가</h3>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"flex-end" }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:4 }}>날짜</label>
                  <input type="date" value={fDate} onChange={e=>setFDate(e.target.value)} className="hy-input"/>
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:4 }}>시간</label>
                  <input placeholder="예: 16:20~16:50" value={fTime} onChange={e=>setFTime(e.target.value)} className="hy-input" style={{ width:140 }}/>
                </div>
                <button onClick={addSlot} disabled={addLoading} className="hy-btn hy-btn-primary" style={{ fontSize:13 }}>
                  {addLoading ? "추가 중..." : "추가"}
                </button>
              </div>
            </div>
          )}

          {/* 사전 설문 게이트 */}
          {!isAdmin && gateStatus !== "checked-exists" && (
            <div className="hy-card" style={{ padding:"22px 24px", border:"2px solid var(--primary)" }}>
              <h3 style={{ fontSize:15, fontWeight:900, color:"var(--text)", margin:"0 0 4px" }}>📝 1학기 마무리 설문 (상담 전 필수)</h3>
              <p style={{ fontSize:13, color:"var(--text-muted)", margin:"0 0 16px", lineHeight:1.7 }}>
                이 설문을 작성해야 상담 시간을 선택할 수 있어요.<br/>
                선생님이 상담할 때 이 내용을 함께 보면서 이야기 나눌 거예요 🙂
              </p>

              <div style={{ position:"relative", marginBottom:10 }}>
                <input placeholder="학번 입력하면 이름이 자동으로 나와요" value={gateNo}
                  onChange={e => { setGateNo(e.target.value); setGateName(""); setGateStatus("idle"); }}
                  onBlur={() => lookupName(gateNo, setGateName, setGateNameLoading)}
                  onKeyDown={e => e.key==="Enter" && checkGate()}
                  className="hy-input" inputMode="numeric"/>
                {gateNameLoading && <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", fontSize:11, color:"var(--text-subtle)" }}>조회 중...</span>}
              </div>
              {gateName && (
                <div style={{ padding:"10px 14px", borderRadius:12, background:"#f0fdf4", border:"1.5px solid #86efac", fontSize:13, fontWeight:700, color:"#15803d", marginBottom:10 }}>
                  👤 {gateName} 학생 확인
                </div>
              )}
              <button onClick={checkGate} disabled={gateChecking || !gateNo.trim()} className="hy-btn hy-btn-primary" style={{ fontSize:13 }}>
                {gateChecking ? "확인 중..." : "학번 확인"}
              </button>

              {gateStatus === "checked-missing" && (
                <div style={{ display:"flex", flexDirection:"column", gap:14, marginTop:20, paddingTop:16, borderTop:"1.5px dashed var(--border)" }}>
                  <PrepField label="1. 기말고사가 끝난 직후 나의 느낌/감정" value={prepForm.feeling} onChange={v=>setPrepForm(p=>({...p, feeling:v}))}/>
                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:6 }}>2. 이번 학기에 내가 최선을 다한 정도를 점수 매기면? (100점 만점)</label>
                    <input type="number" min={0} max={100} placeholder="예: 85" value={prepForm.effort_score}
                      onChange={e=>setPrepForm(p=>({...p, effort_score:e.target.value}))} className="hy-input" style={{ width:100 }}/>
                  </div>
                  <PrepField label="3. 이번에 가장 열심히 준비했던 과목" value={prepForm.hardest_subject} onChange={v=>setPrepForm(p=>({...p, hardest_subject:v}))}/>
                  <PrepField label="4. 이번에 가장 시간투자와 노력이 적었던 과목" value={prepForm.least_effort_subject} onChange={v=>setPrepForm(p=>({...p, least_effort_subject:v}))}/>
                  <PrepField label="5. 이것만큼은 샘께 자랑하고 싶다!" value={prepForm.proud} onChange={v=>setPrepForm(p=>({...p, proud:v}))}/>
                  <PrepField label="6. 이건 진짜 아쉽다! 이건 내가 진짜 후회한다!" value={prepForm.regret} onChange={v=>setPrepForm(p=>({...p, regret:v}))}/>
                  <PrepField label="7. 과목별 밸런스는? (시간 투자/노력 면)" value={prepForm.subject_balance} onChange={v=>setPrepForm(p=>({...p, subject_balance:v}))}/>

                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:6 }}>8. 과목별로 느낀점</label>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:8 }}>
                      {PREP_SUBJECTS.map(s => (
                        <div key={s.key}>
                          <p style={{ fontSize:11, fontWeight:700, color:"var(--text-subtle)", margin:"0 0 4px" }}>{s.label}</p>
                          <textarea value={prepForm[s.key]} onChange={e=>setPrepForm(p=>({...p, [s.key]: e.target.value}))}
                            className="hy-input" style={{ minHeight:60, resize:"vertical", fontSize:12, width:"100%" }}/>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:6 }}>9. 2학기 때 더 보완해야 할 점</label>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      <div>
                        <p style={{ fontSize:11, fontWeight:700, color:"var(--text-subtle)", margin:"0 0 4px" }}>학습 방법</p>
                        <textarea value={prepForm.improve_method} onChange={e=>setPrepForm(p=>({...p, improve_method:e.target.value}))} className="hy-input" style={{ minHeight:60, resize:"vertical", width:"100%" }}/>
                      </div>
                      <div>
                        <p style={{ fontSize:11, fontWeight:700, color:"var(--text-subtle)", margin:"0 0 4px" }}>생활 습관/노력의 정도</p>
                        <textarea value={prepForm.improve_habit} onChange={e=>setPrepForm(p=>({...p, improve_habit:e.target.value}))} className="hy-input" style={{ minHeight:60, resize:"vertical", width:"100%" }}/>
                      </div>
                    </div>
                  </div>

                  <PrepField label="10. 나의 여름방학 계획" value={prepForm.vacation_plan} onChange={v=>setPrepForm(p=>({...p, vacation_plan:v}))}/>
                  <PrepField label="11. 현재 나의 심리 상태" value={prepForm.psych_state} onChange={v=>setPrepForm(p=>({...p, psych_state:v}))}/>
                  <PrepField label="12. 정서/심리 고민" value={prepForm.emotional_concern} onChange={v=>setPrepForm(p=>({...p, emotional_concern:v}))}/>
                  <PrepField label="13. 생기부 관련 고민" value={prepForm.record_concern} onChange={v=>setPrepForm(p=>({...p, record_concern:v}))}/>

                  <button onClick={submitPrep} disabled={prepSubmitting} className="hy-btn hy-btn-primary" style={{ fontSize:14 }}>
                    {prepSubmitting ? "제출 중..." : "설문 제출하고 상담 신청하러 가기"}
                  </button>
                </div>
              )}
            </div>
          )}

          {(isAdmin || gateStatus === "checked-exists") && (
          <>
          {!isAdmin && gateStatus === "checked-exists" && (
            <div style={{ padding:"14px 18px", borderRadius:14, background:"#f0fdf4", border:"1.5px solid #86efac" }}>
              <p style={{ fontSize:13, fontWeight:800, color:"#15803d", margin:0 }}>✅ {gateName} 학생, 설문 제출 완료! 이제 상담 시간을 선택해주세요.</p>
            </div>
          )}

          {/* 슬롯 목록 */}
          {Object.keys(allGroupedSlots).length === 0 ? (
            <div className="hy-card" style={{ padding:"40px", textAlign:"center" }}>
              <p style={{ fontSize:28, margin:"0 0 10px" }}>📅</p>
              <p style={{ fontSize:14, color:"var(--text-subtle)", fontWeight:600 }}>
                현재 열린 상담 시간이 없어요.<br/>
                <span style={{ fontSize:13 }}>정식 상담 기간이 시작되면 여기에 시간이 열려요.</span>
              </p>
            </div>
          ) : (
            Object.entries(allGroupedSlots).map(([date, daySlots]) => (
              <div key={date}>
                <p style={{ fontSize:13, fontWeight:800, color:"var(--text-muted)", margin:"0 0 8px" }}>📅 {fmtDate(date)}</p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:8 }}>
                  {daySlots.map(slot => {
                    const app = applications.find(a => a.slot_id === slot.id);
                    const isTaken = !slot.is_available;
                    const isSelected = selectedSlot?.id === slot.id;
                    return (
                      <button key={slot.id}
                        onClick={() => !isTaken && setSelectedSlot(isSelected ? null : slot)}
                        style={{ padding:"14px 12px", borderRadius:14, border:"2px solid", fontFamily:"inherit", transition:"all 0.15s", textAlign:"center",
                          cursor: isTaken ? "default" : "pointer",
                          borderColor: isTaken ? "#fecaca" : isSelected ? "var(--primary)" : "var(--border)",
                          background: isTaken ? "#fff5f5" : isSelected ? "var(--primary-light)" : "#fff",
                          opacity: isTaken ? 0.85 : 1 }}>
                        <p style={{ fontSize:14, fontWeight:900, margin:"0 0 4px",
                          color: isTaken ? "#ef4444" : isSelected ? "var(--primary)" : "var(--text)" }}>{slot.time}</p>
                        {isTaken ? (
                          <>
                            <p style={{ fontSize:11, fontWeight:700, color:"#ef4444", margin:"0 0 2px" }}>🔒 신청 완료</p>
                            <p style={{ fontSize:12, fontWeight:800, color:"#dc2626", margin:0 }}>
                              {app ? (isAdmin ? `${app.name} (${app.student_no})` : `${app.name[0]}${"*".repeat(app.name.length-1)}`) : "-"}
                            </p>
                          </>
                        ) : (
                          <p style={{ fontSize:11, fontWeight:600, color:"#22c55e", margin:0 }}>✅ 신청 가능</p>
                        )}
                        {isAdmin && (
                          <button onClick={e=>{e.stopPropagation();deleteSlot(slot.id);}}
                            style={{ marginTop:6, fontSize:10, padding:"2px 8px", borderRadius:999, border:"1px solid #fecaca", background:"#fff5f5", color:"#ef4444", cursor:"pointer", fontFamily:"inherit" }}>
                            삭제
                          </button>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {/* 신청 폼 */}
          {selectedSlot && (
            <div className="hy-card" style={{ padding:"22px 24px", border:"2px solid var(--primary)" }}>
              <h3 style={{ fontSize:15, fontWeight:900, color:"var(--text)", margin:"0 0 4px" }}>📝 상담 신청</h3>
              <p style={{ fontSize:13, color:"var(--primary)", fontWeight:700, margin:"0 0 16px" }}>
                {fmtDate(selectedSlot.date)} {selectedSlot.time}
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ position:"relative" }}>
                  <input placeholder="학번 입력하면 이름이 자동으로 나와요" value={sNo}
                    onChange={e => { setSNo(e.target.value); setSName(""); }}
                    onBlur={() => lookupName(sNo, setSName, setSNameLoading)}
                    className="hy-input" inputMode="numeric"/>
                  {sNameLoading && <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", fontSize:11, color:"var(--text-subtle)" }}>조회 중...</span>}
                </div>
                {sName && (
                  <div style={{ padding:"10px 14px", borderRadius:12, background:"#f0fdf4", border:"1.5px solid #86efac", fontSize:13, fontWeight:700, color:"#15803d" }}>
                    👤 {sName} 학생으로 신청해요
                  </div>
                )}
                {sNo.length >= 5 && !sName && !sNameLoading && (
                  <div style={{ padding:"10px 14px", borderRadius:12, background:"#fff5f5", border:"1.5px solid #fecaca", fontSize:13, fontWeight:700, color:"#ef4444" }}>
                    ⚠️ 학번을 찾을 수 없어요. 연락처 확인 페이지에서 먼저 등록해주세요.
                  </div>
                )}
                <textarea placeholder="상담 내용 (선택, 간단하게)" value={sReason} onChange={e=>setSReason(e.target.value)}
                  className="hy-input" style={{ minHeight:80, resize:"vertical" }}/>
                <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"var(--text-muted)", fontWeight:600, cursor:"pointer" }}>
                  <input type="checkbox" checked={sPrivate} onChange={e=>setSPrivate(e.target.checked)}/>
                  🔒 내용 비공개 (선생님만 확인)
                </label>
                <button onClick={submitFormal} disabled={submitting || !sName} className="hy-btn hy-btn-primary"
                  style={{ fontSize:14, opacity: !sName ? 0.5 : 1 }}>
                  {submitting ? "신청 중..." : "상담 신청하기"}
                </button>
              </div>
            </div>
          )}
          </>
          )}

          {/* 내 신청 확인 + 취소 */}
          <div className="hy-card" style={{ padding:"20px 22px" }}>
            <h3 style={{ fontSize:14, fontWeight:900, color:"var(--text)", margin:"0 0 4px" }}>🔍 내 신청 확인 / 취소</h3>
            <p style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:600, margin:"0 0 12px" }}>
              학번만 입력하면 이름은 자동으로 찾아줘요
            </p>
            <div style={{ display:"flex", gap:8 }}>
              <input placeholder="학번 입력" value={checkNo}
                onChange={e => { setCheckNo(e.target.value); setCheckName(""); setMyApp(null); }}
                onBlur={() => lookupName(checkNo, setCheckName, setCheckLoading)}
                onKeyDown={e => e.key==="Enter" && checkMyApp()}
                className="hy-input" style={{ flex:1 }} inputMode="numeric"/>
              <button onClick={checkMyApp} disabled={checkLoading} className="hy-btn hy-btn-primary" style={{ fontSize:13, whiteSpace:"nowrap" }}>
                {checkLoading ? "조회 중..." : "확인"}
              </button>
            </div>
            {checkName && (
              <p style={{ fontSize:12, color:"var(--primary)", fontWeight:700, marginTop:6 }}>👤 {checkName}</p>
            )}

            {myApp === "none" && (
              <div style={{ marginTop:12, padding:"12px 16px", borderRadius:12, background:"#fff5f5", border:"1.5px solid #fecaca" }}>
                <p style={{ fontSize:13, fontWeight:700, color:"#ef4444", margin:0 }}>😢 신청 내역이 없어요.</p>
              </div>
            )}
            {myApp && myApp !== "none" && (() => {
              const app = myApp as Application;
              const slot = slots.find(s => s.id === app.slot_id);
              return (
                <div style={{ marginTop:12, padding:"16px 18px", borderRadius:12, background:"#f0fdf4", border:"1.5px solid #86efac" }}>
                  <p style={{ fontSize:14, fontWeight:900, color:"#15803d", margin:"0 0 6px" }}>✅ 신청 완료!</p>
                  <p style={{ fontSize:13, fontWeight:700, color:"var(--text)", margin:"0 0 4px" }}>{app.name} ({app.student_no})</p>
                  <p style={{ fontSize:13, color:"var(--primary)", fontWeight:700, margin:"0 0 8px" }}>
                    📅 {slot ? `${fmtDate(slot.date)} ${slot.time}` : "-"}
                  </p>
                  {app.is_confirmed ? (
                    <div style={{ padding:"10px 14px", borderRadius:10, background:"#f0fdf4", border:"1.5px solid #86efac", fontSize:13, fontWeight:700, color:"#15803d" }}>
                      ✅ 선생님이 확인하셨어요. 취소가 불가해요.
                    </div>
                  ) : (
                    <button onClick={cancelApp} disabled={cancelling}
                      style={{ fontSize:13, padding:"8px 18px", borderRadius:999, border:"1.5px solid #fecaca",
                        background:"#fff5f5", color:"#ef4444", cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>
                      {cancelling ? "취소 중..." : "🗑 상담 취소하기"}
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ══ 수시 상담 탭 ══ */}
      {tab === "walkin" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ padding:"16px 20px", borderRadius:16, background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", border:"1.5px solid #86efac" }}>
            <p style={{ fontSize:14, fontWeight:800, color:"#15803d", margin:"0 0 6px" }}>🙋 수시 상담이란?</p>
            <p style={{ fontSize:13, color:"#166534", margin:0, lineHeight:1.7, fontWeight:500 }}>
              정식 상담 기간이 아니어도, 고민이나 상담하고 싶은 내용이 있으면 언제든 신청해요.<br/>
              선생님이 확인 후 편한 시간에 연락드릴게요 🙂
            </p>
          </div>

          {wDone ? (
            <div className="hy-card" style={{ padding:"40px", textAlign:"center" }}>
              <p style={{ fontSize:36, margin:"0 0 12px" }}>✅</p>
              <p style={{ fontSize:16, fontWeight:900, color:"var(--text)", margin:"0 0 8px" }}>상담 신청 완료!</p>
              <p style={{ fontSize:13, color:"var(--text-muted)", margin:"0 0 20px", lineHeight:1.7 }}>선생님이 확인 후 연락드릴게요 🙂</p>
              <button onClick={() => setWDone(false)} className="hy-btn hy-btn-primary" style={{ fontSize:13 }}>다시 신청하기</button>
            </div>
          ) : (
            <div className="hy-card" style={{ padding:"22px 24px" }}>
              <h3 style={{ fontSize:15, fontWeight:900, color:"var(--text)", margin:"0 0 16px" }}>✏️ 수시 상담 신청</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ position:"relative" }}>
                  <input placeholder="학번 입력하면 이름이 자동으로 나와요" value={wNo}
                    onChange={e => { setWNo(e.target.value); setWName(""); }}
                    onBlur={() => lookupName(wNo, setWName, setWNameLoading)}
                    className="hy-input" inputMode="numeric"/>
                  {wNameLoading && <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", fontSize:11, color:"var(--text-subtle)" }}>조회 중...</span>}
                </div>
                {wName && (
                  <div style={{ padding:"10px 14px", borderRadius:12, background:"#f0fdf4", border:"1.5px solid #86efac", fontSize:13, fontWeight:700, color:"#15803d" }}>
                    👤 {wName} 학생으로 신청해요
                  </div>
                )}
                <textarea placeholder={"상담하고 싶은 내용을 편하게 적어줘요 🙂\n(성적, 진로, 친구 관계, 학교생활 등 무엇이든 괜찮아요)"}
                  value={wContent} onChange={e=>setWContent(e.target.value)}
                  className="hy-input" style={{ minHeight:120, resize:"vertical" }}/>
                <input placeholder="희망 시간대 (선택, 예: 방과후, 점심시간)"
                  value={wPreferred} onChange={e=>setWPreferred(e.target.value)} className="hy-input"/>
                <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"var(--text-muted)", fontWeight:600, cursor:"pointer" }}>
                  <input type="checkbox" checked={wPrivate} onChange={e=>setWPrivate(e.target.checked)}/>
                  🔒 내용 비공개 (선생님만 확인)
                </label>
                <button onClick={submitWalkIn} disabled={wSubmitting || !wName} className="hy-btn hy-btn-primary"
                  style={{ fontSize:14, opacity: !wName ? 0.5 : 1 }}>
                  {wSubmitting ? "신청 중..." : "상담 신청하기"}
                </button>
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="hy-card" style={{ padding:"20px 22px" }}>
              <h3 style={{ fontSize:14, fontWeight:900, color:"var(--text)", margin:"0 0 14px" }}>
                📋 수시 상담 신청 목록
                <span style={{ fontSize:12, fontWeight:700, color:"#f59e0b", marginLeft:8 }}>
                  미확인 {walkIns.filter(w=>!w.is_checked).length}건
                </span>
              </h3>
              {walkIns.length === 0 ? (
                <p style={{ fontSize:13, color:"var(--text-subtle)", fontWeight:600 }}>아직 신청이 없어요</p>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {walkIns.map(w => (
                    <div key={w.id} style={{ padding:"14px 16px", borderRadius:12,
                      background: w.is_checked ? "#f9fafb" : "#fffbeb",
                      border:`1.5px solid ${w.is_checked ? "var(--border)" : "#fde68a"}` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:8 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:11, padding:"2px 8px", borderRadius:999, fontWeight:800,
                            background: w.is_checked ? "#f0fdf4" : "#fffbeb", color: w.is_checked ? "#16a34a" : "#f59e0b" }}>
                            {w.is_checked ? "✅ 확인완료" : "⏳ 미확인"}
                          </span>
                          <span style={{ fontSize:14, fontWeight:900, color:"var(--text)" }}>{w.student_no} {w.name}</span>
                        </div>
                        <span style={{ fontSize:11, color:"var(--text-subtle)", fontWeight:600, flexShrink:0 }}>{timeAgo(w.created_at)}</span>
                      </div>
                      {w.content && (
                        <div style={{ marginBottom:8, padding:"8px 12px", borderRadius:8,
                          background: w.is_private ? "#fff5f5" : "#f9fafb",
                          border: `1px solid ${w.is_private ? "#fecaca" : "#f3f4f6"}` }}>
                          {w.is_private && <p style={{ fontSize:10, fontWeight:800, color:"#ef4444", margin:"0 0 3px" }}>🔒 비공개 신청 — 관리자만 열람</p>}
                          <p style={{ fontSize:13, color:"var(--text-muted)", margin:0, lineHeight:1.6, whiteSpace:"pre-wrap" }}>{w.content}</p>
                        </div>
                      )}
                      {w.preferred_time && <p style={{ fontSize:12, color:"var(--primary)", fontWeight:700, margin:"0 0 8px" }}>⏰ 희망 시간: {w.preferred_time}</p>}
                      <button onClick={() => toggleChecked(w.id, w.is_checked)}
                        style={{ fontSize:11, padding:"4px 12px", borderRadius:999, border:"1.5px solid var(--border)", background:"#fff",
                          cursor:"pointer", fontFamily:"inherit", fontWeight:700, color:"var(--text-muted)" }}>
                        {w.is_checked ? "미확인으로 변경" : "✅ 확인 완료"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
