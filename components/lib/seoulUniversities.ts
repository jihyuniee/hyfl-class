export type SeoulUniversity = {
  id: string; name: string; type: string; group: string; region: string;
  campuses: string[]; website: string | null; sourceUrl: string; reviewedAt: string; note: string;
};

export const universityGroups = [
  { id: 'general', label: '일반·교육대학' },
  { id: 'remote', label: '사이버·방송통신대학' },
  { id: 'special', label: '기타·별도 선발' },
];

const normalize = (value: string) => value.replace(/\s/g, '').toLocaleLowerCase('ko');
export function findSeoulUniversities(rows: readonly SeoulUniversity[], query: string, group = '') {
  const key = normalize(query);
  return rows.filter(row => (!group || row.group === group)
    && normalize(`${row.id} ${row.name} ${row.campuses.join(' ')}`).includes(key));
}

// A Seoul-only listing must not inherit an entire university's other campuses.
// In particular, 가톨릭대 and 경기대 source rows are not Seoul-scoped by name alone.
export function resolveSeoulUniversity(rows: readonly SeoulUniversity[], value: string) {
  return rows.find(row => row.id === value || row.name === value
    || (row.id.endsWith('(서울)') && row.id.replace(/\(서울\)$/, '') === value));
}
