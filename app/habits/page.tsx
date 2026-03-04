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
  check_date: string; // YYYY-MM-DD
  is_done: boolean;
};

type Tab = "today" | "mine" | "dashboard";

function toISODateKST(d: Date) {
  // KST 기준 YYYY-MM-DD
  const kst = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, "0");
  const day = String(kst.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysISO(startISO: string, offset: number) {
  const [y, m, d] = startISO.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + offset);
  const yy = base.getUTCFullYear();
  const mm = String(base.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(base.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export default function Habits90Page() {
  // ✅ 시작일 고정
  const START_ISO = "2026-03-09";
  const END_ISO = addDaysISO(START_ISO, 89); // 90일째

  const [tab, setTab] = useState<Tab>("today");

  // 학생 정보
  const [studentNo, setStudentNo] = useState("");
  const [name, setName] = useState("");

  // 습관 생성 폼
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");

  // 데이터
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [checks, setChecks] = useState<HabitCheck[]>([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const todayISO = useMemo(() => toISODateKST(new Date()), []);

  // 90일 배열 (YYYY-MM-DD)
  const days90 = useMemo(() => {
    return Array.from({ length: 90 }, (_, i) => addDaysISO(START_ISO, i));
  }, [START_ISO]);

  async function load() {
    setErr(null);

    const { data: habitData, error: habitErr } = await supabase
      .from("habit_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (habitErr) {
      setErr(habitErr.message);
      return;
    }

    const { data: checkData, error: checkErr } = await supabase
      .from("habit_checks")
      .select("*")
      .gte("check_date", START_ISO)
      .lte("check_date", END_ISO);

    if (checkErr) {
      setErr(checkErr.message);
      return;
    }

    setHabits((habitData as HabitItem[]) ?? []);
    setChecks((checkData as HabitCheck[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  const myHabits = useMemo(() => {
    if (!studentNo || !name) return [];
    return habits.filter((h) => h.student_no === studentNo && h.name === name);
  }, [habits, studentNo, name]);

  // habitId|date -> true
  const checksSet = useMemo(() => {
    const s = new Set<string>();
    for (const c of checks) {
      if (c.is_done) s.add(`${c.habit_id}|${c.check_date}`);
    }
    return s;
  }, [checks]);

  async function createHabit() {
    if (!studentNo.trim() || !name.trim()) {
      alert("학번/이름을 먼저 입력해줘 🙂");
      return;
    }
    if (!title.trim()) {
      alert("습관 제목을 입력해줘 🙂");
      return;
    }

    setLoading(true);
    setErr(null);

    const { error } = await supabase.from("habit_items").insert({
      student_no: studentNo.trim(),
      name: name.trim(),
      title: title.trim(),
      note: note.trim() || null,
    });

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    setTitle("");
    setNote("");
    await load();
    alert("습관이 추가됐어 🌱");
  }

  async function toggleCheck(habitId: string, dateISO: string) {
    setLoading(true);
    setErr(null);

    const key = `${habitId}|${dateISO}`;
    const done = checksSet.has(key);

    if (done) {
      const { error } = await supabase
        .from("habit_checks")
        .delete()
        .eq("habit_id", habitId)
        .eq("check_date", dateISO);

      setLoading(false);

      if (error) {
        setErr(error.message);
        return;
      }
      await load();
      return;
    }

    const { error } = await supabase.from("habit_checks").insert({
      habit_id: habitId,
      check_date: dateISO,
      is_done: true,
    });

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }
    await load();
  }

  function progressOf(habitId: string) {
    let cnt = 0;
    for (const d of days90) {
      if (checksSet.has(`${habitId}|${d}`)) cnt += 1;
    }
    return cnt;
  }

  // ===== 대시보드 계산 =====
  const classStudents = useMemo(() => {
    // 습관을 만든 학생(학번+이름) 목록을 학급 구성으로 봄
    const map = new Map<string, { studentNo: string; name: string }>();
    for (const h of habits) {
      const k = `${h.student_no}|${h.name}`;
      if (!map.has(k)) map.set(k, { studentNo: h.student_no, name: h.name });
    }
    return Array.from(map.values());
  }, [habits]);

  const todayParticipants = useMemo(() => {
    const set = new Set<string>(); // studentNo|name
    // 오늘 체크가 1개라도 있으면 참여
    const habitById = new Map<string, HabitItem>();
    for (const h of habits) habitById.set(h.id, h);

    for (const c of checks) {
      if (c.check_date !== todayISO) continue;
      const h = habitById.get(c.habit_id);
      if (!h) continue;
      set.add(`${h.student_no}|${h.name}`);
    }
    return set;
  }, [checks, habits, todayISO]);

  const leaderboard = useMemo(() => {
    // 학생별 총 체크 개수(90일 범위)
    const habitById = new Map<string, HabitItem>();
    for (const h of habits) habitById.set(h.id, h);

    const map = new Map<string, { studentNo: string; name: string; doneCount: number }>();
    for (const c of checks) {
      const h = habitById.get(c.habit_id);
      if (!h) continue;
      const k = `${h.student_no}|${h.name}`;
      const cur = map.get(k) ?? { studentNo: h.student_no, name: h.name, doneCount: 0 };
      cur.doneCount += 1;
      map.set(k, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.doneCount - a.doneCount);
  }, [checks, habits]);

  const dayIndex = useMemo(() => {
    // 오늘이 몇일차인지(범위 밖이면 null)
    const idx = days90.indexOf(todayISO);
    return idx >= 0 ? idx + 1 : null;
  }, [days90, todayISO]);

  // ===== UI =====
  const mustInfo = !studentNo || !name;

  return (
    <div className="space-y-8">
      <div className="hy-card p-6">
        <div className="text-sm text-gray-600">우리 반 한학기 프로젝트</div>
        <h1 className="text-2xl font-bold mt-1">🌱 좋은 습관 만들기 90일 프로젝트</h1>

        <div className="mt-2 text-sm text-gray-700">
          시작일: <span className="font-semibold">{START_ISO}</span> · 종료일:{" "}
          <span className="font-semibold">{END_ISO}</span>
          <div className="mt-1">
            오늘: <span className="font-semibold">{todayISO}</span>{" "}
            {dayIndex ? <span className="text-gray-500">({dayIndex}일차)</span> : <span className="text-gray-500">(기간 밖)</span>}
          </div>
        </div>

        {/* 탭 */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className={`rounded-full px-4 py-2 text-sm border ${tab === "today" ? "bg-black text-white" : "bg-white"}`}
            onClick={() => setTab("today")}
          >
            오늘 체크
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm border ${tab === "mine" ? "bg-black text-white" : "bg-white"}`}
            onClick={() => setTab("mine")}
          >
            내 습관(90일)
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm border ${tab === "dashboard" ? "bg-black text-white" : "bg-white"}`}
            onClick={() => setTab("dashboard")}
          >
            대시보드
          </button>

          <button className="rounded-full px-4 py-2 text-sm border bg-white" onClick={load} disabled={loading}>
            새로고침
          </button>

          {loading && <div className="text-xs text-gray-600 self-center">처리 중...</div>}
        </div>

        {err && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            오류: {err}
          </div>
        )}
      </div>

      {/* 내 정보 */}
      <div className="hy-card p-5 space-y-3">
        <div className="font-semibold">내 정보</div>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="border rounded-xl px-4 py-3 text-sm"
            placeholder="학번"
            value={studentNo}
            onChange={(e) => setStudentNo(e.target.value)}
          />
          <input
            className="border rounded-xl px-4 py-3 text-sm"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="text-xs text-gray-500">
          (학번/이름은 본인 습관을 찾는 기준이라 정확히 써줘 🙂)
        </div>
      </div>

      {/* 습관 추가 */}
      <div className="hy-card p-5 space-y-3">
        <div className="font-semibold">+ 습관 추가</div>

        <input
          className="border rounded-xl px-4 py-3 text-sm w-full"
          placeholder="습관 제목 (예: 감사 3가지 쓰기 / 영어단어 20개 / To-do 작성)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="border rounded-xl px-4 py-3 text-sm w-full min-h-[80px]"
          placeholder="설명/나만의 규칙(선택)  예: 조회 전 5분, 3줄 이상, 단어는 20개"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <button className="hy-btn hy-btn-primary text-white text-sm" onClick={createHabit} disabled={loading}>
          습관 추가하기
        </button>

        <div className="text-xs text-gray-500">
          팁: 습관은 1~3개 정도가 꾸준히 하기 좋아요.
        </div>
      </div>

      {/* ===== 탭: 오늘 체크 ===== */}
      {tab === "today" && (
        <div className="space-y-4">
          {mustInfo ? (
            <div className="hy-card p-6 text-sm text-gray-700">
              먼저 <span className="font-semibold">학번/이름</span>을 입력해줘 🙂
            </div>
          ) : myHabits.length === 0 ? (
            <div className="hy-card p-6 text-sm text-gray-700">
              아직 만든 습관이 없어. 위에서 습관을 먼저 추가해줘 🌱
            </div>
          ) : (
            <div className="hy-card p-5">
              <div className="font-semibold">✅ 오늘 체크</div>
              <div className="mt-2 text-sm text-gray-600">
                오늘 할 습관을 체크하면 바로 저장돼요.
              </div>

              <div className="mt-4 space-y-3">
                {myHabits.map((h) => {
                  const checked = checksSet.has(`${h.id}|${todayISO}`);
                  return (
                    <button
                      key={h.id}
                      className={`w-full text-left border rounded-xl p-4 flex items-start justify-between gap-3 ${
                        checked ? "bg-black text-white" : "bg-white"
                      }`}
                      onClick={() => toggleCheck(h.id, todayISO)}
                      disabled={loading || !days90.includes(todayISO)}
                      title={!days90.includes(todayISO) ? "프로젝트 기간(90일) 밖의 날짜입니다." : ""}
                    >
                      <div>
                        <div className="font-semibold">{h.title}</div>
                        {h.note && (
                          <div className={`mt-1 text-sm whitespace-pre-wrap ${checked ? "text-white/80" : "text-gray-600"}`}>
                            {h.note}
                          </div>
                        )}
                      </div>
                      <div className={`text-sm font-semibold ${checked ? "text-white" : "text-gray-700"}`}>
                        {checked ? "완료 ✅" : "체크"}
                      </div>
                    </button>
                  );
                })}
              </div>

              {!days90.includes(todayISO) && (
                <div className="mt-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                  현재 날짜가 프로젝트 기간(90일) 밖이라 체크가 막혀 있어요.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== 탭: 내 습관(90일) ===== */}
      {tab === "mine" && (
        <div className="space-y-4">
          {mustInfo ? (
            <div className="hy-card p-6 text-sm text-gray-700">
              먼저 <span className="font-semibold">학번/이름</span>을 입력해줘 🙂
            </div>
          ) : myHabits.length === 0 ? (
            <div className="hy-card p-6 text-sm text-gray-700">
              아직 만든 습관이 없어. 위에서 습관을 먼저 추가해줘 🌱
            </div>
          ) : (
            myHabits.map((h) => {
              const doneCount = progressOf(h.id);
              return (
                <div key={h.id} className="hy-card p-5 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-bold">{h.title}</div>
                      {h.note && <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{h.note}</div>}
                      <div className="text-xs text-gray-500 mt-2">
                        진행: <span className="font-semibold">{doneCount} / 90</span>
                      </div>
                    </div>

                    <div className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                      {Math.round((doneCount / 90) * 100)}%
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(15, minmax(32px, 1fr))" }}>
                      {days90.map((iso, idx) => {
                        const checked = checksSet.has(`${h.id}|${iso}`);
                        return (
                          <button
                            key={iso}
                            className={`h-8 rounded-lg border text-xs ${
                              checked ? "bg-black text-white" : "bg-white"
                            }`}
                            title={`${idx + 1}일차 · ${iso}`}
                            onClick={() => toggleCheck(h.id, iso)}
                            disabled={loading}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    💡 팁: “오늘 체크” 탭에서 하는 게 제일 빠르고 편해요.
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ===== 탭: 대시보드 ===== */}
      {tab === "dashboard" && (
        <div className="space-y-4">
          <div className="hy-card p-5">
            <div className="font-semibold">📊 오늘 참여 현황</div>
            <div className="mt-2 text-sm text-gray-700">
              오늘 체크한 학생:{" "}
              <span className="font-semibold">{todayParticipants.size}</span>명 / 습관 등록 학생:{" "}
              <span className="font-semibold">{classStudents.length}</span>명
            </div>
            <div className="mt-2 text-xs text-gray-500">
              (습관을 하나라도 만든 학생을 기준으로 집계돼요)
            </div>
          </div>

          <div className="hy-card p-5">
            <div className="font-semibold">🏃 진행도 랭킹 (총 체크 수)</div>
            {leaderboard.length === 0 ? (
              <div className="mt-2 text-sm text-gray-600">아직 체크 데이터가 없어.</div>
            ) : (
              <div className="mt-3 space-y-2">
                {leaderboard.slice(0, 10).map((u, idx) => (
                  <div key={`${u.studentNo}|${u.name}`} className="flex items-center justify-between border rounded-xl p-3">
                    <div className="text-sm">
                      <span className="font-semibold">{idx + 1}.</span> {u.name} ({u.studentNo})
                      {todayParticipants.has(`${u.studentNo}|${u.name}`) && (
                        <span className="ml-2 text-xs rounded-full bg-emerald-100 px-2 py-0.5">
                          오늘 참여
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold">{u.doneCount}회</div>
                  </div>
                ))}
                {leaderboard.length > 10 && (
                  <div className="text-xs text-gray-500">… {leaderboard.length - 10}명 더 있음</div>
                )}
              </div>
            )}
          </div>

          <div className="hy-card p-5 text-sm text-gray-700">
            <div className="font-semibold">대시보드 팁</div>
            <ul className="mt-2 list-disc pl-5">
              <li>아직 습관을 안 만든 친구는 집계에 안 들어가요 → 습관 만들기부터!</li>
              <li>“오늘 참여” 배지는 오늘 체크 1개라도 하면 표시돼요.</li>
            </ul>
          </div>
        </div>
      )}

      <div className="hy-card p-5 text-sm text-gray-700">
        <div className="font-semibold">프로젝트 약속</div>
        <ul className="mt-2 list-disc pl-5">
          <li>완벽보다 꾸준함</li>
          <li>체크는 솔직하게 🙂 (나 자신을 위해)</li>
          <li>끊겨도 다시 시작하면 OK</li>
        </ul>
      </div>
    </div>
  );
}