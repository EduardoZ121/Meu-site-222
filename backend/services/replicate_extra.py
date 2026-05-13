"""Extra Replicate model wrappers for utility tools (background remover, upscaler, etc.)."""
import os
import asyncio
from typing import List
import replicate

REPLICATE_TOKEN = os.environ.get("REPLICATE_API_TOKEN")

# Curated, production-grade model IDs (versions are pinned where useful)
EXTRA_MODELS = {
    "bg_remove":     "851-labs/background-remover",     # robust BG removal (alpha cutout)
    "upscale":       "philz1337x/clarity-upscaler",     # great image upscaler
    "restore":       "tencentarc/gfpgan",               # old photo / face restoration
    "colorize":      "piddnad/ddcolor",                  # B&W → color
    "inpaint":       "black-forest-labs/flux-fill-pro", # inpaint / object remove via mask
    "virtual_tryon": "cuuupid/idm-vton",                # virtual try-on with garment ref
    "kontext":       "black-forest-labs/flux-kontext-max", # clothes/scene edits with prompt
}


def _extract(output):
    """Normalize Replicate output to a list of URL strings."""
    if output is None:
        return []
    if isinstance(output, list):
        out = []
        for x in output:
            out.append(x.url() if callable(getattr(x, "url", None)) else (x.url if hasattr(x, "url") else str(x)))
        return [u for u in out if u and (u.startswith("http") or u.startswith("data:"))]
    if isinstance(output, str):
        return [output]
    if hasattr(output, "url"):
        u = output.url() if callable(output.url) else output.url
        return [str(u)]
    return [str(output)]


async def _run_model(model_id: str, inputs: dict) -> List[str]:
    if not REPLICATE_TOKEN:
        raise RuntimeError("REPLICATE_API_TOKEN not configured")

    def _exec():
        client = replicate.Client(api_token=REPLICATE_TOKEN.strip())
        try:
            return client.run(model_id, input=inputs)
        finally:
            for v in inputs.values():
                if hasattr(v, "close"):
                    try: v.close()
                    except Exception: pass

    output = await asyncio.to_thread(_exec)
    return _extract(output)


async def remove_background(image_path: str) -> List[str]:
    return await _run_model(EXTRA_MODELS["bg_remove"], {"image": open(image_path, "rb")})


async def upscale_image(image_path: str, scale: int = 2, sharpen: bool = True, denoise: bool = True, preserve_colors: bool = True) -> List[str]:
    # Tune clarity-upscaler params based on user toggles
    dynamic = 8 if sharpen else 5          # HDR / micro-contrast
    creativity = 0.20 if denoise else 0.40 # lower creativity = less hallucinated noise
    resemblance = 1.2 if preserve_colors else 0.6
    return await _run_model(EXTRA_MODELS["upscale"], {
        "image": open(image_path, "rb"),
        "scale_factor": scale,
        "dynamic": dynamic,
        "creativity": creativity,
        "resemblance": resemblance,
    })


async def restore_photo(
    image_path: str,
    level: str = "medio",          # leve | medio | profundo
    enhance_faces: bool = True,
    recover_colors: bool = True,
    remove_noise: bool = True,
    sharpen: bool = True,
    custom_prompt: str = "",
) -> List[str]:
    """High-quality photo restoration via Flux Kontext (preserves identity, fixes damage)."""
    intensity = {
        "leve":     "Apply a SUBTLE restoration",
        "medio":    "Apply a balanced professional restoration",
        "profundo": "Apply a DEEP full restoration as if recovered by a master archivist",
    }.get(level, "Apply a balanced professional restoration")

    parts = [
        f"{intensity} of this photograph while keeping the subject's identity, pose, expression "
        "and composition pixel-perfect identical. Do not change faces, clothing, or background layout."
    ]
    if enhance_faces:
        parts.append("Restore facial features with natural skin texture, sharp eyes, well-defined lips and eyebrows; preserve the original likeness.")
    if recover_colors:
        parts.append("Recover natural film-like colors with accurate skin tones; if the photo is black-and-white, gently colorize realistically without oversaturation.")
    if remove_noise:
        parts.append("Remove scratches, dust spots, stains, mold, creases, JPEG artifacts and grain.")
    if sharpen:
        parts.append("Increase overall sharpness and micro-detail clarity, especially on faces, hair and fabric textures.")
    if custom_prompt.strip():
        parts.append(f"Additional intent: {custom_prompt.strip()}")
    parts.append("Output a photo-real, magazine-quality finish.")
    prompt = " ".join(parts)

    return await _run_model(EXTRA_MODELS["kontext"], {
        "input_image": open(image_path, "rb"),
        "prompt": prompt,
        "aspect_ratio": "match_input_image",
        "output_format": "jpg",
        "safety_tolerance": 2,
    })


async def colorize_image(image_path: str) -> List[str]:
    return await _run_model(EXTRA_MODELS["colorize"], {
        "image": open(image_path, "rb"),
        "model_size": "large",
    })


async def inpaint_image(image_path: str, mask_path: str, prompt: str) -> List[str]:
    return await _run_model(EXTRA_MODELS["inpaint"], {
        "image": open(image_path, "rb"),
        "mask": open(mask_path, "rb"),
        "prompt": prompt,
        "output_format": "jpg",
    })


async def virtual_tryon(person_path: str, garment_path: str, prompt: str = "") -> List[str]:
    """Virtual try-on: dress the person with the garment from `garment_path`."""
    return await _run_model(EXTRA_MODELS["virtual_tryon"], {
        "human_img": open(person_path, "rb"),
        "garm_img": open(garment_path, "rb"),
        "garment_des": prompt or "outfit",
        "crop": False,
    })


async def kontext_edit(image_path: str, prompt: str, aspect_ratio: str = "match_input_image") -> List[str]:
    """Flux Kontext — best-in-class clothing/scene edits via natural language."""
    return await _run_model(EXTRA_MODELS["kontext"], {
        "input_image": open(image_path, "rb"),
        "prompt": prompt,
        "aspect_ratio": aspect_ratio,
        "output_format": "jpg",
        "safety_tolerance": 2,
    })
