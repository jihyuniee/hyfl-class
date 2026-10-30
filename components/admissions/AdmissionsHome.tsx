"use client";

import { useState } from "react";
import OfficialResources from "./OfficialResources";
import directory from "@/public/admissions-explorer/directory.json";
import FieldBrowse from "./FieldBrowse";
import PercentileBrowse from "./PercentileBrowse";
import Link from "next/link";
import styles from "./explorer.module.css";

export default function AdmissionsHome() {
  const [view, setView] = useState<"early" | "regular">("early");
  const [university, setUniversity] = useState("");
  return <section className={styles.home} aria-label="수시와 정시 탐색 시작">
    <header className={styles.startHeader}><span>2028 대입 · 서울 대학</span><h1>대학·성적·관심 분야, 어디서 시작할까요?</h1><p>가고 싶은 대학부터 찾아도, 배우고 싶은 분야부터 둘러봐도 좋아요.</p></header>
    <section className={styles.panel} aria-labelledby="university-start"><h2 id="university-start">가고 싶은 대학이 있어요</h2><label>관심 대학<select className={styles.universitySelect} value={university} onChange={e => setUniversity(e.target.value)}><option value="">대학을 골라보세요</option>{directory.universities.map(u => <option key={u}>{u}</option>)}</select></label>
    <div className={styles.tools}><Link href={university ? `/admissions/seoul?university=${encodeURIComponent(university)}` : "/admissions/seoul"}>{university || "대학별"} 정시 입결 보기 →</Link><Link href={university ? `/admissions/susi?university=${encodeURIComponent(university)}` : "/admissions/susi"}>학과·교육과정·수시 전형 보기 →</Link></div><p className={styles.muted}>30개 대학의 학과를 탐색할 수 있어요. 과거 정시 입결은 11개 대학 수록이며 자료가 없는 대학은 별도로 안내해요.</p></section>
    <div className={styles.tools}><Link href="/admissions/seoul#mock-score">모의고사 점수 입력</Link><a href="#student-questions">대학 공식 자료</a><Link href="/admissions/susi">학과·교육과정 찾기</Link></div>
    <OfficialResources />
    <div className={styles.browseTabs} role="group" aria-label="입시 둘러보기"><button type="button" aria-pressed={view === "early"} onClick={() => setView("early")}><b>수시 · 계열 둘러보기</b><span>이런 공부를 하는구나</span></button><button type="button" aria-pressed={view === "regular"} onClick={() => setView("regular")}><b>정시 · 성적대 둘러보기</b><span>이 정도 입결이 있었구나</span></button></div>
    {view === "early" ? <section><h2>이런 계열에서는 무엇을 배울까?</h2><p className={styles.muted}>학과 예시를 먼저 보고, 끌리는 분야를 눌러보세요. 학과 목록은 2028 수시 모집 확정 목록과는 달라요.</p><FieldBrowse /><Link className={styles.primary} href="/admissions/susi">전체 학과·수시 전형 둘러보기 →</Link></section> : <><PercentileBrowse /><Link className={styles.primary} href="/admissions/seoul">과거 입결·2028 과목 반영비율 더 보기 →</Link></>}
    <div className={styles.quickResources}><a href="https://script.google.com/macros/s/AKfycbzRCA4FQ_9kT0SvrfA67B8j-4CcKTmVbaXzeDF9d0BKUyqr3_8K6Ne2sRuqvoRD5EOWRg/exec" target="_blank" rel="noopener noreferrer"><span><b>대학 원문을 직접 보고 싶다면</b><small>2028 대학자료 검색기 열기 ↗</small></span><span aria-hidden="true">→</span></a><Link href="/admissions/china"><span><b>중국 대학이 궁금하다면</b><small>지원 방법 · 교내 추천 참고자료</small></span><span aria-hidden="true">→</span></Link></div>
    <details className={styles.extraTools}><summary>점수 검색·관심 목록 등 추가 도구</summary><div className={styles.tools}><Link href="/admissions#score">점수로 찾기</Link><Link href="/admissions#plan">계열별 전형 검색</Link><Link href="/admissions#minimum">수능최저 조합</Link><Link href="/admissions#saved">관심 목록</Link><Link href="/admissions#guide">입시 용어</Link></div></details>
    <p className={styles.startFootnote}>과거 입결은 참고자료예요. 실제 지원 조건은 해당 연도 최종 모집요강으로 확인해요.</p>
  </section>;
}
