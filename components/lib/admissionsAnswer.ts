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
