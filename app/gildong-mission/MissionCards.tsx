"use client";

const missions = [
  { number: "01", kind: "짝과 어울리는 식물", title: "내 짝을 닮은 식물", where: "길에서 만난 식물", copy: "짝과 닮았거나 잘 어울리는 식물을 골라요. 사진 한 장에 이유 한 줄을 남겨요.", example: "내 짝은 풀꽃 같다. 어디서든 잘 지낼 것 같아서.", action: "식물 사진 남기기" },
  { number: "02", kind: "컨셉 사진", title: "둘이 만든 한 장", where: "마음에 드는 산책길", copy: "앨범 커버, 영화 포스터, 짝꿍 포즈. 우리 둘만의 컨셉으로 한 장 찍어요.", example: "우리의 가을 앨범, 첫 번째 사진.", action: "컨셉 사진 남기기" },
  { number: "03", kind: "숏츠", title: "20초의 가을", where: "공원 어디서든", copy: "발걸음, 나뭇잎, 짝의 한마디. 짧은 영상으로 오늘의 분위기를 담아요.", example: "세 장면이면 충분해요. 걷기 → 가을 → 우리.", action: "짧은 영상 남기기" },
];

export default function MissionCards() {
  function choose(mission: string) {
    window.dispatchEvent(new CustomEvent("gildong-start-mission", { detail: { mission } }));
    requestAnimationFrame(() => document.getElementById("photo-contest")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  return <section id="walk-missions" className="park-section">
    <div className="section-title"><h2>마음 가는 장면 하나</h2><span>선택 미션</span></div>
    <p className="section-copy">다 하지 않아도 괜찮아요. 지도에서 걷고 싶은 길을 고르고, 하고 싶은 것 하나만 골라봐요.</p>
    <div className="walk-mission-cards">{missions.map(m => <article key={m.number} className={`walk-mission-card mission-${m.number}`}>
      <div className="mission-card-meta"><span>{m.number}</span><small>{m.where}</small></div>
      <h3>{m.title}</h3><p>{m.copy}</p><details className="mission-example"><summary>예시 보기</summary><blockquote>{m.example}</blockquote></details>
      <div className="mission-card-actions"><button className="hy-btn" onClick={() => choose(m.kind)}>{m.action} <span aria-hidden="true">↗</span></button>{m.number === "01" && <a href="#plant-guide">식물 안내서 보기</a>}</div>
    </article>)}</div>
    <p className="walk-note">미션 없이 천천히 걷고 이야기해도 좋아요. 오후 3시 40분에는 안내받은 장소로 돌아와요.</p>
  </section>;
}
