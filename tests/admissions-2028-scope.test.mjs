import { test } from 'node:test';
import assert from 'node:assert/strict';
import { admissions2028ResultGuidance, admissions2028Facts } from '../components/lib/admissions2028.ts';
import { selectSusiPlans } from '../components/lib/admissionsExplorer.ts';

test('2028 실제 입결 요청에 과거 컷을 대신 제시하지 않는다', () => {
  for (const q of ['2028 한국외대 정시 입결', '2028 숭실대 70% 컷 알려줘', '2028 최종등록자 평균', '2026과 2028 합격선 비교']) {
    assert.match(admissions2028ResultGuidance(q), /실제 입결과 합격선은 현재 확인할 수 없습니다/);
  }
  for (const q of ['2028 한국외대 수능최저', '2028 서강대 정시 수학 반영비율', '2026 숭실대 70% 컷']) {
    assert.equal(admissions2028ResultGuidance(q), null);
  }
  assert.ok(admissions2028Facts.every(f => f.url.startsWith('https://') && f.reviewedAt === '2026-11-06'));
});

test('전체 대학 탐색에서 전형 이름이 같아도 다른 대학 기록을 지우지 않는다', () => {
  const shared = { category: '학생부종합', admission: '일반전형', method: '서류', minimum: '없음', notes: '', fields: ['인문·어문'], hasMinimum: false, hasInterview: false, sourceKey: 'sen-20261014' };
  const rows = [{ ...shared, id: 'a', university: 'A대' }, { ...shared, id: 'b', university: 'B대' }];
  assert.deepEqual(selectSusiPlans(rows, '', '', '', '').map(r => r.id), ['a', 'b']);
  assert.deepEqual(selectSusiPlans(rows, 'B대', '', '', '').map(r => r.id), ['b']);
});
