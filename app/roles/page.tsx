"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type Role = {
  id: string;
  dept: string;
  role_name: string;
  duties: string | null;
  is_active: boolean;
  created_at: string;
};

type Application = {
  id: string;
  role_id: string;
  student_no: string;
  name: string;
  created_at: string;
};

function formatKST(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 학생 입력(간단 버전: 이름/학번만)
  const [studentNo, setStudentNo] = useState("");
  const [name, setName] = useState("");

  async function load() {
    setErr(null);

    const { data: roleData, error: roleErr } = await supabase
      .from("roles")
      .select("*")
      .eq("is_active", true)
      .order("dept", { ascending: true })
      .order("role_name", { ascending: true });

    if (roleErr) {
      setErr(roleErr.message);
      return;
    }
    setRoles((roleData as Role[]) ?? []);

    const { data: appData, error: appErr } = await supabase
      .from("role_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (appErr) {
      setErr(appErr.message);
      return;
    }
    setApps((appData as Application[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  const appsByRoleId = useMemo(() => {
    const map = new Map<string, Application[]>();
    for (const a of apps) {
      const arr = map.get(a.role_id) ?? [];
      arr.push(a);
      map.set(a.role_id, arr);
    }
    return map;
  }, [apps]);

  async function apply(roleId: string) {
    if (!studentNo.trim() || !name.trim()) {
      alert("학번/이름을 먼저 입력해줘.");
      return;
    }
    setLoading(true);
    setErr(null);

    const { error } = await supabase.from("role_applications").insert({
      role_id: roleId,
      student_no: studentNo.trim(),
      name: name.trim(),
    });

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    await load();
    alert("지원 완료! (다중지원 가능)");
  }

  return (
    <div className="space-y-6">
      <div className="hy-card p-6">
        <div className="text-sm text-gray-600">우리 반 운영</div>
        <h1 className="hy-title mt-1 text-2xl font-bold">1인 1역할 지원 🧩</h1>
        <p className="mt-2 text-sm text-gray-700">
          이미 지원자가 있어도 <span className="font-semibold">추가 지원 가능</span>해.
          겹치면 나중에 가위바위보/조율로 결정!
        </p>
      </div>

      {/* 학생 정보 입력 */}
      <div className="hy-card p-5 space-y-3">
        <div className="text-sm font-semibold">내 정보</div>
        <div className="grid gap-3 md:grid-cols-2">
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
        </div>

        <div className="flex items-center gap-2">
          <button className="hy-btn text-sm" onClick={load}>
            새로고침
          </button>
          {loading && <div className="text-xs text-gray-600">처리 중...</div>}
        </div>

        {err && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            오류: {err}
          </div>
        )}
      </div>

      {/* 역할 목록 */}
      <div className="space-y-3">
        {roles.length === 0 ? (
          <div className="hy-card p-6 text-sm text-gray-700">등록된 역할이 없어.</div>
        ) : (
          roles.map((r) => {
            const applicants = appsByRoleId.get(r.id) ?? [];
            return (
              <div key={r.id} className="hy-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-gray-500">{r.dept}</div>
                    <div className="text-base font-bold">{r.role_name}</div>
                    {r.duties && (
                      <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                        {r.duties}
                      </div>
                    )}
                  </div>

                  <button
                    className="hy-btn hy-btn-primary text-sm text-white"
                    onClick={() => apply(r.id)}
                    disabled={loading}
                  >
                    지원하기
                  </button>
                </div>

                <div className="mt-4 rounded-2xl bg-zinc-50 p-4">
                  <div className="text-xs font-semibold text-gray-600">
                    지원자 {applicants.length}명
                  </div>
                  {applicants.length === 0 ? (
                    <div className="mt-2 text-sm text-gray-600">아직 지원자가 없어.</div>
                  ) : (
                    <ul className="mt-2 space-y-1 text-sm text-gray-800">
                      {applicants.slice(0, 10).map((a) => (
                        <li key={a.id} className="flex justify-between gap-2">
                          <span>
                            {a.name} ({a.student_no})
                          </span>
                          <span className="text-xs text-gray-500">{formatKST(a.created_at)}</span>
                        </li>
                      ))}
                      {applicants.length > 10 && (
                        <li className="text-xs text-gray-500">
                          ... {applicants.length - 10}명 더 있음
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="hy-card p-5 text-sm text-gray-700">
        <div className="font-semibold">운영 규칙</div>
        <ul className="mt-2 list-disc pl-5">
          <li>지원은 중복 가능</li>
          <li>겹치면 담임 진행으로 조율/가위바위보</li>
          <li>확정 결과는 이후 공지로 안내</li>
        </ul>
      </div>
    </div>
  );
}