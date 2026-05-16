"""Aurora image-generation service — wraps Nano Banana (Gemini 3.1 flash image).

Exposed under the user-facing name "Aurora" (we never reveal the underlying
model in the UI). Uses the Emergent universal LLM key, NOT Replicate.

Sync interface (run synchronously inside a thread to match the existing
Replicate-based pattern in server.py). For long pipelines, prefer the
async polling pattern in services/predictions.py.
"""
from __future__ import annotations
import asyncio
import base64
import io
import logging
import os
from pathlib import Path
from typing import List, Optional

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

logger = logging.getLogger("remakepix.aurora")

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "").strip()
AURORA_MODEL = "gemini-3.1-flash-image-preview"


def _b64_file(path: str) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("ascii")


async def aurora_generate(
    prompt: str,
    *,
    image_paths: Optional[List[str]] = None,
    num_outputs: int = 1,
    aspect_ratio: str = "1:1",
    upload_to_persistent: bool = True,
) -> List[str]:
    """Generate `num_outputs` images via Aurora. Returns a list of URLs.

    Saves outputs locally under /app/backend/uploads/aurora/{uuid}.jpg
    and returns absolute URLs (using APP_PUBLIC_URL) so the frontend can
    display them directly — matching how Replicate URLs are returned.
    """
    if not EMERGENT_LLM_KEY:
        raise RuntimeError("EMERGENT_LLM_KEY missing — Aurora is not configured")

    import uuid as _uuid

    out_dir = Path("/app/backend/uploads/aurora")
    out_dir.mkdir(parents=True, exist_ok=True)
    public_base = os.environ.get("APP_PUBLIC_URL", "http://localhost:8001").rstrip("/")

    file_contents = [ImageContent(_b64_file(p)) for p in (image_paths or [])]
    full_prompt = (
        f"Output ONE high-quality image with aspect ratio {aspect_ratio}. "
        "No watermark, no logos, no UI overlays.\n\n" + prompt
    )

    async def _one(idx: int) -> Optional[str]:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"aurora-{_uuid.uuid4()}",
            system_message="You are an AI image generator. Always output one image.",
        )
        chat.with_model("gemini", AURORA_MODEL).with_params(modalities=["image", "text"])
        msg = UserMessage(text=full_prompt, file_contents=file_contents)
        try:
            text, images = await chat.send_message_multimodal_response(msg)
        except Exception as e:
            logger.warning(f"Aurora call failed (idx={idx}): {e}")
            return None
        if not images:
            logger.warning(f"Aurora returned no images (idx={idx}). text={text[:160]!r}")
            return None
        raw = base64.b64decode(images[0]["data"])
        fname = f"{_uuid.uuid4()}.jpg"
        fpath = out_dir / fname
        # Optimize a bit before saving (no resize — keep model's chosen size)
        try:
            from PIL import Image
            img = Image.open(io.BytesIO(raw)).convert("RGB")
            img.save(fpath, "JPEG", quality=88, optimize=True)
        except Exception:
            with open(fpath, "wb") as f:
                f.write(raw)
        return f"{public_base}/api/static/aurora/{fname}"

    # Run num_outputs in parallel
    results = await asyncio.gather(*[_one(i) for i in range(max(1, num_outputs))])
    urls = [u for u in results if u]
    if not urls:
        raise RuntimeError("Aurora produced no images")
    return urls
