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

module.exports = {
  MAX_VIDEO_BYTES,
  transcodeVideoToH264,
  shouldAttemptTranscode,
};
