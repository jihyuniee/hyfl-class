import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { canonicalUniversity, selectSusiPlans } from '../components/lib/admissionsExplorer.ts';
const json = path => JSON.parse(readFileSync(new URL(`../public/${path}`, import.meta.url)));
const records = json('admissions-2028/records.json').records;
const directory = json('admissions-explorer/directory.json');
const majors = json('admissions-explorer/majors.json');

test('외대 서울·글로벌 공통 자료를 찾되 글로벌 단독 대학으로 합치지 않는다', () => {
  assert.equal(canonicalUniversity('한국외대\n(서울/글로벌)'), '한국외대');
  assert.notEqual(canonicalUniversity('한국외대(글로벌)'), '한국외대');
  const found = selectSusiPlans(records, '한국외대', '인문·어문', '학생부종합', '있음');
  const doc = found.find(r => r.id === '2028-11-228');
  assert.ok(doc);
  assert.equal(doc.sourceKey, 'hufs-official-2028-plan');
  assert.match(doc.minimum, /서울캠퍼스:.*2개 영역 등급 합 6/);
  assert.match(doc.minimum, /글로벌캠퍼스:.*2개 영역 등급 합 7/);
  assert.ok(!found.some(r => /SW인재/.test(r.admission)));
});

test('학교·계열·전형·최저 조건을 실제 검색 함수에 적용한다', () => {
  const all = selectSusiPlans(records, '고려대', '사회·상경', '', '');
  assert.ok(all.some(r => r.category === '논술'));
  const none = selectSusiPlans(records, '고려대', '사회·상경', '학생부종합', '없음');
  assert.ok(none.length > 0);
  assert.ok(none.every(r => r.category === '학생부종합' && !r.hasMinimum));
  assert.deepEqual(selectSusiPlans(records, '없는대학', '사회·상경', '', ''), []);
});

test('학과 목록을 수시 모집 확정 목록으로 표시하지 않고 비서울 캠퍼스를 제외한다', () => {
  assert.equal(directory.universities.length, 30);
  assert.equal(directory.records.length, 472);
  assert.match(directory.notice, /수시.*확정 목록이 아닙니다/);
  const raw = Array.from({ length: 12 }, (_, i) => json(`admissions-data/part-${String(i + 1).padStart(2, '0')}.json`)).flat();
  for (const d of directory.records) {
    assert.ok(raw.some(r => r.u === d.university && r.d === d.department && r.r === '서울' && !r.l));
    assert.ok(!/글로벌캠퍼스|국제캠퍼스|ERICA/.test(d.university));
    for (const id of d.profileIds) assert.ok(majors.some(p => p.id === id));
  }
});

test('전공 공부·탐구 예시와 대학 공식 교육과정의 근거를 함께 보존한다', () => {
  assert.equal(majors.length, 10);
  for (const p of majors) {
    assert.ok(p.learn && p.question && p.method && p.skills.length);
    assert.equal(p.reviewedAt, '2026-10-29');
    for (const example of p.examples) {
      assert.ok(example.courses.length);
      assert.match(new URL(example.url).hostname, /(^|\.)(adiga\.kr|hufs\.ac\.kr|khu\.ac\.kr|yonsei\.ac\.kr|kookmin\.ac\.kr|sogang\.ac\.kr|skku\.edu|sungshin\.ac\.kr|smu\.ac\.kr)$/);
    }
  }
});

test('학교 추천 인원과 대학 최종 선발을 구분하고 안내 연도를 명시한다', () => {
  const page = readFileSync(new URL('../app/admissions/china/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /학교장 추천은 교내 1명/);
  assert.match(page, /면접이 필요할 수 있습니다/);
  assert.match(page, /학교 추천을 받는 것과 칭화대에 최종 합격하는 것은 별개/);
  assert.match(page, /담임 전달 학교 안내/);
  assert.match(page, /2028 입학 요건·일정이 확정되었다는 뜻은 아닙니다/);
  assert.match(page, /HSK 5급 이상/);
});
