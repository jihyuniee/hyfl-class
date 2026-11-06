import styles from "./explorer.module.css";

export default function OfficialResources() {
  return <section id="student-questions" className={styles.section} aria-labelledby="official-resources-heading">
    <h2 id="official-resources-heading">2028 공식 발표·교육청 자료</h2>
    <div className={styles.tools}>
      <a href="https://www.kcue.or.kr/news/sub02/sub01.php?at=view&amp;idx=2765091" target="_blank" rel="noopener noreferrer">대교협 · 2028 시행계획 발표 ↗</a>
      <a href="https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=294&amp;boardSeq=103512&amp;lev=0&amp;m=020402&amp;opType=N&amp;s=moe&amp;statusYN=W" target="_blank" rel="noopener noreferrer">교육부 · 2028 수능 시행일·체제 ↗</a>
      <a href="https://www.adiga.kr" target="_blank" rel="noopener noreferrer">어디가 · 대학별 공개 입결 ↗</a>
      <a href="/admissions-2028/sen-preview-20261014.pdf" target="_blank" rel="noopener noreferrer">서울교육청 2028 대입 자료 ↗</a>
    </div>
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
