"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type Role = {
  id: string;
  dept: string;
  role_name: string;
  duties: string | null;
  description: string | null;
  is_active: boolean;
};

type Application = {
  id: string;
  role_id: string;
  student_no: string;
  name: string;
};

export default function RolesPage() {

  const [roles, setRoles] = useState<Role[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [studentNo, setStudentNo] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {

    const { data: roleData } = await supabase
      .from("roles")
      .select("*")
      .eq("is_active", true)
      .order("dept");

    const { data: appData } = await supabase
      .from("role_applications")
      .select("*");

    setRoles(roleData ?? []);
    setApps(appData ?? []);
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

  const myRoles = apps.filter(
    (a) => a.student_no === studentNo && a.name === name
  );

  async function apply(role: Role) {

    if (!studentNo || !name) {
      alert("학번과 이름을 입력하세요.");
      return;
    }

    const already = apps.find(
      (a) =>
        a.role_id === role.id &&
        a.student_no === studentNo
    );

    if (already) {
      alert("이미 지원했습니다.");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("role_applications")
      .insert({
        role_id: role.id,
        student_no: studentNo,
        name: name,
      });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    await load();

    alert(`${role.role_name} 지원 완료 🙂`);
  }

  function renderDescription(role: Role) {

    const text = role.description ?? role.duties;

    if (!text) return null;

    return (
      <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
        {text}
      </div>
    );
  }

  const leaders = roles.filter(
    (r) => r.dept === "자치기획부"
  );

  const rolesByDept = useMemo(() => {

    const grouped: Record<string, Role[]> = {};

    roles.forEach((r) => {

      if (r.dept === "자치기획부") return;

      if (!grouped[r.dept]) {
        grouped[r.dept] = [];
      }

      grouped[r.dept].push(r);

    });

    return grouped;

  }, [roles]);

  return (

    <div className="space-y-8">


      {/* 제목 */}

      <div className="hy-card p-6">

        <div className="text-sm text-gray-600">
          우리 반 운영 시스템
        </div>

        <h1 className="text-2xl font-bold mt-1">
          1인 1역할
        </h1>

        <p className="text-sm text-gray-700 mt-2">
          중복 지원 가능합니다. 겹치면 가위바위보 🙂
        </p>

      </div>


      {/* 학생 정보 */}

      <div className="hy-card p-5 space-y-3">

        <div className="font-semibold">
          내 정보 입력
        </div>

        <div className="grid md:grid-cols-2 gap-3">

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


      {/* 내가 지원한 역할 */}

      {myRoles.length > 0 && (

        <div className="hy-card p-5">

          <div className="font-semibold mb-3">
            내가 지원한 역할
          </div>

          <ul className="text-sm space-y-1">

            {myRoles.map((a) => {

              const role = roles.find(
                (r) => r.id === a.role_id
              );

              return (
                <li key={a.id}>
                  {role?.role_name}
                </li>
              );

            })}

          </ul>

        </div>

      )}


      {/* 회장단 */}

      <div className="hy-card p-5">

        <div className="font-semibold mb-4">
          자치기획부 (회장단)
        </div>

        {leaders.map((r) => (

          <div key={r.id} className="mb-4">

            <div className="font-bold">
              {r.role_name}
            </div>

            {renderDescription(r)}

            <div className="text-xs text-gray-500 mt-1">
              회장단 공약으로 선출
            </div>

          </div>

        ))}

      </div>


      {/* 부서별 역할 */}

      {Object.entries(rolesByDept).map(
        ([dept, deptRoles]) => (

          <div key={dept} className="hy-card p-5">

            <div className="font-semibold mb-4">
              📁 {dept}
            </div>

            <div className="space-y-4">

              {deptRoles.map((r) => {

                const applicants =
                  appsByRoleId.get(r.id) ?? [];

                return (

                  <div
                    key={r.id}
                    className="border rounded-xl p-4"
                  >

                    <div className="flex justify-between items-start">

                      <div>

                        <div className="font-semibold">
                          {r.role_name}
                        </div>

                        {renderDescription(r)}

                      </div>

                      <button
                        disabled={loading}
                        className="hy-btn hy-btn-primary text-white text-sm"
                        onClick={() => apply(r)}
                      >
                        지원
                      </button>

                    </div>

                    <div className="mt-3 text-sm text-gray-600">
                      지원자 {applicants.length}명
                    </div>

                    <ul className="text-sm mt-1 space-y-1">

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

          </div>

        )
      )}

    </div>
  );
}