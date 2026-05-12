"""Remake Pixel — FastAPI server."""
import os
import logging
import secrets
from datetime import datetime, timezone
from typing import Optional, List
from pathlib import Path

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header, UploadFile, File, Form
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
from services.openai_service import (  # noqa: E402
    improve_prompt as ai_improve_prompt,
    rewrite_safe, suggest_prompts, wizard_compose, generate_poster_image, WIZARD_STEPS,
)
from services.uploads import save_upload, cleanup  # noqa: E402
from services import rate_limit, nsfw  # noqa: E402
from fast_styles import FAST_STYLES, get_style  # noqa: E402
from artistic_styles import ARTISTIC_STYLES, get_artistic  # noqa: E402
from pro_presets import PRO_PRESETS, get_pro_preset  # noqa: E402
from poster_templates import POSTER_TEMPLATES, get_poster  # noqa: E402
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
    return {"styles": ARTISTIC_STYLES}


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
        # Fast: photo + style preset, but we still allow text-only fast
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

    # Optionally improve prompt with gpt-4o-mini
    prompt_improved = None
    if payload.improve_prompt:
        prompt_improved = await ai_improve_prompt(prompt)

    # Spend credits BEFORE generation; refund on failure
    new_balance = await _spend_credits(current["sub"], cost, f"Generate image ({model_key})")

    try:
        urls = await generate_image(
            prompt=prompt_improved or prompt,
            model_key=model_key,
            aspect_ratio=payload.aspect_ratio,
            num_outputs=payload.num_outputs,
        )
    except Exception as e:
        # Refund on failure
        logger.error(f"Generation failed: {e}")
        new_balance = await _add_credits(current["sub"], cost, "refund", f"Refund: generation failed ({e})")
        raise HTTPException(status_code=502, detail=f"Generation failed: {str(e)[:200]}")

    if not urls:
        new_balance = await _add_credits(current["sub"], cost, "refund", "Refund: empty output")
        raise HTTPException(status_code=502, detail="Generation returned no images")

    creation = Creation(
        user_id=current["sub"], type="image", model_used=MODELS[model_key],
        prompt=prompt, prompt_improved=prompt_improved,
        style_key=payload.style_key, aspect_ratio=payload.aspect_ratio,
        result_urls=urls, credits_spent=cost,
    )
    await db.creations.insert_one(creation.model_dump())

    return {"creation": creation.model_dump(), "new_balance": new_balance}


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


@api.post("/generate/easy")
async def generate_easy(
    style_id: str = Form(...),
    subject: str = Form("the person"),  # "the man" | "the woman" | "the person"
    aspect_ratio: str = Form("4:5"),
    extra_prompt: str = Form(""),
    photo: UploadFile = File(...),
    current=Depends(get_current_user),
):
    """Modo Fácil — PADRAO_STYLES do bot (≈65 estilos com prompts escritos à mão).
    O utilizador envia foto + escolhe estilo; o prompt do estilo é aplicado tal-qual,
    substituindo o placeholder [subject].
    """
    style = get_padrao(style_id)
    if not style:
        raise HTTPException(status_code=400, detail="Unknown style")
    cost = COSTS.get("fast_base", 10) + COSTS.get("fast_style_extra", 1)
    user, _, _ = await _pre_generate_checks(current["sub"], current.get("role", "user"), None, cost)

    # Locked premium styles require any past purchase
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
    new_balance = await _spend_credits(current["sub"], cost, f"Easy ({style_id})")
    try:
        urls = await generate_image(
            prompt=raw_prompt, model_key="pro",  # uses Flux for image-in-image fidelity
            aspect_ratio=aspect_ratio, num_outputs=1, image_path=photo_path,
        )
    except Exception as e:
        await _add_credits(current["sub"], cost, "refund", f"Refund: easy failed ({e})")
        cleanup(photo_path)
        raise HTTPException(status_code=502, detail=f"Generation failed: {str(e)[:200]}")
    finally:
        cleanup(photo_path)
    if not urls:
        new_balance = await _add_credits(current["sub"], cost, "refund", "Refund: empty output")
        raise HTTPException(status_code=502, detail="Empty output")
    creation = Creation(
        user_id=current["sub"], type="image", model_used=MODELS["pro"],
        prompt=raw_prompt, style_key=style_id, aspect_ratio=aspect_ratio,
        result_urls=urls, credits_spent=cost,
    )
    await db.creations.insert_one(creation.model_dump())
    return {"creation": creation.model_dump(), "new_balance": new_balance}


