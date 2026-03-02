"use client";

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="hy-card p-5">
      <h2 className="hy-title text-base font-semibold">{title}</h2>
      <div className="mt-3 text-sm leading-7 text-gray-800">{children}</div>
    </section>
  );
}

function Bullet({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="hy-chip">{children}</span>;
}

export default function NoticePage() {
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="hy-card p-6">
        <div className="text-sm text-gray-600">2026학년도 신학년 첫 주 안내</div>
        <h1 className="hy-title mt-1 text-2xl font-bold">2학년 2반 공지</h1>

        <div className="mt-4 flex flex-wrap gap-2">
          <Tag>복장</Tag>
          <Tag>전자기기</Tag>
          <Tag>출결</Tag>
          <Tag>상담</Tag>
          <Tag>야자/방과후</Tag>
        </div>

        <div className="hy-soft mt-5 rounded-2xl p-4">
          <div className="text-sm font-semibold">우리 반 슬로건</div>
          <div className="mt-1 text-lg font-bold">
            “지금부터 할 수 있는 것부터, 나부터.”
          </div>
        </div>
      </div>

      {/* 학생용 초간단 */}
      <Card title="학생용 초간단(딱 이것만 기억!)">
        <Bullet
          items={[
            "복장: 교복/생활복만 OK, 사복 X (체육복만 환복 가능)",
            "휴대폰: 조회 때 수거 → 교무실 보관",
            "디벗: 학습용 OK / 개인 패드 X (위반 시 3일 압수)",
            "출결: 결석/지각 사유와 증빙은 담임에게 빠르게 공유",
            "상담: 점심/방과후 가능, 특히 월요일 여유! 긴 상담은 예약 추천",
          ]}
        />
      </Card>

      {/* 생활/복장 */}
      <Card title="학생지원부: 복장 규정">
        <Bullet
          items={[
            "학교에서 정한 교복/생활복만 착용 가능",
            "사복 절대 금지",
            "체육복만 환복 가능",
            "겨울 외투는 교복/생활복 위에 1개 덧입기 가능",
          ]}
        />
      </Card>

      {/* 전자기기 */}
      <Card title="학생지원부: 전자기기 사용 규칙(전 학년 공통)">
        <Bullet
          items={[
            "휴대폰은 조회시간에 모두 수거 → 교무실 보관",
            "디벗은 학습용에 한해 전면 허용",
            "디벗 외 개인 패드 사용 금지",
            "수업 특성상 교사 권한으로 디벗 사용을 제한할 수 있음",
            "학습 외 사용/개인패드 사용 적발 시 3일 압수(수업일 기준)",
          ]}
        />
        <div className="mt-3 text-xs text-gray-600">
          ※ 압수 기간 동안 디벗 사용하는 수업에서의 불이익은 본인이 감수
        </div>
      </Card>


      {/* 등교지도 */}
      <Card title="등교지도(담임 지도 시간)">
        <Bullet items={["담임 등교지도: 7:20 ~ 7:35"]} />
      </Card>

      {/* 학폭 */}
      <Card title="학폭/교육활동 침해">
        <Bullet items={["사안 발생 시 즉시 학생지원부(학지부장/담당 선생님)에게 알리기"]} />
      </Card>

      {/* 야자/방과후 */}
      <Card title="야자/방과후(요약)">
        <Bullet
          items={[
            "야자 쉬는 시간 10분(20:10~20:20)",
            "야자 QR 출석 체크 필수",
            "야자 시작일: 3/16(월)",
            "방과후: 월/수/목 운영(세부는 추후 공지)",
          ]}
        />
      </Card>
      <Card title="국제연구부: 2026 학교 프로그램(요약)">
  <div className="text-sm font-semibold text-gray-900">교양교육</div>
  <Bullet
    items={[
      "고전깊이읽기: 학기별 6차시(+2학기 북토크)",
      "운영 시간: 1학년 월 4-5교시 / 2학년 월 5-6교시",
      "주의: 해당 시간에는 자습/상담/보강/학급자율활동 운영 금지",
      "도서관 과거제: 5/21(목) 진행(주제도서 안내 → 예선(객관식) → 본선(논술))",
      "청람관 운영시간: 7:40~8:00(대여불가), 12:00~13:10",
    ]}
  />

  <div className="mt-4 text-sm font-semibold text-gray-900">학교특색 프로그램</div>
  <Bullet
    items={[
      "영문학세미나: 인문·어학·국제 계열 희망자",
      "교내경영자과정: 경제·경영·상경 계열 희망자(수학 실력 필요)",
      "고전기반현대사회연구: 희망 진로 관련 심화 탐구 가능",
    ]}
  />

  <div className="mt-4 text-sm font-semibold text-gray-900">교과특색 프로그램(예시)</div>
  <Bullet
    items={[
      "매쓰커넥트(수학) / 역사네컷(역사) / 법원에 가다(일반사회) / 지리인사이트(지리) / 전공문화학술제(전공어)",
      "국제교류: 국제공동수업(일본어과) — 과세특 연계",
      "교육청 지원사업: 생각을 쓰는 교실, 지역연계 교육과정",
    ]}
  />
</Card>

      <div className="hy-card p-4 text-sm text-gray-700">
        <div className="font-semibold">마지막 한마디</div>
        <div className="mt-1">
          모르는 건 질문해도 괜찮아. 대신, 규칙은 함께 지키자! 🙂
        </div>
      </div>
    </div>
  );
}