"use client";
import { supabase } from "../../../components/lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "hyfl_private_counseling_submissions_v1";
const ADMIN_PASSWORD = "0212"; // 지현이 원하는 비밀번호로 바꿔도 됨
const ADMIN_UNLOCK_KEY = "hyfl_admin_unlocked_v1";

type RecordItem = {
  id: string;
  createdAt: string;
  payload: {
    studentNo: string;
    name: string;

    parentContact: string;
    preferredContactMethod: string;
    preferredContactDetail: string;

    mbti: string;
    closeFriends: string;

    firstImpression: string;
    wantClassActivity: string;

    likeSubject: string;
    likeReason: string;
    dislikeSubject: string;
    dislikeReason: string;

    hobby: string;
    presentationStyle: string;
    learningHelpStyle: string;

    parentsStyle: string;
    parentsMeaning: string;

    talkWith: string;

    strengths: string;
    weaknesses: string;

    adjectives: string;
    wantToBe: string;

    dream: string;
    habitToFix: string;

    messageToTeacher: string;
    teacherShouldKnow: string;
  };
};

function formatKST(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      <div className="mt-3 text-sm text-gray-800">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="grid gap-2 border-b py-2 last:border-b-0 md:grid-cols-4">
      <div className="text-xs font-semibold text-gray-600 md:col-span-1">{label}</div>
      <div className="whitespace-pre-wrap text-sm text-gray-900 md:col-span-3">{value}</div>
    </div>
  );
}

