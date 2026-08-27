"use client";

import { useState } from "react";
import SemesterTabs from "@/components/SemesterTabs";
import { CURRENT_SEMESTER, toKSTDateStr, type SemesterId } from "@/components/lib/semester";
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
  classroomBack: ["장지현", "정은지", "최인아", "전주하"],
};

const WEEKLY_NAMES_2ND = new Set([
  "장지현",
  "박우진",
  "현서정",
  "주보민",
  "이시원",
  "성연준",
  "최인아",
  "유다현",
  "전주하",
  "손정연",
  "강지우",
  "김하연",
  "양효승",
  "윤혜림",
  "이승지",
]);

// 우리반 학번 순서(components/lib/students.ts)대로 정렬한 주번 명단.
const WEEKLY_2ND = STUDENTS.filter((s) => WEEKLY_NAMES_2ND.has(s.name));

const SPECIAL_ZONE_NAMES_2ND = new Set(["김은솔", "김태현", "김혜민", "심지안", "이조은", "정은지"]);

// 우리반 학번 순서(components/lib/students.ts)대로 정렬한 특별구역 명단.
const SPECIAL_ZONES_2ND = STUDENTS.filter((s) => SPECIAL_ZONE_NAMES_2ND.has(s.name));

// 학번(예: 20201)의 마지막 두 자리가 본인 번호(1번)다. 앞자리 "202"는 2학년 2반을 뜻한다.
function classNo(studentNo: string): number {
  return parseInt(studentNo.slice(-2), 10);
}

const SUMMARY_2ND = {
  managers: ["장지현(회장)", "박우진(부회장)", "현서정(부회장)"],
  chalkboard: ["박민석", "송민주"],
  trash: ["이승지", "김하연", "윤혜림", "양효승"],
  specialZones: SPECIAL_ZONES_2ND,
  weekly: WEEKLY_2ND,
  weeklyTasks: ["교실 바닥 쓸기", "교실 바닥 닦기", "유리창이 많이 더러우면 한 번씩 닦기"],
};

// 2학기 주번 주간 일정. 이번 주에 이미 활동한 강지우·박우진부터 시작하고,
// 휴지통 비우기 담당 4명을 포함해 중간고사·기말고사 주를 제외하고 2명씩 순환 배정.
const WEEKLY_SCHEDULE_2ND: { start: string; end: string; pair: [string, string] }[] = [
  { start: "2026-08-24", end: "2026-08-28", pair: ["강지우", "박우진"] },
  { start: "2026-08-31", end: "2026-09-04", pair: ["김하연", "성연준"] },
  { start: "2026-09-07", end: "2026-09-11", pair: ["손정연", "양효승"] },
  { start: "2026-09-14", end: "2026-09-18", pair: ["유다현", "윤혜림"] },
  { start: "2026-09-21", end: "2026-09-25", pair: ["이승지", "이시원"] },
  { start: "2026-10-05", end: "2026-10-09", pair: ["장지현", "전주하"] },
  { start: "2026-10-12", end: "2026-10-16", pair: ["주보민", "최인아"] },
  { start: "2026-10-19", end: "2026-10-23", pair: ["현서정", "강지우"] },
  { start: "2026-10-26", end: "2026-10-30", pair: ["김하연", "박우진"] },
  { start: "2026-11-02", end: "2026-11-06", pair: ["성연준", "손정연"] },
  { start: "2026-11-09", end: "2026-11-13", pair: ["양효승", "유다현"] },
  { start: "2026-11-16", end: "2026-11-20", pair: ["윤혜림", "이승지"] },
  { start: "2026-11-23", end: "2026-11-27", pair: ["이시원", "장지현"] },
  { start: "2026-12-14", end: "2026-12-18", pair: ["전주하", "주보민"] },
  { start: "2026-12-21", end: "2026-12-25", pair: ["최인아", "현서정"] },
  { start: "2026-12-28", end: "2026-12-31", pair: ["강지우", "김하연"] },
];

function formatWeekRange(startIso: string, endIso: string): string {
  const [, sm, sd] = startIso.split("-");
  const [, em, ed] = endIso.split("-");
  return sm === em ? `${sm}/${sd} ~ ${ed}` : `${sm}/${sd} ~ ${em}/${ed}`;
}

type SummaryRow = { label: string; value: string; note: string };

const SUMMARY_ROWS_2ND: SummaryRow[] = [
  { label: "청소 총괄", value: "장지현, 박우진, 현서정", note: "회장/부회장" },
  { label: "칠판 담당", value: SUMMARY_2ND.chalkboard.join(", "), note: "주번 대신 매번 칠판 정리" },
  { label: "휴지통 비우기 담당", value: "이승지, 김하연, 윤혜림, 양효승", note: "주번 주간에는 제외, 나머지 3명이 쓰레기·재활용품 배출 및 휴지통 비우기" },
  {
    label: "특별구역",
    value: SUMMARY_2ND.specialZones.map((student) => `${classNo(student.no)}번 ${student.name}`).join(", "),
    note: "주번 대신 매번 특별구역 청소 · 6인",
  },
  {
    label: "주번",
    value: SUMMARY_2ND.weekly.map((student) => `${classNo(student.no)}번 ${student.name}`).join(", "),
    note: "교실 바닥 쓸기·닦기, 필요할 때 유리창 닦기 · 학번 순서대로 매주 순환",
  },
];

