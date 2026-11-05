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
import styles from "./explorer.module.css";

const routes = [
  { title: "내 점수로 어느 대학을 살펴볼까요?", tag: "상향·소신·적정", text: "표준점수·백분위를 입력하고 지원참고표와 비교하기", href: "/admissions/seoul#mock-score", number: "01" },
  { title: "지난 합격 성적이 궁금해요", tag: "정시 입결", text: "대학이 공개한 평균·70% 컷을 대학과 학과로 찾기", href: "/admissions/seoul", number: "02" },
  { title: "어떤 학과에서 무엇을 배울까요?", tag: "학과 탐색", text: "중국어, 경영, 정치외교… 관심 분야부터 둘러보기", href: "/admissions/susi#directory", number: "03" },
  { title: "수능최저·면접이 있나요?", tag: "2028 수시", text: "대학별 전형방법과 지원 조건의 근거 확인하기", href: "/admissions/susi#plans", number: "04" },
  { title: "대학마다 어떤 과목을 반영하나요?", tag: "2028 정시", text: "과목별 반영비율과 영어·학생부 반영방법 찾아보기", href: "/admissions/seoul#plans", number: "05" },
];

export default function AdmissionsHome() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [university, setUniversity] = useState("");
  const matches = findAdmissionsMatches(query, directory.records);

  useEffect(() => {
    const followBookmark = () => {
      const destination: Record<string, string> = {
        "#score": "/admissions/seoul#mock-score", "#regular": "/admissions/seoul#results",
        "#plan": "/admissions/susi#plans",
        "#saved": "/admissions/susi#directory", "#guide": "/admissions#questions",
        "#holistic": "/admissions/susi#plans", "#resources": "/admissions#student-questions",
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
    <header className={styles.homeHero}>
      <span className={styles.eyebrow}>2-2 우리반 · 2028 대입</span>
      <h1>궁금한 것부터,<br />나의 대입 탐색.</h1>
      <p>대학·학과를 찾거나, 궁금한 내용을 문장으로 물어보세요.</p>
      <AdmissionsAsk question={query} onQuestionChange={setQuery} />
    </header>
    {query.trim() && <section className={styles.searchResults} aria-label="통합 검색 결과">
      <div className={styles.sectionHeading}><h2>‘{query}’ 검색 결과</h2><span role="status">{matches.length}개 표시</span></div>
      {matches.length ? <div className={styles.searchList}>{matches.map(m => <Link key={m.href} href={m.href}><span><small>{m.kind}</small><strong>{m.title}</strong><span>{m.description}</span></span><span aria-hidden="true">↗</span></Link>)}</div> : <p className={styles.empty}>찾는 항목이 없어요. 대학명이나 학과명의 일부로 검색하거나 아래 질문을 골라보세요.</p>}
    </section>}
    <section className={styles.section} aria-labelledby="start-heading">
      <div className={styles.sectionHeading}><h2 id="start-heading">지금 무엇이 궁금한가요?</h2><span>질문을 고르면 바로 이동해요</span></div>
      <div className={styles.questionGrid}>{routes.map(r => <Link className={styles.questionCard} href={r.href} key={r.number}><span className={styles.cardTop}><span>{r.tag}</span><span>{r.number}</span></span><h3>{r.title}</h3><p>{r.text}</p><span className={styles.cardArrow} aria-hidden="true">→</span></Link>)}</div>
    </section>
    <section className={styles.universityPanel} aria-labelledby="university-start">
      <div><span className={styles.eyebrow}>UNIVERSITY</span><h2 id="university-start">관심 대학이 있나요?</h2><p>같은 대학의 학과, 수시, 정시 자료를 이어서 살펴보세요.</p></div>
      <div><label htmlFor="university-start-select">대학 선택</label><select id="university-start-select" className={styles.universitySelect} value={university} onChange={e => setUniversity(e.target.value)}><option value="">전체 대학</option>{directory.universities.map(u => <option key={u}>{u}</option>)}</select><div className={styles.tools}><Link href={`/admissions/susi${university ? `?university=${encodeURIComponent(university)}` : ""}#directory`}>학과·수시 전형 →</Link><Link href={`/admissions/seoul${university ? `?university=${encodeURIComponent(university)}` : ""}#results`}>정시 입결·반영방법 →</Link></div></div>
    </section>
    <section className={styles.section} aria-labelledby="fields-heading"><div className={styles.sectionHeading}><h2 id="fields-heading">관심 분야부터 찾아도 좋아요</h2><Link href="/admissions/susi#directory">전체 학과 보기 →</Link></div><div className={styles.topicGrid}>{majors.map(p => <Link key={p.id} href={`/admissions/susi?area=${p.id}#directory`}><small>{p.field}</small><strong>{p.title}</strong><span aria-hidden="true">→</span></Link>)}</div></section>
    <section className={styles.section} id="questions" aria-labelledby="questions-heading"><div className={styles.sectionHeading}><h2 id="questions-heading">많이 궁금해하는 질문</h2><span>짧게 확인하고, 자료로 이어가기</span></div>{admissionsQuestions.map(q => <details className={styles.faq} id={q.id} key={q.id}><summary>{q.title}</summary><p>{q.answer}</p><Link href={q.href}>{q.action} →</Link></details>)}</section>
    <OfficialResources />
    <div className={styles.quickResources}><Link href="/admissions/china"><span><b>중국 대학 지원도 궁금하다면</b><small>대학별 공식 요건·교내 추천 참고자료</small></span><span aria-hidden="true">→</span></Link></div>
    <p className={styles.startFootnote}>과거 입결과 2028 시행계획은 별도 자료입니다. 전형 카드에서 출처와 적용 범위를 확인할 수 있어요.</p>
  </div>;
}
