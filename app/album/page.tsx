"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type AlbumPost = {
  id: string;
  created_at: string;
  date: string;
  title: string;
  description: string | null;
  image_url: string;
  author: string | null;
  tags: string[];
  likes: number;
};

const PRESET_TAGS = ["일상🌸","수련여행✈️","체육대회🏃","학급회의📋","HR시간💬","급식🍱","생일🎂","시험기간📝","방과후🌙","기타✨"];

function toISODateKST() {
  const k = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${k.getFullYear()}-${String(k.getMonth()+1).padStart(2,"0")}-${String(k.getDate()).padStart(2,"0")}`;
}

function fmtDate(d: string) {
  const dt = new Date(`${d}T00:00:00+09:00`);
  const days = ["일","월","화","수","목","금","토"];
  return `${dt.getFullYear()}.${dt.getMonth()+1}.${dt.getDate()} (${days[dt.getDay()]})`;
}

export default function AlbumPage() {
  const [posts, setPosts]         = useState<AlbumPost[]>([]);
  const [filterTag, setFilterTag] = useState("전체");
  const [formOpen, setFormOpen]   = useState(false);
  const [lightbox, setLightbox]   = useState<AlbumPost | null>(null);
  const [likedIds, setLikedIds]   = useState<Set<string>>(new Set());

  // 폼 상태
  const [fDate,     setFDate]     = useState(toISODateKST());
  const [fTitle,    setFTitle]    = useState("");
  const [fDesc,     setFDesc]     = useState("");
  const [fAuthor,   setFAuthor]   = useState("");
  const [fTags,     setFTags]     = useState<string[]>([]);
  const [fFile,     setFFile]     = useState<File | null>(null);
  const [fPreview,  setFPreview]  = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const { data } = await supabase
      .from("album_posts")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    setPosts((data as AlbumPost[]) ?? []);
  }

  useEffect(() => { load(); }, []);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFFile(file);
    const reader = new FileReader();
    reader.onload = ev => setFPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    // 파일명에서 제목 자동 채우기
    if (!fTitle) {
      const name = file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
      setFTitle(name);
    }
  }

  async function submit() {
    if (!fTitle.trim()) { alert("제목을 입력하세요"); return; }
    if (!fFile) { alert("사진을 선택하세요"); return; }
    setUploading(true);
    setUploadPct(10);

    // 파일명 중복 방지
    const ext = fFile.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    setUploadPct(30);
    const { data: storageData, error: storageErr } = await supabase.storage
      .from("uploads")
      .upload(fileName, fFile, { cacheControl: "3600", upsert: false });

    if (storageErr) {
      alert("업로드 실패: " + storageErr.message);
      setUploading(false);
      setUploadPct(0);
      return;
    }

    setUploadPct(70);
    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(storageData.path);
    const imageUrl = urlData.publicUrl;

    setUploadPct(90);
    await supabase.from("album_posts").insert({
      date: fDate,
      title: fTitle.trim(),
      description: fDesc.trim() || null,
      image_url: imageUrl,
      author: fAuthor.trim() || null,
      tags: fTags,
      likes: 0,
    });

    setUploadPct(100);
    setUploading(false);
    setUploadPct(0);
    setFTitle(""); setFDesc(""); setFAuthor(""); setFTags([]);
    setFFile(null); setFPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFormOpen(false);
    await load();
  }

  async function toggleLike(post: AlbumPost, e: React.MouseEvent) {
    e.stopPropagation();
    const already = likedIds.has(post.id);
    const newLikes = already ? post.likes - 1 : post.likes + 1;
    await supabase.from("album_posts").update({ likes: newLikes }).eq("id", post.id);
    setLikedIds(prev => {
      const next = new Set(prev);
      already ? next.delete(post.id) : next.add(post.id);
      return next;
    });
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: newLikes } : p));
  }

  function toggleTag(tag: string) {
    setFTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  const filtered = filterTag === "전체" ? posts : posts.filter(p => p.tags.includes(filterTag));
  const grouped: Record<string, AlbumPost[]> = {};
  filtered.forEach(p => {
    if (!grouped[p.date]) grouped[p.date] = [];
    grouped[p.date].push(p);
  });

  const allTags = Array.from(new Set(posts.flatMap(p => p.tags)));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* 헤더 */}
      <div className="hy-hero">
        <div style={{ position:"relative" }}>
          <div style={{ display:"inline-flex",alignItems:"center",background:"rgba(255,255,255,0.2)",backdropFilter:"blur(8px)",borderRadius:999,padding:"4px 14px",marginBottom:12,border:"1px solid rgba(255,255,255,0.3)" }}>
            <span style={{ fontSize:12,color:"#fff",fontWeight:700 }}>2026 한영외고 2-2</span>
          </div>
          <h1 style={{ color:"#fff",fontSize:"clamp(22px,4vw,32px)",fontWeight:900,margin:"0 0 8px",letterSpacing:"-0.5px" }}>
            📸 우리반 앨범
          </h1>
          <p style={{ color:"rgba(255,255,255,0.85)",fontSize:13,margin:0,fontWeight:500,lineHeight:1.7 }}>
            우리반의 소중한 순간들을 함께 기록해요 🌸<br/>
            핸드폰 사진을 바로 올릴 수 있어요!
          </p>
        </div>
      </div>

      {/* 필터 + 업로드 버튼 */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap" }}>
        <div style={{ display:"flex",gap:6,flexWrap:"wrap",flex:1 }}>
          {["전체", ...allTags].map(tag => (
            <button key={tag} onClick={() => setFilterTag(tag)}
              style={{ padding:"6px 14px",borderRadius:999,border:"1.5px solid",fontFamily:"inherit",cursor:"pointer",fontSize:12,fontWeight:700,transition:"all 0.12s",
                borderColor: filterTag===tag ? "var(--primary)" : "var(--border)",
                background: filterTag===tag ? "var(--primary-light)" : "#fff",
                color: filterTag===tag ? "var(--primary)" : "var(--text-muted)",
              }}>{tag}</button>
          ))}
        </div>
        <button onClick={() => setFormOpen(o => !o)} className="hy-btn hy-btn-primary" style={{ fontSize:13,whiteSpace:"nowrap" }}>
          {formOpen ? "닫기" : "📷 사진 추가"}
        </button>
      </div>

      {/* 업로드 폼 */}
      {formOpen && (
        <div className="hy-card" style={{ padding:"22px 24px" }}>
          <h3 style={{ fontSize:15,fontWeight:900,color:"var(--text)",margin:"0 0 16px" }}>📷 사진 추가하기</h3>
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>

            {/* 사진 선택 영역 */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{ border:"2px dashed #f9a8d4",borderRadius:16,padding:"28px",textAlign:"center",cursor:"pointer",background: fPreview ? "#000" : "var(--primary-light)",transition:"all 0.15s",minHeight:160,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden" }}
              onDragOver={e=>{e.preventDefault();}}
              onDrop={e=>{e.preventDefault();const file=e.dataTransfer.files[0];if(file&&file.type.startsWith("image/")){const ev={target:{files:e.dataTransfer.files}} as unknown as React.ChangeEvent<HTMLInputElement>;onFileChange(ev);}}}
            >
              {fPreview ? (
                <img src={fPreview} alt="미리보기" style={{ maxWidth:"100%",maxHeight:280,objectFit:"contain",borderRadius:10 }}/>
              ) : (
                <div>
                  <p style={{ fontSize:32,margin:"0 0 8px" }}>📱</p>
                  <p style={{ fontSize:14,fontWeight:800,color:"var(--primary)",margin:"0 0 4px" }}>사진을 선택하거나 끌어다 놓으세요</p>
                  <p style={{ fontSize:12,color:"var(--text-subtle)",margin:0 }}>핸드폰 갤러리에서 바로 선택 가능해요</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              style={{ display:"none" }}
            />
            {fFile && (
              <p style={{ fontSize:12,color:"var(--text-subtle)",margin:0,fontWeight:600 }}>
                📎 {fFile.name} ({(fFile.size/1024/1024).toFixed(1)}MB)
              </p>
            )}

            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10 }}>
              <input type="date" value={fDate} onChange={e=>setFDate(e.target.value)} className="hy-input"/>
              <input placeholder="제목 *" value={fTitle} onChange={e=>setFTitle(e.target.value)} className="hy-input"/>
              <input placeholder="작성자 (선택)" value={fAuthor} onChange={e=>setFAuthor(e.target.value)} className="hy-input"/>
            </div>
            <textarea placeholder="설명 (선택)" value={fDesc} onChange={e=>setFDesc(e.target.value)}
              className="hy-input" style={{ minHeight:60,resize:"vertical" }}/>

            <div>
              <p style={{ fontSize:12,fontWeight:700,color:"var(--text-muted)",margin:"0 0 8px" }}>태그 선택</p>
              <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                {PRESET_TAGS.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)} type="button"
                    style={{ padding:"5px 12px",borderRadius:999,border:"1.5px solid",fontFamily:"inherit",cursor:"pointer",fontSize:12,fontWeight:700,
                      borderColor: fTags.includes(tag) ? "var(--primary)" : "var(--border)",
                      background: fTags.includes(tag) ? "var(--primary-light)" : "#fff",
                      color: fTags.includes(tag) ? "var(--primary)" : "var(--text-muted)",
                    }}>{tag}</button>
                ))}
              </div>
            </div>

            {/* 업로드 진행바 */}
            {uploading && (
              <div style={{ borderRadius:999,background:"#f3e8ff",overflow:"hidden",height:8 }}>
                <div style={{ height:"100%",background:"linear-gradient(90deg,var(--primary),var(--accent))",width:`${uploadPct}%`,transition:"width 0.3s",borderRadius:999 }}/>
              </div>
            )}

            <button onClick={submit} disabled={uploading} className="hy-btn hy-btn-primary" style={{ fontSize:14 }}>
              {uploading ? `업로드 중... ${uploadPct}%` : "📤 등록하기"}
            </button>
          </div>
        </div>
      )}

      {/* 날짜별 그리드 */}
      {Object.keys(grouped).length === 0 ? (
        <div className="hy-card" style={{ padding:"50px",textAlign:"center" }}>
          <p style={{ fontSize:32,margin:"0 0 12px" }}>📷</p>
          <p style={{ fontSize:15,color:"var(--text-subtle)",fontWeight:600 }}>아직 사진이 없어요. 첫 사진을 올려봐요!</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, dayPosts]) => (
          <div key={date}>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
              <div style={{ padding:"4px 14px",borderRadius:999,background:"linear-gradient(135deg,var(--primary),var(--accent))",color:"#fff",fontSize:12,fontWeight:800 }}>
                {fmtDate(date)}
              </div>
              <div style={{ flex:1,height:1,background:"var(--border)" }}/>
              <span style={{ fontSize:12,color:"var(--text-subtle)",fontWeight:600 }}>{dayPosts.length}장</span>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12 }}>
              {dayPosts.map(post => (
                <div key={post.id} onClick={() => setLightbox(post)}
                  style={{ borderRadius:18,overflow:"hidden",cursor:"pointer",boxShadow:"0 4px 16px rgba(0,0,0,0.08)",transition:"transform 0.15s",background:"#fff" }}
                  onMouseEnter={e=>(e.currentTarget.style.transform="translateY(-3px)")}
                  onMouseLeave={e=>(e.currentTarget.style.transform="translateY(0)")}>
                  <div style={{ position:"relative",paddingTop:"75%",background:"#f3f4f6" }}>
                    <img src={post.image_url} alt={post.title}
                      style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover" }}/>
                  </div>
                  <div style={{ padding:"10px 14px" }}>
                    <p style={{ fontSize:13,fontWeight:800,color:"var(--text)",margin:"0 0 4px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                      {post.title}
                    </p>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                      <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
                        {post.tags.slice(0,2).map(t => (
                          <span key={t} style={{ fontSize:10,padding:"2px 7px",borderRadius:999,background:"var(--primary-light)",color:"var(--primary)",fontWeight:700 }}>{t}</span>
                        ))}
                      </div>
                      <button onClick={e => toggleLike(post, e)}
                        style={{ display:"flex",alignItems:"center",gap:3,fontSize:12,fontWeight:800,border:"none",background:"transparent",cursor:"pointer",color: likedIds.has(post.id) ? "#ef4444" : "var(--text-subtle)",fontFamily:"inherit",padding:"2px 4px" }}>
                        {likedIds.has(post.id) ? "❤️" : "🤍"} {post.likes}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* 라이트박스 */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16 }}>
          <div onClick={e=>e.stopPropagation()}
            style={{ background:"#fff",borderRadius:24,overflow:"hidden",maxWidth:600,width:"100%",maxHeight:"92vh",display:"flex",flexDirection:"column" }}>
            <img src={lightbox.image_url} alt={lightbox.title}
              style={{ width:"100%",maxHeight:"58vh",objectFit:"contain",background:"#111" }}/>
            <div style={{ padding:"18px 22px",overflowY:"auto" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6 }}>
                <h3 style={{ fontSize:16,fontWeight:900,color:"var(--text)",margin:0 }}>{lightbox.title}</h3>
                <button onClick={e=>toggleLike(lightbox,e)}
                  style={{ fontSize:13,fontWeight:800,border:"none",background:"transparent",cursor:"pointer",color: likedIds.has(lightbox.id) ? "#ef4444" : "var(--text-subtle)",fontFamily:"inherit" }}>
                  {likedIds.has(lightbox.id) ? "❤️" : "🤍"} {lightbox.likes}
                </button>
              </div>
              <p style={{ fontSize:12,color:"var(--text-subtle)",margin:"0 0 8px",fontWeight:600 }}>
                {fmtDate(lightbox.date)} {lightbox.author && `· ${lightbox.author}`}
              </p>
              {lightbox.description && <p style={{ fontSize:13,color:"var(--text-muted)",margin:"0 0 10px",lineHeight:1.7 }}>{lightbox.description}</p>}
              <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:14 }}>
                {lightbox.tags.map(t => (
                  <span key={t} style={{ fontSize:11,padding:"3px 10px",borderRadius:999,background:"var(--primary-light)",color:"var(--primary)",fontWeight:700 }}>{t}</span>
                ))}
              </div>
              <button onClick={() => setLightbox(null)} className="hy-btn" style={{ width:"100%",fontSize:14 }}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
