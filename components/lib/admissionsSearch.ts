export const admissionsQuestions = [
  { id: "grades", title: "제 내신으로 어느 대학에 갈 수 있나요?", answer: "내신 평균 하나로 학종 지원 대학을 정할 수는 없어요. 대학별 평가요소와 이수 과목, 전형방법을 먼저 확인하세요. 교내 진학 사례와 개인 성적을 함께 비교하려면 성적표와 관심 대학을 준비해 담임 상담에서 확인할 수 있어요.", href: "/admissions/susi#plans", action: "대학별 수시 전형 확인" },
  { id: "early-or-regular", title: "수시와 정시 중 무엇을 준비해야 할까요?", answer: "내신과 모의고사는 서로 다른 척도예요. 수시 전형의 평가방법·수능최저와 정시의 수능·학생부 반영방법을 나란히 확인하세요. 과거 입결만으로 두 경로의 합격 가능성을 판정할 수는 없어요.", href: "/admissions/seoul#plans", action: "2028 정시 반영방법 확인" },
  { id: "major-choice", title: "어느 학과를 선택해야 할지 모르겠어요.", answer: "관심 있는 분야가 무엇을 공부하는지 살펴보고, 대학의 실제 교육과정과 비교해 보세요. 같은 이름의 학과도 배우는 내용과 전공 선택 범위가 다를 수 있어요.", href: "/admissions/susi#directory", action: "학과·교육과정 찾기" },
  { id: "minimum", title: "수능최저와 면접이 없는 전형을 찾고 싶어요.", answer: "수시 전형 화면에서 대학·전형 유형을 고르고 ‘수능최저 없음’, ‘면접 없음’으로 좁혀보세요. 일부 학과만 적용하는 예외, 탐구 반영 과목 수, 영어·한국사 조건은 각 카드의 원문에서 확인하세요.", href: "/admissions/susi#plans", action: "최저·면접 조건으로 찾기" },
  { id: "cutoff", title: "70% 컷이면 합격 확률이 70%라는 뜻인가요?", answer: "최종등록자를 대학이 공개한 성적 지표 순으로 놓았을 때 70% 지점의 성적을 뜻해요. 합격 확률, 최저 합격점, 평균 성적과는 달라요. 대학마다 산식이 달라 서로 다른 환산점수를 그대로 비교할 수 없어요.", href: "/admissions/seoul#results", action: "공개된 과거 입결 확인" },
  { id: "foreign-school", title: "외고도 학교장추천·지역균형에 지원할 수 있나요?", answer: "전형 이름이 같아도 대학마다 고교유형·졸업연도·추천 조건이 달라요. ‘추천’이라는 이름만으로 지원 가능 여부를 판단하지 말고, 해당 대학의 지원자격을 확인하세요.", href: "/admissions/susi#plans", action: "전형별 지원자격 원문 확인" },
];

type Unit = { university: string; department: string };
type SearchMatch = { title: string; description: string; kind: string; href: string };
const normalize = (text: string) => text.toLocaleLowerCase("ko").replace(/\s/g, "");
export function findAdmissionsMatches(query: string, units: readonly Unit[]): SearchMatch[] {
  const key = normalize(query);
  if (!key) return [];
  const universities = [...new Set(units.map(u => u.university))].filter(u => normalize(u).includes(key));
  const matches: SearchMatch[] = universities.flatMap(u => [
    { title: `${u} · 정시`, description: "과거 입결·2028 반영방법", kind: "대학", href: `/admissions/seoul?university=${encodeURIComponent(u)}#results` },
    { title: `${u} · 학과와 수시`, description: "학과·교육과정·수능최저·면접", kind: "대학", href: `/admissions/susi?university=${encodeURIComponent(u)}#directory` },
  ]);
  for (const q of admissionsQuestions) if (normalize(q.title + q.answer).includes(key)) matches.push({ title: q.title, description: q.action, kind: "궁금한 질문", href: `/admissions#${q.id}` });
  for (const u of units) {
    if (!normalize(u.department).includes(key)) continue;
    matches.push({ title: `${u.university} · ${u.department}`, description: "학과 탐색 목록에서 확인", kind: "학과", href: `/admissions/susi?university=${encodeURIComponent(u.university)}&q=${encodeURIComponent(u.department)}#directory` });
    if (matches.length >= 12) break;
  }
  return matches.slice(0, 12);
}
