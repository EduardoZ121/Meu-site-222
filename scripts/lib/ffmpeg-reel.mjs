import { execSync } from "child_process";
import fs from "fs/promises";
import path from "path";

export const FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
export const FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
export const SIZE = "1080x1920";

export function run(cmd) {
  execSync(cmd, { stdio: "inherit", maxBuffer: 64 * 1024 * 1024 });
}

export function esc(text) {
  return text.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/:/g, "\\:");
}

/** Ken-burns clip from still image */
export function imageClip(src, out, seconds, mode = "in") {
  const z = mode === "out"
    ? "zoompan=z='if(lte(on,1),1.12,max(1.0,1.12-0.0004*on))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30"
    : "zoompan=z='min(zoom+0.0012,1.18)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30";
  run(
    `ffmpeg -y -loop 1 -i "${src}" -vf "${z},format=yuv420p" -t ${seconds} -an -c:v libx264 -preset fast -crf 18 "${out}"`,
  );
}

/** Bold hook card — Instagram ad style */
export function hookCard(out, main, sub, seconds, accent = "0x7C3AED") {
  const d = seconds;
  run(
    `ffmpeg -y -f lavfi -i color=c=0x0B0B0C:s=${SIZE}:d=${d}:rate=30 -vf "drawtext=fontfile=${FONT_BOLD}:text='${esc(main)}':fontsize=78:fontcolor=0xF4F1EA:x=(w-text_w)/2:y=(h-text_h)/2-80,drawtext=fontfile=${FONT_REG}:text='${esc(sub)}':fontsize=36:fontcolor=${accent}:x=(w-text_w)/2:y=(h-text_h)/2+40" -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -an "${out}"`,
  );
}

/** Step number card (01 / 02 / 03) */
export function stepCard(out, num, label, seconds) {
  run(
    `ffmpeg -y -f lavfi -i color=c=0x0B0B0C:s=${SIZE}:d=${seconds}:rate=30 -vf "drawtext=fontfile=${FONT_BOLD}:text='${esc(num)}':fontsize=200:fontcolor=0x7C3AED:x=(w-text_w)/2:y=(h-text_h)/2-120,drawtext=fontfile=${FONT_BOLD}:text='${esc(label)}':fontsize=56:fontcolor=0xF4F1EA:x=(w-text_w)/2:y=(h-text_h)/2+80" -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -an "${out}"`,
  );
}

export function fitVertical(inPath, out) {
  run(
    `ffmpeg -y -i "${inPath}" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30" -c:v libx264 -preset fast -crf 18 -an "${out}"`,
  );
}

export function concatClips(listFile, out) {
  run(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -movflags +faststart -an "${out}"`);
}

export async function writeConcatList(dir, files) {
  const list = path.join(dir, "concat.txt");
  const body = files.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n");
  await fs.writeFile(list, body);
  return list;
}

export function addMusic(videoIn, musicMp3, videoOut, vol = 0.28) {
  run(
    `ffmpeg -y -i "${videoIn}" -i "${musicMp3}" -filter_complex "[1:a]volume=${vol},afade=t=in:st=0:d=1.2,afade=t=out:st=12:d=2[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "${videoOut}"`,
  );
}
