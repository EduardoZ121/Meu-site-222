"""Remake Pixel — FastAPI server."""
import os
import logging
import secrets
from datetime import datetime, timezone
from typing import Optional, List
from pathlib import Path

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header, UploadFile, File, Form
import json
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from db import db  # noqa: E402
from auth import (  # noqa: E402
    hash_password, verify_password, create_token,
    get_current_user, require_admin,
)
from models import (  # noqa: E402
    RegisterIn, LoginIn, UserPublic, AuthResponse,
    GenerateImageIn, CheckoutIn, Creation, CreditTransaction,
    AdminCreditAdjustIn, AdminUserPatch,
)
from services.replicate_service import generate_image, generate_video, MODELS, COSTS  # noqa: E402
from services.predictions import create_image_prediction, get_prediction_status, PredictionNotFound  # noqa: E402
from services.openai_service import (  # noqa: E402
    improve_prompt as ai_improve_prompt,
    rewrite_safe, suggest_prompts, wizard_compose, generate_poster_image, WIZARD_STEPS,
)
from services.uploads import save_upload, cleanup, compose_side_by_side  # noqa: E402
from services import rate_limit, nsfw  # noqa: E402
from fast_styles import FAST_STYLES, get_style  # noqa: E402
from artistic_styles import ARTISTIC_STYLES, get_artistic  # noqa: E402
from pro_presets import PRO_PRESETS, get_pro_preset  # noqa: E402
from poster_templates import POSTER_TEMPLATES, get_poster, POSTER_DIRECTOR, MOOD_EXPANSIONS  # noqa: E402
from padrao_styles import PADRAO_STYLES, GROUP_LABELS, list_categories, get_padrao  # noqa: E402
from visual_styles import VISUAL_STYLES, get_visual_style  # noqa: E402
from aspect_ratios import ASPECT_RATIOS  # noqa: E402
from wizard_questions import WIZARD_QUESTIONS as WIZARD_Q_BOT  # noqa: E402
from personalities import AI_PERSONALITIES  # noqa: E402
from services.stripe_service import create_checkout_session, verify_webhook, PACKAGES  # noqa: E402

# ============== App setup ==============
app = FastAPI(title="Remake Pixel API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("remakepix")

ADMIN_EMAILS = {e.strip().lower() for e in os.environ.get("ADMIN_EMAILS", "").split(",") if e.strip()}
APP_PUBLIC_URL = os.environ.get("APP_PUBLIC_URL", "http://localhost:3000")

# ============== Helpers ==============
def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _gen_referral_code() -> str:
    return secrets.token_urlsafe(6).replace("_", "").replace("-", "")[:8].upper()


async def _user_doc(user_id: str) -> Optional[dict]:
    return await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})


async def _add_credits(user_id: str, amount: int, tx_type: str, description: str = "", metadata: dict = None) -> int:
    """Atomically add (or subtract) credits and log transaction. Returns new balance."""
    res = await db.users.find_one_and_update(
        {"id": user_id},
        {"$inc": {"credits": amount}},
        return_document=True,
        projection={"_id": 0, "credits": 1},
    )
    if not res:
        raise HTTPException(status_code=404, detail="User not found")
    tx = CreditTransaction(
        user_id=user_id, amount=amount, type=tx_type,
        description=description, metadata=metadata or {},
    ).model_dump()
    await db.credit_transactions.insert_one(tx)
    return res["credits"]


async def _spend_credits(user_id: str, amount: int, description: str) -> int:
    """Spend credits if available; raises 402 otherwise. Returns new balance."""
    res = await db.users.find_one_and_update(
        {"id": user_id, "credits": {"$gte": amount}},
        {"$inc": {"credits": -amount}},
        return_document=True,
        projection={"_id": 0, "credits": 1},
    )
    if not res:
        raise HTTPException(status_code=402, detail="Insufficient credits")
    tx = CreditTransaction(
        user_id=user_id, amount=-amount, type="spend", description=description,
    ).model_dump()
    await db.credit_transactions.insert_one(tx)
    return res["credits"]


def _public_user(doc: dict) -> dict:
    return {
        "id": doc["id"],
        "email": doc["email"],
        "name": doc.get("name"),
        "avatar_url": doc.get("avatar_url"),
        "role": doc.get("role", "user"),
        "lang": doc.get("lang", "pt"),
        "credits": doc.get("credits", 0),
        "referral_code": doc.get("referral_code"),
        "created_at": doc["created_at"],
    }


async def _pre_generate_checks(user_id: str, role: str, prompt: Optional[str], cost: int):
    """Common pre-generation pipeline:
    - rate limit (image bucket: 5/min)
    - load user (banned check)
    - NSFW handling (only if NSFW_ENABLED — default OFF per bot.py)
    Returns (user_doc, safe_prompt_or_none, nsfw_hit_or_none).
    """
    rate_limit.enforce_image(user_id, role)
    user = await _user_doc(user_id)
    if not user or user.get("banned"):
        raise HTTPException(status_code=403, detail="Not allowed")
    if user.get("credits", 0) < cost:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    safe_prompt = None
    hit = None
    if prompt:
        if not user.get("nsfw_allowed", False):
            hit = nsfw.detect(prompt)
            if hit:
                try:
                    safe_prompt = await rewrite_safe(prompt)
                except Exception:
                    safe_prompt = nsfw.sanitize(prompt)
    return user, safe_prompt, hit


# ============== Async predictions (non-blocking) ==============
# Pattern: spend credits → create Replicate prediction (returns id in ~1s) →
# store metadata in `pending_predictions` → return prediction_id to client.
# Client polls GET /api/predictions/{id} every 2-3s.
# The polling endpoint finalizes: saves Creation on success, refunds on failure.
import uuid as _uuid  # noqa: E402

async def _create_pending(
    *,
    user_id: str,
    cost: int,
    type_: str,
    prompt: str,
    model_key: str,
    aspect_ratio: str,
    num_outputs: int = 1,
    image_path: Optional[str] = None,
    style_key: Optional[str] = None,
    prompt_improved: Optional[str] = None,
    extra_meta: Optional[dict] = None,
    spend_description: str = "Generation",
) -> dict:
    """Spend credits, submit prediction, persist pending doc. Returns the doc.

    On Replicate submit failure: refunds credits and re-raises. The caller
    must wrap photo cleanup itself.
    """
    new_balance = await _spend_credits(user_id, cost, spend_description)
    try:
        rep_id = await create_image_prediction(
            prompt=prompt_improved or prompt,
            model_key=model_key,
            aspect_ratio=aspect_ratio,
            num_outputs=num_outputs,
            image_path=image_path,
        )
    except Exception as e:
        logger.error(f"Replicate submit failed: {e}")
        await _add_credits(user_id, cost, "refund", f"Refund: submit failed ({e})")
        raise HTTPException(status_code=502, detail=f"Generation submit failed: {str(e)[:200]}")

    doc = {
        "id": str(_uuid.uuid4()),
        "user_id": user_id,
        "replicate_prediction_id": rep_id,
        "type": type_,
        "prompt": prompt,
        "prompt_improved": prompt_improved,
        "model_key": model_key,
        "model_used": MODELS.get(model_key, model_key),
        "aspect_ratio": aspect_ratio,
        "num_outputs": num_outputs,
        "style_key": style_key,
        "credits_spent": cost,
        "status": "starting",
        "result_urls": [],
        "error": None,
        "extra_meta": extra_meta or {},
        "polled_count": 0,
        "balance_after_spend": new_balance,
        "created_at": _now(),
        "completed_at": None,
    }
    await db.pending_predictions.insert_one(doc)
    # _id added by motor; strip before returning
    doc.pop("_id", None)
    return doc


