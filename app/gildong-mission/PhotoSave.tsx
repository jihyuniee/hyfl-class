"use client";
import { useRef, useState } from "react";

export default function PhotoSave({ url, title }: { url: string; title: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  async function save() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessage("");
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const extension = new URL(url, location.href).pathname.match(/\.(jpe?g|png|webp|heic|heif|mp4|mov|webm)$/i)?.[1]?.toLowerCase() ?? "jpg";
      const name = title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "").trim().slice(0, 80) || "우리의 가을";
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl; link.download = `${name}.${extension}`; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      setMessage("다운로드를 요청했어요. 브라우저의 다운로드나 파일 앱에서 확인해 주세요.");
    } catch { setMessage("저장하지 못했어요. 원본을 열어 저장하거나 다시 눌러 주세요."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div className="photo-save"><div><button className="hy-btn" disabled={busy} onClick={() => void save()}>{busy ? "원본 준비 중…" : "원본 저장 ↓"}</button><a href={url} target="_blank" rel="noopener noreferrer">원본 열기 ↗</a></div>{message && <p role="status">{message}</p>}</div>;
}
