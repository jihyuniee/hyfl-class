type School = { id: string; name: string; campuses: readonly string[] };
type HistoricalUnit = { univ: string; dept: string };
type MajorGuide = { id: string; title: string; field: string; keywords: readonly string[] };

const compact = (value: string) => value.normalize("NFKC").toLocaleLowerCase("ko").replace(/[\s·.,/()\-]/g, "");

export function filterAdmissionsDirectory(query: string, schools: readonly School[], historicalUnits: readonly HistoricalUnit[], guides: readonly MajorGuide[]) {
  const key = compact(query.trim());
  const terms = query.trim().split(/\s+/).map(compact).filter(Boolean);
  if (!key) return { schools: [], historicalUnits: [], guides: [] };
  const matches = (...values: string[]) => {
    const parts = values.map(compact);
    return parts.some(part => part.includes(key)) || terms.every(term => parts.some(part => part.includes(term)));
  };
  const foundUnits = new Map<string, HistoricalUnit>();
  for (const unit of historicalUnits) {
    const school = schools.find(school => school.id === unit.univ || unit.univ === `${school.id} 서울`);
    if (matches(unit.univ, unit.dept, school?.name || "")) {
      foundUnits.set(JSON.stringify([unit.univ, unit.dept]), unit);
    }
  }
  return {
    schools: schools.filter(school => matches(school.id, school.name, ...school.campuses)),
    historicalUnits: [...foundUnits.values()].sort((a, b) => a.univ.localeCompare(b.univ, "ko") || a.dept.localeCompare(b.dept, "ko")),
    guides: guides.filter(guide => matches(guide.title, guide.field, ...guide.keywords)),
  };
}
