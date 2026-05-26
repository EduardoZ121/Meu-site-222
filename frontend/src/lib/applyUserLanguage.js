import i18n from "../i18n";
import { setSavedLanguage, SUPPORTED_LANGUAGES } from "./remakepixLanguage";

/** Sincroniza idioma da conta (Mongo) com i18n + localStorage. */
export function applyUserLanguage(user) {
  const code = (user?.lang || "en").split("-")[0];
  if (!SUPPORTED_LANGUAGES.includes(code)) return;
  setSavedLanguage(code);
  if (i18n.language !== code) {
    i18n.changeLanguage(code);
  }
  try {
    document.documentElement.lang = code;
  } catch {
    /* ignore */
  }
}

export function getLanguageFromStoredUser() {
  try {
    const raw = localStorage.getItem("rp_user");
    if (!raw) return null;
    const user = JSON.parse(raw);
    const code = (user?.lang || "").split("-")[0];
    return SUPPORTED_LANGUAGES.includes(code) ? code : null;
  } catch {
    return null;
  }
}
