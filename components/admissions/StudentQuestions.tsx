import Link from "next/link";
import styles from "./explorer.module.css";

export default function StudentQuestions() {
  return <section id="student-questions" className={styles.section} aria-labelledby="questions-heading">
    <h2 id="questions-heading">지금 내게 궁금한 것부터</h2>
    <details className={styles.fold}><summary>내신을 계속 준비할까, 정시에 더 집중할까?</summary>
      <p>최근 내신과 모의고사의 추이, 과목별 강점, 학생부의 학습 과정, 목표 대학의 전형을 나란히 살펴보세요.</p>
      <table><caption>상담 전에 두 경로를 비교해요</caption><thead><tr><th>살펴볼 것</th><th>수시 준비</th><th>정시 준비</th></tr></thead><tbody>
        <tr><th>성적 흐름</th><td>학기별·과목별 내신과 이수 과목</td><td>최근 모의고사 2~3회 과목별 표준점수·백분위·등급</td></tr>
        <tr><th>준비 내용</th><td>수업·탐구의 과정, 지원자격·면접·수능최저</td><td>대학별 반영비율·영어 환산·학생부 반영 여부</td></tr>
        <tr><th>다음 행동</th><td>보완할 과목과 탐구 과정 정하기</td><td>강점 과목이 반영되는 대학의 산식 확인하기</td></tr>
      </tbody></table><p>내신 한 숫자로 수시 포기를 결정하지 마세요. 과거 9등급 내신을 현재 5등급 내신과 그대로 비교할 수 없습니다. 비교한 자료를 가지고 담임선생님과 학습 시간 배분을 상담하세요.</p>
      <div className={styles.tools}><Link href="/admissions/seoul">정시 입결·반영방식</Link><Link href="/admissions/susi">학과·수시 전형</Link></div>
    </details>
    <details className={styles.fold}><summary>내 모의고사 점수로 어느 대학을 살펴볼까?</summary><ol><li>성적표의 과목별 표준점수·백분위·등급을 구분해요.</li><li>가까운 백분위 구간의 과거 입결에서 대학·학과 후보를 찾아요.</li><li>관심 대학을 선택해 결과 연도·모집단위·공개 지표를 맞춰 읽어요.</li><li>2028 반영방식에서 강점 과목 비중, 영어·탐구·학생부 반영을 확인해요.</li></ol><p>과거 입결과 내 점수의 단순 차이로 안정·적정·상향을 확정하지 않아요. 2028 시험 체제와 대학별 산식을 함께 확인하세요.</p><Link className={styles.primary} href="/admissions/seoul">입결부터 둘러보기 →</Link></details>
    <details className={styles.fold}><summary>학생부를 잘 준비하고 있을까? 탐구 주제는 어떻게 잡을까?</summary><p>다음은 스스로 학습 과정을 점검하는 질문입니다. 대학의 공식 평가표나 합격 점수표는 아닙니다.</p><ul><li>어떤 수업 내용에서 내 질문이 시작되었나요?</li><li>자료를 왜 골랐고, 출처와 비교 기준을 설명할 수 있나요?</li><li>직접 분석·비교하거나 해결 방법을 시험한 과정이 있나요?</li><li>예상과 다른 결과와 자료의 한계를 설명했나요?</li><li>배운 점을 다음 질문이나 후속 활동으로 발전시켰나요?</li></ul><p><b>예시:</b> ‘중국 고령화 조사’ → ‘한중 고령화 통계의 연도·연령 기준을 맞춰 비교하고, 소비 변화와의 관련성을 어디까지 설명할 수 있는지 검토하기’</p><p>어려운 제목과 활동 개수보다 질문·근거·분석·수정 과정을 구체화해요. 실제로 한 활동과 배운 내용을 정리해 선생님과 상의하세요.</p><Link className={styles.primary} href="/admissions/susi#major-heading">관심 분야의 공부·탐구 예시 찾기 →</Link></details>
    <details className={styles.fold}><summary>같은 학과라면 어느 대학이 나에게 맞을까?</summary><p>대학 이름과 입결을 출발점으로 삼되, 같은 학과명이라도 배우는 내용을 확인해요.</p><ul><li>필수·선택 과목과 세부 전공: 내가 원하는 공부가 있는가?</li><li>외국어 원문 읽기·통계·실험 등: 어떤 방법을 배우는가?</li><li>복수전공·전과·현장실습: 공식 안내에 어떤 조건이 있는가?</li><li>지원 경로: 모집단위·전형·최저·지원자격이 맞는가?</li></ul><p>대학별 공식 교육과정과 제도를 나란히 확인하세요. 공개 연도와 산식이 다른 입결을 단순히 정렬해 대학·학과의 우열로 해석하지 않아요.</p><Link href="/admissions/susi">같은 관심 분야의 대학·학과 둘러보기 →</Link></details>
    <details id="snu-interview" className={styles.fold}><summary>목표 대학이 요구하는 공부 알아보기 · 서울대 면접 자료</summary>
      <p>가고 싶은 대학이 어떤 사고와 공부를 살펴보는지 공식 자료로 확인해요. 현재 성적으로 가능성을 미리 닫기보다, 수업과 탐구에서 연습할 일을 찾아보세요.</p>
      <h3>2028학년도 서울대 수시 일반전형 역량평가 면접</h3>
      <p>공식 안내는 분석적 주제토론, 심층적 문제해결, 융합적 과제수행을 설명합니다. 교과 지식을 활용해 생각을 전개하고, 면접관의 추가 질문인 ‘탐침질문’을 통해 아이디어를 보완하는 과정을 살펴봐요.</p>
      <p className={styles.muted}>적용 범위는 2028학년도 수시모집 일반전형입니다. 모집단위별 유형과 세부 진행 방식은 해당 연도 공식 모집안내로 확인하세요.</p>
      <div className={styles.tools}>
        <a href="https://admission.snu.ac.kr/undergraduate/notice?bbsidx=176144&amp;md=v" target="_blank" rel="noopener noreferrer">공식 면접 예시 문항 · PDF 첨부 게시물 ↗</a>
        <a href="https://admission.snu.ac.kr/materials/guide_movie/admission_guide" target="_blank" rel="noopener noreferrer">공식 안내 영상 · 2028 파트 1·2 ↗</a>
      </div>
      <p className={styles.muted}>예시 문항 게시일: 2026.9.23. · 출처: 서울대학교 입학본부 · 확인: 2026.10.29. 영상 페이지에는 다른 학년도 안내도 있으므로 2028학년도 영상을 선택하세요. 첨부 PDF는 원문 게시물에서 열어보세요.</p>
      <h3>자료를 보고 친구와 연습해요</h3>
      <p>다음은 학급 활동용으로 만든 연습 순서와 질문입니다. 서울대 공식 문항·평가기준이나 모범답안이 아닙니다.</p>
      <ol><li>공식 예시에서 관심 있는 문항을 골라 조건과 핵심 쟁점을 정리해요.</li><li>수업에서 배운 개념과 자료를 바탕으로 자신의 답변과 근거를 설명해요.</li><li>친구는 ‘그 근거를 선택한 이유는?’, ‘다른 조건에서도 성립할까?’, ‘반대 설명은 가능할까?’를 질문해요.</li><li>질문을 듣고 보완한 내용과 아직 확인하지 못한 점을 정리해요.</li><li>지금 하는 수행평가·탐구에서 더 확인할 질문 한 가지를 정해요.</li></ol>
      <p>목표는 답변을 외우는 것이 아니라 질문·근거·분석·수정 과정을 직접 경험하는 것입니다. 이 경험을 실제 활동 기록과 다음 탐구로 이어가세요.</p>
    </details>
  </section>;
}
