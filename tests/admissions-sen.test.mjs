import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const data = JSON.parse(readFileSync(new URL('../public/admissions-2028/records.json', import.meta.url)));
const index = JSON.parse(readFileSync(new URL('../public/admissions-2028/sen-universities.json', import.meta.url)));
const find = id => data.records.find(record => record.id === id);

test('한국외대 SW인재와 서류형은 수능최저 필터에서 구분된다', () => {
  const regular = find('2028-11-228');
  const sw = find('sen-2028-hufs-sw');
  assert.equal(regular.hasMinimum, true);
  assert.equal(sw.hasMinimum, false);
  assert.equal(regular.verificationNote, undefined);
  assert.match(regular.minimum, /서울캠퍼스:.*2개 영역 등급 합 6 이내/);
  assert.match(regular.minimum, /글로벌캠퍼스:.*2개 영역 등급 합 7 이내/);
  assert.match(regular.minimum, /통합사회 혹은 통합과학 1과목/);
  assert.equal(regular.sourceKey, 'hufs-official-2028-plan');
  assert.equal(regular.sourcePage, 12);
  assert.equal(regular.sourcePublishedAt, '2026-04-30');
  assert.equal(regular.reviewedAt, '2026-10-25');
  assert.match(regular.sourceUrl, /^https:\/\/adms\.hufs\.ac\.kr\/ajaxfile\//);
  assert.match(regular.notes, /최종 2028학년도 수시 모집요강/);
  assert.equal(sw.verificationNote, undefined);
});
test('중앙대 UP 최저와 의학부 면접, 성균관대 과학인재 면접을 누락하지 않는다', () => {
  assert.equal(find('2028-11-223').hasMinimum, true);
  assert.equal(find('2028-11-182').hasInterview, true);
  assert.match(find('2028-11-182').verificationNote, /5배수.*3배수/);
  assert.equal(find('2028-10-169').hasInterview, true);
  assert.match(find('2028-10-169').method, /70%.*30%/);
});
test('연세대 논술에 서로 모순되는 최저 미적용 중복 행이 남지 않는다', () => {
  const yonsei = data.records.filter(row => row.university === '연세대' && row.category === '논술');
  assert.equal(yonsei.length, 1);
  assert.equal(yonsei[0].hasMinimum, true);
  assert.match(yonsei[0].minimum, /국어·수학 필수/);
});
test('모든 검색 카드와 82개 대학 쪽수는 중복 없이 출처를 추적할 수 있다', () => {
  assert.equal(new Set(data.records.map(row => row.id)).size, data.records.length);
  const reviewed = data.records.filter(row => row.sourceKey === 'sen-20261014');
  assert.equal(reviewed.length, data.senReviewedRecords);
  for (const row of reviewed) {
    assert.ok(row.sourcePage >= 98 && row.sourcePage <= 334);
    assert.equal(row.sourceUrl, '/admissions-2028/sen-preview-20261014.pdf');
  }
  assert.equal(index.length, 82);
  assert.equal(new Set(index.map(row => row.name)).size, 82);
  for (const row of index) assert.ok(row.page <= row.endPage && row.endPage <= 334);
});

// Execute the actual page filter chain, so these checks cover the search UI's
// keyword/category/minimum/interview combination without duplicating its logic.
test('2028 검색에서 외대 서류형·SW인재와 캠퍼스별 최저를 찾을 수 있다', () => {
  const page = readFileSync(new URL('../app/admissions/page.tsx', import.meta.url), 'utf8');
  const chain = page.match(/return planRows([\s\S]*?)\.sort\(comparePlanRecords\)/)[1];
  const search = new Function('planRows', 'planKeyword', 'planField', 'planCategory', 'planMinimum', 'planInterview', 'holisticEvaluation',
    `const query = planKeyword.trim().toLocaleLowerCase("ko"); return planRows${chain};`);
  const run = (keyword, minimum = '전체', interview = '전체', field = '전체') =>
    search(data.records, keyword, field, '학생부종합', minimum, interview, () => '').map(r => r.id);
  assert.deepEqual(run('한국외대', '있음', '없음'), ['2028-11-228']);
  assert.ok(run('한국외대', '없음').includes('sen-2028-hufs-sw'));
  assert.ok(!run('한국외대', '없음').includes('2028-11-228'));
  assert.ok(!run('SW인재', '있음').includes('sen-2028-hufs-sw')); // Notes can mention other tracks.
  assert.ok(run('SW인재', '없음').includes('sen-2028-hufs-sw'));
  assert.ok(run('서류형', '있음', '없음', '인문·어문').includes('2028-11-228'));
  assert.ok(run('서울캠퍼스: 국어').includes('2028-11-228'));
  assert.ok(run('글로벌캠퍼스: 국어').includes('2028-11-228'));
  assert.deepEqual(run('한국외대', '있음', '있음'), []);
});
