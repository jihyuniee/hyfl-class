"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type HabitItem = {
  id: string;
  created_at: string;
  student_no: string;
  name: string;
  title: string;
  note: string | null;
};

type HabitCheck = {
  id: string;
  habit_id: string;
  check_date: string;
  is_done: boolean;
};

const PROJECT_START = "2026-03-09";
const TARGET_DAYS   = 90;

const EXAMPLES = [
  { emoji:"✍️", text:"감사 제목 3가지 적기" },
  { emoji:"🧮", text:"수학 문제 3개 풀기" },
  { emoji:"📖", text:"영어 단어 5개 외우기" },
  { emoji:"📋", text:"오늘의 To-do list 쓰기" },
  { emoji:"💧", text:"물 한 잔 마시기" },
  { emoji:"🧘", text:"짧은 명상 5분" },
];

const RULES = [
  { emoji:"⏱️", title:"10분 안에 끝낼 수 있는 것", desc:"학교 도착 직후 바로 실천!" },
  { emoji:"🎯", title:"딱 하나만", desc:"작은 것부터, 할 수 있는 것부터" },
  { emoji:"📅", title:"평일 90일", desc:"주말 제외, 꾸준히 이어가요" },
  { emoji:"👀", title:"모두 공개", desc:"서로의 체크 현황을 볼 수 있어요" },
];

function toKST(d = new Date()) {
  const k = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${k.getFullYear()}-${String(k.getMonth()+1).padStart(2,"0")}-${String(k.getDate()).padStart(2,"0")}`;
}

function isWeekday(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00+09:00`);
  return d.getDay() >= 1 && d.getDay() <= 5;
}

function addDays(dateStr: string, n: number) {
  const d = new Date(`${dateStr}T00:00:00+09:00`);
  d.setDate(d.getDate() + n);
  return toKST(d);
}

