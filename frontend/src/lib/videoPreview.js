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
  const qt = v.canPlayType("video/quicktime");
  const qtAvc = v.canPlayType('video/quicktime; codecs="avc1"');
  return qt === "probably" || qt === "maybe" || qtAvc === "probably" || qtAvc === "maybe";
}

export function browserCanPlayHevc() {
  if (typeof document === "undefined") return false;
  const v = document.createElement("video");
  const types = [
    'video/mp4; codecs="hvc1.1.6.L93.B0"',
    'video/mp4; codecs="hev1.1.6.L93.B0"',
    'video/quicktime; codecs="hvc1"',
  ];
  return types.some((c) => {
    const r = v.canPlayType(c);
    return r === "probably" || r === "maybe";
  });
}

/** Heurística: ficheiro provavelmente HEVC/H.265 (iPhone MOV or Samsung MP4). */
export function isLikelyHevcFile(file) {
  if (!file) return false;
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();
  if (/hevc|h265|h\.265/i.test(name)) return true;
  if (type === "video/quicktime" && !browserCanPlayQuickTime() && !browserCanPlayHevc()) return true;
  // Samsung Galaxy records in HEVC even in .mp4 container.
  if (/^1\d{9,}\.mp4$/i.test(name) && !browserCanPlayHevc()) return true;
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
  if (likelyHevc && !browserCanPlayHevc()) {
    return {
      likelyHevc: true,
      canPreview: false,
      showThumbnailOnly: true,
    };
  }
  const type = (file?.type || "").toLowerCase();
  const name = (file?.name || "").toLowerCase();
  const isMov = type === "video/quicktime" || /\.mov$/i.test(name);
  const canPlay = isMov
    ? (browserCanPlayQuickTime() || browserCanPlayHevc() || browserCanPlayMp4H264())
    : browserCanPlayMp4H264();
  return {
    likelyHevc,
    canPreview: canPlay,
    showThumbnailOnly: !canPlay,
  };
}
