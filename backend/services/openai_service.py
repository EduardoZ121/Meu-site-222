"""OpenAI service for prompt improvement (gpt-4o-mini)."""
import os
import asyncio
from openai import OpenAI

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", "dummy"))
    return _client


SYSTEM_PROMPT_IMPROVE = (
    "You are an expert at crafting image generation prompts. "
    "Take the user's prompt in any language and transform it into a single concise, "
    "vivid English prompt for AI image generation. Include lighting, composition, "
    "style cues, and quality descriptors. Respond ONLY with the improved English prompt, "
    "no quotes, no explanations."
)


async def improve_prompt(prompt: str) -> str:
    """Improve a user prompt for image generation via gpt-4o-mini."""
    def _run():
        resp = _get_client().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_IMPROVE},
                {"role": "user", "content": prompt},
            ],
            max_tokens=220,
            temperature=0.8,
        )
        return resp.choices[0].message.content.strip()

    try:
        return await asyncio.to_thread(_run)
    except Exception:
        return prompt
