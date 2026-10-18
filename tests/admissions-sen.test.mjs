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
  assert.match(regular.verificationNote, /27쪽.*309쪽/);
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
