"use client";

import { useEffect, useRef, useState } from "react";

// ── 타입 ───────────────────────────────────────────────────
type Stage =
  | "start"
  | "problem"
  | "problem_done"
  | "data_search"
  | "data_found"
  | "analysis"
  | "presentation";

interface Team {
  id: string;
  team_name: string;
  members: string;
  team_code: string;
}

interface TeamState {
  team_id: string;
  stage: Stage;
  problem_statement: string | null;
  data_sources: string[];
  notes: string | null;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// ── 상수 ───────────────────────────────────────────────────
const STAGE_LABELS: Record<Stage, string> = {
  start:        "🚀 시작 단계",
  problem:      "🔍 문제 정의 중",
  problem_done: "✅ 문제 정의 완료",
  data_search:  "🔎 데이터 탐색 중",
  data_found:   "📊 데이터 확보 완료",
  analysis:     "⚙️ 분석 진행 중",
  presentation: "🎤 발표 준비",
};

const STAGE_ORDER: Stage[] = [
  "start","problem","problem_done","data_search","data_found","analysis","presentation",
];

const STAGE_COLORS: Record<Stage, { bg: string; color: string; border: string }> = {
  start:        { bg: "#f0f9ff", color: "#0284c7", border: "#bae6fd" },
  problem:      { bg: "#fef3c7", color: "#d97706", border: "#fcd34d" },
  problem_done: { bg: "#f0fdf4", color: "#16a34a", border: "#86efac" },
  data_search:  { bg: "#fdf4ff", color: "#9333ea", border: "#d8b4fe" },
  data_found:   { bg: "#eff6ff", color: "#2563eb", border: "#93c5fd" },
  analysis:     { bg: "#fff7ed", color: "#ea580c", border: "#fdba74" },
  presentation: { bg: "#fdf2f8", color: "#db2777", border: "#f9a8d4" },
};

const NEXT_HINTS: Record<Stage, string> = {
  start:        "지금 어느 단계에서 막혔나요? AI 코치에게 먼저 설명해보세요.",
  problem:      "그 문제를 숫자로 표현하면 어떤 숫자가 필요할까요?",
  problem_done: "학교알리미나 data.go.kr에서 어떤 키워드로 검색해봤나요?",
  data_search:  "찾은 파일이 CSV인가요, XLSX인가요? 직접 열어봤나요?",
  data_found:   "이 데이터에서 가장 높은 값과 낮은 값이 뭔지 찾아봤나요?",
  analysis:     "발견한 패턴을 알면 누가 가장 도움받을 것 같나요?",
  presentation: "지금까지 완성한 것이 뭐고, 아직 안 한 것이 뭔가요?",
};

// 마크다운 굵게(**text**) → <strong> 처리
function renderContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

// ── 컴포넌트 ────────────────────────────────────────────────
export default function HyflPage() {
  // 로그인 상태
  const [teamCode, setTeamCode] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [team, setTeam] = useState<Team | null>(null);
  const [state, setState] = useState<TeamState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // 채팅
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 상태 편집 패널
  const [editOpen, setEditOpen] = useState(false);
  const [editStage, setEditStage] = useState<Stage>("start");
  const [editProblem, setEditProblem] = useState("");
  const [editSource, setEditSource] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingState, setSavingState] = useState(false);

  // 로그인
  async function login() {
    if (!teamCode.trim()) return;
    setLoginLoading(true);
    try {
      const res = await fetch(
        `/api/hyfl/teams?code=${encodeURIComponent(teamCode.trim().toLowerCase())}`
      );
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      setTeam(data.team);
      setState(data.state ?? null);
      setMessages(data.messages ?? []);
      // 편집 폼 초기값
      setEditStage(data.state?.stage ?? "start");
      setEditProblem(data.state?.problem_statement ?? "");
      setEditSource((data.state?.data_sources ?? []).join(", "));
      setEditNotes(data.state?.notes ?? "");
    } finally {
      setLoginLoading(false);
    }
  }

