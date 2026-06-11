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
  { title: "문제 발견", desc: "학교생활 속에서 개선이 필요하다고 생각되는 문제를 찾습니다." },
  { title: "원인 분석", desc: "왜 그런 문제가 발생하는지 생각합니다." },
  { title: "근거 수집", desc: "설문조사, 인터뷰, 데이터 분석, 사례 조사를 진행합니다." },
  { title: "해결 방안 설계", desc: "실제로 적용 가능한 해결책을 고민합니다." },
  { title: "결과물 제작", desc: "카드뉴스, 영상, 제안서, 프로그램 등 다양한 형태로 정리합니다." },
  { title: "공유와 피드백", desc: "결과를 발표하고 다른 모둠과 의견을 나눕니다." },
];

const EXPECTATIONS = [
  "창의적으로 생각하는 힘",
  "문제를 분석하는 힘",
  "해결 방법을 설계하는 힘",
  "함께 협력하는 힘",
  "자신의 생각을 전달하는 힘",
  "공동체를 생각하는 태도",
];

const EXAMPLES = [
  {
    steps: [
      { label: "문제 발견", text: "급식 줄이 길다" },
      { label: "원인 분석", text: "특정 시간대에 학생이 집중된다" },
      { label: "근거 수집", text: "시간대별 혼잡도 조사" },
      { label: "해결 방안", text: "운영 개선안 제안" },
    ],
  },
  {
    steps: [
      { label: "문제 발견", text: "도서관 이용률이 낮다" },
      { label: "원인 분석", text: "이용 이유와 불편 요소 조사" },
      { label: "근거 수집", text: "설문조사 및 인터뷰" },
      { label: "해결 방안", text: "이용 활성화 프로그램 기획" },
    ],
  },
];

