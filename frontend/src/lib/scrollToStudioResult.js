/** Deslocamento do header sticky ao fazer scroll ao painel de resultado. */
export const STUDIO_RESULT_SCROLL_OFFSET = 96;

const SCROLL_ROOT_SELECTOR = "[data-studio-scroll-root]";

/**
 * Contentor com scroll das sessões de estúdio (workspace ou hub).
 */
export function findStudioScrollRoot(fromElement) {
  if (typeof document === "undefined") return null;

  let el = fromElement || null;
  while (el) {
    if (el.matches?.(SCROLL_ROOT_SELECTOR)) return el;
    el = el.parentElement;
  }

  const workspace = document.querySelector(".rp-workspace-main");
  if (workspace) return workspace;

  return document.querySelector(SCROLL_ROOT_SELECTOR);
}

function isMostlyVisibleInRoot(element, root) {
  if (!element || !root) return false;
  const elRect = element.getBoundingClientRect();
  const rootRect = root.getBoundingClientRect();
  const visibleTop = Math.max(elRect.top, rootRect.top);
  const visibleBottom = Math.min(elRect.bottom, rootRect.bottom);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);
  return visibleHeight >= elRect.height * 0.45;
}

/**
 * Scroll suave até o painel de resultado (só dentro da sessão atual).
 */
export function scrollElementIntoStudioView(element) {
  if (!element || typeof window === "undefined") return;

  const root = findStudioScrollRoot(element);
  if (root) {
    if (isMostlyVisibleInRoot(element, root)) return;

    const elRect = element.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const top = root.scrollTop + (elRect.top - rootRect.top) - STUDIO_RESULT_SCROLL_OFFSET;
    root.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    return;
  }

  const rect = element.getBoundingClientRect();
  const top = rect.top + window.scrollY - STUDIO_RESULT_SCROLL_OFFSET;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}
