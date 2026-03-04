"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type PledgeRow = {
  id: string;
  created_at: string;
  role: string;
  candidate_name: string;
  class_no: string;
  pledge_1: string;
  pledge_2: string;
  pledge_3: string;
  detail: string | null;
  is_published: boolean;
};

function formatKST(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="hy-card p-5">{children}</div>;
}

const ADMIN_UNLOCK_KEY = "hyfl_admin_unlock_v1"; // counseling admin에서 쓰던 거랑 맞춰도 됨

export default function PledgesPage() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<PledgeRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // 폼
  const [role, setRole] = useState<"회장" | "부회장">("회장");
  const [candidateName, setCandidateName] = useState("");
  const [pledge1, setPledge1] = useState("");
  const [pledge2, setPledge2] = useState("");
  const [pledge3, setPledge3] = useState("");
  const [detail, setDetail] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  // 담임(관리자) 여부: localStorage에 unlock 값이 있으면 삭제 버튼 활성화
  const isAdmin = useMemo(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(ADMIN_UNLOCK_KEY) === "true";
  }, []);

  async function load() {
    setErr(null);
    const { data, error } = await supabase
      .from("pledges")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErr(error.message);
      return;
    }
    setList((data as PledgeRow[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  const canSubmit = useMemo(() => {
    return (
      candidateName.trim().length >= 1 &&
      pledge1.trim().length >= 2 &&
      pledge2.trim().length >= 2 &&
      pledge3.trim().length >= 2
    );
  }, [candidateName, pledge1, pledge2, pledge3]);

  async function submit() {
    if (!canSubmit) return;
    setLoading(true);
    setErr(null);

    const { error } = await supabase.from("pledges").insert({
      role,
      candidate_name: candidateName.trim(),
      class_no: "2-2",
      pledge_1: pledge1.trim(),
      pledge_2: pledge2.trim(),
      pledge_3: pledge3.trim(),
      detail: detail.trim() ? detail.trim() : null,
      is_published: isPublished,
    });

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    // 리셋
    // setCandidateName(""); // 이름은 남기고 싶으면 주석 처리
    setPledge1("");
    setPledge2("");
    setPledge3("");
    setDetail("");
    setIsPublished(true);

    await load();
  }

  async function deleteOne(id: string) {
    if (!isAdmin) return;
    if (!confirm("이 공약을 삭제할까?")) return;

    const { error } = await supabase.from("pledges").delete().eq("id", id);
    if (error) {
      alert("삭제 오류: " + error.message);
      return;
    }
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="hy-card p-6">
        <div className="text-sm text-gray-600">우리반이 함께 만드는 학급자치</div>
        <h1 className="hy-title mt-1 text-2xl font-bold">회장/부회장 공약 게시판 🗳️</h1>
        <p className="mt-2 text-sm text-gray-700">
          공약은 <span className="font-semibold">실현 가능한 약속</span>으로,
          <span className="font-semibold"> 구체적으로</span> 써주기 🙂
        </p>
      </div>

      {/* 작성 */}
      <Card>
        <div className="text-base font-semibold">공약 등록하기</div>

        <div className="mt-4 grid gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <select
              className="w-full rounded-2xl border px-4 py-3 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
            >
              <option value="회장">회장</option>
              <option value="부회장">부회장</option>
            </select>

            <input
              className="w-full rounded-2xl border px-4 py-3 text-sm"
              placeholder="후보 이름 (예: 김민지 / 22번 민지)"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
            />
          </div>

          <input
            className="w-full rounded-2xl border px-4 py-3 text-sm"
            placeholder="공약 1 (예: 수행평가 일정 주간 정리)"
            value={pledge1}
            onChange={(e) => setPledge1(e.target.value)}
          />
          <input
            className="w-full rounded-2xl border px-4 py-3 text-sm"
            placeholder="공약 2 (예: 학급 행사/이벤트 월 1회 운영)"
            value={pledge2}
            onChange={(e) => setPledge2(e.target.value)}
          />
          <input
            className="w-full rounded-2xl border px-4 py-3 text-sm"
            placeholder="공약 3 (예: 학급 건의함 피드백 정리/공개)"
            value={pledge3}
            onChange={(e) => setPledge3(e.target.value)}
          />

          <textarea
            className="min-h-[90px] w-full rounded-2xl border px-4 py-3 text-sm"
            placeholder="추가 설명(선택) - 어떻게 실행할지, 기간/방법, 팀 구성 등"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              게시(우리 반 친구들이 볼 수 있게)
            </label>

            <button
              className={`hy-btn hy-btn-primary text-sm text-white ${
                !canSubmit || loading ? "opacity-60" : ""
              }`}
              onClick={submit}
              disabled={!canSubmit || loading}
            >
              {loading ? "등록 중..." : "공약 등록하기"}
            </button>
          </div>

          {!canSubmit && (
            <div className="text-xs text-gray-500">
              필수: 후보 이름, 공약 1~3 (각 2글자 이상)
            </div>
          )}

          {err && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              오류: {err}
            </div>
          )}
        </div>
      </Card>

      {/* 목록 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-700">
            등록된 공약 {list.filter((x) => x.is_published).length}개
          </div>
          <button className="hy-btn text-sm" onClick={load}>
            새로고침
          </button>
        </div>

        {list.filter((x) => x.is_published).length === 0 ? (
          <div className="hy-card p-6 text-sm text-gray-700">
            아직 공약이 없어. 첫 공약의 주인공이 되어줘 🙂
          </div>
        ) : (
          list
            .filter((x) => x.is_published)
            .map((p) => (
              <div key={p.id} className="hy-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">
                      [{p.role}] {p.candidate_name}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {formatKST(p.created_at)}
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      className="rounded-full border px-3 py-1 text-xs hover:bg-gray-50"
                      onClick={() => deleteOne(p.id)}
                    >
                      삭제
                    </button>
                  )}
                </div>

                <div className="mt-4 grid gap-2 text-sm">
                  <div className="rounded-2xl bg-zinc-50 p-4">
                    <div className="text-xs font-semibold text-gray-600">공약 1</div>
                    <div className="mt-1 whitespace-pre-wrap text-gray-900">{p.pledge_1}</div>
                  </div>
                  <div className="rounded-2xl bg-zinc-50 p-4">
                    <div className="text-xs font-semibold text-gray-600">공약 2</div>
                    <div className="mt-1 whitespace-pre-wrap text-gray-900">{p.pledge_2}</div>
                  </div>
                  <div className="rounded-2xl bg-zinc-50 p-4">
                    <div className="text-xs font-semibold text-gray-600">공약 3</div>
                    <div className="mt-1 whitespace-pre-wrap text-gray-900">{p.pledge_3}</div>
                  </div>

                  {p.detail?.trim() && (
                    <div className="rounded-2xl bg-zinc-50 p-4">
                      <div className="text-xs font-semibold text-gray-600">추가 설명</div>
                      <div className="mt-1 whitespace-pre-wrap text-gray-900">{p.detail}</div>
                    </div>
                  )}
                </div>
              </div>
            ))
        )}
      </div>

      <div className="hy-card p-5 text-sm text-gray-700">
        <div className="font-semibold">공약 작성 가이드 ✨</div>
        <ul className="mt-2 list-disc pl-5">
          <li>“열심히 하겠습니다”보다 “무엇을/어떻게/언제”가 들어가게</li>
          <li>한 달에 한 번 확인 가능한 형태면 더 신뢰감 있음</li>
          <li>현실적으로 할 수 있는 만큼만 약속하기</li>
        </ul>
      </div>
    </div>
  );
}