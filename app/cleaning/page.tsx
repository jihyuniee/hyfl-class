"use client";

import { useState } from "react";
import SemesterTabs from "@/components/SemesterTabs";
import { CURRENT_SEMESTER, type SemesterId } from "@/components/lib/semester";
import { STUDENTS } from "@/components/lib/students";

const SUMMARY_1ST = {
  managers: ["주보민(회장)", "강지우(부회장)", "이시원(부회장)"],
  excluded: {
    chalkboard: ["김은솔", "송민주", "심지안"],
    trash: ["윤혜림", "이승지", "현서정", "박민석"],
  },
  specialZones: [
    { zone: "AI교실", name: "김태현" },
    { zone: "AI교실", name: "김혜민" },
    { zone: "AI교실", name: "박우진" },
    { zone: "AI교실", name: "손정연" },
    { zone: "AI교실", name: "유다현" },
    { zone: "AI교실", name: "이조은" },
  ],
  classroomFront: ["김하연", "성연준", "양효승"],
  classroomBack: ["장지현", "정은지", "최안아", "전주하"],
};

const WEEKLY_NAMES_2ND = new Set([
  "장지현",
  "박우진",
  "현서정",
  "주보민",
  "이시원",
  "성연준",
  "최안아",
  "유다현",
  "전주하",
  "손정연",
  "강지우",
  "송민주",
]);

// 우리반 학번 순서(components/lib/students.ts)대로 정렬한 주번 명단.
const WEEKLY_2ND = STUDENTS.filter((s) => WEEKLY_NAMES_2ND.has(s.name));

const SUMMARY_2ND = {
  managers: ["장지현(회장)", "박우진(부회장)", "현서정(부회장)"],
  chalkboard: ["박민석"],
  trash: ["이승지", "김하연", "윤혜림", "양효승"],
  specialZones: ["김은솔", "김태현", "김혜민", "심지안", "이조은", "정은지"],
  weekly: WEEKLY_2ND,
  weeklyTasks: ["매일 아침 교실 빗자루로 쓸기", "교탁 닦기"],
};

export default function CleaningPage() {
  const [semester, setSemester] = useState<SemesterId>(CURRENT_SEMESTER);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <section className="rounded-[28px] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-8 shadow-sm">
        <div className="text-sm font-medium text-sky-600">2학년 2반 학급 운영</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          🧹 우리반 청소 역할표
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-700">
          {semester === CURRENT_SEMESTER
            ? "칠판 담당, 쓰레기 담당, 특별구역 담당을 제외한 나머지 학생은 주번으로 매주 순환하며 교실 청소를 맡아요."
            : "월요일, 목요일 청소 기준 역할표예요. 자료는 그대로 보존됩니다."}
        </p>
        <div className="mt-5">
          <SemesterTabs value={semester} onChange={setSemester} />
        </div>
      </section>

      {semester === CURRENT_SEMESTER ? <CleaningSecondSemester /> : <CleaningFirstSemester />}
    </div>
  );
}

function NameCard({ name }: { name: string }) {
  return (
    <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm">
      {name}
    </div>
  );
}

