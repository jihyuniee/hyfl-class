function dday(target: string) {
  const today = new Date();
  const t = new Date(target);
  today.setHours(0, 0, 0, 0);
  t.setHours(0, 0, 0, 0);
  const diff = Math.ceil((t.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="mb-2 text-sm font-semibold text-gray-700">{title}</h2>
      <div className="text-gray-900">{children}</div>
    </section>
  );
}

export default function Home() {
  // 날짜는 나중에 지현이 원하는 날짜로 바꾸면 돼
  const suneung = "2026-11-18"; // 예시
  const exam = "2026-04-29"; // 예시

  const suneungD = dday(suneung);
  const examD = dday(exam);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-br from-pink-50 via-purple-50 to-sky-50 p-6">
        <h1 className="text-2xl font-bold tracking-tight">2-2 우리반 페이지</h1>
        <p className="mt-2 text-sm text-gray-700">
          일정 • 수행평가 • 상담 • 우리반 약속을 한 곳에서.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="수능 D-day">
          <div className="text-3xl font-bold">D-{suneungD}</div>
          <div className="mt-1 text-xs text-gray-600">{suneung}</div>
        </Card>

        <Card title="고사 D-day">
          <div className="text-3xl font-bold">D-{examD}</div>
          <div className="mt-1 text-xs text-gray-600">{exam}</div>
        </Card>

        <Card title="오늘 체크">
          <ul className="list-disc pl-5 text-sm text-gray-700">
            <li>수행평가 마감 확인</li>
            <li>제출/지각/결석 공지 확인</li>
            <li>상담 신청 필요하면 클릭</li>
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="최근 공지">
          <div className="text-sm text-gray-700">
            - 개학 준비물 안내<br />
            - 자리 배치 공지<br />
            - 수행평가 안내(예시)
          </div>
        </Card>

        <Card title="빠른 이동">
          <div className="flex flex-wrap gap-2">
            <a className="rounded-full border px-3 py-1 text-sm" href="/schedule">
              일정/수행
            </a>
            <a className="rounded-full border px-3 py-1 text-sm" href="/students">
              학생 소개
            </a>
            <a className="rounded-full border px-3 py-1 text-sm" href="/counseling">
              상담
            </a>
            <a className="rounded-full border px-3 py-1 text-sm" href="/rules">
              규칙
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}