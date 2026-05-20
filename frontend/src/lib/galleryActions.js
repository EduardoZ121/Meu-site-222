import { api } from "./api";
import {
  displayMediaUrl,
  downloadCreationFile,
  isVideoCreation,
  primaryResultUrl,
  proxiedMediaUrl,
} from "./creationUrls";

export { isVideoCreation, primaryResultUrl };

export function mediaExtension(creation) {
  return isVideoCreation(creation) ? "mp4" : "jpg";
}

export function downloadFilename(creation) {
  const id = (creation?.id || "item").slice(0, 8);
  return `remake-pixel-${id}.${mediaExtension(creation)}`;
}

/** Fetch file via authenticated API (works when CDN URL expired). */
export async function fetchCreationBlob(creation) {
  const { data } = await api.get(`/generations/${encodeURIComponent(creation.id)}/media`, {
    responseType: "blob",
    timeout: 120000,
  });
  if (!data || data.size < 32) throw new Error("empty");
  return data;
}

export async function downloadCreation(creation) {
  const direct = primaryResultUrl(creation);
  if (direct) {
    try {
      await downloadCreationFile(direct, downloadFilename(creation));
      return;
    } catch {
      /* fall through to API */
    }
  }
  const blob = await fetchCreationBlob(creation);
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = downloadFilename(creation);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}

export async function shareCreation(creation) {
  const direct = primaryResultUrl(creation);
  let blob;
  try {
    blob = await fetchCreationBlob(creation);
  } catch {
    blob = null;
  }

  const file = blob
    ? new File([blob], downloadFilename(creation), { type: blob.type || "image/jpeg" })
    : null;

  if (navigator.share) {
    try {
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Remake Pixel",
          text: creation.prompt || "",
          files: [file],
        });
        return "shared";
      }
      if (direct) {
        await navigator.share({ title: "Remake Pixel", text: creation.prompt || "", url: direct });
        return "shared";
      }
    } catch (err) {
      if (err?.name === "AbortError") return "cancelled";
    }
  }

  const copyTarget = direct || creation.prompt || "";
  if (copyTarget) {
    await navigator.clipboard.writeText(copyTarget);
    return "copied";
  }
  throw new Error("share_unavailable");
}

export function thumbnailCandidates(creation) {
  const raw = primaryResultUrl(creation);
  if (!raw) return [];
  const direct = displayMediaUrl(raw, false);
  const proxy = proxiedMediaUrl(raw);
  return [direct, proxy].filter((u, i, arr) => u && arr.indexOf(u) === i);
}
