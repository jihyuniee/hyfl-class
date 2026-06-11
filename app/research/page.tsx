"use client";

import { useEffect, useRef, useState } from "react";
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
  { title: "문제 발견", desc: "학교생활 속에서 더 나아질 수 있는 점을 찾습니다." },
  { title: "원인 분석", desc: "왜 그런 문제가 발생하는지 들여다봅니다." },
  { title: "자료 조사", desc: "설문, 인터뷰, 데이터 등 근거를 수집합니다." },
  { title: "해결 방안 설계", desc: "실제로 적용 가능한 해결책을 고민합니다." },
  { title: "결과물 제작", desc: "탐구 과정을 정리해 결과물로 만듭니다." },
  { title: "공유 및 피드백", desc: "결과를 나누고 다른 모둠과 의견을 주고받습니다." },
];

const ABILITIES = [
  { title: "창의적 사고", desc: "익숙한 문제를 새로운 시각으로 바라보고 독창적인 아이디어를 제안한다.", color: "#4F46E5" },
  { title: "문제 해결", desc: "문제를 지적하는 데서 멈추지 않고 원인을 분석하고 해결 방안을 설계한다.", color: "#7C3AED" },
  { title: "협업", desc: "팀원들과 역할을 나누고 의견을 조율하며 함께 해결책을 만들어 간다.", color: "#06B6D4" },
  { title: "의사소통", desc: "설문, 인터뷰, 발표 등을 통해 생각을 설득력 있게 전달한다.", color: "#10B981" },
  { title: "공동체 의식", desc: "나만의 불편함이 아니라 학교 구성원 모두를 위한 방향을 고민한다.", color: "#F59E0B" },
];

const TRAITS = [
  { num: "01", title: "질문한다", desc: "무엇이 문제인지 발견한다.", color: "#4F46E5" },
  { num: "02", title: "분석한다", desc: "현상이 아닌 원인을 찾는다.", color: "#7C3AED" },
  { num: "03", title: "확인한다", desc: "설문, 인터뷰, 데이터로 근거를 수집한다.", color: "#06B6D4" },
  { num: "04", title: "제안한다", desc: "실행 가능한 해결 방안을 만든다.", color: "#10B981" },
];

const FLOW = ["관찰", "질문", "조사", "분석", "아이디어", "실행", "공유"];

