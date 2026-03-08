"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

const STUDENTS = [
  { no: "20201", name: "강지우" },
  { no: "20202", name: "김은솔" },
  { no: "20203", name: "김태현" },
  { no: "20204", name: "김하연" },
  { no: "20205", name: "김혜민" },
  { no: "20206", name: "박민석" },
  { no: "20207", name: "박우진" },
  { no: "20208", name: "성연준" },
  { no: "20209", name: "손정연" },
  { no: "20210", name: "송민주" },
  { no: "20211", name: "심지안" },
  { no: "20212", name: "양효승" },
  { no: "20213", name: "유다현" },
  { no: "20214", name: "윤혜림" },
  { no: "20215", name: "이승지" },
  { no: "20216", name: "이시원" },
  { no: "20217", name: "이조은" },
  { no: "20218", name: "장지현" },
  { no: "20219", name: "전주하" },
  { no: "20220", name: "정은지" },
  { no: "20221", name: "주보민" },
  { no: "20222", name: "최안아" },
  { no: "20223", name: "현서정" },
];

const DAYS = ["월","화","수","목","금"] as const;
type Day = typeof DAYS[number];

type StudyRecord = {
  id: string;
  student_no: string;
  days: Day[];
};

const ADMIN_PW = "hyfl2025";

export default function StudyPage() {
  const [records, setRecords]   = useState<StudyRecord[]>([]);
  const [myRecord, setMyRecord] = useState<StudyRecord | null>(null);
  const [selected, setSelected] = useState<Day[]>([]);
  const [saving,   setSaving]   = useState(false);
  const [pw,       setPw]       = useState("");
  const [isAdmin,  setIsAdmin]  = useState(false);
  const [tab,      setTab]      = useState<"apply"|"board">("apply");

  // 내 학생 선택
  const [myNo, setMyNo] = useState("");

  async function load() {
    const { data } = await supabase.from("study_applications").select("*");
    setRecords((data as StudyRecord[]) ?? []);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!myNo) { setMyRecord(null); setSelected([]); return; }
    const found = records.find(r => r.student_no === myNo);
    setMyRecord(found ?? null);
    setSelected(found?.days ?? []);
  }, [myNo, records]);

  function toggleDay(d: Day) {
    if (myRecord) return; // 이미 신청 완료 → 수정 불가
    setSelected(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  async function submit() {
    if (!myNo) { alert("먼저 본인을 선택해주세요"); return; }
    if (selected.length === 0) { alert("요일을 최소 1개 선택해주세요"); return; }
    if (!confirm(`${STUDENTS.find(s=>s.no===myNo)?.name}님 야자 신청: ${selected.join(", ")} — 신청 후 변경이 불가능합니다. 신청하시겠어요?`)) return;
    setSaving(true);
    const { error } = await supabase.from("study_applications").insert({
      student_no: myNo,
      days: selected,
    });
    setSaving(false);
    if (error) { alert(error.message); return; }
    await load();
    alert("야자 신청 완료! 변경이 불가능하니 참고해요 📚");
  }

  async function adminDelete(id: string, name: string) {
    if (!confirm(`${name} 신청을 삭제할까요?`)) return;
    await supabase.from("study_applications").delete().eq("id", id);
    await load();
  }

  // 통계
  const dayCount: Record<Day, number> = { 월:0, 화:0, 수:0, 목:0, 금:0 };
  records.forEach(r => r.days.forEach(d => { dayCount[d]++; }));
  const maxCount = Math.max(...Object.values(dayCount), 1);

  const DAY_COLORS: Record<Day, string> = {
    월:"linear-gradient(135deg,#818cf8,#a78bfa)",
    화:"linear-gradient(135deg,#f472b6,#fb923c)",
    수:"linear-gradient(135deg,#34d399,#3b82f6)",
    목:"linear-gradient(135deg,#fb923c,#fbbf24)",
    금:"linear-gradient(135deg,#f472b6,#a78bfa)",
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* 헤더 */}
      <div style={{
        background:"linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 50%,#4f46e5 100%)",
        borderRadius:28, padding:"32px 28px",
        position:"relative", overflow:"hidden",
        boxShadow:"0 12px 40px rgba(30,58,95,0.4)",
      }}>
        {[{w:160,h:160,top:-50,right:-30,op:0.08},{w:80,h:80,bottom:-10,left:60,op:0.06}].map((b,i)=>(
          <div key={i} style={{ position:"absolute",width:b.w,height:b.h,top:b.top,right:b.right,bottom:b.bottom,left:b.left,borderRadius:"50%",background:"#fff",opacity:b.op }}/>
        ))}
        <div style={{ position:"relative" }}>
          <div style={{ display:"inline-flex",alignItems:"center",background:"rgba(255,255,255,0.15)",backdropFilter:"blur(8px)",borderRadius:999,padding:"4px 14px",marginBottom:12,border:"1px solid rgba(255,255,255,0.2)" }}>
            <span style={{ fontSize:12,color:"#fff",fontWeight:700 }}>📚 야간자율학습</span>
          </div>
          <h1 style={{ color:"#fff",fontSize:"clamp(22px,4vw,32px)",fontWeight:900,margin:"0 0 8px",letterSpacing:"-0.5px" }}>
            야자 신청
          </h1>
          <p style={{ color:"rgba(255,255,255,0.8)",fontSize:13,margin:0,fontWeight:500 }}>
            요일별로 신청해요. <span style={{ color:"#fbbf24",fontWeight:700 }}>한번 신청하면 변경이 불가능</span>하니 신중하게!
          </p>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display:"flex", gap:8 }}>
        {([["apply","야자 신청 📝"],["board","전체 현황 📊"]] as const).map(([t,label])=>(
          <button key={t} onClick={()=>setTab(t)}
            className={t===tab ? "hy-btn hy-btn-primary" : "hy-btn"}
            style={{ fontSize:13, padding:"8px 20px" }}>
            {label}
          </button>
        ))}
      </div>

      {/* 야자 신청 탭 */}
      {tab==="apply" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* 학생 선택 */}
          <div className="hy-card" style={{ padding:"20px 22px" }}>
            <p style={{ fontSize:12,fontWeight:800,color:"var(--text-subtle)",margin:"0 0 10px",letterSpacing:"0.06em",textTransform:"uppercase" }}>
              본인 선택
            </p>
            <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
              {STUDENTS.map(s => {
                const done = records.some(r => r.student_no === s.no);
                return (
                  <button key={s.no} onClick={() => setMyNo(s.no)}
                    style={{
                      padding:"7px 14px", borderRadius:999, border:"1.5px solid",
                      borderColor: myNo===s.no ? "#1d4ed8" : done ? "#bbf7d0" : "var(--border)",
                      background: myNo===s.no ? "#dbeafe" : done ? "#f0fdf4" : "#fff",
                      color: myNo===s.no ? "#1d4ed8" : done ? "#22c55e" : "var(--text-muted)",
                      fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit",
                      transition:"all 0.12s",
                    }}>
                    {s.name} {done ? "✅" : ""}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 요일 선택 */}
          {myNo && (
            <div className="hy-card" style={{ padding:"22px 24px" }}>
              {myRecord ? (
                <>
                  <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16,padding:"12px 16px",background:"#f0fdf4",borderRadius:14,border:"1.5px solid #86efac" }}>
                    <span style={{ fontSize:20 }}>✅</span>
                    <div>
                      <p style={{ fontSize:13,fontWeight:800,color:"#22c55e",margin:"0 0 2px" }}>신청 완료</p>
                      <p style={{ fontSize:12,color:"var(--text-muted)",margin:0 }}>변경이 불가능해요</p>
                    </div>
                  </div>
                  <p style={{ fontSize:13,fontWeight:700,color:"var(--text-muted)",margin:"0 0 12px" }}>
                    {STUDENTS.find(s=>s.no===myNo)?.name}님의 야자 요일
                  </p>
                  <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                    {DAYS.map(d=>(
                      <div key={d} style={{
                        width:52,height:52,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",
                        fontWeight:900,fontSize:16,
                        background: myRecord.days.includes(d) ? DAY_COLORS[d] : "#f3f4f6",
                        color: myRecord.days.includes(d) ? "#fff" : "#d1d5db",
                        boxShadow: myRecord.days.includes(d) ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
                      }}>{d}</div>
                    ))}
                  </div>
                  <p style={{ fontSize:13,color:"var(--text-muted)",marginTop:12,fontWeight:600 }}>
                    주 {myRecord.days.length}회 야자 신청
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize:14,fontWeight:800,color:"var(--text)",margin:"0 0 6px" }}>
                    {STUDENTS.find(s=>s.no===myNo)?.name}님, 야자할 요일을 선택해요
                  </p>
                  <p style={{ fontSize:12,color:"#ef4444",fontWeight:700,margin:"0 0 16px" }}>
                    ⚠️ 한번 신청하면 변경이 불가능해요. 신중하게 선택해줘요!
                  </p>
                  <div style={{ display:"flex",gap:10,flexWrap:"wrap",marginBottom:20 }}>
                    {DAYS.map(d=>(
                      <button key={d} onClick={()=>toggleDay(d)}
                        style={{
                          width:56,height:56,borderRadius:14,border:"2px solid",
                          borderColor: selected.includes(d) ? "#1d4ed8" : "var(--border)",
                          background: selected.includes(d) ? DAY_COLORS[d] : "#fff",
                          color: selected.includes(d) ? "#fff" : "var(--text-muted)",
                          fontWeight:900,fontSize:18,cursor:"pointer",fontFamily:"inherit",
                          transition:"all 0.15s",
                          boxShadow: selected.includes(d) ? "0 4px 14px rgba(29,78,216,0.3)" : "none",
                        }}>
                        {d}
                      </button>
                    ))}
                  </div>
                  {selected.length > 0 && (
                    <p style={{ fontSize:13,color:"#1d4ed8",fontWeight:700,margin:"0 0 14px" }}>
                      선택: {selected.join(", ")} (주 {selected.length}회)
                    </p>
                  )}
                  <button onClick={submit} disabled={saving || selected.length===0}
                    style={{
                      padding:"12px 28px",borderRadius:14,border:"none",
                      background: selected.length>0 ? "linear-gradient(135deg,#1d4ed8,#4f46e5)" : "#e5e7eb",
                      color: selected.length>0 ? "#fff" : "#9ca3af",
                      fontWeight:800,fontSize:14,cursor: selected.length>0 ? "pointer" : "default",
                      fontFamily:"inherit",boxShadow: selected.length>0 ? "0 6px 20px rgba(29,78,216,0.3)" : "none",
                    }}>
                    {saving ? "신청 중..." : "야자 신청하기 📚"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* 전체 현황 탭 */}
      {tab==="board" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* 요일별 통계 */}
          <div className="hy-card" style={{ padding:"20px 22px" }}>
            <h3 style={{ fontSize:15,fontWeight:800,color:"var(--text)",margin:"0 0 14px" }}>📊 요일별 신청 현황</h3>
            <div style={{ display:"flex",gap:10,alignItems:"flex-end",height:120 }}>
              {DAYS.map(d=>(
                <div key={d} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6 }}>
                  <span style={{ fontSize:13,fontWeight:900,color:"#1d4ed8" }}>{dayCount[d]}</span>
                  <div style={{
                    width:"100%",borderRadius:"8px 8px 0 0",
                    height: `${Math.round((dayCount[d]/maxCount)*80)}px`,
                    minHeight:4,
                    background: DAY_COLORS[d],
                    transition:"height 0.4s",
                  }}/>
                  <span style={{ fontSize:14,fontWeight:900,color:"var(--text)" }}>{d}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop:16,padding:"10px 14px",background:"#eff6ff",borderRadius:12,border:"1.5px solid #bfdbfe" }}>
              <span style={{ fontSize:13,fontWeight:700,color:"#1d4ed8" }}>
                총 {records.length}명 신청 · 평균 주 {records.length>0 ? (records.reduce((s,r)=>s+r.days.length,0)/records.length).toFixed(1) : 0}회
              </span>
            </div>
          </div>

          {/* 전체 명단 */}
          <div className="hy-card" style={{ padding:"20px 22px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8 }}>
              <h3 style={{ fontSize:15,fontWeight:800,color:"var(--text)",margin:0 }}>전체 신청 명단</h3>
              {!isAdmin ? (
                <div style={{ display:"flex",gap:6 }}>
                  <input type="password" placeholder="관리자 PW" value={pw} onChange={e=>setPw(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&setIsAdmin(pw===ADMIN_PW)}
                    className="hy-input" style={{ maxWidth:140,fontSize:12 }} />
                  <button onClick={()=>setIsAdmin(pw===ADMIN_PW)} className="hy-btn" style={{ fontSize:12 }}>확인</button>
                </div>
              ) : (
                <span style={{ fontSize:12,color:"var(--primary)",fontWeight:700 }}>✅ 관리자 모드</span>
              )}
            </div>

            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:"2px solid var(--border)" }}>
                    <th style={{ padding:"8px 12px",textAlign:"left",fontWeight:800,color:"var(--text-muted)",fontSize:12 }}>번호</th>
                    <th style={{ padding:"8px 12px",textAlign:"left",fontWeight:800,color:"var(--text-muted)",fontSize:12 }}>이름</th>
                    {DAYS.map(d=>(
                      <th key={d} style={{ padding:"8px 12px",textAlign:"center",fontWeight:800,color:"var(--text-muted)",fontSize:12 }}>{d}</th>
                    ))}
                    <th style={{ padding:"8px 12px",textAlign:"center",fontWeight:800,color:"#1d4ed8",fontSize:12 }}>합계</th>
                    {isAdmin && <th style={{ padding:"8px 4px",fontSize:11 }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {STUDENTS.map((s,i)=>{
                    const rec = records.find(r=>r.student_no===s.no);
                    return (
                      <tr key={s.no} style={{ borderBottom:"1px solid var(--border)", background: i%2===0?"#fafafa":"#fff" }}>
                        <td style={{ padding:"10px 12px",color:"var(--text-subtle)",fontWeight:700 }}>{i+1}</td>
                        <td style={{ padding:"10px 12px",fontWeight:800,color:"var(--text)" }}>{s.name}</td>
                        {DAYS.map(d=>(
                          <td key={d} style={{ padding:"10px 12px",textAlign:"center" }}>
                            {rec?.days.includes(d) ? (
                              <span style={{ fontSize:16 }}>✅</span>
                            ) : (
                              <span style={{ color:"#e5e7eb",fontSize:14 }}>—</span>
                            )}
                          </td>
                        ))}
                        <td style={{ padding:"10px 12px",textAlign:"center",fontWeight:900,color:"#1d4ed8",fontSize:15 }}>
                          {rec ? rec.days.length : <span style={{ color:"#d1d5db" }}>0</span>}
                        </td>
                        {isAdmin && (
                          <td style={{ padding:"4px" }}>
                            {rec && (
                              <button onClick={()=>adminDelete(rec.id, s.name)}
                                style={{ fontSize:10,padding:"2px 8px",borderRadius:999,border:"1px solid #fecaca",background:"#fff5f5",color:"#ef4444",cursor:"pointer",fontFamily:"inherit" }}>
                                삭제
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop:"2px solid var(--border)",background:"#eff6ff" }}>
                    <td colSpan={2} style={{ padding:"10px 12px",fontWeight:900,color:"#1d4ed8",fontSize:13 }}>요일 합계</td>
                    {DAYS.map(d=>(
                      <td key={d} style={{ padding:"10px 12px",textAlign:"center",fontWeight:900,color:"#1d4ed8",fontSize:14 }}>{dayCount[d]}</td>
                    ))}
                    <td style={{ padding:"10px 12px",textAlign:"center",fontWeight:900,color:"#1d4ed8",fontSize:14 }}>
                      {records.reduce((s,r)=>s+r.days.length,0)}
                    </td>
                    {isAdmin && <td/>}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
