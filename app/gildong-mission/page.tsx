import ParkMap from "./ParkMap";
import PhotoContest from "./PhotoContest";

export default function GildongMissionPage() {
  return <>
    <header className="park-header"><a className="park-brand" href="#home"><span className="brand-leaf">❧</span> 중어과의 가을</a><nav aria-label="산책 메뉴"><a href="#walk-guide">오늘의 안내</a><a href="#park-map">지도</a><a href="#photo-contest">사진첩</a></nav></header>
    <div className="park-content">
      <section id="home" className="walk-hero">
        <p className="park-eyebrow">2학년 중국어과 1·2반 · 2026. 10. 14 수요일</p>
        <h1>잠깐, 쉬어 가는 가을.<br /><em>오늘은 너와 함께.</em></h1>
        <p className="hero-description">명찰 속 짝을 만나, 천천히 걷고 이야기를 나눠요.<br />종이에는 서로의 이야기, 사진에는 우리의 가을을 담아요.</p>
        <div className="hero-actions"><a className="park-primary" href="#photo-contest">우리의 사진 남기기 ↗</a><a className="walk-secondary" href="#park-map">공원 지도 보기</a></div>
        <div className="walk-times"><span><b>13:30</b> 학교 출발</span><span><b>14:00–15:00</b> 길동생태공원</span><span>집결·복귀는 선생님 안내에 따라요</span></div>
      </section>
      <section id="walk-guide" className="park-section"><div className="park-section-heading"><div><p className="park-eyebrow">오늘, 이렇게 함께해요</p><h2>종이 한 장과 짝꿍 한 명.</h2></div></div>
        <div className="walk-cards">
          <article><span className="walk-step">01 · 만나기</span><h3>명찰 속 내 짝 찾기</h3><p>선생님이 준비한 명찰과 질문지를 받아요. 나와 이어지는 이름을 찾아 오늘의 산책 친구를 만나요.</p></article>
          <article><span className="walk-step">02 · 이야기하기</span><h3>답은 종이에, 대화는 천천히</h3><p>각자의 종이 질문을 따라 서로 이야기하고 펜으로 기록해요. 답을 듣고 “왜?”, “어떤 점이?”처럼 꼬리 질문도 이어 보세요.</p></article>
          <article><span className="walk-step">03 · 기억하기</span><h3>짝을 닮은 식물, 함께한 순간</h3><p>짝과 잘 어울리는 식물 사진과 짝꿍 사진을 찍어 주세요. 사진마다 제목이나 짧은 설명을 붙여 사진첩에 남겨요.</p></article>
        </div>
        <details className="paper-questions"><summary>종이 질문 예시 보기 · 실제 질문은 각자의 종이를 봐 주세요</summary><ol><li>학교 끝나고 집에 돌아가면 주로 무엇을 하면서 시간을 보내?</li><li>최근에 본 책이나 영화, 영상 중에서 다른 사람에게 꼭 추천하고 싶은 것이 있어?</li><li>앞으로 꼭 도전해 보고 싶은 일이 있어?</li><li>5년 후의 내가 지금의 나에게 편지를 쓴다면 어떤 말이 꼭 듣고 싶어?</li></ol><p>사진 속 ‘지킬 박사’ 질문지 예시예요. 다른 이름의 질문지는 내용이 다를 수 있어요. 말하기 어려운 질문은 편하게 건너뛰어도 돼요.</p></details>
        <p className="walk-note">인터뷰 답변은 웹에 올리지 않아요. 종이는 선생님 안내에 따라 마무리하고, 사진은 친구에게 공유해도 되는지 물어봐 주세요.</p>
      </section>
      <section id="park-map" className="park-section"><div className="park-section-heading"><div><p className="park-eyebrow">길을 확인하고, 화면은 잠깐 내려놓기</p><h2>오늘의 산책 지도</h2></div></div><p className="park-description">탐방로를 따라 함께 걸어요. 모이는 장소와 시간은 선생님 안내를 확인해 주세요.</p><div className="park-links"><a href="https://map.naver.com/p/search/길동생태공원" target="_blank" rel="noopener noreferrer">네이버 지도에서 공원 길찾기 ↗</a><a href="https://map.naver.com/p/search/한영외국어고등학교" target="_blank" rel="noopener noreferrer">학교로 돌아가는 길 ↗</a><a href="https://ebook.seoul.go.kr/Viewer/9IOSDTW1G7SP" target="_blank" rel="noopener noreferrer">공원 안내서 펼치기 ↗</a></div><p className="walk-note">네이버 지도에서 ‘길찾기 → 도보’를 선택해 주세요. 아래 그림은 공원 내부 안내도예요.</p><ParkMap /></section>
      <PhotoContest />
      <section className="park-share"><div><p className="park-eyebrow">같은 산책, 서로 다른 장면</p><h2>1반도 2반도, 이곳에서 함께.</h2><p>링크나 QR로 바로 들어와 사진을 올릴 수 있어요.<br />다른 반 친구들의 가을도 구경하고 좋아요로 마음을 전해요.</p></div><img src="/gildong-mission/gildong-mission-qr.png" alt="1·2반 가을 산책 페이지 QR 코드" width="136" height="136" /></section>
      <footer className="park-footer"><b>❧ 중어과의 2026 가을</b><span>길동생태공원 · 함께 걷고 서로 듣는 시간</span><a href="#home">맨 위로 ↑</a></footer>
    </div><nav className="park-mobile-nav" aria-label="빠른 이동"><a href="#walk-guide">산책 안내</a><a href="#park-map">공원 지도</a><a href="#photo-contest">사진첩</a></nav>
  </>;
}