async def _finalize_pending(pending: dict, status_info: dict) -> dict:
    """Move a pending prediction to terminal state: save Creation on success,
    refund on failure. Returns the response body for the client.
    """
    user_id = pending["user_id"]
    cost = pending["credits_spent"]
    pid = pending["id"]
    now = _now()

    if status_info["status"] == "succeeded":
        urls = status_info.get("output_urls") or []
        if not urls:
            # Replicate marked succeeded but no URLs — treat as failure
            new_balance = await _add_credits(user_id, cost, "refund", "Refund: empty output")
            await db.pending_predictions.update_one(
                {"id": pid},
                {"$set": {"status": "refunded", "error": "empty output", "completed_at": now}},
            )
            return {"status": "failed", "error": "Empty output", "new_balance": new_balance, "prediction_id": pid}

        creation = Creation(
            user_id=user_id,
            type=pending["type"] if pending["type"] in ("image", "video") else "image",
            model_used=pending["model_used"],
            prompt=pending["prompt"],
            prompt_improved=pending.get("prompt_improved"),
            style_key=pending.get("style_key"),
            aspect_ratio=pending["aspect_ratio"],
            result_urls=urls,
            credits_spent=cost,
        )
        await db.creations.insert_one(creation.model_dump())
        await db.pending_predictions.update_one(
            {"id": pid},
            {"$set": {"status": "completed", "result_urls": urls, "completed_at": now}},
        )
        user = await _user_doc(user_id)
        return {
            "status": "succeeded",
            "creation": creation.model_dump(),
            "new_balance": (user or {}).get("credits", 0),
            "prediction_id": pid,
        }

    # status in ("failed", "canceled")
    err = status_info.get("error") or "Generation failed"
    new_balance = await _add_credits(user_id, cost, "refund", f"Refund: {err[:120]}")
    await db.pending_predictions.update_one(
        {"id": pid},
        {"$set": {"status": "refunded", "error": str(err)[:300], "completed_at": now}},
    )
    return {"status": "failed", "error": str(err)[:200], "new_balance": new_balance, "prediction_id": pid}


@api.get("/predictions/{prediction_id}")
async def poll_prediction(prediction_id: str, current=Depends(get_current_user)):
    """Client polls this every 2-3s after starting a generation.
    Returns:
      - {status: "processing", elapsed_seconds: 12} → keep polling
      - {status: "succeeded", creation: {...}, new_balance: 567} → done
      - {status: "failed", error: "...", new_balance: 567} → refunded
    """
    pending = await db.pending_predictions.find_one({"id": prediction_id}, {"_id": 0})
    if not pending:
        raise HTTPException(status_code=404, detail="Prediction not found")
    if pending["user_id"] != current["sub"] and current.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not your prediction")

    # Already terminal — return cached response
    if pending["status"] == "completed":
        # Reload creation by prompt match (simplest) — or store creation_id in pending doc
        # For correctness we just return the cached URLs
        user = await _user_doc(pending["user_id"])
        return {
            "status": "succeeded",
            "creation": {
                "result_urls": pending["result_urls"],
                "type": pending["type"],
                "model_used": pending["model_used"],
                "prompt": pending["prompt"],
                "aspect_ratio": pending["aspect_ratio"],
                "credits_spent": pending["credits_spent"],
            },
            "new_balance": (user or {}).get("credits", 0),
            "prediction_id": prediction_id,
        }
    if pending["status"] == "refunded":
        user = await _user_doc(pending["user_id"])
        return {
            "status": "failed",
            "error": pending.get("error") or "Generation failed",
            "new_balance": (user or {}).get("credits", 0),
            "prediction_id": prediction_id,
        }

    # Poll Replicate
    try:
        info = await get_prediction_status(pending["replicate_prediction_id"])
    except PredictionNotFound as e:
        # Replicate says this prediction is gone → treat as failed + refund
        logger.warning(f"Prediction {prediction_id} not found on Replicate: {e}")
        return await _finalize_pending(pending, {"status": "failed", "error": "Prediction expired or not found on provider"})
    except Exception as e:
        # If we've been polling for > 4 min and still get errors → give up + refund
        elapsed = _elapsed(pending)
        if elapsed > 240:
            logger.error(f"Prediction {prediction_id} timed out after {elapsed}s: {e}")
            return await _finalize_pending(pending, {"status": "failed", "error": f"Timeout after {elapsed}s polling Replicate"})
        logger.warning(f"Replicate poll failed for {prediction_id} (will retry): {e}")
        # Soft fail — let the client retry the poll
        return {"status": "processing", "elapsed_seconds": elapsed, "prediction_id": prediction_id}

    await db.pending_predictions.update_one(
        {"id": prediction_id},
        {"$inc": {"polled_count": 1}, "$set": {"status": info["status"]}},
    )

    if info["status"] in ("succeeded", "failed", "canceled"):
        return await _finalize_pending(pending, info)

    return {
        "status": "processing",
        "elapsed_seconds": _elapsed(pending),
        "prediction_id": prediction_id,
    }


def _elapsed(pending: dict) -> int:
    try:
        started = datetime.fromisoformat(pending["created_at"])
        return int((datetime.now(timezone.utc) - started).total_seconds())
    except Exception:
        return 0


# ============== Public ==============
@api.get("/")
async def health():
    return {"status": "ok", "service": "Remake Pixel API"}


@api.get("/public/stats")
async def public_stats():
    users = await db.users.count_documents({})
    creations = await db.creations.count_documents({})
    return {"users": max(users, 1247), "creations": max(creations, 8432), "models": 4}


@api.get("/public/styles")
async def public_styles():
    return {"styles": FAST_STYLES}


@api.get("/public/artistic-styles")
async def public_artistic():
    from artistic_styles import CATEGORIES
    return {"styles": ARTISTIC_STYLES, "categories": CATEGORIES}


@api.get("/public/pro-presets")
async def public_pro_presets():
    return {"presets": [{"id": k, **v} for k, v in PRO_PRESETS.items()]}


@api.get("/public/poster-templates")
async def public_poster_templates():
    return {"templates": POSTER_TEMPLATES}


@api.get("/public/wizard-steps")
async def public_wizard_steps():
    return {"steps": WIZARD_STEPS}


@api.get("/public/padrao-styles")
async def public_padrao_styles():
    """65+ estilos reais do bot (Modelo Padrão / modo Fácil)."""
    items = [{"id": k, **v} for k, v in PADRAO_STYLES.items()]
    return {"styles": items, "groups": GROUP_LABELS, "categories": list(list_categories().keys())}


@api.get("/public/visual-styles")
async def public_visual_styles():
    """34 visual styles (Modo Avançado e Artistic)."""
    return {"styles": [{"id": k, **v} for k, v in VISUAL_STYLES.items()]}


@api.get("/public/aspect-ratios")
async def public_aspect_ratios():
    return {"ratios": [{"id": k, **v} for k, v in ASPECT_RATIOS.items()]}


@api.get("/public/wizard-questions")
async def public_wizard_questions():
    """5 perguntas com opções 1-8 (real do bot)."""
    return {"questions": WIZARD_Q_BOT}


@api.get("/public/personalities")
async def public_personalities():
    return {"personalities": [{"id": k, **v} for k, v in AI_PERSONALITIES.items()]}


