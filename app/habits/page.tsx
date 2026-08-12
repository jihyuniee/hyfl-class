"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";
import SemesterTabs from "@/components/SemesterTabs";
import StudentPicker from "@/components/StudentPicker";
import { STUDENTS, type Student } from "@/components/lib/students";
import {
  CURRENT_SEMESTER,
  HABIT_PROJECT_START,
  semesterLabel,
  type SemesterId,
  toKSTDateStr,
  isPracticeDay,
  isWeekend,
  addDaysKST,
} from "@/components/lib/semester";

type HabitItem = {
  id: string;
  created_at: string;
  student_no: string;
  name: string;
  title: string;
  note: string | null;
  semester: string;
};

type HabitCheck = {
  id: string;
  habit_id: string;
  check_date: string;
  is_done: boolean;
};

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
  { emoji:"📅", title:"실천일 90일", desc:"주말·공휴일 제외, 꾸준히 이어가요" },
  { emoji:"👀", title:"모두 공개", desc:"서로의 체크 현황을 볼 수 있어요" },
];

export default function Habit90Page() {
  const today = toKSTDateStr();
  const todayIsPracticeDay = isPracticeDay(today);

  const [semester,  setSemester]  = useState<SemesterId>(CURRENT_SEMESTER);
  const isCurrentSemesterTab = semester === CURRENT_SEMESTER;
  // 전체 현황 탭은 활성 학기에 따라 판단 기준이 달라야 한다.
  // 1학기는 과거와 동일하게 "평일이면 실천일"로, 2학기는 공휴일까지 제외한다.
  const todayIsPracticeDayForActiveSemester =
    isCurrentSemesterTab ? todayIsPracticeDay : !isWeekend(today);

  // 1학기 전용 — 학번/이름 직접 입력 (기존 방식 그대로)
  const [studentNo, setStudentNo] = useState("");
  const [name,      setName]      = useState("");

  // 2학기 전용 — 명단에서 선택
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [regStep, setRegStep] = useState<1 | 2>(1);

  const [tab, setTab] = useState<"today" | "dashboard">("today");

  const [habitTitle, setHabitTitle] = useState("");
  const [habitNote,  setHabitNote]  = useState("");

  const [myHabit, setMyHabit] = useState<HabitItem | null>(null);
  const [habits,  setHabits]  = useState<HabitItem[]>([]);
  const [checks,  setChecks]  = useState<HabitCheck[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  // 2학기는 주말+공휴일을 제외한 실천일 기준, 1학기는 기존 그대로 평일(주말 제외)
  // 기준으로 계산해 과거 집계 방식을 그대로 보존한다.
  const weekdays90 = useMemo(() => {
    const arr: string[] = [];
    let cursor = HABIT_PROJECT_START[semester];
    const isValidDay = semester === CURRENT_SEMESTER ? isPracticeDay : (d: string) => !isWeekend(d);
    while (arr.length < TARGET_DAYS) {
      if (isValidDay(cursor)) arr.push(cursor);
      cursor = addDaysKST(cursor, 1);
    }
    return arr;
  }, [semester]);

  const todayIndex = useMemo(() => {
    const idx = weekdays90.indexOf(today);
    return idx >= 0 ? idx + 1 : null;
  }, [weekdays90, today]);

  async function loadAll(sem: SemesterId) {
    setDataLoading(true);
    const { data: hd } = await supabase.from("habit_items").select("*").eq("semester", sem);
    const { data: cd } = await supabase.from("habit_checks").select("*");
    setHabits((hd as HabitItem[]) ?? []);
    setChecks((cd as HabitCheck[]) ?? []);
    setDataLoading(false);
  }

  // 1학기 전용 — 직접 입력한 학번/이름으로 조회
  async function loadMine() {
    if (!studentNo.trim() || !name.trim()) {
      alert("학번과 이름을 모두 입력해주세요!");
      return;
    }
    const { data, error } = await supabase
      .from("habit_items").select("*")
      .eq("student_no", studentNo.trim())
      .eq("name", name.trim())
      .eq("semester", semester)
      .limit(1);
    if (error) { alert("오류: " + error.message); return; }
    if (data && data.length > 0) {
      setMyHabit(data[0] as HabitItem);
    } else {
      alert(`${semesterLabel(semester)}에 등록된 습관을 찾을 수 없어요. 학번/이름을 확인해줘요.`);
      setMyHabit(null);
    }
  }

  useEffect(() => {
    setMyHabit(null);
    setSelectedStudent(null);
    setRegisterOpen(false);
    setRegStep(1);
    loadAll(semester);
  }, [semester]);

  // 2학기 — 선택한 학생의 습관을 이미 불러온 habits 목록에서 바로 찾는다 (별도 조회 불필요).
  useEffect(() => {
    if (!isCurrentSemesterTab) return;
    if (!selectedStudent) { setMyHabit(null); return; }
    const found = habits.find(h => h.student_no === selectedStudent.no) ?? null;
    setMyHabit(found);
  }, [isCurrentSemesterTab, selectedStudent, habits]);

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

  // 2학기 전용 등록 — 명단에서 고른 학생 기준
  async function createHabit2() {
    if (!selectedStudent) return;
    if (!habitTitle.trim()) { alert("습관 제목을 입력해줘 🙂"); return; }
    setCreating(true);
    const { data: existing } = await supabase
      .from("habit_items").select("id")
      .eq("student_no", selectedStudent.no)
      .eq("semester", CURRENT_SEMESTER)
      .limit(1);
    if (existing && existing.length > 0) {
      setCreating(false);
      setRegisterOpen(false);
      setRegStep(1);
      await loadAll(CURRENT_SEMESTER);
      alert("이미 2학기 습관을 등록했어요.");
      return;
    }
    const { error } = await supabase.from("habit_items").insert({
      student_no: selectedStudent.no,
      name: selectedStudent.name,
      title: habitTitle.trim(),
      note: habitNote.trim() || null,
      semester: CURRENT_SEMESTER,
    });
    setCreating(false);
    if (error) { alert("등록에 실패했어요: " + error.message); return; }
    setHabitTitle(""); setHabitNote(""); setRegisterOpen(false); setRegStep(1);
    await loadAll(CURRENT_SEMESTER);
  }

  async function checkToday(is_done: boolean) {
    if (!myHabit) { alert("먼저 습관을 등록해줘 🙂"); return; }
    if (!todayIsPracticeDay) { alert("오늘은 쉬어가는 날이에요 🌿"); return; }
    setLoading(true);
    const { error } = await supabase.from("habit_checks").upsert(
      { habit_id: myHabit.id, check_date: today, is_done },
      { onConflict: "habit_id,check_date" }
    );
    setLoading(false);
    if (error) { alert("저장에 실패했어요: " + error.message); return; }
    await loadAll(semester);
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

  const registeredNos = useMemo(() => new Set(habits.map(h => h.student_no)), [habits]);

  // 습관 카드(진행률 + 오늘 체크 버튼) — 1학기/2학기 공통으로 재사용.
  const habitCardEl = myHabit && (
    <div className="hy-card" style={{ padding:"24px" }}>
      {/* 내 습관 */}
      <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20,padding:"14px 16px",background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",borderRadius:16,border:"1.5px solid #86efac" }}>
        <div style={{ width:48,height:48,borderRadius:14,flexShrink:0,background:"linear-gradient(135deg,#34d399,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>💪</div>
        <div>
          <p style={{ fontSize:11,color:"#22c55e",margin:"0 0 2px",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.06em" }}>
            {isCurrentSemesterTab ? `${myHabit.name} (${myHabit.student_no})의 습관` : "나의 습관"}
          </p>
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
      {!isCurrentSemesterTab ? (
        <div style={{ background:"#f9fafb",borderRadius:16,padding:"20px",textAlign:"center",border:"1.5px solid var(--border)" }}>
          <div style={{ fontSize:28,marginBottom:8 }}>📦</div>
          <p style={{ fontSize:13,color:"var(--text-muted)",margin:0,fontWeight:700 }}>1학기 기록은 보관용이라 더 체크할 수 없어요</p>
        </div>
      ) : !todayIsPracticeDay ? (
        <div style={{ background:"#f9fafb",borderRadius:16,padding:"20px",textAlign:"center",border:"1.5px solid var(--border)" }}>
          <div style={{ fontSize:32,marginBottom:8 }}>🌿</div>
          <p style={{ fontSize:14,color:"var(--text-muted)",margin:0,fontWeight:700 }}>오늘은 쉬어가는 날이에요 🌿</p>
        </div>
      ) : todayCheck ? (
        <div style={{
          background: todayCheck.is_done ? "linear-gradient(135deg,#dcfce7,#d1fae5)" : "#fafafa",
          borderRadius:16,padding:"20px",textAlign:"center",
          border: todayCheck.is_done ? "1.5px solid #86efac" : "1.5px solid var(--border)",
        }}>
          <div style={{ fontSize:38,marginBottom:8 }}>{todayCheck.is_done ? "✅" : "⬜"}</div>
          <p style={{ fontSize:15,fontWeight:900,color:todayCheck.is_done ? "#22c55e" : "var(--text-muted)",margin:"0 0 4px" }}>
            {todayCheck.is_done ? "오늘의 습관을 완료했어요!" : "오늘은 아직이에요"}
          </p>
          {todayCheck.is_done && (
            <p style={{ fontSize:13,color:"#22c55e",fontWeight:700,margin:"0 0 14px" }}>
              현재 {myDone}일/{TARGET_DAYS}일 달성
            </p>
          )}
          <div style={{ display:"flex",gap:8,justifyContent:"center", marginTop: todayCheck.is_done ? 0 : 14 }}>
            {todayCheck.is_done ? (
              <span style={{ fontSize:13, fontWeight:800, color:"#22c55e", background:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:999, padding:"9px 20px" }}>
                오늘 체크 완료 ✅
              </span>
            ) : (
              <>
                <button onClick={()=>checkToday(true)}  disabled={loading} className="hy-btn hy-btn-primary" style={{ fontSize:13 }}>오늘 실천했어요 ✅</button>
                <button onClick={()=>checkToday(false)} disabled={loading} className="hy-btn"              style={{ fontSize:13 }}>⬜ 못했어요</button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div style={{ background:"var(--primary-light)",borderRadius:16,padding:"22px",textAlign:"center",border:"1.5px solid #f9a8d4" }}>
          <div style={{ fontSize:32,marginBottom:10 }}>🌅</div>
          <p style={{ fontSize:16,fontWeight:900,color:"var(--primary)",margin:"0 0 6px" }}>
            {todayIndex ? `오늘 ${todayIndex}일째!` : "오늘 습관 체크!"}
          </p>
          <p style={{ fontSize:13,color:"var(--text-muted)",margin:"0 0 16px",fontWeight:600 }}>
            학교 도착하자마자 “{myHabit.title}” 했나요?
          </p>
          <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
            <button onClick={()=>checkToday(true)}  disabled={loading} className="hy-btn hy-btn-primary" style={{ fontSize:15,padding:"12px 32px" }}>오늘 실천했어요 ✅</button>
            <button onClick={()=>checkToday(false)} disabled={loading} className="hy-btn"              style={{ fontSize:15,padding:"12px 32px" }}>⬜ 못했어요</button>
          </div>
        </div>
      )}
    </div>
  );

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

      {/* ── 학기 탭 ── */}
      <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
        <SemesterTabs value={semester} onChange={setSemester} />
        <p style={{ fontSize:12,color:"var(--text-subtle)",fontWeight:600,margin:0 }}>
          {semester === CURRENT_SEMESTER
            ? "2학기 습관은 여기서 새로 등록하고 실천 기록을 쌓아요. 1학기 기록은 탭을 옮겨 확인할 수 있어요."
            : "1학기 기록이에요. 이 학기 데이터는 그대로 보존되며 새로 수정할 수 없어요."}
        </p>
      </div>

      {/* ── 오늘/전체 탭 ── */}
      <div style={{ display:"flex",gap:8 }}>
        {([["today","오늘 체크 ✅"],["dashboard","전체 현황 📊"]] as const).map(([t,label])=>(
          <button key={t} onClick={()=>setTab(t)}
            className={t===tab ? "hy-btn hy-btn-primary" : "hy-btn"}
            style={{ fontSize:13,padding:"8px 20px" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── 1학기 전용: 내 정보 입력 (기존 방식 그대로, 학기 무관하게 항상 노출) ── */}
      {!isCurrentSemesterTab && (
        <div className="hy-card" style={{ padding:"18px 22px" }}>
          <p style={{ fontSize:12,fontWeight:800,color:"var(--text-subtle)",margin:"0 0 4px",letterSpacing:"0.06em",textTransform:"uppercase" }}>
            내 정보 입력
          </p>
          <p style={{ fontSize:13,color:"var(--text-muted)",margin:"0 0 12px",fontWeight:500 }}>
            학번과 이름을 입력하고 <b>확인 버튼</b>을 눌러요.
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
      )}

      {/* ── 오늘 체크 탭 ── */}
      {tab==="today" && (
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          {dataLoading ? (
            <div className="hy-card" style={{ padding:"40px",textAlign:"center" }}>
              <p style={{ fontSize:14,color:"var(--text-subtle)",fontWeight:700 }}>불러오는 중... ⏳</p>
            </div>

          ) : !isCurrentSemesterTab ? (
            /* ══════════ 1학기: 기존 화면 그대로 ══════════ */
            !myHabit ? (
              <div className="hy-card" style={{ padding:"26px 24px",textAlign:"center" }}>
                <div style={{ fontSize:32,marginBottom:8 }}>📦</div>
                <h3 style={{ fontSize:16,fontWeight:900,color:"var(--text)",margin:"0 0 6px" }}>1학기는 보관 전용이에요</h3>
                <p style={{ fontSize:13,color:"var(--text-muted)",margin:0,lineHeight:1.8 }}>
                  1학기에 등록한 습관이 있다면 학번/이름으로 조회해서 기록을 볼 수 있어요.<br/>
                  새로운 습관은 <b>2학기</b> 탭에서 등록해줘요 🌱
                </p>
              </div>
            ) : habitCardEl

          ) : (
            /* ══════════ 2학기: 새 흐름 ══════════ */
            <>
              {/* 오늘 우리반 완료 인원 */}
              <div className="hy-soft" style={{ padding:"12px 18px", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                <span style={{ fontSize:16 }}>📊</span>
                <span style={{ fontSize:13, fontWeight:800, color:"var(--text)" }}>
                  {todayIndex ? `오늘은 ${todayIndex}일차` : "아직 시작 전이에요"}
                </span>
                <span style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:600 }}>
                  · 오늘 완료 {classStats.doneToday}/{classStats.total}명
                </span>
              </div>

              {/* 학생 선택 */}
              <div className="hy-card" style={{ padding:"18px 22px" }}>
                <p style={{ fontSize:12,fontWeight:800,color:"var(--text-subtle)",margin:"0 0 10px",letterSpacing:"0.06em",textTransform:"uppercase" }}>
                  본인 선택
                </p>
                <StudentPicker
                  students={STUDENTS}
                  value={selectedStudent}
                  onChange={s => { setSelectedStudent(s); setRegisterOpen(false); setRegStep(1); }}
                  doneNos={registeredNos}
                />
              </div>

              {selectedStudent && registerOpen ? (
                /* ── 처음 습관 등록 (별도 화면) ── */
                <div className="hy-card" style={{ padding:"26px 24px" }}>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"var(--primary-light)", borderRadius:999, padding:"4px 12px", marginBottom:14 }}>
                    <span style={{ fontSize:12, fontWeight:800, color:"var(--primary)" }}>
                      {selectedStudent.name} ({selectedStudent.no})
                    </span>
                  </div>

                  {regStep === 1 ? (
                    <>
                      <h3 style={{ fontSize:17,fontWeight:900,color:"var(--text)",margin:"0 0 6px" }}>처음 습관 등록 🌱</h3>
                      <p style={{ fontSize:13,color:"var(--text-muted)",margin:"0 0 20px",lineHeight:1.8 }}>
                        딱 <b>하나</b>만 정해요. 10분 안에 끝낼 수 있는 작은 습관으로!<br/>
                        <span style={{ color:"#ef4444",fontWeight:700 }}>한번 등록하면 90일 동안 바꿀 수 없어요.</span>
                      </p>

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
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={()=>{ setRegisterOpen(false); setHabitTitle(""); setHabitNote(""); }}
                            className="hy-btn" style={{ fontSize:13 }}>
                            취소
                          </button>
                          <button onClick={()=>{ if(!habitTitle.trim()){ alert("습관 제목을 입력해줘 🙂"); return; } setRegStep(2); }}
                            className="hy-btn hy-btn-primary" style={{ fontSize:13 }}>
                            다음: 확인하기 →
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 style={{ fontSize:17,fontWeight:900,color:"var(--text)",margin:"0 0 14px" }}>등록 내용을 확인해주세요 ✅</h3>
                      <div style={{ background:"#f9fafb", borderRadius:14, padding:"16px 18px", marginBottom:14, display:"flex", flexDirection:"column", gap:8 }}>
                        <div style={{ display:"flex", justifyContent:"space-between" }}>
                          <span style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:700 }}>학생</span>
                          <span style={{ fontSize:13, color:"var(--text)", fontWeight:800 }}>{selectedStudent.name} ({selectedStudent.no})</span>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between" }}>
                          <span style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:700 }}>습관</span>
                          <span style={{ fontSize:13, color:"var(--text)", fontWeight:800 }}>{habitTitle}</span>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", gap:12 }}>
                          <span style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:700, flexShrink:0 }}>설명</span>
                          <span style={{ fontSize:13, color:"var(--text)", fontWeight:600, textAlign:"right" }}>{habitNote || "(작성 안 함)"}</span>
                        </div>
                      </div>
                      <p style={{ fontSize:12, color:"#ef4444", fontWeight:700, margin:"0 0 16px" }}>
                        ⚠️ 등록 후에는 90일 동안 습관 내용을 바꿀 수 없어요.
                      </p>
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={()=>setRegStep(1)} className="hy-btn" style={{ fontSize:13 }}>
                          ← 이전으로
                        </button>
                        <button onClick={createHabit2} disabled={creating}
                          className="hy-btn hy-btn-primary" style={{ fontSize:13 }}>
                          {creating ? "등록 중..." : "90일 습관 시작하기 🌱"}
                        </button>
                      </div>
                    </>
                  )}
                </div>

              ) : selectedStudent && !myHabit ? (
                /* ── 아직 등록 전 ── */
                <div className="hy-card" style={{ padding:"26px 24px", textAlign:"center" }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>🌱</div>
                  <p style={{ fontSize:15, fontWeight:900, color:"var(--text)", margin:"0 0 4px" }}>
                    {selectedStudent.name}님,
                  </p>
                  <p style={{ fontSize:14, color:"var(--text-muted)", margin:"0 0 18px", fontWeight:700 }}>
                    아직 2학기 습관을 등록하지 않았어요.
                  </p>
                  <button onClick={()=>{ setRegisterOpen(true); setRegStep(1); }}
                    className="hy-btn hy-btn-primary" style={{ fontSize:14, padding:"11px 26px" }}>
                    처음 습관 등록하기 🌱
                  </button>
                </div>

              ) : selectedStudent && myHabit ? (
                habitCardEl

              ) : null}

              {/* 하단 고정 안내 */}
              {!registerOpen && !myHabit && (
                <div style={{ textAlign:"center", marginTop:4 }}>
                  <button
                    onClick={() => {
                      if (!selectedStudent) { alert("먼저 위에서 학번·이름을 선택해줘요 🙂"); return; }
                      setRegisterOpen(true); setRegStep(1);
                    }}
                    style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:700, color:"var(--primary)", textDecoration:"underline" }}
                  >
                    처음인가요? 2학기 습관 등록하기 →
                  </button>
                </div>
              )}
            </>
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
                          {todayIsPracticeDayForActiveSemester && (
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
