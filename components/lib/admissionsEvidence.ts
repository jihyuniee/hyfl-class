import records from '@/public/admissions-2028/records.json';
import results from '@/public/admissions-seoul/results.json';
import plans from '@/public/admissions-seoul/plans.json';
import directory from '@/public/admissions-explorer/directory.json';
import { admissionsQuestions } from './admissionsSearch';
import { selectSusiPlans, canonicalUniversity } from './admissionsExplorer';
import type { Evidence } from './admissionsAnswer';

const early = [...new Set(records.records.map(r => canonicalUniversity(r.university)))].flatMap(u => selectSusiPlans(records.records, u, '', '', ''));
export const admissionsEvidence: Evidence[] = [
  ...early.map(r => ({ id: r.id, title: `2028 ${r.university} ${r.admission}`, university: canonicalUniversity(r.university), kind: 'early', text: JSON.stringify({ method: r.method, minimum: r.minimum, notes: r.notes, minimumScope: r.minimumScope, reviewedAt: r.reviewedAt }), href: `${r.sourceUrl ?? '/admissions/susi#plans'}${r.sourcePage ? `#page=${r.sourcePage}` : ''}`, source: `${r.sourceLabel} · ${r.sourcePage ?? ''}쪽 · 시행계획, 최종 모집요강 재확인` })),
  ...results.map((r, i) => ({ id: `result-${i}`, title: `${r.year} ${r.univ} ${r.dept} 정시 입결`, university: canonicalUniversity(r.univ), kind: 'result', text: JSON.stringify(r), href: r.source, source: `${r.year}학년도 결과 · ${r.source_note}` })),
  ...plans.map((r, i) => ({ id: `regular-${i}`, title: `${r[0]} ${r[1]} ${r[2]} ${r[3]} 정시 반영방법`, university: canonicalUniversity(String(r[1])), kind: 'regular', text: JSON.stringify({ year: r[0], admission: r[2], scope: r[3], koreanPercent: r[4], mathPercent: r[5], englishPercent: r[6], inquiryPercent: r[7], detail: r[8], examPercent: r[9], other: r[10], metric: r[11], english: r[12], note: r[13] }), href: String(r[15]), source: `2028 시행계획 사본 · ${r[14]}` })),
  ...directory.records.map((r, i) => ({ id: `major-${i}`, title: `${r.university} ${r.department}`, university: r.university, kind: 'major', text: `${r.classification}. ${directory.notice} 출처: ${directory.source}`, href: `/admissions/susi?university=${encodeURIComponent(r.university)}#directory`, source: '학과 탐색용 참고 목록 · 공식 모집 확정 자료 아님' })),
  ...admissionsQuestions.map(r => ({ id: `faq-${r.id}`, title: r.title, kind: 'faq', text: r.answer, href: r.href, source: '사이트 이용 안내 · 대학별 조건의 근거로 사용 불가' })),
];
