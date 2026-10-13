"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/components/lib/supabaseClient";
import PhotoComments from "./PhotoComments";
import PhotoDelete from "./PhotoDelete";
import PhotoSave from "./PhotoSave";
import HomePhotoPreview from "./HomePhotoPreview";
import PhotoUpload, { photoTag, photoMissions } from "./PhotoUpload";

export type Photo = { id: string; title: string; author: string; description: string | null; image_url: string; likes: number; created_at: string; tags: string[] };
const tag = photoTag;
const voteKey = "gildong-photo-likes-2026";

export default function PhotoContest() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [previewHost, setPreviewHost] = useState<HTMLElement | null>(null);
  useEffect(() => { setPreviewHost(document.getElementById("home-photo-preview")); }, []);
  const [liked, setLiked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [voting, setVoting] = useState<string[]>([]);
  const voteLock = useRef(new Set<string>());
  const [sort, setSort] = useState("new");
  const [open, setOpen] = useState(false);
  const [activeMission, setActiveMission] = useState("컨셉 사진");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("전체");
  const [classTab, setClassTab] = useState("전체");
  const [selected, setSelected] = useState<Photo | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!selected) return;
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [selected]);

  useEffect(() => {
    const openUpload = () => { setOpen(true); };
    const start = (event: Event) => {
      const mission = (event as CustomEvent<{ mission?: string }>).detail?.mission;
      if (!mission || !photoMissions.includes(mission)) return;
      setActiveMission(mission); setOpen(true);
      setNotice(`‘${mission}’을 골랐어요. 사진·영상을 선택하고 제목을 남겨 주세요.`);
    };
    window.addEventListener("gildong-start-mission", start);
    window.addEventListener("gildong-open-upload", openUpload);
    return () => { window.removeEventListener("gildong-start-mission", start); window.removeEventListener("gildong-open-upload", openUpload); };
  }, []);

  async function load() {
    const { data, error: issue } = await supabase.from("album_posts").select("*").contains("tags", [tag]).order("created_at", { ascending: false });
    if (issue) setError("사진을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    else { setPhotos(data ?? []); setError(""); }
    setLoading(false);
    return !issue;
  }

  async function uploadSucceeded(classNumber: string) {
    setOpen(false);
    setClassTab(classNumber);
    setFilter("전체");
    setSort("new");
    setNotice("등록했어요! 사진첩을 업데이트하고 있어요…");
    document.getElementById("photo-contest")?.scrollIntoView({ behavior: "smooth", block: "start" });
    const refreshed = await load();
    setNotice(refreshed ? "등록했어요! 새 사진·영상이 사진첩에 바로 반영됐어요." : "등록은 완료됐어요. 사진첩을 다시 불러오면 확인할 수 있어요.");
  }

  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(voteKey) ?? "[]"); if (Array.isArray(saved)) setLiked(saved.filter((id) => typeof id === "string")); } catch { /* Storage can be unavailable. */ }
    void load();
    const refresh = () => { void load(); };
    window.addEventListener("gildong-photos-updated", refresh);
    const timer = setInterval(() => { if (!document.hidden) void load(); }, 15000);
    return () => { clearInterval(timer); window.removeEventListener("gildong-photos-updated", refresh); };
  }, []);

  async function vote(photo: Photo) {
    if (voteLock.current.has(photo.id)) return;
    voteLock.current.add(photo.id); setVoting((ids) => [...ids, photo.id]); setError("");
    const already = liked.includes(photo.id);
    try {
      // Compare-and-swap preserves other students' simultaneous votes.
      for (let attempt = 0; attempt < 5; attempt++) {
        const current = await supabase.from("album_posts").select("likes").eq("id", photo.id).single();
        if (current.error) throw current.error;
        const count = current.data.likes ?? 0;
        const next = Math.max(0, count + (already ? -1 : 1));
        const update = await supabase.from("album_posts").update({ likes: next }).eq("id", photo.id).eq("likes", count).select("id");
        if (update.error) throw update.error;
        if (!update.data?.length) continue;
        setPhotos((items) => items.map((item) => item.id === photo.id ? { ...item, likes: next } : item));
        setLiked((ids) => { const changed = already ? ids.filter((id) => id !== photo.id) : [...ids, photo.id]; try { localStorage.setItem(voteKey, JSON.stringify(changed)); } catch { /* Keep the current session usable. */ } return changed; });
        return;
      }
      throw new Error("Vote contention");
    } catch { setError("좋아요를 저장하지 못했어요. 다시 눌러 주세요."); }
    finally { voteLock.current.delete(photo.id); setVoting((ids) => ids.filter((id) => id !== photo.id)); }
  }

  const classPhotos = photos.filter(photo => classTab === "전체" || (classTab === "미분류" ? !photo.tags?.some(t => t.startsWith("길동반:")) : photo.tags?.includes(`길동반:${classTab}`)));
  const ordered = classPhotos.filter(photo => filter === "전체" || photo.tags?.includes(`길동미션:${filter}`) || (filter === "가을 사진" && !photo.tags?.some(t => t.startsWith("길동미션:")))).sort((a, b) => sort === "likes" ? b.likes - a.likes || b.created_at.localeCompare(a.created_at) : b.created_at.localeCompare(a.created_at));
  return <>
    {previewHost && createPortal(<HomePhotoPreview photos={photos} loading={loading} error={error} onOpen={setSelected} />, previewHost)}
    <section id="photo-contest" style={{ minWidth: 0, padding: "20px 0" }}>
      <p className="hy-section-label">1반 · 2반</p>
      <h2 style={{ fontSize: 26, margin: "6px 0 10px" }}>우리의 가을 사진 콘테스트</h2>
      <p className="album-intro">함께 걸었던 순간을 모아요. 사진을 누르면 좋아요·댓글·저장을 할 수 있어요.</p>
      <div className="album-toolbar">
        <button className="hy-btn hy-btn-primary" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "등록 닫기" : "사진 · 영상 올리기"}</button>
        <label>정렬 <select aria-label="사진 정렬" value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: 10 }}><option value="new">최신순</option><option value="likes">좋아요순</option></select></label>
        <span style={{ fontSize: 13 }}>{ordered.length}장</span>
      </div>
      {error && <div role="alert" style={{ color: "#b42318", marginBottom: 12 }}>{error} <button className="hy-btn" onClick={() => { setError(""); void load(); }}>다시 불러오기</button></div>}
      {notice && <div className="photo-confirmation"><p role="status" aria-live="polite">✓ {notice}</p><button className="hy-btn" onClick={() => setNotice("")} aria-label="등록 확인 메시지 닫기">확인</button></div>}
      <details className="album-help"><summary>사진전 안내 · 촬영 아이디어</summary><p>짝과 어울리는 식물, 친구의 모습, 함께 걸었던 순간을 남겨요. 점프샷이나 컨셉 사진도 좋아요.</p><p className="contest-tip">촬영 아이디어: 점프샷 · 앨범 커버 · 영화의 한 장면 · 짝꿍 포즈. 점프샷은 안전한 평지에서, 통행을 방해하지 않게 찍어요.</p></details>
      <div className="class-tabs" role="group" aria-label="반별 사진첩">{["전체", "1", "2", ...(photos.some(p => !p.tags?.some(t => t.startsWith("길동반:"))) ? ["미분류"] : [])].map(c => <button key={c} aria-pressed={classTab === c} onClick={() => setClassTab(c)}>{c === "1" || c === "2" ? `${c}반` : c === "미분류" ? "이전 사진" : "함께 보기"}</button>)}</div>
      {open && <div style={{ maxWidth: 600, marginBottom: 22 }}><PhotoUpload key={classTab} allowMissionChoice mission={activeMission} onMissionChange={setActiveMission} classNumber={classTab === "2" ? "2" : "1"} onSuccess={classNumber => { void uploadSucceeded(classNumber); }} /></div>}
      <details className="album-help"><summary>사진 종류로 골라 보기{filter !== "전체" ? ` · ${filter}` : ""}</summary><div className="photo-filters" role="group" aria-label="미션 사진 필터">{["전체", ...photoMissions].map(name => <button key={name} className="hy-btn" aria-pressed={filter === name} onClick={() => setFilter(name)}>{name}</button>)}</div></details>
      {loading ? <p role="status">사진을 불러오는 중…</p> : ordered.length === 0 ? <p style={{ padding: "30px 0", color: "var(--text-subtle)" }}>아직 이곳에 사진이 없어요. 우리 둘의 첫 장면을 남겨 주세요.</p> : <div className="instagram-grid">
        {ordered.map((photo) => <button key={photo.id} className="photo-tile" onClick={() => setSelected(photo)} aria-label={`${photo.title} · ${photo.author} · 좋아요 ${photo.likes}개 · 사진 크게 보기`}>
          {photo.tags?.includes("길동영상2026") ? <><video src={`${photo.image_url}#t=0.1`} muted playsInline preload="metadata" aria-label={photo.title} style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} /><span className="tile-video" aria-hidden="true">▶ 영상</span></> : <img src={photo.image_url} alt={photo.title} loading="lazy" />}
          <span className="tile-likes" aria-hidden="true">♡ {photo.likes}</span>
        </button>)}
      </div>}
      <p style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 14 }}>좋아요는 이 브라우저에서 작품당 한 번, 다시 누르면 취소돼요.</p>
      {selected && <dialog ref={dialog} className="photo-dialog" aria-label={selected.title} onCancel={() => setSelected(null)} onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
        <header className="photo-dialog-header"><div><b>{selected.author}</b><span>{selected.tags?.includes("길동반:1") ? "1반" : selected.tags?.includes("길동반:2") ? "2반" : "함께 보기"} · {selected.tags?.find(t => t.startsWith("길동미션:"))?.replace("길동미션:", "") ?? "가을 사진"}</span></div><button autoFocus className="hy-btn" onClick={() => setSelected(null)} aria-label="사진 상세 닫기">닫기 ×</button></header>
        {selected.tags?.includes("길동영상2026") ? <video className="photo-original" src={selected.image_url} controls playsInline preload="metadata" aria-label={selected.title} /> : <img className="photo-original" src={selected.image_url} alt={selected.title} />}
        <div className="photo-dialog-body"><button className="hy-btn" aria-pressed={liked.includes(selected.id)} disabled={voting.includes(selected.id)} onClick={() => void vote(photos.find(p => p.id === selected.id) ?? selected)}>{liked.includes(selected.id) ? "♥" : "♡"} {photos.find(p => p.id === selected.id)?.likes ?? selected.likes} 좋아요</button><h3>{selected.title}</h3>{selected.description && <p>{selected.description}</p>}</div>
        <PhotoSave key={`save-${selected.id}`} url={selected.image_url} title={selected.title} />
        <PhotoComments key={selected.id} photoId={selected.id} />
        <PhotoDelete key={`delete-${selected.id}`} id={selected.id} title={selected.title} onDeleted={cleanupPending => {
          const deletedId = selected.id;
          setSelected(null); setPhotos(items => items.filter(item => item.id !== deletedId));
          setNotice(cleanupPending ? "게시글을 삭제했어요. 원본 파일 또는 댓글 정리는 Supabase에서 확인해 주세요." : "사진·영상과 댓글을 삭제했어요.");
          void load();
        }} />
      </dialog>}
    </section>
  </>;
}
