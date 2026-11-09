import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('public/admissions-2028-explorer/data.json','utf8'));
const original=p=>JSON.parse(fs.readFileSync(p,'utf8'));
test('explorer only republishes repository school, plan and historical-result records',()=>{
 assert.deepEqual(data.registry,original('public/admissions-explorer/seoul-universities.json'));
 assert.deepEqual(data.plans,original('public/admissions-seoul/plans.json'));
 assert.deepEqual(data.results,original('public/admissions-seoul/results.json'));
 const records=original('public/admissions-2028/records.json').records;
 for(const record of data.early){assert.ok(records.some(r=>JSON.stringify(r)===JSON.stringify(record)));assert.ok(['sen-20261014','hufs-official-2028-plan'].includes(record.sourceKey));assert.ok(!record.verificationNote);}
 assert.equal(data.registry.records.filter(s=>s.group==='general').length,42);
});
test('score screen has no persistence, outbound score transport or reference-score dataset',()=>{
 const js=fs.readFileSync('public/admissions-2028-explorer/app.js','utf8');
 assert.doesNotMatch(js,/localStorage|sessionStorage|indexedDB|sendBeacon|XMLHttpRequest|referenceBand|standardSum|percentileSum/);
 assert.deepEqual([...js.matchAll(/fetch\(([^)]+)\)/g)].map(m=>m[1]),["'data.json'"]);
 assert.equal(Object.keys(data).includes('reference'),false);
});
