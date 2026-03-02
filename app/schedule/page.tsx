type Item = {
  type: "수행평가" | "고사" | "학급일정";
  date: string; // YYYY-MM-DD
  title: string;
  subject?: string;
};

const items: Item[] = [
  { type: "학급일정", date: "2026-03-05", title: "학급 임원 선출" },
  { type: "수행평가", date: "2026-03-12", title: "영어 에세이 제출", subject: "영어" },
  { type: "고사", date: "2026-04-23", title: "중간고사" },
];

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border px-2 py-0.5 text-xs text-gray-700">
      {children}
    </span>
  );
}

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">일정/수행</h1>
        <p className="mt-1 text-sm text-gray-600">
          (지금은 예시 데이터야. 다음 단계에서 학생들이 직접 추가/수정하도록 만들 거야.)
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <div className="flex flex-wrap gap-2">
          <Badge>전체</Badge>
          <Badge>수행평가</Badge>
          <Badge>고사</Badge>
          <Badge>학급일정</Badge>
        </div>

        <div className="mt-4 divide-y">
          {items
            .slice()
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((it, idx) => (
              <div key={idx} className="py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{it.type}</Badge>
                  <span className="text-xs text-gray-500">{it.date}</span>
                  {it.subject && <Badge>{it.subject}</Badge>}
                </div>
                <div className="mt-2 font-semibold">{it.title}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}