import Link from "next/link";
import styles from "./explorer.module.css";

export default function AdmissionsNav({ current }: { current: "home" | "regular" | "early" | "china" }) {
  return <nav className={styles.navigation} aria-label="수시·정시 자료 선택">
    <Link href="/admissions" aria-current={current === "home" ? "page" : undefined}>대입 탐색기</Link>
    <Link href="/admissions/seoul?section=mock-score">모의고사 점수 참고표</Link>
    <Link href="/admissions/susi#directory">계열별 학과</Link>
    <Link href="/admissions/seoul#results">정시 입시 결과</Link>
    <Link href="/admissions/susi#plans" aria-current={current === "early" ? "page" : undefined}>전형별 수능최저·면접</Link>
    <a href="https://m.site.naver.com/275xR" target="_blank" rel="noopener noreferrer" title="2028 대학입학전형 시행계획 검색기 · 새 창">대학별 시행계획 검색 ↗</a>
    <Link href="/admissions/seoul#plans" aria-current={current === "regular" ? "page" : undefined}>2028 정시 반영방법</Link>
    <Link href="/admissions/china" aria-current={current === "china" ? "page" : undefined}>중국 대학</Link>
  </nav>;
}
