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
  created_at: string;
  habit_id: string;
  check_date: string;
  is_done: boolean;
};

const PROJECT_START = "2026-03-09";
const TARGET_DAYS = 90;

function toKSTDateString(d = new Date()) {
  const kst = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, "0");
  const day = String(kst.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isWeekdayKST(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00+09:00`);
  const day = d.getDay();
  return day >= 1 && day <= 5;
}

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00+09:00`);
  d.setDate(d.getDate() + days);
  return toKSTDateString(d);
}

export default function Habit90Page() {
  const today = toKSTDateString();
  const todayIsWeekday = isWeekdayKST(today);

  const [studentNo, setStudentNo] = useState("");
  const [name, setName] = useState("");

  const [habitTitle, setHabitTitle] = useState("");
  const [habitNote, setHabitNote] = useState("");

  const [myHabit, setMyHabit] = useState<HabitItem | null>(null);
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [checks, setChecks] = useState<HabitCheck[]>([]);

  const [tab, setTab] = useState<"today" | "dashboard">("today");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const weekdays90 = useMemo(() => {
    const arr: string[] = [];
    let cursor = PROJECT_START;
    while (arr.length < TARGET_DAYS) {
      if (isWeekdayKST(cursor)) arr.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return arr;
  }, []);

  async function loadAll() {
    setErr(null);

    const { data: habitData, error: hErr } = await supabase
      .from("habit_items")
      .select("*")
      .order("student_no", { ascending: true });

    if (hErr) {
      setErr(hErr.message);
      return;
    }

    const { data: checkData, error: cErr } = await supabase
      .from("habit_checks")
      .select("*");

    if (cErr) {
      setErr(cErr.message);
      return;
    }

    setHabits((habitData as HabitItem[]) ?? []);
    setChecks((checkData as HabitCheck[]) ?? []);
  }

  async function loadMine() {
    if (!studentNo || !name) {
      setMyHabit(null);
      return;
    }

    const { data, error } = await supabase
      .from("habit_items")
      .select("*")
      .eq("student_no", studentNo.trim())
      .eq("name", name.trim())
      .limit(1);

    if (error) {
      setErr(error.message);
      return;
    }

    setMyHabit((data?.[0] as HabitItem) ?? null);
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadMine();
  }, [studentNo, name]);

  const checksByHabitId = useMemo(() => {
    const map = new Map<string, HabitCheck[]>();
    checks.forEach((c) => {
      const arr = map.get(c.habit_id) ?? [];
      arr.push(c);
      map.set(c.habit_id, arr);
    });
    return map;
  }, [checks]);

  const todayCheckMap = useMemo(() => {
    const map = new Map<string, HabitCheck>();
    checks.forEach((c) => {
      if (c.check_date === today) map.set(c.habit_id, c);
    });
    return map;
  }, [checks, today]);

  async function createHabitOnce() {
    if (!studentNo || !name) {
      alert("학번과 이름을 입력해줘 🙂");
      return;
    }

    if (!habitTitle.trim()) {
      alert("습관 제목을 입력해줘 🙂");
      return;
    }

    setCreating(true);

    const { data: existing } = await supabase
      .from("habit_items")
      .select("id")
      .eq("student_no", studentNo.trim())
      .limit(1);

    if (existing && existing.length > 0) {
      setCreating(false);
      alert("이미 습관이 등록되어 있어 🙂");
      return;
    }

    const { error } = await supabase.from("habit_items").insert({
      student_no: studentNo.trim(),
      name: name.trim(),
      title: habitTitle.trim(),
      note: habitNote.trim() || null,
    });

    setCreating(false);

    if (error) {
      setErr(error.message);
      return;
    }

    await loadAll();
    await loadMine();
    alert("습관 등록 완료 ✅");
  }

  async function setTodayDone(is_done: boolean) {
    if (!myHabit) {
      alert("먼저 습관을 등록해줘 🙂");
      return;
    }

    if (!todayIsWeekday) {
      alert("주말은 체크하지 않아요 🙂");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("habit_checks").upsert(
      {
        habit_id: myHabit.id,
        check_date: today,
        is_done,
      },
      { onConflict: "habit_id,check_date" }
    );

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    await loadAll();
    alert(is_done ? "오늘 했음으로 체크 ✅" : "오늘 못함으로 체크 ⬜");
  }

  const myDoneCount = useMemo(() => {
    if (!myHabit) return 0;
    return (checksByHabitId.get(myHabit.id) ?? []).filter((c) => c.is_done).length;
  }, [myHabit, checksByHabitId]);

  const classStats = useMemo(() => {
    const total = habits.length;
    const doneToday = habits.filter((h) => todayCheckMap.get(h.id)?.is_done).length;
    return {
      total,
      doneToday,
      notDoneToday: total - doneToday,
    };
  }, [habits, todayCheckMap]);

  return (
    <div className="space-y-6">
      <div className="hy-card p-6">
        <div className="text-sm text-gray-600">우리 반 한학기 프로젝트</div>
        <h1 className="text-2xl font-bold mt-1">🌱 90일 좋은 습관 만들기</h1>
        <p className="mt-2 text-sm text-gray-700">
          각자 습관 1개를 정하고, 평일 90회 동안 실천해요. 서로의 습관과 체크 현황은 모두 공개됩니다 🙂
        </p>

        <div className="mt-4 flex gap-2">
          <button
            className={`hy-btn text-sm ${tab === "today" ? "hy-btn-primary text-white" : ""}`}
            onClick={() => setTab("today")}
          >
            오늘 체크
          </button>
          <button
            className={`hy-btn text-sm ${tab === "dashboard" ? "hy-btn-primary text-white" : ""}`}
            onClick={() => setTab("dashboard")}
          >
            전체 대시보드
          </button>
        </div>
      </div>

      <div className="hy-card p-5">
        <div className="font-semibold">내 정보</div>
        <div className="mt-3 grid md:grid-cols-2 gap-3">
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
      </div>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          오류: {err}
        </div>
      )}

      {tab === "today" && (
        <div className="space-y-4">
          {!myHabit ? (
            <div className="hy-card p-5 space-y-3">
              <div className="font-semibold">습관 1개 등록</div>
              <input
                className="border rounded-xl px-4 py-3 text-sm w-full"
                placeholder="습관 제목 (예: 감사 3가지 쓰기)"
                value={habitTitle}
                onChange={(e) => setHabitTitle(e.target.value)}
              />
              <input
                className="border rounded-xl px-4 py-3 text-sm w-full"
                placeholder="짧은 설명(선택)"
                value={habitNote}
                onChange={(e) => setHabitNote(e.target.value)}
              />
              <button
                className="hy-btn hy-btn-primary text-white text-sm"
                onClick={createHabitOnce}
                disabled={creating}
              >
                {creating ? "등록 중..." : "습관 등록하기"}
              </button>
            </div>
          ) : (
            <div className="hy-card p-5 space-y-4">
              <div className="text-sm text-gray-600">내 습관</div>
              <div className="text-lg font-bold">{myHabit.title}</div>
              {myHabit.note && <div className="text-sm text-gray-700">{myHabit.note}</div>}

              <div className="text-sm text-gray-700">
                누적 달성: <b>{myDoneCount}</b> / {TARGET_DAYS}
              </div>

              {todayIsWeekday ? (
                <div className="flex gap-2">
                  <button
                    className="hy-btn hy-btn-primary text-white text-sm"
                    onClick={() => setTodayDone(true)}
                    disabled={loading}
                  >
                    오늘 했음 ✅
                  </button>
                  <button
                    className="hy-btn text-sm"
                    onClick={() => setTodayDone(false)}
                    disabled={loading}
                  >
                    오늘 못함 ⬜
                  </button>
                </div>
              ) : (
                <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                  오늘은 주말이라 체크하지 않아요 🙂
                </div>
              )}

              {todayCheckMap.get(myHabit.id) && (
                <div className="text-sm text-gray-600">
                  오늘 상태:{" "}
                  <b>{todayCheckMap.get(myHabit.id)?.is_done ? "✅ 했음" : "⬜ 못함"}</b>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "dashboard" && (
        <div className="space-y-4">
          <div className="hy-card p-5">
            <div className="font-semibold">오늘 전체 현황</div>
            <div className="mt-2 text-sm text-gray-700">
              전체 {classStats.total}명 · 오늘 ✅ {classStats.doneToday}명 · ⬜ {classStats.notDoneToday}명
            </div>
          </div>

          <div className="hy-card p-5">
            <div className="font-semibold mb-3">우리 반 전체 습관 현황</div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2 px-3">학번</th>
                    <th className="text-left py-2 px-3">이름</th>
                    <th className="text-left py-2 px-3">습관</th>
                    <th className="text-left py-2 px-3">오늘</th>
                    <th className="text-left py-2 px-3">누적</th>
                  </tr>
                </thead>
                <tbody>
                  {habits.map((h) => {
                    const todayCheck = todayCheckMap.get(h.id);
                    const doneCount = (checksByHabitId.get(h.id) ?? []).filter((c) => c.is_done).length;

                    return (
                      <tr key={h.id} className="border-b">
                        <td className="py-2 px-3">{h.student_no}</td>
                        <td className="py-2 px-3">{h.name}</td>
                        <td className="py-2 px-3">
                          <div className="font-medium">{h.title}</div>
                          {h.note && <div className="text-xs text-gray-500">{h.note}</div>}
                        </td>
                        <td className="py-2 px-3">
                          {todayIsWeekday ? (todayCheck ? (todayCheck.is_done ? "✅" : "⬜") : "—") : "주말"}
                        </td>
                        <td className="py-2 px-3">{doneCount} / {TARGET_DAYS}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}