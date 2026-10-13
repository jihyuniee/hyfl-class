import type { Photo } from "./PhotoContest";

const plants = [
  { name: "수크령", url: "/gildong-mission/plant-sukryeong.webp" },
  { name: "산국", url: "/gildong-mission/plant-sanguk.webp" },
  { name: "갈참나무", url: "/gildong-mission/plant-galcham.webp" },
];
export default function HomePhotoPreview({ photos, loading, error, onOpen }: { photos: Photo[]; loading: boolean; error: string; onOpen: (photo: Photo) => void }) {
  return <section className="home-photo-preview" aria-label="첫 화면 사진 미리보기">
    <div className="preview-heading"><h2>{!loading && !photos.length ? "산책에서 만날 식물" : "우리의 가을, 먼저 보기"}</h2><a href="#photo-contest">사진첩 보기 ↗</a></div>
    {loading ? <p role="status">사진을 불러오고 있어요…</p> : error && !photos.length ? <p role="alert">사진을 불러오지 못했어요. 사진첩에서 다시 불러와 주세요.</p> : photos.length ? <div className="home-photo-strip">{photos.slice(0, 6).map(photo => <button key={photo.id} className="preview-photo" onClick={() => onOpen(photo)} aria-label={`${photo.title} · 첫 화면에서 사진 보기`}>
      {photo.tags?.includes("길동영상2026") ? <><video src={`${photo.image_url}#t=0.1`} muted playsInline preload="metadata" aria-label={photo.title} /><span aria-hidden="true">▶</span></> : <img src={photo.image_url} alt={photo.title} loading="lazy" />}
    </button>)}</div> : <><div className="home-photo-strip">{plants.map(plant => <a key={plant.name} href="#plant-guide" aria-label={`${plant.name} 식물 안내 보기`}><img src={plant.url} alt={plant.name} width={848} height={589} /><span>{plant.name}</span></a>)}</div><p className="preview-note">서울시 안내서의 식물 사진이에요. 우리 사진이 올라오면 여기에 보여요.</p></>}
  </section>;
}
