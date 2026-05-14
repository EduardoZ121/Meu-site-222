"""Photo upload helper.
We accept multipart files at backend, store briefly in /tmp, then hand the
file path to Replicate. Replicate uploads to its own CDN automatically.
"""
import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
from PIL import Image

UPLOAD_DIR = Path("/tmp/remakepix_uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_BYTES = 12 * 1024 * 1024  # 12 MB
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}


async def save_upload(file: UploadFile) -> str:
    """Save an UploadFile to /tmp and return its absolute path."""
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")
    ext = (file.filename or "image.jpg").split(".")[-1].lower()
    if ext not in {"jpg", "jpeg", "png", "webp", "heic", "heif"}:
        ext = "jpg"
    body = await file.read()
    if len(body) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 12 MB)")
    path = UPLOAD_DIR / f"{uuid.uuid4().hex}.{ext}"
    path.write_bytes(body)
    return str(path)


def cleanup(path: str) -> None:
    try:
        os.remove(path)
    except Exception:
        pass


def compose_side_by_side(left_path: str, right_path: str, target_h: int = 1024) -> str:
    """Stack two images side-by-side on a single canvas. Returns new file path.
    Used to feed image-edit models that only accept ONE input image (e.g. Grok)
    when the user wants to combine a subject photo with a garment reference.
    """
    li = Image.open(left_path).convert("RGB")
    ri = Image.open(right_path).convert("RGB")
    # Resize each to target height while preserving aspect ratio
    def resize(im):
        w, h = im.size
        nw = max(1, int(w * (target_h / max(1, h))))
        return im.resize((nw, target_h), Image.LANCZOS)
    li = resize(li); ri = resize(ri)
    gap = 24
    canvas = Image.new("RGB", (li.width + gap + ri.width, target_h), (15, 15, 15))
    canvas.paste(li, (0, 0))
    canvas.paste(ri, (li.width + gap, 0))
    out = UPLOAD_DIR / f"compose_{uuid.uuid4().hex}.jpg"
    canvas.save(out, "JPEG", quality=92)
    return str(out)
