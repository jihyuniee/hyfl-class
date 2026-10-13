"use client";

import { useEffect, useRef, useState } from "react";

const zoomLevels = [100, 175, 250, 350];
const mapUrl = "/gildong-mission/gildong-map.webp";

export default function ParkMap() {
  const [zoomIndex, setZoomIndex] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!expanded) return;
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [expanded]);

  function resetMap() {
    setZoomIndex(0);
    viewport.current?.scrollTo({ left: 0, top: 0 });
  }

  const content = <>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 14px", borderBottom: "1px solid #d7f3e6" }}>
        <span style={{ color: "#49645d", fontSize: 12, fontWeight: 700 }}>확대한 뒤 지도를 밀어서 살펴보세요.</span>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
          {expanded ? <button autoFocus className="hy-btn" onClick={() => setExpanded(false)}>지도 닫기 ×</button> : <button className="hy-btn hy-btn-primary" onClick={() => { setZoomIndex(1); setExpanded(true); }}>화면 가득 보기</button>}
          <button type="button" className="hy-btn" aria-label="지도 축소" disabled={zoomIndex === 0} onClick={() => setZoomIndex((index) => Math.max(0, index - 1))} style={{ padding: "8px 12px", minHeight: 44 }}>−</button>
          <span aria-live="polite" style={{ minWidth: 46, textAlign: "center", color: "#153b32", fontSize: 12, fontWeight: 800 }}>{zoomLevels[zoomIndex]}%</span>
          <button type="button" className="hy-btn" aria-label="지도 확대" disabled={zoomIndex === zoomLevels.length - 1} onClick={() => setZoomIndex((index) => Math.min(zoomLevels.length - 1, index + 1))} style={{ padding: "8px 12px", minHeight: 44 }}>+</button>
          <button type="button" className="hy-btn" onClick={resetMap} style={{ padding: "8px 12px", minHeight: 44 }}>전체 보기</button>
        </div>
      </div>
      <div ref={viewport} role="region" aria-label="확대 가능한 길동생태공원 안내도" tabIndex={0} style={{ overflow: "auto", maxHeight: expanded ? "none" : "min(65vh, 620px)", flex: expanded ? 1 : undefined, minHeight: 0, overscrollBehavior: "contain" }}>
        <img src={mapUrl} alt="길동생태공원 안내도. 출입구, 탐방객 안내센터, 습지의 연못과 산책로, 생태숲, 농촌체험학습장, 쉼터와 화장실 위치가 표시되어 있습니다." width={2218} height={1401} style={{ display: "block", width: `${zoomLevels[zoomIndex]}%`, maxWidth: "none", height: "auto" }} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 14px", borderTop: "1px solid #d7f3e6" }}>
        <span style={{ color: "#5c726b", fontSize: 11, lineHeight: 1.6 }}>출처: 서울특별시 길동생태공원 리플릿 · 2020.9 제작</span>
        <a href={mapUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0f7a5b", fontSize: 12, fontWeight: 800 }}>지도 이미지 크게 열기 ↗</a>
      </div>
  </>;
  return <>{expanded ? <dialog ref={dialog} className="park-map-dialog" aria-label="길동생태공원 큰 지도" onCancel={() => setExpanded(false)}>{content}</dialog> : <div className="park-map-card">{content}</div>}</>;
}
