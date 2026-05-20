"""Generates 20 poster thumbnails for the Posters page.

For each entry in POSTER_TEMPLATES:
  - Calls Nano Banana with the bot prompt (no user photo — we synth a generic person)
  - Resizes to 4:5 portrait (480x600) or 9:16 (360x640) for phone posters
  - Saves to /app/frontend/public/images/posters/{id}.jpg
"""
from __future__ import annotations
import argparse
import asyncio
import base64
import io
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from dotenv import load_dotenv
from PIL import Image
from emergentintegrations.llm.chat import LlmChat, UserMessage

from poster_templates import POSTER_TEMPLATES

load_dotenv("/app/backend/.env")

OUT_DIR = Path("/app/frontend/public/images/posters")
OUT_DIR.mkdir(parents=True, exist_ok=True)

MODEL = "gemini-3.1-flash-image-preview"
KEY = os.getenv("EMERGENT_LLM_KEY")

if not KEY:
    print("ERROR: EMERGENT_LLM_KEY missing"); sys.exit(1)


def target_size_for(aspect: str) -> tuple[int, int]:
    return (360, 640) if aspect == "9:16" else (480, 600)


def crop_to(img: Image.Image, target: tuple[int, int]) -> Image.Image:
    w, h = img.size
    target_ratio = target[0] / target[1]
    cur_ratio = w / h
    if cur_ratio > target_ratio:
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
    elif cur_ratio < target_ratio:
        new_h = int(w / target_ratio)
        top = (h - new_h) // 2
        img = img.crop((0, top, w, top + new_h))
    return img.resize(target, Image.LANCZOS)


def make_prompt(template: dict) -> str:
    # The template prompt already replaced [subject] with "the person".
    # We just enrich the directive so Nano Banana produces a synthetic person.
    base = template["prompt"]
    return (
        "Generate a poster image. Synthesize a generic person (the AI may "
        "choose any ethnicity, age, and gender consistent with the brief). "
        "No real public-figure likeness. Output ONE poster image, high quality, "
        "no watermark, no extra text beyond what the brief asks.\n\n"
        f"POSTER BRIEF:\n{base}"
    )


async def generate_one(tpl: dict) -> bool:
    sid = tpl["id"]
    out_path = OUT_DIR / f"{sid}.jpg"
    if out_path.exists():
        print(f"  [skip] {sid}")
        return True

    prompt = make_prompt(tpl)
    target = target_size_for(tpl.get("aspect", "4:5"))

    for attempt in range(3):
        try:
            chat = LlmChat(
                api_key=KEY,
                session_id=f"poster-thumb-{sid}-{attempt}",
                system_message="You are an AI image generator. Output a single poster image.",
            )
            chat.with_model("gemini", MODEL).with_params(modalities=["image", "text"])
            msg = UserMessage(text=prompt)
            text, images = await chat.send_message_multimodal_response(msg)

            if not images:
                print(f"  [fail-{attempt}] {sid}: no images. text={text[:120]!r}")
                await asyncio.sleep(2 ** attempt)
                continue

            raw = base64.b64decode(images[0]["data"])
            img = Image.open(io.BytesIO(raw)).convert("RGB")
            img = crop_to(img, target)
            img.save(out_path, "JPEG", quality=85, optimize=True)
            kb = out_path.stat().st_size // 1024
            print(f"  ✓ {sid}: {tpl['label'][:40]} → {out_path.name} ({kb} KB, {target})")
            return True
        except Exception as e:
            print(f"  [err-{attempt}] {sid}: {type(e).__name__}: {str(e)[:200]}")
            await asyncio.sleep(2 ** attempt)
    return False


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--ids", nargs="*", default=None)
    parser.add_argument("--concurrency", type=int, default=4)
    args = parser.parse_args()

    targets = POSTER_TEMPLATES[:]
    if args.ids:
        targets = [t for t in targets if t["id"] in args.ids]
    if args.limit:
        targets = targets[: args.limit]

    print(f"Will generate {len(targets)} posters (conc={args.concurrency})\nOutput: {OUT_DIR}\n")
    sem = asyncio.Semaphore(args.concurrency)
    done = {"ok": 0, "fail": 0}
    start = time.time()

    async def run(t):
        async with sem:
            ok = await generate_one(t)
            done["ok" if ok else "fail"] += 1

    await asyncio.gather(*[run(t) for t in targets])
    print(f"\nDone in {time.time()-start:.1f}s · ok={done['ok']} · fail={done['fail']}")


if __name__ == "__main__":
    asyncio.run(main())
