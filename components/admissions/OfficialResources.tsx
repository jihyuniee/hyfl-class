import styles from "./explorer.module.css";

export default function OfficialResources() {
  return <section id="student-questions" className={styles.section} aria-labelledby="official-resources-heading">
    <h2 id="official-resources-heading">대학 공식 자료</h2>
    <details id="snu-interview" className={styles.fold}>
      <summary>서울대 2028학년도 수시모집 일반전형 면접 예시 문항</summary>
      <p>서울대학교 입학본부 공개 자료입니다. 예시 문항 PDF는 아래 게시물에 첨부되어 있습니다.</p>
      <div className={styles.tools}>
        <a href="https://admission.snu.ac.kr/undergraduate/notice?bbsidx=176144&amp;md=v" target="_blank" rel="noopener noreferrer">면접 예시 문항 · 공식 게시물 ↗</a>
        <a href="https://admission.snu.ac.kr/materials/guide_movie/admission_guide" target="_blank" rel="noopener noreferrer">입학전형 안내 영상 · 공식 페이지 ↗</a>
      </div>
      <p className={styles.muted}>예시 문항 게시일: 2026.9.23. · 출처: 서울대학교 입학본부 · 적용 전형: 2028학년도 수시모집 일반전형</p>
    </details>
  </section>;
}
