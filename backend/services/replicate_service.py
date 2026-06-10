"""Replicate API service for image + video generation."""
import os
import base64
import mimetypes
import asyncio
from typing import List, Optional
import replicate


def _file_to_data_uri(path: str) -> str:
    """Encode a local image as a data: URI so models that read the extension
    from the URL (e.g. xai/grok-imagine-image) can detect the format reliably.
    """
    mime, _ = mimetypes.guess_type(path)
    if not mime:
        mime = "image/jpeg"
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    return f"data:{mime};base64,{b64}"


REPLICATE_TOKEN = os.environ.get("REPLICATE_API_TOKEN")
if REPLICATE_TOKEN:
    os.environ["REPLICATE_API_TOKEN"] = REPLICATE_TOKEN.strip()

MODELS = {
    "standard": "xai/grok-imagine-image",
    "pro": "black-forest-labs/flux-2-klein-9b",
    "artistic": "black-forest-labs/flux-2-klein-9b",
    "kontext": "black-forest-labs/flux-kontext-max",
    "video": "xai/grok-imagine-video",
}

# Aspect-ratio whitelists per upstream model — Replicate rejects unknown values with 422.
# Each maps to the **nearest supported ratio** for graceful fallback.
_GROK_SUPPORTED = {"1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "2:1", "1:2"}
_FLUX_SUPPORTED = {"1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9", "9:21"}

# Map any ratio the UI exposes → nearest supported by Grok
_GROK_FALLBACK = {
    "4:5": "3:4",
    "5:4": "4:3",
    "21:9": "2:1",
    "9:21": "1:2",
}
# Map any ratio the UI exposes → nearest supported by Flux
_FLUX_FALLBACK = {
    "4:5": "3:4",
    "5:4": "4:3",
    "2:1": "21:9",
    "1:2": "9:21",
}


def normalize_aspect_ratio(ratio: str, model_key: str) -> str:
    """Return a ratio guaranteed to be accepted by the upstream model."""
    if model_key in ("standard", "video"):
        if ratio in _GROK_SUPPORTED:
            return ratio
        return _GROK_FALLBACK.get(ratio, "1:1")
    if model_key in ("pro", "artistic", "kontext"):
        if ratio in _FLUX_SUPPORTED:
            return ratio
        return _FLUX_FALLBACK.get(ratio, "1:1")
    return ratio

COSTS = {
    "standard": 10,
    "pro": 18,
    "artistic": 13,
    "kontext": 18,
    "video": 20,
    "poster": 15,
    "fast_base": 10,
    "fast_style_extra": 1,
    "carousel_per_slide": 8,
}


def _extract_urls(output) -> List[str]:
    urls: List[str] = []
    if output is None:
        return urls
    if isinstance(output, list):
        for item in output:
            if isinstance(item, str):
                urls.append(item)
            elif hasattr(item, "url"):
                u = item.url() if callable(item.url) else item.url
                urls.append(str(u))
            else:
                urls.append(str(item))
    elif isinstance(output, str):
        urls.append(output)
    elif hasattr(output, "url"):
        u = output.url() if callable(output.url) else output.url
        urls.append(str(u))
    else:
        urls.append(str(output))
    return [u for u in urls if u and (u.startswith("http") or u.startswith("data:"))]


async def generate_image(
    prompt: str,
    model_key: str = "standard",
    aspect_ratio: str = "1:1",
    num_outputs: int = 1,
    image_path: Optional[str] = None,
) -> List[str]:
    """Generate image(s) via Replicate.

    Image-to-image parameter names differ per model:
      - flux-2-klein-9b (pro/artistic): `images` (array, max 5)
      - flux-kontext-max (kontext):     `input_image` (string)
      - grok-imagine-image (standard):  `image` (string)
    When a reference photo is provided we MUST pass it under the correct key
    or the upstream silently falls back to text-only generation.
    """
    if not REPLICATE_TOKEN:
        raise RuntimeError("REPLICATE_API_TOKEN not configured")

    model_id = MODELS.get(model_key, MODELS["standard"])
    payload: dict = {"prompt": prompt}

    # aspect ratio handling
    AR_MATCH = ("", "match", "match_input_image", "original")
    if image_path:
        # When editing an existing image: match input ratio if the caller asked for it (or didn't specify)
        if aspect_ratio in AR_MATCH:
            if model_key in ("pro", "artistic", "kontext"):
                payload["aspect_ratio"] = "match_input_image"
            else:  # standard (Grok) ignores aspect when editing — keep something valid
                payload["aspect_ratio"] = "1:1"
        else:
            if model_key in ("pro", "artistic", "kontext"):
                payload["aspect_ratio"] = normalize_aspect_ratio(aspect_ratio, model_key)
            else:
                payload["aspect_ratio"] = normalize_aspect_ratio(aspect_ratio, model_key)
    else:
        # No reference image
        if aspect_ratio in AR_MATCH:
            payload["aspect_ratio"] = "1:1"
        else:
            payload["aspect_ratio"] = normalize_aspect_ratio(aspect_ratio, model_key)

    # num_outputs is supported by Grok and Flux 2 Klein; Flux Kontext returns 1.
    if model_key in ("standard", "pro", "artistic"):
        payload["num_outputs"] = num_outputs

    file_handles: list = []
    if image_path:
        if model_key == "standard":
            # Grok needs a URL with a recognizable extension; data URIs work reliably.
            payload["image"] = _file_to_data_uri(image_path)
        else:
            fh = open(image_path, "rb")
            file_handles.append(fh)
            if model_key in ("pro", "artistic"):
                payload["images"] = [fh]            # Flux 2 Klein
            elif model_key == "kontext":
                payload["input_image"] = fh         # Flux Kontext

    def _run():
        client = replicate.Client(api_token=REPLICATE_TOKEN.strip())
        try:
            return client.run(model_id, input=payload)
        finally:
            for h in file_handles:
                try: h.close()
                except Exception: pass

    output = await asyncio.to_thread(_run)
    return _extract_urls(output)


async def generate_video(prompt: str, image_path: Optional[str] = None, aspect_ratio: str = "16:9") -> List[str]:
    """Generate a short video (~6s)."""
    if not REPLICATE_TOKEN:
        raise RuntimeError("REPLICATE_API_TOKEN not configured")

    payload: dict = {"prompt": prompt, "aspect_ratio": normalize_aspect_ratio(aspect_ratio, "video")}
    if image_path:
        payload["image"] = open(image_path, "rb")

    def _run():
        client = replicate.Client(api_token=REPLICATE_TOKEN.strip())
        try:
            return client.run(MODELS["video"], input=payload)
        finally:
            if "image" in payload and hasattr(payload["image"], "close"):
                try: payload["image"].close()
                except Exception: pass

    output = await asyncio.to_thread(_run)
    return _extract_urls(output)
