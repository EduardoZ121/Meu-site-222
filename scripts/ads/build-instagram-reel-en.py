#!/usr/bin/env python3
"""Build 9:16 Instagram Reels ad (English) from Remake Pixel marketing images."""
from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
IMG = ROOT / "frontend/public/images"
OUT_DIR = ROOT / "scripts/ads/output"
WORK = OUT_DIR / ".work"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FINAL = OUT_DIR / "remakepix-instagram-reel-en.mp4"

SLIDES = [
    ("generate.jpg", "Your photo.", "A whole new look.", 3.5),
    ("styles-grid.jpg", "96+ AI styles", "One creative studio", 3.5),
    ("posters.jpg", "Pro posters", "Ready in seconds", 3.5),
    ("motion.jpg", "Photos and video", "Simple credits. No hassle.", 3.5),
    ("hero-bg.jpg", "Remake Pixel", "remakepix.com — Try free", 4.0),
]


def slide(src: Path, line1: str, line2: str, out: Path, dur: float) -> None:
    fade_out = max(0.1, dur - 0.35)
    vf = (
        "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
        "drawbox=x=0:y=0:w=iw:h=ih:color=0x1a0a2e@0.25:t=fill,"
        "drawbox=x=0:y=ih-480:w=iw:h=480:color=black@0.58:t=fill,"
        f"drawtext=fontfile={FONT}:text={escape(line1)}:fontsize=58:fontcolor=white:"
        "borderw=2:bordercolor=black@0.35:x=(w-text_w)/2:y=h-380,"
        f"drawtext=fontfile={FONT}:text={escape(line2)}:fontsize=42:fontcolor=0xD8B4FE:"
        "borderw=2:bordercolor=black@0.3:x=(w-text_w)/2:y=h-290,"
        f"fade=t=in:st=0:d=0.35,fade=t=out:st={fade_out}:d=0.35"
    )
    subprocess.run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-loop", "1", "-i", str(src), "-t", str(dur),
            "-vf", vf,
            "-c:v", "libx264", "-preset", "fast", "-crf", "20",
            "-pix_fmt", "yuv420p", "-r", "30", "-an", str(out),
        ],
        check=True,
    )


def escape(text: str) -> str:
    return "'" + text.replace("'", r"\'").replace(":", r"\:") + "'"


def main() -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    parts = []
    for i, (img_name, l1, l2, dur) in enumerate(SLIDES, start=1):
        out = WORK / f"{i:02d}.mp4"
        slide(IMG / img_name, l1, l2, out, dur)
        parts.append(out)

    list_file = WORK / "list.txt"
    list_file.write_text("\n".join(f"file '{p}'" for p in parts) + "\n")
    subprocess.run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-f", "concat", "-safe", "0", "-i", str(list_file),
            "-c:v", "libx264", "-preset", "fast", "-crf", "18",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", str(FINAL),
        ],
        check=True,
    )
    print(f"Done: {FINAL} ({FINAL.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
