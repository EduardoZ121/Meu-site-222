/** UI language persistence (localStorage only, default English). */

import {
  LANGUAGE_STORAGE_KEY,
  LANG_ORDER,
} from "../i18n/languages";

export { LANGUAGE_STORAGE_KEY, LANG_ORDER as SUPPORTED_LANGUAGES };

export function getInitialLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && LANG_ORDER.includes(saved)) return saved;
  } catch {
    /* ignore */
  }
  return "en";
}

export function getSavedLanguage() {
  return getInitialLanguage();
}

export function setSavedLanguage(lang) {
  if (!LANG_ORDER.includes(lang)) return;
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
