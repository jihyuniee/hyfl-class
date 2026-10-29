import Link from "next/link";
import styles from "./explorer.module.css";

export default function AdmissionsNav({ current }: { current: "home" | "regular" | "early" | "china" }) {
  return <nav className={styles.navigation} aria-label="수시·정시 자료 선택">
    <Link href="/admissions#overview" aria-current={current === "home" ? "page" : undefined}>← 입시 홈</Link>
    <Link href="/admissions/seoul" aria-current={current === "regular" ? "page" : undefined}>정시</Link>
    <Link href="/admissions/susi" aria-current={current === "early" ? "page" : undefined}>수시</Link>
    {current === "china" && <Link href="/admissions/china" aria-current="page">중국 대학</Link>}
  </nav>;
}
