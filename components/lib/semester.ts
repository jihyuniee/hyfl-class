// 학기 구분을 위한 공통 상수/유틸.
// 하드코딩 대신 이 파일의 값만 바꾸면 전체 페이지에 반영되도록 한다.

export type SemesterId = "2026-1" | "2026-2";

export const SEMESTERS: { id: SemesterId; label: string }[] = [
  { id: "2026-1", label: "1학기" },
  { id: "2026-2", label: "2학기" },
];

// 새로 접속했을 때 기본으로 열리는 학기 탭.
export const CURRENT_SEMESTER: SemesterId = "2026-2";

// 학기 구분 필드가 없던 기존 데이터는 전부 1학기 데이터로 간주한다.
export const LEGACY_SEMESTER: SemesterId = "2026-1";

export function semesterLabel(id: string): string {
  return SEMESTERS.find(s => s.id === id)?.label ?? id;
}

// 2026학년도 2학기 중간고사 시작일.
export const MIDTERM_EXAM_START = "2026-09-29";
export const MIDTERM_EXAM_LABEL = "2학기 중간고사";
export const FINAL_EXAM_START = "2026-12-02";

export type ExamSchedule = {
  label: string;
  shortLabel: string;
  start: string;
  // 확인된 종료일만 입력한다. 미확인 시 시작일까지만 안내한다.
  end?: string;
};

export const SCHOOL_EXAMS: ExamSchedule[] = [
  { label: MIDTERM_EXAM_LABEL, shortLabel: "중간고사", start: MIDTERM_EXAM_START },
  { label: "2학기 기말고사", shortLabel: "기말고사", start: FINAL_EXAM_START },
];

// 90일 습관 챌린지 등 학기별로 다른 시작일이 필요한 값들.
export const HABIT_PROJECT_START: Record<SemesterId, string> = {
  "2026-1": "2026-03-09",
  "2026-2": "2026-08-18",
};

// 2학기 습관 프로젝트 기간(2026.08 ~ 2027.01) 중의 대한민국 공휴일.
// 실천일(평일이면서 공휴일이 아닌 날) 계산에 사용된다. 1학기 기간(2026.03~07)과는
// 겹치지 않으므로 1학기 기록/집계에는 영향이 없다.
export const KR_HOLIDAYS: string[] = [
  "2026-08-17", // 광복절 대체공휴일
  "2026-09-24", // 추석 연휴
  "2026-09-25", // 추석
  "2026-09-26", // 추석 연휴
  "2026-10-03", // 개천절
  "2026-10-05", // 개천절 대체공휴일
  "2026-10-09", // 한글날
  "2026-12-25", // 크리스마스
  "2027-01-01", // 신정
];

export function isKoreanHoliday(dateStr: string): boolean {
  return KR_HOLIDAYS.includes(dateStr);
}

/** 오늘 날짜를 한국시간(Asia/Seoul) 기준 YYYY-MM-DD 문자열로 반환한다. */
export function toKSTDateStr(d: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(d);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

// dateStr(YYYY-MM-DD)은 이미 한국 달력 기준 날짜다. 요일/날짜 연산이 실행 환경의
// 로컬 시간대(서버·브라우저 설정)에 좌우되지 않도록, 로컬 타임존을 전혀 거치지 않는
// UTC 고정 앵커로 파싱해 순수하게 달력 연산만 한다.
function parseCalendarDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}

export function isWeekend(dateStr: string): boolean {
  const day = parseCalendarDate(dateStr).getUTCDay();
  return day === 0 || day === 6;
}

export function addDaysKST(dateStr: string, n: number): string {
  const d = parseCalendarDate(dateStr);
  d.setUTCDate(d.getUTCDate() + n);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** 주말도 공휴일도 아닌, 습관을 실천/체크할 수 있는 날인지 여부. */
export function isPracticeDay(dateStr: string): boolean {
  return !isWeekend(dateStr) && !isKoreanHoliday(dateStr);
}

/** 오늘부터 target까지 남은 일수 (자정 기준, 음수 가능). */
export function ddayNumber(target: string, today: Date = new Date()): number {
  return Math.round((parseCalendarDate(target).getTime() -
    parseCalendarDate(toKSTDateStr(today)).getTime()) / (1000 * 60 * 60 * 24));
}

export type ExamStatus = "upcoming" | "starting" | "ongoing" | "past";

/** 종료일이 없으면 시작일 이후 상태를 추측하지 않고 지난 안내로 처리한다. */
export function examStatus(target: string, today: Date = new Date(), end?: string): ExamStatus {
  const d = ddayNumber(target, today);
  if (d > 0) return "upcoming";
  if (d === 0) return "starting";
  if (end && ddayNumber(end, today) >= 0) return "ongoing";
  return "past";
}

/** 지난 시험은 null을 반환해 D-day와 배너를 모두 숨길 수 있게 한다. */
export function examDdayLabel(target: string, today: Date = new Date(), end?: string): string | null {
  const status = examStatus(target, today, end);
  if (status === "upcoming") return `D-${ddayNumber(target, today)}`;
  if (status === "starting") return "D-DAY";
  if (status === "ongoing") return "시험 기간";
  return null;
}

export function examStatusText(
  target: string, today: Date = new Date(),
  options: { end?: string; label?: string; shortLabel?: string } = {},
): string | null {
  const status = examStatus(target, today, options.end);
  if (status === "past") return null;
  const label = options.label ?? MIDTERM_EXAM_LABEL;
  const shortLabel = options.shortLabel ?? "중간고사";
  const d = ddayNumber(target, today);
  if (d > 1) return `${label}까지 ${d}일 남았어요`;
  if (d === 1) return `내일부터 ${shortLabel}예요! 마무리 점검하기 🔥`;
  if (status === "starting") return `오늘부터 ${shortLabel}가 시작돼요. 다들 화이팅! 📚`;
  return `${shortLabel} 기간이에요. 끝까지 힘내요 💪`;
}

export function nextSchoolExam(today: Date = new Date()): ExamSchedule | undefined {
  return [...SCHOOL_EXAMS].sort((a, b) => a.start.localeCompare(b.start))
    .find(exam => examStatus(exam.start, today, exam.end) !== "past");
}
