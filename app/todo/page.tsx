"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/components/lib/supabaseClient";

// ── 타입 ──────────────────────────────────────────────
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

// ── 상수 ──────────────────────────────────────────────
const CATEGORIES = ["국어", "영어", "수학", "사회", "과학", "중국어", "기타"];

const CAT_STYLE: Record<string, { bg: string; color: string; dot: string; border: string }> = {
  국어:   { bg: "#fdf4ff", color: "#9333ea", dot: "#9333ea", border: "#e9d5ff" },
  영어:   { bg: "#eff6ff", color: "#2563eb", dot: "#2563eb", border: "#bfdbfe" },
  수학:   { bg: "#fff1f2", color: "#e11d48", dot: "#e11d48", border: "#fecdd3" },
  사회:   { bg: "#fefce8", color: "#ca8a04", dot: "#eab308", border: "#fef08a" },
  과학:   { bg: "#f0fdf4", color: "#16a34a", dot: "#16a34a", border: "#bbf7d0" },
  중국어: { bg: "#fff7ed", color: "#ea580c", dot: "#f97316", border: "#fed7aa" },
  기타:   { bg: "#f8fafc", color: "#64748b", dot: "#94a3b8", border: "#e2e8f0" },
};

const MONTHS_KO = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const DAYS_KO   = ["일","월","화","수","목","금","토"];
const DAYS_FULL = ["일요일","월요일","화요일","수요일","목요일","금요일","토요일"];

