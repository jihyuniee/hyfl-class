"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ImageViewer.module.css";

export type ViewerImage = { id: string; url: string; title: string };

type Props = {
  images: ViewerImage[];
  imageId: string;
  onNavigate: (id: string) => void;
  onClose: () => void;
};

export default function ImageViewer({ images, imageId, onNavigate, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [zoomed, setZoomed] = useState(false);
  const index = images.findIndex(image => image.id === imageId);
  const image = images[index];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function navigate(direction: number) {
    if (images.length < 2) return;
    setZoomed(false);
    onNavigate(images[(index + direction + images.length) % images.length].id);
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.viewer}
      aria-label="사진 크게 보기"
      onCancel={event => { event.preventDefault(); onClose(); }}
      onKeyDown={event => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          navigate(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
    >
      <header className={styles.header}>
        <div className={styles.caption} aria-live="polite" aria-atomic="true">
          <strong className={styles.title}>{image?.title ?? "사진"}</strong>
          <span className={styles.counter}>{index + 1} / {images.length}</span>
        </div>
        <button type="button" className={styles.action} aria-pressed={zoomed} onClick={() => setZoomed(value => !value)}>
          {zoomed ? "화면 맞춤" : "확대"}
        </button>
        <button type="button" className={styles.action} aria-label="사진 크게 보기 닫기" onClick={onClose} autoFocus>
          <span aria-hidden="true">✕</span> 닫기
        </button>
      </header>
      <div className={styles.stage}>
        <div key={imageId + String(zoomed)} className={`${styles.canvas} ${zoomed ? styles.zoomed : ""}`}>
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image.url} alt={image.title} className={styles.image} />
          )}
        </div>
        {images.length > 1 && (
          <>
            <button type="button" className={`${styles.arrow} ${styles.previous}`} aria-label="이전 사진" onClick={() => navigate(-1)}>
              <span aria-hidden="true">‹</span>
            </button>
            <button type="button" className={`${styles.arrow} ${styles.next}`} aria-label="다음 사진" onClick={() => navigate(1)}>
              <span aria-hidden="true">›</span>
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}
