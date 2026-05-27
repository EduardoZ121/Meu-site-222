/** Shared helpers for the AI prompt enhance toggle (0 credits today; premium-ready). */

export function appendImprovePrompt(fd, enabled) {
  if (enabled) fd.append("improve_prompt", "true");
}

export function appendImproveLang(fd, lang) {
  if (lang) fd.append("lang", String(lang).slice(0, 2));
}
