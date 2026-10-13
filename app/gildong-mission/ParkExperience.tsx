"use client";
import { useEffect, useState, type ReactNode, type MouseEvent } from "react";

type View = "home" | "map" | "missions" | "album";
function viewFor(target: string): View | null {
  if (target === "home") return "home";
  if (["park-map", "plant-guide"].includes(target)) return "map";
  if (["walk-missions", "walk-guide"].includes(target)) return "missions";
  if (target === "photo-contest") return "album";
  return null;
}
export default function ParkExperience({ home, map, missions, album }: { home: ReactNode; map: ReactNode; missions: ReactNode; album: ReactNode }) {
  const [view, setView] = useState<View>("home");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  function navigate(target: string, updateHistory = true) {
    const next = viewFor(target); if (!next) return;
    setView(next);
    if (updateHistory && location.hash !== `#${target}`) history.pushState(null, "", `#${target}`);
    requestAnimationFrame(() => {
      if (target === "plant-guide") { const plants = document.querySelector<HTMLDetailsElement>("#plant-guide .plant-notes"); if (plants) plants.open = true; }
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById(target)?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" });
    });
  }
  useEffect(() => {
    const restore = () => navigate(location.hash.slice(1) || "home", false);
    const startMission = () => navigate("photo-contest");
    restore();
    window.addEventListener("popstate", restore); window.addEventListener("hashchange", restore);
    window.addEventListener("gildong-start-mission", startMission);
    return () => { window.removeEventListener("popstate", restore); window.removeEventListener("hashchange", restore); window.removeEventListener("gildong-start-mission", startMission); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const viewport = window.visualViewport;
    const check = () => {
      const editing = document.activeElement?.matches("input,textarea,select");
      setKeyboardOpen(Boolean(editing && viewport && window.innerHeight - viewport.height > 150));
    };
    viewport?.addEventListener("resize", check);
    document.addEventListener("focusin", check); document.addEventListener("focusout", check);
    return () => { viewport?.removeEventListener("resize", check); document.removeEventListener("focusin", check); document.removeEventListener("focusout", check); };
  }, []);
  function follow(event: MouseEvent<HTMLDivElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link || !viewFor(link.hash.slice(1))) return;
    event.preventDefault(); navigate(link.hash.slice(1));
    if (link.dataset.upload) window.dispatchEvent(new Event("gildong-open-upload"));
  }
  return <div className="park-experience" onClickCapture={follow}>
    <header className="park-header"><a className="park-brand" href="#home">중어과의 2026 가을</a><span className="header-date">10월 14일 · 수요일</span></header>
    <main className="park-content">
      <div>{home}</div>
      <div>{map}</div>
      <div>{missions}</div>
      <div>{album}</div>
      <footer className="park-footer"><span>2026. 10. 14 · 길동생태공원</span><a href="#home">처음으로 ↑</a></footer>
    </main>
    <nav className="park-mobile-nav" aria-label="산책 메뉴" hidden={keyboardOpen}>{[{view:"map",target:"park-map",label:"지도"},{view:"missions",target:"walk-missions",label:"미션"},{view:"album",target:"photo-contest",label:"사진첩"}].map(item => <a key={item.view} href={`#${item.target}`} aria-current={view === item.view ? "page" : undefined}>{item.label}</a>)}</nav>
  </div>;
}
