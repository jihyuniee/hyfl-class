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

test('표준점수 합을 계산하고 빈칸·과목별 범위 오류를 거른다', async () => {
 const {mockStandard} = await import('../components/lib/mockScores.ts');
 assert.equal(mockStandard(['130','125','65','66']),386);
 assert.equal(mockStandard(['0','0','0','0']),0);
 for (const scores of [['','125','65','66'], ['130','125','101','66'], ['201','125','65','66'], ['130','125','65'], ['130','125','65','66','1']]) assert.equal(mockStandard(scores),null);
});

test('기존 다섯 구간의 경계를 두 점수로 함께 판별한다', async () => {
 const {referenceBand} = await import('../components/lib/mockScores.ts');
 const row = {university:'A', department:'학과', admission:'일반', group:'가', standardSum:400, percentileSum:270};
 assert.equal(referenceBand(row,415,95),'안정');
 assert.equal(referenceBand(row,415,94),'적정');
 assert.equal(referenceBand(row,405,275/3),'적정');
 assert.equal(referenceBand(row,404,95),'가능');
 assert.equal(referenceBand(row,400,90),'가능');
 assert.equal(referenceBand(row,396,89),'소신');
 assert.equal(referenceBand(row,395,89),'상향');
 assert.equal(referenceBand(row,420,88.99),'상향');
 assert.equal(referenceBand(row,399,100),'소신');
});

test('표준점수·백분위 어느 한쪽이라도 상향 범위를 넘으면 제외하고 대학 필터를 적용한다', async () => {
 const {scoreReferences} = await import('../components/lib/mockScores.ts');
 const base={department:'학과', admission:'일반', group:'가'};
 const rows=[
  {...base,university:'A',standardSum:412,percentileSum:279},
  {...base,university:'B',standardSum:413,percentileSum:270},
  {...base,university:'C',standardSum:400,percentileSum:280},
  {...base,university:'D',standardSum:380,percentileSum:250},
 ];
 assert.deepEqual(scoreReferences(rows,400,90).map(r=>r.university),['A','D']);
 assert.deepEqual(scoreReferences(rows,400,90,'D').map(r=>r.university),['D']);
 assert.deepEqual(scoreReferences(rows,400,90,'없는대학'),[]);
 assert.deepEqual(scoreReferences(rows,400,90,'',['D','A']).map(r=>r.university),['D','A']);
});

test('411·98.39 입력에서 서울대·연고대를 포함하고 원자료의 점수와 기존 분류를 보존한다', async () => {
 const {readFileSync} = await import('node:fs');
 const {referenceBand, scoreReferences} = await import('../components/lib/mockScores.ts');
 const rows=JSON.parse(readFileSync(new URL('../public/admissions-explorer/reference.json',import.meta.url)));
 const result=scoreReferences(rows,411,98.39,'',['서울대','연세대','고려대']);
 for (const university of ['서울대','연세대','고려대']) assert.ok(result.some(r=>r.university===university),university);
 assert.equal(result[0].university,'서울대');
 assert.ok(result.some(r=>r.university==='서울대' && referenceBand(r,411,98.39)==='상향'));
 const legacy=(row,standard,average)=>{
   const sg=row.standardSum-standard, pg=row.percentileSum-average*3;
   if(sg<=0 && pg<=0){ const margin=Math.min(-sg,-pg); return margin>=15?'안정':margin>=5?'적정':'가능'; }
   return Math.max(0,sg)<=4 && Math.max(0,pg)<=3?'소신':'상향';
 };
 for(const [standard,average] of [[411,98.39],[400,90],[380,85],[300,60],[0,0],[443,100]]) {
   for(const row of rows) assert.equal(referenceBand(row,standard,average),legacy(row,standard,average));
 }
 assert.equal(rows.length,502);
 for(const row of result) assert.ok(rows.includes(row));
});
