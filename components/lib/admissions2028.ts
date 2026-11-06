export const admissions2028Facts = [
  {
    id: '2028-exam-date', label: '2028학년도 수능', value: '2027.11.18.(목)',
    detail: '성적 통지일은 2027.12.10.(금)입니다.',
    source: '교육부 · 2025.06.01. 발표', reviewedAt: '2026-11-06',
    url: 'https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=294&boardSeq=103512&lev=0&m=020402&opType=N&s=moe&statusYN=W',
  },
  {
    id: '2028-exam-subjects', label: '수능 체제', value: '선택과목 없는 통합형',
    detail: '국어·수학·탐구 선택과목을 폐지하고, 사회·과학탐구는 통합사회·통합과학으로 출제합니다.',
    source: '교육부 · 2025.01.20. 발표', reviewedAt: '2026-11-06',
    url: 'https://m.korea.kr/news/policyNewsView.do?newsId=148938778',
  },
  {
    id: '2028-admissions-plans', label: '대학별 전형 자료', value: '2028 시행계획 공개',
    detail: '대교협이 2026.04.30. 발표했습니다. 최종 모집요강은 별도로 확인해야 합니다.',
    source: '한국대학교육협의회 · 2026.04.30. 발표', reviewedAt: '2026-11-06',
    url: 'https://www.kcue.or.kr/news/sub02/sub01.php?at=view&idx=2765091',
  },
] as const;

// A past result cannot supply a cutoff for the 2028 admissions cycle.
export function admissions2028ResultGuidance(question: string): string | null {
  const q = question.replace(/\s/g, '');
  if (!/2028/.test(q) || !/입결|합격선|합격컷|70%?컷|백분위.*컷|컷.*백분위|최종등록|등록자.*평균/.test(q)) return null;
  return '2028학년도 실제 입결과 합격선은 현재 확인할 수 없습니다. 2028학년도 수능은 2027년 11월 18일에 시행됩니다. 현재 확인할 수 있는 2028 자료는 대학별 시행계획이며, 사이트의 2024~2026학년도 입결은 과거 결과입니다. 과거 점수를 2028 합격선이나 상향·적정·안정 기준으로 바꾸어 제시하지 않습니다. 대학별 2028 전형방법·반영비율·수능최저와 원문 출처를 확인하세요.';
}
