"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type Slot = {
  id: string;
  date: string;
  time: string;
  is_available: boolean;
};

type Application = {
  id: string;
  slot_id: string;
  student_no: string;
  name: string;
  reason: string | null;
  is_private: boolean;
  created_at: string;
};

type WalkIn = {
  id: string;
  created_at: string;
  student_no: string;
  name: string;
  content: string;
  preferred_time: string | null;
  is_private: boolean;
  is_checked: boolean;
};

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
  const d = new Date(iso);
  return `${d.getMonth()+1}월 ${d.getDate()}일`;
}

export default function CounselingPage() {
  const [tab, setTab] = useState<"formal"|"walkin">("formal");

  // ── 정식 상담 ──
  const [slots,        setSlots]        = useState<Slot[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [sName,        setSName]        = useState("");
  const [sNo,          setSNo]          = useState("");
  const [sReason,      setSReason]      = useState("");
  const [sPrivate,     setSPrivate]     = useState(false);
  const [submitting,   setSubmitting]   = useState(false);

  // ── 수시 상담 ──
  const [walkIns,      setWalkIns]      = useState<WalkIn[]>([]);
  const [wName,        setWName]        = useState("");
  const [wNo,          setWNo]          = useState("");
  const [wContent,     setWContent]     = useState("");
  const [wPreferred,   setWPreferred]   = useState("");
  const [wPrivate,     setWPrivate]     = useState(false);
  const [wSubmitting,  setWSubmitting]  = useState(false);
  const [wDone,        setWDone]        = useState(false);

  // ── 관리자 ──
  const [pw,        setPw]        = useState("");
  const [isAdmin,   setIsAdmin]   = useState(false);
  const [fDate,     setFDate]     = useState("");
  const [fTime,     setFTime]     = useState("");
  const [addLoading,setAddLoading]= useState(false);

  async function load() {
    const { data: sd } = await supabase.from("counseling_slots").select("*").order("date").order("time");
    const { data: ad } = await supabase.from("counseling_applications").select("*").order("created_at");
    const { data: wd } = await supabase.from("counseling_walkins").select("*").order("created_at", { ascending: false });
    setSlots((sd as Slot[]) ?? []);
    setApplications((ad as Application[]) ?? []);
    setWalkIns((wd as WalkIn[]) ?? []);
  }

  useEffect(() => { load(); }, []);

  // 정식 상담 신청
  async function submitFormal() {
    if (!selectedSlot) { alert("시간을 선택해주세요"); return; }
    if (!sName.trim() || !sNo.trim()) { alert("이름과 학번을 입력해주세요"); return; }
    setSubmitting(true);
    await supabase.from("counseling_applications").insert({
      slot_id: selectedSlot.id,
      student_no: sNo.trim(),
      name: sName.trim(),
      reason: sReason.trim() || null,
      is_private: sPrivate,
    });
    await supabase.from("counseling_slots").update({ is_available: false }).eq("id", selectedSlot.id);
    setSubmitting(false);
    setSelectedSlot(null); setSName(""); setSNo(""); setSReason(""); setSPrivate(false);
    await load();
    alert("신청 완료! 선생님이 확인하실 거예요 🙂");
  }

  // 수시 상담 신청
  async function submitWalkIn() {
    if (!wName.trim() || !wNo.trim()) { alert("이름과 학번을 입력해주세요"); return; }
    if (!wContent.trim()) { alert("상담 내용을 입력해주세요"); return; }
    setWSubmitting(true);
    await supabase.from("counseling_walkins").insert({
      student_no: wNo.trim(),
      name: wName.trim(),
      content: wContent.trim(),
      preferred_time: wPreferred.trim() || null,
      is_private: wPrivate,
      is_checked: false,
    });
    setWSubmitting(false);
    setWName(""); setWNo(""); setWContent(""); setWPreferred(""); setWPrivate(false);
    setWDone(true);
    await load();
  }

  // 관리자 슬롯 추가
  async function addSlot() {
    if (!fDate || !fTime.trim()) { alert("날짜와 시간을 입력해주세요"); return; }
    setAddLoading(true);
    await supabase.from("counseling_slots").insert({ date: fDate, time: fTime.trim(), is_available: true });
    setAddLoading(false);
    setFDate(""); setFTime("");
    await load();
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

  const allGroupedSlots: Record<string, Slot[]> = {};
  slots.forEach(s => {
    if (!allGroupedSlots[s.date]) allGroupedSlots[s.date] = [];
    allGroupedSlots[s.date].push(s);
  });
  const takenSlots = slots.filter(s => !s.is_available);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* 헤더 */}
      <div className="hy-hero">
        <h1 style={{ color:"#fff", fontSize:"clamp(20px,4vw,30px)", fontWeight:900, margin:"0 0 8px" }}>
          💬 상담 신청
        </h1>
        <p style={{ color:"rgba(255,255,255,0.85)", fontSize:13, margin:0, fontWeight:500, lineHeight:1.7 }}>
          정식 상담 기간에는 슬롯을 선택하고,<br/>
          평소에는 언제든 수시 상담을 신청할 수 있어요
        </p>
      </div>

      {/* 탭 */}
      <div style={{ display:"flex", background:"#f3f4f6", borderRadius:16, padding:4, gap:4 }}>
        {([
          { key:"formal",  label:"📅 정식 상담", desc:"집중 상담 기간" },
          { key:"walkin",  label:"🙋 수시 상담", desc:"평소 언제든" },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex:1, padding:"12px 8px", borderRadius:12, border:"none", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s",
              background: tab===t.key ? "#fff" : "transparent",
              boxShadow: tab===t.key ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
            }}>
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

          {/* 관리자: 신청 현황 요약 (상단) */}
          {isAdmin && applications.length > 0 && (
            <div className="hy-card" style={{ padding:"20px 22px", background:"#fdf2f8", border:"2px solid var(--primary)" }}>
              <h3 style={{ fontSize:14, fontWeight:900, color:"var(--primary)", margin:"0 0 14px" }}>
                📋 상담 신청 현황 ({applications.length}건)
              </h3>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {applications.map(app => {
                  const slot = slots.find(s => s.id === app.slot_id);
                  return (
                    <div key={app.id} style={{ padding:"12px 16px", borderRadius:12, background:"#fff", border:"1.5px solid #f9a8d4" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
                        <div>
                          <p style={{ fontSize:14, fontWeight:900, color:"var(--text)", margin:"0 0 4px" }}>
                            {app.student_no} {app.name}
                          </p>
                          <p style={{ fontSize:12, color:"var(--primary)", fontWeight:700, margin:"0 0 4px" }}>
                            📅 {slot ? `${fmtDate(slot.date)} ${slot.time}` : "-"}
                          </p>
                          {!app.is_private && app.reason && (
                            <p style={{ fontSize:13, color:"var(--text-muted)", margin:0, lineHeight:1.6 }}>{app.reason}</p>
                          )}
                          {app.is_private && <p style={{ fontSize:12, color:"var(--text-subtle)", margin:0 }}>🔒 내용 비공개</p>}
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
                          color: isTaken ? "#ef4444" : isSelected ? "var(--primary)" : "var(--text)",
                          opacity: isTaken ? 0.85 : 1,
                        }}>
                        <p style={{ fontSize:14, fontWeight:900, margin:"0 0 4px" }}>{slot.time}</p>
                        {isTaken ? (
                          <>
                            <p style={{ fontSize:11, fontWeight:700, color:"#ef4444", margin:"0 0 2px" }}>🔒 신청 완료</p>
                            {/* 신청자: 관리자는 실명, 학생은 이름 첫글자+** */}
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
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <input placeholder="학번 *" value={sNo} onChange={e=>setSNo(e.target.value)} className="hy-input"/>
                  <input placeholder="이름 *" value={sName} onChange={e=>setSName(e.target.value)} className="hy-input"/>
                </div>
                <textarea placeholder="상담 내용 (선택, 간단하게)" value={sReason} onChange={e=>setSReason(e.target.value)}
                  className="hy-input" style={{ minHeight:80, resize:"vertical" }}/>
                <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"var(--text-muted)", fontWeight:600, cursor:"pointer" }}>
                  <input type="checkbox" checked={sPrivate} onChange={e=>setSPrivate(e.target.checked)}/>
                  🔒 내용 비공개 (선생님만 확인)
                </label>
                <button onClick={submitFormal} disabled={submitting} className="hy-btn hy-btn-primary" style={{ fontSize:14 }}>
                  {submitting ? "신청 중..." : "상담 신청하기"}
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ══ 수시 상담 탭 ══ */}
      {tab === "walkin" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* 안내 */}
          <div style={{ padding:"16px 20px", borderRadius:16, background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", border:"1.5px solid #86efac" }}>
            <p style={{ fontSize:14, fontWeight:800, color:"#15803d", margin:"0 0 6px" }}>🙋 수시 상담이란?</p>
            <p style={{ fontSize:13, color:"#166534", margin:0, lineHeight:1.7, fontWeight:500 }}>
              정식 상담 기간이 아니어도, 고민이나 상담하고 싶은 내용이 있으면 언제든 신청해요.<br/>
              선생님이 확인 후 편한 시간에 연락드릴게요 🙂
            </p>
          </div>

          {/* 신청 완료 */}
          {wDone ? (
            <div className="hy-card" style={{ padding:"40px", textAlign:"center" }}>
              <p style={{ fontSize:36, margin:"0 0 12px" }}>✅</p>
              <p style={{ fontSize:16, fontWeight:900, color:"var(--text)", margin:"0 0 8px" }}>상담 신청 완료!</p>
              <p style={{ fontSize:13, color:"var(--text-muted)", margin:"0 0 20px", lineHeight:1.7 }}>
                선생님이 확인 후 연락드릴게요 🙂
              </p>
              <button onClick={() => setWDone(false)} className="hy-btn hy-btn-primary" style={{ fontSize:13 }}>
                다시 신청하기
              </button>
            </div>
          ) : (
            <div className="hy-card" style={{ padding:"22px 24px" }}>
              <h3 style={{ fontSize:15, fontWeight:900, color:"var(--text)", margin:"0 0 16px" }}>✏️ 수시 상담 신청</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <input placeholder="학번 *" value={wNo} onChange={e=>setWNo(e.target.value)} className="hy-input"/>
                  <input placeholder="이름 *" value={wName} onChange={e=>setWName(e.target.value)} className="hy-input"/>
                </div>
                <textarea
                  placeholder="상담하고 싶은 내용을 편하게 적어줘요 🙂&#10;(성적, 진로, 친구 관계, 학교생활 등 무엇이든 괜찮아요)"
                  value={wContent} onChange={e=>setWContent(e.target.value)}
                  className="hy-input" style={{ minHeight:120, resize:"vertical" }}/>
                <input placeholder="희망 시간대 (선택, 예: 방과후, 점심시간, 평일 오후)"
                  value={wPreferred} onChange={e=>setWPreferred(e.target.value)} className="hy-input"/>
                <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"var(--text-muted)", fontWeight:600, cursor:"pointer" }}>
                  <input type="checkbox" checked={wPrivate} onChange={e=>setWPrivate(e.target.checked)}/>
                  🔒 내용 비공개 (선생님만 확인)
                </label>
                <button onClick={submitWalkIn} disabled={wSubmitting} className="hy-btn hy-btn-primary" style={{ fontSize:14 }}>
                  {wSubmitting ? "신청 중..." : "상담 신청하기"}
                </button>
              </div>
            </div>
          )}

          {/* 관리자: 수시 상담 목록 */}
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
                    <div key={w.id} style={{ padding:"14px 16px", borderRadius:12, background: w.is_checked ? "#f9fafb" : "#fffbeb",
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
                      {!w.is_private && (
                        <p style={{ fontSize:13, color:"var(--text-muted)", margin:"0 0 6px", lineHeight:1.6, whiteSpace:"pre-wrap" }}>{w.content}</p>
                      )}
                      {w.is_private && <p style={{ fontSize:12, color:"var(--text-subtle)", margin:"0 0 6px" }}>🔒 비공개</p>}
                      {w.preferred_time && (
                        <p style={{ fontSize:12, color:"var(--primary)", fontWeight:700, margin:"0 0 8px" }}>⏰ 희망 시간: {w.preferred_time}</p>
                      )}
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
