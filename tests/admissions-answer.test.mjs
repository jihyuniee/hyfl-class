import { test } from 'node:test';
import assert from 'node:assert/strict';
import { retrieveEvidence, parseGroundedAnswer } from '../components/lib/admissionsAnswer.ts';
const docs = [
 { id: 'hufs', university: '한국외대', title: '2028 한국외대 서류형 수능최저', text: '서울 2합6', href: '/a', source: '2028 시행계획', kind: 'early' },
 { id: 'snu', university: '서울대', title: '2028 서울대 수능최저', text: '일반전형', href: '/b', source: '2028 시행계획', kind: 'early' },
 { id: 'old', university: '한국외대', title: '2025 한국외대 경영 입결 70%컷', text: '과거 결과', href: '/c', source: '2025 결과', kind: 'result' },
];
test('university aliases restrict results without leaking another university', () => {
 const found = retrieveEvidence('한국외국어대학교 수능최저 알려줘', docs);
 assert.equal(found[0].id, 'hufs'); assert.ok(!found.some(e => e.id === 'snu'));
});
test('comparison retrieves both universities', () => { const found = retrieveEvidence('한국외대 서울대 수능최저 비교', docs); assert.ok(found.some(e => e.id === 'hufs')); assert.ok(found.some(e => e.id === 'snu')); });
test('past results prioritized for cutoff questions', () => { assert.equal(retrieveEvidence('한국외대 경영 입결 70%컷', docs)[0].id, 'old'); });
test('unrelated queries do not fabricate evidence', () => { assert.deepEqual(retrieveEvidence('피자 레시피', docs), []); });
test('citations must reference retrieved evidence', () => {
 assert.throws(() => parseGroundedAnswer({ answer: '답변', sourceIds: ['fake'] }, docs));
 assert.throws(() => parseGroundedAnswer({ answer: '답변', sourceIds: [] }, docs));
 assert.deepEqual(parseGroundedAnswer({ answer: '답변 [hufs]', sourceIds: ['hufs'] }, docs).sources.map(s => s.id), ['hufs']);
});
