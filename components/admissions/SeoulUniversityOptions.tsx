import registry from '@/public/admissions-explorer/seoul-universities.json';
import { universityGroups } from '@/components/lib/seoulUniversities';

export default function SeoulUniversityOptions() {
  return <>{universityGroups.map(group => <optgroup key={group.id} label={group.label}>
    {registry.records.filter(row => row.group === group.id).map(row => <option key={row.id} value={row.id}>{row.name}{row.id.endsWith('(서울)') ? ' · 서울 캠퍼스' : ''}</option>)}
  </optgroup>)}</>;
}
