import { useEffect } from "react";

/** Prevent /app studio routes from being indexed (thin/auth-gated SPA pages). */
export default function useAppNoIndex() {
  useEffect(() => {
    let el = document.querySelector('meta[name="robots"]');
    const prev = el?.getAttribute("content") ?? null;
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", "robots");
      document.head.appendChild(el);
    }
    el.setAttribute("content", "noindex, nofollow");
    return () => {
      if (!el) return;
      if (prev) el.setAttribute("content", prev);
      else el.remove();
    };
  }, []);
}
