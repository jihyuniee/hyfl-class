import type { Metadata } from "next";
import AdmissionsNav from "@/components/admissions/AdmissionsNav";
import styles from "@/components/admissions/explorer.module.css";

export const metadata: Metadata = { title: "중국 대학 지원 안내 | 2-2 우리반", description: "칭화대 교내 학교장 추천 안내와 중국 대학 국제학생 학부 지원 절차, 어학·서류·선발 확인" };
const links = {
  tsinghua: "https://international.join-tsinghua.edu.cn/info/1024/1023.htm",
  documents: "https://international.join-tsinghua.edu.cn/List.pdf",
  procedure: "https://international.join-tsinghua.edu.cn/Admission1/Application_Procedures.htm",
  schedule: "https://international.join-tsinghua.edu.cn/Admission1/Schedule.htm",
  fudan: "https://iso.fudan.edu.cn/isoenglish/51327/list.htm",
  zhejiang: "https://iczu.zju.edu.cn/admissionsen/2024/1030/c68988a2981659/page.htm",
};
const steps = [
  ["지원 연도·전공·수업 언어 정하기", "학부 학위과정인지, 중국어·영어·중영 병행 과정인지 확인합니다. 어학연수·예비과정·교환학생과 학부 신입학은 서로 다른 과정입니다."],
  ["국제학생 지원자격 확인", "본인과 부모의 국적, 학력·졸업예정 시기, 나이·미성년자 보호자 조건을 대학별로 확인합니다. 중국 국적 이력이나 부모 국적에 따른 추가 증빙이 있을 수 있습니다."],
  ["학교 추천·개별 지원 경로 상담", "칭화대 교내 학교장 추천을 희망하면 담임에게 먼저 문의합니다. 다른 대학의 개별 지원과 학교 추천 경로는 모집요강과 교내 안내에 따라 각각 확인합니다."],
  ["필요한 시험과 준비 일정 정하기", "지원 전공의 HSK 등급·총점·영역별 점수, TOEFL·IELTS 등 영어 성적, CSCA 등 학업시험의 필수 여부·과목·응시언어·유효기간을 확인합니다. HSK만 있으면 지원 준비가 끝나는 것은 아닙니다."],
  ["서류·추천서 준비", "여권·국적 증빙, 졸업예정 또는 졸업 증명, 고교 성적표, 자기소개·학업계획, 어학·학업시험 성적, 추천서 등을 대학 서류 목록과 대조합니다. 번역·공증, 영상, 재정 증빙 등 추가 요건도 확인합니다."],
  ["공식 시스템으로 원서 제출", "지원 연도의 공식 대학 안내에서 온라인 시스템으로 이동합니다. 원서 입력·서류 업로드·전형료·마감 시각을 확인하고 접수 완료 여부를 확인합니다."],
  ["대학의 서류심사·평가 준비", "대학·전공별 면접·종합평가·추가시험 등 안내에 따릅니다. 교내 추천 면접과 대학이 진행하는 선발 평가는 별개의 과정입니다."],
  ["합격 후 등록·유학 준비", "조건부 합격과 최종 합격의 차이, 등록금 납부·환불 조건, 장학금, 기숙사, 비자·보험·입학 시 원본 검증 등을 대학 안내로 확인합니다."],
];