function toISODateKST() {
  const k = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${k.getFullYear()}-${String(k.getMonth()+1).padStart(2,"0")}-${String(k.getDate()).padStart(2,"0")}`;
}

function getStage(groupLogs: Log[]) {
  if (groupLogs.length === 0) return { label: "문제 발견 단계", color: "#94a3b8" };
  if (groupLogs.some(l => l.log_type === "최종보고")) return { label: "결과물 제작 · 공유", color: "#a855f7" };
  if (groupLogs.some(l => l.log_type === "중간보고")) return { label: "해결 방안 설계 중", color: "#f97316" };
  return { label: "원인 분석 · 자료 조사 중", color: "#3b82f6" };
}

function getLatestDate(groupLogs: Log[]) {
  if (groupLogs.length === 0) return null;
  return groupLogs.reduce((a, b) => (a.date > b.date ? a : b)).date;
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`hy-reveal${inView ? " hy-in" : ""}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
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
        background:"linear-gradient(135deg,#312e81 0%,#4F46E5 45%,#7C3AED 85%,#06B6D4 130%)",
        borderRadius:28, padding:"64px 36px", position:"relative", overflow:"hidden",
        boxShadow:"0 24px 60px rgba(79,70,229,0.35)",
      }}>
        {[{w:320,h:320,top:-120,right:-100,op:0.10},{w:180,h:180,bottom:-70,left:-50,op:0.10}].map((b,i)=>(
          <div key={i} style={{ position:"absolute",width:b.w,height:b.h,top:b.top,right:b.right,bottom:b.bottom,left:b.left,borderRadius:"50%",background:"#fff",opacity:b.op,filter:"blur(2px)" }}/>
        ))}
        <div style={{ position:"relative", maxWidth:680 }}>
          <div style={{ display:"inline-flex",alignItems:"center",background:"rgba(255,255,255,0.15)",backdropFilter:"blur(8px)",borderRadius:999,padding:"5px 16px",marginBottom:24,border:"1px solid rgba(255,255,255,0.25)" }}>
            <span style={{ fontSize:12,color:"#fff",fontWeight:700,letterSpacing:"1.5px" }}>RESEARCH PROJECT</span>
          </div>
          <h1 style={{ color:"#fff",fontSize:"clamp(26px,5vw,42px)",fontWeight:900,margin:"0 0 18px",letterSpacing:"-1px",lineHeight:1.3 }}>
            우리 학교 좋은 학교 만들기 프로젝트
          </h1>
          <p style={{ color:"rgba(255,255,255,0.92)",fontSize:"clamp(15px,2.2vw,19px)",fontWeight:700,margin:"0 0 26px",lineHeight:1.9 }}>
            문제를 발견하고,<br/>원인을 분석하고,<br/>해결 방안을 설계하는 탐구
          </p>
          <p style={{ color:"rgba(255,255,255,0.78)",fontSize:14.5,margin:0,lineHeight:2 }}>
            학교생활 속에서 더 나아질 수 있는 점을 발견하고,<br/>
            그 원인을 분석하며, 설문조사·인터뷰·데이터 분석 등을 통해<br/>
            근거를 수집하고, 실제로 적용 가능한 해결 방안을<br/>
            고민해 보는 프로젝트입니다.
          </p>
        </div>
      </section>

      {/* ===================== 우리 모둠 활동 기록 ===================== */}
      <section>
        <h2 style={{ fontSize:"clamp(20px,3.5vw,26px)", fontWeight:900, color:"var(--text)", margin:"0 0 8px", letterSpacing:"-0.5px" }}>
          우리 모둠 활동 기록
        </h2>
        <p style={{ fontSize:14, color:"var(--text-muted)", margin:"0 0 24px" }}>
          우리 모둠이 어떤 주제를 탐구하고 있는지 확인하고, 활동일지·중간보고·최종보고를 기록·제출하세요.
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
                <div key={g.id} onClick={()=>setSelectedGroup(isSelected?null:g)} className="hy-card hy-hover-card"
                  style={{ padding:"18px 20px", cursor:"pointer",
                    borderColor: isSelected ? "var(--primary)" : "var(--border)",
                    boxShadow: isSelected ? "var(--shadow-md)" : "var(--shadow-sm)",
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

        {/* ----- 활동일지 ----- */}
        {selectedGroup && (
          <div className="hy-card" style={{ padding:"22px 24px", marginTop:14 }}>
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
          </div>
        )}
      </section>

      {/* ===================== 좋은 탐구란? ===================== */}
      <Reveal>
        <section style={{ textAlign:"center", padding:"20px 12px" }}>
          <h2 style={{
            fontSize:"clamp(22px,4.2vw,34px)", fontWeight:900,
            lineHeight:1.7, color:"var(--text)", margin:0, letterSpacing:"-0.5px",
          }}>
            좋은 탐구는<br/>
            <span style={{ background:"linear-gradient(135deg,#4F46E5,#7C3AED)", WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent" }}>
              문제를 발견하는 것에서 끝나지 않는다.
            </span>
          </h2>
          <p style={{ fontSize:"clamp(14px,2vw,16px)", color:"var(--text-muted)", lineHeight:2, margin:"24px 0 0", fontWeight:600 }}>
            왜 그런 문제가 발생했는지 질문하고,<br/>
            근거를 찾고, 사람들의 의견을 듣고,<br/>
            실현 가능한 해결 방법을 고민하는 과정이다.
          </p>
        </section>
      </Reveal>

      {/* ===================== 탐구를 통해 기를 수 있는 역량 ===================== */}
      <section>
        <Reveal>
          <h2 style={{ fontSize:"clamp(20px,3.5vw,26px)", fontWeight:900, color:"var(--text)", margin:"0 0 8px", letterSpacing:"-0.5px" }}>
            탐구를 통해 기를 수 있는 역량
          </h2>
          <p style={{ fontSize:14, color:"var(--text-muted)", margin:"0 0 28px" }}>
            탐구의 각 과정은 자연스럽게 다음 역량과 연결됩니다.
          </p>
        </Reveal>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:18 }}>
          {ABILITIES.map((a,i)=>(
            <Reveal key={a.title} delay={i*60}>
              <div className="hy-hover-card" style={{
                borderRadius:20, padding:"24px 22px", height:"100%",
                background:"#fff", border:"1.5px solid var(--border)",
                borderTop:`3px solid ${a.color}`,
              }}>
                <h3 style={{ fontSize:15.5, fontWeight:800, margin:"0 0 8px", color:a.color }}>{a.title}</h3>
                <p style={{ fontSize:13.5, color:"var(--text-muted)", margin:0, lineHeight:1.8 }}>{a.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===================== 좋은 탐구의 특징 ===================== */}
      <section style={{
        background:"linear-gradient(135deg,#eef2ff 0%,#f5f3ff 50%,#ecfeff 100%)",
        borderRadius:28, padding:"44px 32px",
      }}>
        <Reveal>
          <h2 style={{ fontSize:"clamp(20px,3.5vw,26px)", fontWeight:900, color:"var(--text)", margin:"0 0 28px", letterSpacing:"-0.5px", textAlign:"center" }}>
            좋은 탐구의 특징
          </h2>
        </Reveal>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:18 }}>
          {TRAITS.map((t,i)=>(
            <Reveal key={t.title} delay={i*70}>
              <div className="hy-hover-card" style={{
                borderRadius:20, padding:"26px 22px", height:"100%",
                background:"#fff", boxShadow:"0 4px 20px rgba(79,70,229,0.08)",
              }}>
                <div style={{ fontSize:13, fontWeight:900, color:t.color, marginBottom:12, letterSpacing:"1px" }}>{t.num}</div>
                <h3 style={{ fontSize:17, fontWeight:900, margin:"0 0 8px", color:"var(--text)" }}>{t.title}</h3>
                <p style={{ fontSize:13.5, color:"var(--text-muted)", margin:0, lineHeight:1.7 }}>{t.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===================== 탐구가 깊어지는 과정 ===================== */}
      <section>
        <Reveal>
          <h2 style={{ fontSize:"clamp(20px,3.5vw,26px)", fontWeight:900, color:"var(--text)", margin:"0 0 8px", letterSpacing:"-0.5px", textAlign:"center" }}>
            탐구가 깊어지는 과정
          </h2>
          <p style={{ fontSize:14, color:"var(--text-muted)", margin:"0 0 32px", textAlign:"center" }}>
            하나의 관찰이 공유로 이어지기까지
          </p>
        </Reveal>
        <Reveal>
          <div className="hy-flow">
            {FLOW.map((f,i)=>(
              <div key={f} style={{ display:"flex", alignItems:"center" }}>
                <div className="hy-flow-node">
                  <div style={{
                    width:64, height:64, borderRadius:"50%",
                    background:`linear-gradient(135deg, ${["#4F46E5","#6D40E0","#7C3AED","#5B6FE0","#06B6D4","#10B981","#06B6D4"][i]}, ${["#7C3AED","#7C3AED","#06B6D4","#06B6D4","#10B981","#06B6D4","#4F46E5"][i]})`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color:"#fff", fontSize:14, fontWeight:800, boxShadow:"0 8px 20px rgba(79,70,229,0.25)",
                  }}>{f}</div>
                </div>
                {i < FLOW.length-1 && <span className="hy-flow-arrow">→</span>}
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ===================== 우리가 지향하는 탐구 ===================== */}
      <Reveal>
        <section style={{
          background:"linear-gradient(135deg,#312e81 0%,#1e1b4b 100%)",
          borderRadius:24, padding:"40px 32px", color:"#fff",
        }}>
          <h2 style={{ fontSize:"clamp(18px,3vw,24px)", fontWeight:900, margin:"0 0 18px", letterSpacing:"-0.5px" }}>
            우리가 지향하는 탐구
          </h2>
          <p style={{ fontSize:14.5, color:"rgba(255,255,255,0.7)", margin:"0 0 20px", lineHeight:1.9 }}>
            좋은 탐구는 주제의 크기로 결정되지 않습니다.<br/>
            거창한 문제를 선택했다고 좋은 탐구가 되는 것도 아닙니다.
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14 }}>
            {[
              "얼마나 깊이 질문했는가",
              "얼마나 다양한 관점에서 살펴보았는가",
              "얼마나 근거를 수집했는가",
              "얼마나 현실적인 해결 방안을 고민했는가",
            ].map(t=>(
              <div key={t} style={{
                border:"1px solid rgba(255,255,255,0.15)", borderRadius:14, padding:"16px",
                background:"rgba(255,255,255,0.05)", fontSize:13.5, fontWeight:700, lineHeight:1.7,
              }}>
                {t}
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ===================== 프로젝트 진행 방법 ===================== */}
      <section>
        <Reveal>
          <h2 style={{ fontSize:"clamp(20px,3.5vw,26px)", fontWeight:900, color:"var(--text)", margin:"0 0 32px", letterSpacing:"-0.5px" }}>
            프로젝트 진행 방법
          </h2>
        </Reveal>
        <div style={{ display:"flex", flexDirection:"column" }}>
          {STEPS.map((s,i)=>(
            <Reveal key={s.title} delay={i*40}>
              <div style={{ display:"flex", gap:24, padding:"20px 0", borderTop: i===0 ? "1px solid var(--border)" : undefined, borderBottom:"1px solid var(--border)" }}>
                <div style={{ flexShrink:0, width:48 }}>
                  <span style={{
                    display:"inline-flex", alignItems:"center", justifyContent:"center",
                    width:36, height:36, borderRadius:"50%", fontSize:13, fontWeight:900, color:"#fff",
                    background:`linear-gradient(135deg, #4F46E5, #06B6D4)`,
                  }}>{i+1}</span>
                </div>
                <div>
                  <h3 style={{ fontSize:15, fontWeight:800, color:"var(--text)", margin:"0 0 4px" }}>{s.title}</h3>
                  <p style={{ fontSize:13.5, color:"var(--text-muted)", margin:0, lineHeight:1.7 }}>{s.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===================== 마지막 메시지 ===================== */}
      <Reveal>
        <section style={{ textAlign:"center", padding:"32px 12px" }}>
          <h2 style={{ fontSize:"clamp(22px,4.5vw,34px)", fontWeight:900, lineHeight:1.8, letterSpacing:"-0.5px", margin:0, color:"var(--text)" }}>
            좋은 탐구는<br/>
            정답을 찾는 활동이 아니라<br/>
            <span style={{ background:"linear-gradient(135deg,#4F46E5,#06B6D4)", WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent" }}>
              더 좋은 질문을 만들고<br/>더 나은 해결책을 고민하는 활동
            </span>이다.
          </h2>
        </section>
      </Reveal>
    </div>
  );
}
