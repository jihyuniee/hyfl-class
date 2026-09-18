"use client";

import { useEffect, useMemo, useState } from "react";

type AdmissionRow = {
  r: string;
  u: string;
  a: string;
  g: string;
  t: string;
  c: string;
  d: string;
  l: string;
  q: number;
  o: number;
  s: number;
  p: number;
};

type TabKey = "score" | "search" | "plan" | "minimum" | "saved" | "guide";

type AdmissionManifest = {
  total: number;
  universities: number;
  files: string[];
};

type Admission2028Record = {
  id: string;
  university: string;
  category: "학생부교과" | "학생부종합" | "논술";
  admission: string;
  method: string;
  minimum: string;
  notes: string;
  page: number;
  fields: string[];
  hasMinimum: boolean;
  hasInterview: boolean;
};

type Admission2028Data = {
  source: string;
  updated: string;
  notice: string;
  records: Admission2028Record[];
};

const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: "score", label: "점수로 찾기", emoji: "📊" },
  { key: "search", label: "대학·학과 찾기", emoji: "🔎" },
  { key: "plan", label: "2028 학종 검색", emoji: "🧭" },
  { key: "minimum", label: "최저 맞추기", emoji: "🎯" },
  { key: "saved", label: "관심 목록", emoji: "♡" },
  { key: "guide", label: "학종 준비", emoji: "📚" },
];

const REGIONS = [
  "전체", "서울", "경기", "인천", "강원", "대전", "충남", "충북",
  "광주", "전남", "전북", "대구", "경북", "부산", "울산", "경남", "제주",
];

const TRACKS = ["전체", "인문", "자연", "공통"];

// 진학 상담에서 흔히 사용하는 인서울 대학군 순서입니다.
// 공식 대학 서열이 아니라 결과 탐색용 우선순위이며, 같은 대학 안에서는
// 이투스 지원 참고점수가 높은 모집단위를 먼저 보여 줍니다.
const SEOUL_UNIVERSITY_ORDER = [
  "서울대", "연세대", "고려대",
  "서강대", "성균관대", "한양대",
  "중앙대", "경희대", "한국외대", "서울시립대", "이화여대", "서울교대",
  "건국대", "동국대", "홍익대", "숙명여대",
  "국민대", "숭실대", "세종대", "서울과학기술대", "광운대",
  "성신여대", "서울여대", "덕성여대", "동덕여대",
  "명지대", "상명대", "가톨릭대", "한성대", "서경대", "삼육대",
  "성공회대", "한국성서대", "강서대", "감리교신대", "장로회신대",
  "서울기독대", "서울한영대", "추계예대",
] as const;

const SEOUL_UNIVERSITY_RANK = new Map<string, number>(
  SEOUL_UNIVERSITY_ORDER.map((university, index) => [university, index])
);

const FIELDS = ["전체", "인문·어문", "사회·상경", "교육", "자연·공학", "의약", "예체능"];
const PLAN_CATEGORIES = ["학생부종합", "논술", "학생부교과", "전체"];

const PLAN_CATEGORY_ORDER = new Map([
  ["학생부종합", 0],
  ["논술", 1],
  ["학생부교과", 2],
]);

const FIELD_GUIDES: Record<string, { icon: string; title: string; focus: string[]; minimum: string }> = {
  "인문·어문": {
    icon: "🌏",
    title: "인문·어문 계열 준비",
    focus: ["국어·영어 성취를 기본 축으로 관리", "전공어·사회 과목의 세특을 관심 주제와 연결", "읽기·쓰기·토론 결과를 탐구 과정으로 남기기"],
    minimum: "국어·영어 중 안정적인 한 영역을 만들고, 수학 또는 탐구를 두 번째 충족 영역으로 준비해요.",
  },
  "사회·상경": {
    icon: "📈",
    title: "사회·상경 계열 준비",
    focus: ["사회 현상을 자료와 근거로 분석", "경영·경제는 수학 성취와 데이터 해석도 점검", "시사 이슈를 전공 질문으로 바꾸어 탐구"],
    minimum: "국어·영어만 보지 말고 수학 필수 조건이 있는지 먼저 확인한 뒤 2~3개 강점 영역을 정해요.",
  },
  교육: {
    icon: "🧑‍🏫",
    title: "교육 계열 준비",
    focus: ["교과 성취와 출결을 균형 있게 관리", "교육 문제에 대한 탐구와 실제 협업 경험 정리", "면접에서 지원 동기와 교직 적성을 구체화"],
    minimum: "교대·사범대는 면접과 한국사 조건이 함께 붙는 경우가 있어 영역 합과 별도 조건을 같이 관리해요.",
  },
  "자연·공학": {
    icon: "🧪",
    title: "자연·공학 계열 준비",
    focus: ["수학·과학 선택과목과 성취를 우선 점검", "실험·설계·코딩 과정에서 문제 해결 근거 남기기", "지원 전공과 선택과목의 연결성 확인"],
    minimum: "수학 포함 조건이 자주 등장하므로 수학을 우선 안정시키고 과탐 1~2과목 반영 방식을 확인해요.",
  },
  의약: {
    icon: "🩺",
    title: "의약 계열 준비",
    focus: ["수학·과학 상위 성취를 꾸준히 유지", "생명·화학 탐구를 윤리와 공동체 관점까지 확장", "다중미니면접·인성면접 가능성까지 대비"],
    minimum: "3합4~5, 4합5처럼 강한 최저가 많아요. 수학 포함 여부, 탐구 2과목 평균, 영어·한국사 별도 조건을 반드시 확인해요.",
  },
  예체능: {
    icon: "🎨",
    title: "예체능 계열 준비",
    focus: ["실기·작품·활동 준비와 교과 관리를 병행", "대학별 실기 종목과 반영 비율을 일찍 확인", "비실기 전형은 면접·서류 평가 요소 점검"],
    minimum: "최저 미적용 전형도 있지만 일부 대학은 1개 영역 3등급처럼 별도 기준을 두므로 전형별로 확인해요.",
  },
};

const GUIDE_CARDS = [
  {
    title: "학생부종합",
    color: "#7c3aed",
    bg: "#f5f3ff",
    summary: "한영외고 학생이 가장 먼저 살펴볼 전형",
    checks: ["지원 학과와 과목 선택·세특의 연결", "활동의 개수보다 동기·과정·배운 점", "서류형·면접형과 수능최저 여부"],
  },
  {
    title: "논술",
    color: "#db2777",
    bg: "#fdf2f8",
    summary: "대학별 논술고사 성적의 비중이 큰 전형",
    checks: ["인문논술·수리논술 등 출제 유형", "수능 최저학력기준", "기출문제와 시험 일정"],
  },
  {
    title: "정시",
    color: "#059669",
    bg: "#ecfdf5",
    summary: "수능 성적을 중심으로 선발하는 전형",
    checks: ["표준점수·백분위·변환표준점수 중 반영 방식", "영역별 반영 비율과 가산점", "가·나·다군 모집단위"],
  },
  {
    title: "학생부교과 · 참고용",
    color: "#64748b",
    bg: "#f8fafc",
    summary: "한영외고에서는 기본 추천하지 않는 전형",
    checks: ["학교장추천·고교유형 등 지원자격부터 확인", "교과 정량평가가 외고 교육과정에 유리한지 상담", "지원 가능하더라도 대학별 환산 방식 확인"],
  },
];

const HOLISTIC_STEPS = [
  {
    number: "01",
    title: "과목 선택",
    text: "관심 전공에 필요한 과목을 고르고, 학교 개설 여건이나 진로 변경으로 못 들은 과목은 그 맥락까지 설명할 수 있게 정리해요.",
  },
  {
    number: "02",
    title: "세특·탐구",
    text: "무엇을 했는지만 나열하지 말고 동기 → 자료와 방법 → 시행착오와 수정 → 배운 점 → 다음 질문이 드러나게 남겨요.",
  },
  {
    number: "03",
    title: "면접",
    text: "학생부의 모든 기록을 자기 말로 설명하고, 대학에 따라 제시문·토론·심층 문제해결형 질문도 함께 연습해요.",
  },
  {
    number: "04",
    title: "최저·공동체",
    text: "학종도 수능최저와 응시영역 조건을 확인하고, 협업에서 맡은 역할·갈등 해결·기여를 구체적인 장면으로 준비해요.",
  },
];

const HOLISTIC_SPOTLIGHTS = [
  {
    university: "서울대",
    admission: "일반전형",
    method: "1단계 서류 100%(2배수) → 2단계 서류 50% + 면접 50%",
    minimum: "수능최저 없음",
    note: "지역균형은 일반고만 지원할 수 있어 외고 학생은 일반전형을 중심으로 확인해요. 면접에는 추가 탐침 질문이 도입됩니다.",
    page: 3,
  },
  {
    university: "연세대",
    admission: "종합인재형 · 2028 신설",
    method: "1단계 서류 100%(4배수) → 2단계 서류 70% + 면접 30%",
    minimum: "일부 모집단위 적용",
    note: "국제인재형과 중복 지원할 수 없어요. 모집단위별 최저 조합과 제시문 기반 면접을 함께 확인해야 합니다.",
    page: 7,
  },
  {
    university: "고려대",
    admission: "학업우수형 · 계열적합형",
    method: "학업우수형은 서류 80% + 면접 20%, 계열적합형은 2028 면접 폐지 후 서류 100%",
    minimum: "학업우수형 있음 · 계열적합형 없음",
    note: "두 전형의 면접과 최저 차이가 커서 학생부 강점과 수능 준비도를 기준으로 나누어 봐야 해요.",
    page: 11,
  },
  {
    university: "서강대",
    admission: "일반Ⅰ · 일반Ⅱ",
    method: "두 전형 모두 서류평가 100%",
    minimum: "일반Ⅰ 없음 · 일반Ⅱ 있음",
    note: "일반Ⅱ는 국어·수학·영어·탐구(1) 중 3개 합 7 이내와 한국사 4등급 이내를 확인해요.",
    page: 14,
  },
  {
    university: "성균관대",
    admission: "서류형 · 면접형",
    method: "서류형은 학생부 100%, 면접형은 1단계 학생부 100% → 2단계 학생부 70% + 면접 30%",
    minimum: "전형별 적용 여부 다름",
    note: "융합인재·탐구인재·성균인재 등 전형별 모집단위와 최저가 달라 전형명을 정확히 확인해야 해요.",
    page: 17,
  },
  {
    university: "한양대",
    admission: "학업형 · 면접형",
    method: "학업형은 학생부종합평가 100%, 면접형은 1단계 종합평가 100% → 2단계 70% + 면접 30%",
    minimum: "학업형 적용 · 면접형은 일부 예외 외 없음",
    note: "면접형 모집단위가 확대됐어요. 지원 학과가 학업형과 면접형 중 어디에 속하는지 먼저 확인해요.",
    page: 21,
  },
  {
    university: "이화여대",
    admission: "미래인재 서류형 · 면접형",
    method: "서류형은 서류 100%, 면접형은 1단계 서류 100%(4배수) → 2단계 서류 70% + 면접 30%",
    minimum: "서류형 있음 · 면접형 없음",
    note: "같은 미래인재전형도 유형에 따라 최저와 면접이 갈리므로 자신의 수능·말하기 강점에 맞춰 비교해요.",
    page: 25,
  },
  {
    university: "한국외대",
    admission: "면접형 · 서류형",
    method: "면접형은 1단계 서류 100%(3배수) → 2단계 1단계 성적 50% + 면접 50%, 서류형은 서류 100%",
    minimum: "면접형 없음 · 서류형 모집단위별 적용",
    note: "면접형은 제출서류 기반 블라인드 인적성면접이에요. 서류형 최저는 모집단위별 합 6~7 이내로 달라집니다.",
    page: 36,
  },
];