export default function ChinaAdmissionsPage() {
  return <div className={styles.page}>
    <AdmissionsNav current="china" />
    <header className={styles.hero}><span className={styles.eyebrow}>중국어과 · 국제학생 학부 진학 탐색</span><h1>중국 대학, 어떻게 지원할까?</h1><p>학교 추천과 대학 지원 절차를 구분하고, 관심 대학·전공의 공식 요건을 하나씩 확인해요.</p><p className={styles.muted}>2026.10.29 정리 · 아래 공식 자료는 칭화대 2027, 푸단대·저장대 2026 안내를 기준으로 합니다. 우리 반의 2028 입학 요건·일정이 확정되었다는 뜻은 아닙니다.</p></header>
    <aside className={styles.panel} aria-labelledby="school-recommendation"><h2 id="school-recommendation">우리 학교 칭화대 추천 안내</h2><p>학교장 추천을 희망하는 학생은 담임에게 먼저 문의하세요. <b>학교 추천을 받는 것과 칭화대에 최종 합격하는 것은 별개입니다.</b></p>
      <details><summary><b>2026년 교내 추천 선발 공지 · 참고자료 펼치기</b></summary>
        <p className={styles.muted}>출처: 담임 전달 학교 안내 — 중국 칭화대 학교추천 학생선발 공지(제공 화면 2장). 아래는 2026년 시행 사례입니다. 우리 반의 2028 입학에 적용할 기준·인원·일정은 해당 연도 교내 공지로 확인하세요.</p>
        <dl>
          <dt><b>추천 인원·절차</b></dt><dd>학교장 추천은 교내 1명입니다. 지원 인원에 따라 면접이 필요할 수 있습니다. 1차 서류 심사 후, 지원자가 추천 인원 1명을 넘는 경우에만 2차 면접을 실시합니다.</dd>
          <dt><b>교내 선발 기준</b></dt><dd>HSK 5급 자격증(공지상 점수 무관), 3학년 1학기까지 국영수사과 성적 35%·중국어 성적 35%·서류 및 면접 평가 30%입니다. 교내 기준과 대학의 최종 어학·지원 요건은 각각 확인해야 합니다.</dd>
          <dt><b>면접 내용</b></dt><dd>신청서 내용을 바탕으로 지원 동기·희망 진로(10점), 중국 유학 준비(5점), 중국어 학습 열정·자격증·학업 계획·관련 활동(5점)을 평가합니다. 공지의 서류·면접 30%와 상세 면접 항목 합계 20점의 배점 관계는 담당 교사에게 확인하세요.</dd>
          <dt><b>당시 일정</b></dt><dd>신청 2026.10.20.~10.23. 16:00 / 교내 면접 10.28. 14:15(변경 가능) / 발표 10.30. 12:00 이후 개별 통지 / 추천 합격자 원서 접수 11.20. 베이징 시간 17:00 마감.</dd>
          <dt><b>지원 전 상담</b></dt><dd>공지는 중국 유학을 최우선으로 생각하는 학생의 지원을 원칙으로 안내합니다. 교내 추천은 우리 학교의 추천 경로이며 칭화대 전체 한국인 선발 정원을 뜻하지 않습니다.</dd>
        </dl>
      </details>
    </aside>

    <section className={styles.section} aria-labelledby="china-steps"><h2 id="china-steps">지원 준비 순서</h2><div className={styles.planGrid}>{steps.map(([title, body], index) => <article className={styles.plan} key={title}><span className={styles.eyebrow}>STEP {index + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</div><p className={styles.muted}>칭화대·저장대 공식 지원 절차와 서류 안내를 바탕으로 정리한 공통 확인 순서입니다. 대학별 필수 서류와 절차가 모두 동일한 것은 아닙니다.</p></section>

    <section className={styles.section} aria-labelledby="china-schools"><h2 id="china-schools">관심 대학의 공식 요건 확인</h2>
      <article className={styles.selection}><span className={styles.badge}>칭화대 · 2027 입학 안내</span><h3>칭화대학교 清华大学 · Tsinghua</h3><dl><dt><b>중·영 수업 과정</b></dt><dd>HSK 5급 이상이며 듣기·읽기·쓰기 각 60점 초과를 명시합니다. 비영어 모어 지원자는 TOEFL·IELTS 등 공식 영어 성적도 요구합니다. HSK 면제는 공식 요건과 대학 승인을 확인해야 합니다.</dd><dt><b>영어 수업 과정</b></dt><dd>중국어 성적을 요구하지 않으며, 비영어 모어 지원자는 공식 영어 성적을 제출합니다. 전공별 추가 요건은 별도 확인합니다.</dd><dt><b>서류·선발</b></dt><dd>2027 서류 목록에는 고교 성적·졸업 관련 증명, 어학·학업 성적, 추천서 2부, 자기소개·재정 관련 자료, 중·영 자기소개 영상 등이 포함됩니다. 한국어 서류의 번역·공증 조건도 확인하세요. 서류심사 후 종합평가를 진행하며 평가 방식·일정은 별도 안내합니다.</dd></dl><div className={styles.tools}><a href={links.tsinghua} target="_blank" rel="noopener noreferrer">지원자격 원문 ↗</a><a href={links.documents} target="_blank" rel="noopener noreferrer">2027 제출서류 PDF ↗</a><a href={links.procedure} target="_blank" rel="noopener noreferrer">대학 선발 절차 ↗</a><a href={links.schedule} target="_blank" rel="noopener noreferrer">지원 일정 원문 ↗</a></div><p className={styles.muted}>HSK 충족은 지원 준비의 한 요건입니다. 합격 가능성이나 학업 수행 능력을 보장하지 않습니다. 2028 입학 안내가 나오면 조건과 일정 전체를 다시 확인하세요.</p></article>
      <article className={styles.selection}><span className={styles.badge}>푸단대 · 확인한 학부 목록은 2026 안내</span><h3>푸단대학교 复旦大学 · Fudan</h3><p>국제학생 학부 안내에서 중국어 수업 과정과 영어 수업 과정을 나눠 확인합니다. 중국어 과정의 전공별 CSCA 과목표와 학비표가 별도로 제공됩니다. 영어 과정도 전공별 어학·학업시험·수학 배경 등 요건을 확인해야 합니다.</p><p>경제·국제관계 등 관심 학과의 실제 수업 내용과 수업 언어를 먼저 비교하세요. 새 지원 연도의 대학 전체 요강과 전공별 공지가 같은 시기에 갱신되는지 확인합니다.</p><a className={styles.primary} href={links.fudan} target="_blank" rel="noopener noreferrer">푸단대 공식 학부 안내 ↗</a></article>
      <article className={styles.selection}><span className={styles.badge}>저장대 · 2026 지원 안내 참고</span><h3>저장대학교 浙江大学 · Zhejiang</h3><p>중국어 과정은 HSK, 영어 과정은 비영어 모어 지원자의 영어 성적을 확인합니다. 필요한 등급·점수와 추가 조건은 전공 목록에 따릅니다.</p><p>확인한 안내에는 국제학생 학부 지원자의 CSCA 성적 제출, 고교 성적표·자기소개·교사 추천서 2부 등이 명시되어 있습니다. 예비심사 통과 후 학과의 영상 면접을 진행하고 학업·어학·면접 등을 종합적으로 평가합니다.</p><a className={styles.primary} href={links.zhejiang} target="_blank" rel="noopener noreferrer">저장대 공식 학부 지원 안내 ↗</a><p className={styles.muted}>2026 안내에 적힌 마감일과 여권·국적·거주 기간 등의 날짜를 2028 지원에 그대로 적용하지 마세요.</p></article>
    </section>
    <section className={styles.panel}><h2>담임 상담 전에 가져올 것</h2><ul><li>관심 대학 2~3곳, 희망 전공과 수업 언어</li><li>현재 HSK·영어 성적과 향후 응시 계획</li><li>고교 성적표와 관심 분야의 공부·활동 기록</li><li>추천 희망 여부, 지원 연도, 비용·장학금 관련 질문</li><li>각 대학 공식 모집요강에서 찾은 지원자격·시험·서류 목록</li></ul><p>학생마다 어학·학업 준비, 희망 전공, 국적·학력 조건이 달라 개별적으로 확인합니다. 중국 대학은 학교 이름이나 HSK 등급 하나로 지원 범위를 정하지 않습니다.</p></section>
  </div>;
}
