"use client";

import { useState } from "react";
import universities from "../../public/admissions-2028/sen-universities.json";
import styles from "./sen-plan.module.css";

export const SEN_PDF = "/admissions-2028/sen-preview-20261014.pdf";
const source = (page: number) => `${SEN_PDF}#page=${page}`;
const sections = [
  [3, "대학별 한눈에 비교", "3~10쪽 · 교과 / 학종 / 논술 / 정시"],
  [11, "교과·학교장추천", "11~20쪽 · 추천 조건과 수능최저"],
  [21, "학종 면접형", "21~26쪽 · 단계별 비율과 평가요소"],
  [27, "학종 서류형", "27~29쪽 · 서류평가와 수능최저"],
  [30, "논술", "30~38쪽 · 반영비율과 출제 유형"],
  [39, "기회균형·특수대학", "39~54쪽 · 지원자격부터 확인"],
  [55, "의약·보건·교육·첨단", "55~97쪽 · 분야별 모집단위"],
  [98, "82개 대학 상세표", "98~334쪽 · 변경사항·최저·학과별 인원"],
] as const;
const terms = [
  ["대학명·캠퍼스", "서울/글로벌·본교/제2캠퍼스를 구분합니다. 같은 대학의 총인원과 특정 캠퍼스 인원은 다를 수 있습니다."],
  ["교과 / 종합 / 논술 / 정시", "서로 다른 선발 방식입니다. 교과는 성적 중심, 학종은 학생부 종합평가, 논술은 대학별 논술 중심, 정시는 수능 중심입니다. 각각 서류·면접·출결이 추가될 수 있습니다."],
  ["인원 / 2028·2027", "모집인원입니다. 합격 등급이나 경쟁률이 아닙니다. 연도별 인원을 나란히 놓은 표는 증감을 비교하는 용도입니다. 계약학과·정원외·자율전공 포함 범위를 확인합니다."],
  ["추천형(10명)·학교추천(12명)", "고교별 추천 가능 인원입니다. 해당 전형의 전체 모집인원과 다릅니다. 추천이 있어도 외고·졸업연도 등 지원자격을 별도로 충족해야 합니다."],
  ["서류100(5배수)", "서류평가 100%로 1단계 합격자를 모집인원의 5배수까지 뽑는다는 뜻입니다. 10명 모집이면 원칙적으로 50명이며 동점자 처리는 별도입니다."],
  ["1단계80 + 면접20", "1단계 성적을 80%, 면접을 20% 반영해 최종 평가합니다. 1단계 통과가 최종 합격은 아닙니다. 단순 원점수 계산은 대학별 환산방식 확인이 필요합니다."],
  ["일괄전형·서류100", "여러 단계를 거치지 않고 정해진 전형요소로 평가합니다. 서류100은 내신 평균만 본다는 뜻이 아니며 과목 선택·성취·세특·활동의 맥락을 함께 봅니다."],
  ["● / ○ / 빈칸", "열 제목을 먼저 봅니다. ‘최저’ 열의 원은 수능최저 적용, ‘면접 전/후’ 열의 원은 수능 전/후 면접 시기를 뜻합니다. 과목 열의 원은 반영 가능 영역입니다. 빈칸과 특수기호는 해당 표의 주석까지 확인합니다."],
  ["국·수·영·사·과·史", "국어·수학·영어·사회탐구·과학탐구·한국사입니다. ‘사’와 ‘史’는 다릅니다. 한국사를 합산 영역으로 인정하는 대학과 별도 등급 조건으로 두는 대학이 있습니다."],
  ["탐(1) / 탐(2, 평균)", "탐구 1과목 반영 / 탐구 2과목 평균 반영입니다. 국수영사과처럼 사회·과학을 나눠 적은 경우 두 탐구를 별개로 인정하는지 원문을 확인합니다. 임의로 1개 영역으로 묶지 않습니다."],
  ["가·나·다군", "정시 모집군입니다. 일반적인 정시 지원은 모집군별 1회이며 예외 대학이 있습니다. 한 대학도 학과·전형별 모집군이 다를 수 있습니다."],
  ["★·♥·색상·▲▼", "표마다 범례가 다릅니다. 앞쪽 교과표의 ★는 재학생 제한, 뒤쪽 학과별 표의 ★는 교직과정일 수 있습니다. ♥는 자율전공 과정 표기입니다. ▲15는 15%포인트 증가이며, 색만으로 의미를 단정하지 않습니다."],
];