function rowKey(row: AdmissionRow) {
  return [row.u, row.d, row.a, row.g, row.t, row.r].join("|");
}

function numberText(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function universitySortBucket(row: AdmissionRow) {
  const seoulRank = row.r === "서울" ? SEOUL_UNIVERSITY_RANK.get(row.u) : undefined;
  if (seoulRank != null) return seoulRank;
  if (row.r === "서울") return SEOUL_UNIVERSITY_ORDER.length + 1;
  if (row.r === "경기" || row.r === "인천") return 1000;
  return 2000;
}

function compareAdmissionRows(
  a: AdmissionRow,
  b: AdmissionRow,
  universityPeaks: Map<string, { standard: number; percentile: number }>
) {
  const bucketDifference = universitySortBucket(a) - universitySortBucket(b);
  if (bucketDifference !== 0) return bucketDifference;

  if (a.u !== b.u) {
    const aPeak = universityPeaks.get(a.u) ?? { standard: 0, percentile: 0 };
    const bPeak = universityPeaks.get(b.u) ?? { standard: 0, percentile: 0 };
    return bPeak.standard - aPeak.standard
      || bPeak.percentile - aPeak.percentile
      || a.u.localeCompare(b.u, "ko");
  }

  return b.s - a.s || b.p - a.p || a.d.localeCompare(b.d, "ko");
}

function comparePlanRecords(a: Admission2028Record, b: Admission2028Record) {
  const aRank = SEOUL_UNIVERSITY_RANK.get(a.university) ?? 2000;
  const bRank = SEOUL_UNIVERSITY_RANK.get(b.university) ?? 2000;
  return aRank - bRank
    || (PLAN_CATEGORY_ORDER.get(a.category) ?? 9) - (PLAN_CATEGORY_ORDER.get(b.category) ?? 9)
    || a.university.localeCompare(b.university, "ko")
    || a.admission.localeCompare(b.admission, "ko");
}

function ScoreCalculator({
  onApply,
}: {
  onApply: (standard: number, percentile: number) => void;
}) {
  const [scores, setScores] = useState<Record<string, string>>({
    ks: "", ms: "", ss: "", ns: "",
    kp: "", mp: "", sp: "", np: "",
  });

  const fields = [
    { key: "k", label: "국어" },
    { key: "m", label: "수학" },
    { key: "s", label: "통합사회" },
    { key: "n", label: "통합과학" },
  ];

  const apply = () => {
    const values = Object.fromEntries(
      Object.entries(scores).map(([key, value]) => [key, Number(value)])
    ) as Record<string, number>;
    if (Object.values(values).some((value) => !Number.isFinite(value))) {
      alert("8개 과목 점수를 모두 입력해 주세요.");
      return;
    }
    const standard = values.ks + values.ms + values.ss + values.ns;
    const percentile = values.kp + values.mp + (values.sp + values.np) / 2;
    onApply(standard, percentile);
  };

  return (
    <details className="ad-calculator">
      <summary>합계 계산이 어렵다면 과목별로 입력하기</summary>
      <div className="ad-calculator-body">
        <div className="ad-calc-table">
          <div className="ad-calc-head">과목</div>
          <div className="ad-calc-head">표준점수</div>
          <div className="ad-calc-head">백분위</div>
          {fields.map((field) => (
            <div className="ad-calc-row" key={field.key}>
              <label>{field.label}</label>
              <input
                type="number"
                inputMode="decimal"
                value={scores[`${field.key}s`]}
                onChange={(event) => setScores((current) => ({
                  ...current,
                  [`${field.key}s`]: event.target.value,
                }))}
                aria-label={`${field.label} 표준점수`}
              />
              <input
                type="number"
                inputMode="decimal"
                value={scores[`${field.key}p`]}
                onChange={(event) => setScores((current) => ({
                  ...current,
                  [`${field.key}p`]: event.target.value,
                }))}
                aria-label={`${field.label} 백분위`}
              />
            </div>
          ))}
        </div>
        <button type="button" className="hy-btn hy-btn-primary" onClick={apply}>
          합계 계산해서 적용
        </button>
        <p className="ad-help">
          표준점수는 네 과목을 모두 더하고, 백분위는 국어 + 수학 + 두 탐구 백분위의 평균으로 계산합니다.
        </p>
      </div>
    </details>
  );
}

function Filters({
  region,
  track,
  onRegion,
  onTrack,
}: {
  region: string;
  track: string;
  onRegion: (value: string) => void;
  onTrack: (value: string) => void;
}) {
  return (
    <div className="ad-filters">
      <label>
        <span>지역</span>
        <select value={region} onChange={(event) => onRegion(event.target.value)}>
          {REGIONS.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label>
        <span>계열</span>
        <select value={track} onChange={(event) => onTrack(event.target.value)}>
          {TRACKS.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
    </div>
  );
}

function ResultCard({
  row,
  favorite,
  onToggle,
  studentStandard,
  studentPercentile,
}: {
  row: AdmissionRow;
  favorite: boolean;
  onToggle: () => void;
  studentStandard?: number;
  studentPercentile?: number;
}) {
  const hasStudentScore = studentStandard != null && studentPercentile != null;

  return (
    <article className="ad-result-card">
      <div className="ad-result-main">
        <div className="ad-result-top">
          <div>
            <div className="ad-chips">
              <span>{row.r}</span>
              <span>{row.t}</span>
              <span>{row.g}군</span>
              {row.c && <span>{row.c}</span>}
            </div>
            <h3>{row.u}</h3>
            <p className="ad-department">{row.d}</p>
          </div>
          <button
            type="button"
            className={`ad-heart ${favorite ? "is-saved" : ""}`}
            onClick={onToggle}
            aria-label={favorite ? "관심 목록에서 삭제" : "관심 목록에 저장"}
            title={favorite ? "관심 목록에서 삭제" : "관심 목록에 저장"}
          >
            {favorite ? "♥" : "♡"}
          </button>
        </div>
        <p className="ad-meta">
          {row.a} · 모집인원 {row.q}명
        </p>
      </div>
      <div className="ad-cutline">
        <p>지원 참고 점수</p>
        <div>
          <span><b>{numberText(row.s)}</b> 표준</span>
          <span><b>{numberText(row.p)}</b> 백분위</span>
        </div>
        {hasStudentScore && (
          <small>
            내 점수 여유: 표준 +{numberText(studentStandard - row.s)} · 백분위 +{numberText(studentPercentile - row.p)}
          </small>
        )}
      </div>
    </article>
  );
}

function ResultList({
  rows,
  favorites,
  onToggle,
  visibleCount,
  onMore,
  emptyText,
  studentStandard,
  studentPercentile,
}: {
  rows: AdmissionRow[];
  favorites: Set<string>;
  onToggle: (row: AdmissionRow) => void;
  visibleCount: number;
  onMore: () => void;
  emptyText: string;
  studentStandard?: number;
  studentPercentile?: number;
}) {
  if (rows.length === 0) {
    return (
      <div className="ad-empty">
        <span>🔎</span>
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <>
      <div className="ad-results">
        {rows.slice(0, visibleCount).map((row, index) => (
          <ResultCard
            key={`${rowKey(row)}-${index}`}
            row={row}
            favorite={favorites.has(rowKey(row))}
            onToggle={() => onToggle(row)}
            studentStandard={studentStandard}
            studentPercentile={studentPercentile}
          />
        ))}
      </div>
      {visibleCount < rows.length && (
        <button type="button" className="hy-btn ad-more" onClick={onMore}>
          더 보기 ({Math.min(visibleCount + 40, rows.length)} / {rows.length})
        </button>
      )}
    </>
  );
}

function preparationText(record: Admission2028Record) {
  if (record.category === "학생부교과") {
    return record.hasInterview
      ? `교과 성적 · 출결/추천 조건 · 면접 답변${record.hasMinimum ? " · 수능최저" : ""} 함께 준비`
      : `반영 교과 · 출결/추천 조건${record.hasMinimum ? " · 수능최저" : ""} 우선 확인`;
  }
  if (record.category === "학생부종합") {
    return record.hasInterview
      ? "과목 선택과 세특의 전공 연결 · 탐구 과정 · 학생부 기반 면접 준비"
      : "과목 선택과 세특의 전공 연결 · 탐구 동기와 과정이 보이는 학생부 준비";
  }
  return "대학별 논술 유형과 기출 풀이 · 시간 관리 · 수능최저를 병행";
}

function PlanCard({ record }: { record: Admission2028Record }) {
  const isCoursework = record.category === "학생부교과";
  return (
    <article className={`ad-plan-card${isCoursework ? " is-reference" : ""}`}>
      <div className="ad-plan-card-head">
        <div>
          <div className="ad-chips">
            <span>{record.category}</span>
            {isCoursework && <span className="ad-reference-chip">한영외고 참고용</span>}
            {record.hasInterview && <span>면접 있음</span>}
            <span>{record.hasMinimum ? "수능최저 있음" : "수능최저 없음"}</span>
          </div>
          <h3>{record.university}</h3>
          <p>{record.admission}</p>
        </div>
        <b className="ad-source-page">PDF {record.page}쪽</b>
      </div>

      <div className="ad-plan-fields">
        {record.fields.map((field) => <span key={field}>{field}</span>)}
      </div>

      <div className="ad-plan-detail-grid">
        <div>
          <b>전형 방법</b>
          <p>{record.method || "최종 모집요강 확인"}</p>
        </div>
        <div className={record.hasMinimum ? "has-minimum" : "no-minimum"}>
          <b>수능최저</b>
          <p>{record.minimum}</p>
        </div>
      </div>

      <div className="ad-plan-prepare">
        <span>준비 포인트</span>
        <p>{preparationText(record)}</p>
      </div>

      {isCoursework && (
        <div className="ad-plan-reference-note">
          학교장추천·고교유형·졸업연도 등 지원자격을 먼저 확인하고, 담임 선생님과 개별 상담한 뒤 검토하세요.
        </div>
      )}

      {record.notes && (
        <details className="ad-plan-notes">
          <summary>추천 인원·예외 조건·비고 보기</summary>
          <p>{record.notes}</p>
        </details>
      )}
    </article>
  );
}

type GradeKey = "korean" | "math" | "english" | "inquiry1" | "inquiry2" | "history";

function gradeCombinations(count: number, target: number) {
  const result: number[][] = [];
  const build = (items: number[], start: number, remaining: number) => {
    if (items.length === count) {
      if (remaining === 0) result.push(items);
      return;
    }
    for (let grade = start; grade <= 9; grade += 1) {
      if (grade > remaining) break;
      build([...items, grade], grade, remaining - grade);
    }
  };
  build([], 1, target);
  return result.slice(0, 8);
}

function MinimumPlanner() {
  const [grades, setGrades] = useState<Record<GradeKey, string>>({
    korean: "", math: "", english: "", inquiry1: "", inquiry2: "", history: "",
  });
  const [targetCount, setTargetCount] = useState(2);
  const [targetSum, setTargetSum] = useState(5);

  const gradeFields: { key: GradeKey; label: string; hint: string }[] = [
    { key: "korean", label: "국어", hint: "1~9" },
    { key: "math", label: "수학", hint: "1~9" },
    { key: "english", label: "영어", hint: "1~9" },
    { key: "inquiry1", label: "탐구 1", hint: "1~9" },
    { key: "inquiry2", label: "탐구 2", hint: "1~9" },
    { key: "history", label: "한국사", hint: "선택" },
  ];

  const parsed = Object.fromEntries(
    Object.entries(grades).map(([key, value]) => [key, Number(value)])
  ) as Record<GradeKey, number>;
  const validCore = [parsed.korean, parsed.math, parsed.english, parsed.inquiry1, parsed.inquiry2]
    .every((value) => Number.isInteger(value) && value >= 1 && value <= 9);

  const result = useMemo(() => {
    if (!validCore) return null;
    const inquiryBest = Math.min(parsed.inquiry1, parsed.inquiry2);
    const subjects = [
      { name: "국어", grade: parsed.korean },
      { name: "수학", grade: parsed.math },
      { name: "영어", grade: parsed.english },
      { name: "탐구(상위 1과목)", grade: inquiryBest },
    ].sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name, "ko"));
    const chosen = subjects.slice(0, targetCount);
    const currentSum = chosen.reduce((sum, subject) => sum + subject.grade, 0);
    let gap = Math.max(0, currentSum - targetSum);
    const improved = chosen.map((subject) => ({ ...subject, target: subject.grade }));
    for (const subject of [...improved].sort((a, b) => b.grade - a.grade)) {
      if (gap === 0) break;
      const change = Math.min(subject.grade - 1, gap);
      subject.target -= change;
      gap -= change;
    }
    return {
      chosen,
      currentSum,
      met: currentSum <= targetSum,
      improvement: currentSum - targetSum,
      plan: improved.filter((subject) => subject.target !== subject.grade),
      inquiryAverage: (parsed.inquiry1 + parsed.inquiry2) / 2,
    };
  }, [parsed.english, parsed.inquiry1, parsed.inquiry2, parsed.korean, parsed.math, targetCount, targetSum, validCore]);

  const presets = [
    [2, 5], [2, 6], [2, 7], [3, 6], [3, 7], [3, 8], [4, 8],
  ];
  const combinations = gradeCombinations(targetCount, targetSum);

  return (
    <>
      <div className="ad-min-layout">
        <div className="ad-min-input-card">
          <div className="ad-min-card-title">
            <span>1</span>
            <div><b>현재 예상 등급 입력</b><small>점수는 저장되지 않아요.</small></div>
          </div>
          <div className="ad-grade-grid">
            {gradeFields.map((field) => (
              <label key={field.key}>
                <span>{field.label}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="9"
                  placeholder={field.hint}
                  value={grades[field.key]}
                  onChange={(event) => setGrades((current) => ({ ...current, [field.key]: event.target.value }))}
                />
              </label>
            ))}
          </div>
          <p className="ad-help">탐구(1)는 두 과목 중 좋은 등급을 사용합니다. 탐구(2) 대학은 아래 평균값과 대학별 절사 방식을 따로 확인하세요.</p>
        </div>

        <div className="ad-min-target-card">
          <div className="ad-min-card-title">
            <span>2</span>
            <div><b>목표 최저 선택</b><small>예: 3개 영역 등급 합 7</small></div>
          </div>
          <div className="ad-min-presets">
            {presets.map(([count, sum]) => (
              <button
                type="button"
                key={`${count}-${sum}`}
                className={targetCount === count && targetSum === sum ? "is-active" : ""}
                onClick={() => { setTargetCount(count); setTargetSum(sum); }}
              >
                {count}합 {sum}
              </button>
            ))}
          </div>
          <div className="ad-min-custom">
            <label>
              <span>반영 영역 수</span>
              <select value={targetCount} onChange={(event) => setTargetCount(Number(event.target.value))}>
                <option value={2}>2개</option>
                <option value={3}>3개</option>
                <option value={4}>4개</option>
              </select>
            </label>
            <label>
              <span>목표 등급 합</span>
              <input type="number" min={targetCount} max={36} value={targetSum} onChange={(event) => setTargetSum(Number(event.target.value))} />
            </label>
          </div>
          <div className="ad-combination-list">
            <b>{targetCount}합 {targetSum} 조합 예시</b>
            <div>
              {combinations.length > 0
                ? combinations.map((combo) => <span key={combo.join("+")}>{combo.join(" + ")}</span>)
                : <small>가능한 등급 조합을 확인해 주세요.</small>}
            </div>
          </div>
        </div>
      </div>

      {!validCore ? (
        <div className="ad-min-empty">
          <span>✍️</span>
          <p>국어·수학·영어·탐구 2과목의 예상 등급을 모두 입력하면 준비 계획을 계산해요.</p>
        </div>
      ) : result && (
        <div className={`ad-min-result ${result.met ? "is-met" : "needs-work"}`}>
          <div className="ad-min-result-status">
            <span>{result.met ? "✓" : "!"}</span>
            <div>
              <p>현재 유리한 {targetCount}개 영역: {result.chosen.map((subject) => `${subject.name} ${subject.grade}`).join(" + ")}</p>
              <h3>
                합 {result.currentSum} · {result.met ? `${targetCount}합 ${targetSum} 충족 가능` : `${result.improvement}등급만큼 더 낮춰야 해요`}
              </h3>
            </div>
          </div>
          {!result.met && result.plan.length > 0 && (
            <div className="ad-min-action">
              <b>한 가지 개선 예시</b>
              <p>{result.plan.map((subject) => `${subject.name} ${subject.grade} → ${subject.target}등급`).join(" · ")}</p>
            </div>
          )}
          <div className="ad-min-extra">
            <span>탐구 2과목 단순 평균 <b>{numberText(result.inquiryAverage)}등급</b></span>
            <span>한국사 <b>{Number.isInteger(parsed.history) && parsed.history >= 1 && parsed.history <= 9 ? `${parsed.history}등급` : "미입력"}</b></span>
          </div>
        </div>
      )}

      <div className="ad-min-caution">
        <b>계산 결과를 이렇게 사용하세요</b>
        <p>위 결과는 국어·수학·영어·탐구(상위 1과목) 중 유리한 영역을 고르는 단순 계산입니다. 대학이 지정한 수학 포함, 국어 포함, 탐구 2과목 평균·절사, 영어·한국사 별도 등급, 모집단위별 예외는 자동 판정하지 않습니다. 반드시 ‘2028 전형 검색’ 카드와 대학 최종 모집요강을 함께 확인하세요.</p>
      </div>
    </>
  );
}

export default function AdmissionsPage() {
  const [rows, setRows] = useState<AdmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [planRows, setPlanRows] = useState<Admission2028Record[]>([]);
  const [planLoading, setPlanLoading] = useState(true);
  const [planError, setPlanError] = useState(false);
  const [tab, setTab] = useState<TabKey>("score");
  const [standardInput, setStandardInput] = useState("");
  const [percentileInput, setPercentileInput] = useState("");
  const [scoreSearched, setScoreSearched] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [region, setRegion] = useState("전체");
  const [track, setTrack] = useState("전체");
  const [visibleCount, setVisibleCount] = useState(40);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritesReady, setFavoritesReady] = useState(false);
  const [planField, setPlanField] = useState("전체");
  const [planCategory, setPlanCategory] = useState("학생부종합");
  const [planMinimum, setPlanMinimum] = useState("전체");
  const [planInterview, setPlanInterview] = useState("전체");
  const [planKeyword, setPlanKeyword] = useState("");
  const [planVisible, setPlanVisible] = useState(24);

  useEffect(() => {
    fetch("/admissions-data/manifest.json")
      .then((response) => {
        if (!response.ok) throw new Error("data load failed");
        return response.json();
      })
      .then((manifest: AdmissionManifest) => Promise.all(
        manifest.files.map((filename) => fetch(`/admissions-data/${filename}`).then((response) => {
          if (!response.ok) throw new Error("data chunk load failed");
          return response.json() as Promise<AdmissionRow[]>;
        }))
      ))
      .then((chunks) => setRows(chunks.flat()))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/admissions-2028/records.json")
      .then((response) => {
        if (!response.ok) throw new Error("2028 data load failed");
        return response.json() as Promise<Admission2028Data>;
      })
      .then((data) => setPlanRows(data.records))
      .catch(() => setPlanError(true))
      .finally(() => setPlanLoading(false));
  }, []);

  useEffect(() => {
    const readHash = () => {
      const value = window.location.hash.replace("#", "") as TabKey;
      if (TABS.some((item) => item.key === value)) setTab(value);
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("hyfl-admission-favorites") ?? "[]");
      if (Array.isArray(saved)) setFavorites(new Set(saved));
    } catch {
      setFavorites(new Set());
    } finally {
      setFavoritesReady(true);
    }
  }, []);

  useEffect(() => {
    if (!favoritesReady) return;
    localStorage.setItem("hyfl-admission-favorites", JSON.stringify([...favorites]));
  }, [favorites, favoritesReady]);

  useEffect(() => {
    setVisibleCount(40);
  }, [tab, keyword, region, track, standardInput, percentileInput]);

  useEffect(() => {
    setPlanVisible(24);
  }, [planField, planCategory, planMinimum, planInterview, planKeyword]);

  const studentStandard = Number(standardInput);
  const studentPercentile = Number(percentileInput);
  const validScore = Number.isFinite(studentStandard)
    && Number.isFinite(studentPercentile)
    && studentStandard > 0
    && studentStandard <= 440
    && studentPercentile > 0
    && studentPercentile <= 300;

  const filteredBase = useMemo(() => rows.filter((row) => (
    (region === "전체" || row.r === region)
    && (track === "전체" || row.t === track)
  )), [rows, region, track]);

  const universityPeaks = useMemo(() => {
    const peaks = new Map<string, { standard: number; percentile: number }>();
    rows.forEach((row) => {
      const current = peaks.get(row.u);
      if (!current || row.s > current.standard || (row.s === current.standard && row.p > current.percentile)) {
        peaks.set(row.u, { standard: row.s, percentile: row.p });
      }
    });
    return peaks;
  }, [rows]);

  const scoreResults = useMemo(() => {
    if (!scoreSearched || !validScore) return [];
    return filteredBase
      .filter((row) => row.s <= studentStandard && row.p <= studentPercentile)
      .sort((a, b) => compareAdmissionRows(a, b, universityPeaks));
  }, [filteredBase, scoreSearched, studentStandard, studentPercentile, universityPeaks, validScore]);

  const searchResults = useMemo(() => {
    const query = keyword.trim().toLocaleLowerCase("ko");
    if (!query) return [];
    return filteredBase
      .filter((row) => [row.u, row.d, row.c, row.a].some((value) => (
        value.toLocaleLowerCase("ko").includes(query)
      )))
      .sort((a, b) => compareAdmissionRows(a, b, universityPeaks));
  }, [filteredBase, keyword, universityPeaks]);

  const savedRows = useMemo(() => rows
    .filter((row) => favorites.has(rowKey(row)))
    .sort((a, b) => compareAdmissionRows(a, b, universityPeaks)),
  [rows, favorites, universityPeaks]);

  const planResults = useMemo(() => {
    const query = planKeyword.trim().toLocaleLowerCase("ko");
    return planRows
      .filter((record) => (
        (planField === "전체" || record.fields.includes(planField))
        && (planCategory === "전체" || record.category === planCategory)
        && (planMinimum === "전체" || (planMinimum === "있음" ? record.hasMinimum : !record.hasMinimum))
        && (planInterview === "전체" || (planInterview === "있음" ? record.hasInterview : !record.hasInterview))
        && (!query || [record.university, record.admission, record.method, record.minimum, record.notes]
          .some((value) => value.toLocaleLowerCase("ko").includes(query)))
      ))
      .sort(comparePlanRecords);
  }, [planRows, planField, planCategory, planMinimum, planInterview, planKeyword]);

  const toggleFavorite = (row: AdmissionRow) => {
    const key = rowKey(row);
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectTab = (nextTab: TabKey) => {
    setTab(nextTab);
    window.history.replaceState(null, "", `#${nextTab}`);
  };

  const searchByScore = () => {
    if (!validScore) {
      alert("표준점수 합계는 1~440, 백분위 합계는 1~300 사이로 입력해 주세요.");
      return;
    }
    setScoreSearched(true);
  };

  return (
    <div className="ad-page">
      <section className="hy-hero ad-hero">
        <div>
          <span className="ad-hero-tag">2026 한영외고 2-2</span>
          <h1>🎓 대학 입시 탐색</h1>
          <p>내 점수로 지원 가능 대학을 살펴보고, 관심 대학과 전형 정보를 한곳에서 확인해요.</p>
        </div>
        <div className="ad-hero-stat">
          <b>179</b>
          <span>대학</span>
          <i />
          <b>4,109</b>
          <span>모집단위</span>
        </div>
      </section>

      <div className="ad-warning">
        <span>📌</span>
        <p>
          점수 검색은 <b>이투스 2027학년도 9월 학력평가 지원참고표</b>, 2028 전형 검색은 <b>인천광역시교육청 프리뷰와 전북특별자치도교육청 시행계획 분석</b>을 바탕으로 만든 탐색 자료입니다.
          시행계획은 바뀔 수 있으며 실제 지원 전에는 반드시 대학 입학처의 최종 모집요강을 확인해야 합니다.
        </p>
      </div>

      <nav className="ad-tabs" aria-label="대학 입시 메뉴">
        {TABS.map((item) => (
          <button
            type="button"
            key={item.key}
            className={tab === item.key ? "is-active" : ""}
            onClick={() => selectTab(item.key)}
          >
            <span>{item.emoji}</span>
            {item.label}
            {item.key === "saved" && favorites.size > 0 && <b>{favorites.size}</b>}
          </button>
        ))}
      </nav>

      {loading && (
        <div className="ad-loading">
          <div />
          <p>대학 정보를 불러오고 있어요.</p>
        </div>
      )}

      {loadError && (
        <div className="ad-empty">
          <span>⚠️</span>
          <p>대학 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        </div>
      )}

      {!loading && !loadError && tab === "score" && (
        <section className="ad-section">
          <div className="ad-section-title">
            <div>
              <p>MY SCORE</p>
              <h2>내 점수로 지원 가능 대학 찾기</h2>
            </div>
            <span>입력한 점수는 저장되지 않아요 🔒</span>
          </div>

          <div className="ad-score-panel">
            <div className="ad-score-inputs">
              <label>
                <span>표준점수 합계</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="1"
                  max="440"
                  placeholder="예: 385"
                  value={standardInput}
                  onChange={(event) => {
                    setStandardInput(event.target.value);
                    setScoreSearched(false);
                  }}
                />
                <small>국어 + 수학 + 통합사회 + 통합과학</small>
              </label>
              <label>
                <span>백분위 합계</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="1"
                  max="300"
                  placeholder="예: 270"
                  value={percentileInput}
                  onChange={(event) => {
                    setPercentileInput(event.target.value);
                    setScoreSearched(false);
                  }}
                />
                <small>국어 + 수학 + 탐구 2과목 평균</small>
              </label>
              <button type="button" className="hy-btn hy-btn-primary ad-search-button" onClick={searchByScore}>
                지원 가능 대학 검색
              </button>
            </div>
            <ScoreCalculator onApply={(standard, percentile) => {
              setStandardInput(numberText(standard));
              setPercentileInput(numberText(percentile));
              setScoreSearched(false);
            }} />
          </div>

          {scoreSearched && validScore && (
            <>
              <div className="ad-result-header">
                <div>
                  <h3>검색 결과 <b>{scoreResults.length.toLocaleString()}개</b></h3>
                  <p>주요 인서울 대학을 우선 배치하고, 같은 대학에서는 지원 참고점수가 높은 모집단위부터 보여 줍니다.</p>
                </div>
                <Filters region={region} track={track} onRegion={setRegion} onTrack={setTrack} />
              </div>
              <ResultList
                rows={scoreResults}
                favorites={favorites}
                onToggle={toggleFavorite}
                visibleCount={visibleCount}
                onMore={() => setVisibleCount((count) => count + 40)}
                emptyText="두 점수를 모두 충족하는 모집단위가 없습니다. 점수 합계와 필터를 다시 확인해 주세요."
                studentStandard={studentStandard}
                studentPercentile={studentPercentile}
              />
            </>
          )}

          {!scoreSearched && (
            <div className="ad-tip-grid">
              <div><span>1</span><p><b>성적표 확인</b>과목별 표준점수와 백분위를 확인해요.</p></div>
              <div><span>2</span><p><b>합계 입력</b>직접 더하거나 과목별 계산 도움을 이용해요.</p></div>
              <div><span>3</span><p><b>결과 탐색</b>대학·학과를 살펴보고 관심 목록에 저장해요.</p></div>
            </div>
          )}
        </section>
      )}

      {!loading && !loadError && tab === "search" && (
        <section className="ad-section">
          <div className="ad-section-title">
            <div>
              <p>UNIVERSITY & MAJOR</p>
              <h2>관심 대학·학과 찾아보기</h2>
            </div>
            <span>대학명, 학과명, 계열명으로 검색할 수 있어요.</span>
          </div>
          <div className="ad-keyword-panel">
            <div className="ad-keyword-input">
              <span>🔎</span>
              <input
                type="search"
                placeholder="예: 한국외대, 경영학과, 국제학…"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                autoFocus
              />
              {keyword && <button type="button" onClick={() => setKeyword("")} aria-label="검색어 지우기">×</button>}
            </div>
            <Filters region={region} track={track} onRegion={setRegion} onTrack={setTrack} />
          </div>

          {keyword.trim() ? (
            <>
              <div className="ad-result-header">
                <div>
                  <h3>검색 결과 <b>{searchResults.length.toLocaleString()}개</b></h3>
                  <p>관심 항목의 참고점수와 모집 정보를 비교해 보세요.</p>
                </div>
              </div>
              <ResultList
                rows={searchResults}
                favorites={favorites}
                onToggle={toggleFavorite}
                visibleCount={visibleCount}
                onMore={() => setVisibleCount((count) => count + 40)}
                emptyText="검색 조건과 일치하는 대학이나 학과가 없습니다. 다른 검색어를 입력해 주세요."
              />
            </>
          ) : (
            <div className="ad-empty ad-search-empty">
              <span>🏫</span>
              <p>관심 있는 대학이나 학과 이름을 입력해 보세요.</p>
              <small>179개 대학, 4,109개 모집단위를 검색할 수 있습니다.</small>
            </div>
          )}
        </section>
      )}

      {tab === "plan" && (
        <section className="ad-section">
          <div className="ad-section-title">
            <div>
              <p>2028 ADMISSION PLAN</p>
              <h2>계열별 전형 검색과 준비 방향</h2>
            </div>
            <span>인천·전북특별자치도교육청 2028 자료 기준</span>
          </div>

          <div className="ad-plan-notice">
            <span>🧭</span>
            <p><b>한영외고 기본 화면은 학생부종합전형입니다.</b> 먼저 관심 계열을 고른 뒤 전형 방법·면접·수능최저를 비교하세요. 학생부교과는 학교장추천·고교유형 등 자격을 개별 확인해야 하므로 참고용으로만 남겼습니다.</p>
          </div>

          <div className="ad-field-selector" aria-label="계열 선택">
            {FIELDS.map((field) => (
              <button
                type="button"
                key={field}
                className={planField === field ? "is-active" : ""}
                onClick={() => setPlanField(field)}
              >
                {field === "전체" ? "🗂️" : FIELD_GUIDES[field].icon}
                <span>{field}</span>
              </button>
            ))}
          </div>

          {planField !== "전체" && (
            <article className="ad-field-guide">
              <div className="ad-field-guide-title">
                <span>{FIELD_GUIDES[planField].icon}</span>
                <div><p>MY PREPARATION</p><h3>{FIELD_GUIDES[planField].title}</h3></div>
              </div>
              <ul>
                {FIELD_GUIDES[planField].focus.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <div><b>최저 전략</b><p>{FIELD_GUIDES[planField].minimum}</p></div>
            </article>
          )}

          <div className="ad-plan-toolbar">
            <div className="ad-keyword-input">
              <span>🔎</span>
              <input
                type="search"
                placeholder="대학명·전형명 검색"
                value={planKeyword}
                onChange={(event) => setPlanKeyword(event.target.value)}
              />
              {planKeyword && <button type="button" onClick={() => setPlanKeyword("")} aria-label="검색어 지우기">×</button>}
            </div>
            <label>
              <span>전형</span>
              <select value={planCategory} onChange={(event) => setPlanCategory(event.target.value)}>
                {PLAN_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              <span>수능최저</span>
              <select value={planMinimum} onChange={(event) => setPlanMinimum(event.target.value)}>
                <option>전체</option><option>있음</option><option>없음</option>
              </select>
            </label>
            <label>
              <span>면접</span>
              <select value={planInterview} onChange={(event) => setPlanInterview(event.target.value)}>
                <option>전체</option><option>있음</option><option>없음</option>
              </select>
            </label>
          </div>

          {planLoading && (
            <div className="ad-loading"><div /><p>2028 전형 정보를 불러오고 있어요.</p></div>
          )}
          {planError && (
            <div className="ad-empty"><span>⚠️</span><p>2028 전형 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p></div>
          )}
          {!planLoading && !planError && (
            <>
              <div className="ad-result-header">
                <div>
                  <h3>검색 결과 <b>{planResults.length.toLocaleString()}개 전형</b></h3>
                  <p>학생부종합을 먼저, 주요 인서울 대학 순으로 보여줘요. 학생부교과는 참고용으로만 표시합니다.</p>
                </div>
              </div>
              {planResults.length > 0 ? (
                <>
                  <div className="ad-plan-results">
                    {planResults.slice(0, planVisible).map((record) => <PlanCard key={record.id} record={record} />)}
                  </div>
                  {planVisible < planResults.length && (
                    <button type="button" className="hy-btn ad-more" onClick={() => setPlanVisible((count) => count + 24)}>
                      더 보기 ({Math.min(planVisible + 24, planResults.length)} / {planResults.length})
                    </button>
                  )}
                </>
              ) : (
                <div className="ad-empty"><span>🔎</span><p>조건과 일치하는 전형이 없습니다. 계열이나 필터를 바꿔 보세요.</p></div>
              )}
            </>
          )}
        </section>
      )}

      {tab === "minimum" && (
        <section className="ad-section">
          <div className="ad-section-title">
            <div>
              <p>CSAT MINIMUM PLANNER</p>
              <h2>수능최저 맞추기</h2>
            </div>
            <span>현재 등급에서 목표 조합까지 필요한 변화를 계산해요.</span>
          </div>
          <MinimumPlanner />
        </section>
      )}

      {!loading && !loadError && tab === "saved" && (
        <section className="ad-section">
          <div className="ad-section-title">
            <div>
              <p>MY INTERESTS</p>
              <h2>관심 대학·학과</h2>
            </div>
            <span>이 기기의 브라우저에만 저장됩니다.</span>
          </div>
          <ResultList
            rows={savedRows}
            favorites={favorites}
            onToggle={toggleFavorite}
            visibleCount={visibleCount}
            onMore={() => setVisibleCount((count) => count + 40)}
            emptyText="아직 저장한 대학이나 학과가 없습니다. 검색 결과의 하트를 눌러 관심 목록을 만들어 보세요."
          />
        </section>
      )}

      {!loading && !loadError && tab === "guide" && (
        <section className="ad-section">
          <div className="ad-section-title">
            <div>
              <p>HYFL HOLISTIC ADMISSION</p>
              <h2>한영외고 학종 준비 가이드</h2>
            </div>
            <span>전북특별자치도교육청 2028 시행계획 분석 반영</span>
          </div>

          <div className="ad-holistic-hero">
            <div>
              <span>한영외고 추천 방향</span>
              <h3>학종 중심으로 준비하고, 교과는 개별 상담 뒤 확인해요.</h3>
              <p>외고 교육과정의 강점은 단순 등급보다 과목 선택의 맥락, 전공어·사회 탐구, 세특에 남은 사고 과정, 면접에서 설명하는 힘으로 보여주는 편이 적합합니다.</p>
            </div>
            <button type="button" onClick={() => selectTab("plan")}>학종 전형 검색하기 →</button>
          </div>

          <div className="ad-subsection-heading">
            <div><p>STUDENT CHECKLIST</p><h3>지금부터 준비할 네 가지</h3></div>
            <span>기록을 억지로 만들기보다 수업 안에서 탐구의 깊이를 키워요.</span>
          </div>

          <div className="ad-holistic-steps">
            {HOLISTIC_STEPS.map((step) => (
              <article key={step.number}>
                <span>{step.number}</span>
                <h4>{step.title}</h4>
                <p>{step.text}</p>
              </article>
            ))}
          </div>

          <div className="ad-record-formula">
            <b>세특·탐구 정리 공식</b>
            <div><span>왜 시작했나</span><i>→</i><span>어떻게 탐구했나</span><i>→</i><span>무엇을 수정했나</span><i>→</i><span>무엇을 배웠나</span><i>→</i><span>다음 질문은 무엇인가</span></div>
          </div>

          <div className="ad-subsection-heading">
            <div><p>2028 UNIVERSITY CHECK</p><h3>관심대학 학종 핵심 변화</h3></div>
            <span>외고 학생이 많이 찾는 대학을 인서울 우선순위로 정리했어요.</span>
          </div>

          <div className="ad-spotlight-grid">
            {HOLISTIC_SPOTLIGHTS.map((item) => (
              <article key={item.university}>
                <div><span>{item.university}</span><small>자료 {item.page}쪽</small></div>
                <h4>{item.admission}</h4>
                <p>{item.method}</p>
                <b>{item.minimum}</b>
                <small>{item.note}</small>
              </article>
            ))}
          </div>

          <div className="ad-subsection-heading">
            <div><p>OTHER ROUTES</p><h3>다른 전형은 이렇게 봐요</h3></div>
            <span>교과전형은 ‘지원 불가’로 단정하지 않고 자격과 환산 방식을 개별 확인해요.</span>
          </div>

          <div className="ad-guide-grid">
            {GUIDE_CARDS.map((card) => (
              <article key={card.title} className="ad-guide-card" style={{ background: card.bg, borderColor: `${card.color}33` }}>
                <h3 style={{ color: card.color }}>{card.title}</h3>
                <p>{card.summary}</p>
                <ul>
                  {card.checks.map((check) => <li key={check}>{check}</li>)}
                </ul>
              </article>
            ))}
          </div>

          <div className="ad-foreign-card">
            <div>
              <span>🌏</span>
              <h3>외고 학생부에서 연결할 것</h3>
            </div>
            <ul>
              <li><b>국어·영어·수학의 기본 학업 역량</b>과 지원 학과에 필요한 교과 성취</li>
              <li><b>전공어·사회·탐구 과목의 세특</b>이 하나의 관심 질문으로 어떻게 이어지는지</li>
              <li>공동체역량은 직책보다 <b>협업 과정·역할·갈등 해결·기여</b>의 구체적인 장면</li>
              <li>서울대처럼 <b>과목 이수 맥락과 권장과목</b>을 보는 대학은 미이수 사유까지 점검</li>
            </ul>
          </div>

          <div className="ad-check-order">
            <h3>대학 정보는 이 순서로 확인해요</h3>
            <div>
              <a href="https://www.adiga.kr" target="_blank" rel="noreferrer">
                <span>1</span><b>대입정보포털 어디가</b><small>대학·학과·전형 비교</small>
              </a>
              <div className="ad-order-arrow">→</div>
              <div>
                <span>2</span><b>대학 입학처</b><small>해당 학년도 모집요강 확인</small>
              </div>
              <div className="ad-order-arrow">→</div>
              <div>
                <span>3</span><b>학교 진학 상담</b><small>내 학생부와 성적을 함께 점검</small>
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className="ad-source">
        자료: 이투스 2027학년도 9월 학력평가 대학별 지원참고표(고1 가채점) · 인천광역시교육청 2028 대입전형 프리뷰 · 전북특별자치도교육청 2028 대학 입학전형 시행계획 분석 · 교내 진학 탐색용
      </footer>

      <style>{`
        .ad-page { display:flex; flex-direction:column; gap:20px; }
        .ad-hero { display:flex; align-items:center; justify-content:space-between; gap:24px; }
        .ad-hero-tag { display:inline-flex; padding:4px 13px; border-radius:999px; background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.35); color:#fff; font-size:12px; font-weight:800; margin-bottom:12px; }
        .ad-hero h1 { color:#fff; font-size:clamp(24px,4vw,34px); font-weight:900; margin:0 0 8px; letter-spacing:-.04em; }
        .ad-hero p { color:rgba(255,255,255,.88); font-size:14px; font-weight:600; line-height:1.7; margin:0; max-width:620px; }
        .ad-hero-stat { display:grid; grid-template-columns:auto auto; gap:2px 8px; min-width:190px; padding:18px 20px; border-radius:22px; background:rgba(255,255,255,.17); border:1px solid rgba(255,255,255,.3); color:#fff; backdrop-filter:blur(8px); }
        .ad-hero-stat b { font-size:24px; line-height:1; font-weight:900; text-align:right; }
        .ad-hero-stat span { font-size:12px; font-weight:700; align-self:end; }
        .ad-hero-stat i { grid-column:1/-1; height:1px; background:rgba(255,255,255,.25); margin:6px 0; }
        .ad-warning { display:flex; gap:11px; padding:14px 18px; border-radius:16px; border:1.5px solid #fcd34d; background:#fffbeb; align-items:flex-start; }
        .ad-warning > span { font-size:18px; }
        .ad-warning p { margin:0; font-size:12px; line-height:1.75; color:#78550b; }
        .ad-tabs { display:grid; grid-template-columns:repeat(6,1fr); gap:8px; padding:7px; border-radius:18px; background:#fff; border:1.5px solid var(--border); box-shadow:var(--shadow-sm); }
        .ad-tabs button { position:relative; border:0; border-radius:13px; padding:11px 12px; background:transparent; color:var(--text-muted); font:700 13px inherit; cursor:pointer; transition:.16s ease; }
        .ad-tabs button span { margin-right:5px; }
        .ad-tabs button b { display:inline-flex; justify-content:center; align-items:center; min-width:18px; height:18px; padding:0 5px; margin-left:5px; border-radius:999px; background:#f472b6; color:#fff; font-size:10px; }
        .ad-tabs button.is-active { color:#fff; background:linear-gradient(135deg,#f472b6,#a78bfa); box-shadow:0 4px 13px rgba(244,114,182,.28); }
        .ad-tabs button.is-active b { background:rgba(255,255,255,.28); }
        .ad-section { display:flex; flex-direction:column; gap:18px; }
        .ad-section-title { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; padding:6px 2px 0; }
        .ad-section-title p { margin:0 0 4px; color:var(--primary); font-size:10px; font-weight:900; letter-spacing:.12em; }
        .ad-section-title h2 { margin:0; color:var(--text); font-size:21px; font-weight:900; letter-spacing:-.04em; }
        .ad-section-title > span { color:var(--text-subtle); font-size:11px; font-weight:600; }
        .ad-score-panel, .ad-keyword-panel { padding:22px; border-radius:22px; border:1.5px solid var(--border); background:#fff; box-shadow:var(--shadow-sm); }
        .ad-score-inputs { display:grid; grid-template-columns:1fr 1fr auto; gap:12px; align-items:end; }
        .ad-score-inputs label > span, .ad-filters label > span { display:block; margin:0 0 7px; color:var(--text-muted); font-size:12px; font-weight:800; }
        .ad-score-inputs input { width:100%; box-sizing:border-box; padding:13px 14px; border-radius:13px; border:1.5px solid var(--border); color:var(--text); background:#fdfbff; outline:none; font:800 17px inherit; }
        .ad-score-inputs input:focus { border-color:var(--primary); box-shadow:0 0 0 3px rgba(244,114,182,.12); }
        .ad-score-inputs small { display:block; margin-top:6px; color:var(--text-subtle); font-size:10px; }
        .ad-search-button { height:48px; white-space:nowrap; margin-bottom:20px; }
        .ad-calculator { margin-top:16px; border-top:1px dashed var(--border); padding-top:14px; }
        .ad-calculator summary { color:var(--primary-dark); font-size:12px; font-weight:800; cursor:pointer; }
        .ad-calculator-body { margin-top:14px; padding:16px; border-radius:16px; background:linear-gradient(135deg,#fdf2f8,#f5f3ff); }
        .ad-calc-table { display:grid; grid-template-columns:minmax(72px,.8fr) 1fr 1fr; gap:7px; margin-bottom:12px; }
        .ad-calc-head { color:var(--text-subtle); font-size:10px; font-weight:800; text-align:center; }
        .ad-calc-row { display:contents; }
        .ad-calc-row label { align-self:center; color:var(--text-muted); font-size:12px; font-weight:700; }
        .ad-calc-row input { min-width:0; padding:9px 10px; border-radius:10px; border:1px solid var(--border); background:#fff; color:var(--text); font:700 14px inherit; outline:none; }
        .ad-help { margin:10px 0 0; color:var(--text-subtle); font-size:10px; line-height:1.6; }
        .ad-tip-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
        .ad-tip-grid > div { display:flex; align-items:center; gap:11px; padding:15px 16px; border-radius:17px; border:1.5px solid var(--border); background:#fff; }
        .ad-tip-grid span { display:flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:10px; flex:0 0 auto; color:#fff; background:linear-gradient(135deg,#f472b6,#a78bfa); font-size:12px; font-weight:900; }
        .ad-tip-grid p { margin:0; color:var(--text-muted); font-size:11px; line-height:1.45; }
        .ad-tip-grid b { display:block; color:var(--text); font-size:12px; margin-bottom:2px; }
        .ad-result-header { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; padding-top:5px; }
        .ad-result-header h3 { margin:0 0 3px; font-size:16px; color:var(--text); }
        .ad-result-header h3 b { color:var(--primary-dark); }
        .ad-result-header p { margin:0; color:var(--text-subtle); font-size:11px; }
        .ad-filters { display:flex; gap:8px; }
        .ad-filters label > span { display:inline; margin-right:5px; font-size:10px; }
        .ad-filters select { padding:8px 30px 8px 11px; border-radius:10px; border:1px solid var(--border); background:#fff; color:var(--text-muted); font:700 11px inherit; outline:none; }
        .ad-results { display:flex; flex-direction:column; gap:9px; }
        .ad-result-card { display:grid; grid-template-columns:minmax(0,1fr) 245px; border-radius:19px; border:1.5px solid var(--border); background:#fff; box-shadow:var(--shadow-sm); overflow:hidden; transition:.18s ease; }
        .ad-result-card:hover { transform:translateY(-2px); border-color:#f9a8d4; box-shadow:var(--shadow-md); }
        .ad-result-main { padding:16px 18px; }
        .ad-result-top { display:flex; justify-content:space-between; gap:12px; }
        .ad-chips { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:7px; }
        .ad-chips span { padding:3px 8px; border-radius:999px; background:#f5f3ff; color:#7c3aed; font-size:9px; font-weight:800; }
        .ad-result-card h3 { margin:0 0 2px; color:var(--text); font-size:16px; font-weight:900; }
        .ad-department { margin:0; color:var(--text-muted); font-size:13px; font-weight:700; }
        .ad-meta { margin:9px 0 0; color:var(--text-subtle); font-size:10px; }
        .ad-heart { width:38px; height:38px; border-radius:12px; border:1px solid var(--border); background:#fff; color:#f9a8d4; cursor:pointer; font-size:22px; line-height:1; flex:0 0 auto; }
        .ad-heart:hover, .ad-heart.is-saved { border-color:#f9a8d4; color:#ec4899; background:#fdf2f8; }
        .ad-cutline { display:flex; flex-direction:column; justify-content:center; padding:15px 17px; border-left:1px dashed #ddd6fe; background:linear-gradient(135deg,#faf5ff,#fdf2f8); }
        .ad-cutline > p { margin:0 0 6px; color:var(--text-subtle); font-size:9px; font-weight:800; letter-spacing:.06em; }
        .ad-cutline > div { display:flex; gap:9px; }
        .ad-cutline > div span { color:var(--text-muted); font-size:10px; }
        .ad-cutline b { color:var(--text); font-size:17px; }
        .ad-cutline small { margin-top:7px; color:#059669; font-size:9px; font-weight:700; }
        .ad-more { align-self:center; min-width:190px; }
        .ad-empty { padding:46px 22px; border-radius:20px; border:1.5px dashed var(--border); background:#fff; text-align:center; }
        .ad-empty > span { display:block; font-size:34px; margin-bottom:8px; }
        .ad-empty p { margin:0; color:var(--text-muted); font-size:13px; font-weight:700; line-height:1.6; }
        .ad-empty small { display:block; margin-top:6px; color:var(--text-subtle); font-size:11px; }
        .ad-loading { display:flex; align-items:center; justify-content:center; gap:10px; min-height:190px; color:var(--text-muted); font-size:12px; font-weight:700; }
        .ad-loading div { width:20px; height:20px; border-radius:50%; border:3px solid #fce7f3; border-top-color:var(--primary); animation:adSpin .8s linear infinite; }
        .ad-keyword-panel { display:flex; gap:12px; align-items:center; }
        .ad-keyword-input { display:flex; align-items:center; gap:8px; flex:1; padding:3px 12px; border-radius:14px; border:1.5px solid var(--border); background:#fdfbff; }
        .ad-keyword-input input { min-width:0; flex:1; border:0; padding:10px 0; outline:none; background:transparent; color:var(--text); font:700 14px inherit; }
        .ad-keyword-input button { border:0; background:transparent; color:var(--text-subtle); font-size:20px; cursor:pointer; }
        .ad-search-empty { min-height:170px; display:flex; flex-direction:column; justify-content:center; }
        .ad-plan-notice { display:flex; align-items:flex-start; gap:11px; padding:16px 18px; border-radius:17px; border:1.5px solid #c7d2fe; background:linear-gradient(135deg,#eef2ff,#f5f3ff); }
        .ad-plan-notice > span { font-size:20px; }
        .ad-plan-notice p { margin:0; color:#5b5b86; font-size:11px; line-height:1.75; }
        .ad-plan-notice b { color:#4338ca; }
        .ad-field-selector { display:grid; grid-template-columns:repeat(7,1fr); gap:7px; }
        .ad-field-selector button { display:flex; align-items:center; justify-content:center; gap:6px; min-height:48px; padding:9px 7px; border:1.5px solid var(--border); border-radius:14px; background:#fff; color:var(--text-muted); font:800 11px inherit; cursor:pointer; transition:.16s ease; }
        .ad-field-selector button:hover { border-color:#c4b5fd; transform:translateY(-1px); }
        .ad-field-selector button.is-active { border-color:#a78bfa; background:linear-gradient(135deg,#f5f3ff,#fdf2f8); color:#7c3aed; box-shadow:0 4px 14px rgba(167,139,250,.16); }
        .ad-field-guide { display:grid; grid-template-columns:220px 1fr 1.2fr; gap:18px; align-items:center; padding:20px; border-radius:22px; border:1.5px solid #c4b5fd; background:linear-gradient(135deg,#faf5ff,#fff); box-shadow:var(--shadow-sm); }
        .ad-field-guide-title { display:flex; align-items:center; gap:10px; }
        .ad-field-guide-title > span { display:flex; align-items:center; justify-content:center; width:45px; height:45px; border-radius:14px; background:#ede9fe; font-size:23px; }
        .ad-field-guide-title p { margin:0 0 2px; color:#a78bfa; font-size:8px; font-weight:900; letter-spacing:.1em; }
        .ad-field-guide-title h3 { margin:0; font-size:14px; font-weight:900; }
        .ad-field-guide ul { margin:0; padding-left:17px; }
        .ad-field-guide li { margin:3px 0; color:var(--text-muted); font-size:10px; line-height:1.45; }
        .ad-field-guide > div:last-child { padding:13px 14px; border-radius:15px; background:#fff; border:1px solid #ede9fe; }
        .ad-field-guide > div:last-child b { color:#7c3aed; font-size:10px; }
        .ad-field-guide > div:last-child p { margin:4px 0 0; color:var(--text-muted); font-size:10px; line-height:1.55; }
        .ad-plan-toolbar { display:grid; grid-template-columns:minmax(240px,1fr) auto auto auto; gap:9px; align-items:end; padding:15px; border-radius:18px; background:#fff; border:1.5px solid var(--border); }
        .ad-plan-toolbar > label > span { display:block; margin:0 0 5px; color:var(--text-subtle); font-size:9px; font-weight:800; }
        .ad-plan-toolbar select { min-width:110px; padding:11px 30px 11px 11px; border-radius:12px; border:1.5px solid var(--border); background:#fdfbff; color:var(--text-muted); font:700 11px inherit; outline:none; }
        .ad-plan-results { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:11px; }
        .ad-plan-card { display:flex; flex-direction:column; gap:11px; min-width:0; padding:19px; border-radius:21px; border:1.5px solid var(--border); background:#fff; box-shadow:var(--shadow-sm); transition:.17s ease; }
        .ad-plan-card:hover { transform:translateY(-2px); border-color:#c4b5fd; box-shadow:var(--shadow-md); }
        .ad-plan-card.is-reference { border-style:dashed; background:#fcfcfd; }
        .ad-plan-card.is-reference:hover { border-color:#94a3b8; }
        .ad-plan-card-head { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
        .ad-plan-card-head h3 { margin:0; color:var(--text); font-size:17px; font-weight:900; }
        .ad-plan-card-head p { margin:3px 0 0; color:#6d5c7b; font-size:12px; font-weight:800; }
        .ad-source-page { flex:0 0 auto; padding:5px 7px; border-radius:8px; background:#f8fafc; color:#94a3b8; font-size:8px; }
        .ad-plan-fields { display:flex; flex-wrap:wrap; gap:5px; }
        .ad-plan-fields span { padding:3px 7px; border-radius:999px; background:#ecfeff; color:#0f766e; font-size:8px; font-weight:800; }
        .ad-plan-detail-grid { display:grid; grid-template-columns:1fr 1.15fr; gap:8px; }
        .ad-plan-detail-grid > div { min-width:0; padding:12px; border-radius:14px; border:1px solid #ede9fe; background:#faf8ff; }
        .ad-plan-detail-grid > div.has-minimum { border-color:#fecdd3; background:#fff1f2; }
        .ad-plan-detail-grid > div.no-minimum { border-color:#bbf7d0; background:#f0fdf4; }
        .ad-plan-detail-grid b { color:var(--text-subtle); font-size:9px; }
        .ad-plan-detail-grid p { margin:5px 0 0; color:var(--text-muted); font-size:10px; font-weight:650; line-height:1.55; white-space:pre-line; overflow-wrap:anywhere; }
        .ad-plan-detail-grid .has-minimum p { color:#9f1239; }
        .ad-plan-detail-grid .no-minimum p { color:#166534; }
        .ad-plan-prepare { display:grid; grid-template-columns:auto 1fr; gap:9px; align-items:start; padding:10px 12px; border-radius:13px; background:#fffbeb; }
        .ad-plan-prepare span { color:#b45309; font-size:9px; font-weight:900; white-space:nowrap; }
        .ad-plan-prepare p { margin:0; color:#7c5a25; font-size:9px; line-height:1.5; }
        .ad-reference-chip { background:#f1f5f9 !important; color:#64748b !important; }
        .ad-plan-reference-note { padding:9px 11px; border-radius:12px; border:1px dashed #cbd5e1; background:#f8fafc; color:#64748b; font-size:9px; line-height:1.55; }
        .ad-plan-notes { border-top:1px dashed var(--border); padding-top:9px; }
        .ad-plan-notes summary { color:#7c3aed; font-size:9px; font-weight:800; cursor:pointer; }
        .ad-plan-notes p { margin:8px 0 0; padding:10px 12px; border-radius:12px; background:#f8fafc; color:#64748b; font-size:9px; line-height:1.6; white-space:pre-line; }
        .ad-min-layout { display:grid; grid-template-columns:1.1fr .9fr; gap:12px; }
        .ad-min-input-card, .ad-min-target-card { padding:21px; border-radius:22px; border:1.5px solid var(--border); background:#fff; box-shadow:var(--shadow-sm); }
        .ad-min-card-title { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
        .ad-min-card-title > span { display:flex; align-items:center; justify-content:center; width:31px; height:31px; border-radius:10px; background:linear-gradient(135deg,#f472b6,#a78bfa); color:#fff; font-size:12px; font-weight:900; }
        .ad-min-card-title b { display:block; color:var(--text); font-size:14px; }
        .ad-min-card-title small { display:block; margin-top:2px; color:var(--text-subtle); font-size:9px; }
        .ad-grade-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:9px; }
        .ad-grade-grid label > span, .ad-min-custom label > span { display:block; margin-bottom:5px; color:var(--text-muted); font-size:10px; font-weight:800; }
        .ad-grade-grid input, .ad-min-custom input, .ad-min-custom select { width:100%; box-sizing:border-box; padding:11px 10px; border-radius:11px; border:1.5px solid var(--border); background:#fdfbff; color:var(--text); outline:none; font:800 14px inherit; }
        .ad-grade-grid input:focus, .ad-min-custom input:focus, .ad-min-custom select:focus { border-color:#a78bfa; box-shadow:0 0 0 3px rgba(167,139,250,.12); }
        .ad-min-presets { display:flex; flex-wrap:wrap; gap:6px; }
        .ad-min-presets button { padding:7px 10px; border:1px solid #ddd6fe; border-radius:999px; background:#faf5ff; color:#7c3aed; font:800 10px inherit; cursor:pointer; }
        .ad-min-presets button.is-active { border-color:#8b5cf6; background:#8b5cf6; color:#fff; }
        .ad-min-custom { display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-top:14px; }
        .ad-combination-list { margin-top:14px; padding:12px; border-radius:14px; background:#f8fafc; }
        .ad-combination-list > b { color:#64748b; font-size:9px; }
        .ad-combination-list > div { display:flex; flex-wrap:wrap; gap:5px; margin-top:7px; }
        .ad-combination-list span { padding:4px 7px; border-radius:7px; background:#fff; border:1px solid #e2e8f0; color:#475569; font-size:9px; font-weight:700; }
        .ad-combination-list small { color:#94a3b8; font-size:9px; }
        .ad-min-empty { display:flex; align-items:center; justify-content:center; gap:10px; min-height:90px; padding:18px; border:1.5px dashed #c4b5fd; border-radius:18px; background:#faf5ff; }
        .ad-min-empty span { font-size:22px; }
        .ad-min-empty p { margin:0; color:#7c6b8a; font-size:11px; font-weight:700; }
        .ad-min-result { display:flex; align-items:center; gap:18px; padding:20px; border-radius:21px; border:1.5px solid; }
        .ad-min-result.is-met { border-color:#86efac; background:linear-gradient(135deg,#f0fdf4,#ecfdf5); }
        .ad-min-result.needs-work { border-color:#fdba74; background:linear-gradient(135deg,#fff7ed,#fffbeb); }
        .ad-min-result-status { display:flex; align-items:center; gap:11px; flex:1; }
        .ad-min-result-status > span { display:flex; align-items:center; justify-content:center; width:42px; height:42px; border-radius:14px; color:#fff; background:#22c55e; font-size:22px; font-weight:900; }
        .ad-min-result.needs-work .ad-min-result-status > span { background:#f97316; }
        .ad-min-result-status p { margin:0 0 3px; color:var(--text-muted); font-size:10px; }
        .ad-min-result-status h3 { margin:0; color:var(--text); font-size:16px; font-weight:900; }
        .ad-min-action { min-width:210px; padding:11px 13px; border-radius:13px; background:rgba(255,255,255,.72); }
        .ad-min-action b { color:#c2410c; font-size:9px; }
        .ad-min-action p { margin:4px 0 0; color:#9a3412; font-size:10px; font-weight:800; }
        .ad-min-extra { display:flex; flex-direction:column; gap:4px; min-width:145px; color:var(--text-muted); font-size:9px; }
        .ad-min-extra b { color:var(--text); }
        .ad-min-caution { padding:16px 18px; border-radius:17px; border:1.5px solid #fde68a; background:#fffbeb; }
        .ad-min-caution b { color:#92400e; font-size:11px; }
        .ad-min-caution p { margin:5px 0 0; color:#78550b; font-size:10px; line-height:1.7; }
        .ad-holistic-hero { display:flex; align-items:center; justify-content:space-between; gap:24px; padding:25px; border-radius:24px; background:linear-gradient(135deg,#4c1d95,#7c3aed 56%,#c026d3); color:#fff; box-shadow:0 12px 28px rgba(109,40,217,.2); }
        .ad-holistic-hero > div { max-width:720px; }
        .ad-holistic-hero span { display:inline-flex; margin-bottom:8px; padding:4px 9px; border-radius:999px; background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.24); font-size:9px; font-weight:900; }
        .ad-holistic-hero h3 { margin:0 0 7px; font-size:20px; font-weight:900; letter-spacing:-.035em; }
        .ad-holistic-hero p { margin:0; color:rgba(255,255,255,.82); font-size:11px; line-height:1.7; }
        .ad-holistic-hero button { flex:0 0 auto; padding:12px 15px; border:1px solid rgba(255,255,255,.34); border-radius:13px; background:#fff; color:#6d28d9; font:900 11px inherit; cursor:pointer; }
        .ad-subsection-heading { display:flex; align-items:end; justify-content:space-between; gap:16px; padding:7px 2px 0; }
        .ad-subsection-heading p { margin:0 0 3px; color:#a78bfa; font-size:8px; font-weight:900; letter-spacing:.11em; }
        .ad-subsection-heading h3 { margin:0; color:var(--text); font-size:17px; font-weight:900; }
        .ad-subsection-heading > span { color:var(--text-subtle); font-size:9px; }
        .ad-holistic-steps { display:grid; grid-template-columns:repeat(4,1fr); gap:9px; }
        .ad-holistic-steps article { position:relative; min-width:0; padding:18px; border:1.5px solid #e9d5ff; border-radius:19px; background:linear-gradient(145deg,#fff,#faf5ff); }
        .ad-holistic-steps article > span { display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:10px; background:#ede9fe; color:#7c3aed; font-size:10px; font-weight:900; }
        .ad-holistic-steps h4 { margin:10px 0 6px; color:var(--text); font-size:13px; font-weight:900; }
        .ad-holistic-steps p { margin:0; color:var(--text-muted); font-size:9px; line-height:1.65; }
        .ad-record-formula { display:flex; align-items:center; gap:18px; padding:15px 18px; border-radius:17px; border:1.5px solid #fbcfe8; background:#fdf2f8; }
        .ad-record-formula > b { flex:0 0 auto; color:#be185d; font-size:10px; }
        .ad-record-formula > div { display:flex; flex-wrap:wrap; align-items:center; gap:7px; }
        .ad-record-formula span { padding:5px 8px; border-radius:8px; background:#fff; color:#7c3aed; font-size:9px; font-weight:800; }
        .ad-record-formula i { color:#d8b4fe; font-size:10px; font-style:normal; }
        .ad-spotlight-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
        .ad-spotlight-grid article { display:flex; flex-direction:column; gap:7px; min-width:0; padding:18px; border:1.5px solid var(--border); border-radius:19px; background:#fff; box-shadow:var(--shadow-sm); }
        .ad-spotlight-grid article > div { display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .ad-spotlight-grid article > div span { color:#7c3aed; font-size:15px; font-weight:900; }
        .ad-spotlight-grid article > div small { color:#94a3b8; font-size:8px; }
        .ad-spotlight-grid h4 { margin:0; color:var(--text); font-size:12px; font-weight:900; }
        .ad-spotlight-grid p { margin:0; color:var(--text-muted); font-size:10px; line-height:1.55; }
        .ad-spotlight-grid article > b { align-self:flex-start; padding:4px 8px; border-radius:8px; background:#ecfdf5; color:#047857; font-size:9px; }
        .ad-spotlight-grid article > small { color:#64748b; font-size:9px; line-height:1.6; }
        .ad-guide-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:11px; }
        .ad-guide-card { padding:20px; border-radius:20px; border:1.5px solid; }
        .ad-guide-card h3 { margin:0 0 5px; font-size:17px; font-weight:900; }
        .ad-guide-card > p { margin:0 0 12px; color:var(--text-muted); font-size:12px; font-weight:700; }
        .ad-guide-card ul { display:flex; flex-direction:column; gap:6px; padding:0; margin:0; list-style:none; }
        .ad-guide-card li { position:relative; padding-left:14px; color:var(--text-muted); font-size:11px; line-height:1.5; }
        .ad-guide-card li::before { content:'✓'; position:absolute; left:0; color:#10b981; font-weight:900; }
        .ad-foreign-card { padding:22px; border-radius:22px; border:1.5px solid #bae6fd; background:linear-gradient(135deg,#f0f9ff,#eff6ff); }
        .ad-foreign-card > div { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
        .ad-foreign-card > div span { font-size:23px; }
        .ad-foreign-card h3 { margin:0; color:#075985; font-size:16px; font-weight:900; }
        .ad-foreign-card ul { display:grid; grid-template-columns:1fr 1fr; gap:8px 22px; margin:0; padding-left:18px; }
        .ad-foreign-card li { color:#486579; font-size:11px; line-height:1.65; }
        .ad-check-order { padding:22px; border-radius:22px; border:1.5px solid var(--border); background:#fff; }
        .ad-check-order h3 { margin:0 0 15px; font-size:15px; font-weight:900; }
        .ad-check-order > div { display:flex; align-items:stretch; gap:10px; }
        .ad-check-order a, .ad-check-order > div > div:not(.ad-order-arrow) { flex:1; display:grid; grid-template-columns:28px 1fr; gap:1px 8px; padding:13px; border-radius:15px; border:1px solid var(--border); background:#fdfbff; text-decoration:none; }
        .ad-check-order span { grid-row:1/3; display:flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:9px; background:var(--primary-light); color:var(--primary-dark); font-size:11px; font-weight:900; }
        .ad-check-order b { color:var(--text); font-size:12px; }
        .ad-check-order small { color:var(--text-subtle); font-size:9px; }
        .ad-order-arrow { align-self:center; color:#c4b5fd; font-weight:900; }
        .ad-source { padding:7px 0; color:var(--text-subtle); font-size:10px; text-align:center; }
        @keyframes adSpin { to { transform:rotate(360deg); } }
        @media (max-width:760px) {
          .ad-hero { align-items:flex-start; flex-direction:column; }
          .ad-hero-stat { width:100%; box-sizing:border-box; grid-template-columns:auto auto 1px auto auto; align-items:center; }
          .ad-hero-stat b { text-align:right; }
          .ad-hero-stat i { grid-column:auto; width:1px; height:34px; margin:0 8px; }
          .ad-tabs { grid-template-columns:repeat(3,1fr); }
          .ad-section-title { align-items:flex-start; flex-direction:column; gap:5px; }
          .ad-score-inputs { grid-template-columns:1fr 1fr; }
          .ad-search-button { grid-column:1/-1; width:100%; margin:2px 0 0; }
          .ad-tip-grid { grid-template-columns:1fr; }
          .ad-result-header { align-items:flex-start; flex-direction:column; }
          .ad-result-card { grid-template-columns:1fr; }
          .ad-cutline { border-left:0; border-top:1px dashed #ddd6fe; }
          .ad-keyword-panel { align-items:stretch; flex-direction:column; }
          .ad-filters { width:100%; }
          .ad-filters label { flex:1; }
          .ad-filters select { width:100%; }
          .ad-guide-grid { grid-template-columns:1fr; }
          .ad-foreign-card ul { grid-template-columns:1fr; }
          .ad-check-order > div { flex-direction:column; }
          .ad-order-arrow { transform:rotate(90deg); }
          .ad-field-selector { grid-template-columns:repeat(4,1fr); }
          .ad-field-guide { grid-template-columns:1fr; gap:12px; }
          .ad-plan-toolbar { grid-template-columns:1fr 1fr 1fr; }
          .ad-plan-toolbar .ad-keyword-input { grid-column:1/-1; }
          .ad-plan-toolbar select { width:100%; min-width:0; }
          .ad-plan-results { grid-template-columns:1fr; }
          .ad-min-layout { grid-template-columns:1fr; }
          .ad-min-result { align-items:stretch; flex-direction:column; gap:11px; }
          .ad-min-action, .ad-min-extra { min-width:0; }
          .ad-holistic-hero { align-items:flex-start; flex-direction:column; }
          .ad-holistic-hero button { width:100%; }
          .ad-subsection-heading { align-items:flex-start; flex-direction:column; gap:4px; }
          .ad-holistic-steps { grid-template-columns:repeat(2,1fr); }
          .ad-record-formula { align-items:flex-start; flex-direction:column; }
          .ad-spotlight-grid { grid-template-columns:1fr; }
        }
        @media (max-width:430px) {
          .ad-score-inputs { grid-template-columns:1fr; }
          .ad-search-button { grid-column:auto; }
          .ad-tabs { grid-template-columns:repeat(2,1fr); }
          .ad-tabs button { font-size:11px; padding:10px 5px; }
          .ad-field-selector { grid-template-columns:repeat(2,1fr); }
          .ad-plan-toolbar { grid-template-columns:1fr; }
          .ad-plan-toolbar .ad-keyword-input { grid-column:auto; }
          .ad-plan-detail-grid { grid-template-columns:1fr; }
          .ad-grade-grid { grid-template-columns:repeat(2,1fr); }
          .ad-holistic-steps { grid-template-columns:1fr; }
        }
      `}</style>
    </div>
  );
}
