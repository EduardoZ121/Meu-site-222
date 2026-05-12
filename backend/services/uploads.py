"""Photo upload helper.
We accept multipart files at backend, store briefly in /tmp, then hand the
file path to Replicate. Replicate uploads to its own CDN automatically.
"""
import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException

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
