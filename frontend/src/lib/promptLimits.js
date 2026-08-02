/**
 * Prompt length policy for studio textareas.
 * No practical UI cap — users can write long briefs.
 * PROMPT_ABUSE_MAX is only a last-resort server/client safety guard.
 */
export const PROMPT_MAX_LENGTH = null;

/** Soft abuse guard (characters). Far above normal prompts. */
export const PROMPT_ABUSE_MAX = 100_000;

/** Apply only the abuse guard when needed (slice / clamp). */
export function clampPrompt(value) {
  const s = String(value ?? "");
  if (s.length <= PROMPT_ABUSE_MAX) return s;
  return s.slice(0, PROMPT_ABUSE_MAX);
}
