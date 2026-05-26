/**
 * Prepara imagem para envio ao servidor (JPEG, tamanho seguro Vercel).
 *
 * When the browser can't decode the file (e.g. Samsung HEIF disguised as .jpg),
 * compression fails and the original bytes go through. We flag this so the
 * upload pipeline knows it MUST offload to Blob (where server-side sharp
 * converts it to JPEG) instead of sending raw HEIF bytes inline.
 */

import { compressImageNeverFail } from "./canvasCompress";
import { normalizeImageFile } from "./imageCompress";
import { MAX_IMAGE_DIRECT_BYTES } from "./uploadConstants";

const HEIC = /\.(heic|heif)$/i;

/**
 * Sniff HEIF/HEIC by ISOBMFF brand in the first 16 bytes.
 * Works on File/Blob objects. Samsung Galaxy saves HEIF with .jpg extension.
 */
async function sniffHeifBytes(file) {
  try {
    const head = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(head);
    if (bytes.length < 12) return false;
    const ftyp =
      bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70;
    if (!ftyp) return false;
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    return /^(heic|heix|hevc|hevx|mif1|msf1|heim|heis|hevm|hevs)$/i.test(brand);
  } catch {
    return false;
  }
}

/**
 * @param {File|Blob} file
 * @param {{ maxBytes?: number, maxSize?: number, force?: boolean }} [opts]
 * @returns {Promise<File>}
 *
 * The returned File may have a custom property `_needsBlobOffload = true` when
 * the browser couldn't compress/decode the image (HEIF, exotic codec, etc.).
 * The upload pipeline should check this and route through Blob upload.
 */
export async function prepareImageForUpload(file, opts = {}) {
  if (!file) return file;
  let work = file instanceof File ? normalizeImageFile(file) : normalizeImageFile(
    new File([file], "upload.jpg", { type: file.type || "application/octet-stream" }),
  );

  const maxBytes = Number(opts.maxBytes) || MAX_IMAGE_DIRECT_BYTES;
  const maxSize = Math.min(Number(opts.maxSize) || 2048, 4096);
  const isJpeg = /^image\/jpe?g$/i.test(work.type || "");
  const isHeicByName = HEIC.test(work.name || "");
  const small = work.size <= maxBytes * 0.85 && isJpeg && !isHeicByName;

  // Check magic bytes — Samsung HEIF files often have .jpg extension
  const isHeifByMagic = await sniffHeifBytes(work);

  // If file is HEIF (by magic bytes or name), the browser can't decode it.
  // Flag it immediately for Blob offload — don't even try canvas compression.
  if (isHeifByMagic || isHeicByName) {
    let result;
    if (isHeicByName && !/^image\/jpe?g$/i.test(work.type || "")) {
      result = new File([work], (work.name || "photo").replace(HEIC, ".jpg"), {
        type: "image/jpeg",
        lastModified: work.lastModified || Date.now(),
      });
    } else {
      result = work;
    }
    // Flag: this file MUST go through Blob upload so the server can convert
    // it with sharp. Sending raw HEIF bytes inline causes the AI to ignore it.
    try { result._needsBlobOffload = true; } catch { /* frozen object */ }
    return result;
  }

  if (!opts.force && small) return work;

  const before = work.size;
  const out = await compressImageNeverFail(work, {
    maxBytes,
    maxSize,
    maxBytesIOS: Math.min(maxBytes, 1.5 * 1024 * 1024),
  });

  // If compression didn't actually compress (returned same file or larger),
  // the browser probably couldn't decode the image. Flag for Blob offload.
  if (out === work || (out.size >= before * 0.95 && before > maxBytes)) {
    try { out._needsBlobOffload = true; } catch { /* frozen object */ }
  }

  return out instanceof File ? out : work;
}
