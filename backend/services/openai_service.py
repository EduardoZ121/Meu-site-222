"""OpenAI service — prompt improvement, suggestions, wizard, poster image gen."""
import os
import asyncio
import json
from typing import List, Dict
from openai import OpenAI

_client: OpenAI | None = None


def _c() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", "dummy"))
    return _client


SYSTEM_IMPROVE = (
    "You are an expert at crafting image generation prompts. "
    "Take the user's prompt in any language and transform it into a single concise, "
    "vivid English prompt for AI image generation. Include lighting, composition, "
    "style cues, and quality descriptors. Respond ONLY with the improved English prompt, "
    "no quotes, no explanations."
)


async def improve_prompt(prompt: str) -> str:
    def _run():
        r = _c().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_IMPROVE},
                {"role": "user", "content": prompt},
            ],
            max_tokens=220, temperature=0.8,
        )
        return r.choices[0].message.content.strip()
    try:
        return await asyncio.to_thread(_run)
    except Exception:
        return prompt


async def rewrite_safe(prompt: str) -> str:
    """Rewrite a borderline prompt to a tasteful, art-direction-safe version."""
    def _run():
        r = _c().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": (
                    "Rewrite the user prompt into a tasteful, art-directed English prompt "
                    "suitable for general image generation. Remove explicit/sexual content. "
                    "Keep the essence and mood. Respond with the rewritten prompt only."
                )},
                {"role": "user", "content": prompt},
            ],
            max_tokens=180, temperature=0.6,
        )
        return r.choices[0].message.content.strip()
    try:
        return await asyncio.to_thread(_run)
    except Exception:
        return prompt


SYSTEM_SUGGEST = (
    "You generate exactly 6 prompt ideas for an AI image generator. "
    "Each prompt is a single English sentence, vivid and specific, "
    "with lighting, composition and style cues. "
    "Respond as a JSON array of 6 strings only."
)


async def suggest_prompts(theme: str, lang: str = "pt") -> List[str]:
    def _run():
        r = _c().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_SUGGEST},
                {"role": "user", "content": f"Theme: {theme}"},
            ],
            max_tokens=520, temperature=0.95,
            response_format={"type": "json_object"},
        )
        content = r.choices[0].message.content.strip()
        # Parse permissively
        try:
            data = json.loads(content)
            if isinstance(data, dict):
                for v in data.values():
                    if isinstance(v, list):
                        return [str(x) for x in v][:6]
            if isinstance(data, list):
                return [str(x) for x in data][:6]
        except Exception:
            pass
        return [line.strip("- ") for line in content.split("\n") if line.strip()][:6]
    try:
        return await asyncio.to_thread(_run)
    except Exception:
        return []


# ===== WIZARD =====
WIZARD_STEPS = [
    {"id": "subject", "prompt": "What's the subject? (a person, a place, an object…)"},
    {"id": "mood",    "prompt": "What's the mood? (cinematic, dreamy, intense, playful…)"},
    {"id": "style",   "prompt": "Any visual style preference? (photo, watercolor, anime, oil paint…)"},
    {"id": "light",   "prompt": "Lighting? (golden hour, dramatic backlight, studio, candlelit…)"},
    {"id": "extras",  "prompt": "Anything else to include? (composition, framing, props, color palette…)"},
]


async def wizard_compose(answers: Dict[str, str]) -> str:
    """Compose a final prompt from 5 wizard answers."""
    def _run():
        r = _c().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": (
                    "You craft a single English image-generation prompt from structured user input. "
                    "Be concise but vivid. Include subject, mood, style, lighting, extras. "
                    "Respond with the prompt only."
                )},
                {"role": "user", "content": json.dumps(answers, ensure_ascii=False)},
            ],
            max_tokens=260, temperature=0.85,
        )
        return r.choices[0].message.content.strip()
    try:
        return await asyncio.to_thread(_run)
    except Exception:
        return ", ".join(v for v in answers.values() if v)


# ===== POSTER (gpt-image-1) =====
async def generate_poster_image(prompt: str, size: str = "1024x1536") -> str:
    """Generate a poster image via OpenAI gpt-image-1. Returns a public URL or data URL."""
    def _run():
        r = _c().images.generate(
            model="gpt-image-1",
            prompt=prompt,
            size=size,
            n=1,
        )
        item = r.data[0]
        if getattr(item, "url", None):
            return item.url
        # b64 fallback
        b64 = getattr(item, "b64_json", None)
        if b64:
            return f"data:image/png;base64,{b64}"
        return ""
    return await asyncio.to_thread(_run)
