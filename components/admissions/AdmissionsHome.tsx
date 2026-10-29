import Link from "next/link";
import styles from "./explorer.module.css";

export default function AdmissionsHome() {
  return <section className={styles.home} aria-label="수시와 정시 탐색 시작">
    <header className={styles.startHeader}><span>2028 대입 · 인문·사회·어문</span><h1>어떤 입시가 궁금해?</h1><p>궁금한 것부터 하나씩 찾아봐요.</p></header>
    <div className={styles.startRoutes}>
      <Link href="/admissions/seoul" className={styles.startCard}><span className={styles.routeTag}>수능 성적 중심</span><h2>정시 <span aria-hidden="true">↗</span></h2><p>이 대학·학과는<br />어느 정도 성적으로 갔을까?</p><span className={styles.routeHint}>지난 입결 · 과목별 반영비율</span></Link>
      <Link href="/admissions/susi" className={styles.startCard}><span className={styles.routeTag}>학교생활·교과·논술</span><h2>수시 <span aria-hidden="true">↗</span></h2><p>관심 학과는 무엇을 배우고,<br />어떤 전형으로 지원할까?</p><span className={styles.routeHint}>학과 공부 · 수능최저 · 면접</span></Link>
    </div>
    <div className={styles.quickResources}><a href="https://script.google.com/macros/s/AKfycbzRCA4FQ_9kT0SvrfA67B8j-4CcKTmVbaXzeDF9d0BKUyqr3_8K6Ne2sRuqvoRD5EOWRg/exec" target="_blank" rel="noopener noreferrer"><span><b>대학 원문을 직접 보고 싶다면</b><small>2028 대학자료 검색기 열기 ↗</small></span><span aria-hidden="true">→</span></a><Link href="/admissions/china"><span><b>중국 대학이 궁금하다면</b><small>지원 방법 · 교내 추천 참고자료</small></span><span aria-hidden="true">→</span></Link></div>
    <details className={styles.extraTools}><summary>점수 검색·관심 목록 등 추가 도구</summary><div className={styles.tools}><Link href="/admissions#score">점수로 찾기</Link><Link href="/admissions#plan">계열별 전형 검색</Link><Link href="/admissions#minimum">수능최저 조합</Link><Link href="/admissions#saved">관심 목록</Link><Link href="/admissions#guide">입시 용어</Link></div></details>
    <p className={styles.startFootnote}>과거 입결은 참고자료예요. 실제 지원 조건은 해당 연도 최종 모집요강으로 확인해요.</p>
  </section>;
}
