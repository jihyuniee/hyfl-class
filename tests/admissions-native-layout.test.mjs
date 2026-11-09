import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('admissions explorer shares the class page shell without another document or frame',()=>{
 const page=fs.readFileSync('app/admissions/seoul/page.tsx','utf8');
 const component=fs.readFileSync('app/admissions/seoul/SeoulAdmissions.tsx','utf8');
 const score=fs.readFileSync('components/admissions/MockScoreExplorer.tsx','utf8');
 assert.match(page,/return <SeoulAdmissions/);
 assert.doesNotMatch(page+component+score,/<(?:iframe|html|body|main|footer)\b/i);
 assert.doesNotMatch(component,/한영외고 2학년 2반|학급 대입 홈/);
 assert.match(component,/AdmissionsNav current="regular"/);
 assert.match(fs.readFileSync('app/admissions/page.tsx','utf8'),/return <AdmissionsHome/);
});
