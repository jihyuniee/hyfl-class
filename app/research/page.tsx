"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type Group = {
  id: string;
  name: string;
  topic: string;
  book: string | null;
  members: string;
  created_at: string;
};

type Log = {
  id: string;
  group_id: string;
  created_at: string;
  date: string;
  content: string;
  author: string | null;
  report_link: string | null;
  log_type: "활동일지" | "중간보고" | "최종보고";
};

const ADMIN_PW = "hyfl2025";
const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  "활동일지": { bg: "#eff6ff", color: "#3b82f6" },
  "중간보고": { bg: "#fff7ed", color: "#f97316" },
  "최종보고": { bg: "#fdf4ff", color: "#a855f7" },
};

const STEPS = [
  { title: "문제 발견", desc: "학교생활 속에서 불편하거나 개선이 필요한 문제를 찾아요" },
  { title: "원인 분석", desc: "그 문제가 왜 발생하는지 원인을 깊이 들여다봐요" },
  { title: "자료 조사", desc: "설문, 인터뷰, 데이터 등 근거 자료를 수집해요" },
  { title: "해결 방안 설계", desc: "수집한 근거를 바탕으로 실현 가능한 방안을 만들어요" },
  { title: "결과물 제작", desc: "탐구 과정을 정리해 결과물로 완성해요" },
  { title: "발표 및 공유", desc: "친구들과 결과를 나누고 피드백을 주고받아요" },
];

const SKILLS = [
  { icon: "💡", title: "창의력", desc: "독창적인 아이디어를 만드는 능력" },
  { icon: "🛠️", title: "문제해결력", desc: "실제 해결 방법을 설계하는 능력" },
  { icon: "🤝", title: "협업능력", desc: "팀원들과 함께 문제를 해결하는 능력" },
  { icon: "💬", title: "의사소통능력", desc: "설문, 인터뷰, 발표를 통해 생각을 전달하는 능력" },
  { icon: "🏫", title: "공동체의식", desc: "학교를 더 좋은 공간으로 만들고자 하는 태도" },
];

const GOOD_EXAMPLES = [
  { problem: "교복 만족도 설문조사", steps: ["불편 요소 분석", "개선안 설계"] },
  { problem: "도서관 이용률 조사", steps: ["원인 분석", "이용 활성화 방안 제안"] },
  { problem: "급식 혼잡도 조사", steps: ["데이터 분석", "운영 개선안 제시"] },
];

