"""Pydantic models for Remake Pixel."""
from datetime import datetime, timezone
from typing import List, Optional, Literal
from pydantic import BaseModel, EmailStr, Field, ConfigDict
import uuid


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ============== AUTH ==============
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)
    name: Optional[str] = None
    referral_code: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Literal["user", "admin"] = "user"
    lang: str = "pt"
    credits: int = 0
    referral_code: Optional[str] = None
    created_at: str


class AuthResponse(BaseModel):
    token: str
    user: UserPublic


# ============== GENERATION ==============
class GenerateImageIn(BaseModel):
    prompt: str = Field(min_length=3, max_length=800)
    mode: Literal["fast", "advanced"] = "advanced"
    aspect_ratio: str = "1:1"
    num_outputs: int = Field(default=1, ge=1, le=4)
    style_key: Optional[str] = None  # for fast mode
    improve_prompt: bool = False


class Creation(BaseModel):
    id: str = Field(default_factory=_uuid)
    user_id: str
    type: Literal["image", "video", "carousel", "poster", "artistic"] = "image"
    model_used: str
    prompt: str
    prompt_improved: Optional[str] = None
    style_key: Optional[str] = None
    aspect_ratio: str = "1:1"
    result_urls: List[str] = []
    credits_spent: int = 0
    is_favorite: bool = False
    is_public: bool = False
    created_at: str = Field(default_factory=_now)


class GenerationResult(BaseModel):
    creation: Creation
    new_balance: int


# ============== CREDITS ==============
class CreditTransaction(BaseModel):
    id: str = Field(default_factory=_uuid)
    user_id: str
    amount: int  # +credit / -spend
    type: Literal["purchase", "spend", "referral", "admin", "free", "refund"]
    description: str = ""
    metadata: dict = {}
    created_at: str = Field(default_factory=_now)


# ============== PURCHASE ==============
class CheckoutIn(BaseModel):
    package: Literal["starter", "creator", "studio"]


class Purchase(BaseModel):
    id: str = Field(default_factory=_uuid)
    user_id: str
    stripe_session_id: str
    package: str
    amount_eur: float
    credits: int
    status: Literal["pending", "completed", "refunded", "failed"] = "pending"
    created_at: str = Field(default_factory=_now)


# ============== ADMIN ==============
class AdminCreditAdjustIn(BaseModel):
    user_id: str
    amount: int
    reason: str = "admin adjustment"


class AdminUserPatch(BaseModel):
    banned: Optional[bool] = None
    role: Optional[Literal["user", "admin"]] = None
    nsfw_allowed: Optional[bool] = None
