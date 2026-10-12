import Link from "next/link";
import ParkMap from "./ParkMap";

const pageUrl = "https://hyfl-class.vercel.app/gildong-mission";
const officialParkUrl = "https://parks.seoul.go.kr/content.do?key=2604300010";
const officialLeafletUrl = "https://parks.seoul.go.kr/resource/www/leaflet/gildong_map.pdf";
const capcutUrl = "https://www.capcut.com/ko-kr/tools/video-editor-download";
const vrewUrl = "https://vrew.ai/ko/";
const qrUrl = "/gildong-mission/gildong-mission-qr.png";

const missions = [
  {
    title: "생태공원 숏츠",
    tag: "15~30초",
    score: "공동체",
    text: "우리 조가 함께 걷고 발견하고 웃는 순간을 짧은 영상으로 남깁니다.",
    checks: ["친구 동의 받고 촬영", "얼굴·이름표 노출 주의", "마지막에 조 이름 넣기"],
  },
  {
    title: "오늘의 식물 발견",
    tag: "사진 인증",
    score: "관찰",
    text: "안내도에 나온 구역을 돌며 인상적인 식물이나 자연물을 찾아 기록합니다.",
    checks: ["식물 훼손 금지", "가까이 보고 특징 적기", "이름을 모르면 색·모양 기록"],
  },
  {
    title: "힐링 한 문장",
    tag: "토크 미션",
    score: "표현",
    text: "걸으며 든 생각, 친구에게 전하고 싶은 말, 오늘의 분위기를 한 문장으로 남깁니다.",
    checks: ["짧고 진심 있게", "비속어 금지", "공유해도 괜찮은 표현"],
  },
  {
    title: "안전 지킴이",
    tag: "보너스",
    score: "책임",
    text: "질서 있게 이동하고, 탐방로와 생태공원 규칙을 지키는 장면을 기록합니다.",
    checks: ["뛰지 않기", "탐방로 벗어나지 않기", "음식물 반입 자제"],
  },
];

const steps = [
  ["1", "조 정하기", "2~4명으로 조를 정하고 역할을 나눕니다. 촬영, 편집, 기록, 발표 역할을 가볍게 정해요."],
  ["2", "미션 수행", "안내도를 보며 이동하고, 숏츠·식물 사진·한 문장 기록 중 2개 이상 수행합니다."],
  ["3", "숏츠 제작", "CapCut 또는 Vrew에서 15~30초 세로 영상으로 편집합니다. 자막은 짧게, 음악은 과하지 않게."],
  ["4", "서로 응원", "학급 투표 링크에 올리고 좋아요로 서로의 결과물을 응원합니다."],
];

const editGuide = [
  {
    tool: "CapCut",
    title: "영상 감각이 좋으면",
    url: capcutUrl,
    points: ["세로 9:16 프로젝트", "컷 편집 후 자막 3개 이내", "템플릿은 과하지 않게"],
  },
  {
    tool: "Vrew AI",
    title: "자막과 AI 음성이 필요하면",
    url: vrewUrl,
    points: ["자동 자막 생성", "말한 부분만 빠르게 정리", "사진+문장으로 영상 제작 가능"],
  },
];

