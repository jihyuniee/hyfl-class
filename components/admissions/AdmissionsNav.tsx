import Link from "next/link";
import styles from "./explorer.module.css";

export default function AdmissionsNav({ current }: { current: "home" | "regular" | "early" | "china" }) {
  return <nav className={styles.navigation} aria-label="수시·정시 자료 선택">
    <Link href="/admissions" aria-current={current === "home" ? "page" : undefined}>2028 대입 홈</Link>
    <Link href="/admissions/seoul?section=mock-score">내 점수로 대학 찾기</Link>
    <Link href="/admissions/seoul" aria-current={current === "regular" ? "page" : undefined}>2028 정시·과거 입결</Link>
    <Link href="/admissions/susi" aria-current={current === "early" ? "page" : undefined}>2028 수시·전공 탐색</Link>
    <Link href="/admissions/china" aria-current={current === "china" ? "page" : undefined}>중국 대학</Link>
  </nav>;
}
