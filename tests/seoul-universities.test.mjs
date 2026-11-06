import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findSeoulUniversities, resolveSeoulUniversity } from '../components/lib/seoulUniversities.ts';
const json = path => JSON.parse(readFileSync(new URL(`../public/${path}`, import.meta.url)));
const registry = json('admissions-explorer/seoul-universities.json');
const previous = json('admissions-explorer/directory.json');

test('서울 4년제 공식 조회 61개 캠퍼스를 누락 없이 56개 학교로 묶고 육사를 별도 기록한다', () => {
  assert.equal(registry.sourceCampusRows.length, 61);
  assert.equal(registry.records.length, 57);
  assert.equal(new Set(registry.records.map(r => r.id)).size, 57);
  for (const raw of registry.sourceCampusRows) {
    assert.equal(raw.cells[2], '대학(4년제)');
    assert.equal(raw.cells[5], '서울특별시');
    assert.equal(registry.records.filter(r => r.campuses.includes(raw.cells[1])).length, 1);
  }
  for (const university of previous.universities) assert.ok(registry.records.some(r => r.id === university));
  assert.deepEqual(['general','remote','special'].map(g => registry.records.filter(r => r.group === g).length), [42,12,3]);
  assert.ok(registry.records.every(r => r.sourceUrl.startsWith('https://') && r.reviewedAt === '2026-11-06'));
  assert.equal(resolveSeoulUniversity(registry.records, '육군사관학교').group, 'special');
});

test('새 학교를 정식 이름과 약칭으로 찾고 서울 밖 캠퍼스나 비슷한 대학을 섞지 않는다', () => {
  for (const query of ['경기대','경기대학교','서울교대','한국성서대','감리교신학대']) assert.ok(findSeoulUniversities(registry.records, query).length);
  assert.deepEqual(findSeoulUniversities(registry.records, '경기대').map(r => r.id), ['경기대(서울)']);
  assert.deepEqual(findSeoulUniversities(registry.records, '서울교대', 'remote'), []);
  assert.ok(!registry.records.some(r => r.id === '서울신학대' || r.id === '서울장신대'));
  assert.equal(resolveSeoulUniversity(registry.records, '가톨릭대').id, '가톨릭대(서울)');
  assert.equal(resolveSeoulUniversity(registry.records, '경기대(수원)'), undefined);
  assert.equal(resolveSeoulUniversity(registry.records, '한국외대(글로벌)'), undefined);
});
