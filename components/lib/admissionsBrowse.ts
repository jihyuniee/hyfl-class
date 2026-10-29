export const percentileBands = [
  { id: "95", label: "95 이상", min: 95, max: 101 },
  { id: "90", label: "90 이상 ~ 95 미만", min: 90, max: 95 },
  { id: "85", label: "85 이상 ~ 90 미만", min: 85, max: 90 },
  { id: "80", label: "80 이상 ~ 85 미만", min: 80, max: 85 },
  { id: "under80", label: "80 미만", min: 0, max: 80 },
];
export type PercentileResult = { univ: string; dept: string; year: number; cut_pct70: number | null; mean_pct?: number | null; source: string; metric_note: string };
// Keep each department's latest published 70% percentile cut. A newer converted-only row must not erase it.
export function latestPercentileResults<T extends PercentileResult>(rows: T[]): T[] {
  const latest = new Map<string, T>();
  for (const row of rows) {
    if (row.cut_pct70 === null || !Number.isFinite(row.cut_pct70)) continue;
    const key = `${row.univ}/${row.dept}`;
    if (!latest.has(key) || latest.get(key)!.year < row.year) latest.set(key, row);
  }
  return [...latest.values()].sort((a, b) => b.cut_pct70! - a.cut_pct70! || a.univ.localeCompare(b.univ, "ko") || a.dept.localeCompare(b.dept, "ko"));
}
export function inPercentileBand(row: PercentileResult, id: string): boolean {
  const band = percentileBands.find(b => b.id === id);
  return Boolean(band && row.cut_pct70 !== null && row.cut_pct70 >= band.min && row.cut_pct70 < band.max);
}
// A short preview spans universities, then fills remaining slots in score order.
export function previewPercentileResults<T extends PercentileResult>(rows: T[], count = 3): T[] {
  const picked: T[] = [];
  for (const row of rows) if (!picked.some(r => r.univ === row.univ) && picked.length < count) picked.push(row);
  for (const row of rows) if (!picked.includes(row) && picked.length < count) picked.push(row);
  return picked;
}

// Exploratory labels are narrower than the source's broad admissions categories.
export function belongsToProfile(department: string, id: string): boolean {
  const patterns: Record<string, RegExp> = {
    'chinese-language': /중어|중국언어|중국문화|중국어문|중국학/,
    'china-trade': /중국외교|중국정경|중국지역/,
    english: /영어|영문|영미/,
    politics: /정치|외교|국제관계|국제학|행정/,
    business: /경영|회계|마케팅/,
    economics: /경제|통상|무역/,
    sociology: /사회학|사회복지/,
    media: /미디어|언론|방송|커뮤니케이션|광고|홍보/,
    psychology: /심리/,
    education: /교육|사범/,
  };
  return patterns[id]?.test(department) ?? false;
}
