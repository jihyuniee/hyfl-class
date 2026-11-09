import styles from "./explorer.module.css";

export default function AdmissionsHome() {
  return <section className={styles.page} aria-labelledby="admissions-heading">
    <div className={styles.hero}>
      <span className={styles.yearPill}>2028학년도</span>
      <h1 id="admissions-heading">대학별 시행계획 찾아보기</h1>
      <p>아래 검색기에서 대학을 선택해 2028학년도 입학전형 시행계획을 확인하세요.</p>
    </div>
    <a className={styles.primary} href="https://m.site.naver.com/275xR" target="_blank" rel="noopener noreferrer">대학별 시행계획 검색기 열기 ↗</a>
    <p className={styles.muted}>새 창으로 열립니다.</p>
  </section>;
}
