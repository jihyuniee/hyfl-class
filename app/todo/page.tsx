"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type TodoItem = {
  id: string;
  created_at: string;
  student_no: string;
  name: string;
  date: string;
  content: string;
  done: boolean;
  category: string;
};

type DailyLog = {
  id: string;
  student_no: string;
  name: string;
  date: string;
  study_hours: number | null;
  good: string | null;
  bad: string | null;
  share_reflection: boolean;
};

const CATEGORIES = ["📚 공부", "📝 수행평가", "🏃 운동", "🎯 목표", "💡 기타"];

function toKSTDate() {
  const k = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${k.getFullYear()}-${String(k.getMonth()+1).padStart(2,"0")}-${String(k.getDate()).padStart(2,"0")}`;
}
function fmtDate(d: string) {
  const dt = new Date(`${d}T00:00:00+09:00`);
  const days = ["일","월","화","수","목","금","토"];
  return `${dt.getMonth()+1}월 ${dt.getDate()}일 (${days[dt.getDay()]})`;
}

export default function TodoPage() {
  const today = toKSTDate();

  // 인증
  const [step, setStep] = useState<"login"|"main">("login");
  const [inputNo,    setInputNo]    = useState("");
  const [inputName,  setInputName]  = useState("");
  const [inputLast4, setInputLast4] = useState("");
  const [loginError, setLoginError] = useState("");
  const [me, setMe] = useState<{ student_no: string; name: string } | null>(null);

  // 할일
  const [todos,      setTodos]      = useState<TodoItem[]>([]);
  const [newTodo,    setNewTodo]    = useState("");
  const [newCat,     setNewCat]     = useState(CATEGORIES[0]);
  const [newDate,    setNewDate]    = useState(today);
  const [adding,     setAdding]     = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [viewDate,   setViewDate]   = useState(today);

  // 회고
  const [log,             setLog]             = useState<DailyLog | null>(null);
  const [studyHours,      setStudyHours]      = useState("");
  const [good,            setGood]            = useState("");
  const [bad,             setBad]             = useState("");
  const [shareReflection, setShareReflection] = useState(false);
  const [savingLog,       setSavingLog]       = useState(false);
  const [logSaved,        setLogSaved]        = useState(false);

  // 반 피드
  const [feed, setFeed] = useState<DailyLog[]>([]);

  async function loadAll(sNo: string) {
    const { data: t } = await supabase.from("todo_items").select("*")
      .eq("student_no", sNo).order("date").order("done").order("created_at");
    setTodos((t as TodoItem[]) ?? []);

    const { data: l } = await supabase.from("daily_logs").select("*")
      .eq("student_no", sNo).eq("date", today).maybeSingle();
    if (l) {
      setLog(l as DailyLog);
      setStudyHours(String((l as DailyLog).study_hours ?? ""));
      setGood((l as DailyLog).good ?? "");
      setBad((l as DailyLog).bad ?? "");
      setShareReflection((l as DailyLog).share_reflection ?? false);
    }

    const { data: f } = await supabase.from("daily_logs").select("*")
      .eq("date", today).order("created_at", { ascending: false });
    setFeed((f as DailyLog[]) ?? []);
  }

  async function handleLogin() {
    setLoginError("");
    if (!inputNo.trim() || !inputName.trim() || !inputLast4.trim()) {
      setLoginError("모든 항목을 입력해주세요"); return;
    }
    const { data, error } = await supabase.from("student_contacts").select("*")
      .eq("student_no", inputNo.trim()).eq("name", inputName.trim()).maybeSingle();
    if (error || !data) { setLoginError("학번 또는 이름이 일치하지 않아요"); return; }
    if ((data.student_phone as string).replace(/\D/g,"").slice(-4) !== inputLast4.trim()) {
      setLoginError("전화번호 뒤 4자리가 일치하지 않아요"); return;
    }
    const user = { student_no: inputNo.trim(), name: inputName.trim() };
    setMe(user);
    setStep("main");
    await loadAll(user.student_no);
  }

  async function addTodo() {
    if (!newTodo.trim() || !me) return;
    setAdding(true);
    await supabase.from("todo_items").insert({
      student_no: me.student_no, name: me.name,
      date: newDate, content: newTodo.trim(), done: false, category: newCat,
    });
    setAdding(false); setNewTodo(""); setShowForm(false);
    const { data } = await supabase.from("todo_items").select("*")
      .eq("student_no", me.student_no).order("date").order("done").order("created_at");
    setTodos((data as TodoItem[]) ?? []);
  }

  async function toggleDone(id: string, done: boolean) {
    await supabase.from("todo_items").update({ done: !done }).eq("id", id);
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !done } : t));
  }

  async function deleteTodo(id: string) {
    await supabase.from("todo_items").delete().eq("id", id);
    setTodos(prev => prev.filter(t => t.id !== id));
  }

  async function saveLog() {
    if (!me) return;
    setSavingLog(true);
    const payload = {
      student_no: me.student_no, name: me.name, date: today,
      study_hours: studyHours ? Number(studyHours) : null,
      good: good.trim() || null,
      bad: bad.trim() || null,
      share_reflection: shareReflection,
    };
    if (log) {
      await supabase.from("daily_logs").update(payload).eq("id", log.id);
    } else {
      await supabase.from("daily_logs").insert(payload);
    }
    setSavingLog(false); setLogSaved(true);
    setTimeout(() => setLogSaved(false), 2000);
    await loadAll(me.student_no);
  }

  const viewTodos = todos.filter(t => t.date === viewDate);
  const doneCnt   = viewTodos.filter(t => t.done).length;
  const dateSet   = [...new Set(todos.map(t => t.date))].sort().reverse();
  if (!dateSet.includes(today)) dateSet.unshift(today);

  // ── 로그인 ──
  if (step === "login") return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div className="hy-hero">
        <h1 style={{ color:"#fff", fontSize:"clamp(20px,4vw,30px)", fontWeight:900, margin:"0 0 8px" }}>✅ 나의 할일</h1>
        <p style={{ color:"rgba(255,255,255,0.85)", fontSize:13, margin:0, lineHeight:1.7 }}>
          매일 할 일을 적고, 체크하고, 하루를 돌아봐요 🙂
        </p>
      </div>
      <div className="hy-card" style={{ padding:"28px 24px", maxWidth:420, margin:"0 auto", width:"100%" }}>
        <h2 style={{ fontSize:16, fontWeight:900, color:"var(--text)", margin:"0 0 6px" }}>🔐 본인 확인</h2>
        <p style={{ fontSize:13, color:"var(--text-muted)", margin:"0 0 20px", lineHeight:1.6 }}>
          내 할일만 볼 수 있도록 인증이 필요해요
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <input placeholder="학번 (예: 20201)" value={inputNo}
            onChange={e=>setInputNo(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}
            className="hy-input" inputMode="numeric"/>
          <input placeholder="이름" value={inputName}
            onChange={e=>setInputName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}
            className="hy-input"/>
          <input placeholder="전화번호 뒤 4자리" value={inputLast4}
            onChange={e=>setInputLast4(e.target.value.replace(/\D/g,"").slice(0,4))}
            onKeyDown={e=>e.key==="Enter"&&handleLogin()}
            className="hy-input" inputMode="numeric" maxLength={4}/>
          {loginError && <p style={{ fontSize:13, color:"#ef4444", fontWeight:700, margin:0 }}>⚠️ {loginError}</p>}
          <button onClick={handleLogin} className="hy-btn hy-btn-primary" style={{ fontSize:14, marginTop:4 }}>
            시작하기
          </button>
        </div>
      </div>
    </div>
  );

  // ── 메인 ──
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* 헤더 */}
      <div className="hy-hero">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <p style={{ color:"rgba(255,255,255,0.8)", fontSize:12, fontWeight:700, margin:"0 0 4px" }}>
              {me?.student_no} {me?.name}의 공간
            </p>
            <h1 style={{ color:"#fff", fontSize:"clamp(20px,4vw,28px)", fontWeight:900, margin:"0 0 2px" }}>✅ 나의 할일</h1>
            <p style={{ color:"rgba(255,255,255,0.8)", fontSize:13, margin:0 }}>{fmtDate(today)}</p>
          </div>
          <button onClick={()=>{ setStep("login"); setMe(null); }}
            style={{ padding:"6px 12px", borderRadius:999, border:"1px solid rgba(255,255,255,0.4)",
              background:"rgba(255,255,255,0.15)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            로그아웃
          </button>
        </div>
      </div>

      {/* 날짜 탭 */}
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
        {dateSet.map(d => (
          <button key={d} onClick={()=>setViewDate(d)}
            style={{ flexShrink:0, padding:"8px 16px", borderRadius:999, border:"1.5px solid",
              borderColor: viewDate===d ? "var(--primary)" : "var(--border)",
              background: viewDate===d ? "var(--primary)" : "#fff",
              color: viewDate===d ? "#fff" : "var(--text-muted)",
              fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>
            {d===today ? "🗓 오늘" : fmtDate(d)}
          </button>
        ))}
      </div>

      {/* 진행률 */}
      {viewTodos.length > 0 && (
        <div className="hy-card" style={{ padding:"14px 18px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>진행률</span>
            <span style={{ fontSize:13, fontWeight:900, color:"var(--primary)" }}>
              {doneCnt}/{viewTodos.length} {doneCnt===viewTodos.length ? "🎉 완료!" : ""}
            </span>
          </div>
          <div style={{ height:8, borderRadius:999, background:"#f3e8ff", overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:999, background:"linear-gradient(90deg,var(--primary),var(--accent))",
              width:`${viewTodos.length ? (doneCnt/viewTodos.length)*100 : 0}%`, transition:"width 0.4s" }}/>
          </div>
        </div>
      )}

      {/* 할일 목록 */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {viewTodos.length === 0 ? (
          <div className="hy-card" style={{ padding:"32px", textAlign:"center" }}>
            <p style={{ fontSize:24, margin:"0 0 8px" }}>📝</p>
            <p style={{ fontSize:13, color:"var(--text-subtle)", fontWeight:600 }}>
              {viewDate===today ? "오늘 할 일을 추가해봐요!" : "이 날엔 할 일이 없어요"}
            </p>
          </div>
        ) : (
          viewTodos.map(todo => (
            <div key={todo.id} className="hy-card" style={{
              padding:"14px 18px", opacity: todo.done ? 0.55 : 1, transition:"opacity 0.2s",
              borderLeft:`3px solid ${todo.done ? "#22c55e" : "var(--primary)"}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <button onClick={()=>toggleDone(todo.id, todo.done)}
                  style={{ width:26, height:26, borderRadius:"50%", border:"2px solid", flexShrink:0,
                    borderColor: todo.done ? "#22c55e" : "var(--border)",
                    background: todo.done ? "#22c55e" : "#fff",
                    cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:13, color:"#fff", fontWeight:900 }}>
                  {todo.done ? "✓" : ""}
                </button>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:14, fontWeight:700, color:"var(--text)", margin:"0 0 2px",
                    textDecoration: todo.done ? "line-through" : "none" }}>{todo.content}</p>
                  <p style={{ fontSize:11, color:"var(--text-subtle)", margin:0, fontWeight:600 }}>{todo.category}</p>
                </div>
                <button onClick={()=>deleteTodo(todo.id)}
                  style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"var(--text-subtle)", padding:"4px", lineHeight:1 }}>×</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 할일 추가 폼 */}
      {showForm ? (
        <div className="hy-card" style={{ padding:"18px 20px" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <input placeholder="할 일 입력" value={newTodo}
              onChange={e=>setNewTodo(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTodo()}
              className="hy-input" autoFocus/>
            <div style={{ display:"flex", gap:8 }}>
              <select value={newCat} onChange={e=>setNewCat(e.target.value)} className="hy-input" style={{ flex:1, cursor:"pointer" }}>
                {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} className="hy-input" style={{ flex:1 }}/>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={addTodo} disabled={adding} className="hy-btn hy-btn-primary" style={{ flex:1, fontSize:13 }}>
                {adding ? "추가 중..." : "추가하기"}
              </button>
              <button onClick={()=>{ setShowForm(false); setNewTodo(""); }} className="hy-btn" style={{ fontSize:13 }}>취소</button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={()=>setShowForm(true)}
          style={{ padding:"14px", borderRadius:16, border:"2px dashed var(--border)", background:"transparent",
            fontSize:13, fontWeight:700, color:"var(--text-muted)", cursor:"pointer", fontFamily:"inherit" }}>
          ＋ 할 일 추가하기
        </button>
      )}

      {/* ── 오늘 회고 (오늘 날짜일 때만) ── */}
      {viewDate === today && (
        <div className="hy-card" style={{ padding:"22px 24px" }}>
          <h3 style={{ fontSize:15, fontWeight:900, color:"var(--text)", margin:"0 0 4px" }}>📔 오늘 회고</h3>
          <p style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:600, margin:"0 0 16px" }}>
            하루를 돌아보며 간단히 적어봐요. 강제 아님, 쓰고 싶을 때만 🙂
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

            {/* 공부 시간 */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:5 }}>
                ⏱ 오늘 공부 시간 (시간)
              </label>
              <input type="number" placeholder="예: 3.5" value={studyHours}
                onChange={e=>setStudyHours(e.target.value)}
                className="hy-input" min="0" max="24" step="0.5" inputMode="decimal"/>
            </div>

            {/* 잘한 점 */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"#16a34a", display:"block", marginBottom:5 }}>
                ✅ 잘한 점
              </label>
              <textarea placeholder="오늘 잘한 것, 뿌듯했던 것을 적어봐요"
                value={good} onChange={e=>setGood(e.target.value)}
                className="hy-input" style={{ minHeight:70, resize:"vertical",
                  borderColor: good ? "#86efac" : undefined, background: good ? "#f0fdf4" : undefined }}/>
            </div>

            {/* 아쉬운 점 */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"#f59e0b", display:"block", marginBottom:5 }}>
                💭 아쉬운 점 & 내일 다짐
              </label>
              <textarea placeholder="아쉬웠던 점, 내일은 이렇게 해볼 것을 적어봐요"
                value={bad} onChange={e=>setBad(e.target.value)}
                className="hy-input" style={{ minHeight:70, resize:"vertical",
                  borderColor: bad ? "#fde68a" : undefined, background: bad ? "#fffbeb" : undefined }}/>
            </div>

            {/* 공개 여부 */}
            <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer",
              padding:"12px 14px", borderRadius:12, background:"#f9fafb", border:"1.5px solid var(--border)" }}>
              <input type="checkbox" checked={shareReflection} onChange={e=>setShareReflection(e.target.checked)}
                style={{ width:16, height:16, cursor:"pointer" }}/>
              <div>
                <p style={{ fontSize:13, fontWeight:700, color:"var(--text)", margin:"0 0 2px" }}>
                  🔥 반 피드에 공유하기
                </p>
                <p style={{ fontSize:11, color:"var(--text-subtle)", margin:0 }}>
                  체크하면 친구들 피드에 회고 내용이 보여요
                </p>
              </div>
            </label>

            <button onClick={saveLog} disabled={savingLog} className="hy-btn hy-btn-primary" style={{ fontSize:14 }}>
              {savingLog ? "저장 중..." : logSaved ? "✅ 저장 완료!" : "💾 회고 저장하기"}
            </button>
          </div>
        </div>
      )}

      {/* 과거 회고 보기 */}
      {viewDate !== today && (() => {
        const pastLog = feed.find(f => f.student_no === me?.student_no && f.date === viewDate);
        return null; // 과거 날짜 회고는 별도 조회 필요 — 현재는 생략
      })()}

      {/* ── 반 피드 ── */}
      <div className="hy-card" style={{ padding:"20px 22px" }}>
        <h3 style={{ fontSize:15, fontWeight:900, color:"var(--text)", margin:"0 0 4px" }}>
          🔥 오늘 우리반 현황
        </h3>
        <p style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:600, margin:"0 0 14px" }}>
          오늘 기록을 남긴 친구 {feed.length}명
        </p>
        {feed.length === 0 ? (
          <p style={{ fontSize:13, color:"var(--text-subtle)", fontWeight:600, margin:0 }}>
            아직 기록한 친구가 없어요. 첫 번째가 되어봐요! 🙂
          </p>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {feed.map((f, i) => {
              const myTodos = todos.filter(t => t.student_no === f.student_no && t.date === today);
              const myDone  = myTodos.filter(t => t.done).length;
              const isMe    = f.student_no === me?.student_no;
              return (
                <div key={f.id} style={{ padding:"14px 16px", borderRadius:14,
                  background: isMe ? "linear-gradient(135deg,#fdf2f8,#f5f3ff)" : "#f9fafb",
                  border: `1.5px solid ${isMe ? "#f9a8d4" : "var(--border)"}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: f.share_reflection && (f.good || f.bad) ? 10 : 0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:13, fontWeight:900, color:"var(--text-subtle)", minWidth:20 }}>{i+1}</span>
                      <span style={{ fontSize:14, fontWeight:900, color:"var(--text)" }}>
                        {f.name} {isMe && <span style={{ fontSize:11, color:"var(--primary)" }}>(나)</span>}
                      </span>
                    </div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      {f.study_hours && (
                        <span style={{ fontSize:12, fontWeight:800, color:"var(--primary)",
                          background:"var(--primary-light)", padding:"3px 10px", borderRadius:999 }}>
                          ⏱ {f.study_hours}h
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 공유된 회고 */}
                  {f.share_reflection && (f.good || f.bad) && (
                    <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:8, paddingTop:8, borderTop:"1px solid rgba(0,0,0,0.06)" }}>
                      {f.good && (
                        <p style={{ fontSize:12, color:"#15803d", margin:0, lineHeight:1.6 }}>
                          <span style={{ fontWeight:800 }}>✅ 잘한 점</span> {f.good}
                        </p>
                      )}
                      {f.bad && (
                        <p style={{ fontSize:12, color:"#92400e", margin:0, lineHeight:1.6 }}>
                          <span style={{ fontWeight:800 }}>💭 아쉬운 점</span> {f.bad}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
