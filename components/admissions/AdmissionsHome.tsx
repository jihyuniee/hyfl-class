import Link from "next/link";
import styles from "./explorer.module.css";

export default function AdmissionsHome() {
  return <section className={styles.home} aria-label="수시와 정시 탐색 시작">
    <div className={styles.routes}>
      <article><span>정시</span><h2>어느 대학·학과의 입결을 볼까?</h2><p>학교·학과별 과거 등록자 백분위와 대학 환산점수 컷, 2028 과목 반영방식을 확인해요.</p><ul><li>11개 대학 · 292개 학과·연도 기록</li><li>평균·70% 컷·환산점수 구분</li><li>표점합 지원참고표는 예측 자료로 별도 제공</li></ul><Link href="/admissions/seoul">정시 입결 살펴보기 →</Link></article>
      <article><span>수시</span><h2>관심 학과에서는 무엇을 배울까?</h2><p>서울 30개 대학의 학과·모집단위를 찾아보고, 공부할 내용과 탐구 방향, 대학별 전형 후보를 함께 살펴봐요.</p><ul><li>인문·사회·어문·교육 전공 탐색</li><li>10개 전공 분야의 교육과정·탐구 예시</li><li>2028 전형방법·수능최저·면접·지원자격 확인</li></ul><Link href="/admissions/susi">학과와 수시 전형 살펴보기 →</Link></article>
    </div>
    <div className={styles.panel}><h3>자료를 읽는 순서</h3><p><b>정시:</b> 과목별 성적 → 같은 지표의 과거 입결 → 지원 연도 대학 환산방식</p><p><b>수시:</b> 관심 학과의 교육과정 → 모집단위 확인 → 지원자격·전형방법·최저·면접</p><p className={styles.muted}>과거 컷과 지원참고표는 합격 보장선이 아닙니다. 2028 시행계획은 최종 모집요강과 대조하세요.</p></div>
    <div className={styles.tools}><Link href="/admissions#score">표점합·백분위 지원참고표</Link><Link href="/admissions#plan">기존 계열별 전형 검색</Link><Link href="/admissions#minimum">수능최저 조합 연습</Link><Link href="/admissions#resources">대학 시행계획·안내서</Link><Link href="/admissions/china">중국 대학 지원·학교 추천 안내</Link></div>
  </section>;
}
