"""Generates Unisex grid thumbnails for the Estúdio page.

For each PADRAO_STYLES entry with cat="unisex":
  - Loads the woman.jpg + man.jpg reference photos
  - Calls Nano Banana (Gemini 3.1 flash image) with both refs + the bot prompt
  - Resizes the result to 540x720 (3:4) and saves as JPEG into
    /app/frontend/public/images/styles/{style_id}.jpg

Usage:
    python3 scripts/gen_unisex_thumbs.py             # process all 52
    python3 scripts/gen_unisex_thumbs.py --limit 4   # just first 4 (smoke test)
    python3 scripts/gen_unisex_thumbs.py --ids u_joker u_corporate  # subset

Cost: ~$0.039 per image via EMERGENT_LLM_KEY (Nano Banana).
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
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

from padrao_styles import PADRAO_STYLES  # noqa: E402

load_dotenv("/app/backend/.env")

REF_DIR = Path("/tmp/user_refs")
OUT_DIR = Path("/app/frontend/public/images/styles")
OUT_DIR.mkdir(parents=True, exist_ok=True)

WOMAN_REF = REF_DIR / "woman.jpg"
MAN_REF   = REF_DIR / "man.jpg"

MODEL = "gemini-3.1-flash-image-preview"
TARGET_SIZE = (540, 720)   # 3:4 portrait, retina-ready

KEY = os.getenv("EMERGENT_LLM_KEY")
if not KEY:
    print("ERROR: EMERGENT_LLM_KEY missing from /app/backend/.env"); sys.exit(1)


def load_ref_b64(path: Path) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("ascii")


def crop_to_3_4(img: Image.Image) -> Image.Image:
    """Center-crop to a 3:4 portrait then resize to TARGET_SIZE."""
    w, h = img.size
    target_ratio = TARGET_SIZE[0] / TARGET_SIZE[1]
    cur_ratio = w / h
    if cur_ratio > target_ratio:
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
    elif cur_ratio < target_ratio:
        new_h = int(w / target_ratio)
        top = (h - new_h) // 2
        img = img.crop((0, top, w, top + new_h))
    return img.resize(TARGET_SIZE, Image.LANCZOS)


def make_thumb_prompt(style_prompt: str, sex: str) -> tuple[str, list[str]]:
    """Builds the AI prompt + reference list per gender assignment.

    sex='F' → use ONLY the woman reference, prompt about the woman
    sex='M' → use ONLY the man reference, prompt about the man
    """
    if sex == "F":
        subject_word = "the woman"
        ident = (
            "Use the attached reference photo of the woman (dark wavy hair, "
            "gold hoop earrings). Preserve her identity, face, skin tone and "
            "facial features."
        )
        ref_paths = [WOMAN_REF]
    else:
        subject_word = "the man"
        ident = (
            "Use the attached reference photo of the man (dark hair). "
            "Preserve his identity, face, skin tone and facial features."
        )
        ref_paths = [MAN_REF]

    base = style_prompt.replace("[subject]", subject_word)
    full = (
        f"{ident}\n\n"
        "Apply the following style. Output ONE 3:4 portrait image, high quality, "
        "no watermark, no text, no logos.\n\n"
        f"STYLE:\n{base}"
    )
    return full, ref_paths


async def generate_one(sid: str, style: dict, sex: str) -> bool:
    out_path = OUT_DIR / f"{sid}.jpg"
    if out_path.exists():
        print(f"  [skip] {sid} already exists")
        return True

    prompt, ref_paths = make_thumb_prompt(style["prompt"], sex)
    file_contents = [ImageContent(load_ref_b64(p)) for p in ref_paths]
    label = "👩" if sex == "F" else "👨"

    for attempt in range(3):
        try:
            chat = LlmChat(
                api_key=KEY,
                session_id=f"unisex-thumb-{sid}-{attempt}",
                system_message="You are an AI image generator. Always output a single 3:4 portrait image.",
            )
            chat.with_model("gemini", MODEL).with_params(modalities=["image", "text"])
            msg = UserMessage(text=prompt, file_contents=file_contents)
            text, images = await chat.send_message_multimodal_response(msg)

            if not images:
                print(f"  [fail-{attempt}] {sid}: no images returned. text={text[:120]!r}")
                await asyncio.sleep(2 ** attempt)
                continue

            raw = base64.b64decode(images[0]["data"])
            img = Image.open(io.BytesIO(raw)).convert("RGB")
            img = crop_to_3_4(img)
            img.save(out_path, "JPEG", quality=85, optimize=True)
            kb = out_path.stat().st_size // 1024
            print(f"  {label} {sid}: {style['nome'][:45]} → {out_path.name} ({kb} KB)")
            return True
        except Exception as e:
            print(f"  [err-{attempt}] {sid}: {type(e).__name__}: {str(e)[:200]}")
            await asyncio.sleep(2 ** attempt)
    return False


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="Process only first N (0=all)")
    parser.add_argument("--ids", nargs="*", default=None, help="Only these style IDs")
    parser.add_argument("--concurrency", type=int, default=3, help="Parallel requests")
    args = parser.parse_args()

    # Load sex assignment map produced by inspect step
    import json
    sex_map_path = Path("/tmp/unisex_sex_assignment.json")
    if not sex_map_path.exists():
        print("ERROR: /tmp/unisex_sex_assignment.json missing — run the inspect step first")
        sys.exit(1)
    sex_map = json.loads(sex_map_path.read_text())

    targets = [(k, v) for k, v in PADRAO_STYLES.items() if v.get("cat") == "unisex"]
    if args.ids:
        targets = [(k, v) for k, v in targets if k in args.ids]
    if args.limit:
        targets = targets[: args.limit]

    print(f"\nWill generate {len(targets)} unisex thumbnails (concurrency={args.concurrency})")
    print(f"Output: {OUT_DIR}\n")

    sem = asyncio.Semaphore(args.concurrency)
    done = {"ok": 0, "fail": 0}
    start = time.time()

    async def run(sid: str, style: dict):
        async with sem:
            sex = sex_map.get(sid, "M")
            ok = await generate_one(sid, style, sex)
            done["ok" if ok else "fail"] += 1

    await asyncio.gather(*[run(sid, st) for sid, st in targets])
    elapsed = time.time() - start
    print(f"\nDone in {elapsed:.1f}s · ok={done['ok']} · fail={done['fail']}")


if __name__ == "__main__":
    asyncio.run(main())
