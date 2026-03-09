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

const ADMIN_PW = "hyfl2025";

export default function CounselingPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  // 학생 신청
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [sName,      setSName]      = useState("");
  const [sNo,        setSNo]        = useState("");
  const [sReason,    setSReason]    = useState("");
  const [sPrivate,   setSPrivate]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 관리자
  const [pw,       setPw]       = useState("");
  const [isAdmin,  setIsAdmin]  = useState(false);
  const [fDate,    setFDate]    = useState("");
  const [fTime,    setFTime]    = useState("");
  const [addLoading, setAddLoading] = useState(false);

  async function load() {
    const { data: sd } = await supabase.from("counseling_slots").select("*").order("date").order("time");
    const { data: ad } = await supabase.from("counseling_applications").select("*").order("created_at");
    setSlots((sd as Slot[]) ?? []);
    setApplications((ad as Application[]) ?? []);
  }

  useEffect(() => { load(); }, []);

  function appForSlot(slotId: string) {
    return applications.find(a => a.slot_id === slotId);
  }

  async function addSlot() {
    if (!fDate || !fTime) { alert("날짜와 시간을 입력하세요"); return; }
    setAddLoading(true);
    await supabase.from("counseling_slots").insert({ date: fDate, time: fTime, is_available: true });
    setAddLoading(false);
    setFDate(""); setFTime("");
    await load();
  }

  async function deleteSlot(id: string) {
    if (!confirm("삭제할까요?")) return;
    await supabase.from("counseling_slots").delete().eq("id", id);
    await load();
  }

  async function submitApp() {
    if (!selectedSlot) return;
    if (!sName.trim() || !sNo.trim()) { alert("이름과 학번을 입력하세요"); return; }
    const existing = appForSlot(selectedSlot.id);
    if (existing) { alert("이미 신청된 시간이에요"); return; }
    setSubmitting(true);
    await supabase.from("counseling_applications").insert({
      slot_id: selectedSlot.id,
      student_no: sNo.trim(),
      name: sName.trim(),
      reason: sReason.trim() || null,
      is_private: sPrivate,
    });
    setSubmitting(false);
    setSelectedSlot(null); setSName(""); setSNo(""); setSReason(""); setSPrivate(false);
    await load();
    alert("상담 신청 완료! 선생님이 확인하실 거예요 🙂");
  }

  async function cancelApp(appId: string) {
    if (!confirm("신청을 취소할까요?")) return;
    await supabase.from("counseling_applications").delete().eq("id", appId);
    await load();
  }

  // 날짜별 그룹핑
  const grouped: Record<string, Slot[]> = {};
  slots.forEach(s => {
    if (!grouped[s.date]) grouped[s.date] = [];
    grouped[s.date].push(s);
  });

  function fmtDate(d: string) {
    const dt = new Date(`${d}T00:00:00+09:00`);
    const days = ["일","월","화","수","목","금","토"];
    return `${dt.getMonth()+1}월 ${dt.getDate()}일 (${days[dt.getDay()]})`;
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* 헤더 */}
      <div className="hy-hero">
        <div style={{ position:"relative" }}>
          <p style={{ color:"rgba(255,255,255,0.8)", fontSize:13, fontWeight:600, margin:"0 0 6px" }}>선생님과 1:1</p>
          <h1 style={{ color:"#fff", fontSize:"clamp(22px,4vw,32px)", fontWeight:900, margin:"0 0 8px", letterSpacing:"-0.5px" }}>
            💌 1차 상담 신청
          </h1>
          <p style={{ color:"rgba(255,255,255,0.85)", fontSize:13, margin:0, fontWeight:500, lineHeight:1.7 }}>
            선생님이 등록한 가능 시간 중 원하는 시간을 선택해 신청해요.<br/>
            이미 신청된 시간을 피해서 신청해주세요 🙏 비밀 상담도 가능해요 🔒
          </p>
        </div>
      </div>

      {/* 관리자 패널 */}
      <div className="hy-card" style={{ padding:"18px 22px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          {!isAdmin ? (
            <>
              <input type="password" placeholder="관리자 비밀번호"
                value={pw} onChange={e => setPw(e.target.value)}
                onKeyDown={e => e.key==="Enter" && setIsAdmin(pw===ADMIN_PW)}
                className="hy-input" style={{ maxWidth:180 }} />
              <button onClick={() => setIsAdmin(pw===ADMIN_PW)}
                className="hy-btn" style={{ fontSize:13 }}>확인</button>
            </>
          ) : (
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center", width:"100%" }}>
              <span style={{ fontSize:13, color:"var(--primary)", fontWeight:800 }}>✅ 관리자 모드</span>
              <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} className="hy-input" style={{ maxWidth:160 }} />
              <input type="time" value={fTime} onChange={e => setFTime(e.target.value)} className="hy-input" style={{ maxWidth:130 }} />
              <button onClick={addSlot} disabled={addLoading}
                className="hy-btn hy-btn-primary" style={{ fontSize:13 }}>
                {addLoading ? "추가 중..." : "+ 슬롯 추가"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 슬롯 목록 */}
      {Object.keys(grouped).length === 0 ? (
        <div className="hy-card" style={{ padding:"40px", textAlign:"center" }}>
          <p style={{ fontSize:15, color:"var(--text-subtle)", fontWeight:600 }}>
            아직 상담 가능 시간이 없어요.<br/>선생님이 곧 등록해주실 거예요 🙂
          </p>
        </div>
      ) : Object.entries(grouped).map(([date, daySlots]) => (
        <div key={date} className="hy-card" style={{ padding:"20px 22px" }}>
          <h3 style={{ fontSize:15, fontWeight:900, color:"var(--text)", margin:"0 0 14px" }}>
            📅 {fmtDate(date)}
          </h3>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
            {daySlots.map(slot => {
              const app = appForSlot(slot.id);
              const taken = !!app;
              return (
                <div key={slot.id} style={{
                  padding:"12px 16px", borderRadius:14, minWidth:120,
                  background: taken ? "#f9fafb" : "var(--primary-light)",
                  border: taken ? "1.5px solid var(--border)" : "1.5px solid #f9a8d4",
                  opacity: taken ? 0.8 : 1,
                }}>
                  <div style={{ fontWeight:900, fontSize:16, color: taken ? "var(--text-subtle)" : "var(--primary)", marginBottom:6 }}>
                    {slot.time}
                  </div>
                  {taken ? (
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:"var(--text-subtle)" }}>
                        {app.is_private ? "🔒 비밀 상담" : app.name}
                      </div>
                      <button onClick={() => cancelApp(app.id)}
                        style={{ marginTop:6, fontSize:11, padding:"3px 10px", borderRadius:999, border:"1.5px solid #fecaca", background:"#fff5f5", color:"#ef4444", cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>
                        취소
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setSelectedSlot(slot)}
                      className="hy-btn hy-btn-primary"
                      style={{ fontSize:12, padding:"5px 14px" }}>
                      신청하기
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={() => deleteSlot(slot.id)}
                      style={{ marginTop:4, display:"block", fontSize:10, padding:"2px 8px", borderRadius:999, border:"1.5px solid #e5e7eb", background:"#fff", color:"#9ca3af", cursor:"pointer", fontFamily:"inherit" }}>
                      슬롯 삭제
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* 신청 모달 */}
      {selectedSlot && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }}>
          <div style={{ background:"#fff", borderRadius:24, padding:"28px 26px", maxWidth:420, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontSize:17, fontWeight:900, color:"var(--text)", margin:"0 0 6px" }}>1차 상담 신청</h3>
            <p style={{ fontSize:13, color:"var(--text-muted)", margin:"0 0 20px" }}>
              📅 {fmtDate(selectedSlot.date)} {selectedSlot.time}
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <input placeholder="이름 *" value={sName} onChange={e => setSName(e.target.value)} className="hy-input" />
                <input placeholder="학번 *" value={sNo} onChange={e => setSNo(e.target.value)} className="hy-input" />
              </div>
              <textarea placeholder="상담 내용/사유 (선택)" value={sReason} onChange={e => setSReason(e.target.value)}
                className="hy-input" style={{ minHeight:80, resize:"vertical" }} />
              <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, color:"var(--text-muted)", fontWeight:600 }}>
                <input type="checkbox" checked={sPrivate} onChange={e => setSPrivate(e.target.checked)} />
                🔒 비밀 상담 (이름 비공개)
              </label>
              <div style={{ display:"flex", gap:8, marginTop:4 }}>
                <button onClick={submitApp} disabled={submitting}
                  className="hy-btn hy-btn-primary" style={{ flex:1, fontSize:14 }}>
                  {submitting ? "신청 중..." : "신청하기"}
                </button>
                <button onClick={() => setSelectedSlot(null)}
                  className="hy-btn" style={{ flex:1, fontSize:14 }}>
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 관리자 신청 현황 */}
      {isAdmin && applications.length > 0 && (
        <div className="hy-card" style={{ padding:"20px 22px" }}>
          <h3 style={{ fontSize:15, fontWeight:800, color:"var(--text)", margin:"0 0 14px" }}>📋 신청 현황 (관리자)</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {applications.map(app => {
              const slot = slots.find(s => s.id === app.slot_id);
              return (
                <div key={app.id} style={{ padding:"12px 16px", borderRadius:12, background:"#fafafa", border:"1.5px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                  <div>
                    <div style={{ fontWeight:800, fontSize:14, color:"var(--text)" }}>
                      {app.name} ({app.student_no}) {app.is_private && "🔒"}
                    </div>
                    <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>
                      {slot ? `${fmtDate(slot.date)} ${slot.time}` : ""} {app.reason && `· ${app.reason}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
