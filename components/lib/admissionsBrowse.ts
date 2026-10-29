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

// Curated links are exploratory connections, not declarations of a single major.
// An empty list means no specific guide is linked; broad source categories alone
// must not turn 자유전공, 언어, 사회과학, or 정책 into a narrower discipline.
export type BrowseUnit = { department: string; classification: string; profileIds: readonly string[] };
export function belongsToProfile(unit: BrowseUnit, id: string): boolean {
  return unit.profileIds.includes(id);
}

export function chooseUnitProfile(unit: BrowseUnit, active: string): string {
  if (belongsToProfile(unit, active)) return active;
  return unit.profileIds.length === 1 ? unit.profileIds[0] : "";
}

export function unitAdmissionField(unit: BrowseUnit): string {
  if (/사범|교육/.test(unit.classification)) return "교육";
  if (/어문|인문학/.test(unit.classification)) return "인문·어문";
  // Broad or interdisciplinary units require the student's own field choice.
  if (/자유전공|기타/.test(unit.classification)) return "";
  return "사회·상경";
}
