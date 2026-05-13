/** Client-side image compression.
 * Mobile photos can be 5–10 MB → fails on 4G via Cloudflare timeout.
 * We resize to max 1280px on the longest side and re-encode as JPEG @ 0.85.
 * Returns a new File (keeps the original name with .jpg extension).
 */
export async function compressImage(file, { maxSize = 1280, quality = 0.85 } = {}) {
  if (!file || !file.type?.startsWith("image/")) return file;
  // Already small? skip.
  if (file.size < 500 * 1024) return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const { width, height } = bitmap;
  const longest = Math.max(width, height);
  const scale = longest > maxSize ? maxSize / longest : 1;
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) return file;

  const baseName = (file.name || "photo").replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}
