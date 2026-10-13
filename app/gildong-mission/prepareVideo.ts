export async function prepareVideo(file: File): Promise<File> {
  if (file.size > 25 * 1024 * 1024) throw new Error("영상은 25MB 이하로 골라 주세요. 크면 짧게 자르거나 화질을 낮춰 저장해 주세요.");
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!["mp4", "mov", "webm"].includes(extension ?? "")) throw new Error("MP4, MOV, WebM 영상을 선택해 주세요.");
  const url = URL.createObjectURL(file);
  try {
    const duration = await new Promise<number>((resolve, reject) => {
      const video = document.createElement("video");
      const timer = setTimeout(() => finish(new Error("영상을 읽지 못했어요. MP4로 저장한 뒤 다시 선택해 주세요.")), 15000);
      function finish(error?: Error) {
        clearTimeout(timer); video.onloadedmetadata = null; video.onerror = null;
        if (error) reject(error); else resolve(video.duration);
        video.removeAttribute("src"); video.load();
      }
      video.preload = "metadata";
      video.onloadedmetadata = () => finish();
      video.onerror = () => finish(new Error("이 휴대폰에서 재생하기 어려운 영상이에요. MP4로 저장해 주세요."));
      video.src = url;
    });
    if (!Number.isFinite(duration) || duration <= 0) throw new Error("영상 길이를 확인할 수 없어요. MP4로 저장한 뒤 다시 선택해 주세요.");
    if (duration > 30.5) throw new Error("영상은 30초 이내로 잘라 주세요.");
    return new File([file], `video.${extension}`, { type: extension === "mov" ? "video/quicktime" : extension === "webm" ? "video/webm" : "video/mp4" });
  } finally { URL.revokeObjectURL(url); }
}
