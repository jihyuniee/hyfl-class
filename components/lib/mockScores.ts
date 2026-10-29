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
export function nearbyReferences<T extends { university: string; percentileSum: number }>(rows: T[], average: number, range: number, university = ''): T[] {
  return rows.filter(r => (!university || r.university === university) && Math.abs(r.percentileSum / 3 - average) <= range)
    .sort((a, b) => Math.abs(a.percentileSum / 3 - average) - Math.abs(b.percentileSum / 3 - average));
}