@api.get("/explore")
async def explore(limit: int = 24):
    """Public gallery — recent public creations."""
    docs = await db.creations.find(
        {"is_public": True}, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(length=limit)
    return {"creations": docs}


@api.get("/public/packages")
async def public_packages():
    return {
        "packages": [
            {"id": k, **v, "amount_eur": v["amount_cents"] / 100}
            for k, v in PACKAGES.items()
        ]
    }


# ============== Auth ==============
@api.post("/auth/register", response_model=AuthResponse)
async def register(payload: RegisterIn):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    role = "admin" if email in ADMIN_EMAILS else "user"
    user_id = secrets.token_hex(8)
    referral_code = _gen_referral_code()

    user_doc = {
        "id": user_id,
        "email": email,
        "name": payload.name or email.split("@")[0],
        "avatar_url": None,
        "password_hash": hash_password(payload.password),
        "role": role,
        "lang": "pt",
        "credits": 30,  # signup bonus (igual ao bot)
        "referral_code": referral_code,
        "referred_by": None,
        "banned": False,
        "shadowbanned": False,
        "nsfw_allowed": False,
        "created_at": _now(),
        "last_activity": _now(),
    }

    # Referral handling
    if payload.referral_code:
        ref = await db.users.find_one({"referral_code": payload.referral_code.upper()})
        if ref and ref["id"] != user_id:
            user_doc["referred_by"] = ref["id"]

    await db.users.insert_one(user_doc)
    await db.credit_transactions.insert_one(CreditTransaction(
        user_id=user_id, amount=30, type="free", description="Signup bonus",
    ).model_dump())

    token = create_token(user_id, role)
    return {"token": token, "user": _public_user(user_doc)}


@api.post("/auth/login", response_model=AuthResponse)
async def login(payload: LoginIn):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.get("banned"):
        raise HTTPException(status_code=403, detail="Account banned")
    await db.users.update_one({"id": user["id"]}, {"$set": {"last_activity": _now()}})
    token = create_token(user["id"], user.get("role", "user"))
    return {"token": token, "user": _public_user(user)}


@api.get("/auth/me", response_model=UserPublic)
async def me(current=Depends(get_current_user)):
    doc = await _user_doc(current["sub"])
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return _public_user(doc)


# ============== Credits ==============
@api.get("/credits/balance")
async def credits_balance(current=Depends(get_current_user)):
    doc = await _user_doc(current["sub"])
    return {"credits": doc.get("credits", 0) if doc else 0}


@api.get("/credits/transactions")
async def credits_tx(limit: int = 50, current=Depends(get_current_user)):
    docs = await db.credit_transactions.find(
        {"user_id": current["sub"]}, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(length=limit)
    return {"transactions": docs}


# ============== Generation ==============
@api.post("/generate/image")
async def generate(payload: GenerateImageIn, current=Depends(get_current_user)):
    user = await _user_doc(current["sub"])
    if not user or user.get("banned"):
        raise HTTPException(status_code=403, detail="Not allowed")

    prompt = payload.prompt.strip()
    if len(prompt) < 3:
        raise HTTPException(status_code=400, detail="Prompt too short")

    # Resolve model + cost
    if payload.mode == "fast":
        style = get_style(payload.style_key) if payload.style_key else None
        if style:
            prompt = f"{prompt}, {style['suffix']}"
            model_key = style["model"]
            cost = COSTS["fast_base"] + COSTS["fast_style_extra"]
        else:
            model_key = "standard"
            cost = COSTS["fast_base"]
    else:
        model_key = "standard"
        cost = COSTS["standard"] * max(1, payload.num_outputs)

    prompt_improved = None
    if payload.improve_prompt:
        prompt_improved = await ai_improve_prompt(prompt)

    # Async pattern: spend credits + submit + return prediction_id (no waiting)
    pending = await _create_pending(
        user_id=current["sub"],
        cost=cost,
        type_="image",
        prompt=prompt,
        prompt_improved=prompt_improved,
        model_key=model_key,
        aspect_ratio=payload.aspect_ratio,
        num_outputs=payload.num_outputs,
        style_key=payload.style_key,
        spend_description=f"Generate image ({model_key})",
    )
    return {
        "prediction_id": pending["id"],
        "status": "processing",
        "new_balance": pending["balance_after_spend"],
    }


@api.get("/generations/history")
async def generations_history(limit: int = 30, only_favorites: bool = False, current=Depends(get_current_user)):
    q = {"user_id": current["sub"]}
    if only_favorites:
        q["is_favorite"] = True
    docs = await db.creations.find(q, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(length=limit)
    return {"creations": docs}


@api.post("/generations/{creation_id}/favorite")
async def toggle_favorite(creation_id: str, current=Depends(get_current_user)):
    doc = await db.creations.find_one({"id": creation_id, "user_id": current["sub"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Creation not found")
    new_val = not doc.get("is_favorite", False)
    await db.creations.update_one({"id": creation_id}, {"$set": {"is_favorite": new_val}})
    return {"is_favorite": new_val}


@api.delete("/generations/{creation_id}")
async def delete_creation(creation_id: str, current=Depends(get_current_user)):
    res = await db.creations.delete_one({"id": creation_id, "user_id": current["sub"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Creation not found")
    return {"ok": True}

# ===================================================================
# UTILITY TOOLS (Background Remove, Upscale, Restore, Colorize, Inpaint)
# ===================================================================
from services.replicate_extra import (  # noqa: E402
    remove_background, upscale_image, restore_photo, colorize_image, inpaint_image,
    virtual_tryon, kontext_edit,
)

TOOL_COSTS = {
    "bg_remove": 5,
    "bg_remove_scene": 8,
    "upscale": 8,
    "restore": 8,
    "colorize": 6,
    "inpaint": 12,
    "clothes": 12,
}

# Background scene presets (mapped to Flux Kontext prompts)
BG_SCENE_PROMPTS = {
    "white":    "pure white seamless studio backdrop, soft even lighting, professional product photography clean and minimal",
    "studio":   "neutral light grey studio backdrop with subtle vertical gradient, soft diffused photographic lighting",
    "black":    "pure deep matte black backdrop, dramatic rim lighting on the subject, cinematic studio mood",
    "gradient": "soft dreamy gradient background blending lavender into peach, ethereal and minimal",
    "beach":    "sunlit tropical beach, turquoise ocean and golden sand, warm golden hour light, slight cinematic blur",
    "neon":     "dark studio with vivid magenta and cyan neon lights, cyberpunk mood, glossy reflections",
    "outdoor":  "soft natural outdoor light with blurred green foliage bokeh background, editorial vibe",
    "minimal":  "minimalist beige seamless backdrop, soft diffused light, editorial premium look",
}


async def _run_tool(tool_key: str, current: dict, runner, *args, **kwargs):
    cost = TOOL_COSTS[tool_key]
    user = await _user_doc(current["sub"])
    if not user or user.get("banned"):
        raise HTTPException(status_code=403, detail="Not allowed")
    if user.get("credits", 0) < cost and current.get("role") != "admin":
        raise HTTPException(status_code=402, detail="Insufficient credits")
    rate_limit.enforce_image(current["sub"], current.get("role", "user"))
    new_balance = await _spend_credits(current["sub"], cost, f"Tool: {tool_key}")
    try:
        urls = await runner(*args, **kwargs)
    except Exception as e:
        logger.error(f"Tool {tool_key} failed: {e}")
        new_balance = await _add_credits(current["sub"], cost, "refund", f"Refund: {tool_key} failed")
        raise HTTPException(status_code=502, detail=f"Tool failed: {str(e)[:200]}")
    if not urls:
        new_balance = await _add_credits(current["sub"], cost, "refund", "Refund: empty output")
        raise HTTPException(status_code=502, detail="Empty output")
    creation = Creation(
        user_id=current["sub"], type="image", model_used=f"tool:{tool_key}",
        prompt=f"[{tool_key}]", result_urls=urls, credits_spent=cost,
    )
    await db.creations.insert_one(creation.model_dump())
    return {"creation": creation.model_dump(), "new_balance": new_balance}


@api.post("/tools/bg-remove")
async def tool_bg_remove(
    photo: UploadFile = File(...),
    bg_mode: str = Form("transparent"),   # transparent | solid | scene | custom
    bg_prompt: str = Form(""),
    scene_key: str = Form(""),
    keep_shadow: bool = Form(False),
    refine_hair: bool = Form(True),
    current=Depends(get_current_user),
):
    path = await save_upload(photo)
    try:
        # Fast path: pure cutout (used for both transparent and solid-color modes —
        # the solid color is composited on the client over the alpha PNG).
        if bg_mode in ("transparent", "solid"):
            return await _run_tool("bg_remove", current, remove_background, path)

        # Scene / custom mode -> Flux Kontext re-renders the background while keeping subject.
        if bg_mode == "scene":
            scene_desc = BG_SCENE_PROMPTS.get(scene_key, BG_SCENE_PROMPTS["white"])
        else:  # custom
            scene_desc = bg_prompt.strip() or "clean professional background"

        shadow_clause = " Keep a soft natural ground shadow under the subject." if keep_shadow else ""
        hair_clause   = " Preserve fine hair strands and translucent edges with perfect cutout precision." if refine_hair else ""
        prompt = (
            "Replace ONLY the background while keeping the subject pixel-perfect identical "
            "(same pose, same outfit, same face, same proportions). "
            f"New background: {scene_desc}. "
            "Match subject lighting and color temperature to the new scene for a photo-real composite."
            f"{shadow_clause}{hair_clause}"
        )
        return await _run_tool("bg_remove_scene", current, kontext_edit, path, prompt)
    finally:
        cleanup(path)


@api.post("/tools/upscale")
async def tool_upscale(
    scale: int = Form(2),
    sharpen: bool = Form(True),
    denoise: bool = Form(True),
    preserve_colors: bool = Form(True),
    photo: UploadFile = File(...),
    current=Depends(get_current_user),
):
    path = await save_upload(photo)
    try:
        return await _run_tool(
            "upscale", current, upscale_image, path,
            max(2, min(scale, 4)), sharpen, denoise, preserve_colors,
        )
    finally:
        cleanup(path)


@api.post("/tools/restore")
async def tool_restore(
    photo: UploadFile = File(...),
    level: str = Form("medio"),
    enhance_faces: bool = Form(True),
    recover_colors: bool = Form(True),
    remove_noise: bool = Form(True),
    sharpen: bool = Form(True),
    custom_prompt: str = Form(""),
    current=Depends(get_current_user),
):
    path = await save_upload(photo)
    try:
        return await _run_tool(
            "restore", current, restore_photo, path,
            level, enhance_faces, recover_colors, remove_noise, sharpen, custom_prompt,
        )
    finally:
        cleanup(path)


@api.post("/tools/colorize")
async def tool_colorize(
    photo: UploadFile = File(...),
    style: str = Form("natural"),
    preserve_skin: bool = Form(True),
    enhance_details: bool = Form(True),
    vibe: str = Form("moderno"),
    custom_prompt: str = Form(""),
    current=Depends(get_current_user),
):
    path = await save_upload(photo)
    try:
        return await _run_tool(
            "colorize", current, colorize_image, path,
            style, preserve_skin, enhance_details, vibe, custom_prompt,
        )
    finally:
        cleanup(path)


@api.post("/tools/inpaint")
async def tool_inpaint(
    prompt: str = Form(...),
    photo: UploadFile = File(...),
    mask: UploadFile = File(...),
    current=Depends(get_current_user),
):
    p = await save_upload(photo)
    m = await save_upload(mask)
    try:
        return await _run_tool("inpaint", current, inpaint_image, p, m, prompt)
    finally:
        cleanup(p); cleanup(m)


@api.post("/tools/clothes")
async def tool_clothes_changer(
    prompt: str = Form(""),
    change_type: str = Form("full"),  # full | piece | color | tryon
    photo: UploadFile = File(...),
    garment: UploadFile | None = File(None),
    aspect_ratio: str = Form("match"),
    current=Depends(get_current_user),
):
    """AI Clothes Changer — powered by Grok Imagine.

    - Photo only + prompt → Grok image-edit with detailed clothing instruction.
    - Photo + garment reference → photos are composed side-by-side and sent to Grok
      with an explicit instruction to dress the person on the left with the outfit on the right.
    """
    p = await save_upload(photo)
    g = await save_upload(garment) if garment else None
    composed_path = None
    cost = TOOL_COSTS["clothes"]
    try:
        user = await _user_doc(current["sub"])
        if not user or user.get("banned"):
            raise HTTPException(status_code=403, detail="Not allowed")
        if user.get("credits", 0) < cost and current.get("role") != "admin":
            raise HTTPException(status_code=402, detail="Insufficient credits")
        rate_limit.enforce_image(current["sub"], current.get("role", "user"))

        if g:
            composed_path = compose_side_by_side(p, g)
            edit_prompt = (
                "The image shows TWO photos side by side: a person on the LEFT and a clothing/outfit reference on the RIGHT. "
                "Output a single photo of ONLY the person from the LEFT, now wearing the outfit shown on the RIGHT. "
                "Preserve the person's identity, face, hair, body proportions and pose. "
                "Match the clothing's style, color, fabric and details precisely. "
                "Discard the garment-side panel and any background from the right photo. "
                "Photorealistic, natural lighting, clean background."
            )
            if prompt.strip():
                edit_prompt += f" Additional notes: {prompt.strip()}."
            run_path = composed_path
        else:
            if not prompt.strip():
                raise HTTPException(status_code=422, detail="Forneça uma foto de roupa OU descreva a mudança no campo de texto.")
            prefix = {
                "full":  "Change the outfit. Replace all clothing with: ",
                "piece": "Add/replace this specific clothing piece: ",
                "color": "Keep the same outfit but change the color/style to: ",
                "tryon": "Show the person wearing: ",
            }.get(change_type, "Change the outfit to: ")
            edit_prompt = (
                prefix + prompt.strip()
                + ". Preserve identity, face, body proportions and pose. Photorealistic, natural lighting."
            )
            run_path = p

        new_balance = await _spend_credits(current["sub"], cost, "Tool: clothes")
        try:
            urls = await generate_image(
                prompt=edit_prompt,
                model_key="standard",          # Grok Imagine
                aspect_ratio=aspect_ratio,
                num_outputs=1,
                image_path=run_path,
            )
        except Exception as e:
            logger.error(f"Clothes changer failed: {e}")
            new_balance = await _add_credits(current["sub"], cost, "refund", f"Refund: clothes failed ({e})")
            raise HTTPException(status_code=502, detail=f"Tool failed: {str(e)[:200]}")
        if not urls:
            new_balance = await _add_credits(current["sub"], cost, "refund", "Refund: empty output")
            raise HTTPException(status_code=502, detail="Empty output")

        creation = Creation(
            user_id=current["sub"], type="image",
            model_used=MODELS["standard"],
            prompt=edit_prompt,
            aspect_ratio=aspect_ratio,
            result_urls=urls, credits_spent=cost,
        )
        await db.creations.insert_one(creation.model_dump())
        return {"creation": creation.model_dump(), "new_balance": new_balance}
    finally:
        cleanup(p)
        if g: cleanup(g)
        if composed_path: cleanup(composed_path)



@api.post("/generate/edit")
async def generate_edit(
    prompt: str = Form(...),
    aspect_ratio: str = Form("1:1"),
    photo: UploadFile = File(...),
    current=Depends(get_current_user),
):
    """Edit a photo with a free-text prompt (no style preset). Returns
    `prediction_id` immediately; client polls /api/predictions/{id}."""
    cost = COSTS.get("pro_base", 12)
    user, safe_prompt, hit = await _pre_generate_checks(current["sub"], current.get("role", "user"), prompt, cost)
    final_prompt = (safe_prompt or prompt.strip()) + ", preserve identity, keep same face, maintain original facial structure"
    photo_path = await save_upload(photo)
    try:
        pending = await _create_pending(
            user_id=current["sub"], cost=cost, type_="image",
            prompt=final_prompt, model_key="standard",
            aspect_ratio=aspect_ratio, num_outputs=1, image_path=photo_path,
            spend_description="Edit photo (free prompt)",
        )
    finally:
        cleanup(photo_path)
    return {
        "prediction_id": pending["id"],
        "status": "processing",
        "new_balance": pending["balance_after_spend"],
    }




@api.post("/generate/easy")
async def generate_easy(
    style_id: str = Form(...),
    subject: str = Form("the person"),
    aspect_ratio: str = Form("4:5"),
    extra_prompt: str = Form(""),
    photo: UploadFile = File(...),
    current=Depends(get_current_user),
):
    """Modo Fácil — PADRAO_STYLES (93 estilos do bot). Returns prediction_id;
    client polls /api/predictions/{id}.
    """
    style = get_padrao(style_id)
    if not style:
        raise HTTPException(status_code=400, detail="Unknown style")
    cost = COSTS.get("fast_base", 10) + COSTS.get("fast_style_extra", 1)
    user, _, _ = await _pre_generate_checks(current["sub"], current.get("role", "user"), None, cost)

    if style.get("locked"):
        prev_purchase = await db.purchases.count_documents({
            "user_id": current["sub"], "status": "completed"
        })
        if prev_purchase < 1 and current.get("role") != "admin":
            raise HTTPException(status_code=402, detail="Premium style — purchase required to unlock")

    subj = subject.strip() or style.get("subject") or "the person"
    raw_prompt = style["prompt"].replace("[subject]", subj)
    if extra_prompt.strip():
        raw_prompt = f"{raw_prompt}\n\n{extra_prompt.strip()}"

    photo_path = await save_upload(photo)
    try:
        pending = await _create_pending(
            user_id=current["sub"], cost=cost, type_="image",
            prompt=raw_prompt, model_key="standard",
            aspect_ratio=aspect_ratio, num_outputs=1, image_path=photo_path,
            style_key=style_id, spend_description=f"Easy ({style_id})",
        )
    finally:
        cleanup(photo_path)
    return {
        "prediction_id": pending["id"],
        "status": "processing",
        "new_balance": pending["balance_after_spend"],
    }


@api.post("/generate/pro")
async def generate_pro(
    preset_id: str = Form(...),
    aspect_ratio: str = Form("4:5"),
    extra_prompt: str = Form(""),
    intensity: int = Form(70),  # 0..100; scales prompt emphasis
    photo: UploadFile = File(...),
    current=Depends(get_current_user),
):
    preset = get_pro_preset(preset_id)
    if not preset:
        raise HTTPException(status_code=400, detail="Unknown preset")
    cost = COSTS["pro"]
    base_prompt = preset["prompt"]
    # Intensity: 0..33 = subtle, 34..66 = balanced, 67..100 = strong
    if intensity < 34:
        prompt = "Apply subtle, restrained version of: " + base_prompt
    elif intensity > 66:
        prompt = "Apply maximum, intense version of: " + base_prompt + " Push every parameter to the strongest tasteful level."
    else:
        prompt = base_prompt
    if extra_prompt.strip():
        prompt = prompt + " ADDITIONAL INSTRUCTIONS FROM USER: " + extra_prompt.strip()
    user, safe_prompt, _ = await _pre_generate_checks(current["sub"], current.get("role", "user"), prompt, cost)
    final = safe_prompt or prompt
    photo_path = await save_upload(photo)
    new_balance = await _spend_credits(current["sub"], cost, f"Pro edit ({preset_id})")
    try:
        urls = await generate_image(
            prompt=final, model_key="pro",
            aspect_ratio=aspect_ratio, num_outputs=1, image_path=photo_path,
        )
    except Exception as e:
        await _add_credits(current["sub"], cost, "refund", f"Refund: pro failed ({e})")
        cleanup(photo_path)
        raise HTTPException(status_code=502, detail=f"Generation failed: {str(e)[:200]}")
    finally:
        cleanup(photo_path)
    if not urls:
        new_balance = await _add_credits(current["sub"], cost, "refund", "Refund: empty output")
        raise HTTPException(status_code=502, detail="Empty output")
    creation = Creation(
        user_id=current["sub"], type="image", model_used=MODELS["pro"],
        prompt=final, style_key=preset_id, aspect_ratio=aspect_ratio,
        result_urls=urls, credits_spent=cost,
    )
    await db.creations.insert_one(creation.model_dump())
    return {"creation": creation.model_dump(), "new_balance": new_balance}


@api.post("/generate/artistic")
async def generate_artistic(
    style_id: str = Form(...),
    extra_prompt: str = Form(""),
    aspect_ratio: str = Form("1:1"),
    photo: UploadFile = File(...),
    current=Depends(get_current_user),
):
    style = get_artistic(style_id)
    if not style:
        raise HTTPException(status_code=400, detail="Unknown style")
    cost = COSTS["artistic"]
    await _pre_generate_checks(current["sub"], current.get("role", "user"), None, cost)
    photo_path = await save_upload(photo)
    prompt = f"{extra_prompt + ', ' if extra_prompt else ''}{style['suffix']}"
    new_balance = await _spend_credits(current["sub"], cost, f"Artistic ({style_id})")
    try:
        urls = await generate_image(
            prompt=prompt, model_key="artistic", aspect_ratio=aspect_ratio,
            num_outputs=1, image_path=photo_path,
        )
    except Exception as e:
        await _add_credits(current["sub"], cost, "refund", f"Refund: artistic failed ({e})")
        cleanup(photo_path)
        raise HTTPException(status_code=502, detail=f"Generation failed: {str(e)[:200]}")
    finally:
        cleanup(photo_path)
    if not urls:
        new_balance = await _add_credits(current["sub"], cost, "refund", "Refund: empty output")
        raise HTTPException(status_code=502, detail="Empty output")
    creation = Creation(
        user_id=current["sub"], type="artistic", model_used=MODELS["artistic"],
        prompt=prompt, style_key=style_id, aspect_ratio=aspect_ratio,
        result_urls=urls, credits_spent=cost,
    )
    await db.creations.insert_one(creation.model_dump())
    return {"creation": creation.model_dump(), "new_balance": new_balance}


@api.post("/generate/video")
async def generate_video_route(
    prompt: str = Form(...),
    aspect_ratio: str = Form("16:9"),
    photo: UploadFile | None = File(None),
    current=Depends(get_current_user),
):
    if len(prompt) < 3:
        raise HTTPException(status_code=400, detail="Prompt too short")
    cost = COSTS["video"]
    user, prompt, _ = await _pre_generate_checks(current["sub"], current.get("role", "user"), prompt, cost)
    photo_path = await save_upload(photo) if photo else None
    new_balance = await _spend_credits(current["sub"], cost, "Video generation")
    try:
        urls = await generate_video(prompt=prompt, image_path=photo_path, aspect_ratio=aspect_ratio)
    except Exception as e:
        await _add_credits(current["sub"], cost, "refund", f"Refund: video failed ({e})")
        if photo_path: cleanup(photo_path)
        raise HTTPException(status_code=502, detail=f"Video failed: {str(e)[:200]}")
    finally:
        if photo_path: cleanup(photo_path)
    if not urls:
        new_balance = await _add_credits(current["sub"], cost, "refund", "Refund: empty video")
        raise HTTPException(status_code=502, detail="Empty output")
    creation = Creation(
        user_id=current["sub"], type="video", model_used=MODELS["video"],
        prompt=prompt, aspect_ratio=aspect_ratio,
        result_urls=urls, credits_spent=cost,
    )
    await db.creations.insert_one(creation.model_dump())
    return {"creation": creation.model_dump(), "new_balance": new_balance}


class PosterIn(BaseModel):
    template_id: str
    placeholders: dict = {}
    model_key: str = "grok"          # grok | flux2 | gpt_image
    aspect_ratio: str = ""           # optional override (e.g. "1:1", "4:5", "9:16", "16:9")
    num_outputs: int = 1             # 1..4 variations
    mood: str = ""                   # mood / style hint
    color_hint: str = ""             # dominant color hex


# Poster model pricing (per image generated)
POSTER_MODEL_COSTS = {
    "grok":      15,
    "flux2":     18,
    "gpt_image": 25,
}


def _poster_model_to_replicate_key(model_key: str) -> str:
    """Map UI model_key to replicate_service MODELS key."""
    if model_key == "flux2":
        return "pro"
    return "standard"  # grok


@api.post("/generate/poster")
async def generate_poster_route(
    request: Request,
    current=Depends(get_current_user),
):
    """Accepts both JSON and multipart (with optional photo).
    - With photo → uses Replicate (Grok or Flux2) image-in-image with the poster prompt.
    - Without photo → can use OpenAI gpt-image-1 OR Replicate Grok/Flux2.
    """
    ct = (request.headers.get("content-type") or "").lower()
    photo_path = None
    if "multipart/form-data" in ct:
        form = await request.form()
        template_id = form.get("template_id", "")
        try:
            placeholders = json.loads(form.get("placeholders", "{}"))
        except Exception:
            placeholders = {}
        model_key = (form.get("model_key") or "grok").strip()
        aspect_ratio = (form.get("aspect_ratio") or "").strip()
        try:
            num_outputs = int(form.get("num_outputs") or 1)
        except Exception:
            num_outputs = 1
        mood = (form.get("mood") or "").strip()
        color_hint = (form.get("color_hint") or "").strip()
        upload = form.get("photo")
        if upload is not None and hasattr(upload, "filename"):
            photo_path = await save_upload(upload)
    else:
        payload = await request.json()
        template_id = payload.get("template_id", "")
        placeholders = payload.get("placeholders", {}) or {}
        model_key = (payload.get("model_key") or "grok").strip()
        aspect_ratio = (payload.get("aspect_ratio") or "").strip()
        try:
            num_outputs = int(payload.get("num_outputs") or 1)
        except Exception:
            num_outputs = 1
        mood = (payload.get("mood") or "").strip()
        color_hint = (payload.get("color_hint") or "").strip()

    num_outputs = max(1, min(num_outputs, 4))

    tpl = get_poster(template_id)
    if not tpl:
        if photo_path: cleanup(photo_path)
        raise HTTPException(status_code=400, detail="Unknown template")
    missing = [
        p for p in tpl["placeholders"]
        if p not in (tpl.get("optional") or [])
        and not (placeholders.get(p) or "").strip()
    ]
    if missing:
        if photo_path: cleanup(photo_path)
        raise HTTPException(status_code=422, detail=f"Missing placeholders: {', '.join(missing)}")

    # Force a Replicate model when photo is provided (gpt-image-1 has no img-to-img)
    if photo_path and model_key == "gpt_image":
        model_key = "flux2"

    if model_key not in POSTER_MODEL_COSTS:
        if photo_path: cleanup(photo_path)
        raise HTTPException(status_code=400, detail="Unknown model")

    per_image_cost = POSTER_MODEL_COSTS[model_key]
    total_cost = per_image_cost * num_outputs

    # Build prompt:
    #  1) Start with the bot prompt verbatim
    #  2) Apply replacements (flyer fields override hard-coded strings)
    #  3) Append optional extra_text for aesthetic templates
    #  4) Last resort: legacy {placeholder} .format() — no-op when no braces
    raw_prompt = tpl["prompt"]
    for field, original in (tpl.get("replacements") or {}).items():
        user_value = (placeholders.get(field) or "").strip()
        if user_value:
            raw_prompt = raw_prompt.replace(original, user_value)
    appends_field = tpl.get("appends")
    if appends_field:
        appended = (placeholders.get(appends_field) or "").strip()
        if appended:
            raw_prompt = f"{raw_prompt} {appended}"
    if "{" in raw_prompt and "}" in raw_prompt:
        try:
            raw_prompt = raw_prompt.format(**{k: placeholders.get(k, "") for k in tpl["placeholders"]})
        except KeyError:
            pass    # Build extras: expand mood UI choice to a rich visual descriptor; add color hint.
    extras = []
    if mood:
        mood_desc = MOOD_EXPANSIONS.get(mood, f"Visual mood: {mood}.")
        extras.append(mood_desc)
    if color_hint:
        extras.append(
            f"Anchor the dominant color palette around {color_hint} — use it as the primary "
            "accent hue across backgrounds, typographic highlights and graphic blocks."
        )
    # Universal art-direction prefix first, then the template prompt, then the user extras.
    raw_prompt = POSTER_DIRECTOR + raw_prompt
    if extras:
        raw_prompt = f"{raw_prompt} {' '.join(extras)}"

    user, safe_prompt, _ = await _pre_generate_checks(current["sub"], current.get("role", "user"), raw_prompt, total_cost)
    prompt = safe_prompt or raw_prompt
    logger.info(f"[POSTER] template={template_id} model={model_key} num={num_outputs} final_prompt={prompt!r}")
    new_balance = await _spend_credits(current["sub"], total_cost, f"Poster ({template_id} · {model_key} · x{num_outputs})")

    try:
        urls: list[str] = []
        if model_key == "gpt_image":
            # OpenAI gpt-image-1 — one-shot per call; loop for variations
            for _ in range(num_outputs):
                url = await generate_poster_image(prompt)
                if url:
                    urls.append(url)
            if not urls:
                raise RuntimeError("Empty image from OpenAI")
            model_label = "openai/gpt-image-1"
        else:
            rk = _poster_model_to_replicate_key(model_key)
            ar = aspect_ratio or "4:5"
            poster_prompt = prompt
            if photo_path:
                poster_prompt += " Maintain the subject identity and likeness from the reference image."
            batch = await generate_image(
                prompt=poster_prompt,
                model_key=rk, aspect_ratio=ar, num_outputs=num_outputs,
                image_path=photo_path,
            )
            urls = batch or []
            if not urls:
                raise RuntimeError("Empty image from Replicate")
            model_label = MODELS[rk]
    except Exception as e:
        await _add_credits(current["sub"], total_cost, "refund", f"Refund: poster failed ({e})")
        if photo_path: cleanup(photo_path)
        raise HTTPException(status_code=502, detail=f"Poster failed: {str(e)[:200]}")
    if photo_path:
        cleanup(photo_path)
    creation = Creation(
        user_id=current["sub"], type="poster",
        model_used=model_label,
        prompt=prompt, style_key=template_id, aspect_ratio=(aspect_ratio or "4:5"),
        result_urls=urls, credits_spent=total_cost,
    )
    await db.creations.insert_one(creation.model_dump())
    return {"creation": creation.model_dump(), "new_balance": new_balance}


@api.get("/public/poster-models")
async def public_poster_models():
    """Public list of available poster generation models with their costs."""
    return {
        "models": [
            {"key": "grok",      "label": "Grok Imagine",  "cost": POSTER_MODEL_COSTS["grok"],      "tier": "fast",    "supports_photo": True,  "tag": "Padrão · rápido"},
            {"key": "flux2",     "label": "Flux 2",        "cost": POSTER_MODEL_COSTS["flux2"],     "tier": "pro",     "supports_photo": True,  "tag": "Foto-realista"},
            {"key": "gpt_image", "label": "GPT Image 1",   "cost": POSTER_MODEL_COSTS["gpt_image"], "tier": "premium", "supports_photo": False, "tag": "Qualidade Máxima"},
        ],
    }


class CarouselIn(BaseModel):
    slides: list[str]  # list of prompts (2-10)
    style_suffix: str = ""
    aspect_ratio: str = "4:5"
    keep_character: bool = True
    keep_lighting: bool = True
    keep_palette: bool = True
    smooth_transitions: bool = True


def _build_continuity_clause(keep_character: bool, keep_lighting: bool, keep_palette: bool, smooth_transitions: bool, slide_idx: int, total: int) -> str:
    parts = []
    if keep_character:
        parts.append("the SAME main subject/character, identical face and outfit as the rest of the series")
    if keep_lighting:
        parts.append("the SAME lighting setup, time of day and shadow direction")
    if keep_palette:
        parts.append("the SAME color palette and grading across all slides")
    if smooth_transitions and total > 1:
        parts.append("a smooth visual continuity from the previous slide, like a magazine editorial sequence")
    if not parts:
        return ""
    return f"Preserve {', '.join(parts)}. This is slide {slide_idx + 1} of {total} in a coherent Instagram carousel series."


@api.post("/generate/carousel")
async def generate_carousel(
    request: Request,
    current=Depends(get_current_user),
):
    """Generate a connected Instagram carousel (2–10 slides).
    Accepts JSON or multipart (with optional reference photo for identity preservation).
    Models: grok (Grok Imagine, default) or gpt_image (OpenAI gpt-image-1, no photo support).
    """
    ct = (request.headers.get("content-type") or "").lower()
    photo_path = None
    if "multipart/form-data" in ct:
        form = await request.form()
        try:
            slides = json.loads(form.get("slides", "[]"))
        except Exception:
            slides = []
        style_suffix = (form.get("style_suffix") or "").strip()
        aspect_ratio = (form.get("aspect_ratio") or "4:5").strip()
        keep_character = (form.get("keep_character") or "true").lower() == "true"
        keep_lighting = (form.get("keep_lighting") or "true").lower() == "true"
        keep_palette = (form.get("keep_palette") or "true").lower() == "true"
        smooth_transitions = (form.get("smooth_transitions") or "true").lower() == "true"
        model_key = (form.get("model_key") or "grok").strip()
        upload = form.get("photo")
        if upload is not None and hasattr(upload, "filename"):
            photo_path = await save_upload(upload)
    else:
        payload = await request.json()
        slides = payload.get("slides", []) or []
        style_suffix = (payload.get("style_suffix") or "").strip()
        aspect_ratio = (payload.get("aspect_ratio") or "4:5").strip()
        keep_character = bool(payload.get("keep_character", True))
        keep_lighting = bool(payload.get("keep_lighting", True))
        keep_palette = bool(payload.get("keep_palette", True))
        smooth_transitions = bool(payload.get("smooth_transitions", True))
        model_key = (payload.get("model_key") or "grok").strip()

    slides = [s.strip() for s in slides if isinstance(s, str) and s.strip()]
    if not (2 <= len(slides) <= 10):
        if photo_path: cleanup(photo_path)
        raise HTTPException(status_code=400, detail="Carousel requires 2 to 10 slides")

    # gpt_image has no img-to-img: auto-fallback to grok if photo provided
    if photo_path and model_key == "gpt_image":
        model_key = "grok"

    CAROUSEL_COSTS = {"grok": 8, "gpt_image": 18}
    if model_key not in CAROUSEL_COSTS:
        if photo_path: cleanup(photo_path)
        raise HTTPException(status_code=400, detail="Unknown model")
    cost_per_slide = CAROUSEL_COSTS[model_key]
    cost = cost_per_slide * len(slides)
    await _pre_generate_checks(current["sub"], current.get("role", "user"), " ".join(slides), cost)
    new_balance = await _spend_credits(current["sub"], cost, f"Carousel ({len(slides)} slides · {model_key})")

    model_label = "openai/gpt-image-1" if model_key == "gpt_image" else MODELS["standard"]
    all_urls: list[str] = []
    total = len(slides)
    try:
        for i, slide_prompt in enumerate(slides):
            continuity = _build_continuity_clause(keep_character, keep_lighting, keep_palette, smooth_transitions, i, total)
            composed = ". ".join(x for x in [slide_prompt, style_suffix, continuity] if x).strip(". ")
            if model_key == "gpt_image":
                url = await generate_poster_image(composed)
                if url:
                    all_urls.append(url)
            else:
                # Grok — single img2img or text-only
                urls = await generate_image(
                    prompt=composed,
                    model_key="standard", aspect_ratio=aspect_ratio, num_outputs=1,
                    image_path=photo_path,
                )
                if urls:
                    all_urls.extend(urls[:1])
    except Exception as e:
        await _add_credits(current["sub"], cost, "refund", f"Refund: carousel failed ({e})")
        if photo_path: cleanup(photo_path)
        raise HTTPException(status_code=502, detail=f"Carousel failed: {str(e)[:200]}")
    finally:
        if photo_path:
            cleanup(photo_path)

    if not all_urls:
        new_balance = await _add_credits(current["sub"], cost, "refund", "Refund: empty carousel")
        raise HTTPException(status_code=502, detail="Empty output")
    creation = Creation(
        user_id=current["sub"], type="carousel", model_used=model_label,
        prompt=" | ".join(slides), aspect_ratio=aspect_ratio,
        result_urls=all_urls, credits_spent=cost,
    )
    await db.creations.insert_one(creation.model_dump())
    return {"creation": creation.model_dump(), "new_balance": new_balance}


# ============== Wizard / Suggest / Settings ==============
class WizardIn(BaseModel):
    answers: dict
    lang: str = "pt"


# Mapping from numeric choice → semantic key, per bot.py wizard
_WIZ_MAP = {
    "q1": {  # what to create — EXPANDED to match richer frontend list
        "1":  "flyer / professional poster",
        "2":  "logo / visual identity",
        "3":  "concept art / illustration",
        "4":  "character (anime / realistic / cartoon)",
        "5":  "landscape / scenery",
        "6":  "product photography / mockup",
        "7":  "realistic portrait / professional headshot",
        "8":  "social media post (Instagram / TikTok)",
        "9":  "album cover / music artwork",
        "10": "book cover",
        "11": "fashion editorial",
        "12": "food / restaurant photography",
        "13": "interior design / architecture render",
        "14": "advertising campaign visual",
        "15": "movie / TV show key art",
        "16": "fantasy / sci-fi scene",
        "17": "pet / animal portrait",
        "18": "vehicle / automotive shot",
        "19": "abstract / conceptual artwork",
        "20": "other",
    },
    "q2": {  # visual style
        "1":  "anime / japanese manga style",
        "2":  "realistic / photographic",
        "3":  "artistic / digital painting",
        "4":  "3D render (Pixar / Disney style)",
        "5":  "sketch / hand drawn",
        "6":  "minimalist / flat design",
        "7":  "cyberpunk / futuristic neon",
        "8":  "vintage / retro 70s-80s",
        "9":  "watercolor",
        "10": "oil painting",
        "11": "comic book / graphic novel",
        "12": "low-poly geometric",
        "13": "vaporwave / Y2K",
        "14": "brutalist editorial",
        "15": "luxury / high-fashion editorial",
        "16": "documentary / film still",
    },
    "q3": {  # aspect ratio
        "1": "3:4",
        "2": "1:1",
        "3": "16:9",
        "4": "9:16",
        "5": "4:5",
        "6": "21:9",
    },
}


def _normalize_wizard_answers(raw: dict) -> dict:
    out = {}
    for k, v in raw.items():
        s = str(v).strip()
        if not s:
            continue
        mapped = _WIZ_MAP.get(k, {}).get(s)
        out[k] = mapped or s
    return out


@api.post("/wizard/compose")
async def wizard_compose_route(payload: WizardIn, current=Depends(get_current_user)):
    rate_limit.enforce_message(current["sub"], current.get("role", "user"))
    answers = _normalize_wizard_answers(payload.answers)
    text = await wizard_compose(answers)
    return {"prompt": text, "answers_resolved": answers}


class SuggestIn(BaseModel):
    theme: str
    lang: str = "pt"


@api.post("/suggest")
async def suggest_route(payload: SuggestIn, current=Depends(get_current_user)):
    rate_limit.enforce_message(current["sub"], current.get("role", "user"))
    if len(payload.theme.strip()) < 2:
        raise HTTPException(status_code=400, detail="Theme too short")
    items = await suggest_prompts(payload.theme.strip(), payload.lang)
    return {"prompts": items}


class SettingsIn(BaseModel):
    aspect_ratio_default: str | None = None
    visual_style_default: str | None = None
    num_variations_default: int | None = None
    personality: str | None = None
    lang: str | None = None
    quality: str | None = None         # "fast" | "balanced" | "high"
    generation_mode: str | None = None # "creative" | "balanced" | "realistic"
    notifications: bool | None = None


@api.get("/settings")
async def get_settings(current=Depends(get_current_user)):
    s = await db.user_settings.find_one({"user_id": current["sub"]}, {"_id": 0}) or {}
    return {
        "aspect_ratio_default": s.get("aspect_ratio_default", "1:1"),
        "visual_style_default": s.get("visual_style_default", "free"),
        "num_variations_default": s.get("num_variations_default", 1),
        "personality": s.get("personality", "creative"),
        "lang": s.get("lang", "pt"),
        "quality": s.get("quality", "balanced"),
        "generation_mode": s.get("generation_mode", "balanced"),
        "notifications": s.get("notifications", True),
    }


@api.put("/settings")
async def update_settings(payload: SettingsIn, current=Depends(get_current_user)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    update["user_id"] = current["sub"]
    await db.user_settings.update_one(
        {"user_id": current["sub"]}, {"$set": update}, upsert=True,
    )
    if "lang" in update:
        await db.users.update_one({"id": current["sub"]}, {"$set": {"lang": update["lang"]}})
    return {"ok": True}


@api.get("/me/referrals/stats")
async def referral_stats(current=Depends(get_current_user)):
    """Stats for the referral / sharing page."""
    user = await _user_doc(current["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    referred_count = await db.users.count_documents({"referred_by": user["id"]})
    earned = await db.credit_transactions.aggregate([
        {"$match": {"user_id": user["id"], "type": "referral"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]).to_list(1)
    total_earned = (earned[0]["total"] if earned else 0)
    return {
        "code": user.get("referral_code"),
        "referred_count": referred_count,
        "credits_earned": total_earned,
        "reward_per_referral": 30,
    }


@api.post("/me/toggle-public/{creation_id}")
async def toggle_public(creation_id: str, current=Depends(get_current_user)):
    """Toggle a creation's visibility in /explore."""
    doc = await db.creations.find_one({"id": creation_id, "user_id": current["sub"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Creation not found")
    new_val = not doc.get("is_public", False)
    await db.creations.update_one({"id": creation_id}, {"$set": {"is_public": new_val}})
    return {"is_public": new_val}


# ============== Stripe ==============
@api.post("/stripe/checkout")
async def stripe_checkout(payload: CheckoutIn, current=Depends(get_current_user)):
    user = await _user_doc(current["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    success_url = f"{APP_PUBLIC_URL}/app/billing"
    cancel_url = f"{APP_PUBLIC_URL}/app/billing"
    try:
        data = create_checkout_session(
            user_id=current["sub"], package=payload.package,
            success_url=success_url, cancel_url=cancel_url,
            customer_email=user["email"],
        )
    except Exception as e:
        logger.error(f"Stripe checkout failed: {e}")
        raise HTTPException(status_code=502, detail="Stripe checkout failed")
    # Record pending purchase
    await db.purchases.insert_one({
        "id": secrets.token_hex(8),
        "user_id": current["sub"],
        "stripe_session_id": data["session_id"],
        "package": payload.package,
        "amount_eur": data["amount_eur"],
        "credits": data["credits"],
        "status": "pending",
        "created_at": _now(),
    })
    return {"checkout_url": data["url"], "session_id": data["session_id"]}


@app.post("/api/webhooks/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None, alias="stripe-signature")):
    body = await request.body()
    try:
        event = verify_webhook(body, stripe_signature or "")
    except Exception as e:
        logger.error(f"Stripe webhook signature failed: {e}")
        return JSONResponse({"error": "invalid signature"}, status_code=400)

    etype = event.get("type") if isinstance(event, dict) else event["type"]
    obj = (event.get("data", {}) or {}).get("object", {}) if isinstance(event, dict) else event["data"]["object"]

    if etype == "checkout.session.completed":
        metadata = obj.get("metadata") or {}
        user_id = metadata.get("user_id")
        credits = int(metadata.get("credits", 0))
        package = metadata.get("package", "unknown")
        session_id = obj.get("id", "")
        if user_id and credits > 0:
            # Update purchase
            await db.purchases.update_one(
                {"stripe_session_id": session_id},
                {"$set": {"status": "completed"}},
            )
            # Credit user
            await _add_credits(
                user_id, credits, "purchase",
                f"Stripe purchase ({package})",
                metadata={"session_id": session_id, "package": package},
            )
            # Referral bonus if first paid purchase
            user = await db.users.find_one({"id": user_id}, {"_id": 0})
            if user and user.get("referred_by"):
                # Check if this user has previous completed purchases (besides this one)
                prev = await db.purchases.count_documents({
                    "user_id": user_id, "status": "completed",
                })
                if prev <= 1 and (obj.get("amount_total") or 0) >= 500:
                    await _add_credits(
                        user["referred_by"], 10, "referral",
                        f"Referral bonus for {user_id}",
                        metadata={"referred_user": user_id},
                    )

    elif etype == "charge.refunded":
        # Look up purchase by payment_intent if possible
        pi = obj.get("payment_intent")
        if pi:
            session = None
            try:
                import stripe as _stripe
                sessions = _stripe.checkout.Session.list(payment_intent=pi, limit=1)
                if sessions.data:
                    session = sessions.data[0]
            except Exception:
                pass
            if session and session.get("metadata"):
                meta = session["metadata"]
                user_id = meta.get("user_id")
                credits = int(meta.get("credits", 0))
                if user_id and credits:
                    await _add_credits(user_id, -credits, "refund", "Stripe refund")
                    await db.purchases.update_one(
                        {"stripe_session_id": session["id"]},
                        {"$set": {"status": "refunded"}},
                    )

    return {"received": True}


# ============== Admin ==============
@api.get("/admin/stats")
async def admin_stats(_=Depends(require_admin)):
    users = await db.users.count_documents({})
    creations = await db.creations.count_documents({})
    purchases_done = await db.purchases.count_documents({"status": "completed"})
    # sum total revenue
    pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_eur"}}},
    ]
    rev = await db.purchases.aggregate(pipeline).to_list(length=1)
    revenue = rev[0]["total"] if rev else 0.0
    # circulation
    cred_pipeline = [{"$group": {"_id": None, "total": {"$sum": "$credits"}}}]
    cred = await db.users.aggregate(cred_pipeline).to_list(length=1)
    credits_in_circulation = cred[0]["total"] if cred else 0
    return {
        "users": users, "creations": creations,
        "purchases": purchases_done, "revenue_eur": revenue,
        "credits_in_circulation": credits_in_circulation,
    }


@api.get("/admin/users")
async def admin_users(limit: int = 50, search: Optional[str] = None, _=Depends(require_admin)):
    q = {}
    if search:
        q = {"$or": [{"email": {"$regex": search, "$options": "i"}}, {"name": {"$regex": search, "$options": "i"}}]}
    docs = await db.users.find(q, {"_id": 0, "password_hash": 0}).sort("created_at", -1).limit(limit).to_list(length=limit)
    return {"users": docs}


@api.post("/admin/credits/adjust")
async def admin_adjust(payload: AdminCreditAdjustIn, _=Depends(require_admin)):
    new_balance = await _add_credits(payload.user_id, payload.amount, "admin", payload.reason)
    return {"new_balance": new_balance}


@api.patch("/admin/users/{user_id}")
async def admin_patch_user(user_id: str, payload: AdminUserPatch, _=Depends(require_admin)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update:
        return {"ok": True}
    res = await db.users.update_one({"id": user_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    doc = await _user_doc(user_id)
    return {"user": _public_user(doc)}


@api.get("/admin/transactions")
async def admin_tx(limit: int = 100, _=Depends(require_admin)):
    docs = await db.credit_transactions.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(length=limit)
    return {"transactions": docs}


# Mount router
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=False,  # We use Bearer tokens, not cookies — credentials not needed.
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)


@app.on_event("startup")
async def startup():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.users.create_index("referral_code")
    await db.creations.create_index([("user_id", 1), ("created_at", -1)])
    await db.credit_transactions.create_index([("user_id", 1), ("created_at", -1)])
    await db.purchases.create_index("stripe_session_id", unique=True)
    logger.info("Remake Pixel API ready")
