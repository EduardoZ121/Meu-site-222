/**
 * Deteção de codec / capacidade de preview no browser (sem assumir falha de rede).
 */

export function browserCanPlayMp4H264() {
  if (typeof document === "undefined") return true;
  const v = document.createElement("video");
  const h264 = v.canPlayType('video/mp4; codecs="avc1.42E01E"');
  const generic = v.canPlayType("video/mp4");
  return h264 === "probably" || h264 === "maybe" || generic === "probably" || generic === "maybe";
}

export function browserCanPlayQuickTime() {
  if (typeof document === "undefined") return false;
  const v = document.createElement("video");
  const qt = v.canPlayType('video/quicktime; codecs="avc1"');
  return qt === "probably" || qt === "maybe";
}

/** Heurística: ficheiro provavelmente HEVC/H.265 (iPhone MOV or Samsung MP4). */
export function isLikelyHevcFile(file) {
  if (!file) return false;
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();
  if (/hevc|h265|h\.265/i.test(name)) return true;
  if (type === "video/quicktime" && !browserCanPlayQuickTime()) return true;
  // Samsung Galaxy records in HEVC even in .mp4 container. The numbers
  // 1000xxxxxx are Samsung file naming pattern (e.g. 1000290300.mp4).
  if (/^1\d{9,}\.mp4$/i.test(name)) return true;
  return false;
}

/**
 * @returns {{
 *   canPreview: boolean,
 *   likelyHevc: boolean,
 *   showThumbnailOnly: boolean,
 * }}
 */
export function analyzeVideoPreview(file) {
  const likelyHevc = isLikelyHevcFile(file);
  const canPlay = browserCanPlayMp4H264() || (file?.type === "video/quicktime" && browserCanPlayQuickTime());
  return {
    likelyHevc,
    canPreview: canPlay && !likelyHevc,
    showThumbnailOnly: likelyHevc,
  };
}
