/**
 * Compatibility layer — app uses react-i18next (see src/i18n/index.js).
 * Existing components keep importing useI18n() from here.
 */
import { useTranslation } from "react-i18next";
import { LANG_LABELS, LANG_ORDER } from "./localeStrings";
import { setLanguageAndReload } from "./remakepixLanguage";

function format(str, vars) {
  if (!vars || typeof str !== "string") return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
}

export function useI18n() {
  const { t: i18nT, i18n } = useTranslation();

  const lang = (i18n.language || "en").split("-")[0];

  const t = (key, vars) => {
    const raw = i18nT(key, { ...vars, defaultValue: "" });
    if (raw) return format(raw, vars);
    const enFallback = i18n.getResource("en", "translation", key);
    if (enFallback) return format(enFallback, vars);
    return key;
  };

  return {
    lang,
    t,
    switchLang: (l) => {
      if (!LANG_ORDER.includes(l)) return;
      setLanguageAndReload(l);
    },
    langs: LANG_ORDER,
    langLabels: LANG_LABELS,
  };
}

/** No-op — i18n is initialized in src/index.js */
export function I18nProvider({ children }) {
  return children;
}