function CleaningSecondSemester() {
  const s = SUMMARY_2ND;

  return (
    <>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <div className="text-sm font-semibold text-rose-600">청소 총괄</div>
          <div className="mt-3 space-y-2">
            {s.managers.map((name) => (
              <NameCard key={name} name={name} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="text-sm font-semibold text-amber-700">청소 제외 · 칠판 담당</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {s.chalkboard.map((name) => (
              <span
                key={name}
                className="rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-800 shadow-sm"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
          <div className="text-sm font-semibold text-violet-700">청소 제외 · 쓰레기 담당</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {s.trash.map((name) => (
              <span
                key={name}
                className="rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-800 shadow-sm"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-2xl">🌿</span>
          <h2 className="text-xl font-bold text-gray-900">특별구역 담당 (청소 제외)</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {s.specialZones.map((name) => (
            <span
              key={name}
              className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-gray-800"
            >
              {name}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-2xl">🔁</span>
          <h2 className="text-xl font-bold text-gray-900">주번 (매주 순환)</h2>
        </div>
        <p className="mb-4 text-sm leading-6 text-gray-700">
          칠판·쓰레기·특별구역 담당을 제외한 나머지 {s.weekly.length}명이 학번 순서대로 아래
          순서대로 매주 돌아가며 주번을 맡아요.
        </p>

        <div className="mb-5 flex flex-wrap gap-2">
          {s.weekly.map((student, i) => (
            <span
              key={student.no}
              className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-gray-800"
            >
              {i + 1}. {student.name} ({student.no})
            </span>
          ))}
        </div>

        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
          <div className="mb-2 text-sm font-semibold text-sky-700">주번이 할 일</div>
          <ul className="list-inside list-disc space-y-1 text-sm text-gray-800">
            {s.weeklyTasks.map((task) => (
              <li key={task}>{task}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">전체 역할 한눈에 보기</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="rounded-l-2xl border-b px-4 py-3 text-sm font-semibold text-gray-700">
                  구분
                </th>
                <th className="border-b px-4 py-3 text-sm font-semibold text-gray-700">담당</th>
                <th className="rounded-r-2xl border-b px-4 py-3 text-sm font-semibold text-gray-700">
                  비고
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="align-top">
                <td className="border-b px-4 py-4 text-sm font-semibold text-gray-900">
                  청소 총괄
                </td>
                <td className="border-b px-4 py-4 text-sm text-gray-800">
                  장지현, 박우진, 현서정
                </td>
                <td className="border-b px-4 py-4 text-sm text-gray-700">회장/부회장</td>
              </tr>

              <tr className="align-top">
                <td className="border-b px-4 py-4 text-sm font-semibold text-gray-900">
                  칠판 담당
                </td>
                <td className="border-b px-4 py-4 text-sm text-gray-800">박민석</td>
                <td className="border-b px-4 py-4 text-sm text-gray-700">청소(주번) 제외</td>
              </tr>

              <tr className="align-top">
                <td className="border-b px-4 py-4 text-sm font-semibold text-gray-900">
                  쓰레기 담당
                </td>
                <td className="border-b px-4 py-4 text-sm text-gray-800">
                  이승지, 김하연, 윤혜림, 양효승
                </td>
                <td className="border-b px-4 py-4 text-sm text-gray-700">청소(주번) 제외</td>
              </tr>

              <tr className="align-top">
                <td className="border-b px-4 py-4 text-sm font-semibold text-gray-900">
                  특별구역
                </td>
                <td className="border-b px-4 py-4 text-sm text-gray-800">
                  김은솔, 김태현, 김혜민, 심지안, 이조은, 정은지
                </td>
                <td className="border-b px-4 py-4 text-sm text-gray-700">청소(주번) 제외 · 6인</td>
              </tr>

              <tr className="align-top">
                <td className="px-4 py-4 text-sm font-semibold text-gray-900">주번</td>
                <td className="px-4 py-4 text-sm text-gray-800">
                  {s.weekly.map((student) => `${student.name}(${student.no})`).join(", ")}
                </td>
                <td className="px-4 py-4 text-sm text-gray-700">
                  매일 아침 교실 빗자루로 쓸기 · 교탁 닦기, 학번 순서대로 매주 순환
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function CleaningFirstSemester() {
  const s = SUMMARY_1ST;

  return (
    <>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <div className="text-sm font-semibold text-rose-600">청소 총괄</div>
          <div className="mt-3 space-y-2">
            {s.managers.map((name) => (
              <NameCard key={name} name={name} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="text-sm font-semibold text-amber-700">청소 제외 · 칠판 담당</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {s.excluded.chalkboard.map((name) => (
              <span
                key={name}
                className="rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-800 shadow-sm"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
          <div className="text-sm font-semibold text-violet-700">청소 제외 · 쓰레기 담당</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {s.excluded.trash.map((name) => (
              <span
                key={name}
                className="rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-800 shadow-sm"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-2xl">🌿</span>
          <h2 className="text-xl font-bold text-gray-900">특별구역 담당</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {s.specialZones.map((item) => (
            <div key={item.name} className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <div className="text-sm font-semibold text-emerald-700">{item.zone}</div>
              <div className="mt-2 text-lg font-bold text-gray-900">{item.name}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">월요일 청소</h2>

          <div className="mt-5 space-y-5">
            <div>
              <div className="mb-2 text-sm font-semibold text-sky-700">교실 · 쓸기</div>
              <div className="flex flex-wrap gap-2">
                {s.classroomFront.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-gray-800"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-rose-700">교실 · 닦기</div>
              <div className="flex flex-wrap gap-2">
                {s.classroomBack.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-gray-800"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-emerald-700">특별구역</div>
              <div className="flex flex-wrap gap-2">
                {s.specialZones.map((item) => (
                  <span
                    key={item.name}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-gray-800"
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">목요일 청소</h2>

          <div className="mt-5 space-y-5">
            <div>
              <div className="mb-2 text-sm font-semibold text-sky-700">교실 · 닦기</div>
              <div className="flex flex-wrap gap-2">
                {s.classroomFront.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-gray-800"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-rose-700">교실 · 쓸기</div>
              <div className="flex flex-wrap gap-2">
                {s.classroomBack.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-gray-800"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-emerald-700">특별구역</div>
              <div className="flex flex-wrap gap-2">
                {s.specialZones.map((item) => (
                  <span
                    key={item.name}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-gray-800"
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">전체 역할 한눈에 보기</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="rounded-l-2xl border-b px-4 py-3 text-sm font-semibold text-gray-700">
                  구분
                </th>
                <th className="border-b px-4 py-3 text-sm font-semibold text-gray-700">담당</th>
                <th className="rounded-r-2xl border-b px-4 py-3 text-sm font-semibold text-gray-700">
                  비고
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="align-top">
                <td className="border-b px-4 py-4 text-sm font-semibold text-gray-900">
                  청소 총괄
                </td>
                <td className="border-b px-4 py-4 text-sm text-gray-800">
                  주보민, 강지우, 이시원
                </td>
                <td className="border-b px-4 py-4 text-sm text-gray-700">회장/부회장</td>
              </tr>

              <tr className="align-top">
                <td className="border-b px-4 py-4 text-sm font-semibold text-gray-900">
                  칠판 담당
                </td>
                <td className="border-b px-4 py-4 text-sm text-gray-800">
                  김은솔, 송민주, 심지안
                </td>
                <td className="border-b px-4 py-4 text-sm text-gray-700">청소 제외</td>
              </tr>

              <tr className="align-top">
                <td className="border-b px-4 py-4 text-sm font-semibold text-gray-900">
                  쓰레기 담당
                </td>
                <td className="border-b px-4 py-4 text-sm text-gray-800">
                  윤혜림, 이승지, 현서정, 박민석
                </td>
                <td className="border-b px-4 py-4 text-sm text-gray-700">청소 제외</td>
              </tr>

              <tr className="align-top">
                <td className="border-b px-4 py-4 text-sm font-semibold text-gray-900">
                  특별구역
                </td>
                <td className="border-b px-4 py-4 text-sm text-gray-800">
                  김태현, 김혜민, 박우진, 손정연, 유다현, 이조은
                </td>
                <td className="border-b px-4 py-4 text-sm text-gray-700">홀수 번호 중 6명</td>
              </tr>

              <tr className="align-top">
                <td className="px-4 py-4 text-sm font-semibold text-gray-900">교실 청소</td>
                <td className="px-4 py-4 text-sm text-gray-800">
                  김하연, 성연준, 양효승, 장지현, 정은지, 최안아, 전주하
                </td>
                <td className="px-4 py-4 text-sm text-gray-700">월/목 쓸기·닦기 교대</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
