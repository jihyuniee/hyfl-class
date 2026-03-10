"use client";

import { useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type StudentContact = {
  id: string;
  student_no: string;
  name: string;
  student_phone: string;
  parent_phone: string;
  parent_relation: string | null;
  parent_name: string | null;
  confirmed: boolean;
};

function formatPhone(p: string) {
  if (!p) return "-";
  const digits = p.replace(/\D/g, "");
  return digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
}

export default function ContactsPage() {
  const [step, setStep] = useState<"login" | "myinfo" | "admin">("login");

  // 로그인 폼
  const [inputNo,    setInputNo]    = useState("");
  const [inputName,  setInputName]  = useState("");
  const [inputLast4, setInputLast4] = useState("");
  const [loginError, setLoginError] = useState("");

  // 내 정보
  const [myInfo, setMyInfo] = useState<StudentContact | null>(null);

  // 수정 폼
  const [editStudentPhone, setEditStudentPhone] = useState("");
  const [editParentPhone,  setEditParentPhone]  = useState("");
  const [relation,         setRelation]         = useState("");
  const [parentName,       setParentName]       = useState("");
  const [editMode,         setEditMode]         = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [saved,            setSaved]            = useState(false);

  // 관리자
  const [adminPw,  setAdminPw]  = useState("");
  const [allData,  setAllData]  = useState<StudentContact[]>([]);

  async function handleLogin() {
    setLoginError("");
    if (!inputNo.trim() || !inputName.trim() || !inputLast4.trim()) {
      setLoginError("모든 항목을 입력해주세요"); return;
    }
    if (inputLast4.length !== 4) {
      setLoginError("전화번호 뒤 4자리를 정확히 입력해주세요"); return;
    }
    const { data, error } = await supabase
      .from("student_contacts")
      .select("*")
      .eq("student_no", inputNo.trim())
      .eq("name", inputName.trim())
      .single();

    if (error || !data) { setLoginError("학번 또는 이름이 일치하지 않아요"); return; }

    const last4 = (data.student_phone as string).replace(/\D/g,"").slice(-4);
    if (last4 !== inputLast4.trim()) {
      setLoginError("전화번호 뒤 4자리가 일치하지 않아요"); return;
    }

    const d = data as StudentContact;
    setMyInfo(d);
    setEditStudentPhone(d.student_phone);
    setEditParentPhone(d.parent_phone);
    setRelation(d.parent_relation ?? "");
    setParentName(d.parent_name ?? "");
    setStep("myinfo");
  }

  async function handleSave() {
    if (!myInfo) return;
    if (!relation) { alert("엄마/아빠를 선택해주세요"); return; }
    const sPhone = editStudentPhone.replace(/\D/g,"");
    const pPhone = editParentPhone.replace(/\D/g,"");
    if (sPhone.length < 10) { alert("학생 전화번호를 올바르게 입력해주세요"); return; }
    if (pPhone.length < 10) { alert("학부모 전화번호를 올바르게 입력해주세요"); return; }
    setSaving(true);
    await supabase.from("student_contacts").update({
      student_phone: sPhone,
      parent_phone: pPhone,
      parent_relation: relation,
      parent_name: parentName.trim() || null,
      confirmed: true,
    }).eq("id", myInfo.id);
    setSaving(false);
    setSaved(true);
    setEditMode(false);
    setMyInfo(prev => prev ? {
      ...prev,
      student_phone: sPhone,
      parent_phone: pPhone,
      parent_relation: relation,
      parent_name: parentName,
      confirmed: true,
    } : prev);
  }

  async function loadAll() {
    const { data } = await supabase
      .from("student_contacts")
      .select("*")
      .order("student_no");
    setAllData((data as StudentContact[]) ?? []);
  }

  function handleAdminLogin() {
    if (adminPw === "hyfl2025") { setStep("admin"); loadAll(); }
    else alert("비밀번호가 틀렸어요");
  }

  function logout() {
    setStep("login"); setMyInfo(null);
    setInputNo(""); setInputName(""); setInputLast4("");
    setSaved(false); setEditMode(false);
  }

  // ── 로그인 ──
  if (step === "login") return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div className="hy-hero">
        <div style={{ display:"inline-flex", alignItems:"center", background:"rgba(255,255,255,0.2)", backdropFilter:"blur(8px)", borderRadius:999, padding:"4px 14px", marginBottom:12, border:"1px solid rgba(255,255,255,0.3)" }}>
          <span style={{ fontSize:12, color:"#fff", fontWeight:700 }}>🔒 개인정보 보호</span>
        </div>
        <h1 style={{ color:"#fff", fontSize:"clamp(20px,4vw,30px)", fontWeight:900, margin:"0 0 8px" }}>📞 연락처 확인</h1>
        <p style={{ color:"rgba(255,255,255,0.85)", fontSize:13, margin:0, fontWeight:500, lineHeight:1.7 }}>
          본인 인증 후 연락처를 확인하고<br/>잘못된 번호는 직접 수정할 수 있어요
        </p>
      </div>

      <div className="hy-card" style={{ padding:"28px 24px", maxWidth:420, margin:"0 auto", width:"100%" }}>
        <h2 style={{ fontSize:16, fontWeight:900, color:"var(--text)", margin:"0 0 6px" }}>🔐 본인 인증</h2>
        <p style={{ fontSize:13, color:"var(--text-muted)", margin:"0 0 20px", lineHeight:1.6 }}>
          학번, 이름, 내 전화번호 뒤 4자리를 입력하면<br/>본인 정보만 확인할 수 있어요.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {[
            { label:"학번", placeholder:"예: 20201",  value:inputNo,    set:setInputNo,    type:"text",     mode:"numeric" },
            { label:"이름", placeholder:"예: 강지우", value:inputName,  set:setInputName,  type:"text",     mode:"text" },
            { label:"내 전화번호 뒤 4자리", placeholder:"예: 1234", value:inputLast4, set:(v:string)=>setInputLast4(v.replace(/\D/g,"").slice(0,4)), type:"text", mode:"numeric" },
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:5 }}>{f.label}</label>
              <input placeholder={f.placeholder} value={f.value}
                onChange={e => f.set(e.target.value)}
                onKeyDown={e => e.key==="Enter" && handleLogin()}
                className="hy-input" inputMode={f.mode as "numeric"|"text"} maxLength={f.label.includes("4자리") ? 4 : undefined}/>
            </div>
          ))}
          {loginError && <p style={{ fontSize:13, color:"#ef4444", fontWeight:700, margin:0 }}>⚠️ {loginError}</p>}
          <button onClick={handleLogin} className="hy-btn hy-btn-primary" style={{ fontSize:14, marginTop:4 }}>확인하기</button>
        </div>
      </div>

      <div className="hy-card" style={{ padding:"18px 22px", maxWidth:420, margin:"0 auto", width:"100%", background:"#f9fafb" }}>
        <p style={{ fontSize:12, fontWeight:700, color:"var(--text-subtle)", margin:"0 0 10px" }}>👩‍🏫 선생님 전용</p>
        <div style={{ display:"flex", gap:8 }}>
          <input type="password" placeholder="관리자 비밀번호" value={adminPw}
            onChange={e=>setAdminPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAdminLogin()}
            className="hy-input" style={{ flex:1 }}/>
          <button onClick={handleAdminLogin} className="hy-btn" style={{ fontSize:13, whiteSpace:"nowrap" }}>전체 보기</button>
        </div>
      </div>
    </div>
  );

  // ── 내 정보 ──
  if (step === "myinfo" && myInfo) return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div className="hy-hero">
        <h1 style={{ color:"#fff", fontSize:"clamp(20px,4vw,28px)", fontWeight:900, margin:"0 0 6px" }}>📞 내 연락처 확인</h1>
        <p style={{ color:"rgba(255,255,255,0.85)", fontSize:13, margin:0, fontWeight:600 }}>{myInfo.student_no} {myInfo.name}</p>
      </div>

      {saved && (
        <div style={{ padding:"12px 18px", borderRadius:14, background:"#f0fdf4", border:"1.5px solid #86efac", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:18 }}>✅</span>
          <p style={{ fontSize:13, color:"#16a34a", fontWeight:700, margin:0 }}>저장 완료! 감사해요 🙂</p>
        </div>
      )}

      <div className="hy-card" style={{ padding:"22px 24px" }}>
        {/* 헤더 */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ fontSize:15, fontWeight:900, color:"var(--text)", margin:0 }}>📋 연락처 정보</h3>
          <button onClick={() => setEditMode(o => !o)}
            style={{ padding:"6px 14px", borderRadius:999, border:"1.5px solid var(--primary)", background: editMode ? "var(--primary)" : "#fff",
              color: editMode ? "#fff" : "var(--primary)", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            {editMode ? "✕ 취소" : "✏️ 수정하기"}
          </button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* 학생 전화번호 */}
          <div style={{ background:"#f9fafb", borderRadius:14, padding:"14px 16px" }}>
            <p style={{ fontSize:11, fontWeight:800, color:"var(--text-subtle)", margin:"0 0 8px", textTransform:"uppercase", letterSpacing:"0.05em" }}>📱 내 전화번호</p>
            {editMode ? (
              <input value={editStudentPhone} onChange={e=>setEditStudentPhone(e.target.value)}
                placeholder="010-0000-0000" className="hy-input" inputMode="numeric"/>
            ) : (
              <p style={{ fontSize:18, fontWeight:900, color:"var(--text)", margin:0 }}>{formatPhone(myInfo.student_phone)}</p>
            )}
            {!editMode && <p style={{ fontSize:12, color:"var(--text-subtle)", margin:"6px 0 0" }}>번호가 다르면 ✏️ 수정하기를 눌러주세요</p>}
          </div>

          {/* 학부모 전화번호 */}
          <div style={{ background:"#f9fafb", borderRadius:14, padding:"14px 16px" }}>
            <p style={{ fontSize:11, fontWeight:800, color:"var(--text-subtle)", margin:"0 0 8px", textTransform:"uppercase", letterSpacing:"0.05em" }}>📞 학부모 전화번호</p>
            {editMode ? (
              <input value={editParentPhone} onChange={e=>setEditParentPhone(e.target.value)}
                placeholder="010-0000-0000" className="hy-input" inputMode="numeric"/>
            ) : (
              <p style={{ fontSize:18, fontWeight:900, color:"var(--text)", margin:0 }}>{formatPhone(myInfo.parent_phone)}</p>
            )}
          </div>

          {/* 학부모 관계 + 성함 */}
          <div style={{ borderTop:"1.5px solid var(--border)", paddingTop:16 }}>
            <p style={{ fontSize:13, fontWeight:800, color:"var(--text)", margin:"0 0 12px" }}>위 학부모 번호는 누구의 번호인가요?</p>
            <div style={{ display:"flex", gap:8, marginBottom:12 }}>
              {["엄마","아빠","기타"].map(r => (
                <button key={r} onClick={()=>setRelation(r)}
                  style={{ flex:1, padding:"12px 0", borderRadius:14, border:"2px solid", cursor:"pointer", fontFamily:"inherit", fontSize:14, fontWeight:800, transition:"all 0.15s",
                    borderColor: relation===r ? "var(--primary)" : "var(--border)",
                    background: relation===r ? "var(--primary-light)" : "#fff",
                    color: relation===r ? "var(--primary)" : "var(--text-muted)" }}>
                  {r==="엄마"?"👩 엄마":r==="아빠"?"👨 아빠":"👤 기타"}
                </button>
              ))}
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:5 }}>
                {relation ? `${relation} 성함` : "학부모 성함"} <span style={{ color:"var(--text-subtle)" }}>(선택)</span>
              </label>
              <input placeholder={relation ? `${relation} 성함 입력` : "먼저 위에서 선택해주세요"}
                value={parentName} onChange={e=>setParentName(e.target.value)}
                className="hy-input" disabled={!relation}/>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving || !relation}
            className="hy-btn hy-btn-primary" style={{ fontSize:14, marginTop:4 }}>
            {saving ? "저장 중..." : "💾 확인 완료 & 저장"}
          </button>
        </div>
      </div>

      <button onClick={logout} className="hy-btn" style={{ fontSize:13 }}>← 나가기</button>
    </div>
  );

  // ── 관리자 ──
  if (step === "admin") return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div className="hy-hero">
        <h1 style={{ color:"#fff", fontSize:"clamp(20px,4vw,28px)", fontWeight:900, margin:"0 0 6px" }}>👩‍🏫 연락처 전체 현황</h1>
        <p style={{ color:"rgba(255,255,255,0.85)", fontSize:13, margin:0, fontWeight:600 }}>
          확인 완료: {allData.filter(d=>d.confirmed).length} / {allData.length}명
        </p>
      </div>

      <div className="hy-card" style={{ padding:"18px 22px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
          <span style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>확인 완료 현황</span>
          <span style={{ fontSize:13, fontWeight:800, color:"var(--primary)" }}>{allData.filter(d=>d.confirmed).length}/{allData.length}명</span>
        </div>
        <div style={{ height:10, borderRadius:999, background:"#f3e8ff", overflow:"hidden" }}>
          <div style={{ height:"100%", borderRadius:999, background:"linear-gradient(90deg,var(--primary),var(--accent))",
            width:`${allData.length ? allData.filter(d=>d.confirmed).length/allData.length*100 : 0}%`, transition:"width 0.5s" }}/>
        </div>
        <div style={{ display:"flex", gap:16, marginTop:10 }}>
          <span style={{ fontSize:12, color:"#16a34a", fontWeight:700 }}>✅ 완료: {allData.filter(d=>d.confirmed).length}명</span>
          <span style={{ fontSize:12, color:"#f59e0b", fontWeight:700 }}>⏳ 미완료: {allData.filter(d=>!d.confirmed).length}명</span>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {allData.map(d => (
          <div key={d.id} className="hy-card" style={{ padding:"16px 20px", borderLeft:`3px solid ${d.confirmed?"#22c55e":"#f59e0b"}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:11, padding:"2px 8px", borderRadius:999, fontWeight:800,
                  background:d.confirmed?"#f0fdf4":"#fffbeb", color:d.confirmed?"#16a34a":"#f59e0b" }}>
                  {d.confirmed?"✅ 확인완료":"⏳ 미확인"}
                </span>
                <span style={{ fontSize:15, fontWeight:900, color:"var(--text)" }}>{d.student_no} {d.name}</span>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:8 }}>
              <div style={{ background:"#f9fafb", borderRadius:10, padding:"10px 12px" }}>
                <p style={{ fontSize:11, color:"var(--text-subtle)", fontWeight:700, margin:"0 0 3px" }}>📱 학생 번호</p>
                <p style={{ fontSize:13, fontWeight:800, color:"var(--text)", margin:0 }}>{formatPhone(d.student_phone)}</p>
              </div>
              <div style={{ background:"#f9fafb", borderRadius:10, padding:"10px 12px" }}>
                <p style={{ fontSize:11, color:"var(--text-subtle)", fontWeight:700, margin:"0 0 3px" }}>📞 학부모 번호</p>
                <p style={{ fontSize:13, fontWeight:800, color:"var(--text)", margin:0 }}>{formatPhone(d.parent_phone)}</p>
              </div>
              {d.confirmed && (
                <div style={{ background:"#f0fdf4", borderRadius:10, padding:"10px 12px" }}>
                  <p style={{ fontSize:11, color:"#16a34a", fontWeight:700, margin:"0 0 3px" }}>
                    {d.parent_relation==="엄마"?"👩":d.parent_relation==="아빠"?"👨":"👤"} {d.parent_relation ?? "-"}
                  </p>
                  <p style={{ fontSize:13, fontWeight:800, color:"var(--text)", margin:0 }}>{d.parent_name ?? "성함 미입력"}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button onClick={()=>{setStep("login");setAdminPw("");}} className="hy-btn" style={{ fontSize:13 }}>← 나가기</button>
    </div>
  );

  return null;
}
