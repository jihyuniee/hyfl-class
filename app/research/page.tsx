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

function toISODateKST() {
  const k = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${k.getFullYear()}-${String(k.getMonth()+1).padStart(2,"0")}-${String(k.getDate()).padStart(2,"0")}`;
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
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* 헤더 */}
      <div style={{ background:"linear-gradient(135deg,#0ea5e9 0%,#6366f1 50%,#a855f7 100%)", borderRadius:28, padding:"32px 28px", position:"relative", overflow:"hidden", boxShadow:"0 12px 40px rgba(14,165,233,0.3)" }}>
        {[{w:150,h:150,top:-40,right:-20,op:0.08},{w:70,h:70,bottom:-10,left:80,op:0.07}].map((b,i)=>(
          <div key={i} style={{ position:"absolute",width:b.w,height:b.h,top:b.top,right:b.right,bottom:b.bottom,left:b.left,borderRadius:"50%",background:"#fff",opacity:b.op }}/>
        ))}
        <div style={{ position:"relative" }}>
          <div style={{ display:"inline-flex",alignItems:"center",background:"rgba(255,255,255,0.2)",backdropFilter:"blur(8px)",borderRadius:999,padding:"4px 14px",marginBottom:12,border:"1px solid rgba(255,255,255,0.3)" }}>
            <span style={{ fontSize:12,color:"#fff",fontWeight:700 }}>🔬 학급자율활동</span>
          </div>
          <h1 style={{ color:"#fff",fontSize:"clamp(20px,4vw,30px)",fontWeight:900,margin:"0 0 8px",letterSpacing:"-0.5px" }}>전공분야별 심화탐구활동</h1>
          <p style={{ color:"rgba(255,255,255,0.85)",fontSize:13,margin:0,lineHeight:1.7,fontWeight:500 }}>
            관심 분야 모둠을 구성하고 도서를 선정해 탐구 활동을 진행해요.<br/>HR 시간에 회장·부회장 중심으로 운영합니다.
          </p>
        </div>
      </div>

      {/* 관리자 */}
      <div className="hy-card" style={{ padding:"16px 20px" }}>
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
            const gLogCount = logs.filter(l=>l.group_id===g.id).length;
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
                  <p style={{ fontSize:12,color:"var(--text-subtle)",margin:"0 0 8px" }}>👥 {g.members}</p>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <span style={{ fontSize:11,fontWeight:700,color:"#6366f1" }}>활동일지 {gLogCount}개</span>
                    <span style={{ fontSize:11,fontWeight:700,color: isSelected ? "#6366f1" : "var(--text-subtle)" }}>
                      {isSelected ? "선택됨 ✓" : "클릭해서 보기 →"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 선택된 모둠 활동 */}
      {selectedGroup && (
        <div className="hy-card" style={{ padding:"22px 24px" }}>
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
        </div>
      )}
    </div>
  );
}
