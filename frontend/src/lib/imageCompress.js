/** Client-side image compression with mobile-safe fallbacks.
 *
 * Mobile photos can be 5–10 MB → fails on 4G via Cloudflare timeout.
 * We resize to max 1280px on the longest side and re-encode as JPEG @ 0.85.
 *
 * Pipeline:
 *  1. Try `createImageBitmap` (fast, works on modern browsers)
 *  2. Fallback to `<img>` + FileReader (works for HEIC on Safari 17+ and as a
 *     general fallback)
 *  3. If both fail and the file is HEIC, throw — backend can't process it
 *  4. If the file is already < 500 KB, skip compression
 *
 * Throws an Error on irrecoverable failures (the caller MUST catch and show
 * a user-friendly toast). Returning the original file silently is what made
 * mobile uploads "fail randomly" — the backend rejected unprocessable files.
 */

const HEIC_EXTENSIONS = /\.(heic|heif)$/i;

function loadImageViaTag(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

export async function compressImage(file, { maxSize = 1280, quality = 0.85 } = {}) {
  if (!file) throw new Error("Nenhum ficheiro selecionado.");
  // Skip compression for already-small images
  if (file.size < 500 * 1024) return file;

  // Detect HEIC up front — both decoders below typically fail on it.
  const isHeic = HEIC_EXTENSIONS.test(file.name) || /heic|heif/i.test(file.type || "");

  // ---- Path 1: createImageBitmap (modern browsers) ----
  let width = 0, height = 0, source = null;
  try {
    source = await createImageBitmap(file);
    width = source.width; height = source.height;
  } catch {
    source = null;
  }

  // ---- Path 2: HTMLImageElement fallback (Safari, older Android) ----
  if (!source) {
    try {
      const img = await loadImageViaTag(file);
      source = img;
      width = img.naturalWidth; height = img.naturalHeight;
    } catch {
      source = null;
    }
  }

  if (!source || !width || !height) {
    if (isHeic) {
      throw new Error(
        "Formato HEIC não suportado no telemóvel. Vai a Definições → Câmara → Formatos e muda para 'Mais Compatível' (JPEG)."
      );
    }
    throw new Error("Não consegui ler esta imagem. Tenta outra foto ou em formato JPEG/PNG.");
  }

  const longest = Math.max(width, height);
  const scale = longest > maxSize ? maxSize / longest : 1;
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(source, 0, 0, w, h);
  if (source.close) source.close();

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  if (!blob) throw new Error("Falha ao processar a imagem.");

  const baseName = (file.name || "photo").replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