function toKST(d: Date) {
  return new Date(d.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
}
function isoDate(d: Date) {
  const k = toKST(d);
  return `${k.getFullYear()}-${String(k.getMonth()+1).padStart(2,"0")}-${String(k.getDate()).padStart(2,"0")}`;
}
function toKSTDate() { return isoDate(new Date()); }
function fmtFull(iso: string) {
  const d = new Date(`${iso}T00:00:00+09:00`);
  return `${d.getMonth()+1}월 ${d.getDate()}일 (${DAYS_FULL[d.getDay()]})`;
}

// ── 미니 달력 ────────────────────────────────────────
function MiniCalendar({
  selectedDate, onSelect, dotsOn,
}: {
  selectedDate: string;
  onSelect: (iso: string) => void;
  dotsOn: Set<string>;
}) {
  const today = toKSTDate();
  const initD  = new Date(`${selectedDate}T00:00:00+09:00`);
  const [year,  setYear]  = useState(initD.getFullYear());
  const [month, setMonth] = useState(initD.getMonth());

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function isoOf(day: number) {
    return `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  }

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <button onClick={() => { if (month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1); }}
          style={{ width:28, height:28, borderRadius:7, border:"1.5px solid var(--border)",
            background:"#fff", cursor:"pointer", fontSize:14, display:"flex",
            alignItems:"center", justifyContent:"center", color:"var(--text-muted)" }}>‹</button>
        <span style={{ fontSize:14, fontWeight:800, color:"var(--text)" }}>
          {year}년 {MONTHS_KO[month]}
        </span>
        <button onClick={() => { if (month===11){setYear(y=>y+1);setMonth(0);}else setMonth(m=>m+1); }}
          style={{ width:28, height:28, borderRadius:7, border:"1.5px solid var(--border)",
            background:"#fff", cursor:"pointer", fontSize:14, display:"flex",
            alignItems:"center", justifyContent:"center", color:"var(--text-muted)" }}>›</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1, marginBottom:3 }}>
        {DAYS_KO.map((d, i) => (
          <div key={d} style={{
            textAlign:"center", fontSize:10, fontWeight:700, padding:"3px 0",
            color: i===0 ? "#e11d48" : i===6 ? "#2563eb" : "var(--text-subtle)",
          }}>{d}</div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1 }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const iso     = isoOf(day);
          const isToday = iso === today;
          const isSel   = iso === selectedDate;
          const hasDot  = dotsOn.has(iso);
          const dow     = (firstDay + day - 1) % 7;
          return (
            <div key={idx} onClick={() => onSelect(iso)}
              style={{
                aspectRatio:"1", display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center",
                borderRadius:7, cursor:"pointer",
                background: isSel ? "var(--primary)" : isToday ? "var(--primary-light)" : "transparent",
                transition:"background 0.1s",
              }}>
              <span style={{
                fontSize:12, fontWeight: isSel || isToday ? 800 : 500,
                color: isSel ? "#fff"
                  : isToday ? "var(--primary)"
                  : dow===0 ? "#e11d48" : dow===6 ? "#2563eb" : "var(--text)",
              }}>{day}</span>
              {hasDot && (
                <span style={{
                  width:3, height:3, borderRadius:"50%", marginTop:1,
                  background: isSel ? "rgba(255,255,255,0.7)" : "var(--primary)",
                  display:"block",
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────
export default function TodoPage() {
  const today  = toKSTDate();
  const nowKST = toKST(new Date());

  // 인증
  const [step,       setStep]       = useState<"login"|"main">("login");
  const [inputNo,    setInputNo]    = useState("");
  const [inputName,  setInputName]  = useState("");
  const [inputLast4, setInputLast4] = useState("");
  const [loginError, setLoginError] = useState("");
  const [me,         setMe]         = useState<{ student_no: string; name: string } | null>(null);

  // 데이터
  const [todos,   setTodos]   = useState<TodoItem[]>([]);
  const [logData, setLogData] = useState<DailyLog[]>([]);
  const [feed,    setFeed]    = useState<DailyLog[]>([]);

  // 선택 날짜
  const [viewDate, setViewDate] = useState(today);

  // 할일 추가
  const [newTodo, setNewTodo] = useState("");
  const [newCat,  setNewCat]  = useState(CATEGORIES[0]);
  const [adding,  setAdding]  = useState(false);

  // 오늘 회고
  const [log,             setLog]             = useState<DailyLog | null>(null);
  const [studyHours,      setStudyHours]      = useState("");
  const [good,            setGood]            = useState("");
  const [bad,             setBad]             = useState("");
  const [shareReflection, setShareReflection] = useState(false);
  const [savingLog,       setSavingLog]       = useState(false);
  const [logSaved,        setLogSaved]        = useState(false);

  // ── 데이터 로드 ─────────────────────────────────────
  async function loadAll(sNo: string) {
    const [{ data: t }, { data: l }, { data: f }, { data: todayLog }] = await Promise.all([
      supabase.from("todo_items").select("*").eq("student_no", sNo)
        .order("date").order("done").order("created_at"),
      supabase.from("daily_logs").select("*").eq("student_no", sNo).order("date"),
      supabase.from("daily_logs").select("*").eq("date", today)
        .order("created_at", { ascending: false }),
      supabase.from("daily_logs").select("*").eq("student_no", sNo)
        .eq("date", today).maybeSingle(),
    ]);
    setTodos((t as TodoItem[]) ?? []);
    setLogData((l as DailyLog[]) ?? []);
    setFeed((f as DailyLog[]) ?? []);
    if (todayLog) {
      const tl = todayLog as DailyLog;
      setLog(tl);
      setStudyHours(String(tl.study_hours ?? ""));
      setGood(tl.good ?? "");
      setBad(tl.bad ?? "");
      setShareReflection(tl.share_reflection ?? false);
    } else {
      setLog(null); setStudyHours(""); setGood(""); setBad(""); setShareReflection(false);
    }
  }

  // ── 로그인 ──────────────────────────────────────────
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
    setMe(user); setStep("main");
    await loadAll(user.student_no);
  }

  // ── 할일 CRUD ───────────────────────────────────────
  async function addTodo() {
    if (!newTodo.trim() || !me) return;
    setAdding(true);
    await supabase.from("todo_items").insert({
      student_no: me.student_no, name: me.name,
      date: viewDate, content: newTodo.trim(), done: false, category: newCat,
    });
    setAdding(false); setNewTodo("");
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

  // ── 회고 저장 ────────────────────────────────────────
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

  // ── 파생 값 ─────────────────────────────────────────
  const viewTodos = useMemo(() => todos.filter(t => t.date === viewDate), [todos, viewDate]);
  const doneCnt   = viewTodos.filter(t => t.done).length;
  const doneRate  = viewTodos.length ? Math.round((doneCnt / viewTodos.length) * 100) : 0;
  const todoDates = useMemo(() => new Set(todos.map(t => t.date)), [todos]);

  const thisMonthPrefix = `${nowKST.getFullYear()}-${String(nowKST.getMonth()+1).padStart(2,"0")}`;
  const monthTodos = useMemo(
    () => todos.filter(t => t.date.startsWith(thisMonthPrefix)),
    [todos, thisMonthPrefix]
  );
  const catStats = useMemo(() =>
    CATEGORIES.map(cat => ({
      cat,
      total: monthTodos.filter(t => t.category === cat).length,
      done:  monthTodos.filter(t => t.category === cat && t.done).length,
    })).filter(s => s.total > 0),
    [monthTodos]
  );

  const viewLog = useMemo(
    () => logData.find(l => l.date === viewDate) ?? null,
    [logData, viewDate]
  );

  // ── 로그인 화면 ─────────────────────────────────────
  if (step === "login") return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div className="hy-hero">
        <h1 style={{ color:"#fff", fontSize:"clamp(20px,4vw,30px)", fontWeight:900, margin:"0 0 8px" }}>
          ✅ 나의 할일
        </h1>
        <p style={{ color:"rgba(255,255,255,0.85)", fontSize:13, margin:0, lineHeight:1.7 }}>
          매일 할 일을 적고, 체크하고, 하루를 돌아봐요 🙂
        </p>
      </div>
      <div className="hy-card" style={{ padding:"28px 24px", maxWidth:400, margin:"0 auto", width:"100%" }}>
        <h2 style={{ fontSize:15, fontWeight:900, color:"var(--text)", margin:"0 0 6px" }}>🔐 본인 확인</h2>
        <p style={{ fontSize:12, color:"var(--text-muted)", margin:"0 0 18px", lineHeight:1.6 }}>
          내 할일만 볼 수 있도록 인증이 필요해요
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <input placeholder="학번 (예: 20201)" value={inputNo}
            onChange={e => setInputNo(e.target.value)} onKeyDown={e => e.key==="Enter"&&handleLogin()}
            className="hy-input" inputMode="numeric" />
          <input placeholder="이름" value={inputName}
            onChange={e => setInputName(e.target.value)} onKeyDown={e => e.key==="Enter"&&handleLogin()}
            className="hy-input" />
          <input placeholder="전화번호 뒤 4자리" value={inputLast4}
            onChange={e => setInputLast4(e.target.value.replace(/\D/g,"").slice(0,4))}
            onKeyDown={e => e.key==="Enter"&&handleLogin()}
            className="hy-input" inputMode="numeric" maxLength={4} />
          {loginError && (
            <p style={{ fontSize:12, color:"#ef4444", fontWeight:700, margin:0 }}>⚠️ {loginError}</p>
          )}
          <button onClick={handleLogin} className="hy-btn hy-btn-primary" style={{ fontSize:14, marginTop:4 }}>
            시작하기
          </button>
        </div>
      </div>
    </div>
  );

  // ── 메인 화면 ────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* 헤더 */}
      <div className="hy-hero">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <p style={{ color:"rgba(255,255,255,0.75)", fontSize:11, fontWeight:700, margin:"0 0 4px" }}>
              {me?.student_no} · {me?.name}의 공간
            </p>
            <h1 style={{ color:"#fff", fontSize:"clamp(18px,4vw,26px)", fontWeight:900, margin:"0 0 2px" }}>
              ✅ 나의 할일
            </h1>
            <p style={{ color:"rgba(255,255,255,0.75)", fontSize:12, margin:0 }}>{fmtFull(today)}</p>
          </div>
          <button onClick={() => { setStep("login"); setMe(null); }}
            style={{ padding:"6px 12px", borderRadius:999, border:"1px solid rgba(255,255,255,0.35)",
              background:"rgba(255,255,255,0.12)", color:"#fff", fontSize:11, fontWeight:700,
              cursor:"pointer", fontFamily:"inherit" }}>
            로그아웃
          </button>
        </div>
      </div>

      {/* 2단 그리드 */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"clamp(220px,26%,272px) 1fr",
        gap:14, alignItems:"start",
      }}>

        {/* ── 왼쪽: 달력 + 이달 통계 ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

          <div className="hy-card" style={{ padding:"16px 14px" }}>
            <MiniCalendar
              selectedDate={viewDate}
              onSelect={setViewDate}
              dotsOn={todoDates}
            />
          </div>

          {catStats.length > 0 && (
            <div className="hy-card" style={{ padding:"14px 14px" }}>
              <p style={{ fontSize:11, fontWeight:800, color:"var(--text-muted)", margin:"0 0 10px" }}>
                이달의 과목별 현황
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {catStats.map(({ cat, total, done }) => {
                  const rate = total ? Math.round((done/total)*100) : 0;
                  const st   = CAT_STYLE[cat] ?? CAT_STYLE["기타"];
                  return (
                    <div key={cat}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                        <span style={{
                          fontSize:11, fontWeight:700, padding:"1px 7px", borderRadius:999,
                          background:st.bg, color:st.color,
                        }}>{cat}</span>
                        <span style={{ fontSize:10, color:"var(--text-subtle)", fontWeight:700 }}>
                          {done}/{total}
                        </span>
                      </div>
                      <div style={{ height:4, borderRadius:999, background:"#f1f5f9", overflow:"hidden" }}>
                        <div style={{
                          height:"100%", borderRadius:999, background:st.dot,
                          width:`${rate}%`, transition:"width 0.4s",
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── 오른쪽 ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

          {/* 날짜 헤더 + 진행률 */}
          <div className="hy-card" style={{ padding:"14px 16px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
              marginBottom: viewTodos.length > 0 ? 10 : 0 }}>
              <div>
                <p style={{ fontSize:16, fontWeight:900, color:"var(--text)", margin:"0 0 1px" }}>
                  {fmtFull(viewDate)}
                </p>
                <p style={{ fontSize:11, color:"var(--text-muted)", margin:0, fontWeight:600 }}>
                  {viewDate === today ? "오늘" : viewDate < today ? "지난 날" : "예정된 날"}
                </p>
              </div>
              {viewTodos.length > 0 && (
                <span style={{
                  fontSize:13, fontWeight:900, padding:"5px 12px", borderRadius:999,
                  color: doneRate===100 ? "#16a34a" : "var(--primary)",
                  background: doneRate===100 ? "#f0fdf4" : "var(--primary-light)",
                }}>
                  {doneRate===100 ? "🎉 완료!" : `${doneCnt}/${viewTodos.length}`}
                </span>
              )}
            </div>
            {viewTodos.length > 0 && (
              <div style={{ height:5, borderRadius:999, background:"#f3e8ff", overflow:"hidden" }}>
                <div style={{
                  height:"100%", borderRadius:999,
                  background: doneRate===100
                    ? "linear-gradient(90deg,#22c55e,#16a34a)"
                    : "linear-gradient(90deg,var(--primary),var(--accent))",
                  width:`${doneRate}%`, transition:"width 0.4s",
                }} />
              </div>
            )}
          </div>

          {/* 할일 목록 */}
          <div className="hy-card" style={{ padding:"16px 16px" }}>
            <p style={{ fontSize:12, fontWeight:800, color:"var(--text-muted)", margin:"0 0 10px" }}>
              할일 목록
            </p>

            <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:10 }}>
              {viewTodos.length === 0 ? (
                <div style={{ padding:"20px 0", textAlign:"center" }}>
                  <p style={{ fontSize:20, margin:"0 0 5px" }}>📝</p>
                  <p style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:600, margin:0 }}>
                    {viewDate === today ? "오늘 할 일을 추가해봐요!" : "이 날엔 할 일이 없어요"}
                  </p>
                </div>
              ) : (
                viewTodos.map(todo => {
                  const st = CAT_STYLE[todo.category] ?? CAT_STYLE["기타"];
                  return (
                    <div key={todo.id} style={{
                      display:"flex", alignItems:"center", gap:10,
                      padding:"10px 12px", borderRadius:10,
                      border:`1px solid ${todo.done ? "#dcfce7" : st.border}`,
                      background: todo.done ? "#f0fdf4" : st.bg,
                      borderLeft:`3px solid ${todo.done ? "#22c55e" : st.dot}`,
                      transition:"all 0.15s",
                    }}>
                      <button onClick={() => toggleDone(todo.id, todo.done)}
                        style={{
                          width:20, height:20, borderRadius:5, border:"2px solid", flexShrink:0,
                          borderColor: todo.done ? "#22c55e" : st.dot,
                          background: todo.done ? "#22c55e" : "#fff",
                          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:11, color:"#fff", fontWeight:900, transition:"all 0.15s",
                        }}>
                        {todo.done ? "✓" : ""}
                      </button>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{
                          fontSize:13, fontWeight:700, margin:"0 0 2px",
                          color: todo.done ? "var(--text-subtle)" : "var(--text)",
                          textDecoration: todo.done ? "line-through" : "none",
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                        }}>{todo.content}</p>
                        <span style={{
                          fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:999,
                          background: todo.done ? "#dcfce7" : st.bg,
                          color: todo.done ? "#16a34a" : st.color,
                          border:`1px solid ${todo.done ? "#bbf7d0" : st.border}`,
                        }}>{todo.category}</span>
                      </div>
                      <button onClick={() => deleteTodo(todo.id)}
                        style={{
                          background:"none", border:"none", cursor:"pointer", fontSize:16,
                          color:"var(--text-subtle)", padding:"2px", lineHeight:1,
                          opacity:0.4, transition:"opacity 0.15s", flexShrink:0,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity="1")}
                        onMouseLeave={e => (e.currentTarget.style.opacity="0.4")}>
                        ×
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* 추가 인풋 — 항상 하단 고정 */}
            <div style={{ display:"flex", gap:7, alignItems:"center" }}>
              <input
                placeholder="새 할일 입력 후 Enter"
                value={newTodo}
                onChange={e => setNewTodo(e.target.value)}
                onKeyDown={e => e.key==="Enter" && addTodo()}
                className="hy-input"
                style={{ flex:1, fontSize:12 }}
              />
              <select
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
                className="hy-input"
                style={{ width:78, fontSize:12, cursor:"pointer", flexShrink:0 }}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={addTodo} disabled={adding}
                className="hy-btn hy-btn-primary"
                style={{ fontSize:12, padding:"8px 14px", flexShrink:0 }}>
                {adding ? "..." : "추가"}
              </button>
            </div>
          </div>

          {/* ── 회고 ── */}
          {viewDate === today ? (
            <div className="hy-card" style={{ padding:"16px 16px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <p style={{ fontSize:13, fontWeight:900, color:"var(--text)", margin:0 }}>📔 오늘 회고</p>
                <span style={{ fontSize:10, color:"var(--text-subtle)", fontWeight:600 }}>
                  쓰고 싶을 때만 🙂
                </span>
              </div>

              {/* 공부 시간 */}
              <div style={{ marginBottom:10 }}>
                <label style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:4 }}>
                  ⏱ 오늘 공부 시간 (시간)
                </label>
                <input type="number" placeholder="예: 3.5" value={studyHours}
                  onChange={e => setStudyHours(e.target.value)}
                  className="hy-input" min="0" max="24" step="0.5" inputMode="decimal"
                  style={{ maxWidth:140, fontSize:13 }} />
              </div>

              {/* 잘한 점 + 아쉬운 점 나란히 */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:"#16a34a", display:"block", marginBottom:4 }}>
                    ✅ 잘한 점
                  </label>
                  <textarea placeholder="오늘 뿌듯했던 것..."
                    value={good} onChange={e => setGood(e.target.value)}
                    className="hy-input"
                    style={{
                      minHeight:80, resize:"vertical", fontSize:12, lineHeight:1.6,
                      borderColor: good ? "#86efac" : undefined,
                      background: good ? "#f0fdf4" : undefined,
                    }} />
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:"#ca8a04", display:"block", marginBottom:4 }}>
                    💭 아쉬운 점 & 내일 다짐
                  </label>
                  <textarea placeholder="내일은 이렇게..."
                    value={bad} onChange={e => setBad(e.target.value)}
                    className="hy-input"
                    style={{
                      minHeight:80, resize:"vertical", fontSize:12, lineHeight:1.6,
                      borderColor: bad ? "#fde68a" : undefined,
                      background: bad ? "#fffbeb" : undefined,
                    }} />
                </div>
              </div>

              {/* 공유 + 저장 */}
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <label style={{
                  display:"flex", alignItems:"center", gap:7, cursor:"pointer",
                  padding:"7px 12px", borderRadius:8, flex:1, minWidth:160,
                  background: shareReflection ? "#fdf4ff" : "#f8fafc",
                  border:`1px solid ${shareReflection ? "#e9d5ff" : "var(--border)"}`,
                }}>
                  <input type="checkbox" checked={shareReflection}
                    onChange={e => setShareReflection(e.target.checked)}
                    style={{ width:14, height:14, accentColor:"#9333ea", cursor:"pointer" }} />
                  <span style={{ fontSize:11, fontWeight:700,
                    color: shareReflection ? "var(--primary)" : "var(--text-muted)" }}>
                    🔥 반 피드에 공유
                  </span>
                </label>
                <button onClick={saveLog} disabled={savingLog}
                  className="hy-btn hy-btn-primary"
                  style={{ fontSize:12, padding:"8px 18px", flexShrink:0 }}>
                  {savingLog ? "저장 중..." : logSaved ? "✅ 저장됨!" : "💾 회고 저장"}
                </button>
              </div>
            </div>
          ) : viewLog && (viewLog.good || viewLog.bad || viewLog.study_hours) ? (
            /* 과거 날짜 회고 조회 */
            <div className="hy-card" style={{ padding:"14px 16px" }}>
              <p style={{ fontSize:12, fontWeight:800, color:"var(--text-muted)", margin:"0 0 10px" }}>
                📔 {fmtFull(viewDate)} 회고
              </p>
              {viewLog.study_hours != null && (
                <span style={{
                  display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:999,
                  background:"#fefce8", border:"1px solid #fef08a", marginBottom:8,
                  fontSize:12, color:"#ca8a04", fontWeight:700,
                }}>⏱ {viewLog.study_hours}시간</span>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {viewLog.good && (
                  <div style={{ padding:"10px 12px", borderRadius:10, background:"#f0fdf4", border:"1px solid #bbf7d0" }}>
                    <p style={{ fontSize:10, fontWeight:800, color:"#15803d", margin:"0 0 4px" }}>✅ 잘한 점</p>
                    <p style={{ fontSize:12, color:"#166534", margin:0, lineHeight:1.6 }}>{viewLog.good}</p>
                  </div>
                )}
                {viewLog.bad && (
                  <div style={{ padding:"10px 12px", borderRadius:10, background:"#fffbeb", border:"1px solid #fef08a" }}>
                    <p style={{ fontSize:10, fontWeight:800, color:"#92400e", margin:"0 0 4px" }}>💭 아쉬운 점</p>
                    <p style={{ fontSize:12, color:"#92400e", margin:0, lineHeight:1.6 }}>{viewLog.bad}</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* ── 반 피드 ── */}
          <div className="hy-card" style={{ padding:"16px 16px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <p style={{ fontSize:13, fontWeight:900, color:"var(--text)", margin:0 }}>🔥 오늘 우리반</p>
              <span style={{ fontSize:11, color:"var(--text-muted)", fontWeight:600 }}>
                {feed.length}명 기록 중
              </span>
            </div>
            {feed.length === 0 ? (
              <p style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:600, margin:0 }}>
                아직 기록한 친구가 없어요. 첫 번째가 되어봐요! 🙂
              </p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {feed.map((f, i) => {
                  const isMe = f.student_no === me?.student_no;
                  return (
                    <div key={f.id} style={{
                      padding:"10px 12px", borderRadius:10,
                      background: isMe ? "#fdf4ff" : "#f9fafb",
                      border:`1px solid ${isMe ? "#e9d5ff" : "var(--border)"}`,
                    }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                        marginBottom: f.share_reflection && (f.good || f.bad) ? 7 : 0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                          <span style={{ fontSize:11, fontWeight:700, color:"var(--text-subtle)", minWidth:18 }}>
                            {i+1}
                          </span>
                          <span style={{ fontSize:13, fontWeight:800, color:"var(--text)" }}>
                            {f.name}
                            {isMe && (
                              <span style={{ fontSize:10, color:"var(--primary)", marginLeft:4 }}>(나)</span>
                            )}
                          </span>
                        </div>
                        {f.study_hours != null && (
                          <span style={{
                            fontSize:11, fontWeight:700, color:"var(--primary)",
                            background:"var(--primary-light)", padding:"2px 8px", borderRadius:999,
                          }}>⏱ {f.study_hours}h</span>
                        )}
                      </div>
                      {f.share_reflection && (f.good || f.bad) && (
                        <div style={{ paddingTop:6, borderTop:"1px solid rgba(0,0,0,0.05)",
                          display:"flex", flexDirection:"column", gap:3 }}>
                          {f.good && (
                            <p style={{ fontSize:11, color:"#15803d", margin:0, lineHeight:1.5 }}>
                              <span style={{ fontWeight:700 }}>✅ </span>{f.good}
                            </p>
                          )}
                          {f.bad && (
                            <p style={{ fontSize:11, color:"#92400e", margin:0, lineHeight:1.5 }}>
                              <span style={{ fontWeight:700 }}>💭 </span>{f.bad}
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

        </div>{/* end right */}
      </div>{/* end grid */}
    </div>
  );
}
