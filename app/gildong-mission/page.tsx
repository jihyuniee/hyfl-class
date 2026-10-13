import ParkMap from "./ParkMap";
import PhotoContest from "./PhotoContest";

const guideUrl = "https://ebook.seoul.go.kr/Viewer/9IOSDTW1G7SP";
export default function GildongMissionPage() {
  return <>
    <header className="park-header"><a className="park-brand" href="#home">중어과의 2026 가을</a><span className="header-date">10월 14일 · 수요일</span></header>
    <div className="park-content">
      <section id="home" className="walk-cover">
        <p className="cover-meta">한영외고 2학년 1·2반</p>
        <h1>길동생태공원<br />가을 산책</h1>
        <p className="cover-description">짝꿍과 이야기하고, 마음에 드는 장면을 남겨요.</p>
        <dl className="outing-schedule"><div><dt>출발</dt><dd>학교에서 오후 1시 30분</dd></div><div><dt>공원</dt><dd>오후 2시–3시</dd></div></dl>
        <nav className="quick-links" aria-label="산책 바로가기"><a href="#park-map">지도·길찾기 <span>↗</span></a><a href="#plant-guide">식물 안내서 <span>↗</span></a><a href="#photo-contest">사진 올리기 <span>↗</span></a></nav>
      </section>
      <section id="park-map" className="park-section"><div className="section-title"><h2>어디로 가면 될까요?</h2><span>지도</span></div>
        <div className="route-links"><a href="https://map.naver.com/p/search/길동생태공원" target="_blank" rel="noopener noreferrer"><b>공원으로 가는 길</b><span>네이버 지도 열기 ↗</span></a><a href="https://map.naver.com/p/search/한영외국어고등학교" target="_blank" rel="noopener noreferrer"><b>학교로 돌아가는 길</b><span>네이버 지도 열기 ↗</span></a></div>
        <p className="walk-note">네이버 지도에서 길찾기 → 도보를 선택하세요. 입구와 모일 장소는 선생님 안내를 따라요.</p>
        <h3 className="map-caption">길동생태공원 안내도</h3><ParkMap />
      </section>
      <section id="plant-guide" className="park-section"><div className="section-title"><h2>이 식물, 이름이 뭘까?</h2><span>안내서</span></div>
        <p className="section-copy">궁금한 식물이 보이면 사진과 설명을 찾아보세요. 서울시 안내서에 공원의 식물·새·곤충이 담겨 있어요.</p>
        <a className="leaflet-link" href={guideUrl} target="_blank" rel="noopener noreferrer"><span className="leaflet-book" aria-hidden="true">길동<br />생태공원<br /><small>사용설명서</small></span><span><b>식물 안내서 전체 보기</b><small>사진과 특징으로 살펴보는 동식물 50종</small><em>새 창에서 펼치기 ↗</em></span></a>
        <details className="plant-notes" open><summary>산책하면서 만날 식물 · 사진으로 보기</summary><dl className="plant-photo-list"><div><dt>수크령</dt><dd><figure><a href="/gildong-mission/plant-sukryeong.webp" target="_blank" rel="noopener noreferrer" aria-label="수크령 사진 크게 보기"><img src="/gildong-mission/plant-sukryeong.webp" alt="길동생태공원 안내서의 수크령 꽃이삭 사진" width={848} height={589} loading="lazy" /></a><figcaption>수크령 · 꽃이삭 · 누르면 크게 볼 수 있어요</figcaption></figure>공원 초입에서 볼 수 있는 벼과의 여러해살이풀이에요. 꽃이삭의 모양을 관찰해 보세요.</dd></div><div><dt>산국</dt><dd><figure><a href="/gildong-mission/plant-sanguk.webp" target="_blank" rel="noopener noreferrer" aria-label="산국 사진 크게 보기"><img src="/gildong-mission/plant-sanguk.webp" alt="길동생태공원 안내서의 노란 산국 꽃 사진" width={848} height={589} loading="lazy" /></a><figcaption>산국 · 가을꽃 · 누르면 크게 볼 수 있어요</figcaption></figure>가을에 노란 꽃이 피는 국화류예요. 공원 입구부터 생태숲까지 찾아볼 수 있어요.</dd></div><div><dt>산수유</dt><dd><figure><a href="/gildong-mission/plant-sansuyu.webp" target="_blank" rel="noopener noreferrer" aria-label="산수유 사진 크게 보기"><img src="/gildong-mission/plant-sansuyu.webp" alt="길동생태공원 안내서의 노란 산수유 봄꽃 사진" width={848} height={589} loading="lazy" /></a><figcaption>산수유 · 봄꽃 참고 사진 · 누르면 크게 볼 수 있어요</figcaption></figure>타원형의 붉은 열매가 열려요. 열매는 겨울철 새들의 먹이가 돼요.</dd></div><div><dt>갈참나무</dt><dd><figure><a href="/gildong-mission/plant-galcham.webp" target="_blank" rel="noopener noreferrer" aria-label="갈참나무 사진 크게 보기"><img src="/gildong-mission/plant-galcham.webp" alt="길동생태공원 안내서의 갈참나무 잎 사진" width={848} height={589} loading="lazy" /></a><figcaption>갈참나무 · 잎의 모양 · 누르면 크게 볼 수 있어요</figcaption></figure>도토리가 열리는 참나무류예요. 안내서에는 잎 뒷면이 흰 것이 특징이라고 소개되어 있어요.</dd></div></dl><p className="walk-note">출처: 서울시 「길동생태공원 사용설명서」, 2020년 9월. 실제 모습은 계절과 현장 상태에 따라 달라요. 식물은 꺾지 않고 눈으로 살펴봐요.</p></details>
      </section>
      <section id="walk-guide" className="park-section"><div className="section-title"><h2>오늘의 짝꿍과 함께</h2><span>활동 안내</span></div>
        <ol className="walk-list"><li><b>명찰을 받고 짝 찾기</b><p>선생님이 준비한 이름과 이어지는 짝을 찾아요.</p></li><li><b>이야기는 종이에 적기</b><p>각자의 질문지로 서로 이야기하고 펜으로 기록해요. 답을 듣고 궁금한 점을 더 물어봐도 좋아요.</p></li><li><b>사진으로 기억하기</b><p>짝과 잘 어울리는 식물, 짝꿍의 모습, 오늘의 가을을 찍어요. 사진첩에는 제목과 짧은 설명을 남길 수 있어요.</p></li></ol>
        <details className="paper-questions"><summary>질문지 예시 보기</summary><ol><li>학교 끝나고 집에 돌아가면 주로 무엇을 하면서 시간을 보내?</li><li>최근에 본 책이나 영화, 영상 중에서 다른 사람에게 꼭 추천하고 싶은 것이 있어?</li><li>앞으로 꼭 도전해 보고 싶은 일이 있어?</li><li>5년 후의 내가 지금의 나에게 편지를 쓴다면 어떤 말이 꼭 듣고 싶어?</li></ol><p>‘지킬 박사’ 질문지 예시입니다. 실제로 받은 종이의 질문을 따라 주세요. 말하기 어려운 질문은 건너뛰어도 돼요.</p></details>
        <p className="walk-note">인터뷰 답변은 종이에만 남겨요. 사진을 올리기 전에는 친구에게 공유해도 되는지 물어봐 주세요.</p>
      </section>
      <PhotoContest />
      <details className="share-link"><summary>친구에게 링크·QR 공유하기</summary><p>1반과 2반 모두 같은 링크로 들어올 수 있어요.</p><img src="/gildong-mission/gildong-mission-qr.png" alt="가을 산책 사진첩 참여 QR 코드" width="136" height="136" /></details>
      <footer className="park-footer"><span>2026. 10. 14 · 길동생태공원</span><a href="#home">위로 ↑</a></footer>
    </div><nav className="park-mobile-nav" aria-label="빠른 이동"><a href="#park-map">지도</a><a href="#plant-guide">식물 안내서</a><a href="#photo-contest">사진첩</a></nav>
  </>;
}
