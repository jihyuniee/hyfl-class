export type Evidence = { id: string; title: string; text: string; href: string; source: string; university?: string; kind: string };
export const normalizeQuestion = (s: string) => s.toLowerCase().replace(/한국외국어대(?:학교)?/g, '한국외대').replace(/대학교/g, '대').replace(/\s/g, '');

export function retrieveEvidence(question: string, evidence: Evidence[]) {
  const q = normalizeQuestion(question);
  const universities = [...new Set(evidence.map(e => e.university).filter((u): u is string => !!u))].filter(u => q.includes(normalizeQuestion(u)));
  const terms = question.match(/[가-힣a-zA-Z0-9%]+/g) ?? [];
  const grams = [...new Set(terms.flatMap(t => Array.from({ length: Math.max(0, t.length - 1) }, (_, i) => normalizeQuestion(t.slice(i, i + 2)))))];
  const preferred = /입결|컷|합격.*성적|경쟁률/.test(q) ? 'result' : /반영|비율|정시/.test(q) ? 'regular' : /학과|전공|중국|경영|배우/.test(q) && !/최저|전형|면접|지원자격/.test(q) ? 'major' : 'early';
  return evidence.filter(e => !universities.length || !e.university || universities.includes(e.university)).map(e => {
    const text = normalizeQuestion(e.title + e.text);
    const overlap = grams.filter(g => text.includes(g)).length;
    return { e, score: overlap ? overlap + (e.kind === preferred ? 12 : 0) + (e.university && universities.includes(e.university) ? 15 : 0) : 0 };
  }).filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, 18).map(r => r.e);
}

export function parseGroundedAnswer(value: unknown, evidence: Evidence[]) {
  if (!value || typeof value !== 'object') throw new Error('Invalid answer');
  const result = value as { answer?: unknown; sourceIds?: unknown };
  if (typeof result.answer !== 'string' || !result.answer.trim() || !Array.isArray(result.sourceIds)) throw new Error('Invalid answer');
  const ids = result.sourceIds;
  if (!ids.length || ids.some(id => typeof id !== 'string' || !evidence.some(e => e.id === id))) throw new Error('Invalid citations');
  return { answer: result.answer, sources: evidence.filter(e => ids.includes(e.id)).map(({ id, title, href, source }) => ({ id, title, href, source })) };
}

// Personal admission predictions cannot be derived from the site's plan/regular-result data.
// Handle these without asking a model to infer a cutoff from unrelated grade numbers.
export function personalScoreGuidance(question: string): string | null {
  const q = normalizeQuestion(question);
  const personal = /내성적|제성적|내점수|제점수|내내신|제내신/.test(q);
  const score = /(?:내신|등급|백분위|표준점수|모의고사|표점)/.test(q);
  const prediction = /어느대|어떤대|어디|갈수|갈만|갈수있|합격|가능|지원|추천|상향|소신|적정|안정/.test(q);
  const gradeNumber = /내신.*\d|\d(?:\.\d+)?등급|백분위.*\d|표준점수.*\d/.test(q);
  if (!(personal && prediction) && !(score && prediction) && !(/내신/.test(q) && (gradeNumber || /컷|입결/.test(q)))) return null;
  return '현재 등록된 자료만으로 개인 성적에 맞는 합격 대학이나 상향·적정·안정을 판정할 수는 없습니다.\n\n내신 등급과 수능 등급은 서로 다른 성적입니다. 수능최저의 ‘2개 영역 등급 합 6’ 같은 조건에 내신 평균을 대입해 비교하면 안 됩니다. 수시 시행계획의 수능최저는 내신 지원 최소 등급이나 합격선이 아닙니다.\n\n이 사이트에서는 대학별 전형방법·수능최저와 공개된 과거 정시 입결을 확인할 수 있습니다. 과거 정시 입결도 내신 합격선으로 사용할 수 없습니다.\n\n‘한국외대 서류형의 수능최저는?’, ‘숭실대 경영학과의 공개 정시 입결은?’처럼 대학·전형·학과를 지정해 질문해 보세요. 개인 지원 대학 판단은 과목별 내신, 모의고사, 이수 과목, 관심 전형을 함께 준비해 담임 상담에서 확인하세요.';
}
