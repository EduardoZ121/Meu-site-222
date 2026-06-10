"""Async predictions service — non-blocking image generation via Replicate.

The synchronous `client.run()` blocks for 30–120s while polling Replicate
internally. That blows past the K8s ingress 60s idle timeout → users see
"Network Error" and credits are not refunded because our `except` block
never runs (the request was killed mid-flight).

This module exposes the lower-level Replicate predictions API:
  • `create_prediction(...)` returns a prediction_id in ~1-2 seconds.
  • `get_prediction(prediction_id)` returns the current status.

The route layer is responsible for orchestrating: spend credits at creation,
save the creation when the prediction succeeds, refund on failure.
"""
from __future__ import annotations
import asyncio
import os
import base64
import mimetypes
import logging
from typing import Optional, List

import replicate

from services.replicate_service import (
    MODELS,
    normalize_aspect_ratio,
    _extract_urls,
)

logger = logging.getLogger("remakepix.predictions")

REPLICATE_TOKEN = os.environ.get("REPLICATE_API_TOKEN", "").strip()


def _client() -> replicate.Client:
    if not REPLICATE_TOKEN:
        raise RuntimeError("REPLICATE_API_TOKEN not configured")
    return replicate.Client(api_token=REPLICATE_TOKEN)


def _file_to_data_uri(path: str) -> str:
    mime, _ = mimetypes.guess_type(path)
    if not mime:
        mime = "image/jpeg"
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    return f"data:{mime};base64,{b64}"


def _build_payload(
    prompt: str,
    model_key: str,
    aspect_ratio: str,
    num_outputs: int,
    image_path: Optional[str],
) -> dict:
    """Mirror of `generate_image` payload assembly, but inlined so we can
    create predictions without ever calling `client.run()`."""
    payload: dict = {"prompt": prompt}
    AR_MATCH = ("", "match", "match_input_image", "original")

    if image_path:
        if aspect_ratio in AR_MATCH:
            payload["aspect_ratio"] = (
                "match_input_image" if model_key in ("pro", "artistic", "kontext") else "auto"
            )
        else:
            payload["aspect_ratio"] = normalize_aspect_ratio(aspect_ratio, model_key)
    else:
        if aspect_ratio in AR_MATCH:
            payload["aspect_ratio"] = "1:1"
        else:
            payload["aspect_ratio"] = normalize_aspect_ratio(aspect_ratio, model_key)

    if model_key in ("standard", "pro", "artistic"):
        payload["num_outputs"] = num_outputs

    if image_path:
        if model_key == "standard":
            payload["image"] = _file_to_data_uri(image_path)
        elif model_key in ("pro", "artistic"):
            payload["images"] = [_file_to_data_uri(image_path)]
        elif model_key == "kontext":
            payload["input_image"] = _file_to_data_uri(image_path)

    return payload


async def create_image_prediction(
    prompt: str,
    model_key: str = "standard",
    aspect_ratio: str = "1:1",
    num_outputs: int = 1,
    image_path: Optional[str] = None,
) -> str:
    """Submit a prediction to Replicate. Returns the Replicate prediction_id.
    Non-blocking — typically completes in 1–2s (just the create round-trip).
    """
    model_id = MODELS.get(model_key, MODELS["standard"])
    payload = _build_payload(prompt, model_key, aspect_ratio, num_outputs, image_path)

    def _run() -> str:
        client = _client()
        # Resolve to a specific version for the predictions API.
        model_obj = client.models.get(model_id)
        latest = getattr(model_obj, "latest_version", None)
        if not latest:
            raise RuntimeError(f"No published version for model {model_id}")
        version_id = latest.id if hasattr(latest, "id") else str(latest)
        prediction = client.predictions.create(version=version_id, input=payload)
        return prediction.id

    return await asyncio.to_thread(_run)


async def get_prediction_status(prediction_id: str) -> dict:
    """Return `{status, output, error, logs}` for a given Replicate prediction.

    `status` is one of: starting, processing, succeeded, failed, canceled.
    On succeeded, `output` is normalized to a list of URLs.

    Raises:
      - PredictionNotFound — Replicate returned 404 (id invalid / expired).
      - Exception — transient (network, 5xx). Caller should retry.
    """
    def _run() -> dict:
        client = _client()
        try:
            p = client.predictions.get(prediction_id)
        except replicate.exceptions.ReplicateError as e:
            # SDK sometimes wraps 404 here
            msg = str(e).lower()
            if "404" in msg or "not found" in msg:
                raise PredictionNotFound(str(e))
            raise
        except Exception as e:
            # httpx 404 may surface as raw HTTPStatusError
            msg = str(e).lower()
            if "404" in msg or "not found" in msg:
                raise PredictionNotFound(str(e))
            raise
        out = {
            "status": p.status,
            "error": p.error,
            "output_urls": [],
        }
        if p.status == "succeeded":
            out["output_urls"] = _extract_urls(p.output)
        return out

    return await asyncio.to_thread(_run)


class PredictionNotFound(Exception):
    """Raised when Replicate confirms a prediction id does not exist (404)."""
    pass


async def cancel_prediction(prediction_id: str) -> bool:
    """Best-effort cancellation of a running prediction."""
    def _run() -> bool:
        try:
            client = _client()
            client.predictions.cancel(prediction_id)
            return True
        except Exception as e:
            logger.warning(f"Cancel prediction {prediction_id} failed: {e}")
            return False
    return await asyncio.to_thread(_run)