export default function CounselingAdminPage() {
  // ✅ 훅(useState/useEffect)은 반드시 이 함수 안에서만!
  const [list, setList] = useState<RecordItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

    useEffect(() => {
    (async () => {
        // 1) DB에서 최신순으로 가져오기
        const { data, error } = await supabase
        .from("counseling_submissions")
        .select("*")
        .order("created_at", { ascending: false });

        if (error) {
        alert("DB 조회 실패: " + error.message);
        return;
        }

        const parsed = (data ?? []).map((row: any) => ({
        id: row.id,
        createdAt: row.created_at,
        payload: {
            studentNo: row.student_no ?? "",
            name: row.name ?? "",

            parentContact: row.parent_contact ?? "",
            preferredContactMethod: row.preferred_contact_method ?? "",
            preferredContactDetail: row.preferred_contact_detail ?? "",

            mbti: row.mbti ?? "",
            closeFriends: row.close_friends ?? "",

            firstImpression: row.first_impression ?? "",
            wantClassActivity: row.want_class_activity ?? "",

            likeSubject: row.like_subject ?? "",
            likeReason: row.like_reason ?? "",
            dislikeSubject: row.dislike_subject ?? "",
            dislikeReason: row.dislike_reason ?? "",

            hobby: row.hobby ?? "",
            presentationStyle: row.presentation_style ?? "",
            learningHelpStyle: row.learning_help_style ?? "",

            parentsStyle: row.parents_style ?? "",
            parentsMeaning: row.parents_meaning ?? "",

            talkWith: row.talk_with ?? "",

            strengths: row.strengths ?? "",
            weaknesses: row.weaknesses ?? "",

            adjectives: row.adjectives ?? "",
            wantToBe: row.want_to_be ?? "",

            dream: row.dream ?? "",
            habitToFix: row.habit_to_fix ?? "",

            messageToTeacher: row.message_to_teacher ?? "",
            teacherShouldKnow: row.teacher_should_know ?? "",
        },
        })) as RecordItem[];

        setList(parsed);
        setSelectedId(parsed[0]?.id ?? null);

        // 2) 잠금 자동 해제(이 PC에서만)
        const unlocked = localStorage.getItem(ADMIN_UNLOCK_KEY);
        if (unlocked === "true") setIsUnlocked(true);
    })();
    }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      const p = r.payload;
      return (
        p.name.toLowerCase().includes(q) ||
        p.studentNo.toLowerCase().includes(q) ||
        (p.teacherShouldKnow || "").toLowerCase().includes(q) ||
        (p.messageToTeacher || "").toLowerCase().includes(q)
      );
    });
  }, [list, query]);

  const selected = useMemo(() => {
    return filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? null;
  }, [filtered, selectedId]);

  function refresh() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: RecordItem[] = raw ? JSON.parse(raw) : [];
    setList(parsed);
    setSelectedId(parsed[0]?.id ?? null);
  }

  function deleteOne(id: string) {
    const next = list.filter((r) => r.id !== id);
    setList(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSelectedId(next[0]?.id ?? null);
  }

  function clearAll() {
    if (!confirm("정말 전체 삭제할까? (복구 불가)")) return;
    localStorage.removeItem(STORAGE_KEY);
    setList([]);
    setSelectedId(null);
  }

function downloadCSV() {
  if (!list.length) {
    alert("다운로드할 데이터가 없어.");
    return;
  }

  const headers = [
    "학번",
    "이름",
    "MBTI",
    "장점",
    "단점",
    "진로",
    "선생님께 하고 싶은 말",
    "꼭 알아야 할 사항"
  ];

  const rows = list.map((item) => [
    item.payload.studentNo,
    item.payload.name,
    item.payload.mbti,
    item.payload.strengths,
    item.payload.weaknesses,
    item.payload.dream,
    item.payload.messageToTeacher,
    item.payload.teacherShouldKnow
  ]);

  const csvContent =
    "\uFEFF" +
    [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell ?? ""}"`).join(","))
      .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "상담설문_다운로드.csv";
  link.click();

  URL.revokeObjectURL(url);
}

  // 🔒 잠금 화면
  if (!isUnlocked) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">담임 전용 페이지 🔒</h1>

        <div className="max-w-md rounded-2xl border bg-white p-6">
          <div className="mb-3 text-sm">비밀번호를 입력하세요</div>
          <input
            type="password"
            className="w-full rounded-xl border px-3 py-2"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
          />
          <button
            className="mt-4 rounded-full bg-black px-5 py-2 text-sm text-white"
            onClick={() => {
              if (passwordInput === ADMIN_PASSWORD) {
                setIsUnlocked(true);
              } else {
                alert("비밀번호가 틀렸어");
              }
            }}
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  // ✅ 잠금 해제 후: admin 본문
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">담임 전용: 상담 설문 제출 목록</h1>
        <p className="mt-1 text-sm text-gray-600">
          현재는 <span className="font-semibold">이 PC/브라우저</span>에 저장된 제출만 보이게 돼.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
        className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
        onClick={downloadCSV}
        >
        엑셀 다운로드
        </button>
        <input
          className="w-full rounded-xl border px-3 py-2 md:w-96"
          placeholder="이름/학번/메모(15번) 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
          onClick={refresh}
        >
          새로고침
        </button>
        <button
          className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
          onClick={clearAll}
        >
          전체 삭제
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* 목록 */}
        <div className="rounded-2xl border bg-white p-4 md:col-span-1">
          <div className="text-sm font-semibold text-gray-700">제출 {filtered.length}건</div>
          <div className="mt-3 divide-y">
            {filtered.length === 0 && (
              <div className="py-8 text-sm text-gray-600">제출 데이터가 없어.</div>
            )}

            {filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className={`w-full py-3 text-left ${selected?.id === r.id ? "bg-gray-50" : ""}`}
              >
                <div className="font-semibold">
                  {r.payload.name} ({r.payload.studentNo})
                </div>
                <div className="mt-1 text-xs text-gray-500">{formatKST(r.createdAt)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 상세 */}
        <div className="space-y-4 md:col-span-2">
          {!selected ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-gray-700">
              왼쪽에서 학생을 선택해줘.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold">
                  {selected.payload.name} ({selected.payload.studentNo})
                </div>
                <button
                  className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
                  onClick={() => deleteOne(selected.id)}
                >
                  이 제출 삭제
                </button>
              </div>

              <Section title="기본/연락">
                <Row label="MBTI" value={selected.payload.mbti} />
                <Row label="친한 친구" value={selected.payload.closeFriends} />
                <Row label="학부모 연락처" value={selected.payload.parentContact} />
                <Row label="연락 선호" value={selected.payload.preferredContactMethod} />
                <Row label="연락 메모" value={selected.payload.preferredContactDetail} />
              </Section>

              <Section title="우리 반/선생님에 대해">
                <Row label="첫인상" value={selected.payload.firstImpression} />
                <Row label="학급 활동" value={selected.payload.wantClassActivity} />
              </Section>

              <Section title="과목">
                <Row label="좋아하는 과목" value={selected.payload.likeSubject} />
                <Row label="이유" value={selected.payload.likeReason} />
                <Row label="싫어하는 과목" value={selected.payload.dislikeSubject} />
                <Row label="이유" value={selected.payload.dislikeReason} />
              </Section>

              <Section title="수업/학습 스타일">
                <Row label="취미/관심" value={selected.payload.hobby} />
                <Row label="발표" value={selected.payload.presentationStyle} />
                <Row label="모를 때" value={selected.payload.learningHelpStyle} />
              </Section>

              <Section title="가정/관계">
                <Row label="부모님 스타일" value={selected.payload.parentsStyle} />
                <Row label="부모님은 어떤 분" value={selected.payload.parentsMeaning} />
                <Row label="고민 의논" value={selected.payload.talkWith} />
              </Section>

              <Section title="나에 대해">
                <Row label="장점" value={selected.payload.strengths} />
                <Row label="단점" value={selected.payload.weaknesses} />
                <Row label="형용사" value={selected.payload.adjectives} />
                <Row label="되고 싶은 사람" value={selected.payload.wantToBe} />
                <Row label="진로/관심" value={selected.payload.dream} />
                <Row label="고치고 싶은 버릇" value={selected.payload.habitToFix} />
              </Section>

              <Section title="선생님께">
                <Row label="드리고 싶은 말" value={selected.payload.messageToTeacher} />
                <Row
                  label="꼭 알아야/요즘 고민(비공개 핵심)"
                  value={selected.payload.teacherShouldKnow}
                />
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}