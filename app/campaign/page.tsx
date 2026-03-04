"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type PledgeRow = {
  id: string;
  created_at: string;
  student_no: string;
  name: string;
  position: string;
  title: string;
  pledges: string;
  is_public: boolean;
};

function formatKST(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

export default function CampaignPage() {
  const [list, setList] = useState<PledgeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [studentNo, setStudentNo] = useState("");
  const [name, setName] = useState("");
  const [position, setPosition] = useState<"회장" | "부회장A" | "부회장B">("회장");
  const [title, setTitle] = useState("");
  const [pledges, setPledges] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  async function load() {
    setErr(null);
    const { data, error } = await supabase
      .from("campaign_pledges")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return setErr(error.message);
    setList((data as PledgeRow[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  const canSubmit = useMemo(() => {
    return (
      studentNo.trim().length >= 2 &&
      name.trim().length >= 1 &&
      title.trim().length >= 2 &&
      pledges.trim().length >= 10
    );
  }, [studentNo, name, title, pledges]);

  async function submit() {
    if (!canSubmit) return;
    setLoading(true);
    setErr(null);

    const { error } = await supabase.from("campaign_pledges").insert({
      student_no: studentNo.trim(),
      name: name.trim(),
      position,
      title: title.trim(),
      pledges: pledges.trim(),
      is_public: isPublic,
    });

    setLoading(false);
    if (error) return setErr(error.message);

    setTitle("");
    setPledges("");
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="hy-card p-6">
        <div className="text-sm text-gray-600">우리 반이 함께 만드는 선거 게시판</div>
        <h1 className="hy-title mt-1 text-2xl font-bold">회장/부회장 공약 🌷</h1>
        <p className="mt-2 text-sm text-gray-700">
          공약은 “멋있게”보다 <span className="font-semibold">실행 가능하게</span> 🙂
        </p>
      </div>

      <div className="hy-card p-5 space-y-3">
        <div className="text-base font-semibold">공약 등록</div>

        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="w-full rounded-2xl border px-4 py-3 text-sm"
            placeholder="학번 (예: 20202)"
            value={studentNo}
            onChange={(e) => setStudentNo(e.target.value)}
          />
          <input
            className="w-full rounded-2xl border px-4 py-3 text-sm"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className="w-full rounded-2xl border px-4 py-3 text-sm"
            value={position}
            onChange={(e) => setPosition(e.target.value as any)}
          >
            <option value="회장">회장</option>
            <option value="부회장A">부회장 A</option>
            <option value="부회장B">부회장 B</option>
          </select>
        </div>

        <input
          className="w-full rounded-2xl border px-4 py-3 text-sm"
          placeholder="공약 제목 (예: 우리 반 ‘약속 3가지’ 만들기)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="min-h-[130px] w-full rounded-2xl border px-4 py-3 text-sm"
          placeholder={`공약 내용 (예시)
- 공약 1: (무엇을) (언제까지) (어떻게)
- 공약 2: ...
- 공약 3: ...
* 실행 계획이 들어가면 더 좋아요!`}
          value={pledges}
          onChange={(e) => setPledges(e.target.value)}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            전체 공개(우리 반이 볼 수 있게)
          </label>

          <button
            className={`hy-btn hy-btn-primary text-sm text-white ${
              !canSubmit || loading ? "opacity-60" : ""
            }`}
            onClick={submit}
            disabled={!canSubmit || loading}
          >
            {loading ? "올리는 중..." : "공약 게시하기"}
          </button>
        </div>

        {!canSubmit && (
          <div className="text-xs text-gray-500">
            필수: 학번, 이름, 공약 제목, 공약 내용(10자 이상)
          </div>
        )}

        {err && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            오류: {err}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-700">게시된 공약 {list.length}개</div>
          <button className="hy-btn text-sm" onClick={load}>새로고침</button>
        </div>

        {list.length === 0 ? (
          <div className="hy-card p-6 text-sm text-gray-700">
            아직 공약이 없어 🙂 첫 공약의 주인공이 되어줘!
          </div>
        ) : (
          list.map((p) => (
            <div key={p.id} className="hy-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">
                    [{p.position}] {p.title}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {p.name} ({p.student_no}) · {formatKST(p.created_at)}
                    {!p.is_public && " · (비공개)"}
                  </div>
                </div>
              </div>

              <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-800">
                {p.pledges}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}