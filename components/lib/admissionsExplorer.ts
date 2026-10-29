export type SusiPlan = {
  id: string; university: string; category: string; admission: string;
  method: string; minimum: string; notes: string; fields: string[];
  hasMinimum: boolean; hasInterview: boolean; minimumScope?: string;
  sourceKey?: string; sourceLabel?: string; sourceUrl?: string;
  sourcePage?: number; reviewedAt?: string; verificationNote?: string;
};

export function canonicalUniversity(value: string): string {
  const name = value.replace(/\s/g, "");
  if (name === "한국외대(서울/글로벌)" || name === "한국외대서울" || name === "한국외대(서울)") return "한국외대";
  return name.replace(/\(서울\)$/, "");
}

export function selectSusiPlans(records: SusiPlan[], university: string, field: string, category: string, minimum: string) {
  const candidates = records.filter(r => canonicalUniversity(r.university) === university
    && r.fields.includes(field) && (!category || r.category === category)
    && (!minimum || (minimum === "있음" ? r.hasMinimum : !r.hasMinimum))
    && !/SW인재|소프트웨어인재|과학인재|의학부/.test(r.admission));
  const priority = (r: SusiPlan) => r.sourceKey === "hufs-official-2028-plan" ? 3 : r.sourceKey === "sen-20261014" ? 2 : 1;
  const found = new Map<string, SusiPlan>();
  for (const row of candidates) {
    const key = `${row.category}/${row.admission.replace(/\s/g, "")}`;
    const previous = found.get(key);
    if (!previous || priority(row) > priority(previous)) found.set(key, row);
  }
  return [...found.values()].sort((a, b) => a.category.localeCompare(b.category, "ko") || a.admission.localeCompare(b.admission, "ko"));
}