const SUMMARY_ROWS_1ST: SummaryRow[] = [
  { label: "청소 총괄", value: "주보민, 강지우, 이시원", note: "회장/부회장" },
  { label: "칠판 담당", value: "김은솔, 송민주, 심지안", note: "청소 제외" },
  { label: "휴지통 비우기 담당", value: "윤혜림, 이승지, 현서정, 박민석", note: "청소 제외" },
  { label: "특별구역", value: "김태현, 김혜민, 박우진, 손정연, 유다현, 이조은", note: "홀수 번호 중 6명" },
  { label: "교실 청소", value: "김하연, 성연준, 양효승, 장지현, 정은지, 최인아, 전주하", note: "월/목 쓸기·닦기 교대" },
];

function SummaryTable({ rows }: { rows: SummaryRow[] }) {
  return (
    <>
      {/* 태블릿·데스크톱: 표 */}
      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="w-28 rounded-l-2xl border-b px-4 py-3 text-sm font-semibold text-gray-700">
                구분
              </th>
              <th className="border-b px-4 py-3 text-sm font-semibold text-gray-700">담당</th>
              <th className="rounded-r-2xl border-b px-4 py-3 text-sm font-semibold text-gray-700">
                비고
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="align-top">
                <td className="whitespace-nowrap border-b px-4 py-4 text-sm font-semibold text-gray-900">{row.label}</td>
                <td className="border-b px-4 py-4 text-sm text-gray-800">{row.value}</td>
                <td className="border-b px-4 py-4 text-sm text-gray-700">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 휴대폰: 카드 목록 */}
      <div className="mt-4 flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <div key={row.label} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="text-sm font-bold text-gray-900">{row.label}</div>
            <div className="mt-1.5 text-sm text-gray-800">{row.value}</div>
            <div className="mt-1.5 text-xs text-gray-500">{row.note}</div>
          </div>
        ))}
      </div>
    </>
  );
}

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
            ? "칠판 담당과 특별구역 담당을 제외한 모든 학생이 주번에 참여해요. 휴지통 비우기 담당 학생이 주번인 주에는 쓰레기 버리기에서 빠지고, 나머지 3명이 쓰레기와 재활용품을 버리고 휴지통을 비워요."
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
          <div className="text-sm font-semibold text-amber-700">주번 대신 · 칠판 담당</div>
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
          <div className="text-sm font-semibold text-violet-700">휴지통 비우기 · 주번 참여</div>
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
          <h2 className="text-xl font-bold text-gray-900">주번 대신 · 특별구역 담당</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {s.specialZones.map((student) => (
            <span
              key={student.no}
              className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-gray-800"
            >
              {classNo(student.no)}번 {student.name}
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
          칠판·특별구역 담당을 제외한 {s.weekly.length}명이 매주 돌아가며 주번을 맡아요.
          휴지통 비우기 담당 학생도 주번에 참여하며, 주번인 주에는 나머지 3명이 쓰레기와 재활용품을 버리고 휴지통을 비워요.
        </p>

        <div className="mb-5 flex flex-wrap gap-2">
          {s.weekly.map((student) => (
            <span
              key={student.no}
              className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-gray-800"
            >
              {classNo(student.no)}번 {student.name}
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
        <div className="mb-2 flex items-center gap-2">
          <span className="text-2xl">🗓️</span>
          <h2 className="text-xl font-bold text-gray-900">주번 주간 일정표</h2>
        </div>
        <p className="mb-4 text-sm leading-6 text-gray-700">
          8/24(다음 주)부터 종업식(12/31) 전까지예요. 중간고사(9/28~10/2)·기말고사(12/2~12/8)
          주간은 빠졌어요.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="rounded-l-2xl border-b px-3 py-3 text-sm font-semibold text-gray-700 sm:px-4">
                  기간
                </th>
                <th className="rounded-r-2xl border-b px-3 py-3 text-sm font-semibold text-gray-700 sm:px-4">
                  담당
                </th>
              </tr>
            </thead>
            <tbody>
              {WEEKLY_SCHEDULE_2ND.map((week) => {
                const todayIso = toKSTDateStr();
                const isThisWeek = todayIso >= week.start && todayIso <= week.end;
                return (
                  <tr key={week.start} className={isThisWeek ? "bg-sky-50" : undefined}>
                    <td className="whitespace-nowrap border-b px-3 py-3 text-sm font-semibold text-gray-900 sm:px-4">
                      {formatWeekRange(week.start, week.end)}
                      {isThisWeek && (
                        <span className="ml-2 inline-block rounded-full bg-sky-500 px-2 py-0.5 text-xs font-bold text-white">
                          이번 주
                        </span>
                      )}
                    </td>
                    <td className="border-b px-3 py-3 text-sm text-gray-800 sm:px-4">
                      {week.pair
                        .map((name) => {
                          const student = STUDENTS.find((item) => item.name === name);
                          return student ? `${classNo(student.no)}번 ${name}` : name;
                        })
                        .join(", ")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">전체 역할 한눈에 보기</h2>
        <SummaryTable rows={SUMMARY_ROWS_2ND} />
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
          <div className="text-sm font-semibold text-violet-700">청소 제외 · 휴지통 비우기 담당</div>
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
        <SummaryTable rows={SUMMARY_ROWS_1ST} />
      </section>
    </>
  );
}
