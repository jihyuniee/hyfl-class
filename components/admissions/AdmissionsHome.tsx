"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import directory from "@/public/admissions-explorer/directory.json";
import majors from "@/public/admissions-explorer/majors.json";
import AdmissionsNav from "./AdmissionsNav";
import AdmissionsAsk from "./AdmissionsAsk";
import OfficialResources from "./OfficialResources";
import { admissionsQuestions, findAdmissionsMatches } from "@/components/lib/admissionsSearch";
import { admissions2028Facts } from "@/components/lib/admissions2028";
import styles from "./explorer.module.css";

const routes = [
  { title: "2028 수시 전형", tag: "전형 계획", text: "수능최저·면접·지원자격 원문 확인", href: "/admissions/susi#plans", number: "01" },
  { title: "2028 정시 반영방법", tag: "전형 계획", text: "국어·수학·영어·탐구·학생부 반영 확인", href: "/admissions/seoul#plans", number: "02" },
  { title: "내 모의고사 성적", tag: "성적 확인", text: "시험 정보를 남기고 점수의 합·평균 확인", href: "/admissions/seoul#mock-score", number: "03" },
  { title: "과거 정시 입결", tag: "2024~2026 결과", text: "대학 발표 평균·70% 컷을 참고 자료로 보기", href: "/admissions/seoul#results", number: "04" },
];

export default function AdmissionsHome() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [university, setUniversity] = useState("");
  const matches = findAdmissionsMatches(query, directory.universities.map(university => ({ university, department: "" })));
  const universityQuery = university ? `?university=${encodeURIComponent(university)}` : "";

  useEffect(() => {
    const followBookmark = () => {
      const destination: Record<string, string> = {
        "#score": "/admissions/seoul#mock-score", "#regular": "/admissions/seoul#results",
        "#plan": "/admissions/susi#plans", "#saved": "/admissions/susi#directory",
        "#guide": "/admissions#questions", "#holistic": "/admissions/susi#plans",
        "#resources": "/admissions#student-questions",
      };
      if (destination[window.location.hash]) router.replace(destination[window.location.hash]);
      else {
        const target = document.getElementById(window.location.hash.slice(1));
        if (target instanceof HTMLDetailsElement) target.open = true;
      }
    };
    followBookmark();
    window.addEventListener("hashchange", followBookmark);
    return () => window.removeEventListener("hashchange", followBookmark);
  }, [router]);

  return <div className={styles.home}>
    <AdmissionsNav current="home" />
    <header className={styles.focusHero}>
      <div><span className={styles.yearPill}>2-2 우리반 · 2028학년도</span><h1>나의 대입 준비,<br />2028 기준으로.</h1><p>대학이 발표한 전형 계획과 공식 자료에서<br />우리에게 필요한 내용을 찾아보세요.</p><a className={styles.textLink} href="#confirmed-2028">2028 공식 발표 확인 ↓</a></div>
      <div className={styles.heroStart}><span className={styles.eyebrow}>관심 대학부터 시작해요</span><h2>어느 대학이 궁금한가요?</h2><label htmlFor="university-start-select">대학 선택</label><select id="university-start-select" className={styles.universitySelect} value={university} onChange={e => setUniversity(e.target.value)}><option value="">대학 전체에서 찾기</option>{directory.universities.map(u => <option key={u}>{u}</option>)}</select><div className={styles.heroActions}><Link href={`/admissions/susi${universityQuery}#plans`}>2028 수시 전형 →</Link><Link href={`/admissions/seoul${universityQuery}#plans`}>2028 정시 반영 →</Link></div><small>수록하지 않은 전형은 대학 원문에서 확인할 수 있어요.</small></div>
    </header>
    <nav className={styles.taskGrid} aria-label="2028 대입 주요 기능">{routes.map(r => <Link href={r.href} key={r.number}><span className={styles.cardTop}><span>{r.tag}</span><span>{r.number}</span></span><h2>{r.title}</h2><p>{r.text}</p><span className={styles.taskArrow} aria-hidden="true">↗</span></Link>)}</nav>
    <section className={styles.section} id="confirmed-2028" aria-labelledby="confirmed-title"><div className={styles.sectionHeading}><h2 id="confirmed-title">공식 발표로 확인한 2028</h2><span>원문 확인일 2026.11.06.</span></div><div className={styles.factGrid}>{admissions2028Facts.map(f => <article key={f.id}><small>{f.label}</small><h3>{f.value}</h3><p>{f.detail}</p><a href={f.url} target="_blank" rel="noopener noreferrer">{f.source} ↗</a></article>)}</div><p className={styles.scopeNote}>2028학년도 실제 입결·합격선은 아직 없습니다. 과거 입결은 해당 학년도의 결과로만 표시하며, 2028 합격 확률이나 지원 판정으로 바꾸지 않습니다.</p></section>
    <section className={styles.section} aria-labelledby="search-heading"><div className={styles.sectionHeading}><h2 id="search-heading">등록된 자료에서 찾아보기</h2><span>대학·전형 검색과 출처가 있는 답변</span></div><AdmissionsAsk question={query} onQuestionChange={setQuery} />{query.trim() && <div className={styles.searchResults} aria-label="통합 검색 결과"><div className={styles.sectionHeading}><h3>‘{query}’ 관련 항목</h3><span role="status">{matches.length}개 표시</span></div>{matches.length ? <div className={styles.searchList}>{matches.map(m => <Link key={m.href} href={m.href}><span><small>{m.kind}</small><strong>{m.title}</strong><span>{m.description}</span></span><span aria-hidden="true">↗</span></Link>)}</div> : <p className={styles.empty}>등록된 항목이 없어요. 대학명·전형명을 포함해 찾아보세요.</p>}</div>}</section>
    <section className={styles.section} aria-labelledby="fields-heading"><div className={styles.sectionHeading}><h2 id="fields-heading">관심 분야의 공부 내용</h2><Link href="/admissions/susi#directory">분야별 교육과정 보기 →</Link></div><p className={styles.muted}>대학 공식 교육과정의 예시를 살펴보는 메뉴입니다. 2028 모집 확정 학과 목록과는 구분합니다.</p><div className={styles.topicGrid}>{majors.map(p => <Link key={p.id} href={`/admissions/susi?area=${p.id}#directory`}><small>{p.field}</small><strong>{p.title}</strong><span aria-hidden="true">→</span></Link>)}</div></section>
    <section className={styles.section} id="questions" aria-labelledby="questions-heading"><div className={styles.sectionHeading}><h2 id="questions-heading">많이 궁금해하는 질문</h2></div>{admissionsQuestions.map(q => <details className={styles.faq} id={q.id} key={q.id}><summary>{q.title}</summary><p>{q.answer}</p><Link href={q.href}>{q.action} →</Link></details>)}</section>
    <OfficialResources />
    <div className={styles.quickResources}><Link href="/admissions/china"><span><b>중국 대학 지원 참고자료</b><small>대학별 자료의 적용 연도를 따로 확인하세요</small></span><span aria-hidden="true">→</span></Link></div>
  </div>;
}
