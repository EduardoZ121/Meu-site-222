/** Deslocamento do header sticky ao fazer scroll ao painel de resultado. */
export const STUDIO_RESULT_SCROLL_OFFSET = 96;

/**
 * Scroll suave até o painel de resultado (estúdio / ferramentas de edição).
 */
export function scrollElementIntoStudioView(element) {
  if (!element || typeof window === "undefined") return;
  const rect = element.getBoundingClientRect();
  const top = rect.top + window.scrollY - STUDIO_RESULT_SCROLL_OFFSET;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}
