/** Light / dark theme — default dark. Persists in rp_settings. */

export const THEME_STORAGE_KEY = "rp_theme";
export const THEMES = ["dark", "light"];

export function normalizeTheme(value) {
  return value === "light" ? "light" : "dark";
}

export function readStoredTheme() {
  if (typeof window === "undefined") return "dark";
  try {
    const direct = localStorage.getItem(THEME_STORAGE_KEY);
    if (direct === "light" || direct === "dark") return direct;
    const raw = localStorage.getItem("rp_settings");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.theme === "light" || parsed?.theme === "dark") return parsed.theme;
    }
  } catch {
    /* ignore */
  }
  return "dark";
}

export function applyTheme(theme) {
  const next = normalizeTheme(theme);
  if (typeof document === "undefined") return next;
  const root = document.documentElement;
  root.setAttribute("data-theme", next);
  root.classList.toggle("dark", next === "dark");
  root.classList.toggle("light", next === "light");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", next === "light" ? "#F7F7F8" : "#0B0B0C");
  try {
    window.dispatchEvent(new CustomEvent("rp:theme-change", { detail: { theme: next } }));
  } catch {
    /* ignore */
  }
  return next;
}

export function setTheme(theme) {
  const next = normalizeTheme(theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
    const raw = localStorage.getItem("rp_settings");
    const prev = raw ? JSON.parse(raw) : {};
    localStorage.setItem("rp_settings", JSON.stringify({ ...prev, theme: next }));
  } catch {
    /* ignore */
  }
  return applyTheme(next);
}

export function initTheme() {
  return applyTheme(readStoredTheme());
}

export function getTheme() {
  if (typeof document !== "undefined") {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "light" || attr === "dark") return attr;
  }
  return readStoredTheme();
}
