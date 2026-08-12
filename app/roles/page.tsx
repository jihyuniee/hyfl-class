"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";
import SemesterTabs from "@/components/SemesterTabs";
import { CURRENT_SEMESTER, LEGACY_SEMESTER, type SemesterId } from "@/components/lib/semester";

type ClassRole = {
  id: string;
  created_at: string;
  semester: string;
  student_no: string;
  name: string;
  dept: string | null;
  role: string;
  description: string | null;
  password: string | null;
};

const SECTIONS_1ST = [
  {
    dept: "자치기획부",
    emoji: "👑",
    roles: [
      {
        role: "학급 회장",
        students: ["주보민"],
        desc: "배려와 열정이 가득한 학급이 될 수 있도록 노력하고, 학급 일을 총괄 관리",
      },
      {
        role: "학급 부회장 A",
        students: ["강지우"],
        desc: "회장과 함께 학급 의견을 수합하고 담임에게 전달",
      },
      {
        role: "학급 부회장 B",
        students: ["이시원"],
        desc: "각 교과 선생님과 학급 친구들 사이의 연결 역할",
      },
    ],
  },
  {
    dept: "행정안전부",
    emoji: "🗂️",
    roles: [
      {
        role: "독서활동 관리자",
        students: ["김태현"],
        desc: "추천 도서 관리 및 독서 활동 운영",
      },
      {
        role: "게시판 관리자",
        students: ["최인아"],
        desc: "학급 게시판 관리 / 칠판 메모 / 동기부여 글귀 정리",
      },
      {
        role: "기록물 관리자",
        students: ["김혜민"],
        desc: "출석부 관리 / 학급 문서 수합 / 학급 회의 시 서기 역할",
      },
    ],
  },
  {
    dept: "소통환경부",
    emoji: "🌿",
    roles: [
      {
        role: "배치 관리자",
        students: ["유다현", "손정연"],
        desc: "자리 배치 및 조 편성 관리",
      },
      {
        role: "교실환경 관리자",
        students: ["박우진"],
        desc: "청소 및 교실 환경 점검",
      },
      {
        role: "에너지 관리자",
        students: ["장지현"],
        desc: "냉난방 / 전등 / 문단속 관리",
      },
      {
        role: "이벤트 관리자",
        students: ["전주하"],
        desc: "학급 분위기 조성 캠페인 기획",
      },
    ],
  },
  {
    dept: "교육성장부",
    emoji: "📘",
    roles: [
      {
        role: "쪽지시험 관리자",
        students: ["양효승", "김하연"],
        desc: "조회 시간 단어시험 및 학급 쪽지시험 운영",
      },
      {
        role: "멀티미디어 관리자",
        students: ["성연준"],
        desc: "컴퓨터 및 정보기기 관리 / 학급 멀티미디어 운영",
      },
    ],
  },
  {
    dept: "문화체육부",
    emoji: "🎬",
    roles: [
      {
        role: "영상-사진 관리자",
        students: ["이조은"],
        desc: "학급 단체사진 기획 / 학급 추억 영상 촬영",
      },
    ],
  },
];

const EXTRA_ROLES_1ST = [
  {
    role: "급식",
    students: ["정은지"],
    desc: "급식 관련 전달 및 간단한 정리",
  },
  {
    role: "쓰레기",
    students: ["윤혜림", "이승지", "현서정", "박민석"],
    desc: "분리수거 및 쓰레기 정리 담당",
  },
  {
    role: "칠판",
    students: ["심지안", "송민주", "김은솔"],
    desc: "칠판 정리 및 수업 전후 환경 정돈",
  },
];

export default function RolesPage() {
  const [semester, setSemester] = useState<SemesterId>(CURRENT_SEMESTER);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <section className="rounded-[28px] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-sky-50 p-8 shadow-sm">
        <div className="text-sm font-medium text-rose-500">2학년 2반 학급 운영 조직</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">1인 1역할</h1>
        <p className="mt-3 text-sm leading-6 text-gray-700">
          {semester === CURRENT_SEMESTER
            ? "2학기 역할을 새롭게 등록하고 관리해요. 1학기 최종표는 탭을 옮겨 확인할 수 있어요."
            : "1학기 최종 확정 역할표예요. 자료는 그대로 보존됩니다."}
        </p>
        <div className="mt-5">
          <SemesterTabs value={semester} onChange={setSemester} />
        </div>
      </section>

      {semester === LEGACY_SEMESTER ? <RolesFirstSemester /> : <RolesSecondSemester />}
    </div>
  );
}

