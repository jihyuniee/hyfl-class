import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('admissions explorer shares the class page shell without another document or frame',()=>{
 const page=fs.readFileSync('app/admissions/seoul/page.tsx','utf8');
 const component=fs.readFileSync('components/admissions/NativeAdmissionsExplorer.tsx','utf8');
 const markup=JSON.parse(fs.readFileSync('components/admissions/nativeExplorerMarkup.json','utf8'));
 assert.match(page,/NativeAdmissionsExplorer/);
 assert.doesNotMatch(page+component+markup,/<iframe|<html|<body|<main|<header|<footer/i);
 assert.doesNotMatch(markup,/한영외고 2학년 2반|학급 대입 홈/);
 assert.match(component,/AdmissionsNav current="regular"/);
 assert.match(fs.readFileSync('app/admissions/page.tsx','utf8'),/return <AdmissionsHome/);
});