@api.post("/generate/pro")
async def generate_pro(
    preset_id: str = Form(...),
    aspect_ratio: str = Form("4:5"),
    photo: UploadFile = File(...),
    current=Depends(get_current_user),
):
    preset = get_pro_preset(preset_id)
    if not preset:
        raise HTTPException(status_code=400, detail="Unknown preset")
    cost = COSTS["pro"]
    user, _, _ = await _pre_generate_checks(current["sub"], current.get("role", "user"), None, cost)
    photo_path = await save_upload(photo)
    new_balance = await _spend_credits(current["sub"], cost, f"Pro edit ({preset_id})")
    try:
        urls = await generate_image(
            prompt=preset["prompt"], model_key="pro",
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
        prompt=preset["prompt"], style_key=preset_id, aspect_ratio=aspect_ratio,
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


@api.post("/generate/poster")
async def generate_poster_route(payload: PosterIn, current=Depends(get_current_user)):
    tpl = get_poster(payload.template_id)
    if not tpl:
        raise HTTPException(status_code=400, detail="Unknown template")
    # Validate every required placeholder is filled with non-empty text
    missing = [p for p in tpl["placeholders"] if not (payload.placeholders.get(p) or "").strip()]
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing placeholders: {', '.join(missing)}")
    cost = COSTS["poster"]
    # Run NSFW rewrite over the composed prompt (including user placeholder text)
    raw_prompt = tpl["prompt"].format(**{k: payload.placeholders[k] for k in tpl["placeholders"]})
    user, safe_prompt, _ = await _pre_generate_checks(current["sub"], current.get("role", "user"), raw_prompt, cost)
    prompt = safe_prompt or raw_prompt
    new_balance = await _spend_credits(current["sub"], cost, f"Poster ({payload.template_id})")
    try:
        url = await generate_poster_image(prompt)
        if not url:
            raise RuntimeError("Empty image from OpenAI")
        urls = [url]
    except Exception as e:
        await _add_credits(current["sub"], cost, "refund", f"Refund: poster failed ({e})")
        raise HTTPException(status_code=502, detail=f"Poster failed: {str(e)[:200]}")
    creation = Creation(
        user_id=current["sub"], type="poster", model_used="openai/gpt-image-1",
        prompt=prompt, style_key=payload.template_id, aspect_ratio="4:5",
        result_urls=urls, credits_spent=cost,
    )
    await db.creations.insert_one(creation.model_dump())
    return {"creation": creation.model_dump(), "new_balance": new_balance}


class CarouselIn(BaseModel):
    slides: list[str]  # list of prompts (2-5)
    style_suffix: str = ""
    aspect_ratio: str = "4:5"


@api.post("/generate/carousel")
async def generate_carousel(payload: CarouselIn, current=Depends(get_current_user)):
    if not (2 <= len(payload.slides) <= 5):
        raise HTTPException(status_code=400, detail="Carousel requires 2-5 slides")
    cost = COSTS["carousel_per_slide"] * len(payload.slides)
    await _pre_generate_checks(current["sub"], current.get("role", "user"), " ".join(payload.slides), cost)
    new_balance = await _spend_credits(current["sub"], cost, f"Carousel ({len(payload.slides)} slides)")
    all_urls: list[str] = []
    try:
        for slide_prompt in payload.slides:
            urls = await generate_image(
                prompt=f"{slide_prompt}, {payload.style_suffix}".strip(", "),
                model_key="standard", aspect_ratio=payload.aspect_ratio, num_outputs=1,
            )
            if urls:
                all_urls.extend(urls[:1])
    except Exception as e:
        await _add_credits(current["sub"], cost, "refund", f"Refund: carousel failed ({e})")
        raise HTTPException(status_code=502, detail=f"Carousel failed: {str(e)[:200]}")
    if not all_urls:
        new_balance = await _add_credits(current["sub"], cost, "refund", "Refund: empty carousel")
        raise HTTPException(status_code=502, detail="Empty output")
    creation = Creation(
        user_id=current["sub"], type="carousel", model_used=MODELS["standard"],
        prompt=" | ".join(payload.slides), aspect_ratio=payload.aspect_ratio,
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
    "q1": {  # what to create
        "1": "flyer/professional poster",
        "2": "logo / visual identity",
        "3": "concept art / illustration",
        "4": "character (anime/realistic/cartoon)",
        "5": "landscape / scenery",
        "6": "product / mockup",
        "7": "realistic portrait / photo",
        "8": "other",
    },
    "q2": {  # visual style
        "1": "anime / japanese manga style",
        "2": "realistic / photographic",
        "3": "artistic / digital painting",
        "4": "3D render (Pixar style)",
        "5": "sketch / hand drawn",
        "6": "minimalist / flat design",
        "7": "cyberpunk / futuristic",
        "8": "vintage / retro",
    },
    "q3": {  # aspect ratio
        "1": "3:4",
        "2": "1:1",
        "3": "16:9",
        "4": "9:16",
        "5": "4:5",
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


@api.get("/settings")
async def get_settings(current=Depends(get_current_user)):
    s = await db.user_settings.find_one({"user_id": current["sub"]}, {"_id": 0}) or {}
    return {
        "aspect_ratio_default": s.get("aspect_ratio_default", "1:1"),
        "visual_style_default": s.get("visual_style_default", "free"),
        "num_variations_default": s.get("num_variations_default", 1),
        "personality": s.get("personality", "creative"),
        "lang": s.get("lang", "pt"),
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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
