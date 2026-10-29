import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mockPercentile, readScore, nearbyReferences} from '../components/lib/mockScores.ts';
test('네 과목을 검증하고 탐구 평균을 국수와 같은 비중으로 계산한다',()=>{
 assert.equal(mockPercentile(['90','80','100','60']),250/3);
 assert.equal(mockPercentile(['0','0','0','0']),0);
 for(const v of ['', '-1','101','NaN','Infinity']) assert.equal(mockPercentile([v,'80','90','90']),null);
 assert.equal(readScore(' ',100),null);
});
test('지원참고 예상점수를 가까운 순서로 보되 대학 필터와 경계를 지킨다',()=>{
 const rows=[{university:'A',percentileSum:270},{university:'B',percentileSum:279},{university:'C',percentileSum:300}];
 assert.deepEqual(nearbyReferences(rows,90,3).map(r=>r.university),['A','B']);
 assert.deepEqual(nearbyReferences(rows,90,3,'B').map(r=>r.university),['B']);
 assert.deepEqual(nearbyReferences(rows,90,3,'없는대학'),[]);
});