function RolesFirstSemester() {
  return (
    <>
      {SECTIONS_1ST.map((section) => (
        <section
          key={section.dept}
          className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="text-2xl">{section.emoji}</span>
            <h2 className="text-xl font-bold text-gray-900">{section.dept}</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="rounded-l-2xl border-b px-4 py-3 text-sm font-semibold text-gray-700">
                    역할
                  </th>
                  <th className="border-b px-4 py-3 text-sm font-semibold text-gray-700">
                    담당자
                  </th>
                  <th className="rounded-r-2xl border-b px-4 py-3 text-sm font-semibold text-gray-700">
                    설명
                  </th>
                </tr>
              </thead>
              <tbody>
                {section.roles.map((item) => (
                  <tr key={`${section.dept}-${item.role}`} className="align-top">
                    <td className="border-b px-4 py-4 text-sm font-semibold text-gray-900">
                      {item.role}
                    </td>
                    <td className="border-b px-4 py-4 text-sm text-gray-800">
                      <div className="flex flex-wrap gap-2">
                        {item.students.map((student) => (
                          <span
                            key={student}
                            className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700"
                          >
                            {student}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="border-b px-4 py-4 text-sm leading-6 text-gray-700">
                      {item.desc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <section className="rounded-[24px] border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-2xl">✨</span>
          <h2 className="text-xl font-bold text-gray-900">추가 운영 역할</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {EXTRA_ROLES_1ST.map((item) => (
            <div
              key={item.role}
              className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm"
            >
              <div className="text-base font-bold text-gray-900">{item.role}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.students.map((student) => (
                  <span
                    key={student}
                    className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700"
                  >
                    {student}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-sm leading-6 text-gray-700">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function RolesSecondSemester() {
  const [roles, setRoles] = useState<ClassRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [studentNo, setStudentNo] = useState("");
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [managePw, setManagePw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("class_roles")
      .select("*")
      .eq("semester", CURRENT_SEMESTER)
      .order("dept", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setRoles((data as ClassRole[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, ClassRole[]>();
    roles.forEach(r => {
      const key = r.dept?.trim() || "기타";
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    });
    return map;
  }, [roles]);

  const myRoles = useMemo(() => {
    if (!managePw.trim()) return [];
    return roles.filter(r => r.password === managePw.trim());
  }, [roles, managePw]);

  function resetForm() {
    setDept(""); setRole(""); setDescription(""); setPassword(""); setEditingId(null);
  }

  function startEdit(r: ClassRole) {
    setEditingId(r.id);
    setDept(r.dept ?? "");
    setRole(r.role);
    setDescription(r.description ?? "");
  }

  async function submitRole() {
    setMessage(null);
    if (editingId) {
      if (!managePw.trim()) {
        setMessage({ type: "error", text: "비밀번호를 먼저 입력해줘요." });
        return;
      }
      if (!role.trim()) {
        setMessage({ type: "error", text: "역할 이름을 입력해줘요." });
        return;
      }
      setSubmitting(true);
      const { error } = await supabase
        .from("class_roles")
        .update({
          dept: dept.trim() || null,
          role: role.trim(),
          description: description.trim() || null,
        })
        .eq("id", editingId)
        .eq("password", managePw.trim());
      setSubmitting(false);
      if (error) {
        setMessage({ type: "error", text: "수정에 실패했어요: " + error.message });
        return;
      }
      setMessage({ type: "success", text: "역할 정보를 수정했어요 ✅" });
    } else {
      if (!studentNo.trim() || !name.trim()) {
        setMessage({ type: "error", text: "학번과 이름을 입력해줘요." });
        return;
      }
      if (!role.trim()) {
        setMessage({ type: "error", text: "역할 이름을 입력해줘요." });
        return;
      }
      if (!password.trim()) {
        setMessage({ type: "error", text: "수정·삭제할 때 필요한 비밀번호를 입력해줘요." });
        return;
      }
      setSubmitting(true);
      const { error } = await supabase.from("class_roles").insert({
        semester: CURRENT_SEMESTER,
        student_no: studentNo.trim(),
        name: name.trim(),
        dept: dept.trim() || null,
        role: role.trim(),
        description: description.trim() || null,
        password: password.trim(),
      });
      setSubmitting(false);
      if (error) {
        setMessage({
          type: "error",
          text: error.message.includes("duplicate")
            ? "이미 같은 역할을 등록했어요."
            : "등록에 실패했어요: " + error.message,
        });
        return;
      }
      setMessage({ type: "success", text: "2학기 역할을 등록했어요 🎉 아래 비밀번호란에 같은 비밀번호를 입력하면 내 역할을 관리할 수 있어요." });
      setManagePw(password.trim());
    }
    resetForm();
    await load();
  }

  async function deleteRole(r: ClassRole) {
    if (!confirm(`"${r.role}" 역할을 삭제할까요?`)) return;
    const { error } = await supabase
      .from("class_roles")
      .delete()
      .eq("id", r.id)
      .eq("password", managePw.trim());
    if (error) {
      setMessage({ type: "error", text: "삭제에 실패했어요: " + error.message });
      return;
    }
    setMessage({ type: "success", text: "역할을 삭제했어요." });
    await load();
  }

  return (
    <div className="space-y-6">
      <section className="hy-card p-6">
        <p className="hy-section-label mb-1">{editingId ? "내 역할 수정" : "새 역할 등록"}</p>
        <p className="mb-3 text-sm text-gray-600">
          {editingId
            ? "부서/역할/설명을 수정하고 저장해요. 학번·이름은 바꿀 수 없어요."
            : "학번/이름/부서/역할/설명과 비밀번호를 입력하면 등록돼요. 비밀번호는 나중에 수정·삭제할 때 필요하니 꼭 기억해두세요!"}
        </p>

        {!editingId && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <input
              placeholder="학번 * (예: 20201)"
              value={studentNo}
              onChange={e => setStudentNo(e.target.value)}
              className="hy-input"
              style={{ maxWidth: 160 }}
            />
            <input
              placeholder="이름 *"
              value={name}
              onChange={e => setName(e.target.value)}
              className="hy-input"
              style={{ maxWidth: 140 }}
            />
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <input
            placeholder="부서 (예: 자치기획부, 선택)"
            value={dept}
            onChange={e => setDept(e.target.value)}
            className="hy-input"
            style={{ maxWidth: 220 }}
          />
          <input
            placeholder="역할 이름 * (예: 게시판 관리자)"
            value={role}
            onChange={e => setRole(e.target.value)}
            className="hy-input"
            style={{ maxWidth: 240 }}
          />
        </div>
        <textarea
          placeholder="역할 설명 (선택)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="hy-input mt-2"
          rows={2}
          style={{ width: "100%", resize: "vertical" }}
        />
        {!editingId && (
          <input
            type="password"
            placeholder="관리용 비밀번호 * (수정·삭제 시 필요, 꼭 기억해두세요!)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="hy-input mt-2"
            style={{ maxWidth: 320 }}
          />
        )}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={submitRole}
            disabled={submitting}
            className="hy-btn hy-btn-primary"
            style={{ fontSize: 13 }}
          >
            {submitting ? "저장 중..." : editingId ? "수정 완료" : "역할 등록하기"}
          </button>
          {editingId && (
            <button onClick={resetForm} className="hy-btn" style={{ fontSize: 13 }}>
              취소
            </button>
          )}
        </div>

        {message && (
          <p
            className="mt-3 text-sm font-semibold"
            style={{ color: message.type === "success" ? "#22c55e" : "#ef4444" }}
            role="status"
          >
            {message.type === "success" ? "✅ " : "⚠️ "}
            {message.text}
          </p>
        )}
      </section>

      <section className="hy-soft p-4">
        <p className="mb-1 text-xs font-extrabold text-[var(--text-muted)]">내 역할 수정·삭제하기</p>
        <p className="mb-3 text-xs text-[var(--text-subtle)]">
          등록할 때 입력한 비밀번호를 넣으면, 그 비밀번호로 등록한 역할에 수정·삭제 버튼이 나타나요.
        </p>
        <input
          type="password"
          placeholder="역할 등록 시 입력한 비밀번호"
          value={managePw}
          onChange={e => setManagePw(e.target.value)}
          className="hy-input"
          style={{ maxWidth: 240 }}
        />

        {myRoles.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {myRoles.map(r => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              >
                <div>
                  <span className="text-sm font-bold text-gray-900">{r.role}</span>
                  {r.dept && <span className="ml-2 text-xs text-gray-500">{r.dept}</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(r)} className="hy-btn" style={{ fontSize: 12, padding: "6px 14px" }}>
                    수정
                  </button>
                  <button
                    onClick={() => deleteRole(r)}
                    className="hy-btn"
                    style={{ fontSize: 12, padding: "6px 14px", color: "#ef4444", borderColor: "#fecaca" }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {loading ? (
        <div className="hy-card p-10 text-center">
          <p className="text-sm font-semibold text-[var(--text-subtle)]">불러오는 중... ⏳</p>
        </div>
      ) : error ? (
        <div className="hy-card p-10 text-center">
          <p className="text-sm font-semibold text-red-500">오류가 발생했어요: {error}</p>
        </div>
      ) : roles.length === 0 ? (
        <div className="hy-card p-10 text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
            style={{ background: "linear-gradient(135deg, var(--primary-light), var(--accent-light))" }}
          >
            🌱
          </div>
          <p className="text-base font-extrabold text-gray-900">2학기 역할, 아직 정하는 중이에요</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-subtle)]">
            역할이 정해지는 대로 하나씩 채워질 예정이에요.<br />
            위 &quot;본인 확인&quot;에 학번과 이름을 입력하면 가장 먼저 등록할 수 있어요 🙋
          </p>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([deptName, items]) => (
          <section key={deptName} className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-gray-900">{deptName}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {items.map(item => (
                <div key={item.id} className="rounded-2xl border border-[var(--border)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{item.role}</span>
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">
                      {item.name} ({item.student_no})
                    </span>
                  </div>
                  {item.description && (
                    <p className="mt-2 text-sm leading-6 text-gray-700">{item.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