  // 로그아웃
  function logout() {
    setTeam(null); setState(null); setMessages([]);
    setTeamCode(""); setStreamText(""); setInput("");
  }

  // 상태 저장
  async function saveState() {
    if (!team) return;
    setSavingState(true);
    const sources = editSource.split(",").map(s => s.trim()).filter(Boolean);
    const res = await fetch("/api/hyfl/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        team_id: team.id,
        stage: editStage,
        problem_statement: editProblem || null,
        data_sources: sources,
        notes: editNotes || null,
      }),
    });
    setSavingState(false);
    if (res.ok) {
      setState(prev => ({
        ...(prev ?? { team_id: team.id, updated_at: "" }),
        stage: editStage,
        problem_statement: editProblem || null,
        data_sources: sources,
        notes: editNotes || null,
        updated_at: new Date().toISOString(),
      }));
      setEditOpen(false);
    }
  }

  // 메시지 전송 (스트리밍)
  async function sendMessage() {
    if (!input.trim() || !team || streaming) return;
    const userContent = input.trim();
    setInput("");

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userContent,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newUserMsg]);
    setStreaming(true);
    setStreamText("");

    const payload = {
      team_id: team.id,
      team_name: team.team_name,
      state,
      messages: [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: userContent },
      ],
    };

    try {
      const res = await fetch("/api/hyfl/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.body) throw new Error("스트림 없음");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStreamText(full);
      }

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: full,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "⚠️ AI 연결에 문제가 생겼어요. 잠시 후 다시 시도해주세요.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setStreaming(false);
      setStreamText("");
    }
  }

  // Enter 전송 (Shift+Enter = 줄바꿈)
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // 채팅창 자동 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  // 로컬스토리지로 팀 코드 기억
  useEffect(() => {
    const saved = localStorage.getItem("hyfl_team_code");
    if (saved) setTeamCode(saved);
  }, []);
  useEffect(() => {
    if (teamCode) localStorage.setItem("hyfl_team_code", teamCode);
  }, [teamCode]);

  const stageColor = STAGE_COLORS[state?.stage as Stage] ?? STAGE_COLORS.start;
  const stageIdx   = STAGE_ORDER.indexOf((state?.stage as Stage) ?? "start");

  // ── 로그인 화면 ──────────────────────────────────────────
  if (!team) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* 헤더 */}
        <div style={{
          background: "linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 50%,#7c3aed 100%)",
          borderRadius: 28, padding: "36px 28px",
          position: "relative", overflow: "hidden",
          boxShadow: "0 12px 40px rgba(29,78,216,0.35)",
        }}>
          {[{w:160,h:160,top:-50,right:-30,op:0.07},{w:80,h:80,bottom:-10,left:60,op:0.06}].map((b,i)=>(
            <div key={i} style={{ position:"absolute",width:b.w,height:b.h,top:b.top,right:b.right,bottom:b.bottom,left:b.left,borderRadius:"50%",background:"#fff",opacity:b.op }}/>
          ))}
          <div style={{ position: "relative" }}>
            <div style={{ display:"inline-flex",alignItems:"center",background:"rgba(255,255,255,0.15)",backdropFilter:"blur(8px)",borderRadius:999,padding:"4px 14px",marginBottom:12,border:"1px solid rgba(255,255,255,0.25)" }}>
              <span style={{ fontSize:12,color:"#fff",fontWeight:700 }}>🏆 제8회 교육 공공데이터 AI활용대회</span>
            </div>
            <h1 style={{ color:"#fff",fontSize:"clamp(22px,4vw,34px)",fontWeight:900,margin:"0 0 10px",letterSpacing:"-0.5px" }}>
              HYFL AI 대회 코치
            </h1>
            <p style={{ color:"rgba(255,255,255,0.85)",fontSize:14,margin:0,lineHeight:1.7 }}>
              막힌 지점을 말해주면 같이 생각해볼게요.<br/>
              <span style={{ color:"#fbbf24",fontWeight:700 }}>직접 답 대신, 생각하는 힘을 키워드려요.</span>
            </p>
          </div>
        </div>

        {/* 로그인 카드 */}
        <div className="hy-card" style={{ padding: "32px 28px", maxWidth: 420 }}>
          <h2 style={{ fontSize:17,fontWeight:900,color:"var(--text)",margin:"0 0 6px" }}>팀 코드로 입장</h2>
          <p style={{ fontSize:13,color:"var(--text-subtle)",margin:"0 0 20px" }}>
            선생님께 받은 팀 코드를 입력해주세요.
          </p>
          <div style={{ display:"flex",gap:8 }}>
            <input
              className="hy-input"
              placeholder="예: team-a, hyfl-1234"
              value={teamCode}
              onChange={e => setTeamCode(e.target.value)}
              onKeyDown={e => e.key === "Enter" && login()}
              style={{ flex:1,fontSize:15 }}
              autoFocus
            />
            <button
              onClick={login}
              disabled={loginLoading || !teamCode.trim()}
              className="hy-btn hy-btn-primary"
              style={{ padding:"10px 20px",fontSize:14,flexShrink:0 }}
            >
              {loginLoading ? "확인 중…" : "입장 →"}
            </button>
          </div>
        </div>

        {/* 안내 카드들 */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12 }}>
          {[
            { emoji:"🤔", title:"막히면 말해요", desc:"어느 단계에서 멈췄는지 먼저 설명해주면 힌트를 드려요." },
            { emoji:"💾", title:"대화가 저장돼요", desc:"다음 날 로그인해도 이전 대화가 그대로 남아있어요." },
            { emoji:"📊", title:"단계별 도움", desc:"문제 정의 → 데이터 탐색 → 분석 → 발표까지 단계별로 안내해요." },
          ].map(card => (
            <div key={card.title} className="hy-card" style={{ padding:"20px 18px" }}>
              <div style={{ fontSize:26,marginBottom:8 }}>{card.emoji}</div>
              <h3 style={{ fontSize:14,fontWeight:800,color:"var(--text)",margin:"0 0 6px" }}>{card.title}</h3>
              <p style={{ fontSize:12,color:"var(--text-subtle)",margin:0,lineHeight:1.6 }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── 메인 화면 (로그인 후) ────────────────────────────────
  const currentStage = (state?.stage as Stage) ?? "start";

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>

      {/* 팀 정보 바 */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:40,height:40,borderRadius:13,background:"linear-gradient(135deg,#1d4ed8,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:16 }}>
            {team.team_name[0]}
          </div>
          <div>
            <div style={{ fontSize:15,fontWeight:900,color:"var(--text)" }}>{team.team_name}</div>
            <div style={{ fontSize:12,color:"var(--text-subtle)" }}>👥 {team.members}</div>
          </div>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={() => setEditOpen(o => !o)} className="hy-btn" style={{ fontSize:12,padding:"7px 14px" }}>
            {editOpen ? "닫기" : "⚙️ 상태 수정"}
          </button>
          <button onClick={logout} className="hy-btn" style={{ fontSize:12,padding:"7px 14px",color:"var(--text-subtle)" }}>
            로그아웃
          </button>
        </div>
      </div>

      {/* 현재 단계 대시보드 */}
      <div style={{ borderRadius:20,padding:"18px 20px",background:stageColor.bg,border:`1.5px solid ${stageColor.border}` }}>
        <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,flexWrap:"wrap" }}>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
              <span style={{ fontSize:13,fontWeight:800,color:stageColor.color,background:"rgba(255,255,255,0.7)",padding:"3px 12px",borderRadius:999,border:`1px solid ${stageColor.border}` }}>
                {STAGE_LABELS[currentStage]}
              </span>
              <span style={{ fontSize:11,color:"var(--text-subtle)" }}>
                {stageIdx + 1} / {STAGE_ORDER.length} 단계
              </span>
            </div>
            {state?.problem_statement && (
              <div style={{ fontSize:13,color:"var(--text)",fontWeight:600,marginBottom:6 }}>
                📌 {state.problem_statement}
              </div>
            )}
            {state?.data_sources && state.data_sources.length > 0 && (
              <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:6 }}>
                {state.data_sources.map(s => (
                  <span key={s} style={{ fontSize:11,fontWeight:700,background:"rgba(255,255,255,0.8)",color:stageColor.color,padding:"2px 10px",borderRadius:999,border:`1px solid ${stageColor.border}` }}>
                    📊 {s}
                  </span>
                ))}
              </div>
            )}
            <div style={{ fontSize:12,color:"var(--text-muted)",marginTop:4,lineHeight:1.6 }}>
              💡 <strong>다음 질문:</strong> {NEXT_HINTS[currentStage]}
            </div>
          </div>

          {/* 진행 바 */}
          <div style={{ display:"flex",gap:4,alignItems:"center",flexShrink:0 }}>
            {STAGE_ORDER.map((s, i) => (
              <div key={s} style={{
                width: i === stageIdx ? 20 : 8,
                height: 8,
                borderRadius: 999,
                background: i < stageIdx ? stageColor.color : i === stageIdx ? stageColor.color : "#e5e7eb",
                opacity: i > stageIdx ? 0.4 : 1,
                transition: "all 0.2s",
              }}/>
            ))}
          </div>
        </div>
      </div>

      {/* 상태 편집 패널 */}
      {editOpen && (
        <div className="hy-card" style={{ padding:"20px 22px" }}>
          <h3 style={{ fontSize:14,fontWeight:800,color:"var(--text)",margin:"0 0 14px" }}>⚙️ 팀 상태 업데이트</h3>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {/* 단계 선택 */}
            <div>
              <div style={{ fontSize:11,fontWeight:700,color:"var(--text-subtle)",marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase" }}>현재 단계</div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                {STAGE_ORDER.map(s => (
                  <button key={s} onClick={() => setEditStage(s)}
                    style={{
                      padding:"6px 14px",borderRadius:999,border:"1.5px solid",fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer",
                      borderColor: editStage === s ? STAGE_COLORS[s].color : "var(--border)",
                      background:  editStage === s ? STAGE_COLORS[s].bg : "#fff",
                      color:       editStage === s ? STAGE_COLORS[s].color : "var(--text-muted)",
                    }}>
                    {STAGE_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize:11,fontWeight:700,color:"var(--text-subtle)",marginBottom:4,letterSpacing:"0.06em",textTransform:"uppercase" }}>문제 정의</div>
              <input className="hy-input" placeholder="예: 고등학생의 야간 수면 부족 현황 분석" value={editProblem} onChange={e => setEditProblem(e.target.value)}/>
            </div>
            <div>
              <div style={{ fontSize:11,fontWeight:700,color:"var(--text-subtle)",marginBottom:4,letterSpacing:"0.06em",textTransform:"uppercase" }}>확보 데이터 (쉼표로 구분)</div>
              <input className="hy-input" placeholder="예: 학교알리미 수면실태 CSV, KOSIS 청소년통계" value={editSource} onChange={e => setEditSource(e.target.value)}/>
            </div>
            <div>
              <div style={{ fontSize:11,fontWeight:700,color:"var(--text-subtle)",marginBottom:4,letterSpacing:"0.06em",textTransform:"uppercase" }}>메모</div>
              <input className="hy-input" placeholder="팀 내부 메모 (선택)" value={editNotes} onChange={e => setEditNotes(e.target.value)}/>
            </div>
            <button onClick={saveState} disabled={savingState} className="hy-btn hy-btn-primary" style={{ fontSize:13,alignSelf:"flex-start" }}>
              {savingState ? "저장 중…" : "저장하기"}
            </button>
          </div>
        </div>
      )}

      {/* 채팅 영역 */}
      <div className="hy-card" style={{ padding:0,overflow:"hidden",display:"flex",flexDirection:"column",minHeight:480 }}>
        {/* 채팅 헤더 */}
        <div style={{ padding:"14px 18px",borderBottom:"1.5px solid var(--border)",background:"linear-gradient(135deg,#1d4ed8,#7c3aed)",display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:32,height:32,borderRadius:10,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>🤖</div>
          <div>
            <div style={{ fontSize:14,fontWeight:800,color:"#fff" }}>AI 대회 코치</div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.75)" }}>막힌 곳을 알려주면 같이 생각해볼게요</div>
          </div>
        </div>

        {/* 메시지 목록 */}
        <div style={{ flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:12,maxHeight:400 }}>
          {messages.length === 0 && !streaming && (
            <div style={{ textAlign:"center",padding:"40px 20px",color:"var(--text-subtle)" }}>
              <div style={{ fontSize:32,marginBottom:12 }}>👋</div>
              <div style={{ fontSize:14,fontWeight:700,marginBottom:6 }}>안녕하세요!</div>
              <div style={{ fontSize:13,lineHeight:1.7 }}>
                지금 어느 단계에서 막혔나요?<br/>막힌 상황을 먼저 설명해주면 같이 생각해볼게요.
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} style={{ display:"flex",justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              {msg.role === "assistant" && (
                <div style={{ width:28,height:28,borderRadius:9,background:"linear-gradient(135deg,#1d4ed8,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,marginRight:8,marginTop:2 }}>🤖</div>
              )}
              <div style={{
                maxWidth:"78%",padding:"10px 14px",borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: msg.role === "user" ? "linear-gradient(135deg,#1d4ed8,#7c3aed)" : "#f8faff",
                color: msg.role === "user" ? "#fff" : "var(--text)",
                fontSize:14,lineHeight:1.7,
                border: msg.role === "assistant" ? "1.5px solid #e0e7ff" : "none",
                whiteSpace:"pre-wrap",wordBreak:"break-word",
              }}>
                {msg.role === "assistant" ? renderContent(msg.content) : msg.content}
              </div>
            </div>
          ))}

          {/* 스트리밍 중 메시지 */}
          {streaming && (
            <div style={{ display:"flex",justifyContent:"flex-start" }}>
              <div style={{ width:28,height:28,borderRadius:9,background:"linear-gradient(135deg,#1d4ed8,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,marginRight:8,marginTop:2 }}>🤖</div>
              <div style={{ maxWidth:"78%",padding:"10px 14px",borderRadius:"18px 18px 18px 4px",background:"#f8faff",border:"1.5px solid #e0e7ff",fontSize:14,lineHeight:1.7,color:"var(--text)",whiteSpace:"pre-wrap",wordBreak:"break-word" }}>
                {streamText
                  ? renderContent(streamText)
                  : <span style={{ display:"flex",gap:4,alignItems:"center" }}>
                      {[0,1,2].map(i => (
                        <span key={i} style={{ width:6,height:6,borderRadius:"50%",background:"#93c5fd",display:"inline-block",animation:`bounce 1.2s ${i*0.2}s infinite` }}/>
                      ))}
                    </span>
                }
              </div>
            </div>
          )}
          <div ref={chatEndRef}/>
        </div>

        {/* 입력창 */}
        <div style={{ padding:"12px 14px",borderTop:"1.5px solid var(--border)",background:"#fafafa",display:"flex",gap:8,alignItems:"flex-end" }}>
          <textarea
            ref={inputRef}
            className="hy-input"
            placeholder="막힌 상황을 설명해주세요… (Enter 전송 / Shift+Enter 줄바꿈)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{ flex:1,resize:"none",minHeight:40,maxHeight:120,fontSize:14,lineHeight:1.5,overflowY:"auto" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || streaming}
            style={{
              width:40,height:40,borderRadius:12,border:"none",flexShrink:0,cursor: input.trim() && !streaming ? "pointer" : "default",
              background: input.trim() && !streaming ? "linear-gradient(135deg,#1d4ed8,#7c3aed)" : "#e5e7eb",
              color: input.trim() && !streaming ? "#fff" : "#9ca3af",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,
              transition:"all 0.15s",
            }}
          >
            {streaming ? "⏳" : "↑"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%,80%,100% { transform: translateY(0); }
          40%          { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
