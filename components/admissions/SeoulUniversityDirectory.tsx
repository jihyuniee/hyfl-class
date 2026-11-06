"use client";

import { useState } from 'react';
import Link from 'next/link';
import registry from '@/public/admissions-explorer/seoul-universities.json';
import results from '@/public/admissions-seoul/results.json';
import plans from '@/public/admissions-seoul/plans.json';
import { findSeoulUniversities, universityGroups } from '@/components/lib/seoulUniversities';
import styles from './explorer.module.css';

export default function SeoulUniversityDirectory({ university, onUniversityChange }: { university: string; onUniversityChange: (value: string) => void }) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('');
  const [limit, setLimit] = useState(12);
  const rows = findSeoulUniversities(registry.records, query, group);

  return <section id="universities" className={styles.section} aria-labelledby="seoul-university-heading">
    <div className={styles.sectionHeading}><h2 id="seoul-university-heading">서울 소재 대학 전체 찾아보기</h2><span>{registry.records.length}개 학교 · 기준 확인 {registry.reviewedAt}</span></div>
    <p>일반·교육대학 42곳, 사이버·방송통신대학 12곳, 기타·별도 선발 3곳을 구분했습니다. 학교의 서울 소재 여부와 2028 합격 가능성은 서로 다른 정보입니다.</p>
    <div className={styles.compactFields} role="group" aria-label="서울 대학 유형"><button type="button" aria-pressed={!group} onClick={() => { setGroup(''); setLimit(12); }}>전체 57곳</button>{universityGroups.map(g => <button type="button" key={g.id} aria-pressed={group === g.id} onClick={() => { setGroup(g.id); setLimit(12); }}>{g.label}</button>)}</div>
    <label className={styles.searchLabel}>서울 대학 이름 검색<input className={styles.universitySelect} type="search" placeholder="예: 경기대, 서울교대, 한국성서대" value={query} onChange={e => { setQuery(e.target.value); setLimit(12); }} /></label>
    <p role="status" className={styles.muted}>학교 {rows.length}곳 · 가나다순 · 합격 가능성 순위가 아닙니다.</p>
    <div className={styles.universityGrid}>{rows.slice(0, limit).map(row => {
      const resultCount = results.filter(r => r.univ === row.id || r.univ === `${row.id} 서울`).length;
      const planCount = plans.filter(p => p[1] === row.id || p[1] === `${row.id} 서울`).length;
      return <article key={row.id} className={styles.universityCard}>
        <small>{row.type} · {row.region}</small><h3>{row.name}{row.id.endsWith('(서울)') && ' · 서울 캠퍼스'}</h3>
        <p>{planCount ? `2028 정시 반영 요약 ${planCount}건` : '2028 정시 반영 요약 미수록'}<br />{resultCount ? `과거 입결 ${resultCount}건 수록` : '과거 입결 미수록'}</p>
        {row.note && <p className={styles.muted}>{row.note}</p>}
        <button type="button" className={styles.universityChoose} aria-pressed={university === row.id} onClick={() => onUniversityChange(row.id)}>{university === row.id ? '선택됨' : '이 대학 선택'}</button>
        {university === row.id && <div className={styles.tools}><a href="#plans">정시 자료 확인 ↓</a><Link href={`/admissions/susi?university=${encodeURIComponent(row.id)}#plans`}>수시 자료 확인 →</Link></div>}
        <div className={styles.tools}>{row.website && <a href={row.website} target="_blank" rel="noopener noreferrer">학교 홈페이지 ↗</a>}<a href={row.sourceUrl} target="_blank" rel="noopener noreferrer">소재지·유형 근거 ↗</a></div>
      </article>;
    })}</div>
    {!rows.length && <p className={styles.empty}>이 검색어에 해당하는 학교가 없습니다. 학교 이름을 다시 확인해 주세요.</p>}
    {rows.length > limit && <button type="button" className={styles.more} onClick={() => setLimit(rows.length)}>검색된 {rows.length}곳 모두 보기</button>}
    <details className={styles.scoreMethod}><summary>전체 목록의 출처와 범위</summary><p>{registry.scope}</p><p>일부 대학은 서울 밖에도 캠퍼스가 있습니다. 서울 모집단위의 적용 여부는 대학 원문에서 확인해야 합니다. 자료 미수록은 불합격이나 모집하지 않음을 뜻하지 않습니다.</p><a href={registry.sourceUrl} target="_blank" rel="noopener noreferrer">커리어넷 학교정보 · 서울특별시·대학(4년제)로 조회 ↗</a></details>
  </section>;
}
