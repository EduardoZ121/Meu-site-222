import {
  MAX_VIDEO_SOURCE_PICKER_BYTES,
  MAX_VIDEO_USER_BYTES,
} from "./uploadConstants";
import { readVideoDurationSeconds } from "./videoMedia";

export const DEFAULT_CLIP_SEC = 6;
export const MIN_CLIP_SEC = 2;
const CLIP_ANALYSIS_TIMEOUT_MS = 12_000;
const CLIP_SEEK_TIMEOUT_MS = 4_000;
const CLIP_MAX_MOTION_SAMPLES = 8;

function withTimeout(promise, ms, label = "Operação") {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label}_timeout`)), ms);
    }),
  ]);
}

function waitForEvent(el, event) {
  return new Promise((resolve, reject) => {
    const onOk = () => { cleanup(); resolve(); };
    const onErr = () => { cleanup(); reject(new Error(`${event}_failed`)); };
    const cleanup = () => {
      el.removeEventListener(event, onOk);
      el.removeEventListener("error", onErr);
    };
    el.addEventListener(event, onOk, { once: true });
    el.addEventListener("error", onErr, { once: true });
  });
}

export function formatVideoClock(totalSec) {
  const s = Math.max(0, Number(totalSec) || 0);
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return m > 0 ? `${m}:${String(r).padStart(2, "0")}` : `${r}s`;
}

export function formatVideoSizeMb(bytes) {
  return `${((Number(bytes) || 0) / (1024 * 1024)).toFixed(1)} MB`;
}

export async function readVideoMeta(file, { timeoutMs = 12000 } = {}) {
  const duration = await readVideoDurationSeconds(file, { timeoutMs });
  let width = 0;
  let height = 0;
  if (typeof document !== "undefined") {
    const url = URL.createObjectURL(file);
    try {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      v.playsInline = true;
      v.src = url;
      await waitForEvent(v, "loadedmetadata");
      width = v.videoWidth || 0;
      height = v.videoHeight || 0;
    } catch {
      /* duration still useful */
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return {
    duration,
    width,
    height,
    size: file.size,
  };
}

export function videoNeedsClipStudio(file, durationSec, {
  maxClipSec = 10,
  maxOutputBytes = MAX_VIDEO_USER_BYTES,
} = {}) {
  if (!file) return false;
  if (file.size > maxOutputBytes) return true;
  if (Number.isFinite(durationSec) && durationSec > maxClipSec) return true;
  return false;
}

export function clampClipRange(totalSec, startSec, clipSec, {
  minClipSec = MIN_CLIP_SEC,
  maxClipSec = 10,
} = {}) {
  const total = Math.max(0, Number(totalSec) || 0);
  const minClip = Math.min(minClipSec, total || minClipSec);
  const maxClip = Math.min(maxClipSec, total || maxClipSec);
  let clip = Math.min(Math.max(Number(clipSec) || minClip, minClip), maxClip);
  let start = Math.max(0, Number(startSec) || 0);
  if (start + clip > total) start = Math.max(0, total - clip);
  clip = Math.min(clip, total - start);
  return { startSec: start, clipSec: clip, endSec: start + clip };
}

/** Analisa movimento (diferença entre frames) e sugere janela de corte. */
export async function suggestClipWindow(file, {
  maxClipSec = 10,
  preferredClipSec = DEFAULT_CLIP_SEC,
  minClipSec = MIN_CLIP_SEC,
  onProgress,
} = {}) {
  const meta = await readVideoMeta(file);
  const total = meta.duration;
  if (!total) {
    return {
      ...clampClipRange(preferredClipSec, 0, preferredClipSec, { minClipSec, maxClipSec }),
      reason: "start",
      meta,
    };
  }

  const clipSec = clampClipRange(total, 0, preferredClipSec, { minClipSec, maxClipSec }).clipSec;
  if (total <= maxClipSec && file.size <= MAX_VIDEO_USER_BYTES) {
    return {
      startSec: 0,
      clipSec: total,
      endSec: total,
      reason: "full",
      meta,
    };
  }

  // Clips grandes (ex. Telegram) — evita análise frame-a-frame que trava no browser.
  if (file.size > 12 * 1024 * 1024 || total > maxClipSec * 2) {
    const range = clampClipRange(total, 0, clipSec, { minClipSec, maxClipSec });
    return { ...range, reason: "start", meta };
  }

  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  const seekTo = (t) => new Promise((resolve, reject) => {
    let timer = null;
    const onSeeked = () => { cleanup(); resolve(); };
    const onErr = () => { cleanup(); reject(new Error("seek_failed")); };
    const cleanup = () => {
      if (timer) clearTimeout(timer);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onErr);
    };
    timer = setTimeout(() => {
      cleanup();
      reject(new Error("seek_timeout"));
    }, CLIP_SEEK_TIMEOUT_MS);
    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onErr, { once: true });
    video.currentTime = Math.min(Math.max(0, t), Math.max(0, total - 0.05));
  });

  const analyzeMotion = async () => {
    await waitForEvent(video, "loadedmetadata");
    const w = Math.min(320, video.videoWidth || 320);
    const h = Math.max(1, Math.round((w / (video.videoWidth || w)) * (video.videoHeight || 180)));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const sampleStarts = [];
    const step = Math.max(0.75, (total - clipSec) / CLIP_MAX_MOTION_SAMPLES);
    for (let t = 0; t <= Math.max(0, total - clipSec); t += step) {
      sampleStarts.push(Math.min(t, Math.max(0, total - clipSec)));
      if (sampleStarts.length >= CLIP_MAX_MOTION_SAMPLES) break;
    }

    const scores = [];
    for (let i = 0; i < sampleStarts.length; i += 1) {
      const start = sampleStarts[i];
      let motion = 0;
      let prev = null;
      const probes = 2;
      for (let p = 0; p < probes; p += 1) {
        const at = start + (p * clipSec) / probes;
        await seekTo(at);
        ctx.drawImage(video, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        if (prev) {
          for (let j = 0; j < data.length; j += 20) {
            motion += Math.abs(data[j] - prev[j])
              + Math.abs(data[j + 1] - prev[j + 1])
              + Math.abs(data[j + 2] - prev[j + 2]);
          }
        }
        prev = data;
      }
      scores.push({ start, score: motion });
      if (onProgress) onProgress((i + 1) / sampleStarts.length);
    }

    let best = scores[0] || { start: 0, score: 0 };
    for (const s of scores) {
      if (s.score > best.score) best = s;
    }

    const range = clampClipRange(total, best.start, clipSec, { minClipSec, maxClipSec });
    return {
      ...range,
      reason: best.score > 0 ? "motion" : "start",
      meta,
    };
  };

  try {
    return await withTimeout(analyzeMotion(), CLIP_ANALYSIS_TIMEOUT_MS, "clip_analysis");
  } catch {
    const range = clampClipRange(total, 0, clipSec, { minClipSec, maxClipSec });
    return { ...range, reason: "start", meta };
  } finally {
    URL.revokeObjectURL(url);
    video.removeAttribute("src");
    video.load();
  }
}

export async function trimVideoClip(file, startSec, endSec, { onProgress } = {}) {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  await waitForEvent(video, "loadedmetadata");

  const w = video.videoWidth || 1280;
  const h = video.videoHeight || 720;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  const fps = 30;
  const stream = canvas.captureStream(fps);

  const mimeType = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ].find((m) => (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)))
    || "video/webm";

  const duration = Math.max(0.1, endSec - startSec);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 2_800_000,
  });
  const chunks = [];

  return new Promise((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data?.size) chunks.push(e.data);
    };
    recorder.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("trim_record_failed"));
    };
    recorder.onstop = () => {
      URL.revokeObjectURL(url);
      const blob = new Blob(chunks, { type: mimeType });
      const base = (file.name || "clip").replace(/\.[^.]+$/, "") || "clip";
      resolve(new File([blob], `${base}-clip.webm`, { type: blob.type || "video/webm" }));
    };

    video.currentTime = Math.max(0, startSec);
    video.onseeked = async () => {
      video.onseeked = null;
      try {
        recorder.start(250);
        await video.play();
      } catch (err) {
        reject(err);
        return;
      }

      const tick = () => {
        if (video.currentTime >= endSec - 0.05 || video.ended) {
          video.pause();
          if (recorder.state === "recording") recorder.stop();
          return;
        }
        ctx.drawImage(video, 0, 0, w, h);
        if (onProgress) onProgress(Math.min(1, (video.currentTime - startSec) / duration));
        requestAnimationFrame(tick);
      };
      tick();
    };
  });
}

export function validateVideoSourcePick(file, t) {
  if (!file) return { ok: false, message: t("vid_edit_err_video") };
  if (file.size > MAX_VIDEO_SOURCE_PICKER_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const maxMb = Math.round(MAX_VIDEO_SOURCE_PICKER_BYTES / (1024 * 1024));
    return { ok: false, message: t("vid_err_source_too_large", { size: sizeMb, max: maxMb }) };
  }
  return { ok: true, message: null };
}
