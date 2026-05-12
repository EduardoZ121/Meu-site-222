"""Remake Pixel — FastAPI server."""
import os
import logging
import secrets
from datetime import datetime, timezone
from typing import Optional, List
from pathlib import Path

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

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
from services.replicate_service import generate_image, MODELS, COSTS  # noqa: E402
from services.openai_service import improve_prompt as ai_improve_prompt  # noqa: E402
from services.stripe_service import create_checkout_session, verify_webhook, PACKAGES  # noqa: E402
from fast_styles import FAST_STYLES, get_style  # noqa: E402

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
        "credits": 50,  # signup bonus
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
        user_id=user_id, amount=50, type="free", description="Signup bonus",
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
