/**
 * Envio — imagem comprimida até caber no POST; nuvem só se ainda falhar depois de 4 passos.
 */

import {
  ensureFitsVercelBody,
  VERCEL_BODY_SAFE_BYTES,
} from "../prepareImageForUpload";
import { formDataTotalBlobBytes, VIDEO_VERCEL_SAFE_BYTES } from "../uploadConstants";

/** Limite do body multipart no Vercel (~4,5 MB) — margem para campos texto + overhead. */
const FORM_BODY_SAFE_BYTES = 3_600_000;

const IMAGE_KEYS = new Set([
  "photo", "image", "mask", "garment", "reference_image", "slide_photo", "photo_b",
]);

function isVideoFile(file) {
  if (!file) return false;
  const t = (file.type || "").toLowerCase();
  if (t.startsWith("video/")) return true;
  return /\.(mp4|mov|webm)$/i.test(file.name || "");
}

function isImageField(key, file) {
  if (IMAGE_KEYS.has(key)) return true;
  if (file.type?.startsWith?.("image/")) return true;
  return /\.(heic|heif|jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name || "");
}

async function appendImageField(out, key, file, options) {
  const directMax = options.directMaxBytes ?? VERCEL_BODY_SAFE_BYTES;
  const prepared = options.alreadyPrepared
    ? file
    : await ensureFitsVercelBody(file, {
      emergency: Boolean(options.emergencyCompress),
      maxBytes: directMax,
    });

  if (prepared.size <= directMax) {
    out.append(key, prepared);
    return;
  }

  try {
    const { uploadImageToCloud } = await import("../api");
    const url = await uploadImageToCloud(prepared, options);
    out.append(`${key}_url`, url);
  } catch (cloudErr) {
    const emergency = await ensureFitsVercelBody(prepared, {
      emergency: true,
      maxBytes: directMax,
    });
    if (emergency.size <= directMax) {
      out.append(key, emergency);
      return;
    }
    const detail = cloudErr?.message || "Upload da imagem falhou.";
    const err = new Error(detail);
    err.cause = cloudErr;
    throw err;
  }
}

function formImageEntries(formData) {
  const rows = [];
  for (const [key, val] of formData.entries()) {
    if (val instanceof File && isImageField(key, val)) rows.push({ key, val });
  }
  return rows;
}

export async function prepareStudioFormDataForSubmit(formData, options = {}) {
  const imageRows = formImageEntries(formData);
  const imageCount = Math.max(1, imageRows.length);
  const perImageCap = Math.min(
    VERCEL_BODY_SAFE_BYTES,
    Math.floor(FORM_BODY_SAFE_BYTES / imageCount),
  );

  const preparedImages = new Map();
  for (const { key, val } of imageRows) {
    // eslint-disable-next-line no-await-in-loop
    const prepared = await ensureFitsVercelBody(val, {
      emergency: Boolean(options.emergencyCompress),
      maxBytes: perImageCap,
    });
    preparedImages.set(key, prepared);
  }

  let emergency = Boolean(options.emergencyCompress);
  let total = formDataTotalBlobBytes(
    (() => {
      const probe = new FormData();
      for (const [k, v] of preparedImages) probe.append(k, v);
      return probe;
    })(),
  );
  if (total > FORM_BODY_SAFE_BYTES && !emergency) {
    emergency = true;
    for (const { key, val } of imageRows) {
      // eslint-disable-next-line no-await-in-loop
      preparedImages.set(
        key,
        await ensureFitsVercelBody(val, { emergency: true, maxBytes: Math.floor(FORM_BODY_SAFE_BYTES / imageCount) }),
      );
    }
  }

  const out = new FormData();

  for (const [key, val] of formData.entries()) {
    if (!(val instanceof File)) {
      out.append(key, val);
      continue;
    }

    if (key === "video" || (isVideoFile(val) && key !== "mask")) {
      if (!options.skipBlobOffload && val.size > VIDEO_VERCEL_SAFE_BYTES) {
        const { uploadVideoToCloud } = await import("../api");
        const url = await uploadVideoToCloud(val, options);
        out.append(key === "video" ? "video_url" : `${key}_url`, url);
      } else {
        out.append(key, val);
      }
      continue;
    }

    if (isImageField(key, val)) {
      const prepared = preparedImages.get(key) ?? val;
      // eslint-disable-next-line no-await-in-loop
      await appendImageField(out, key, prepared, {
        ...options,
        emergencyCompress: emergency,
        alreadyPrepared: preparedImages.has(key),
        directMaxBytes: perImageCap,
      });
      continue;
    }

    out.append(key, val);
  }

  return out;
}
