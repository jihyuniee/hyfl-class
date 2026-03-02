"use client";

import { useMemo, useState } from "react";
import { supabase } from "../../components/lib/supabaseClient";

type CounselingForm = {
  studentNo: string;
  name: string;

  // 연락 관련
  parentContact: string;
  preferredContactMethod: "카톡" | "문자" | "전화" | "이메일" | "기타";
  preferredContactDetail: string;

  // 기본 정보
  mbti: string;
  closeFriends: string;

  // 상담 관련
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

const STORAGE_KEY = "hyfl_private_counseling_submissions_v1";

function saveSubmission(payload: CounselingForm) {
  const now = new Date();
  const record = {
    id: `${now.getTime()}`,
    createdAt: now.toISOString(),
    payload,
  };

  const prev = localStorage.getItem(STORAGE_KEY);
  const list = prev ? JSON.parse(prev) : [];
  list.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function CounselingPage() {
  const [form, setForm] = useState<CounselingForm>({
    studentNo: "",
    name: "",
    parentContact: "",
    preferredContactMethod: "카톡",
    preferredContactDetail: "",
    mbti: "",
    closeFriends: "",

    firstImpression: "",
    wantClassActivity: "",

    likeSubject: "",
    likeReason: "",
    dislikeSubject: "",
    dislikeReason: "",

    hobby: "",
    presentationStyle: "",
    learningHelpStyle: "",

    parentsStyle: "",
    parentsMeaning: "",

    talkWith: "",

    strengths: "",
    weaknesses: "",

    adjectives: "",
    wantToBe: "",

    dream: "",
    habitToFix: "",

    messageToTeacher: "",
    teacherShouldKnow: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const canSubmit = useMemo(() => {
    return form.studentNo.trim() && form.name.trim();
  }, [form.studentNo, form.name]);

  function update<K extends keyof CounselingForm>(key: K, value: CounselingForm[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!canSubmit) return;

  const { error } = await supabase.from("counseling_submissions").insert([
    {
      student_no: form.studentNo,
      name: form.name,

      parent_contact: form.parentContact,
      preferred_contact_method: form.preferredContactMethod,
      preferred_contact_detail: form.preferredContactDetail,

      mbti: form.mbti,
      close_friends: form.closeFriends,

      first_impression: form.firstImpression,
      want_class_activity: form.wantClassActivity,

      like_subject: form.likeSubject,
      like_reason: form.likeReason,
      dislike_subject: form.dislikeSubject,
      dislike_reason: form.dislikeReason,

      hobby: form.hobby,
      presentation_style: form.presentationStyle,
      learning_help_style: form.learningHelpStyle,

      parents_style: form.parentsStyle,
      parents_meaning: form.parentsMeaning,

      talk_with: form.talkWith,

      strengths: form.strengths,
      weaknesses: form.weaknesses,

      adjectives: form.adjectives,
      want_to_be: form.wantToBe,

      dream: form.dream,
      habit_to_fix: form.habitToFix,

      message_to_teacher: form.messageToTeacher,
      teacher_should_know: form.teacherShouldKnow,
    },
  ]);

  if (error) {
    alert("저장 실패: " + error.message);
    return;
  }

  setSubmitted(true);
}
  if (submitted) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">제출 완료 ✅</h1>
        <div className="rounded-2xl border bg-white p-5 text-sm text-gray-700">
          <p className="font-semibold">비공개 설문이 저장되었어.</p>
          <p className="mt-2">
            (현재 단계에서는 <span className="font-semibold">이 브라우저</span>에만 저장돼.
            다음 단계에서 Supabase를 붙이면 담임 계정으로만 조회되게 만들 수 있어.)
          </p>
          <button
            className="mt-4 rounded-full bg-black px-4 py-2 text-sm text-white hover:opacity-90"
            onClick={() => {
              setSubmitted(false);
              setForm((p) => ({ ...p, messageToTeacher: "", teacherShouldKnow: "" }));
            }}
          >
            새로 작성하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">비공개 상담 설문</h1>
        <p className="mt-1 text-sm text-gray-600">
          이 페이지의 내용은 “비공개”를 전제로 작성해. (다음 단계에서 담임만 열람하도록 완성할 거야.)
        </p>
      </div>

      <div className="rounded-2xl border bg-amber-50 p-4 text-sm text-gray-800">
        <p className="font-semibold">안내</p>
        <ul className="mt-2 list-disc pl-5">
          <li>솔직하게 적어도 괜찮아. 선생님이 더 잘 이해하고 돕기 위한 설문이야.</li>
          <li>지금 버전은 제출 내용이 이 브라우저에만 저장돼. (배포 후에는 DB 연결 필요)</li>
        </ul>
      </div>

      {/* 기본 정보 */}
      <section className="rounded-2xl border bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">0. 기본 정보</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm">학번 *</div>
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={form.studentNo}
              onChange={(e) => update("studentNo", e.target.value)}
              placeholder="예) 20501"
              required
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm">이름 *</div>
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="이름"
              required
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm">MBTI(선택)</div>
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={form.mbti}
              onChange={(e) => update("mbti", e.target.value)}
              placeholder="예) INFP"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm">학교에서 정말 친한 친구(여러 명 가능)</div>
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={form.closeFriends}
              onChange={(e) => update("closeFriends", e.target.value)}
              placeholder="이름을 쉼표로 구분"
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1 md:col-span-2">
            <div className="text-sm">선생님과 연락이 더 편한 학부모님 연락처(선택)</div>
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={form.parentContact}
              onChange={(e) => update("parentContact", e.target.value)}
              placeholder="예) 010-1234-5678"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm">연락 선호</div>
            <select
              className="w-full rounded-xl border px-3 py-2"
              value={form.preferredContactMethod}
              onChange={(e) => update("preferredContactMethod", e.target.value as any)}
            >
              <option>카톡</option>
              <option>문자</option>
              <option>전화</option>
              <option>이메일</option>
              <option>기타</option>
            </select>
          </label>
        </div>

        <label className="space-y-1">
          <div className="text-sm">연락 관련 추가로 알려주고 싶은 것(선택)</div>
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={form.preferredContactDetail}
            onChange={(e) => update("preferredContactDetail", e.target.value)}
            placeholder="예) 저녁 7시 이후가 편해요 / 전화보다 문자 선호 등"
          />
        </label>
      </section>

      {/* 분위기/활동 */}
      <section className="rounded-2xl border bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">1. 우리 반/선생님에 대해</h2>

        <label className="space-y-1">
          <div className="text-sm">새 담임 선생님의 첫인상(솔직)</div>
          <textarea
            className="w-full rounded-xl border px-3 py-2 min-h-[90px]"
            value={form.firstImpression}
            onChange={(e) => update("firstImpression", e.target.value)}
            placeholder="편하게 써줘 🙂"
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm">올해 꼭 한 번 해보고 싶은 학급 활동</div>
          <textarea
            className="w-full rounded-xl border px-3 py-2 min-h-[90px]"
            value={form.wantClassActivity}
            onChange={(e) => update("wantClassActivity", e.target.value)}
            placeholder="예) 체육대회/보드게임/봉사/영화토론/학급여행 등"
          />
        </label>
      </section>

      {/* 과목 */}
      <section className="rounded-2xl border bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">2. 과목</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm">좋아하는 과목</div>
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={form.likeSubject}
              onChange={(e) => update("likeSubject", e.target.value)}
              placeholder="과목"
            />
          </label>
          <label className="space-y-1">
            <div className="text-sm">이유(간단히)</div>
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={form.likeReason}
              onChange={(e) => update("likeReason", e.target.value)}
              placeholder="예) 성취감/흥미/선생님 스타일 등"
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm">싫어하는 과목</div>
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={form.dislikeSubject}
              onChange={(e) => update("dislikeSubject", e.target.value)}
              placeholder="과목"
            />
          </label>
          <label className="space-y-1">
            <div className="text-sm">이유(간단히)</div>
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={form.dislikeReason}
              onChange={(e) => update("dislikeReason", e.target.value)}
              placeholder="예) 어렵다/지루하다/부담된다 등"
            />
          </label>
        </div>
      </section>

      {/* 학습/태도 */}
      <section className="rounded-2xl border bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">3. 수업/학습 스타일</h2>

        <label className="space-y-1">
          <div className="text-sm">취미/특기/요즘 관심 있는 것</div>
          <textarea
            className="w-full rounded-xl border px-3 py-2 min-h-[90px]"
            value={form.hobby}
            onChange={(e) => update("hobby", e.target.value)}
            placeholder="편하게 써줘!"
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm">평소 발표는 어떻게 하나요?</div>
          <select
            className="w-full rounded-xl border px-3 py-2"
            value={form.presentationStyle}
            onChange={(e) => update("presentationStyle", e.target.value)}
          >
            <option value="">선택</option>
            <option>① 궁금하거나 할 말 있으면 언제든지 한다</option>
            <option>② 손드는 게 부끄러워 말 못하는 편이다</option>
            <option>③ 발표에 관심이 없다</option>
            <option>④ 시키면 하는 편이다</option>
            <option>⑤ 시켜도 못 하는 편이다</option>
            <option>⑥ 기타</option>
          </select>
        </label>

        <label className="space-y-1">
          <div className="text-sm">모르는 것이 있으면 주로 어떻게 하나요?</div>
          <select
            className="w-full rounded-xl border px-3 py-2"
            value={form.learningHelpStyle}
            onChange={(e) => update("learningHelpStyle", e.target.value)}
          >
            <option value="">선택</option>
            <option>① 선생님께 묻는다</option>
            <option>② 친구한테 묻는다</option>
            <option>③ 부모님께 묻는다</option>
            <option>④ 귀찮아서 넘어간다</option>
            <option>⑤ 부끄러워서 묻지 못한다</option>
            <option>⑥ 인터넷이나 책에서 찾는다</option>
            <option>⑦ 기타</option>
          </select>
        </label>
      </section>

      {/* 가정/관계 */}
      <section className="rounded-2xl border bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">4. 관계/가정</h2>

        <label className="space-y-1">
          <div className="text-sm">집에서 부모님은 나에게 어떻게 하나요?</div>
          <select
            className="w-full rounded-xl border px-3 py-2"
            value={form.parentsStyle}
            onChange={(e) => update("parentsStyle", e.target.value)}
          >
            <option value="">선택</option>
            <option>① 무엇이든 꼼꼼히 살피고 챙겨보신다</option>
            <option>② 하고 싶은 대로 내버려두신다</option>
            <option>③ ‘공부해라’고 시키기만 하신다</option>
            <option>④ 화내고 못 할 때는 때리신다</option>
            <option>⑤ 바쁘셔서 관심을 쓸 겨를이 없다</option>
            <option>⑥ 기타</option>
          </select>
        </label>

        <label className="space-y-1">
          <div className="text-sm">부모님은 나에게 어떤 분인가요?</div>
          <textarea
            className="w-full rounded-xl border px-3 py-2 min-h-[90px]"
            value={form.parentsMeaning}
            onChange={(e) => update("parentsMeaning", e.target.value)}
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm">고민이 생기면 주로 누구와 의논하나요?</div>
          <select
            className="w-full rounded-xl border px-3 py-2"
            value={form.talkWith}
            onChange={(e) => update("talkWith", e.target.value)}
          >
            <option value="">선택</option>
            <option>① 부모님</option>
            <option>② 친구</option>
            <option>③ 아는 언니/오빠/형/누나</option>
            <option>④ 선생님</option>
            <option>⑤ 기타</option>
            <option>⑥ 없다</option>
          </select>
        </label>
      </section>

      {/* 자기이해 */}
      <section className="rounded-2xl border bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">5. 나에 대해</h2>

        <label className="space-y-1">
          <div className="text-sm">나의 장점 3가지</div>
          <textarea
            className="w-full rounded-xl border px-3 py-2 min-h-[90px]"
            value={form.strengths}
            onChange={(e) => update("strengths", e.target.value)}
            placeholder={"1)\n2)\n3)"}
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm">나의 단점 3가지</div>
          <textarea
            className="w-full rounded-xl border px-3 py-2 min-h-[90px]"
            value={form.weaknesses}
            onChange={(e) => update("weaknesses", e.target.value)}
            placeholder={"1)\n2)\n3)"}
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm">나를 표현하는 형용사 5가지</div>
          <textarea
            className="w-full rounded-xl border px-3 py-2 min-h-[90px]"
            value={form.adjectives}
            onChange={(e) => update("adjectives", e.target.value)}
            placeholder={"1)\n2)\n3)\n4)\n5)"}
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm">내가 되고 싶은 사람은 어떤 사람인가요?</div>
          <textarea
            className="w-full rounded-xl border px-3 py-2 min-h-[90px]"
            value={form.wantToBe}
            onChange={(e) => update("wantToBe", e.target.value)}
          />
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm">장래희망/관심 분야</div>
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={form.dream}
              onChange={(e) => update("dream", e.target.value)}
              placeholder="예) 심리학 / 외교 / 데이터과학 / 아직 고민 중"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm">올해 고치고 싶은 버릇</div>
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={form.habitToFix}
              onChange={(e) => update("habitToFix", e.target.value)}
              placeholder="예) 미루기 / 늦잠 / 말투 등"
            />
          </label>
        </div>
      </section>

      {/* 담임에게 */}
      <section className="rounded-2xl border bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">6. 선생님께</h2>

        <label className="space-y-1">
          <div className="text-sm">선생님께 드리고 싶은 말</div>
          <textarea
            className="w-full rounded-xl border px-3 py-2 min-h-[90px]"
            value={form.messageToTeacher}
            onChange={(e) => update("messageToTeacher", e.target.value)}
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm">
            교사가 꼭 알아야/알아줬으면 하는 사항, 요즘 최대 고민 (없으면 비워도 됨)
          </div>
          <textarea
            className="w-full rounded-xl border px-3 py-2 min-h-[110px]"
            value={form.teacherShouldKnow}
            onChange={(e) => update("teacherShouldKnow", e.target.value)}
          />
        </label>
      </section>

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-600">
          * 학번/이름만 필수. 나머지는 편한 만큼 작성하면 돼.
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-full bg-black px-5 py-2 text-sm text-white hover:opacity-90 disabled:opacity-40"
        >
          제출하기
        </button>
      </div>
    </form>
  );
}