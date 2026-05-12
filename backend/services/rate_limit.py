"""In-memory sliding-window rate limiter.

Espelha o comportamento do bot.py:
- Imagens: 5 por minuto por user
- Mensagens (texto/wizard/suggest/chat): 30 por minuto por user
- Admins têm bypass total
"""
import time
from collections import defaultdict
from threading import Lock
from fastapi import HTTPException

# Defaults (bot.py): pode ser sobrescrito via SystemConfig no futuro
LIMIT_MESSAGES_PER_MIN = 30
LIMIT_IMAGES_PER_MIN = 5
WINDOW = 60

# Compat: módulo antigo usava DEFAULT_LIMIT_PER_MIN
DEFAULT_LIMIT_PER_MIN = LIMIT_MESSAGES_PER_MIN

_buckets: dict[str, list[float]] = defaultdict(list)
_lock = Lock()


def _key(user_id: str, kind: str) -> str:
    return f"{kind}:{user_id}"


def check(user_id: str, limit_per_min: int = LIMIT_MESSAGES_PER_MIN, kind: str = "msg") -> tuple[bool, int]:
    """Return (allowed, remaining). Caller raises 429 if not allowed."""
    now = time.time()
    cutoff = now - WINDOW
    k = _key(user_id, kind)
    with _lock:
        bucket = [t for t in _buckets.get(k, []) if t > cutoff]
        if len(bucket) >= limit_per_min:
            _buckets[k] = bucket
            return False, 0
        bucket.append(now)
        _buckets[k] = bucket
        return True, max(0, limit_per_min - len(bucket))


def enforce(user_id: str, role: str = "user", limit_per_min: int = LIMIT_MESSAGES_PER_MIN, kind: str = "msg") -> None:
    if role == "admin":
        return
    ok, _ = check(user_id, limit_per_min, kind)
    if not ok:
        raise HTTPException(status_code=429, detail="Too many requests. Wait a moment.")


def enforce_image(user_id: str, role: str = "user") -> None:
    """Rate limit específico para gerações de imagem/vídeo (5/min)."""
    enforce(user_id, role, LIMIT_IMAGES_PER_MIN, kind="img")


def enforce_message(user_id: str, role: str = "user") -> None:
    """Rate limit para mensagens/texto (30/min)."""
    enforce(user_id, role, LIMIT_MESSAGES_PER_MIN, kind="msg")
