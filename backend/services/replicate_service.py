"""Replicate API service for image + video generation."""
import os
import asyncio
from typing import List, Optional
import replicate

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
    """Generate image(s) via Replicate."""
    if not REPLICATE_TOKEN:
        raise RuntimeError("REPLICATE_API_TOKEN not configured")

    model_id = MODELS.get(model_key, MODELS["standard"])
    payload: dict = {
        "prompt": prompt,
        "aspect_ratio": aspect_ratio,
        "num_outputs": num_outputs,
    }
    if image_path and model_key in ("pro", "artistic", "kontext"):
        payload["image"] = open(image_path, "rb")

    def _run():
        client = replicate.Client(api_token=REPLICATE_TOKEN.strip())
        try:
            return client.run(model_id, input=payload)
        finally:
            # close file if we opened one
            if "image" in payload and hasattr(payload["image"], "close"):
                try: payload["image"].close()
                except Exception: pass

    output = await asyncio.to_thread(_run)
    return _extract_urls(output)


async def generate_video(prompt: str, image_path: Optional[str] = None, aspect_ratio: str = "16:9") -> List[str]:
    """Generate a short video (~6s)."""
    if not REPLICATE_TOKEN:
        raise RuntimeError("REPLICATE_API_TOKEN not configured")

    payload: dict = {"prompt": prompt, "aspect_ratio": aspect_ratio}
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
