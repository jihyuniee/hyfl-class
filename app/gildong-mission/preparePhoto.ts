/** Normalize camera photos before storage: orientation, HEIC decoding, and size. */
export async function preparePhoto(file: File): Promise<File> {
  if (!file.size) throw new Error("사진을 선택해 주세요.");
  if (file.size > 50 * 1024 * 1024) throw new Error("50MB 이하 사진을 선택해 주세요.");
  if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) throw new Error("사진 파일을 선택해 주세요.");
  async function decode(blob: Blob): Promise<HTMLImageElement> {
    const url = URL.createObjectURL(blob);
    try { return await new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error("사진을 읽지 못했어요.")); image.src = url; }); }
    finally { URL.revokeObjectURL(url); }
  }
  let image: HTMLImageElement;
  try { image = await decode(file); }
  catch {
    if (!/heic|heif/i.test(file.type + file.name)) throw new Error("사진을 읽지 못했어요. 다른 사진을 선택해 주세요.");
    try { const { default: convert } = await import("heic2any"); const converted = await convert({ blob: file, toType: "image/jpeg", quality: 0.9 }); image = await decode(Array.isArray(converted) ? converted[0] : converted); }
    catch { throw new Error("이 HEIC 사진을 변환하지 못했어요. 사진 앱에서 JPG로 공유하거나 스크린샷을 선택해 주세요."); }
  }
  const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d"); if (!context) throw new Error("사진 처리 기능을 열지 못했어요. 브라우저에서 다시 열어 주세요.");
  context.fillStyle = "white"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("사진 크기를 줄이지 못했어요.")), "image/jpeg", 0.82));
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}
