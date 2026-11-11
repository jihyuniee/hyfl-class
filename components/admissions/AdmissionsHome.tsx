"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import majors from "@/public/admissions-explorer/majors.json";
import { admissionsQuestions } from "@/components/lib/admissionsSearch";
import AdmissionsNav from "./AdmissionsNav";
import MockScoreExplorer from "./MockScoreExplorer";
import styles from "./explorer.module.css";

const routes = [
  { title: "모의고사 점수 참고표", tag: "01 · 점수 입력", text: "표점합·평균 백분위 → 상향·소신·가능·적정·안정", href: "#mock-score" },
  { title: "계열별 학과", tag: "02 · 전공 탐색", text: "인문·어문, 사회·상경, 교육 분야의 학과와 공식 안내", href: "#fields" },
  { title: "정시 입시 결과", tag: "03 · 학년도별 결과", text: "2024~2026학년도 평균 백분위·70% 컷과 출처", href: "/admissions/seoul#results" },
  { title: "전형별 수능최저·면접", tag: "04 · 2028 시행계획", text: "학종·교과·논술의 최저 기준, 면접, 지원자격", href: "/admissions/susi#plans" },
];

export default function AdmissionsHome() {
  const [university, setUniversity] = useState("");
  const router = useRouter();

  useEffect(() => {
    const followBookmark = () => {
      const destinations: Record<string, string> = {
        "#score": "/admissions/seoul?section=mock-score",
        "#regular": "/admissions/seoul#results",
        "#plan": "/admissions/susi#plans",
        "#holistic": "/admissions/susi#plans",
        "#saved": "/admissions/susi#directory",
      };
      const destination = destinations[window.location.hash];
      if (destination) router.replace(destination);
      const target = document.getElementById(window.location.hash.slice(1));
      if (target instanceof HTMLDetailsElement) target.open = true;
    };
    followBookmark();
    window.addEventListener("hashchange", followBookmark);
    return () => window.removeEventListener("hashchange", followBookmark);
  }, [router]);

  return <div className={styles.home}>
    <AdmissionsNav current="home" />
    <header className={styles.hero}>
      <span className={styles.yearPill}>2-2 우리반 · 2028학년도</span>
      <h1>대입 탐색기</h1>
      <p>모의고사 점수 참고표 · 계열별 학과 · 정시 입시 결과 · 전형별 수능최저</p>
    </header>
    <nav className={styles.taskGrid} aria-label="대입 탐색 바로가기">
      {routes.map(route => <Link key={route.href} href={route.href}>
        <span className={styles.eyebrow}>{route.tag}</span><h2>{route.title}</h2><p>{route.text}</p><span className={styles.taskArrow} aria-hidden="true">→</span>
      </Link>)}
    </nav>

    <MockScoreExplorer university={university} onUniversityChange={setUniversity} />

    <section id="fields" className={styles.section} aria-labelledby="fields-heading">
      <h2 id="fields-heading">계열별로 어떤 학과가 있을까?</h2>
      <p>대학 공식 학과 안내를 연결한 전공 탐색 예시입니다. 2028학년도 모집단위와 인원은 시행계획에서 확인하세요.</p>
      {[...new Set(majors.map(profile => profile.field))].map(field => <div className={styles.section} key={field}>
        <h3>{field}</h3>
        <div className={styles.fieldGrid}>{majors.filter(profile => profile.field === field).map(profile => <article className={styles.fieldCard} key={profile.id}>
          <h3>{profile.title}</h3>
          <div className={styles.fieldExamples}>{profile.examples.map(example => <a key={example.url} href={example.url} target="_blank" rel="noopener noreferrer">{example.university} · {example.department} ↗</a>)}</div>
          <Link href={`/admissions/susi?area=${profile.id}#directory`}>학과 안내 더 보기 →</Link>
        </article>)}</div>
      </div>)}
    </section>

    <section id="questions" className={styles.section} aria-labelledby="questions-heading">
      <h2 id="questions-heading">입시 자료 읽는 법</h2>
      {admissionsQuestions.map(question => <details id={question.id} className={styles.faq} key={question.id}>
        <summary>{question.title}</summary><p>{question.answer}</p><Link href={question.href}>{question.action} →</Link>
      </details>)}
    </section>
    <section id="student-questions" className={styles.section} aria-labelledby="resources-heading">
      <h2 id="resources-heading">대학별 시행계획 원문</h2>
      <a id="resources" className={styles.primary} href="https://m.site.naver.com/275xR" target="_blank" rel="noopener noreferrer">2028 대학별 시행계획 검색기 열기 ↗</a>
      <p className={styles.muted}>대학별 시행계획은 추후 변경될 수 있습니다. 지원 전 최종 모집요강을 확인하세요.</p>
    </section>
  </div>;
}
