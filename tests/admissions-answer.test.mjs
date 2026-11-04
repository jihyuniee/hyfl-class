import { test } from 'node:test';
import assert from 'node:assert/strict';
import { retrieveEvidence, parseGroundedAnswer, personalScoreGuidance, cutoffTermGuidance, foreignSchoolGuidance } from '../components/lib/admissionsAnswer.ts';
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

test('personal grade questions cannot use exam minimums as admission grade cutoffs', () => {
 for (const q of ['내신 3.8등급이면 서울에 있는 어느 대학에 합격할 수 있어?', '제 성적으로 갈 수 있는 대학 추천해줘', '백분위 85면 어디 갈 수 있어?', '내신 3.8', '한국외대 내신 컷은?']) {
   assert.match(personalScoreGuidance(q), /내신 등급과 수능 등급은 서로 다른/);
 }
 for (const q of ['한국외대 서류형 수능최저는?', '숭실대 경영학과의 공개 정시 입결은?', '70% 컷 뜻 알려줘', '한국외대 내신 반영방법']) assert.equal(personalScoreGuidance(q), null);
});

test('70% cutoff definitions distinguish rank, average and probability', () => {
 assert.match(cutoffTermGuidance('70% 컷이면 합격 확률이 70%라는 뜻이야?'), /높은 순서/);
 assert.match(cutoffTermGuidance('70% 컷의 의미'), /평균 성적과도 다릅니다/);
 assert.equal(cutoffTermGuidance('숭실대 경영학과 70% 컷은 얼마야?'), null);
});

test('absence of an exclusion is not evidence of foreign-school eligibility', () => {
 assert.match(foreignSchoolGuidance('외고 학생도 학교장추천이나 지역균형에 지원할 수 있어?'), /지원 가능하다는 뜻은 아닙니다/);
 assert.match(foreignSchoolGuidance('한국외대 외고 지원 가능?'), /지원자격/);
 assert.equal(foreignSchoolGuidance('한국외대 서류형 수능최저는?'), null);
});
