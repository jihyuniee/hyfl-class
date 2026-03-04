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

  const [studentNo, setStudentNo] = useState("");
  const [name, setName] = useState("");

  // 역할 제안 state
  const [proposerName, setProposerName] = useState("");
  const [suggestedRole, setSuggestedRole] = useState("");
  const [reason, setReason] = useState("");

  async function load() {
    setErr(null);

    const { data: roleData, error: roleErr } = await supabase
      .from("roles")
      .select("*")
      .eq("is_active", true)
      .order("dept", { ascending: true });

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
      alert("학번과 이름을 입력해 주세요.");
      return;
    }

    setLoading(true);

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
    alert("지원 완료!");
  }

  async function submitSuggestion() {
    if (!proposerName || !suggestedRole) {
      alert("이름과 역할을 입력하세요.");
      return;
    }

    const { error } = await supabase.from("role_suggestions").insert({
      proposer_name: proposerName,
      suggested_role: suggestedRole,
      reason: reason,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setSuggestedRole("");
    setReason("");
    alert("역할 제안이 등록되었습니다.");
  }

  return (
    <div className="space-y-6">

      <div className="hy-card p-6">
        <div className="text-sm text-gray-600">우리 반 운영</div>
        <h1 className="hy-title mt-1 text-2xl font-bold">1인 1역할 지원</h1>
        <p className="mt-2 text-sm text-gray-700">
          중복 지원 가능합니다. 겹치면 가위바위보 🙂
        </p>
      </div>

      {/* 학생 정보 */}
      <div className="hy-card p-5 space-y-3">
        <div className="text-sm font-semibold">내 정보</div>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="w-full rounded-2xl border px-4 py-3 text-sm"
            placeholder="학번"
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
      </div>

      {/* 역할 목록 */}
      <div className="space-y-3">
        {roles.map((r) => {
          const applicants = appsByRoleId.get(r.id) ?? [];

          return (
            <div key={r.id} className="hy-card p-5">
              <div className="flex justify-between">

                <div>
                  <div className="text-xs text-gray-500">{r.dept}</div>
                  <div className="font-bold">{r.role_name}</div>

                  {r.duties && (
                    <div className="text-sm text-gray-700 mt-1">
                      {r.duties}
                    </div>
                  )}
                </div>

                <button
                  className="hy-btn hy-btn-primary text-white text-sm"
                  onClick={() => apply(r.id)}
                >
                  지원
                </button>

              </div>

              <div className="mt-3 text-sm text-gray-600">
                지원자 {applicants.length}명
              </div>

              <ul className="mt-2 text-sm">
                {applicants.map((a) => (
                  <li key={a.id}>
                    {a.name} ({a.student_no})
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* 역할 제안 */}
      <div className="hy-card p-5 space-y-3">

        <div className="font-semibold">+ 새로운 역할 제안</div>

        <div className="grid gap-3 md:grid-cols-3">

          <input
            className="rounded-2xl border px-4 py-3 text-sm"
            placeholder="이름"
            value={proposerName}
            onChange={(e) => setProposerName(e.target.value)}
          />

          <input
            className="rounded-2xl border px-4 py-3 text-sm"
            placeholder="추가할 역할"
            value={suggestedRole}
            onChange={(e) => setSuggestedRole(e.target.value)}
          />

          <input
            className="rounded-2xl border px-4 py-3 text-sm"
            placeholder="이유"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

        </div>

        <button
          className="hy-btn hy-btn-primary text-white text-sm"
          onClick={submitSuggestion}
        >
          역할 제안하기
        </button>

      </div>

    </div>
  );
}