export default function Habit90Page() {
  const today = toKST();
  const todayIsWeekday = isWeekday(today);

  const [studentNo, setStudentNo] = useState("");
  const [name,      setName]      = useState("");
  const [tab,       setTab]       = useState<"today" | "dashboard">("today");

  const [habitTitle, setHabitTitle] = useState("");
  const [habitNote,  setHabitNote]  = useState("");

  const [myHabit, setMyHabit] = useState<HabitItem | null>(null);
  const [habits,  setHabits]  = useState<HabitItem[]>([]);
  const [checks,  setChecks]  = useState<HabitCheck[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [creating, setCreating] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const weekdays90 = useMemo(() => {
    const arr: string[] = [];
    let cursor = PROJECT_START;
    while (arr.length < TARGET_DAYS) {
      if (isWeekday(cursor)) arr.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return arr;
  }, []);

  const todayIndex = useMemo(() => {
    const idx = weekdays90.indexOf(today);
    return idx >= 0 ? idx + 1 : null;
  }, [weekdays90, today]);

  async function loadAll() {
    const { data: hd } = await supabase.from("habit_items").select("*");
    const { data: cd } = await supabase.from("habit_checks").select("*");
    setHabits((hd as HabitItem[]) ?? []);
    setChecks((cd as HabitCheck[]) ?? []);
  }

  async function loadMine() {
    if (!studentNo || !name) { setMyHabit(null); return; }
    const { data } = await supabase
      .from("habit_items").select("*")
      .eq("student_no", studentNo.trim())
      .eq("name", name.trim())
      .limit(1);
    setMyHabit((data?.[0] as HabitItem) ?? null);
  }

  useEffect(() => { loadAll(); }, []);

  const checksByHabitId = useMemo(() => {
    const map = new Map<string, HabitCheck[]>();
    checks.forEach(c => {
      const arr = map.get(c.habit_id) ?? [];
      arr.push(c);
      map.set(c.habit_id, arr);
    });
    return map;
  }, [checks]);

  const todayCheckMap = useMemo(() => {
    const map = new Map<string, HabitCheck>();
    checks.forEach(c => { if (c.check_date === today) map.set(c.habit_id, c); });
    return map;
  }, [checks, today]);

  async function createHabit() {
    if (!studentNo || !name) { alert("학번과 이름을 먼저 입력해줘 🙂"); return; }
    if (!habitTitle.trim()) { alert("습관 제목을 입력해줘 🙂"); return; }
    setCreating(true);
    const { data: existing } = await supabase
      .from("habit_items").select("id")
      .eq("student_no", studentNo.trim()).limit(1);
    if (existing && existing.length > 0) {
      setCreating(false);
      alert("이미 습관이 등록되어 있어 🙂 습관은 딱 한 번만 등록할 수 있어!");
      return;
    }
    const { error } = await supabase.from("habit_items").insert({
      student_no: studentNo.trim(),
      name: name.trim(),
      title: habitTitle.trim(),
      note: habitNote.trim() || null,
    });
    setCreating(false);
    if (error) { alert(error.message); return; }
    await loadAll(); await loadMine();
    alert("습관 등록 완료! 내일부터 매일 체크하러 와줘 🌱");
  }

  async function checkToday(is_done: boolean) {
    if (!myHabit) { alert("먼저 습관을 등록해줘 🙂"); return; }
    if (!todayIsWeekday) { alert("주말은 쉬어가요 😊"); return; }
    setLoading(true);
    const { error } = await supabase.from("habit_checks").upsert(
      { habit_id: myHabit.id, check_date: today, is_done },
      { onConflict: "habit_id,check_date" }
    );
    setLoading(false);
    if (error) { alert(error.message); return; }
    await loadAll();
  }

  const myChecks   = myHabit ? (checksByHabitId.get(myHabit.id) ?? []) : [];
  const myDone     = myChecks.filter(c => c.is_done).length;
  const todayCheck = myHabit ? todayCheckMap.get(myHabit.id) : undefined;
  const myProgress = Math.round((myDone / TARGET_DAYS) * 100);

  const classStats = useMemo(() => {
    const total     = habits.length;
    const doneToday = habits.filter(h => todayCheckMap.get(h.id)?.is_done).length;
    return { total, doneToday };
  }, [habits, todayCheckMap]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* ── 히어로 ── */}
      <div style={{
        background:"linear-gradient(135deg,#34d399 0%,#3b82f6 50%,#a78bfa 100%)",
        borderRadius:28, padding:"32px 28px",
        position:"relative", overflow:"hidden",
        boxShadow:"0 12px 40px rgba(52,211,153,0.3)",
      }}>
        {[{w:140,h:140,top:-40,right:-20,op:0.1},{w:80,h:80,bottom:-20,left:60,op:0.08}].map((b,i)=>(
          <div key={i} style={{ position:"absolute",width:b.w,height:b.h,top:b.top,right:b.right,bottom:b.bottom,left:b.left,borderRadius:"50%",background:"#fff",opacity:b.op }}/>
        ))}
        <div style={{ position:"relative" }}>
          <div style={{ display:"inline-flex",alignItems:"center",background:"rgba(255,255,255,0.2)",backdropFilter:"blur(8px)",borderRadius:999,padding:"4px 14px",marginBottom:12,border:"1px solid rgba(255,255,255,0.3)" }}>
            <span style={{ fontSize:12,color:"#fff",fontWeight:700 }}>🌱 학급자율활동 · 한 학기 프로젝트</span>
          </div>
          <h1 style={{ color:"#fff",fontSize:"clamp(22px,4vw,34px)",fontWeight:900,margin:"0 0 10px",letterSpacing:"-0.5px" }}>
            90일 좋은 습관 만들기 💪
          </h1>
          <p style={{ color:"rgba(255,255,255,0.92)",fontSize:14,margin:"0 0 14px",lineHeight:1.8,fontWeight:500 }}>
            이번 학기, 우리 모두 함께 90일 동안 좋은 습관을 만들어봐요.<br/>
            <b>학교 도착하자마자, 10분 안에 끝낼 수 있는 것</b>으로 딱 하나만! 💫
          </p>
          <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:14 }}>
            {["✍️ 감사 3가지","🧮 수학 문제","📖 영어 단어","📋 To-do list"].map(e=>(
              <span key={e} style={{ fontSize:12,fontWeight:700,background:"rgba(255,255,255,0.2)",color:"#fff",padding:"4px 12px",borderRadius:999,backdropFilter:"blur(4px)" }}>
                {e}
              </span>
            ))}
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
            {todayIndex && (
              <div style={{ display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.25)",borderRadius:12,padding:"8px 16px" }}>
                <span style={{ fontSize:14,color:"#fff",fontWeight:900 }}>📅 오늘은 {todayIndex}일째!</span>
                <span style={{ fontSize:12,color:"rgba(255,255,255,0.8)",fontWeight:600 }}>D-{TARGET_DAYS - todayIndex}</span>
              </div>
            )}
            <button onClick={() => setInfoOpen(o=>!o)}
              style={{ fontSize:12,fontWeight:700,background:"rgba(255,255,255,0.2)",color:"#fff",padding:"8px 16px",borderRadius:12,border:"1px solid rgba(255,255,255,0.3)",cursor:"pointer",backdropFilter:"blur(4px)",fontFamily:"inherit" }}>
              {infoOpen ? "닫기 ✕" : "프로젝트 안내 📌"}
            </button>
          </div>
        </div>
      </div>

      {/* ── 프로젝트 안내 (토글) ── */}
      {infoOpen && (
        <div className="hy-card" style={{ padding:"22px 24px" }}>
          <h3 style={{ fontSize:16,fontWeight:900,color:"var(--text)",margin:"0 0 16px",letterSpacing:"-0.3px" }}>
            📌 90일 습관 프로젝트 안내
          </h3>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10,marginBottom:20 }}>
            {RULES.map(r=>(
              <div key={r.title} style={{ background:"var(--primary-light)",borderRadius:14,padding:"14px 16px",border:"1.5px solid #f9d0ea" }}>
                <div style={{ fontSize:22,marginBottom:6 }}>{r.emoji}</div>
                <div style={{ fontWeight:800,fontSize:14,color:"var(--text)",marginBottom:3 }}>{r.title}</div>
                <div style={{ fontSize:12,color:"var(--text-muted)",fontWeight:500 }}>{r.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background:"#fffbeb",borderRadius:14,padding:"14px 16px",border:"1.5px solid #fde68a" }}>
            <p style={{ fontSize:13,fontWeight:800,color:"#f59e0b",margin:"0 0 6px" }}>💡 작은 습관의 힘</p>
            <p style={{ fontSize:13,color:"var(--text-muted)",margin:0,lineHeight:1.8 }}>
              큰 습관을 만들려고 하지 말고, 지금 당장 할 수 있는 <b>가장 작은 것</b>부터 시작해요.<br/>
              감사 제목 3가지, 수학 문제 1개, 영어 단어 3개 — 이런 것들로도 충분해요! 🌱
            </p>
          </div>
        </div>
      )}

      {/* ── 탭 ── */}
      <div style={{ display:"flex",gap:8 }}>
        {([["today","오늘 체크 ✅"],["dashboard","전체 현황 📊"]] as const).map(([t,label])=>(
          <button key={t} onClick={()=>setTab(t)}
            className={t===tab ? "hy-btn hy-btn-primary" : "hy-btn"}
            style={{ fontSize:13,padding:"8px 20px" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── 내 정보 ── */}
      <div className="hy-card" style={{ padding:"18px 22px" }}>
        <p style={{ fontSize:12,fontWeight:800,color:"var(--text-subtle)",margin:"0 0 4px",letterSpacing:"0.06em",textTransform:"uppercase" }}>
          내 정보 입력
        </p>
        <p style={{ fontSize:13,color:"var(--text-muted)",margin:"0 0 12px",fontWeight:500 }}>
          학번과 이름을 입력하고 <b>확인 버튼</b>을 눌러요. 매일 들어올 때마다 여기서 시작! 📌
        </p>
        <div style={{ display:"flex",gap:10,flexWrap:"wrap",alignItems:"center" }}>
          <input placeholder="학번 (예: 2201)" value={studentNo}
            onChange={e=>setStudentNo(e.target.value)}
            onKeyDown={e=>e.key==="Enter" && loadMine()}
            className="hy-input" style={{ maxWidth:160 }}/>
          <input placeholder="이름" value={name}
            onChange={e=>setName(e.target.value)}
            onKeyDown={e=>e.key==="Enter" && loadMine()}
            className="hy-input" style={{ maxWidth:140 }}/>
          <button onClick={()=>loadMine()}
            className="hy-btn hy-btn-primary" style={{ fontSize:13,padding:"9px 20px",whiteSpace:"nowrap" }}>
            내 습관 불러오기 →
          </button>
        </div>
        {studentNo && name && myHabit===null && (
          <p style={{ fontSize:12,color:"#f97316",marginTop:10,fontWeight:700 }}>
            👆 학번과 이름 입력 후 버튼을 눌러주세요!
          </p>
        )}
      </div>

      {/* ── 오늘 체크 탭 ── */}
      {tab==="today" && (
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          {!myHabit ? (
            <div className="hy-card" style={{ padding:"26px 24px" }}>
              <h3 style={{ fontSize:17,fontWeight:900,color:"var(--text)",margin:"0 0 6px" }}>나의 습관 등록 🌱</h3>
              <p style={{ fontSize:13,color:"var(--text-muted)",margin:"0 0 20px",lineHeight:1.8 }}>
                딱 <b>하나</b>만 정해요. 10분 안에 끝낼 수 있는 작은 습관으로!<br/>
                <span style={{ color:"#ef4444",fontWeight:700 }}>한번 등록하면 90일 동안 바꿀 수 없어요.</span>
              </p>

              {/* 예시 칩 */}
              <div style={{ marginBottom:16 }}>
                <p style={{ fontSize:12,fontWeight:800,color:"var(--text-subtle)",margin:"0 0 8px",letterSpacing:"0.06em",textTransform:"uppercase" }}>
                  예시 클릭하면 자동 입력 👇
                </p>
                <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                  {EXAMPLES.map(e=>(
                    <button key={e.text} onClick={()=>setHabitTitle(e.text)}
                      style={{
                        fontSize:12,fontWeight:700,padding:"6px 14px",borderRadius:999,
                        border:`1.5px solid ${habitTitle===e.text ? "var(--primary)" : "var(--border)"}`,
                        background: habitTitle===e.text ? "var(--primary-light)" : "#fff",
                        color: habitTitle===e.text ? "var(--primary)" : "var(--text-muted)",
                        cursor:"pointer",fontFamily:"inherit",transition:"all 0.12s",
                      }}>
                      {e.emoji} {e.text}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                <input placeholder="나의 습관 * (예: 감사 3가지 쓰기)"
                  value={habitTitle} onChange={e=>setHabitTitle(e.target.value)} className="hy-input"/>
                <input placeholder="짧은 설명 (선택) — 어떻게 할 건지"
                  value={habitNote}  onChange={e=>setHabitNote(e.target.value)}  className="hy-input"/>
                <button onClick={createHabit} disabled={creating}
                  className="hy-btn hy-btn-primary" style={{ fontSize:13,alignSelf:"flex-start" }}>
                  {creating ? "등록 중..." : "습관 등록하기 🌱"}
                </button>
              </div>
            </div>
          ) : (
            <div className="hy-card" style={{ padding:"24px" }}>
              {/* 내 습관 */}
              <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20,padding:"14px 16px",background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",borderRadius:16,border:"1.5px solid #86efac" }}>
                <div style={{ width:48,height:48,borderRadius:14,flexShrink:0,background:"linear-gradient(135deg,#34d399,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>💪</div>
                <div>
                  <p style={{ fontSize:11,color:"#22c55e",margin:"0 0 2px",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.06em" }}>나의 습관</p>
                  <h3 style={{ fontSize:17,fontWeight:900,color:"var(--text)",margin:0,letterSpacing:"-0.3px" }}>{myHabit.title}</h3>
                  {myHabit.note && <p style={{ fontSize:12,color:"var(--text-subtle)",margin:"2px 0 0" }}>{myHabit.note}</p>}
                </div>
              </div>

              {/* 진행 바 */}
              <div style={{ marginBottom:20 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
                  <span style={{ fontSize:13,fontWeight:700,color:"var(--text-muted)" }}>진행률</span>
                  <span style={{ fontSize:13,fontWeight:900,color:"#34d399" }}>{myDone} / {TARGET_DAYS}일 완료 ({myProgress}%)</span>
                </div>
                <div style={{ height:12,borderRadius:999,background:"#e5e7eb",overflow:"hidden" }}>
                  <div style={{ height:"100%",width:`${myProgress}%`,borderRadius:999,background:"linear-gradient(90deg,#34d399,#3b82f6)",transition:"width 0.5s" }}/>
                </div>
                <div style={{ display:"flex",justifyContent:"flex-end",marginTop:4 }}>
                  <span style={{ fontSize:11,color:"var(--text-subtle)",fontWeight:600 }}>남은 날: {TARGET_DAYS - myDone}일</span>
                </div>
              </div>

              {/* 오늘 체크 */}
              {!todayIsWeekday ? (
                <div style={{ background:"#f9fafb",borderRadius:16,padding:"20px",textAlign:"center",border:"1.5px solid var(--border)" }}>
                  <div style={{ fontSize:32,marginBottom:8 }}>😊</div>
                  <p style={{ fontSize:14,color:"var(--text-muted)",margin:0,fontWeight:700 }}>오늘은 주말이에요! 푹 쉬어요~</p>
                </div>
              ) : todayCheck ? (
                <div style={{
                  background: todayCheck.is_done ? "linear-gradient(135deg,#dcfce7,#d1fae5)" : "#fafafa",
                  borderRadius:16,padding:"20px",textAlign:"center",
                  border: todayCheck.is_done ? "1.5px solid #86efac" : "1.5px solid var(--border)",
                }}>
                  <div style={{ fontSize:38,marginBottom:8 }}>{todayCheck.is_done ? "✅" : "⬜"}</div>
                  <p style={{ fontSize:15,fontWeight:900,color:todayCheck.is_done ? "#22c55e" : "var(--text-muted)",margin:"0 0 14px" }}>
                    {todayCheck.is_done ? "오늘 완료! 정말 잘했어요 🎉" : "오늘은 아직이에요"}
                  </p>
                  <div style={{ display:"flex",gap:8,justifyContent:"center" }}>
                    <button onClick={()=>checkToday(true)}  disabled={loading} className="hy-btn hy-btn-primary" style={{ fontSize:13 }}>✅ 했어요</button>
                    <button onClick={()=>checkToday(false)} disabled={loading} className="hy-btn"              style={{ fontSize:13 }}>⬜ 못했어요</button>
                  </div>
                </div>
              ) : (
                <div style={{ background:"var(--primary-light)",borderRadius:16,padding:"22px",textAlign:"center",border:"1.5px solid #f9a8d4" }}>
                  <div style={{ fontSize:32,marginBottom:10 }}>🌅</div>
                  <p style={{ fontSize:16,fontWeight:900,color:"var(--primary)",margin:"0 0 6px" }}>
                    {todayIndex ? `오늘 ${todayIndex}일째!` : "오늘 습관 체크!"}
                  </p>
                  <p style={{ fontSize:13,color:"var(--text-muted)",margin:"0 0 16px",fontWeight:600 }}>
                    학교 도착하자마자 "{myHabit.title}" 했나요?
                  </p>
                  <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
                    <button onClick={()=>checkToday(true)}  disabled={loading} className="hy-btn hy-btn-primary" style={{ fontSize:15,padding:"12px 32px" }}>✅ 했어요!</button>
                    <button onClick={()=>checkToday(false)} disabled={loading} className="hy-btn"              style={{ fontSize:15,padding:"12px 32px" }}>⬜ 못했어요</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 전체 현황 탭 ── */}
      {tab==="dashboard" && (
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:12 }}>
            {[
              { label:"전체 참여", value:`${classStats.total}명`,    grad:"linear-gradient(135deg,#818cf8,#a78bfa)", shadow:"rgba(129,140,248,0.3)" },
              { label:"오늘 완료", value:`${classStats.doneToday}명`, grad:"linear-gradient(135deg,#34d399,#3b82f6)", shadow:"rgba(52,211,153,0.3)" },
              { label:"진행 일차", value:todayIndex ? `${todayIndex}일` : "-", grad:"linear-gradient(135deg,#fb923c,#f472b6)", shadow:"rgba(251,146,60,0.3)" },
            ].map(s=>(
              <div key={s.label} style={{ background:s.grad,borderRadius:18,padding:"18px 16px",boxShadow:`0 6px 20px ${s.shadow}`,border:"1.5px solid rgba(255,255,255,0.4)" }}>
                <p style={{ fontSize:12,color:"rgba(255,255,255,0.8)",fontWeight:700,margin:"0 0 4px" }}>{s.label}</p>
                <p style={{ fontSize:28,fontWeight:900,color:"#fff",margin:0,letterSpacing:"-1px" }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="hy-card" style={{ padding:"20px 22px" }}>
            <h3 style={{ fontSize:15,fontWeight:800,color:"var(--text)",margin:"0 0 14px" }}>
              🏆 우리반 전체 현황
            </h3>
            {habits.length===0 ? (
              <p style={{ fontSize:14,color:"var(--text-subtle)" }}>아직 등록된 습관이 없어요 🌱</p>
            ) : (
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {[...habits].sort((a,b) => {
                  const da = (checksByHabitId.get(a.id)??[]).filter(c=>c.is_done).length;
                  const db = (checksByHabitId.get(b.id)??[]).filter(c=>c.is_done).length;
                  return db - da;
                }).map((h, idx) => {
                  const hChecks = checksByHabitId.get(h.id) ?? [];
                  const done    = hChecks.filter(c=>c.is_done).length;
                  const pct     = Math.round((done/TARGET_DAYS)*100);
                  const tCheck  = todayCheckMap.get(h.id);
                  return (
                    <div key={h.id} style={{ padding:"14px 16px",borderRadius:14,background:"#fafafa",border:"1.5px solid var(--border)" }}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:8 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                          <span style={{ fontSize:12,fontWeight:900,color:"var(--text-subtle)",width:20 }}>
                            {idx===0?"🥇":idx===1?"🥈":idx===2?"🥉":`${idx+1}`}
                          </span>
                          <div>
                            <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                              <span style={{ fontWeight:800,fontSize:14,color:"var(--text)" }}>{h.name}</span>
                              <span style={{ fontSize:11,color:"var(--text-subtle)" }}>({h.student_no})</span>
                            </div>
                            <p style={{ fontSize:12,color:"var(--text-muted)",margin:"1px 0 0",fontWeight:600 }}>{h.title}</p>
                          </div>
                        </div>
                        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                          {todayIsWeekday && (
                            <span style={{
                              fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999,
                              background: tCheck?.is_done ? "#dcfce7" : tCheck ? "#f9fafb" : "#fef9c3",
                              color:      tCheck?.is_done ? "#22c55e" : tCheck ? "#9ca3af" : "#f59e0b",
                            }}>
                              {tCheck?.is_done ? "✅ 완료" : tCheck ? "⬜ 미완" : "⏳ 미체크"}
                            </span>
                          )}
                          <span style={{ fontSize:13,fontWeight:900,color:"#3b82f6" }}>{done}/{TARGET_DAYS}</span>
                        </div>
                      </div>
                      <div style={{ height:6,borderRadius:999,background:"#e5e7eb",overflow:"hidden" }}>
                        <div style={{ height:"100%",width:`${pct}%`,borderRadius:999,background:"linear-gradient(90deg,#34d399,#3b82f6)",transition:"width 0.4s" }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
