"use client";

import { useEffect, useState } from "react";
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
  file_type: "예상문제" | "학습자료" | "쪽지시험";
};

const ADMIN_PW = "hyfl2025";

function toISODateKST() {
  const k = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${k.getFullYear()}-${String(k.getMonth()+1).padStart(2,"0")}-${String(k.getDate()).padStart(2,"0")}`;
}

export default function MentorPage() {
  const [logs, setLogs] = useState<MentorLog[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [tab, setTab] = useState<"mentors"|"logs"|"resources">("mentors");
  const [filterSubject, setFilterSubject] = useState("전체");

  // 로그 작성
  const [lSubject,  setLSubject]  = useState(MENTORS[0].subject);
  const [lMentor,   setLMentor]   = useState("");
  const [lDate,     setLDate]     = useState(toISODateKST());
  const [lActivity, setLActivity] = useState("");
  const [lContent,  setLContent]  = useState("");
  const [lLink,     setLLink]     = useState("");
  const [lOpen,     setLOpen]     = useState(false);
  const [saving,    setSaving]    = useState(false);

  // 자료 공유
  const [rSubject, setRSubject] = useState(MENTORS[0].subject);
  const [rTitle,   setRTitle]   = useState("");
  const [rDesc,    setRDesc]    = useState("");
  const [rLink,    setRLink]    = useState("");
  const [rType,    setRType]    = useState<Resource["file_type"]>("예상문제");
  const [rOpen,    setROpen]    = useState(false);

  const [pw, setPw] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  async function load() {
    const { data: ld } = await supabase.from("mentor_logs").select("*").order("date", { ascending: false });
    const { data: rd } = await supabase.from("mentor_resources").select("*").order("created_at", { ascending: false });
    setLogs((ld as MentorLog[]) ?? []);
    setResources((rd as Resource[]) ?? []);
  }

  useEffect(() => { load(); }, []);

  async function addLog() {
    if (!lMentor || !lContent.trim() || !lActivity.trim()) { alert("멘토, 활동유형, 내용을 입력하세요"); return; }
    setSaving(true);
    await supabase.from("mentor_logs").insert({
      subject: lSubject, mentor_name: lMentor, date: lDate,
      activity: lActivity.trim(), content: lContent.trim(), resource_link: lLink.trim() || null,
    });
    setSaving(false);
    setLContent(""); setLActivity(""); setLLink(""); setLOpen(false);
    await load();
  }

  async function addResource() {
    if (!rTitle.trim()) { alert("자료 제목을 입력하세요"); return; }
    await supabase.from("mentor_resources").insert({
      subject: rSubject, title: rTitle.trim(),
      description: rDesc.trim() || null, link: rLink.trim() || null, file_type: rType,
    });
    setRTitle(""); setRDesc(""); setRLink(""); setROpen(false);
    await load();
  }

  const filteredLogs = logs.filter(l => filterSubject === "전체" || l.subject === filterSubject);
  const filteredRes  = resources.filter(r => filterSubject === "전체" || r.subject === filterSubject);

  const FTYPE_STYLE: Record<string, { bg: string; color: string }> = {
    "예상문제": { bg:"#fff7ed", color:"#f97316" },
    "학습자료": { bg:"#eff6ff", color:"#3b82f6" },
    "쪽지시험": { bg:"#fdf4ff", color:"#a855f7" },
  };

  const mentorsForSubject = MENTORS.find(m => m.subject === lSubject)?.mentors ?? [];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* 헤더 */}
      <div style={{ background:"linear-gradient(135deg,#f59e0b 0%,#ef4444 50%,#ec4899 100%)", borderRadius:28, padding:"32px 28px", position:"relative", overflow:"hidden", boxShadow:"0 12px 40px rgba(245,158,11,0.3)" }}>
        {[{w:140,h:140,top:-40,right:-20,op:0.08},{w:70,h:70,bottom:-10,left:60,op:0.07}].map((b,i)=>(
          <div key={i} style={{ position:"absolute",width:b.w,height:b.h,top:b.top,right:b.right,bottom:b.bottom,left:b.left,borderRadius:"50%",background:"#fff",opacity:b.op }}/>
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
        {([["mentors","멘토 명단 👥"],["logs","활동 기록 📋"],["resources","자료 공유 📂"]] as const).map(([t,label])=>(
          <button key={t} onClick={()=>setTab(t)}
            className={t===tab ? "hy-btn hy-btn-primary" : "hy-btn"}
            style={{ fontSize:13, padding:"8px 18px" }}>
            {label}
          </button>
        ))}
      </div>

      {/* 멘토 명단 탭 */}
      {tab==="mentors" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
          {MENTORS.map(m=>(
            <div key={m.subject} style={{ borderRadius:20, overflow:"hidden", boxShadow:"0 4px 16px rgba(0,0,0,0.08)" }}>
              <div style={{ background:m.color, padding:"16px 20px", display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:24 }}>{m.emoji}</span>
                <div>
                  <h3 style={{ color:"#fff", fontSize:17, fontWeight:900, margin:0 }}>{m.subject}</h3>
                  <p style={{ color:"rgba(255,255,255,0.8)", fontSize:12, margin:0, fontWeight:600 }}>멘토 {m.mentors.length}명</p>
                </div>
              </div>
              <div style={{ background:"#fff", padding:"14px 18px" }}>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {m.mentors.map(name=>(
                    <span key={name} style={{ padding:"6px 14px", borderRadius:999, background:"#fdf2f8", color:"var(--primary)", fontWeight:800, fontSize:13, border:"1.5px solid #f9d0ea" }}>
                      {name}
                    </span>
                  ))}
                </div>
                <div style={{ marginTop:12, padding:"8px 12px", borderRadius:10, background:"#fafafa", border:"1px solid var(--border)" }}>
                  <p style={{ fontSize:11, color:"var(--text-subtle)", margin:0, fontWeight:600 }}>
                    활동 기록: {logs.filter(l=>l.subject===m.subject).length}건 · 공유 자료: {resources.filter(r=>r.subject===m.subject).length}개
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 활동 기록 탭 */}
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
              {lOpen ? "닫기" : "✏️ 활동 기록"}
            </button>
          </div>

          {lOpen && (
            <div className="hy-card" style={{ padding:"20px 22px" }}>
              <h3 style={{ fontSize:15,fontWeight:800,color:"var(--text)",margin:"0 0 14px" }}>멘토 활동 기록 작성</h3>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10 }}>
                  <select value={lSubject} onChange={e=>{setLSubject(e.target.value);setLMentor("");}} className="hy-input" style={{ cursor:"pointer" }}>
                    {MENTORS.map(m=><option key={m.subject} value={m.subject}>{m.subject}</option>)}
                  </select>
                  <select value={lMentor} onChange={e=>setLMentor(e.target.value)} className="hy-input" style={{ cursor:"pointer" }}>
                    <option value="">멘토 선택 *</option>
                    {mentorsForSubject.map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                  <input type="date" value={lDate} onChange={e=>setLDate(e.target.value)} className="hy-input"/>
                  <input placeholder="활동 유형 (예: 질문 답변, 자료 배포)" value={lActivity} onChange={e=>setLActivity(e.target.value)} className="hy-input"/>
                </div>
                <textarea placeholder="활동 내용 *" value={lContent} onChange={e=>setLContent(e.target.value)}
                  className="hy-input" style={{ minHeight:90,resize:"vertical" }}/>
                <input placeholder="관련 자료 링크 (선택)" value={lLink} onChange={e=>setLLink(e.target.value)} className="hy-input"/>
                <button onClick={addLog} disabled={saving} className="hy-btn hy-btn-primary" style={{ fontSize:13,alignSelf:"flex-start" }}>
                  {saving ? "저장 중..." : "기록 저장"}
                </button>
              </div>
            </div>
          )}

          {filteredLogs.length === 0 ? (
            <div className="hy-card" style={{ padding:"40px",textAlign:"center" }}>
              <p style={{ fontSize:14,color:"var(--text-subtle)",fontWeight:600 }}>아직 활동 기록이 없어요 📋</p>
            </div>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {filteredLogs.map(l=>{
                const m = MENTORS.find(x=>x.subject===l.subject);
                return (
                  <div key={l.id} className="hy-card" style={{ padding:"16px 20px" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap" }}>
                      <span style={{ fontSize:12,fontWeight:800,padding:"3px 10px",borderRadius:999,background:"var(--primary-light)",color:"var(--primary)" }}>
                        {m?.emoji} {l.subject}
                      </span>
                      <span style={{ fontSize:13,fontWeight:800,color:"var(--text)" }}>{l.mentor_name}</span>
                      <span style={{ fontSize:12,color:"var(--text-subtle)" }}>· {l.date} · {l.activity}</span>
                    </div>
                    <p style={{ fontSize:14,color:"var(--text)",lineHeight:1.7,margin:0,whiteSpace:"pre-wrap" }}>{l.content}</p>
                    {l.resource_link && (
                      <a href={l.resource_link} target="_blank" rel="noopener noreferrer"
                        style={{ display:"inline-flex",alignItems:"center",gap:4,marginTop:8,fontSize:12,fontWeight:700,color:"#6366f1",textDecoration:"none",padding:"4px 12px",borderRadius:999,background:"#eff6ff",border:"1px solid #c7d2fe" }}>
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

      {/* 자료 공유 탭 */}
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
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10 }}>
                  <select value={rSubject} onChange={e=>setRSubject(e.target.value)} className="hy-input" style={{ cursor:"pointer" }}>
                    {MENTORS.map(m=><option key={m.subject} value={m.subject}>{m.subject}</option>)}
                  </select>
                  <select value={rType} onChange={e=>setRType(e.target.value as Resource["file_type"])} className="hy-input" style={{ cursor:"pointer" }}>
                    <option value="예상문제">예상문제</option>
                    <option value="학습자료">학습자료</option>
                    <option value="쪽지시험">쪽지시험</option>
                  </select>
                </div>
                <input placeholder="자료 제목 *" value={rTitle} onChange={e=>setRTitle(e.target.value)} className="hy-input"/>
                <input placeholder="설명 (선택)" value={rDesc} onChange={e=>setRDesc(e.target.value)} className="hy-input"/>
                <input placeholder="자료 링크 (Google Drive, Docs 등)" value={rLink} onChange={e=>setRLink(e.target.value)} className="hy-input"/>
                <button onClick={addResource} className="hy-btn hy-btn-primary" style={{ fontSize:13,alignSelf:"flex-start" }}>공유하기</button>
              </div>
            </div>
          )}

          {filteredRes.length === 0 ? (
            <div className="hy-card" style={{ padding:"40px",textAlign:"center" }}>
              <p style={{ fontSize:14,color:"var(--text-subtle)",fontWeight:600 }}>공유된 자료가 없어요 📂</p>
            </div>
          ) : (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10 }}>
              {filteredRes.map(r=>{
                const m = MENTORS.find(x=>x.subject===r.subject);
                const ts = FTYPE_STYLE[r.file_type];
                return (
                  <div key={r.id} className="hy-card" style={{ padding:"16px 18px" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:8,flexWrap:"wrap" }}>
                      <span style={{ fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:999,background:ts.bg,color:ts.color }}>{r.file_type}</span>
                      <span style={{ fontSize:12,fontWeight:700,color:"var(--text-muted)" }}>{m?.emoji} {r.subject}</span>
                    </div>
                    <h4 style={{ fontSize:14,fontWeight:800,color:"var(--text)",margin:"0 0 4px" }}>{r.title}</h4>
                    {r.description && <p style={{ fontSize:12,color:"var(--text-muted)",margin:"0 0 8px" }}>{r.description}</p>}
                    {r.link && (
                      <a href={r.link} target="_blank" rel="noopener noreferrer"
                        style={{ display:"inline-flex",alignItems:"center",gap:4,fontSize:12,fontWeight:700,color:"#6366f1",textDecoration:"none",padding:"5px 12px",borderRadius:999,background:"#eff6ff",border:"1px solid #c7d2fe" }}>
                        📎 자료 열기 →
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
