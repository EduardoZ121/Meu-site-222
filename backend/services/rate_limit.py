"""In-memory sliding-window rate limiter."""
import time
from collections import defaultdict
from threading import Lock
from fastapi import HTTPException

DEFAULT_LIMIT_PER_MIN = 30  # configurable via system_config
WINDOW = 60

_buckets: dict[str, list[float]] = defaultdict(list)
_lock = Lock()


def check(user_id: str, limit_per_min: int = DEFAULT_LIMIT_PER_MIN) -> tuple[bool, int]:
    """Return (allowed, remaining). Caller raises 429 if not allowed."""
    now = time.time()
    cutoff = now - WINDOW
    with _lock:
        bucket = [t for t in _buckets.get(user_id, []) if t > cutoff]
        if len(bucket) >= limit_per_min:
            _buckets[user_id] = bucket
            return False, 0
        bucket.append(now)
        _buckets[user_id] = bucket
        return True, max(0, limit_per_min - len(bucket))


def enforce(user_id: str, role: str = "user", limit_per_min: int = DEFAULT_LIMIT_PER_MIN) -> None:
    if role == "admin":
        return
    ok, _ = check(user_id, limit_per_min)
    if not ok:
        raise HTTPException(status_code=429, detail="Too many requests. Wait a moment.")
