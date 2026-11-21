"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import majors from "@/public/admissions-explorer/majors.json";
import registry from "@/public/admissions-explorer/seoul-universities.json";
import { filterAdmissionsDirectory } from "@/components/lib/admissionsDirectorySearch";
import styles from "./explorer.module.css";

const routes = [
  { title: "학과·교육과정", tag: "대학 공식 안내", href: "/admissions/susi#directory" },
  { title: "수시 전형", tag: "2028 시행계획 · 수능최저·면접", href: "/admissions/susi#plans" },
  { title: "정시 반영방법", tag: "2028 시행계획 · 과목별 반영", href: "/admissions/seoul?section=plans#plans" },
  { title: "과거 정시 입결", tag: "학년도별 공개 결과", href: "/admissions/seoul?section=results#results" },
];

type HistoricalUnit = { univ: string; dept: string };
const resultHref = (school: string, department?: string) => {
  const params = new URLSearchParams({ university: school, section: "results" });
  if (department) params.set("q", department);
  return `/admissions/seoul?${params}#results`;
};
const plansHref = (school: string) => `/admissions/susi?university=${encodeURIComponent(school)}#plans`;

export default function AdmissionsHome({ historicalUnits }: { historicalUnits: readonly HistoricalUnit[] }) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(8);
  const router = useRouter();
  const matches = filterAdmissionsDirectory(query, registry.records, historicalUnits, majors);
  const hasQuery = /[\p{L}\p{N}]/u.test(query);
  const count = matches.schools.length + matches.historicalUnits.length + matches.guides.length;

  useEffect(() => {
    const followBookmark = () => {
      const destinations: Record<string, string> = {
        "#score": "/admissions/seoul?section=mock-score",
        "#mock-score": "/admissions/seoul?section=mock-score",
        "#mock-scores": "/admissions/seoul?section=mock-score",
        "#regular": "/admissions/seoul?section=results#results",
        "#plan": "/admissions/susi#plans",
        "#holistic": "/admissions/susi#plans",
        "#minimum": "/admissions/susi#plans",
        "#foreign-school": "/admissions/susi#plans",
        "#grades": "/admissions/susi#plans",
        "#early-or-regular": "/admissions/seoul?section=plans#plans",
        "#saved": "/admissions/susi#directory",
        "#major-choice": "/admissions/susi#directory",
        "#cutoff": "/admissions/seoul?section=score-guide#score-guide",
      };
      const destination = destinations[window.location.hash];
      if (destination) router.replace(destination);
    };
    followBookmark();
    window.addEventListener("hashchange", followBookmark);
    return () => window.removeEventListener("hashchange", followBookmark);
  }, [router]);

  return <div className={styles.home}>
    <header className={styles.hero}>
      <h1>대입 탐색기</h1>
      <p>대학·학과, 2028 시행계획과 과거 입결을 찾아볼 수 있습니다.</p>
    </header>

    <section id="search" className={styles.section} aria-labelledby="search-heading">
      <h2 id="search-heading">대학·학과 검색</h2>
      <label className={styles.searchLabel} htmlFor="admissions-query">대학 또는 학과 이름</label>
      <input id="admissions-query" className={styles.universitySelect} type="search" value={query} placeholder="예: 한국외대, 경영, 고려대 경영" onChange={event => { setQuery(event.target.value); setLimit(8); }} />
      {hasQuery && <>
        <p className={styles.muted} role="status">{count ? `검색 결과 ${count}건` : "일치하는 수록 자료가 없습니다."}</p>
        {matches.schools.length > 0 && <>
          <h3>서울 소재 대학</h3>
          <ul className={styles.lookupList}>{matches.schools.slice(0, limit).map(school => <li key={school.id}>
            <strong>{school.id}</strong>
            <div className={styles.lookupLinks}>
              <Link href={plansHref(school.id)}>수시 전형<span className={styles.screenReaderOnly}> ({school.id})</span></Link>
              <Link href={`/admissions/seoul?university=${encodeURIComponent(school.id)}&section=plans#plans`}>정시 반영방법<span className={styles.screenReaderOnly}> ({school.id})</span></Link>
              <Link href={resultHref(school.id)}>과거 정시 입결<span className={styles.screenReaderOnly}> ({school.id})</span></Link>
            </div>
          </li>)}</ul>
        </>}
        {matches.historicalUnits.length > 0 && <>
          <h3>과거 입결에 수록된 학과·모집단위</h3>
          <ul className={styles.lookupList}>{matches.historicalUnits.slice(0, limit).map(unit => <li key={JSON.stringify([unit.univ, unit.dept])}>
            <Link href={resultHref(unit.univ.replace(/ 서울$/, ""), unit.dept)}>{unit.univ} · {unit.dept}</Link>
          </li>)}</ul>
        </>}
        {matches.guides.length > 0 && <>
          <h3>학과·교육과정 안내</h3>
          <ul className={styles.lookupList}>{matches.guides.slice(0, limit).map(guide => <li key={guide.id}>
            <Link href={`/admissions/susi?area=${encodeURIComponent(guide.id)}#directory`}>{guide.title}</Link>
          </li>)}</ul>
        </>}
        {Math.max(matches.schools.length, matches.historicalUnits.length, matches.guides.length) > limit && <button type="button" className={styles.more} onClick={() => setLimit(value => value + 12)}>검색 결과 더 보기</button>}
      </>}
    </section>

    <nav id="fields" className={styles.taskGrid} aria-label="대입 자료 바로가기">
      {routes.map(route => <Link key={route.href} href={route.href}>
        <h2>{route.title}</h2><p>{route.tag}</p><span className={styles.taskArrow} aria-hidden="true">→</span>
      </Link>)}
    </nav>

    <section id="student-questions" className={styles.section} aria-labelledby="resources-heading">
      <h2 id="resources-heading">자료 링크</h2>
      <nav id="resources" className={styles.pageJump} aria-label="추가 자료">
        <a href="https://m.site.naver.com/275xR" target="_blank" rel="noopener noreferrer">대학별 시행계획 검색 ↗</a>
        <Link href="/admissions/seoul?section=universities#universities">서울 소재 대학 목록</Link>
        <Link href="/admissions/china">중국 대학</Link>
        <Link href="/admissions/seoul?section=mock-score">모의고사 점수 참고표</Link>
      </nav>
      <p className={styles.muted}>시행계획은 최종 모집요강과 다를 수 있습니다. 과거 입결은 해당 학년도의 공개 결과입니다.</p>
    </section>
  </div>;
}
