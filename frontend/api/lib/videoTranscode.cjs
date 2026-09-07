/**
 * Conversão opcional para H.264 (FFmpeg) no upload de vídeo.
 * Em Vercel/serverless sem ffmpeg, devolve o ficheiro original.
 */
const { execFile } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const fsSync = require("fs");

async function downloadUrlToFile(url, dest, maxBytes = 90 * 1024 * 1024) {
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error("Não foi possível descarregar o vídeo para cortar.");
    err.status = 400;
    throw err;
  }
  const out = fsSync.createWriteStream(dest);
  let n = 0;
  try {
    if (!res.body) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > maxBytes) {
        const err = new Error("O vídeo é demasiado pesado (máx. 90 MB). Usa um clip mais curto.");
        err.status = 400;
        throw err;
      }
      await fs.writeFile(dest, buf);
      return buf.length;
    }
    for await (const chunk of res.body) {
      n += chunk.length;
      if (n > maxBytes) {
        out.destroy();
        await fs.unlink(dest).catch(() => {});
        const err = new Error("O vídeo é demasiado pesado (máx. 90 MB). Usa um clip mais curto.");
        err.status = 400;
        throw err;
      }
      if (!out.write(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))) {
        await new Promise((resolve) => out.once("drain", resolve));
      }
    }
    await new Promise((resolve, reject) => {
      out.end(() => resolve());
      out.on("error", reject);
    });
    return n;
  } catch (e) {
    out.destroy();
    throw e;
  }
}

async function ffmpegAvailable() {
  try {
    await execFileAsync("ffmpeg", ["-version"], { timeout: 4000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} inputPath
 * @returns {Promise<{ outputPath: string, converted: boolean } | null>}
 */
async function transcodeVideoToH264(inputPath) {
  if (!(await ffmpegAvailable())) return null;
  const dir = path.dirname(inputPath);
  const outPath = path.join(dir, `h264-${Date.now()}-${path.basename(inputPath, path.extname(inputPath))}.mp4`);
  try {
    await execFileAsync(
      "ffmpeg",
      [
        "-y",
        "-i",
        inputPath,
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "23",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        outPath,
      ],
      { timeout: 120000, maxBuffer: MAX_VIDEO_BYTES },
    );
    const st = await fs.stat(outPath).catch(() => null);
    if (!st?.size || st.size > MAX_VIDEO_BYTES) {
      await fs.unlink(outPath).catch(() => {});
      return null;
    }
    return { outputPath: outPath, converted: true };
  } catch {
    await fs.unlink(outPath).catch(() => {});
    return null;
  }
}

function shouldAttemptTranscode(filename, mimetype) {
  const name = String(filename || "").toLowerCase();
  const mime = String(mimetype || "").toLowerCase();
  if (mime === "video/quicktime" || /\.mov$/i.test(name)) return true;
  if (/hevc|h265|h\.265/i.test(name)) return true;
  return false;
}

async function probeDurationSec(inputPath) {
  const parse = (text) => {
    const m = String(text || "").match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/i);
    if (!m) return null;
    const n = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  try {
    const { stdout } = await execFileAsync(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", inputPath],
      { timeout: 15000 },
    );
    const n = Number(String(stdout || "").trim());
    if (Number.isFinite(n) && n > 0) return n;
  } catch {
    /* sem ffprobe — usar ffmpeg */
  }
  try {
    await execFileAsync("ffmpeg", ["-hide_banner", "-i", inputPath], { timeout: 20000 });
  } catch (e) {
    const fromErr = parse(`${e.stderr || ""}\n${e.message || ""}`);
    if (fromErr) return fromErr;
  }
  return null;
}

/** Corta o clip ao máximo (Grok 8s, Wan ~10s). Devolve null se ffmpeg falhar. */
async function trimVideoToMaxSeconds(inputPath, maxSec) {
  if (!(await ffmpegAvailable())) return null;
  const cap = Math.max(2, Math.min(15, Number(maxSec) || 8));
  const outPath = path.join(
    path.dirname(inputPath),
    `trim-${Date.now()}-${path.basename(inputPath, path.extname(inputPath))}.mp4`,
  );
  try {
    await execFileAsync(
      "ffmpeg",
      [
        "-hide_banner",
        "-nostats",
        "-loglevel",
        "error",
        "-y",
        "-i",
        inputPath,
        "-t",
        cap.toFixed(2),
        "-map",
        "0:v:0",
        "-vf",
        "scale=w='min(iw,1280)':h='min(ih,720)':force_original_aspect_ratio=decrease",
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-crf",
        "26",
        "-pix_fmt",
        "yuv420p",
        "-map",
        "0:a:0?",
        "-c:a",
        "aac",
        "-b:a",
        "96k",
        "-movflags",
        "+faststart",
        "-threads",
        "1",
        outPath,
      ],
      { timeout: 120000, maxBuffer: 2 * 1024 * 1024 },
    );
    const st = await fs.stat(outPath).catch(() => null);
    if (!st?.size) {
      await fs.unlink(outPath).catch(() => {});
      return null;
    }
    return { outputPath: outPath, converted: true };
  } catch {
    await fs.unlink(outPath).catch(() => {});
    return null;
  }
}

module.exports = {
  MAX_VIDEO_BYTES,
  transcodeVideoToH264,
  shouldAttemptTranscode,
  probeDurationSec,
  trimVideoToMaxSeconds,
  downloadUrlToFile,
};