function toISODateKST() {
  const k = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${k.getFullYear()}-${String(k.getMonth()+1).padStart(2,"0")}-${String(k.getDate()).padStart(2,"0")}`;
}

function getStage(groupLogs: Log[]) {
  if (groupLogs.length === 0) return { label: "문제 발견 단계", color: "#94a3b8" };
  if (groupLogs.some(l => l.log_type === "최종보고")) return { label: "결과물 제작 · 발표", color: "#a855f7" };
  if (groupLogs.some(l => l.log_type === "중간보고")) return { label: "해결 방안 설계 중", color: "#f97316" };
  return { label: "원인 분석 · 자료 조사 중", color: "#3b82f6" };
}

function getLatestDate(groupLogs: Log[]) {
  if (groupLogs.length === 0) return null;
  return groupLogs.reduce((a, b) => (a.date > b.date ? a : b)).date;
}

export default function ResearchPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [logs,   setLogs]   = useState<Log[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [pw, setPw] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // 모둠 추가 폼
  const [gName,    setGName]    = useState("");
  const [gTopic,   setGTopic]   = useState("");
  const [gBook,    setGBook]    = useState("");
  const [gMembers, setGMembers] = useState("");
  const [gOpen,    setGOpen]    = useState(false);

  // 일지 작성 폼
  const [lDate,    setLDate]    = useState(toISODateKST());
  const [lContent, setLContent] = useState("");
  const [lAuthor,  setLAuthor]  = useState("");
  const [lLink,    setLLink]    = useState("");
  const [lType,    setLType]    = useState<Log["log_type"]>("활동일지");
  const [lOpen,    setLOpen]    = useState(false);
  const [saving,   setSaving]   = useState(false);

  async function load() {
    const { data: gd } = await supabase.from("research_groups").select("*").order("created_at");
    const { data: ld } = await supabase.from("research_logs").select("*").order("date", { ascending: false });
    setGroups((gd as Group[]) ?? []);
    setLogs((ld as Log[]) ?? []);
  }

  useEffect(() => { load(); }, []);

  async function addGroup() {
    if (!gName.trim() || !gTopic.trim() || !gMembers.trim()) { alert("모둠명, 탐구주제, 구성원을 입력하세요"); return; }
    await supabase.from("research_groups").insert({ name: gName.trim(), topic: gTopic.trim(), book: gBook.trim() || null, members: gMembers.trim() });
    setGName(""); setGTopic(""); setGBook(""); setGMembers(""); setGOpen(false);
    await load();
  }

  async function addLog() {
    if (!selectedGroup) return;
    if (!lContent.trim()) { alert("활동 내용을 입력하세요"); return; }
    setSaving(true);
    await supabase.from("research_logs").insert({
      group_id: selectedGroup.id, date: lDate, content: lContent.trim(),
      author: lAuthor.trim() || null, report_link: lLink.trim() || null, log_type: lType,
    });
    setSaving(false);
    setLContent(""); setLLink(""); setLOpen(false);
    await load();
  }

  async function deleteGroup(id: string) {
    if (!confirm("모둠을 삭제할까요?")) return;
    await supabase.from("research_groups").delete().eq("id", id);
    if (selectedGroup?.id === id) setSelectedGroup(null);
    await load();
  }

  const groupLogs = selectedGroup ? logs.filter(l => l.group_id === selectedGroup.id) : [];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:64, paddingBottom:40 }}>

      {/* ===================== HERO ===================== */}
      <section style={{
        background:"linear-gradient(135deg,#1e1b4b 0%,#3730a3 50%,#6d28d9 100%)",
        borderRadius:28, padding:"56px 32px", position:"relative", overflow:"hidden",
        boxShadow:"0 20px 50px rgba(67,56,202,0.25)",
      }}>
        {[{w:280,h:280,top:-100,right:-80,op:0.08},{w:160,h:160,bottom:-60,left:-40,op:0.06}].map((b,i)=>(
          <div key={i} style={{ position:"absolute",width:b.w,height:b.h,top:b.top,right:b.right,bottom:b.bottom,left:b.left,borderRadius:"50%",background:"#fff",opacity:b.op }}/>
        ))}
        <div style={{ position:"relative", maxWidth:720 }}>
          <div style={{ display:"inline-flex",alignItems:"center",background:"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",borderRadius:999,padding:"5px 16px",marginBottom:20,border:"1px solid rgba(255,255,255,0.2)" }}>
            <span style={{ fontSize:12,color:"#fff",fontWeight:700,letterSpacing:"0.5px" }}>PROJECT</span>
          </div>
          <h1 style={{ color:"#fff",fontSize:"clamp(26px,5vw,42px)",fontWeight:900,margin:"0 0 14px",letterSpacing:"-1px",lineHeight:1.25 }}>
            우리 학교 좋은 학교 만들기 프로젝트
          </h1>
          <p style={{ color:"#fff",fontSize:"clamp(16px,2.4vw,20px)",fontWeight:700,margin:"0 0 20px",lineHeight:1.6,opacity:0.95 }}>
            문제를 비판하는 사람이 아니라,<br/>문제를 해결하는 사람이 되어 봅시다.
          </p>
          <p style={{ color:"rgba(255,255,255,0.78)",fontSize:15,margin:0,lineHeight:1.9,fontWeight:500 }}>
            우리는 단순히 학교의 불편한 점을 지적하는 것이 아닙니다.<br/>
            왜 그런 문제가 발생하는지 분석하고, 설문조사·인터뷰·데이터 수집 등을 통해<br/>
            원인을 탐구하며, 실제로 적용 가능한 해결 방안을 설계하는 것이<br/>
            이번 프로젝트의 목표입니다.
          </p>
        </div>
      </section>

      {/* ===================== 핵심 메시지 ===================== */}
      <section>
        <h2 style={{
          textAlign:"center", fontSize:"clamp(22px,4vw,32px)", fontWeight:900,
          lineHeight:1.6, color:"var(--text)", margin:"0 0 40px", letterSpacing:"-0.5px",
        }}>
          “좋은 탐구는 불만에서 시작하지만,<br/>해결책으로 완성된다.”
        </h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:24 }}>
          {SKILLS.map(s=>(
            <div key={s.title} style={{ textAlign:"center", padding:"8px 12px" }}>
              <div style={{ fontSize:32, marginBottom:10 }}>{s.icon}</div>
              <h3 style={{ fontSize:15, fontWeight:800, margin:"0 0 6px", color:"var(--text)" }}>{s.title}</h3>
              <p style={{ fontSize:13, color:"var(--text-muted)", margin:0, lineHeight:1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== 좋은 탐구 vs 아쉬운 탐구 ===================== */}
      <section>
        <h2 style={{ fontSize:"clamp(20px,3.5vw,26px)", fontWeight:900, color:"var(--text)", margin:"0 0 8px", letterSpacing:"-0.5px" }}>
          좋은 탐구의 예시
        </h2>
        <p style={{ fontSize:14, color:"var(--text-muted)", margin:"0 0 28px" }}>
          단순한 불만이 아니라, 분석과 근거를 거쳐 해결 방안으로 이어지는 탐구를 지향합니다.
        </p>
        <div style={{ maxWidth:520 }}>
          <div style={{ borderRadius:20, border:"1.5px solid #bbf7d0", background:"#fff", overflow:"hidden" }}>
            <div style={{ padding:"16px 22px", background:"#f0fdf4", borderBottom:"1.5px solid #bbf7d0" }}>
              <span style={{ fontSize:13, fontWeight:800, color:"#16a34a" }}>✓ 좋은 탐구</span>
            </div>
            <div style={{ padding:"22px", display:"flex", flexDirection:"column", gap:18 }}>
              {GOOD_EXAMPLES.map((ex,i)=>(
                <div key={i}>
                  <p style={{ fontSize:14, fontWeight:700, color:"var(--text)", margin:"0 0 4px" }}>{ex.problem}</p>
                  <p style={{ fontSize:13, color:"#16a34a", margin:0, fontWeight:600, lineHeight:1.8 }}>
                    {ex.steps.map((s)=> "→ " + s).join("  ")}
                  </p>
                  {i < GOOD_EXAMPLES.length-1 && <div style={{ height:1, background:"#dcfce7", marginTop:18 }}/>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== 진행 방법 (타임라인) ===================== */}
      <section>
        <h2 style={{ fontSize:"clamp(20px,3.5vw,26px)", fontWeight:900, color:"var(--text)", margin:"0 0 28px", letterSpacing:"-0.5px" }}>
          프로젝트 진행 방법
        </h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:20 }}>
          {STEPS.map((s,i)=>(
            <div key={s.title}>
              <div style={{
                width:32, height:32, borderRadius:"50%", marginBottom:10,
                background:"linear-gradient(135deg,var(--primary),var(--accent))",
                color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:13, fontWeight:900,
              }}>{i+1}</div>
              <h3 style={{ fontSize:14, fontWeight:800, color:"var(--text)", margin:"0 0 4px" }}>{s.title}</h3>
              <p style={{ fontSize:12.5, color:"var(--text-muted)", margin:0, lineHeight:1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== 선생님이 기대하는 모습 ===================== */}
      <section style={{
        background:"var(--surface)", border:"1.5px solid var(--border)", borderRadius:24,
        padding:"36px 32px", boxShadow:"var(--shadow-sm)",
      }}>
        <div style={{ display:"inline-flex",alignItems:"center",background:"var(--primary-light)",borderRadius:999,padding:"4px 14px",marginBottom:16 }}>
          <span style={{ fontSize:12,fontWeight:800,color:"var(--primary-dark)" }}>담임선생님 메시지</span>
        </div>
        <h2 style={{ fontSize:"clamp(18px,3vw,24px)", fontWeight:900, color:"var(--text)", margin:"0 0 18px", lineHeight:1.6, letterSpacing:"-0.5px" }}>
          이번 프로젝트에서 중요한 것은<br/>결과물이 아니라 과정입니다.
        </h2>
        <p style={{ fontSize:14.5, color:"var(--text-muted)", margin:"0 0 14px", lineHeight:1.6 }}>
          화려한 PPT보다
        </p>
        <ul style={{ margin:"0 0 18px", padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:8 }}>
          {[
            "왜 그 문제를 선택했는지",
            "어떤 자료를 수집했는지",
            "어떤 해결책을 고민했는지",
            "어떻게 협력했는지",
          ].map(t=>(
            <li key={t} style={{ fontSize:14.5, color:"var(--text)", fontWeight:700, display:"flex", gap:8, alignItems:"flex-start" }}>
              <span style={{ color:"var(--primary)" }}>—</span>{t}
            </li>
          ))}
        </ul>
        <p style={{ fontSize:14.5, color:"var(--text-muted)", margin:0, lineHeight:1.6 }}>
          가 더 중요합니다.
        </p>
        <div style={{ height:1, background:"var(--border)", margin:"22px 0" }}/>
        <p style={{ fontSize:15, fontWeight:800, color:"var(--text)", margin:0, lineHeight:1.8 }}>
          여러분이 학교의 문제를 지적하는 비평가가 아니라,<br/>
          학교를 더 좋은 공간으로 만드는 <span style={{ color:"var(--primary-dark)" }}>문제 해결자</span>가 되기를 기대합니다.
        </p>
      </section>

      {/* ===================== 모둠 현황 ===================== */}
      <section>
        <h2 style={{ fontSize:"clamp(20px,3.5vw,26px)", fontWeight:900, color:"var(--text)", margin:"0 0 8px", letterSpacing:"-0.5px" }}>
          모둠 현황
        </h2>
        <p style={{ fontSize:14, color:"var(--text-muted)", margin:"0 0 24px" }}>
          우리 반 모둠들이 어떤 주제를, 어느 단계까지 탐구하고 있는지 확인해보세요.
        </p>

        {/* 관리자 */}
        <div className="hy-card" style={{ padding:"16px 20px", marginBottom:20 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
            {!isAdmin ? (
              <>
                <input type="password" placeholder="관리자 비밀번호" value={pw} onChange={e=>setPw(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&setIsAdmin(pw===ADMIN_PW)} className="hy-input" style={{ maxWidth:180 }}/>
                <button onClick={()=>setIsAdmin(pw===ADMIN_PW)} className="hy-btn" style={{ fontSize:13 }}>확인</button>
              </>
            ) : (
              <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                <span style={{ fontSize:13,color:"var(--primary)",fontWeight:800 }}>✅ 관리자 모드</span>
                <button onClick={()=>setGOpen(o=>!o)} className="hy-btn hy-btn-primary" style={{ fontSize:13 }}>
                  {gOpen ? "닫기" : "+ 모둠 추가"}
                </button>
              </div>
            )}
          </div>
          {isAdmin && gOpen && (
            <div style={{ marginTop:14,display:"flex",flexDirection:"column",gap:10 }}>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10 }}>
                <input placeholder="모둠명 *" value={gName} onChange={e=>setGName(e.target.value)} className="hy-input"/>
                <input placeholder="탐구 주제 *" value={gTopic} onChange={e=>setGTopic(e.target.value)} className="hy-input"/>
                <input placeholder="선정 도서 (선택)" value={gBook} onChange={e=>setGBook(e.target.value)} className="hy-input"/>
                <input placeholder="구성원 * (예: 홍길동, 김철수)" value={gMembers} onChange={e=>setGMembers(e.target.value)} className="hy-input"/>
              </div>
              <button onClick={addGroup} className="hy-btn hy-btn-primary" style={{ fontSize:13,alignSelf:"flex-start" }}>모둠 추가하기</button>
            </div>
          )}
        </div>

        {groups.length === 0 ? (
          <div className="hy-card" style={{ padding:"40px",textAlign:"center" }}>
            <p style={{ fontSize:15,color:"var(--text-subtle)",fontWeight:600 }}>아직 모둠이 없어요. 선생님이 곧 구성해주실 거예요 🔬</p>
          </div>
        ) : (
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14 }}>
            {groups.map((g,i)=>{
              const gl = logs.filter(l=>l.group_id===g.id);
              const stage = getStage(gl);
              const lastDate = getLatestDate(gl);
              const colors = [
                "linear-gradient(135deg,#0ea5e9,#6366f1)",
                "linear-gradient(135deg,#f472b6,#a78bfa)",
                "linear-gradient(135deg,#34d399,#3b82f6)",
                "linear-gradient(135deg,#fb923c,#f472b6)",
                "linear-gradient(135deg,#a855f7,#6366f1)",
              ];
              const isSelected = selectedGroup?.id === g.id;
              return (
                <div key={g.id} onClick={()=>setSelectedGroup(isSelected?null:g)}
                  style={{ borderRadius:20,overflow:"hidden",cursor:"pointer",
                    boxShadow: isSelected ? "0 8px 30px rgba(99,102,241,0.3)" : "0 2px 12px rgba(0,0,0,0.06)",
                    border: isSelected ? "2px solid #6366f1" : "2px solid transparent",
                    transition:"all 0.15s",
                  }}>
                  <div style={{ background:colors[i%colors.length],padding:"18px 20px" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                      <h3 style={{ color:"#fff",fontSize:16,fontWeight:900,margin:"0 0 4px" }}>{g.name}</h3>
                      {isAdmin && (
                        <button onClick={e=>{e.stopPropagation();deleteGroup(g.id);}}
                          style={{ fontSize:10,padding:"2px 8px",borderRadius:999,border:"1px solid rgba(255,255,255,0.4)",background:"rgba(255,255,255,0.15)",color:"#fff",cursor:"pointer",fontFamily:"inherit" }}>
                          삭제
                        </button>
                      )}
                    </div>
                    <p style={{ color:"rgba(255,255,255,0.85)",fontSize:13,margin:0,fontWeight:600 }}>📌 {g.topic}</p>
                  </div>
                  <div style={{ background:"#fff",padding:"14px 18px" }}>
                    {g.book && <p style={{ fontSize:12,color:"var(--text-muted)",margin:"0 0 6px",fontWeight:600 }}>📚 {g.book}</p>}
                    <p style={{ fontSize:12,color:"var(--text-subtle)",margin:"0 0 10px" }}>👥 {g.members}</p>
                    <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:8 }}>
                      <span style={{ width:8,height:8,borderRadius:"50%",background:stage.color,flexShrink:0 }}/>
                      <span style={{ fontSize:12,fontWeight:700,color:stage.color }}>{stage.label}</span>
                    </div>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                      <span style={{ fontSize:11,color:"var(--text-subtle)",fontWeight:600 }}>
                        최근 활동 {lastDate ?? "없음"}
                      </span>
                      <span style={{ fontSize:11,fontWeight:700,color: isSelected ? "#6366f1" : "var(--text-subtle)" }}>
                        {isSelected ? "선택됨 ✓" : "보기 →"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ===================== 활동일지 ===================== */}
      {selectedGroup && (
        <section className="hy-card" style={{ padding:"22px 24px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8 }}>
            <h3 style={{ fontSize:16,fontWeight:900,color:"var(--text)",margin:0 }}>
              📋 {selectedGroup.name} 활동 기록
            </h3>
            <button onClick={()=>setLOpen(o=>!o)} className="hy-btn hy-btn-primary" style={{ fontSize:13 }}>
              {lOpen ? "닫기" : "✏️ 기록 작성"}
            </button>
          </div>

          {lOpen && (
            <div style={{ marginBottom:20,padding:"18px",background:"#f8faff",borderRadius:16,border:"1.5px solid #e0e7ff" }}>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10 }}>
                  <select value={lType} onChange={e=>setLType(e.target.value as Log["log_type"])} className="hy-input" style={{ cursor:"pointer" }}>
                    <option value="활동일지">활동일지</option>
                    <option value="중간보고">중간보고</option>
                    <option value="최종보고">최종보고</option>
                  </select>
                  <input type="date" value={lDate} onChange={e=>setLDate(e.target.value)} className="hy-input"/>
                  <input placeholder="작성자 (선택)" value={lAuthor} onChange={e=>setLAuthor(e.target.value)} className="hy-input"/>
                </div>
                <textarea placeholder="활동 내용을 자유롭게 작성해요 *" value={lContent} onChange={e=>setLContent(e.target.value)}
                  className="hy-input" style={{ minHeight:100,resize:"vertical" }}/>
                <input placeholder="보고물 링크 (Google Docs, PDF 등 선택)" value={lLink} onChange={e=>setLLink(e.target.value)} className="hy-input"/>
                <button onClick={addLog} disabled={saving} className="hy-btn hy-btn-primary" style={{ fontSize:13,alignSelf:"flex-start" }}>
                  {saving ? "저장 중..." : "기록 저장"}
                </button>
              </div>
            </div>
          )}

          {groupLogs.length === 0 ? (
            <p style={{ fontSize:14,color:"var(--text-subtle)",textAlign:"center",padding:"24px 0" }}>아직 활동 기록이 없어요. 첫 기록을 남겨봐요! 🔬</p>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {groupLogs.map(l=>(
                <div key={l.id} style={{ padding:"14px 16px",borderRadius:14,background:"#fafafa",border:"1.5px solid var(--border)" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap" }}>
                    <span style={{ fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:999,background:TYPE_STYLE[l.log_type]?.bg,color:TYPE_STYLE[l.log_type]?.color }}>
                      {l.log_type}
                    </span>
                    <span style={{ fontSize:12,color:"var(--text-subtle)",fontWeight:600 }}>{l.date}</span>
                    {l.author && <span style={{ fontSize:12,color:"var(--text-subtle)" }}>· {l.author}</span>}
                  </div>
                  <p style={{ fontSize:14,color:"var(--text)",lineHeight:1.7,margin:0,whiteSpace:"pre-wrap" }}>{l.content}</p>
                  {l.report_link && (
                    <a href={l.report_link} target="_blank" rel="noopener noreferrer"
                      style={{ display:"inline-flex",alignItems:"center",gap:4,marginTop:10,fontSize:12,fontWeight:700,color:"#6366f1",textDecoration:"none",padding:"5px 12px",borderRadius:999,background:"#eff6ff",border:"1px solid #c7d2fe" }}>
                      📎 보고물 보기 →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
