export const COVER_PHOTO_MAX_FILE_SIZE = 12 * 1024 * 1024;
export const COVER_PHOTO_MAX_DIMENSION = 2000;
export const COVER_PHOTO_OUTPUT_TYPE = "image/webp";
export const COVER_PHOTO_QUALITY = 0.86;
export const COVER_PHOTO_ACCEPT = "image/jpeg,image/png,image/webp";

const supportedTypes = new Set(COVER_PHOTO_ACCEPT.split(","));

export async function processCoverPhoto(file: File) {
  if (!supportedTypes.has(file.type)) throw new Error("JPEG、PNG、WebP形式の画像を選択してください。");
  if (file.size > COVER_PHOTO_MAX_FILE_SIZE) throw new Error("画像の容量は12MB以下にしてください。");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("画像を読み込めませんでした。別の画像を選択してください。");
  }

  try {
    const scale = Math.min(1, COVER_PHOTO_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("画像処理を開始できませんでした。");
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, COVER_PHOTO_OUTPUT_TYPE, COVER_PHOTO_QUALITY));
    if (!blob) throw new Error("画像を圧縮できませんでした。");
    return blob;
  } finally {
    bitmap.close();
  }
}
