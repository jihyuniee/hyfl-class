export function readScore(value: string, max: number): number | null {
  if (!value.trim()) return null;
  const score = Number(value);
  return Number.isFinite(score) && score >= 0 && score <= max ? score : null;
}
export function mockPercentile(values: string[]): number | null {
  const parsed = values.map(v => readScore(v, 100));
  if (parsed.length !== 4 || parsed.some(v => v === null)) return null;
  const [k, m, s, n] = parsed as number[];
  return (k + m + (s + n) / 2) / 3;
}
export function mockStandard(values: string[]): number | null {
  const parsed = values.map((v, i) => readScore(v, i < 2 ? 200 : 100));
  if (parsed.length !== 4 || parsed.some(v => v === null)) return null;
  return (parsed as number[]).reduce((sum, value) => sum + value, 0);
}

export const SCORE_BANDS = ['상향', '소신', '가능', '적정', '안정'] as const;
export type ScoreBand = typeof SCORE_BANDS[number];
export type ScoreReference = {
  university: string; department: string; admission: string; group: string;
  standardSum: number; percentileSum: number;
};

// 기존 /admissions 점수 탐색기의 분류 간격을 보존한다.
// 백분위 차이는 평균이 아닌 300점 합계 척도로 비교한다.
export function referenceBand(row: ScoreReference, standard: number, average: number): ScoreBand {
  const standardGap = row.standardSum - standard;
  const percentileGap = row.percentileSum - average * 3;
  if (standardGap <= 0 && percentileGap <= 0) {
    const margin = Math.min(-standardGap, -percentileGap);
    if (margin >= 15) return '안정';
    if (margin >= 5) return '적정';
    return '가능';
  }
  if (standardGap <= 4 && percentileGap <= 3) return '소신';
  return '상향';
}

export function scoreReferences<T extends ScoreReference>(
  rows: T[], standard: number, average: number, university = '', universityOrder: readonly string[] = []
): T[] {
  const rank = (name: string) => {
    const index = universityOrder.indexOf(name);
    return index < 0 ? universityOrder.length : index;
  };
  return rows.filter(r => (!university || r.university === university)
    && r.standardSum - standard <= 12 && r.percentileSum - average * 3 <= 9)
    .sort((a, b) => rank(a.university) - rank(b.university)
      || a.university.localeCompare(b.university, 'ko')
      || b.standardSum - a.standardSum || b.percentileSum - a.percentileSum
      || a.department.localeCompare(b.department, 'ko')
      || a.admission.localeCompare(b.admission, 'ko'));
}

export function nearbyReferences<T extends { university: string; percentileSum: number }>(rows: T[], average: number, range: number, university = ''): T[] {
  return rows.filter(r => (!university || r.university === university) && Math.abs(r.percentileSum / 3 - average) <= range)
    .sort((a, b) => Math.abs(a.percentileSum / 3 - average) - Math.abs(b.percentileSum / 3 - average));
}