export default function GildongMissionPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <section style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 28,
        minHeight: 420,
        padding: "34px 28px",
        background: "linear-gradient(135deg,#0f7a5b 0%,#28b6a6 52%,#69d48f 100%)",
        boxShadow: "0 18px 50px rgba(15,122,91,0.22)",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.14, backgroundImage: "radial-gradient(circle at 15% 15%, #fff 0 2px, transparent 3px), radial-gradient(circle at 75% 35%, #fff 0 2px, transparent 3px)", backgroundSize: "80px 80px" }} />
        <div style={{ position: "relative", maxWidth: 780 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999, padding: "6px 14px", background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.32)", color: "#fff", fontSize: 12, fontWeight: 900, marginBottom: 16 }}>
            2026.10.14 HR · 길동생태공원
          </div>
          <h1 style={{ margin: 0, color: "#fff", fontSize: "clamp(30px,6vw,58px)", lineHeight: 1.05, fontWeight: 950, letterSpacing: "-0.04em" }}>
            2학년 중국어과<br />길동 미션톡
          </h1>
          <p style={{ margin: "16px 0 0", color: "rgba(255,255,255,0.9)", fontSize: 16, lineHeight: 1.75, fontWeight: 650, maxWidth: 680 }}>
            안내도를 따라 걸으며 식물을 찾고, 친구들과 숏츠를 만들고, 서로의 결과물을 좋아요로 응원하는 학급자치활동 페이지입니다.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
            <a href="#missions" className="hy-btn" style={{ background: "#fff", color: "#0f7a5b", border: "none", textDecoration: "none" }}>미션 보기</a>
            <a href="#park-map" className="hy-btn" style={{ background: "rgba(255,255,255,0.16)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.32)", textDecoration: "none" }}>안내도 보기</a>
            <a href="#shorts" className="hy-btn" style={{ background: "rgba(255,255,255,0.16)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.32)", textDecoration: "none" }}>숏츠 제작법</a>
            <a href={officialParkUrl} target="_blank" rel="noopener noreferrer" className="hy-btn" style={{ background: "rgba(255,255,255,0.16)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.32)", textDecoration: "none" }}>공식 홈페이지</a>
          </div>
        </div>
      </section>

      <section id="park-map" className="hy-card" style={{ padding: 18, minWidth: 0 }}>
        <p className="hy-section-label">Mission Map</p>
        <h2 style={{ margin: "6px 0 8px", fontSize: 24, fontWeight: 950, color: "#153b32", letterSpacing: "-0.03em" }}>
          지도를 보고 움직이기
        </h2>
        <p style={{ margin: "0 0 16px", color: "#506b63", fontSize: 14, lineHeight: 1.75, fontWeight: 650 }}>
          습지, 생태숲, 농촌체험학습장의 위치를 찾아보세요. 조별로 탐방로를 따라 걸으며 미션을 수행하고, 모이는 장소는 선생님 안내를 따릅니다.
        </p>
        <ParkMap />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
              <a href={officialLeafletUrl} target="_blank" rel="noopener noreferrer" className="hy-btn" style={{ textDecoration: "none", color: "#0f7a5b", borderColor: "#b7e8d3" }}>
                공식 안내도 PDF 열기
              </a>
              <a href="https://map.seoul.go.kr/smgis/webs/theme/themeMapCopy.do?level=12&map_type=1&mode=themeMapCopy&oldmap=&radius=2000&thm_theme_id=100362&tp=0.7&xpoint=127.15502909718046&ypoint=37.54007035210328" target="_blank" rel="noopener noreferrer" className="hy-btn" style={{ textDecoration: "none", color: "#0f7a5b", borderColor: "#b7e8d3" }}>
                서울 지도에서 보기
              </a>
        </div>
      </section>

      <section id="missions" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <p className="hy-section-label">Class Mission</p>
          <h2 style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 950, color: "var(--text)", letterSpacing: "-0.04em" }}>
            오늘의 미션 4개
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12 }} className="gildong-mission-grid">
          {missions.map((mission) => (
            <article key={mission.title} className="hy-card" style={{ padding: 18, borderColor: "#d7f3e6", boxShadow: "0 8px 24px rgba(15,122,91,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 12 }}>
                <span style={{ borderRadius: 999, padding: "4px 10px", background: "#e6f8ef", color: "#0f7a5b", fontSize: 11, fontWeight: 900 }}>{mission.tag}</span>
                <span style={{ color: "#28a887", fontSize: 12, fontWeight: 900 }}>{mission.score}</span>
              </div>
              <h3 style={{ margin: "0 0 8px", color: "#153b32", fontSize: 18, fontWeight: 950 }}>{mission.title}</h3>
              <p style={{ margin: "0 0 12px", color: "#5c726b", fontSize: 13, lineHeight: 1.65, fontWeight: 600 }}>{mission.text}</p>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#49645d", fontSize: 12, lineHeight: 1.75, fontWeight: 700 }}>
                {mission.checks.map((check) => <li key={check}>{check}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="hy-card" style={{ padding: 22, borderColor: "#d7f3e6" }}>
        <p className="hy-section-label">How To Play</p>
        <h2 style={{ margin: "6px 0 16px", fontSize: 24, fontWeight: 950, color: "#153b32", letterSpacing: "-0.03em" }}>
          진행 방법
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12 }} className="gildong-step-grid">
          {steps.map(([no, title, text]) => (
            <div key={no} style={{ padding: 16, borderRadius: 18, background: "#f2fbf7", border: "1.5px solid #d7f3e6" }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, display: "grid", placeItems: "center", background: "#0f7a5b", color: "#fff", fontWeight: 950, marginBottom: 10 }}>{no}</div>
              <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 950, color: "#153b32" }}>{title}</h3>
              <p style={{ margin: 0, color: "#5c726b", fontSize: 13, lineHeight: 1.7, fontWeight: 650 }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="shorts" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 14 }} className="gildong-two-col">
        <div className="hy-card" style={{ padding: 22, borderColor: "#d7f3e6" }}>
          <p className="hy-section-label">Shorts Guide</p>
          <h2 style={{ margin: "6px 0 12px", fontSize: 24, fontWeight: 950, color: "#153b32", letterSpacing: "-0.03em" }}>
            숏츠 만드는 방법
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 }} className="gildong-edit-grid">
            {editGuide.map((guide) => (
              <a key={guide.tool} href={guide.url} target="_blank" rel="noopener noreferrer" className="hy-card" style={{ padding: 18, textDecoration: "none", borderColor: "#c8ebdd", boxShadow: "none" }}>
                <span style={{ color: "#0f7a5b", fontSize: 12, fontWeight: 950 }}>{guide.tool}</span>
                <h3 style={{ margin: "6px 0 10px", color: "#153b32", fontSize: 18, fontWeight: 950 }}>{guide.title}</h3>
                <ul style={{ margin: 0, paddingLeft: 18, color: "#5c726b", fontSize: 13, lineHeight: 1.75, fontWeight: 700 }}>
                  {guide.points.map((point) => <li key={point}>{point}</li>)}
                </ul>
              </a>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: 16, borderRadius: 18, background: "#edf8fb", border: "1.5px solid #caebf3" }}>
            <b style={{ color: "#176d82", fontSize: 14 }}>제출 기준</b>
            <p style={{ margin: "6px 0 0", color: "#527078", fontSize: 13, lineHeight: 1.75, fontWeight: 650 }}>
              세로 영상 15~30초, 조 이름 표시, 개인정보 노출 없음, 친구가 싫어하는 장면 없음. 완성 후 학급 투표 링크에 올리고 서로 좋아요로 응원합니다.
            </p>
          </div>
        </div>

        <aside className="hy-card" style={{ padding: 20, borderColor: "#d7f3e6", textAlign: "center" }}>
          <p className="hy-section-label">QR Link</p>
          <h2 style={{ margin: "6px 0 12px", fontSize: 21, fontWeight: 950, color: "#153b32" }}>
            학생용 QR
          </h2>
          <img
            src={qrUrl}
            alt="길동 미션톡 페이지 QR 코드"
            style={{ width: "100%", maxWidth: 220, height: "auto", borderRadius: 18, border: "1.5px solid #e5e7eb" }}
          />
          <p style={{ margin: "12px 0 0", color: "#5c726b", fontSize: 12, lineHeight: 1.6, fontWeight: 700, wordBreak: "break-all" }}>
            {pageUrl}
          </p>
        </aside>
      </section>

      <section className="hy-card" style={{ padding: 22, borderColor: "#d7f3e6", background: "linear-gradient(135deg,#f2fbf7,#eef9ff)" }}>
        <p className="hy-section-label">Teacher Note</p>
        <h2 style={{ margin: "6px 0 10px", fontSize: 23, fontWeight: 950, color: "#153b32" }}>
          투표 링크를 붙이면 더 재밌어집니다
        </h2>
        <p style={{ margin: 0, color: "#526a63", fontSize: 14, lineHeight: 1.8, fontWeight: 650 }}>
          PollUnit이나 Google Form에 조별 숏츠 링크와 식물 인증 사진을 올리게 하고, 투표 항목을 “공동체가 잘 드러난 영상”, “가장 힐링되는 영상”, “관찰력이 좋은 식물 인증”처럼 나누면 경쟁보다 응원 분위기가 살아납니다.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
          <Link href="/" className="hy-btn" style={{ textDecoration: "none" }}>학급 사이트 홈으로</Link>
          <a href={pageUrl} className="hy-btn hy-btn-primary" style={{ textDecoration: "none" }}>학생용 링크 열기</a>
        </div>
      </section>

      <style>{`
        @media (max-width: 860px) {
          .gildong-two-col,
          .gildong-edit-grid {
            grid-template-columns: 1fr !important;
          }
          .gildong-mission-grid,
          .gildong-step-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 560px) {
          .gildong-mission-grid,
          .gildong-step-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
