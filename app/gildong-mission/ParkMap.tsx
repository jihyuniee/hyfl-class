"use client";

import { useRef, useState } from "react";

const zoomLevels = [100, 175, 250, 350];
const mapUrl = "/gildong-mission/gildong-map.webp";

export default function ParkMap() {
  const [zoomIndex, setZoomIndex] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);

  function resetMap() {
    setZoomIndex(0);
    viewport.current?.scrollTo({ left: 0, top: 0 });
  }

  return (
    <div style={{ overflow: "hidden", borderRadius: 18, border: "1.5px solid #d7f3e6", background: "#f2fbf7" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 14px", borderBottom: "1px solid #d7f3e6" }}>
        <span style={{ color: "#49645d", fontSize: 12, fontWeight: 700 }}>확대한 뒤 지도를 밀어서 살펴보세요.</span>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
          <button type="button" className="hy-btn" aria-label="지도 축소" disabled={zoomIndex === 0} onClick={() => setZoomIndex((index) => Math.max(0, index - 1))} style={{ padding: "8px 12px", minHeight: 44 }}>−</button>
          <span aria-live="polite" style={{ minWidth: 46, textAlign: "center", color: "#153b32", fontSize: 12, fontWeight: 800 }}>{zoomLevels[zoomIndex]}%</span>
          <button type="button" className="hy-btn" aria-label="지도 확대" disabled={zoomIndex === zoomLevels.length - 1} onClick={() => setZoomIndex((index) => Math.min(zoomLevels.length - 1, index + 1))} style={{ padding: "8px 12px", minHeight: 44 }}>+</button>
          <button type="button" className="hy-btn" onClick={resetMap} style={{ padding: "8px 12px", minHeight: 44 }}>전체 보기</button>
        </div>
      </div>
      <div ref={viewport} role="region" aria-label="확대 가능한 길동생태공원 안내도" tabIndex={0} style={{ overflow: "auto", maxHeight: "min(65vh, 620px)", overscrollBehavior: "contain" }}>
        <img src={mapUrl} alt="길동생태공원 안내도. 출입구, 탐방객 안내센터, 습지의 연못과 산책로, 생태숲, 농촌체험학습장, 쉼터와 화장실 위치가 표시되어 있습니다." width={2218} height={1401} style={{ display: "block", width: `${zoomLevels[zoomIndex]}%`, maxWidth: "none", height: "auto" }} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 14px", borderTop: "1px solid #d7f3e6" }}>
        <span style={{ color: "#5c726b", fontSize: 11, lineHeight: 1.6 }}>출처: 서울특별시 길동생태공원 리플릿 · 2020.9 제작</span>
        <a href={mapUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0f7a5b", fontSize: 12, fontWeight: 800 }}>지도 이미지 크게 열기 ↗</a>
      </div>
    </div>
  );
}
