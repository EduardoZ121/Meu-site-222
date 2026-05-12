"""NSFW handling.
We do a light keyword check; if flagged we either rewrite the prompt via
GPT-4o-mini or route to flux-kontext-max (which is more permissive).
Users with `nsfw_allowed=True` bypass.
"""
import re

# Lightweight English/PT/ES NSFW vocabulary — explicit terms only.
# (We intentionally keep this short and configurable.)
DEFAULT_KEYWORDS = [
    "nude", "naked", "nsfw", "porn", "sex", "sexy", "erotic", "hentai",
    "topless", "boobs", "breasts", "nipples", "penis", "vagina",
    "nudez", "pelado", "pelada", "buceta", "tetas",
]


def detect(prompt: str, extra_keywords: list[str] | None = None) -> str | None:
    """Return the first matched keyword or None."""
    kws = DEFAULT_KEYWORDS + (extra_keywords or [])
    p = prompt.lower()
    for kw in kws:
        kw = kw.lower().strip()
        if not kw:
            continue
        if re.search(rf"\b{re.escape(kw)}\b", p):
            return kw
    return None


def sanitize(prompt: str) -> str:
    """Soften prompt by removing explicit nouns — fallback if no AI rewrite."""
    p = prompt
    for kw in DEFAULT_KEYWORDS:
        p = re.sub(rf"\b{re.escape(kw)}\b", "", p, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", p).strip()
