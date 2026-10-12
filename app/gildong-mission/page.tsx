import ParkMap from "./ParkMap";
import PhotoContest from "./PhotoContest";
import MissionTrail from "./MissionTrail";

export default function GildongMissionPage() {
  return <>
    <header className="park-header"><a className="park-brand" href="#home"><span className="brand-leaf">❧</span> 길동 미션톡 <small>GILDONG / AUTUMN WALK</small></a><nav aria-label="탐험 메뉴"><a href="#missions">미션</a><a href="#park-map">지도</a><a href="#photo-contest">사진전</a><a href="#shorts">숏츠</a></nav></header>
    <div className="park-content">
      <section id="home" className="park-hero">
        <div className="hero-copy"><p className="park-eyebrow">2026. 10. 14 · 길동생태공원 · HR</p><h1>둘이 걷는 가을,<br /><em>우리만의 발견.</em></h1><p className="hero-description">로미오와 줄리엣의 미션 산책.<br />천천히 걷고, 자세히 보고, 함께 웃는 시간.</p><a className="park-primary" href="#missions">우리의 탐험 시작하기 <span>↗</span></a><p className="hero-footnote">선생님이 정해 주신 짝과 함께 참여해요.</p></div>
        <div className="hero-art" aria-hidden="true"><svg viewBox="0 0 440 400"><path fill="#dce7c9" d="M0 290Q100 180 205 255T440 235V400H0Z"/><path fill="#9bad89" d="M0 355Q130 270 260 320T440 290V400H0Z"/><path fill="none" stroke="#f7edcf" strokeWidth="32" d="M242 400Q170 355 230 316T220 265"/><g stroke="#55704c" strokeWidth="5"><path d="M87 308V145M347 318V128M290 295V178"/></g><g fill="#55744e"><ellipse cx="87" cy="134" rx="54" ry="89"/><ellipse cx="347" cy="124" rx="63" ry="99"/></g><ellipse cx="290" cy="174" rx="35" ry="59" fill="#a9b77c"/><g fill="#c18a52"><ellipse cx="51" cy="253" rx="8" ry="4" transform="rotate(-30 51 253)"/><ellipse cx="185" cy="150" rx="9" ry="4" transform="rotate(25 185 150)"/><ellipse cx="387" cy="274" rx="8" ry="4"/></g><circle cx="206" cy="74" r="29" fill="#edc984"/><g stroke="#234b3c" strokeWidth="5" strokeLinecap="round"><path d="M183 330l-4 19m4-19 6 18m-6-40v22m-1-14-8 9m9-8 9 7"/><path d="M209 321l-4 20m4-20 6 19m-6-41v23m0-13-10 12m10-11 8 7"/></g><circle cx="183" cy="302" r="6" fill="#234b3c"/><circle cx="209" cy="293" r="6" fill="#234b3c"/></svg><div className="art-label">FIELD NOTES <b>가을은, 함께 발견하는 것.</b></div></div>
      </section>
      <div className="park-intro-strip"><span><b>01</b> 정해진 짝과 출발</span><span><b>02</b> 관찰 · 인터뷰 · 가을 사진</span><span><b>03</b> 사진 공유 · 좋아요 응원</span></div>
      <section className="walk-goal"><p className="park-eyebrow">TODAY’S GOAL</p><h2>친구의 새로운 모습 하나,<br />자연의 새로운 발견 하나.</h2><p>걸어가는 길에는 “시험 끝나고 가장 하고 싶었던 일은?”을 서로 물어봐요.<br />이동 중에는 기록하지 않고, 공원에 도착해서 미션을 펼쳐요.</p></section>
      <MissionTrail />
      <section id="park-map" className="park-section"><div className="park-section-heading"><div><p className="park-eyebrow">EXPLORE THE PARK</p><h2>오늘의 탐험 지도</h2></div><span className="park-note">탐방로를 따라 천천히</span></div><p className="park-description">습지, 생태숲, 농촌체험학습장을 지도에서 찾아보세요. 모이는 장소와 시간은 선생님 안내를 따릅니다.</p><ParkMap /><div className="park-links"><a href="https://parks.seoul.go.kr/resource/www/leaflet/gildong_map.pdf" target="_blank" rel="noopener noreferrer">안내도 PDF ↗</a><a href="https://parks.seoul.go.kr/content.do?key=2604300010" target="_blank" rel="noopener noreferrer">공원 공식 안내 ↗</a></div></section>
      <PhotoContest />
      <section id="shorts" className="park-section"><div className="park-section-heading"><div><p className="park-eyebrow">BONUS / SHORT FILM</p><h2>우리 가을의 15초 예고편</h2></div><span className="park-note">선택 미션</span></div><p className="park-description">풍경 5초 + 발걸음 5초 + 오늘의 발견 5초. 마지막 자막은 “우리의 가을은 지금”.</p><div className="guide-grid"><a className="guide-card" href="https://www.capcut.com/ko-kr/tools/video-editor-download" target="_blank" rel="noopener noreferrer"><span>01 / CapCut</span><h3>사진과 영상을 이어 붙이기 ↗</h3><p>앱 설치 → 새 프로젝트 → 사진·영상 선택 → 9:16 세로 화면 → 짧은 자막 → 내보내기.</p></a><a className="guide-card" href="https://vrew.ai/ko/" target="_blank" rel="noopener noreferrer"><span>02 / Vrew AI</span><h3>한 문장을 영상으로 만들기 ↗</h3><p>설치 → 새 프로젝트 → 영상 불러오기 → 자동 자막 확인·수정 → 내보내기. 완성한 영상은 선생님 안내에 따라 제출해요.</p></a></div></section>
      <section className="park-share"><div><p className="park-eyebrow">INVITE YOUR WALKING PARTNER</p><h2>어느 반이든, 함께 걸어요.</h2><p>같은 링크와 QR로 지도·미션·사진전을 함께 이용해요.<br />촬영할 때는 친구의 동의를 받고, 식물은 눈으로 관찰해요.</p></div><img src="/gildong-mission/gildong-mission-qr.png" alt="길동 미션톡 참여 QR 코드" width="136" height="136" /></section>
      <footer className="park-footer"><b>❧ 길동 미션톡</b><span>2학년 중국어과 공동체 활동 · 2026 가을</span><a href="#home">맨 위로 ↑</a></footer>
    </div><nav className="park-mobile-nav" aria-label="빠른 이동"><a href="#missions">미션 도장</a><a href="#park-map">공원 지도</a><a href="#photo-contest">가을 사진전</a></nav>
  </>;
}
