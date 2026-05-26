/** UI language persistence (localStorage only). */

export const LANGUAGE_STORAGE_KEY = "remakepix_language";
export const SUPPORTED_LANGUAGES = ["pt", "en", "es", "fr"];

export function getInitialLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
      return saved;
    }
  } catch {
    /* ignore */
  }
  return "en";
}

export function getSavedLanguage() {
  return getInitialLanguage();
}

export function setSavedLanguage(lang) {
  if (!SUPPORTED_LANGUAGES.includes(lang)) return;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  } catch {
    /* ignore */
  }
}

export function setLanguageAndReload(lang) {
  setSavedLanguage(lang);
  window.location.reload();
}