function toISODateKST() {
  const k = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${k.getFullYear()}-${String(k.getMonth()+1).padStart(2,"0")}-${String(k.getDate()).padStart(2,"0")}`;
}

function getStage(groupLogs: Log[]) {
  if (groupLogs.length === 0) return { label: "문제 발견 단계", color: "#94a3b8" };
  if (groupLogs.some(l => l.log_type === "최종보고")) return { label: "결과물 제작 · 공유", color: "#a855f7" };
  if (groupLogs.some(l => l.log_type === "중간보고")) return { label: "해결 방안 설계 중", color: "#f97316" };
  return { label: "원인 분석 · 근거 수집 중", color: "#3b82f6" };
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
    <div style={{ display:"flex", flexDirection:"column", gap:72, paddingBottom:40 }}>

      {/* ===================== HERO ===================== */}
      <section style={{
        background:"#1c1c1e", borderRadius:24, padding:"64px 36px",
      }}>
        <div style={{ maxWidth:680 }}>
          <div style={{ display:"inline-flex",alignItems:"center",border:"1px solid rgba(255,255,255,0.18)",borderRadius:999,padding:"5px 14px",marginBottom:24 }}>
            <span style={{ fontSize:12,color:"rgba(255,255,255,0.7)",fontWeight:700,letterSpacing:"1px" }}>SCHOOL PROJECT</span>
          </div>
          <h1 style={{ color:"#fff",fontSize:"clamp(26px,5vw,40px)",fontWeight:800,margin:"0 0 18px",letterSpacing:"-1px",lineHeight:1.3 }}>
            우리 학교 좋은 학교 만들기 프로젝트
          </h1>
          <p style={{ color:"rgba(255,255,255,0.85)",fontSize:"clamp(15px,2vw,18px)",fontWeight:600,margin:"0 0 28px",lineHeight:1.8 }}>
            문제를 발견하고,<br/>해결책을 설계하는 탐구
          </p>
          <div style={{ height:1, background:"rgba(255,255,255,0.12)", marginBottom:28 }}/>
          <p style={{ color:"rgba(255,255,255,0.6)",fontSize:14.5,margin:0,lineHeight:2 }}>
            이번 프로젝트의 목표는 단순히 학교의 불편한 점을 이야기하는 것이 아닙니다.<br/>
            학교생활 속 문제를 발견하고, 왜 그런 문제가 발생하는지 탐구하며,<br/>
            설문조사, 인터뷰, 데이터 분석 등을 통해 근거를 수집하고,<br/>
            실제로 적용 가능한 해결 방안을 설계하는 것이 목표입니다.
          </p>
        </div>
      </section>

      {/* ===================== 선생님이 기대하는 모습 ===================== */}
      <section>
        <h2 style={{ fontSize:"clamp(20px,3.5vw,26px)", fontWeight:800, color:"var(--text)", margin:"0 0 32px", letterSpacing:"-0.5px" }}>
          이번 프로젝트를 통해 여러분에게 기대하는 것
        </h2>
        <div style={{ display:"grid", gridTemplateColumns:"1.1fr 1fr", gap:48, alignItems:"start" }} className="hy-expect-grid">
          <p style={{ fontSize:15, color:"var(--text-muted)", lineHeight:2, margin:0 }}>
            저는 여러분이 이번 활동을 통해 다음과 같은 힘을 기르기를 바랍니다.
            <br/><br/>
            이번 프로젝트에서 중요한 것은 결과물 자체가 아니라,<br/>
            문제를 어떻게 발견했고, 어떻게 분석했고,<br/>
            어떤 해결 방안을 고민했는가의 <strong style={{ color:"var(--text)" }}>과정</strong>입니다.
          </p>
          <ul style={{ margin:0, padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:14 }}>
            {EXPECTATIONS.map(t=>(
              <li key={t} style={{ display:"flex", gap:12, alignItems:"center", fontSize:14.5, fontWeight:600, color:"var(--text)" }}>
                <span style={{
                  width:20, height:20, borderRadius:"50%", flexShrink:0,
                  border:"1.5px solid var(--primary)", color:"var(--primary)",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800,
                }}>✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===================== 좋은 탐구의 과정 (타임라인) ===================== */}
      <section>
        <h2 style={{ fontSize:"clamp(20px,3.5vw,26px)", fontWeight:800, color:"var(--text)", margin:"0 0 8px", letterSpacing:"-0.5px" }}>
          좋은 탐구의 과정
        </h2>
        <p style={{ fontSize:14, color:"var(--text-muted)", margin:"0 0 32px" }}>
          탐구는 다음의 흐름을 따라 진행됩니다.
        </p>
        <div style={{ display:"flex", flexDirection:"column" }}>
          {STEPS.map((s,i)=>(
            <div key={s.title} style={{ display:"flex", gap:24, padding:"22px 0", borderTop: i===0 ? "1px solid var(--border)" : undefined, borderBottom:"1px solid var(--border)" }}>
              <div style={{ flexShrink:0, width:44 }}>
                <span style={{ fontSize:13, fontWeight:800, color:"var(--text-subtle)" }}>{String(i+1).padStart(2,"0")}</span>
              </div>
              <div>
                <h3 style={{ fontSize:15, fontWeight:800, color:"var(--text)", margin:"0 0 4px" }}>{s.title}</h3>
                <p style={{ fontSize:13.5, color:"var(--text-muted)", margin:0, lineHeight:1.7 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== 탐구의 예시 ===================== */}
      <section>
        <h2 style={{ fontSize:"clamp(20px,3.5vw,26px)", fontWeight:800, color:"var(--text)", margin:"0 0 8px", letterSpacing:"-0.5px" }}>
          탐구는 이렇게 깊어질 수 있습니다
        </h2>
        <p style={{ fontSize:14, color:"var(--text-muted)", margin:"0 0 32px" }}>
          같은 주제라도 분석과 근거를 거치면 탐구의 깊이가 달라집니다.
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:20, marginBottom:28 }}>
          {EXAMPLES.map((ex,i)=>(
            <div key={i} className="hy-card" style={{ padding:"24px" }}>
              {ex.steps.map((s,j)=>(
                <div key={s.label}>
                  <div style={{ display:"flex", gap:10, alignItems:"baseline" }}>
                    <span style={{ fontSize:11, fontWeight:800, color:"var(--primary)", letterSpacing:"0.5px", flexShrink:0, width:60 }}>{s.label}</span>
                    <span style={{ fontSize:14.5, fontWeight:700, color:"var(--text)" }}>{s.text}</span>
                  </div>
                  {j < ex.steps.length-1 && (
                    <div style={{ padding:"6px 0 6px 70px", color:"var(--text-subtle)", fontSize:13 }}>↓</div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        <p style={{ fontSize:15.5, fontWeight:700, color:"var(--text)", textAlign:"center", lineHeight:1.8, margin:0 }}>
          중요한 것은 문제 자체가 아니라,<br/>
          그 문제를 <span style={{ color:"var(--primary-dark)" }}>어떻게 탐구했는가</span>입니다.
        </p>
      </section>

      {/* ===================== 생기부에 의미 있게 남는 활동 ===================== */}
      <section style={{
        background:"var(--surface)", border:"1.5px solid var(--border)", borderRadius:20,
        padding:"36px 32px",
      }}>
        <h2 style={{ fontSize:"clamp(18px,3vw,24px)", fontWeight:800, color:"var(--text)", margin:"0 0 18px", letterSpacing:"-0.5px" }}>
          좋은 활동은 과정이 기록됩니다
        </h2>
        <p style={{ fontSize:14.5, color:"var(--text-muted)", margin:"0 0 14px", lineHeight:1.9 }}>
          생기부에는 “문제를 제기함”이 기록되는 것이 아니라,
        </p>
        <p style={{ fontSize:15, fontWeight:700, color:"var(--text)", margin:"0 0 14px", lineHeight:1.9 }}>
          “문제를 발견하고, 자료를 조사하고, 원인을 분석하고,<br/>해결 방안을 설계한 과정”이 기록됩니다.
        </p>
        <p style={{ fontSize:14.5, color:"var(--text-muted)", margin:0, lineHeight:1.9 }}>
          이번 프로젝트에서는 무엇을 만들었는가보다,<br/>
          <strong style={{ color:"var(--text)" }}>어떻게 탐구했는가</strong>가 더 중요합니다.
        </p>
      </section>

      {/* ===================== 개인 심화탐구 안내 ===================== */}
      <section>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
          <h2 style={{ fontSize:"clamp(18px,3vw,22px)", fontWeight:800, color:"var(--text)", margin:0, letterSpacing:"-0.5px" }}>
            전공분야별 심화탐구활동
          </h2>
          <span style={{ fontSize:11, fontWeight:700, color:"var(--text-subtle)", border:"1px solid var(--border)", borderRadius:999, padding:"2px 10px" }}>선택</span>
        </div>
        <p style={{ fontSize:14, color:"var(--text-muted)", margin:"0 0 16px", lineHeight:1.9 }}>
          기존에 안내했던 전공분야별 심화탐구활동은 계속 진행 가능합니다.<br/>
          전공 또는 진로와 관련된 주제를 개인적으로 깊이 탐구하고 싶은 학생은 자유롭게 참여할 수 있습니다.
        </p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
          {["도서 탐구","설문조사","인터뷰","논문 조사","프로그램 제작","보고서 작성"].map(t=>(
            <span key={t} style={{ fontSize:12.5, fontWeight:600, color:"var(--text-muted)", border:"1px solid var(--border)", borderRadius:999, padding:"5px 14px" }}>{t}</span>
          ))}
        </div>
        <p style={{ fontSize:13.5, color:"var(--text-subtle)", margin:0 }}>
          등 다양한 형태로 진행할 수 있으며, 원하는 학생은 개별 결과물을 제출할 수 있습니다.
        </p>
      </section>

      {/* ===================== 마지막 메시지 ===================== */}
      <section style={{ textAlign:"center", padding:"24px 0" }}>
        <h2 style={{ fontSize:"clamp(20px,4vw,30px)", fontWeight:800, color:"var(--text)", lineHeight:1.7, letterSpacing:"-0.5px", margin:"0 0 28px" }}>
          좋은 탐구는 정답을 찾는 활동이 아니라,<br/>
          더 나은 질문을 만들고<br/>
          더 나은 해결책을 고민하는 활동입니다.
        </h2>
        <p style={{ fontSize:15, color:"var(--text-muted)", lineHeight:1.9, margin:0, fontWeight:600 }}>
          여러분이 학교를 비판하는 사람이 아니라,<br/>
          학교를 더 좋은 공간으로 만들기 위해 고민하고 행동하는 사람이 되기를 기대합니다.
        </p>
      </section>

      {/* ===================== 모둠 현황 ===================== */}
      <section>
        <h2 style={{ fontSize:"clamp(20px,3.5vw,26px)", fontWeight:800, color:"var(--text)", margin:"0 0 8px", letterSpacing:"-0.5px" }}>
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
                <span style={{ fontSize:13,color:"var(--primary)",fontWeight:800 }}>관리자 모드</span>
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
            <p style={{ fontSize:15,color:"var(--text-subtle)",fontWeight:600 }}>아직 모둠이 없어요. 선생님이 곧 구성해주실 거예요.</p>
          </div>
        ) : (
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14 }}>
            {groups.map(g=>{
              const gl = logs.filter(l=>l.group_id===g.id);
              const stage = getStage(gl);
              const lastDate = getLatestDate(gl);
              const isSelected = selectedGroup?.id === g.id;
              return (
                <div key={g.id} onClick={()=>setSelectedGroup(isSelected?null:g)} className="hy-card"
                  style={{ padding:"18px 20px", cursor:"pointer",
                    borderColor: isSelected ? "var(--primary)" : "var(--border)",
                    boxShadow: isSelected ? "var(--shadow-md)" : "var(--shadow-sm)",
                    transition:"all 0.15s",
                  }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6 }}>
                    <h3 style={{ color:"var(--text)",fontSize:15,fontWeight:800,margin:0 }}>{g.name}</h3>
                    {isAdmin && (
                      <button onClick={e=>{e.stopPropagation();deleteGroup(g.id);}}
                        style={{ fontSize:10,padding:"2px 8px",borderRadius:999,border:"1px solid var(--border)",background:"transparent",color:"var(--text-subtle)",cursor:"pointer",fontFamily:"inherit" }}>
                        삭제
                      </button>
                    )}
                  </div>
                  <p style={{ color:"var(--text-muted)",fontSize:13,margin:"0 0 10px",fontWeight:600 }}>{g.topic}</p>
                  {g.book && <p style={{ fontSize:12,color:"var(--text-subtle)",margin:"0 0 6px" }}>참고 도서 · {g.book}</p>}
                  <p style={{ fontSize:12,color:"var(--text-subtle)",margin:"0 0 14px" }}>{g.members}</p>
                  <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:8 }}>
                    <span style={{ width:6,height:6,borderRadius:"50%",background:stage.color,flexShrink:0 }}/>
                    <span style={{ fontSize:12,fontWeight:700,color:stage.color }}>{stage.label}</span>
                  </div>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <span style={{ fontSize:11,color:"var(--text-subtle)",fontWeight:600 }}>
                      최근 활동 {lastDate ?? "없음"}
                    </span>
                    <span style={{ fontSize:11,fontWeight:700,color: isSelected ? "var(--primary)" : "var(--text-subtle)" }}>
                      {isSelected ? "선택됨" : "기록 보기 →"}
                    </span>
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
            <h3 style={{ fontSize:16,fontWeight:800,color:"var(--text)",margin:0 }}>
              {selectedGroup.name} 활동 기록
            </h3>
            <button onClick={()=>setLOpen(o=>!o)} className="hy-btn hy-btn-primary" style={{ fontSize:13 }}>
              {lOpen ? "닫기" : "기록 작성"}
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
            <p style={{ fontSize:14,color:"var(--text-subtle)",textAlign:"center",padding:"24px 0" }}>아직 활동 기록이 없어요. 첫 기록을 남겨보세요.</p>
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
                      보고물 보기 →
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