export default function SenPlanGuide({ onUniversity }: { onUniversity: (name: string) => void }) {
  const [selected, setSelected] = useState("한국외국어대");
  const university = universities.find((item) => item.name === selected)!;
  return (
    <div className={styles.root}>
      <article className={styles.intro}>
        <div><span className={styles.badge}>NEW · 2026.10.14 자료</span><h3>쎈(SEN)진학 프리뷰, 이렇게 읽어요</h3>
          <p>335쪽의 전형 안내를 읽기 쉽게 풀었습니다. 이 자료는 <strong>2028학년도 선발 계획</strong>이며, 합격선이나 내 점수의 합격 확률을 알려주는 표는 아닙니다.</p></div>
        <div className={styles.introActions}><a className={styles.button} href={SEN_PDF} target="_blank" rel="noopener noreferrer">원문 PDF 열기 ↗</a><button type="button" onClick={() => document.getElementById("ad-plan-filters")?.scrollIntoView({ behavior: "smooth", block: "start" })}>전형 검색으로 바로 이동 ↓</button></div>
      </article>
      <p className={styles.scope}><strong>검색자료 반영 범위</strong> 주요 15개 대학의 60개 전형을 새 자료와 대조했습니다. 그 외 검색 카드는 인천교육청 7월 자료입니다. 전체 82개 대학의 새 상세표는 아래 원문 바로가기에서 확인할 수 있습니다. 계열 표시는 탐색용 분류로, 실제 학과 개설·모집 여부는 원문에서 확인하세요.</p>

      <details className={styles.details} open>
        <summary>① 처음 보는 표, 이 순서로 읽으세요</summary>
        <div className={styles.body}>
          <ol className={styles.steps}>
            <li><b>지원할 수 있나?</b><span>대학·캠퍼스·모집단위 → 외고 지원 가능 여부 → 졸업연도·학교장추천 조건</span></li>
            <li><b>무엇으로 뽑나?</b><span>전형명 → 1단계 요소와 선발배수 → 2단계 서류·면접 비율</span></li>
            <li><b>수능 조건은?</b><span>최저 적용 여부 → 필수 영역 → 등급 합·영어·한국사·탐구 반영법</span></li>
            <li><b>얼마나·언제 뽑나?</b><span>모집인원·캠퍼스 포함 범위 → 면접·논술 시기 → 최종 모집요강</span></li>
          </ol>
          <div className={styles.callout}><b>외고 학생의 첫 확인은 ‘지원자격’입니다.</b><p>‘지역균형’이나 ‘추천형’이라는 이름만으로 지원 가능하다고 판단하면 안 됩니다. 서울대 지역균형 등 추천 전형은 고교 유형 제한을 먼저 확인하고, 외고 지원이 가능한 전형을 골라야 합니다. 교내 추천 가능 여부도 별도로 확인하세요.</p></div>
          <div className={styles.tableWrap}><table><caption>열 제목과 축약어 해설</caption><thead><tr><th scope="col">표의 표현</th><th scope="col">풀어 읽으면</th></tr></thead><tbody>{terms.map(([term, text]) => <tr key={term}><th scope="row">{term}</th><td>{text}</td></tr>)}</tbody></table></div>
        </div>
      </details>

      <details className={styles.details}>
        <summary>② ‘3합7’과 ‘3개 각3’, 어떻게 다른가요?</summary>
        <div className={styles.body}>
          <p><strong>수능최저는 수능 등급으로 보는 별도 조건</strong>입니다. 내신 5등급제의 내신 등급 합이 아닙니다. 충족했다고 합격하는 것도 아니며, 학생부·면접 평가와 함께 충족해야 합니다.</p>
          <div className={styles.tableWrap}><table><caption>등급 합과 영역별 조건 비교 — 이해를 위한 가상 예시</caption><thead><tr><th scope="col">표현</th><th scope="col">조건</th><th scope="col">예시</th></tr></thead><tbody>
            <tr><th scope="row">3개 합 7 / 3합7</th><td>인정 영역 중 3개의 등급 합이 7 이하</td><td>1+2+4=7 충족 / 2+3+3=8 미충족</td></tr>
            <tr><th scope="row">3개 각 3 / 3개3</th><td>인정 영역 3개가 각각 3등급 이내</td><td>3·3·3 충족 / 1·1·4는 미충족</td></tr>
            <tr><th scope="row">1등급 2개 / 2개1</th><td>인정 영역 2개에서 각각 1등급</td><td>1·1 충족 / 1·2는 미충족</td></tr>
            <tr><th scope="row">영3 · 한국사4</th><td>영어 3등급 이내, 한국사 4등급 이내 조건을 별도로 충족</td><td>합 기준을 맞춰도 영어가 4등급이면 미충족</td></tr>
          </tbody></table></div>
          <p className={styles.note}>‘수학 포함’, ‘국어 또는 수학 필수’, 탐구 평균·절사·등급 조정 조건이 붙으면 선택 가능한 조합이 달라집니다. 영어·한국사를 임의로 빼거나, 유리한 과목만 골라 합산하면 안 됩니다.</p>
        </div>
      </details>

      <details className={styles.details}>
        <summary>③ 실제 대학 전형을 한 줄씩 풀어 읽기</summary>
        <div className={styles.body}>
          <div className={styles.examples}>
            <article><h4>고려대 학업우수형</h4><small>SEN 21·23·138쪽</small><p><b>서류100(5배수) → 1단계80+면접20</b></p><p>서류로 먼저 5배수를 선발하고, 1단계 성적 80%와 면접 20%로 최종 평가합니다. 일반 모집단위 최저는 국·수·영·탐(1) 4개 합 9, 한국사 4등급 이내입니다. 의학과에는 별도 최저·면접 조건이 있습니다.</p><p className={styles.meaning}>준비 방향: 학생부와 면접을 준비하면서 수능 4개 영역도 함께 관리합니다.</p></article>
            <article><h4>서강대 일반Ⅰ vs 일반Ⅱ</h4><small>SEN 27·189쪽</small><p><b>둘 다 서류100, 수능최저는 다름</b></p><p>일반Ⅰ은 최저가 없고, 일반Ⅱ는 국·수·영·탐(1) 중 3개 합 7과 한국사 4등급 이내를 요구합니다. 면접 없이 서류로 평가한다는 공통점만 보고 같은 조건으로 생각하면 안 됩니다.</p><p className={styles.meaning}>준비 방향: 학생부 평가와 함께 내 수능최저 충족 가능성을 비교합니다.</p></article>
            <article><h4>한국외대 면접형 vs 서류형 vs SW인재</h4><small>SEN 3·22·27·309쪽</small><p><b>면접형: 3배수 → 1단계50+면접50</b></p><p>면접형은 최저가 없습니다. 서류형은 서류100+수능최저이며, SW인재는 서류100·최저 없음으로 별도 구분합니다. 서류형의 구체적인 최저 등급은 PDF 내부 표가 달라 입학처 확인이 필요합니다.</p><p className={styles.meaning}>준비 방향: 면접 부담과 최저 조건을 전형별로 비교하세요.</p></article>
          </div>
          <div className={styles.callout}><b>학업40·진로40·공동체20은 ‘내신 40%’가 아닙니다.</b><p>서류평가 안에서 각 역량을 평가하는 비중입니다. 학업역량에는 성취도·학업태도·탐구력이, 진로역량에는 과목 선택과 관련 탐색이, 공동체역량에는 협력·소통·책임감 등이 포함될 수 있습니다. 대학별 평가항목이 다르며, 21·27쪽의 평가요소는 2027 자료·공동연구를 바탕으로 한 참고 정보입니다. 2028 확정 평가기준과 구분해 읽으세요.</p></div>
        </div>
      </details>

      <details className={styles.details}>
        <summary>④ 자료가 다르거나 일정이 적혀 있다면?</summary>
        <div className={styles.body}>
          <ul className={styles.warnings}>
            <li><b>면접·논술 날짜:</b> 앞쪽 교과·논술표에 있는 일정은 2027학년도 기준 참고 정보입니다. 2028학년도 확정 일정은 2027년 발표될 모집요강에서 확인합니다.</li>
            <li><b>한국외대 서류형 최저:</b> 27쪽은 서울 2합6·글로벌 2합7, 309쪽은 서울 2합5·글로벌 2합6으로 표기되어 있습니다. 현재는 ‘확인 필요’로 안내합니다.</li>
            <li><b>중앙대 의학부 UP:</b> 3쪽과 274쪽의 선발배수·면접비율이 다릅니다. 면접 실시 여부와 별개로 세부 비율은 입학처에 확인해야 합니다.</li>
            <li><b>인원이 다를 때:</b> 건국대 KU자기추천은 21쪽에서 일반 727명·자유전공 183명으로 나누지만 116쪽은 910명으로 합칩니다. 계약학과·캠퍼스 구분도 확인하세요. 그래도 다른 수치는 임의로 합치지 않습니다.</li>
          </ul>
          <p className={styles.note}>이 페이지의 검색 결과는 합격 예측이 아닙니다. 조건이 충돌하면 최신 대학 입학처 시행계획과 정정 공지를 먼저 확인하고, 실제 원서접수 때는 최종 모집요강을 기준으로 판단하세요.</p>
          <a href="https://admission.cau.ac.kr/2028_iphak/typeA/index.html" target="_blank" rel="noopener noreferrer">중앙대 공식 2028 전형 안내 ↗</a>
        </div>
      </details>

      <details className={styles.details}>
        <summary>⑤ 원문에서 찾기 — 분야별 목차와 82개 대학</summary>
        <div className={styles.body}>
          <div className={styles.links}>{sections.map(([page, label, detail]) => <a key={page} href={source(page)} target="_blank" rel="noopener noreferrer"><b>{label} ↗</b><small>{detail}</small></a>)}</div>
          <div className={styles.navigator}>
            <label htmlFor="sen-university">대학별 상세표 바로가기</label>
            <select id="sen-university" value={selected} onChange={(event) => setSelected(event.target.value)}>{universities.map((item) => <option key={item.name}>{item.name}</option>)}</select>
            <a className={styles.button} href={source(university.page)} target="_blank" rel="noopener noreferrer">{university.page}~{university.endPage}쪽 열기 ↗</a>
            <button type="button" onClick={() => onUniversity(university.searchName)}>이 대학 전형 검색 ↓</button>
          </div>
          <p className={styles.note}>새 창에서 선택한 쪽을 엽니다. 모바일 PDF 뷰어가 쪽 이동을 지원하지 않으면 표시된 쪽수를 직접 입력하세요. 검색자료에 없는 대학도 원문에서 확인할 수 있습니다.</p>
        </div>
      </details>
    </div>
  );
}
