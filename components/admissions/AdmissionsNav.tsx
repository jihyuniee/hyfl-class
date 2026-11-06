import Link from "next/link";
import styles from "./explorer.module.css";

export default function AdmissionsNav({ current }: { current: "home" | "regular" | "early" | "china" }) {
  return <nav className={styles.navigation} aria-label="수시·정시 자료 선택">
    <Link href="/admissions" aria-current={current === "home" ? "page" : undefined}>대입 탐색</Link>
    <Link href="/admissions/seoul#mock-score">내 성적·정시 자료</Link>
    <Link href="/admissions/seoul" aria-current={current === "regular" ? "page" : undefined}>정시 입결·반영방법</Link>
    <Link href="/admissions/susi" aria-current={current === "early" ? "page" : undefined}>학과·수시 전형</Link>
    <Link href="/admissions/china" aria-current={current === "china" ? "page" : undefined}>중국 대학</Link>
  </nav>;
}
